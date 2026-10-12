// Krok 2 (PLAN.md, kap. 5 a 11): nezávislé ověření výstupů AI agentů.
//   - stáhne snapshot každé citované stránky a ověří citace (krok 5),
//   - ověří identitu a stav subjektu v ARES (Z4, Z5) a u českých s.r.o. podíl investora (krok 4),
//   - přepočte částky na EUR kurzem ECB k datu zdroje (krok 8),
//   - sestaví výstupy do results/ (kap. 4): investori.csv, investice.csv, fakta.csv, kurzy.csv, overeni-souhrn.md.
// Hodnota, u které kontrola selže, se do výstupu nezapíše a dostane stav „neověřeno“ (CLAUDE.md).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { stahni, dnes } from "./lib/snapshot.mjs";
import { naText, naUseky, normalizuj } from "./lib/text.mjs";
import { nactiCsv, zapisCsv } from "./lib/csv.mjs";
import { zkontrolujZaznam, NEOVERENO } from "./lib/kontrola.mjs";
import { klicVolny, klicPresny, slova } from "./lib/nazvy.mjs";

const ADRESAR = "data/overeni/kandidati";
const ARES = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest";
const ECB_HIST = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip";
const zacatek = Date.now();

// --- Stažení a text stránek (každá URL jen jednou, snapshot se eviduje) ---
const texty = new Map();
async function textStranky(url) {
  if (!texty.has(url)) {
    try {
      texty.set(url, await naText(await stahni(url)));
    } catch (e) {
      console.warn(`Nelze stáhnout: ${url} (${e.message})`);
      texty.set(url, null);
    }
  }
  return texty.get(url);
}
// Úseky stránky (blokové prvky) pro příznak, zda citace leží uvnitř jednoho prvku.
const useky = new Map();
async function usekyStranky(url) {
  if (!useky.has(url)) {
    try { useky.set(url, await naUseky(await stahni(url))); } catch { useky.set(url, null); }
  }
  return useky.get(url);
}
async function jedenPrvek(p) {
  const u = await usekyStranky(p.url);
  const c = normalizuj(p.citace || "");
  return u == null || !c ? "" : u.some((x) => x.includes(c)) ? "ano" : "ne";
}

async function json(url) {
  try { return JSON.parse((await stahni(url)).toString("utf8")); } catch { return null; }
}

// --- ARES: identita a stav (Z4, Z5) ---
async function aresSubjekt(ico) {
  const zaklad = await json(`${ARES}/ekonomicke-subjekty/${ico}`);
  if (!zaklad?.ico) return null;
  const vr = await json(`${ARES}/ekonomicke-subjekty-vr/${ico}`);
  const zaznamVr = vr?.zaznamy?.find((z) => z.primarniZaznam) || vr?.zaznamy?.[0];
  const likvidace = /v likvidaci/i.test(zaklad.obchodniJmeno);
  return {
    url: `${ARES}/ekonomicke-subjekty/${ico}`,
    obchodniJmeno: zaklad.obchodniJmeno,
    sidlo: zaklad.sidlo?.textovaAdresa || "",
    zeme: zaklad.sidlo?.kodStatu || "",
    datumAktualizace: zaklad.datumAktualizace || NEOVERENO,
    datumZaniku: zaklad.datumZaniku || "",
    stavVr: zaznamVr?.stavSubjektu || "",
    z5: !zaklad.datumZaniku && !likvidace && (!zaznamVr || zaznamVr.stavSubjektu === "AKTIVNI"),
  };
}

