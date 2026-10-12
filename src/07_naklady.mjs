// Krok 7 (PLAN.md, kap. 11): skutečná spotřeba tokenů ze záznamů sezení Claude Code.
// Čte JSONL záznamy hlavních sezení i jejich agentů (adresář ~/.claude/projects/<projekt>/),
// sečte usage z odpovědí API (každou zprávu jen jednou podle message.id) a ocení je ceníkem.
// Obsah konverzací nečte ani nevypisuje, jen čísla. Výstup: results/naklady-tokeny.csv.
// Použití: node src/07_naklady.mjs [adresář se záznamy]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { zapisCsv } from "./lib/csv.mjs";

const ADRESAR = process.argv[2] || path.join(os.homedir(), ".claude/projects/-Users-simonstaniek-investor-db");

// Ceník Claude Opus 5.5 v USD za milion tokenů a webové vyhledávání v USD za dotaz.
// Zdroj: https://platform.claude.com/docs/en/about-claude/pricing.md (staženo 2026-10-12).
const CENIK = {
  "claude-opus-5-5": { vstup: 4, zapis5m: 5, zapis1h: 8, cteniCache: 0.2, vystup: 20 },
};
const CENA_VYHLEDAVANI = 10 / 1000;

// Záznam agentů ukládá usage ze začátku streamované odpovědi, takže output_tokens je jen počáteční
// hodnota. Výstup se pak odhaduje z délky vygenerovaného obsahu (text, vstupy nástrojů):
// 3–4 znaky na token [PŘEDPOKLAD] a skryté myšlení 0 až POMER_MYSLENI × viditelný výstup [PŘEDPOKLAD],
// kde poměr se měří na hlavním sezení, které ukládá konečné usage.
const ZNAKU_NA_TOKEN = { min: 4, max: 3 };

function souhrnZaznamu(soubor) {
  const zpravy = new Map();
  let vyhledavani = 0, nacteni = 0, znaky = 0;
  for (const radek of fs.readFileSync(soubor, "utf8").split("\n")) {
    if (!radek.trim()) continue;
    let j;
    try { j = JSON.parse(radek); } catch { continue; }
    if (j.type !== "assistant" || !j.message?.usage) continue;
    const predchozi = zpravy.get(j.message.id);
    // u víceřádkových zpráv si ponecháme usage s nejvyšším output_tokens (konečné, pokud bylo zapsáno)
    if (!predchozi || (j.message.usage.output_tokens || 0) >= (predchozi.usage.output_tokens || 0))
      zpravy.set(j.message.id, { model: j.message.model, usage: j.message.usage });
    for (const c of Array.isArray(j.message.content) ? j.message.content : []) {
      if (c.type === "text") znaky += c.text.length;
      if (c.type === "tool_use") znaky += JSON.stringify(c.input).length;
      if (c.type === "tool_use" && c.name === "WebSearch") vyhledavani++;
      if (c.type === "tool_use" && c.name === "WebFetch") nacteni++;
    }
  }
  const s = { zprav: 0, vstup: 0, zapis5m: 0, zapis1h: 0, cteniCache: 0, vystup: 0, cena: 0, modely: new Set(), vyhledavani, nacteni, znaky, mysleni: 0 };
  for (const { model, usage: u } of zpravy.values()) {
    const zapis1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    const zapis5m = u.cache_creation?.ephemeral_5m_input_tokens ?? Math.max(0, (u.cache_creation_input_tokens || 0) - zapis1h);
    const t = { vstup: u.input_tokens || 0, zapis5m, zapis1h, cteniCache: u.cache_read_input_tokens || 0, vystup: u.output_tokens || 0 };
    for (const k of Object.keys(t)) s[k] += t[k];
    s.mysleni += u.output_tokens_details?.thinking_tokens || 0;
    const c = CENIK[model];
    if (c) s.cena += ["vstup", "zapis5m", "zapis1h", "cteniCache"].reduce((a, k) => a + (t[k] * c[k]) / 1e6, 0);
    else s.modely.add(`${model} (bez ceny)`);
    s.modely.add(model);
    s.zprav++;
  }
  s.cena += vyhledavani * CENA_VYHLEDAVANI;
  return s;
}

// Rozsah výstupních tokenů: konečné usage (hlavní sezení) se bere přímo, jinak odhad z obsahu.
function vystupRozsah(s, pomerMysleni) {
  const viditelnyMin = s.znaky / ZNAKU_NA_TOKEN.min, viditelnyMax = s.znaky / ZNAKU_NA_TOKEN.max;
  if (s.vystup >= viditelnyMin) return { min: s.vystup, max: s.vystup, odhad: "z usage" };
  return { min: Math.round(viditelnyMin), max: Math.round(viditelnyMax * (1 + pomerMysleni)), odhad: "z obsahu" };
}

const radky = [];
for (const sezeni of fs.readdirSync(ADRESAR).filter((f) => f.endsWith(".jsonl"))) {
  const id = sezeni.replace(".jsonl", "");
  radky.push({ sezeni: id, zaznam: "hlavní sezení", popis: "", ...souhrnZaznamu(path.join(ADRESAR, sezeni)) });
  const agenti = path.join(ADRESAR, id, "subagents");
  if (!fs.existsSync(agenti)) continue;
  for (const f of fs.readdirSync(agenti).filter((f) => f.endsWith(".jsonl"))) {
    const meta = path.join(agenti, f.replace(".jsonl", ".meta.json"));
    const popis = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, "utf8")).description : "";
    radky.push({ sezeni: id, zaznam: f.replace(".jsonl", ""), popis, ...souhrnZaznamu(path.join(agenti, f)) });
  }
}

// Poměr myšlení k viditelnému výstupu z hlavních sezení, která ukládají konečné usage.
const finalni = radky.filter((r) => r.vystup >= r.znaky / ZNAKU_NA_TOKEN.min);
const mysleni = finalni.reduce((a, r) => a + r.mysleni, 0), vystupFin = finalni.reduce((a, r) => a + r.vystup, 0);
const POMER_MYSLENI = mysleni / Math.max(1, vystupFin - mysleni);

const vystup = radky.map((r) => {
  const v = vystupRozsah(r, POMER_MYSLENI);
  const cenaVystupu = (n) => (n * CENIK["claude-opus-5-5"].vystup) / 1e6;
  return { ...r, modely: [...r.modely].join(";"), vystup_min: v.min, vystup_max: v.max, odhad_vystupu: v.odhad,
    cena_min_usd: (r.cena + cenaVystupu(v.min)).toFixed(2), cena_max_usd: (r.cena + cenaVystupu(v.max)).toFixed(2) };
});
zapisCsv("results/naklady-tokeny.csv",
  ["sezeni", "zaznam", "popis", "modely", "zprav", "vstup", "zapis5m", "zapis1h", "cteniCache", "vystup_min", "vystup_max", "odhad_vystupu", "vyhledavani", "nacteni", "cena_min_usd", "cena_max_usd"], vystup);
console.log(`Poměr myšlení k viditelnému výstupu (hlavní sezení): ${POMER_MYSLENI.toFixed(2)}`);
for (const r of vystup) console.log(`${r.popis || r.zaznam} | čtení cache ${r.cteniCache} | zápis ${r.zapis5m + r.zapis1h} | výstup ${r.vystup_min}–${r.vystup_max} (${r.odhad_vystupu}) | hledání ${r.vyhledavani} | ${r.cena_min_usd}–${r.cena_max_usd} USD`);
