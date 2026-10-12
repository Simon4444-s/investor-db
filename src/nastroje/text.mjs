// Nástroj pro AI agenty: vypíše text stránky tak, jak ho uvidí kontrolní skript.
// Použití:
//   node src/nastroje/text.mjs <url>             celý text
//   node src/nastroje/text.mjs <url> <výraz>     jen výskyty výrazu s okolím (bez ohledu na velikost písmen)
//   node src/nastroje/text.mjs <url> <výraz> --useky   jen souvislé úseky (prvky stránky), které výraz obsahují;
//                                                      citace musí ležet uvnitř jednoho úseku
// Nic nezapisuje do repozitáře; stažené stránky se jen dočasně ukládají do systémového tmp.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { naText, naUseky } from "../lib/text.mjs";

const [url, vyraz, prepinac] = process.argv.slice(2);
if (!url) {
  console.error("Použití: node src/nastroje/text.mjs <url> [výraz]");
  process.exit(1);
}

const cache = path.join(os.tmpdir(), "investor-db-text-cache");
fs.mkdirSync(cache, { recursive: true });
const soubor = path.join(cache, crypto.createHash("sha256").update(url).digest("hex").slice(0, 24));

let data;
if (fs.existsSync(soubor) && Date.now() - fs.statSync(soubor).mtimeMs < 6 * 3600 * 1000) {
  data = fs.readFileSync(soubor);
} else {
  const odpoved = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (investor-db; vyzkumny projekt)" } });
  if (!odpoved.ok) {
    console.error(`HTTP ${odpoved.status} – stránku nelze použít jako zdroj (kontrolní skript ji také nestáhne).`);
    process.exit(2);
  }
  data = Buffer.from(await odpoved.arrayBuffer());
  fs.writeFileSync(soubor, data);
}

const text = await naText(data);
if (prepinac === "--useky") {
  const useky = (await naUseky(data)).filter((u) => u.toLowerCase().includes((vyraz || "").toLowerCase()));
  for (const u of useky.slice(0, 20)) console.log(`--- úsek ---\n${u}`);
  if (!useky.length) console.log(`Výraz „${vyraz}“ není v žádném úseku.`);
} else if (!vyraz) {
  console.log(text);
} else {
  const maly = text.toLowerCase();
  const hledany = vyraz.toLowerCase();
  let i = maly.indexOf(hledany), n = 0;
  if (i < 0) console.log(`Výraz „${vyraz}“ v textu stránky není (délka textu ${text.length} znaků).`);
  while (i >= 0 && n < 15) {
    console.log(`--- výskyt ${++n} ---\n${text.slice(Math.max(0, i - 250), i + hledany.length + 250)}`);
    i = maly.indexOf(hledany, i + hledany.length);
  }
}