// Je investor mezi společníky cílové firmy? Čtou se jen právnické osoby (PLAN.md, kap. 9).
async function aresSpolecnik(icoCile, icaInvestora, znacka) {
  const vr = await json(`${ARES}/ekonomicke-subjekty-vr/${icoCile}`);
  if (!vr?.zaznamy) return "nelze (záznam ve veřejném rejstříku nenalezen)";
  // Značka bez obecných slov musí odpovídat celým po sobě jdoucím slovům názvu společníka
  // (např. „Czech Founders VC“ → „czechfounders“ odpovídá „Czech Founders Ventures s.r.o.“).
  const klic = klicVolny(znacka);
  const odpovidaZnacce = (jmeno) => {
    const w = slova(jmeno);
    for (let i = 0; i < w.length; i++) {
      let s = "";
      for (let j = i; j < w.length && s.length < klic.length; j++) {
        s += w[j];
        if (s === klic || (j === i && s.startsWith(klic))) return true;
      }
    }
    return false;
  };
  for (const z of vr.zaznamy)
    for (const organ of z.spolecnici || [])
      for (const s of organ.spolecnik || []) {
        const po = s.osoba?.pravnickaOsoba;
        if (!po) continue;
        if (icaInvestora.includes(po.ico) || (klic.length >= 3 && odpovidaZnacce(po.obchodniJmeno || ""))) {
          return `ano: ${po.obchodniJmeno}${po.ico ? ` (IČO ${po.ico})` : ""}, zapsán ${s.datumZapisu || "?"}${s.datumVymazu ? `, vymazán ${s.datumVymazu}` : ""}`;
        }
      }
  return "ne";
}

// --- Kurzy ECB (krok 8) ---
let kurzyEcb = null;
const pouziteKurzy = new Map();
async function nactiKurzy() {
  const zip = await stahni(ECB_HIST);
  const tmp = path.join(os.tmpdir(), "eurofxref-hist.zip");
  fs.writeFileSync(tmp, zip);
  const csv = execFileSync("unzip", ["-p", tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const [hlavicka, ...radky] = csv.trim().split("\n").map((r) => r.split(","));
  kurzyEcb = radky.map((r) => ({ datum: r[0], kurzy: Object.fromEntries(hlavicka.map((h, i) => [h.trim(), Number(r[i])])) }))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}
// Datum zdroje „YYYY-MM“ nebo „YYYY“ se bere jako první den období; použije se poslední kurz k tomu dni [VOLBA].
function kurz(mena, datum) {
  if (mena === "EUR") return { kurz: 1, datum_kurzu: datum };
  const den = /^\d{4}$/.test(datum) ? `${datum}-01-01` : /^\d{4}-\d{2}$/.test(datum) ? `${datum}-01` : datum;
  const radek = [...kurzyEcb].reverse().find((r) => r.datum <= den && r.kurzy[mena] > 0);
  if (!radek) return null;
  pouziteKurzy.set(`${mena}|${radek.datum}`, { mena, datum_kurzu: radek.datum, kurz_vuci_eur: radek.kurzy[mena], url_zdroje: ECB_HIST });
  return { kurz: radek.kurzy[mena], datum_kurzu: radek.datum };
}
function naEur(castka, mena, datum) {
  const datumKurzu = datum === NEOVERENO ? dnes() : datum; // bez data zdroje: kurz ke dni kontroly, vyznačí se v poznámce
  const k = kurz(mena, datumKurzu);
  return k ? { eur: Math.round(castka / k.kurz), ...k, poznamka: datum === NEOVERENO ? "datum zdroje neověřeno, kurz ke dni kontroly" : "" } : null;
}
const parsujTiket = (h) => { const m = h.match(/^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))? ([A-Z]{3})$/); return m ? { min: +m[1], max: +(m[2] ?? m[1]), mena: m[3] } : null; };
const parsujKapital = (h) => { const m = h.match(/^(\d+(?:\.\d+)?) ([A-Z]{3}); druh=(.+)$/); return m ? { castka: +m[1], mena: m[2], druh: m[3] } : null; };

