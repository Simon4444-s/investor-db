// Krok 5: opravy dat po ruční kontrole a kontrole AI kontrolorem (2026-10-12).
//   1. vyjmenované opravy jednotlivých záznamů (rozbor citací, chyby nahlášené AI ověřené ve zdroji),
//   2. převod všech citací na viditelný text stránky podle nové verze src/lib/text.mjs
//      (dekódované entity, bez mezer vložených kolem řádkových značek).
// Odstraněné fakty a investice se nemažou, přesunou se do polí „nahrazena_fakta“ a
// „vyrazene_investice“ s důvodem. Záznam o všech změnách: data/overeni/opravy-log.json.
// Skript se smí spustit jen jednou (brání tomu existující log).
import fs from "node:fs";
import { stahni, dnes } from "./lib/snapshot.mjs";
import { naText, normalizuj, dekodujHtml } from "./lib/text.mjs";

const ADRESAR = "data/overeni/kandidati";
const LOG = "data/overeni/opravy-log.json";
if (fs.existsSync(LOG)) {
  console.error(`${LOG} existuje, opravy už byly provedeny.`);
  process.exit(1);
}

const log = [];
const nacti = (f) => JSON.parse(fs.readFileSync(`${ADRESAR}/${f}`, "utf8"));
const uloz = (f, z) => fs.writeFileSync(`${ADRESAR}/${f}`, JSON.stringify(z, null, 2) + "\n");
const zapis = (soubor, polozka, zmena, duvod) => log.push({ soubor, polozka, zmena, duvod, datum: dnes() });

function nahradCitaci(f, pole, nova, duvod) {
  const z = nacti(f);
  const fakt = z.fakta.find((x) => x.pole === pole);
  const puvodni = { url: fakt.url, citace: fakt.citace };
  Object.assign(fakt, nova);
  uloz(f, z);
  zapis(f, `fakt ${pole}`, `citace „${puvodni.citace}“ (${puvodni.url}) → „${fakt.citace}“ (${fakt.url})`, duvod);
}

const fakt = (pole, hodnota, url, citace, hodnota_v_citaci) =>
  ({ pole, hodnota, url, citace, hodnota_v_citaci, datum_zdroje: "neověřeno", datum_v_textu: "" });

// --- 1a. Rozbor ruční kontroly citací: citace z více prvků stránky nebo jen z <title> ---
const VICE_PRVKU = "Rozbor ruční kontroly: citace byla poskládaná z více prvků stránky; nahrazena souvislým úryvkem jednoho prvku.";
nahradCitaci("startup-yard.json", "typ", {
  citace: "Teams that are selected can receive, if they want, a €25,000 cash investment via a convertible note. We also offer follow-on funds to our best performing startups.",
}, `A005. ${VICE_PRVKU}`);
nahradCitaci("tilia-impact-ventures.json", "typ", {
  url: "https://tilia.vc/",
  citace: "Tilia Impact Ventures backs Czech and CEE region founders to make systemic environmental and social change, on a global scale.",
  hodnota_v_citaci: "backs Czech and CEE region founders", datum_zdroje: "neověřeno", datum_v_textu: "",
}, `A008. ${VICE_PRVKU} Původní URL přesměrovává na tilia.vc, proto je uvedena cílová adresa.`);
nahradCitaci("n1.json", "typ", {
  citace: "We invest early and stay for the journey. We bring capital, experience, and access across Europe and the US.",
  hodnota_v_citaci: "We invest early",
}, "A027. Rozbor ruční kontroly: doklad byl jen v <title> stránky; nahrazen viditelným textem.");
nahradCitaci("enterprise-investors.json", "typ", {
  citace: "buyout (MBO & MBI), expansion capital",
}, `A041. ${VICE_PRVKU}`);
nahradCitaci("czech-business-angel-association-cbaa.json", "duvod", {
  citace: "CBAA spojuje andělské investory působící v ČR. Podporujeme investorské prostředí a jsme silným partnerem ve vztahu k institucím.",
}, `A062. ${VICE_PRVKU}`);
const TITULEK = "Stejná vada jako A027 z rozboru: citace pocházela z <title> nebo spojovala více prvků; nahrazena viditelným úryvkem jednoho prvku.";
nahradCitaci("3ts-capital-partners.json", "typ", {
  citace: "With over 25 years and multiple fund generations, we know how to navigate market cycles, lead and co-lead growth rounds, execute cross-border expansion across Europe, the US and Asia, and drive value creation from entry to exit.",
  hodnota_v_citaci: "lead and co-lead growth rounds",
}, TITULEK);
nahradCitaci("3ts-capital-partners.json", "zeme_sidla", { citace: "Salomonkatu 17 A 6d 00100 Helsinki Finland" }, TITULEK);
nahradCitaci("3ts-capital-partners.json", "web", { citace: "Website:www.3tscapital.com" }, TITULEK);
{
  // Ostatní fakty Tilie citují tutéž přesměrovanou adresu.
  const z = nacti("tilia-impact-ventures.json");
  for (const x of [...z.fakta, ...(z.investice || [])].filter((x) => x.url === "https://tiliaimpactventures.cz/en/")) {
    x.url = "https://tilia.vc/";
    zapis("tilia-impact-ventures.json", `${x.pole ? "fakt " + x.pole : "investice " + x.cilova_firma}`, "URL https://tiliaimpactventures.cz/en/ → https://tilia.vc/", "Rozbor ruční kontroly (A008): původní adresa přesměrovává na tilia.vc.");
  }
  uloz("tilia-impact-ventures.json", z);
}

