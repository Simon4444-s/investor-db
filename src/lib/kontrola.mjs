// Kontrola záznamu kandidáta od AI agenta (PLAN.md, kap. 5, krok 5).
// Ověřuje schéma, číselníky, časové okno Z2 a hlavně to, že každá citace je doslovně
// v textu zdrojové stránky a hodnota je obsažena v citaci.
import fs from "node:fs";
import { normalizuj } from "./text.mjs";

export const OKNO_OD = "2024-10-11"; // Z2: 24 měsíců před dnem kontroly 2026-10-11 [VOLBA]
export const NEOVERENO = "neověřeno";

export const POLE = ["nazev", "ico", "zeme_sidla", "web", "typ", "cvc", "akcelerator", "verejny", "vlastni_kapital",
  "tym_v_CR", "sektory_deklarovane", "faze", "tiket_deklarovany", "kapital_celkem", "duvod"];
export const STAVY = ["aktivni", "neaktivni", "vyrazen", "mimo_rozsah"];
export const TYPY = ["VC", "PE", "FO", "angel", "velky_soukromy"];
export const FAZE = ["pre-seed", "seed", "A", "B+", "growth", "buyout"];
export const MENY = ["CZK", "EUR", "USD", "GBP", "CHF", "PLN"];
export const DOKLADY = ["rejstrik", "TZ", "media", "portfolio"];

// Kódy sektorů se berou přímo z číselníku, aby existoval jen jeden zdroj pravdy.
export const SEKTORY = [...fs.readFileSync("notes/ciselnik-sektoru.md", "utf8").matchAll(/^\| ([a-z0-9]+) \|/gm)].map((m) => m[1]);

const DATUM = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const RE_TIKET = new RegExp(`^\\d+(\\.\\d+)?(-\\d+(\\.\\d+)?)? (${MENY.join("|")})$`);
const RE_KAPITAL = new RegExp(`^\\d+(\\.\\d+)? (${MENY.join("|")}); druh=(součet fondů|velikost fondu|AUM|committed)$`);

function kontrolaHodnoty(pole, h) {
  if (h === NEOVERENO) return null;
  switch (pole) {
    case "typ": return TYPY.includes(h) ? null : `typ mimo číselník: ${h}`;
    case "cvc": case "akcelerator": case "verejny": case "vlastni_kapital": case "tym_v_CR":
      return ["ano", "ne"].includes(h) ? null : `${pole} musí být ano/ne`;
    case "sektory_deklarovane": {
      const spatne = h.split(";").map((s) => s.trim()).filter((s) => !SEKTORY.includes(s));
      return spatne.length ? `sektory mimo číselník: ${spatne.join(", ")}` : null;
    }
    case "faze": {
      const spatne = h.split(";").map((s) => s.trim()).filter((s) => !FAZE.includes(s));
      return spatne.length ? `fáze mimo číselník: ${spatne.join(", ")}` : null;
    }
    case "tiket_deklarovany": return RE_TIKET.test(h) ? null : `tiket nemá tvar „min-max MĚNA“: ${h}`;
    case "kapital_celkem": return RE_KAPITAL.test(h) ? null : `kapitál nemá tvar „částka MĚNA; druh=…“: ${h}`;
    default: return null;
  }
}

function kontrolaCastky(c, nazev) {
  if (c == null) return null;
  return typeof c.castka === "number" && MENY.includes(c.mena) ? null : `${nazev} musí být {castka: číslo, mena: ${MENY.join("/")}}`;
}

// Ověření citace proti textu stránky. textStranky(url) vrací text nebo null (stránku nelze stáhnout).
async function kontrolaCitace(polozka, textStranky) {
  const problemy = [];
  const text = await textStranky(polozka.url);
  if (text == null) return [`zdroj nelze stáhnout: ${polozka.url}`];
  const citace = normalizuj(polozka.citace || "");
  if (!citace) problemy.push("chybí citace");
  else if (!text.includes(citace)) problemy.push("citace není doslovně v textu stránky");
  if (!polozka.hodnota_v_citaci || !citace.includes(normalizuj(polozka.hodnota_v_citaci))) problemy.push("hodnota_v_citaci není v citaci");
  if (polozka.datum_zdroje !== NEOVERENO) {
    if (!DATUM.test(polozka.datum_zdroje || "")) problemy.push(`datum_zdroje má špatný tvar: ${polozka.datum_zdroje}`);
    if (!polozka.datum_v_textu || !text.includes(normalizuj(polozka.datum_v_textu))) problemy.push("datum_v_textu není v textu stránky");
  }
  return problemy;
}

// Vrátí { chyby: [...] na úrovni záznamu, fakta: [{...fakt, problemy}], investice: [{...inv, problemy}] }.
export async function zkontrolujZaznam(z, textStranky) {
  const chyby = [];
  if (!z.kandidat) chyby.push("chybí kandidat");
  if (!STAVY.includes(z.stav)) chyby.push(`stav mimo číselník: ${z.stav}`);
  if (z.typ != null && !TYPY.includes(z.typ)) chyby.push(`typ mimo číselník: ${z.typ}`);
  if (["vyrazen", "mimo_rozsah"].includes(z.stav) && !z.duvod) chyby.push("vyřazení nebo mimo rozsah bez důvodu");
  if (z.stav === "aktivni" && !(z.investice || []).length) chyby.push("stav aktivni bez dokladu investice");

  const fakta = [];
  for (const f of z.fakta || []) {
    const problemy = [];
    if (!POLE.includes(f.pole)) problemy.push(`neznámé pole: ${f.pole}`);
    const p = kontrolaHodnoty(f.pole, f.hodnota);
    if (p) problemy.push(p);
    problemy.push(...(await kontrolaCitace(f, textStranky)));
    fakta.push({ ...f, problemy });
  }

  const investice = [];
  for (const inv of z.investice || []) {
    const problemy = [];
    if (!inv.cilova_firma) problemy.push("chybí cilova_firma");
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(inv.datum_investice || "")) problemy.push(`datum_investice má špatný tvar: ${inv.datum_investice}`);
    else if (inv.datum_investice < OKNO_OD.slice(0, inv.datum_investice.length)) problemy.push(`investice před oknem Z2 (${OKNO_OD})`);
    if (inv.faze_kola !== NEOVERENO && !FAZE.includes(inv.faze_kola)) problemy.push(`fáze mimo číselník: ${inv.faze_kola}`);
    if (!SEKTORY.includes(inv.sektor)) problemy.push(`sektor mimo číselník: ${inv.sektor}`);
    if (!DOKLADY.includes(inv.typ_dokladu)) problemy.push(`typ_dokladu mimo číselník: ${inv.typ_dokladu}`);
    if (inv.ico_cilove_firmy && !/^\d{8}$/.test(inv.ico_cilove_firmy)) problemy.push("ico_cilove_firmy musí mít 8 číslic");
    for (const [k, v] of [["castka_kola", inv.castka_kola], ["castka_investora", inv.castka_investora]]) {
      const pc = kontrolaCastky(v, k);
      if (pc) problemy.push(pc);
    }
    problemy.push(...(await kontrolaCitace(inv, textStranky)));
    investice.push({ ...inv, problemy });
  }
  return { chyby, fakta, investice };
}
