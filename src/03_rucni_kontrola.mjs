// Krok 3 (PLAN.md, kap. 6): podklady pro ruční kontrolu zmrazeného výstupu.
// Vytvoří results/rucni-kontrola.csv se třemi oddíly:
//   A – všichni kandidáti: stav, důvod a hlavní doklad,
//   B – u každého aktivního VC jedna investice dokládající aktivitu (Z2), nejnovější ověřená,
//   C – náhodný vzorek faktů: 6 polí × 10 faktů, pevný seed.
// Verdikty vyplňuje člověk: správně / špatně / nelze ověřit (+ poznámka, minuty).
// Pokud soubor už obsahuje vyplněné verdikty, skript ho nepřepíše.
import fs from "node:fs";
import { nactiCsv, zapisCsv } from "./lib/csv.mjs";

const VYSTUP = "results/rucni-kontrola.csv";
const SEED = 20261011; // [VOLBA] pevný seed, aby šel výběr zopakovat
const POLE_VZORKU = ["typ", "ico", "sektory_deklarovane", "faze", "tiket_deklarovany", "kapital_celkem"]; // [VOLBA] pole, která AI vykládala
const NA_POLE = 10;

// Subjekty, u nichž podle hlášení agentů (dávky 3, 4, 5, 7, 8) mohl vyčerpaný limit vyhledávání
// způsobit chybějící investice (viz ai-log/krok2-mereni.md). Jdou v oddílech A a B nahoru.
const LIMIT_VYHLEDAVANI = ["Tachles VC", "PurposeTech", "Soulmates Ventures", "Taiwania Capital", "Y Soft Ventures",
  "Startup Yard", "Tilia Impact Ventures", "Springtide Ventures", "Tensor Ventures", "Rockaway Capital"];

// Rozhodnutí uživatele z 2026-10-11, která se týkají ruční kontroly.
const KONTEXT = {
  "Flying Founders": "posoudit podle V9 (rozhodnutí uživatele 2026-10-11)",
  "NEWTON University Angels": "posoudit podle V9 (rozhodnutí uživatele 2026-10-11)",
  "Enern": "pravděpodobná duplicita s Kaya VC (ARES: KAYA (fka Enern) s.r.o.); sloučit po ruční kontrole",
  "Kaya VC": "pravděpodobná duplicita s Enern; sloučit po ruční kontrole",
};

if (fs.existsSync(VYSTUP) && nactiCsv(VYSTUP).some((r) => r.verdikt)) {
  console.error(`${VYSTUP} už obsahuje verdikty, nepřepisuji ho.`);
  process.exit(1);
}

// Generátor pseudonáhodných čísel mulberry32 (deterministický pro daný seed).
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const investori = nactiCsv("results/investori.csv");
const fakta = nactiCsv("results/fakta.csv").filter((f) => f.stav === "ověřeno");
const investice = nactiCsv("results/investice.csv").filter((i) => i.stav === "ověřeno");
const slug = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const jmeno = (inv) => (inv.znacka === inv.kandidat ? inv.kandidat : `${inv.znacka} (kandidát ${inv.kandidat})`);
const limit = (kandidat) => (LIMIT_VYHLEDAVANI.includes(kandidat) ? "ano" : "");
const poradiStavu = (s) => ["aktivní", "neaktivní", "mimo rozsah", "vyřazen", "neověřeno"].findIndex((p) => s.startsWith(p));
const prazdne = { verdikt: "", poznamka: "", minuty: "" };

// Hlavní doklad stavu: u aktivních typ, jinak důvod; náhradou typ, sídlo nebo tým v ČR.
function hlavniDoklad(inv) {
  const poradi = inv.stav === "aktivní" ? ["typ", "duvod", "zeme_sidla"] : ["duvod", "typ", "zeme_sidla", "tym_v_CR"];
  for (const pole of poradi) {
    const f = fakta.find((x) => x.subjekt === inv.kandidat && x.pole === pole);
    if (f) return f;
  }
  return null;
}