// --- Běh ---
await nactiKurzy();
const kandidati = nactiCsv("data/kandidati.csv");
const soubory = fs.readdirSync(ADRESAR).filter((f) => f.endsWith(".json"));
const zaznamy = soubory.flatMap((f) => {
  try { return [{ soubor: f, ...JSON.parse(fs.readFileSync(path.join(ADRESAR, f), "utf8")) }]; }
  catch (e) { console.warn(`Nelze načíst ${f}: ${e.message}`); return []; }
});
const chybi = kandidati.filter((k) => !zaznamy.some((z) => z.kandidat === k.nazev)).map((k) => k.nazev);
// Záznamy kandidátů, kteří byli po rozhodnutí o duplicitě sloučeni s jiným (např. Nation1 → N1), se nepoužijí,
// aby se jejich investice nezapočítaly dvakrát.
const nepouzite = zaznamy.filter((z) => !kandidati.some((k) => k.nazev === z.kandidat)).map((z) => z.kandidat);
// Investice sloučeného kandidáta převezme cílový záznam (bez duplicit podle názvu cílové firmy).
const slouceni = [];
for (const jmeno of nepouzite) {
  const zdroj = zaznamy.find((z) => z.kandidat === jmeno);
  const radek = nactiCsv("data/kandidati_rozhodnuti.csv").find((r) => r.rozhodnuti === "stejny" && (r.nazev_a === jmeno || r.nazev_b === jmeno));
  const cil = radek && zaznamy.find((z) => z.kandidat === (radek.nazev_a === jmeno ? radek.nazev_b : radek.nazev_a));
  if (!cil) { console.warn(`Sloučený kandidát ${jmeno} nemá cílový záznam.`); continue; }
  const nove = (zdroj.investice || []).filter((i) => !(cil.investice || []).some((x) => klicPresny(x.cilova_firma) === klicPresny(i.cilova_firma)));
  cil.investice = [...(cil.investice || []), ...nove.map((i) => ({ ...i, prevzato_z: jmeno }))];
  slouceni.push(`${jmeno} → ${cil.kandidat} (převzato investic: ${nove.length})`);
}
for (let i = zaznamy.length - 1; i >= 0; i--) if (nepouzite.includes(zaznamy[i].kandidat)) zaznamy.splice(i, 1);

const vystupInvestori = [], vystupFakta = [], vystupInvestice = [];
const statistika = { fakta: 0, faktaOk: 0, investice: 0, investiceOk: 0 };

