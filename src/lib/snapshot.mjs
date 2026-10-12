// Stažení zdrojové stránky a uložení snapshotu (PLAN.md, kap. 4).
// Kopie souborů leží v data/raw/snapshoty/ (mimo git), do repozitáře jde
// jen evidence data/raw/snapshoty.csv: url, datum_stazeni, hash, soubor.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { nactiCsv, zapisCsv } from "./csv.mjs";

const ADRESAR = "data/raw/snapshoty";
const EVIDENCE = "data/raw/snapshoty.csv";
const HLAVICKA = ["url", "datum_stazeni", "hash", "soubor"];
const PRODLEVA_MS = 400; // šetrnost ke zdrojovým serverům

export const dnes = () => new Date().toISOString().slice(0, 10);
const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));

// Vrátí obsah stránky (Buffer). Pokud už dnes byla stažena, použije uložený snapshot.
export async function stahni(url) {
  fs.mkdirSync(ADRESAR, { recursive: true });
  const evidence = nactiCsv(EVIDENCE);
  const ulozeny = evidence.find((r) => r.url === url && r.datum_stazeni === dnes());
  if (ulozeny && fs.existsSync(path.join(ADRESAR, ulozeny.soubor))) {
    return fs.readFileSync(path.join(ADRESAR, ulozeny.soubor));
  }

  await cekej(PRODLEVA_MS);
  const odpoved = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (investor-db; vyzkumny projekt)" } });
  if (!odpoved.ok) throw new Error(`HTTP ${odpoved.status} pro ${url}`);
  const data = Buffer.from(await odpoved.arrayBuffer());

  const typ = odpoved.headers.get("content-type") || "";
  const pripona = typ.includes("pdf") ? ".pdf" : typ.includes("json") ? ".json" : typ.includes("zip") ? ".zip" : ".html";
  const soubor = sha256(url).slice(0, 16) + "_" + dnes() + pripona;
  fs.writeFileSync(path.join(ADRESAR, soubor), data);

  const zaznam = { url, datum_stazeni: dnes(), hash: sha256(data), soubor };
  zapisCsv(EVIDENCE, HLAVICKA, [...evidence.filter((r) => r.soubor !== soubor), zaznam]);
  return data;
}
