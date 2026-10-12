// Nástroj pro AI agenty: zkontroluje vlastní výstup před odevzdáním.
// Použití: node src/nastroje/kontrola.mjs data/overeni/kandidati/<soubor>.json
// Závazná je až kontrola skriptem src/02_overeni.mjs nad uloženými snapshoty.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { naText } from "../lib/text.mjs";
import { zkontrolujZaznam } from "../lib/kontrola.mjs";

const cache = path.join(os.tmpdir(), "investor-db-text-cache");
fs.mkdirSync(cache, { recursive: true });
async function textStranky(url) {
  const soubor = path.join(cache, crypto.createHash("sha256").update(url).digest("hex").slice(0, 24));
  try {
    if (!fs.existsSync(soubor)) {
      const o = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (investor-db; vyzkumny projekt)" } });
      if (!o.ok) return null;
      fs.writeFileSync(soubor, Buffer.from(await o.arrayBuffer()));
    }
    return await naText(fs.readFileSync(soubor));
  } catch {
    return null;
  }
}

const soubor = process.argv[2];
const zaznam = JSON.parse(fs.readFileSync(soubor, "utf8"));
const v = await zkontrolujZaznam(zaznam, textStranky);
let n = v.chyby.length;
for (const c of v.chyby) console.log(`ZÁZNAM: ${c}`);
for (const f of v.fakta) if (f.problemy.length) { n++; console.log(`FAKT ${f.pole}: ${f.problemy.join("; ")}`); }
for (const i of v.investice) if (i.problemy.length) { n++; console.log(`INVESTICE ${i.cilova_firma}: ${i.problemy.join("; ")}`); }
console.log(n ? `Problémů: ${n}` : "OK – bez problémů");