// --- 1b. Chyby nahlášené jen AI kontrolorem, ověřené ve zdroji jako jasné ---
{
  const f = "kb-smartsolutions.json", z = nacti(f);
  const i = z.investice.findIndex((x) => x.cilova_firma.startsWith("Upvest") || x.cilova_firma.startsWith("upvest"));
  const [inv] = z.investice.splice(i, 1);
  z.vyrazene_investice = [...(z.vyrazene_investice || []), { ...inv, duvod_vyrazeni: "B097: citace sama uvádí odkup zbývajících 4 % po držení 96 %; jde o dokončení strategické akvizice korporace, ne o VC investici (PLAN.md, kap. 3)." }];
  zapis(f, `investice ${inv.cilova_firma}`, "investice vyřazena jako doklad Z2", "B097 (AI kontrolor), ověřeno v citaci a v ARES: KB SmartSolutions je společníkem Upvestu od 2020-07-01, podíl postupně až 100 %.");
  if (!z.investice.length) {
    z.stav = "neaktivni"; z.duvod = "V4";
    z.poznamka = `${z.poznamka || ""} [Oprava 2026-10-12: jediný doklad Z2 (Upvest) vyřazen jako strategická akvizice; jiná investice v okně není doložena, proto neaktivní (V4). Typ VC/CVC (A023) zůstává k rozhodnutí.]`.trim();
    zapis(f, "stav", "aktivni → neaktivni (V4)", "Důsledek opravy B097: bez platného dokladu investice v okně. Typ (A023) neměněn, není jasné, zda jde o CVC.");
  }
  uloz(f, z);
}
{
  const f = "cvi.json", z = nacti(f), url = "https://cvi.pl/en/looking-for-financing/how-can-we-help/";
  const stary = z.fakta.find((x) => x.pole === "duvod");
  z.nahrazena_fakta = [...(z.nahrazena_fakta || []), { ...stary, duvod_nahrazeni: "A064: V5 vyžaduje čistě dluhové financování, web CVI uvádí i konvertibilní úvěry a private equity." }];
  z.fakta = z.fakta.filter((x) => x !== stary);
  z.fakta.push(
    fakt("duvod", "PE", url, "In the case of private equity investments, we are looking for minority packages with a strong partner", "private equity investments"),
    fakt("typ", "PE", url, "Instruments offered: senior debt, subordinated / junior debt, unitranche, mezzanine, restructuring instruments, convertible debt and private equity", "convertible debt and private equity"),
  );
  z.stav = "mimo_rozsah"; z.duvod = "PE"; z.typ = "PE";
  uloz(f, z);
  zapis(f, "stav", "vyrazen (V5) → mimo_rozsah (PE)", "A064 (AI kontrolor), ověřeno ve zdroji: CVI nabízí i „convertible debt and private equity“ a drží menšinové podíly, takže V5 neplatí. Sídlo Varšava (fakt zeme_sidla PL).");
}
{
  const f = "limerock-ventures.json", z = nacti(f);
  z.stav = "neaktivni"; z.duvod = "V4";
  const d = z.fakta.find((x) => x.pole === "duvod");
  if (d) d.hodnota = "V4";
  uloz(f, z);
  zapis(f, "stav", "vyrazen (nesplňuje Z2) → neaktivni (V4)", "A070 (AI kontrolor): pro fond bez investice za 24 měsíců předepisuje PLAN.md (V4) stav „neaktivní“; doklad (SFDR: žádné investiční rozhodnutí od 1. 11. 2016) beze změny.");
}