for (const z of zaznamy) {
  const v = await zkontrolujZaznam(z, textStranky);
  const ok = (f) => f && f.problemy.length === 0 && f.hodnota !== NEOVERENO;
  const fakt = (pole) => v.fakta.find((f) => f.pole === pole && ok(f));
  const hodnota = (pole) => fakt(pole)?.hodnota ?? NEOVERENO;

  for (const f of v.fakta) {
    statistika.fakta++; if (ok(f)) statistika.faktaOk++;
    vystupFakta.push({
      subjekt: z.kandidat, pole: f.pole, hodnota: ok(f) ? f.hodnota : "", stav: ok(f) ? "ověřeno" : NEOVERENO,
      problem: f.problemy.join("; "), url_zdroje: f.url, datum_zdroje: f.datum_zdroje, datum_overeni: dnes(), citace: f.citace,
      citace_jeden_prvek: await jedenPrvek(f),
    });
  }

  // Identita a stav v ARES (jen české IČO, které prošlo kontrolou citace).
  const ico = hodnota("ico");
  const ares = /^\d{8}$/.test(ico) ? await aresSubjekt(ico) : null;
  if (ares) {
    vystupFakta.push({ subjekt: z.kandidat, pole: "ares_obchodni_jmeno", hodnota: ares.obchodniJmeno, stav: "ověřeno", problem: "",
      url_zdroje: ares.url, datum_zdroje: ares.datumAktualizace, datum_overeni: dnes(), citace: `"obchodniJmeno":"${ares.obchodniJmeno}"` });
    vystupFakta.push({ subjekt: z.kandidat, pole: "ares_stav", hodnota: ares.z5 ? "aktivní" : `zaniklý nebo v likvidaci (${ares.datumZaniku || ares.stavVr})`, stav: "ověřeno", problem: "",
      url_zdroje: ares.url, datum_zdroje: ares.datumAktualizace, datum_overeni: dnes(), citace: ares.datumZaniku ? `"datumZaniku":"${ares.datumZaniku}"` : `"stavSubjektu":"${ares.stavVr || "?"}"` });
  }

  // Investice: kontrola citace, podíl v ARES, přepočet částek.
  const overeneInvestice = [];
  for (const inv of v.investice) {
    statistika.investice++;
    const platna = inv.problemy.length === 0;
    if (platna) { statistika.investiceOk++; overeneInvestice.push(inv); }
    const spolecnik = inv.ico_cilove_firmy ? await aresSpolecnik(inv.ico_cilove_firmy, /^\d{8}$/.test(ico) ? [ico] : [], z.znacka || z.kandidat) : "nelze (bez IČO cílové firmy)";
    const kolo = platna && inv.castka_kola ? naEur(inv.castka_kola.castka, inv.castka_kola.mena, inv.datum_zdroje) : null;
    const investor = platna && inv.castka_investora ? naEur(inv.castka_investora.castka, inv.castka_investora.mena, inv.datum_zdroje) : null;
    inv.castka_investora_eur = investor?.eur;
    vystupInvestice.push({
      subjekt: z.kandidat, cilova_firma: inv.cilova_firma, ico_cilove_firmy: inv.ico_cilove_firmy || "", datum_investice: inv.datum_investice,
      faze_kola: inv.faze_kola, castka_kola: inv.castka_kola ? `${inv.castka_kola.castka} ${inv.castka_kola.mena}` : "", castka_kola_eur: kolo?.eur ?? "",
      castka_investora: inv.castka_investora ? `${inv.castka_investora.castka} ${inv.castka_investora.mena}` : "", castka_investora_eur: investor?.eur ?? "",
      kurz_poznamka: kolo?.poznamka || investor?.poznamka || "", role: inv.role, typ_dokladu: inv.typ_dokladu, sektor: inv.sektor, ares_spolecnik: spolecnik,
      stav: platna ? "ověřeno" : NEOVERENO, problem: inv.problemy.join("; "), url_zdroje: inv.url, datum_zdroje: inv.datum_zdroje, citace: inv.citace,
      citace_jeden_prvek: await jedenPrvek(inv), prevzato_z: inv.prevzato_z || "",
    });
  }

  // Výsledný stav: aktivní jen s aspoň jednou ověřenou investicí (Z2) a bez zániku v ARES (Z5).
  let stav;
  // Vyřazení a „mimo rozsah“ musí mít aspoň jeden ověřený doklad (důvod, typ, sídlo nebo tým v ČR).
  const dolozeno = ["duvod", "typ", "zeme_sidla", "tym_v_CR"].some((p) => fakt(p));
  if (z.stav === "vyrazen") stav = `vyřazen (${z.duvod})${dolozeno ? "" : " – doklad neověřen"}`;
  else if (z.stav === "mimo_rozsah") stav = `mimo rozsah vzorku (${z.duvod})${dolozeno ? "" : " – doklad neověřen"}`;
  else if (ares && !ares.z5) stav = "vyřazen (nesplňuje Z5)";
  else if (z.stav === "neaktivni") stav = "neaktivní (V4)";
  else if (!overeneInvestice.length) stav = `${NEOVERENO} (Z2 nedoloženo)`;
  else if (ico === NEOVERENO) stav = `${NEOVERENO} (Z4 nedoloženo)`;
  else stav = "aktivní";

  const tiket = parsujTiket(hodnota("tiket_deklarovany"));
  const tiketEur = tiket ? [naEur(tiket.min, tiket.mena, fakt("tiket_deklarovany").datum_zdroje), naEur(tiket.max, tiket.mena, fakt("tiket_deklarovany").datum_zdroje)] : null;
  const kapital = parsujKapital(hodnota("kapital_celkem"));
  const kapitalEur = kapital ? naEur(kapital.castka, kapital.mena, fakt("kapital_celkem").datum_zdroje) : null;
  const castkyInvestora = overeneInvestice.map((i) => i.castka_investora_eur).filter((x) => x != null);
  const datumy = overeneInvestice.map((i) => i.datum_investice).sort();
  const priznaky = ["cvc", "akcelerator", "verejny", "vlastni_kapital"].filter((p) => hodnota(p) === "ano");

  vystupInvestori.push({
    nazev: hodnota("nazev"), znacka: z.znacka || z.kandidat, kandidat: z.kandidat, typ: hodnota("typ") !== NEOVERENO ? hodnota("typ") : (z.typ || NEOVERENO),
    priznaky: priznaky.join(";"), zeme_sidla: hodnota("zeme_sidla"), ico, web: hodnota("web"), tym_v_CR: hodnota("tym_v_CR"),
    sektory_deklarovane: hodnota("sektory_deklarovane"),
    sektory_portfolio: [...new Set(overeneInvestice.map((i) => i.sektor))].join(";") || NEOVERENO,
    faze: hodnota("faze"),
    tiket_deklarovany: hodnota("tiket_deklarovany"),
    tiket_deklarovany_eur: tiketEur?.[0] && tiketEur?.[1] ? `${tiketEur[0].eur}-${tiketEur[1].eur}` : NEOVERENO,
    tiket_z_investic_eur: castkyInvestora.length ? `${Math.min(...castkyInvestora)}-${Math.max(...castkyInvestora)}` : NEOVERENO,
    kapital_celkem: hodnota("kapital_celkem"), kapital_celkem_eur: kapitalEur ? String(kapitalEur.eur) : NEOVERENO,
    kurz_poznamka: [tiketEur?.[0]?.poznamka && "tiket: datum zdroje neověřeno, kurz ke dni kontroly", kapitalEur?.poznamka && "kapitál: datum zdroje neověřeno, kurz ke dni kontroly"].filter(Boolean).join("; "),
    pocet_investic_24m: overeneInvestice.length, posledni_investice: datumy.at(-1) || NEOVERENO,
    ares_stav: ares ? (ares.z5 ? "aktivní" : "zaniklý/likvidace") : NEOVERENO,
    stav, stav_podle_agenta: z.stav, duvod: z.duvod || "", poznamka_agenta: z.poznamka || "", datum_kontroly: dnes(),
    chyby_zaznamu: v.chyby.join("; "),
  });
}