const serad = (a, b) => (b.limit_vyhledavani === "ano") - (a.limit_vyhledavani === "ano") || a._klic - b._klic || a.investor.localeCompare(b.investor, "cs");

// Oddíl A – všichni kandidáti
const oddilA = investori.map((inv) => {
  const d = hlavniDoklad(inv);
  return {
    sekce: "A kandidát", investor: jmeno(inv), stav: inv.stav, duvod: inv.duvod,
    pole: d?.pole || "", hodnota: d?.hodnota || "", url: d?.url_zdroje || "neověřeno", citace: d?.citace || "",
    kontext: KONTEXT[inv.kandidat] || "", limit_vyhledavani: limit(inv.kandidat),
    podklady: `data/overeni/kandidati/${slug(inv.kandidat)}.json`, ...prazdne, _klic: poradiStavu(inv.stav),
  };
}).sort(serad);

// Oddíl B – jedna investice na aktivní VC (nejnovější ověřená)
const oddilB = investori.filter((inv) => inv.stav === "aktivní").map((inv) => {
  const i = investice.filter((x) => x.subjekt === inv.kandidat).sort((a, b) => b.datum_investice.localeCompare(a.datum_investice))[0];
  return {
    sekce: "B investice (Z2)", investor: jmeno(inv), stav: inv.stav, duvod: "",
    pole: "investice", hodnota: `${i.cilova_firma}, ${i.datum_investice}`, url: i.url_zdroje, citace: i.citace,
    kontext: [KONTEXT[inv.kandidat], `typ dokladu: ${i.typ_dokladu}`, `ARES: ${i.ares_spolecnik}`].filter(Boolean).join("; "),
    limit_vyhledavani: limit(inv.kandidat), podklady: `data/overeni/kandidati/${slug(inv.kandidat)}.json`, ...prazdne, _klic: 0,
  };
}).sort(serad);

// Oddíl C – stratifikovaný náhodný vzorek faktů
const nahoda = mulberry32(SEED);
const oddilC = POLE_VZORKU.flatMap((pole) => {
  const kandidati = fakta.filter((f) => f.pole === pole).sort((a, b) => (a.subjekt + a.url_zdroje).localeCompare(b.subjekt + b.url_zdroje));
  for (let i = kandidati.length - 1; i > 0; i--) {
    const j = Math.floor(nahoda() * (i + 1));
    [kandidati[i], kandidati[j]] = [kandidati[j], kandidati[i]];
  }
  if (kandidati.length < NA_POLE) throw new Error(`Pole ${pole} má jen ${kandidati.length} ověřených faktů.`);
  return kandidati.slice(0, NA_POLE).map((f) => {
    const inv = investori.find((x) => x.kandidat === f.subjekt);
    return {
      sekce: "C fakt", investor: jmeno(inv), stav: inv.stav, duvod: "", pole: f.pole, hodnota: f.hodnota,
      url: f.url_zdroje, citace: f.citace, kontext: `datum zdroje: ${f.datum_zdroje}`, limit_vyhledavani: limit(f.subjekt),
      podklady: `data/overeni/kandidati/${slug(f.subjekt)}.json`, ...prazdne,
    };
  });
});

const radky = [...oddilA, ...oddilB, ...oddilC].map((r, i) => ({ id: `${r.sekce[0]}${String(i + 1).padStart(3, "0")}`, ...r }));
const HLAVICKA = ["id", "sekce", "investor", "stav", "duvod", "pole", "hodnota", "url", "citace", "kontext", "limit_vyhledavani", "podklady", "verdikt", "poznamka", "minuty"];
zapisCsv(VYSTUP, HLAVICKA, radky);
console.log(`A: ${oddilA.length}, B: ${oddilB.length}, C: ${oddilC.length} (seed ${SEED}) → ${VYSTUP}`);