// --- 2. Převod citací na viditelný text stránky (nová verze převodu) ---
// Najde hledaný řetězec v textu bez ohledu na mezery a vrátí odpovídající úsek textu stránky.
function najdiBezMezer(text, hledany) {
  let bez = "", mapa = [];
  for (let i = 0; i < text.length; i++) if (!/\s/.test(text[i])) { bez += text[i]; mapa.push(i); }
  const h = hledany.replace(/\s+/g, "");
  const k = h ? bez.indexOf(h) : -1;
  return k < 0 ? null : text.slice(mapa[k], mapa[k + h.length - 1] + 1);
}

const texty = new Map();
async function textStranky(url) {
  if (!texty.has(url)) {
    try { texty.set(url, await naText(await stahni(url))); } catch { texty.set(url, null); }
  }
  return texty.get(url);
}

const statistika = { celkem: 0, beze_zmeny: 0, prevedeno: 0, nenalezeno: 0, nedostupne: 0 };
for (const f of fs.readdirSync(ADRESAR).filter((x) => x.endsWith(".json"))) {
  const z = nacti(f);
  let zmena = false;
  for (const p of [...(z.fakta || []), ...(z.investice || [])]) {
    statistika.celkem++;
    const text = await textStranky(p.url);
    if (text == null) { statistika.nedostupne++; continue; }
    if (text.includes(normalizuj(p.citace || ""))) { statistika.beze_zmeny++; continue; }
    const nova = najdiBezMezer(text, normalizuj(dekodujHtml(p.citace || "")));
    if (!nova) {
      statistika.nenalezeno++;
      zapis(f, p.pole ? `fakt ${p.pole}` : `investice ${p.cilova_firma}`, "citace v textu stránky není ani po převodu", "Neopraveno: stránka se od 2026-10-11 změnila nebo citace nebyla viditelný text; kontrola ji označí „neověřeno“.");
      continue;
    }
    const puvodni = p.citace;
    p.citace = nova;
    for (const k of ["hodnota_v_citaci"]) {
      if (p[k] && !nova.includes(normalizuj(p[k]))) p[k] = najdiBezMezer(nova, normalizuj(dekodujHtml(p[k]))) || p[k];
    }
    if (p.datum_v_textu && !text.includes(normalizuj(p.datum_v_textu))) p.datum_v_textu = najdiBezMezer(text, normalizuj(dekodujHtml(p.datum_v_textu))) || p.datum_v_textu;
    statistika.prevedeno++;
    zmena = true;
    zapis(f, p.pole ? `fakt ${p.pole}` : `investice ${p.cilova_firma}`, `citace převedena na viditelný text: „${puvodni}“ → „${nova}“`, "Technická oprava po rozboru citací (B087, B099): entity a mezery kolem odkazů.");
  }
  if (zmena) uloz(f, z);
}

fs.writeFileSync(LOG, JSON.stringify({ statistika_prevodu: statistika, zmeny: log }, null, 2) + "\n");
console.log(JSON.stringify(statistika), `| zaznamenaných změn: ${log.length}`);