vystupInvestori.sort((a, b) => a.znacka.localeCompare(b.znacka, "cs"));
fs.mkdirSync("results", { recursive: true });
zapisCsv("results/investori.csv", Object.keys(vystupInvestori[0]), vystupInvestori);
zapisCsv("results/fakta.csv", Object.keys(vystupFakta[0]), vystupFakta);
zapisCsv("results/investice.csv", Object.keys(vystupInvestice[0] || { subjekt: "" }), vystupInvestice);
zapisCsv("results/kurzy.csv", ["mena", "datum_kurzu", "kurz_vuci_eur", "url_zdroje"], [...pouziteKurzy.values()]);

// Souhrn
const pocty = (pole) => Object.entries(vystupInvestori.reduce((a, r) => ((a[r[pole]] = (a[r[pole]] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
const proc = (a, b) => (b ? `${((100 * a) / b).toFixed(1)} %` : "–");
const souhrn = `# Souhrn ověření (krok 2)

Vygenerováno skriptem \`src/02_overeni.mjs\` ${new Date().toISOString()}. Den kontroly ${dnes()}.

- Kandidátů v \`data/kandidati.csv\`: ${kandidati.length}; záznamů od agentů: ${zaznamy.length}${chybi.length ? `; chybí: ${chybi.join(", ")}` : ""}${nepouzite.length ? `; nepoužito (sloučeno s jiným kandidátem): ${nepouzite.join(", ")}` : ""}
- Stažených zdrojových stránek (snapshotů): ${texty.size}, z toho nedostupných: ${[...texty.values()].filter((t) => t == null).length}
- Fakta: ${statistika.fakta}, prošlo kontrolou ${statistika.faktaOk} (${proc(statistika.faktaOk, statistika.fakta)}); zamítnuto ${statistika.fakta - statistika.faktaOk} (${proc(statistika.fakta - statistika.faktaOk, statistika.fakta)})
- Investice: ${statistika.investice}, prošlo kontrolou ${statistika.investiceOk} (${proc(statistika.investiceOk, statistika.investice)})
- Investice s IČO cílové firmy ověřené v ARES jako podíl investora: ${vystupInvestice.filter((i) => i.ares_spolecnik.startsWith("ano")).length}
- Citace, které neleží uvnitř jednoho prvku stránky (ověřená fakta a investice): ${[...vystupFakta, ...vystupInvestice].filter((x) => x.stav === "ověřeno" && x.citace_jeden_prvek === "ne").length} z ${[...vystupFakta, ...vystupInvestice].filter((x) => x.stav === "ověřeno" && x.citace_jeden_prvek).length}
- Sloučení kandidátů: ${slouceni.join("; ") || "žádné"}
- Doba běhu skriptu: ${Math.round((Date.now() - zacatek) / 1000)} s

## Stav záznamů

| Stav | Počet |
|------|-------|
${pocty("stav").map(([k, n]) => `| ${k} | ${n} |`).join("\n")}

## Typ (všechny záznamy)

| Typ | Počet |
|-----|-------|
${pocty("typ").map(([k, n]) => `| ${k} | ${n} |`).join("\n")}
`;
fs.writeFileSync("results/overeni-souhrn.md", souhrn);
console.log(souhrn);
