// Krok 1 (PLAN.md, kap. 5 a 11): seznam kandidátů ze zdrojů K1–K4 a deduplikace.
// K5 (CEE Funding Map) se nepoužívá, je to referenční seznam pro měření pokrytí.
//
// Výstupy:
//   data/kandidati.csv                  nazev, web, zdroj, url_zdroje, datum_stazeni
//   data/kandidati_mozne_duplicity.csv  nejisté shody k rozhodnutí člověkem
// Rozhodnutí člověka se zapisují do data/kandidati_rozhodnuti.csv
// (nazev_a, nazev_b, rozhodnuti = stejny | ruzny) a skript je při dalším běhu použije.
import { stahni, dnes } from "./lib/snapshot.mjs";
import { polozkyPdf } from "./lib/pdf.mjs";
import { nactiCsv, zapisCsv } from "./lib/csv.mjs";
import { dekodujHtml } from "./lib/text.mjs";
import { klicPresny, klicVolny } from "./lib/nazvy.mjs";

const URL_K1 = "https://czechstartups.gov.cz/startup-ekosystem/investori/";
const URL_K2 = "https://cvca.cz/clenstvi/radni-clenove/";
const URL_K3 = "https://www.eif.org/files/attachments/czechia-equity-fundmanagers.pdf";
const URL_K4 = "https://ris3.gov.cz/sites/default/files/2025-09/01_Analyza%20startupoveho%20ekosystemu%20v%20Cesku.pdf";
const NEOVERENO = "neověřeno";


// K1: CzechInvest – Investoři. Název z karty, web z tlačítka na detailu investora.
async function nactiK1() {
  const html = (await stahni(URL_K1)).toString("utf8");
  const karty = new Map();
  for (const m of html.matchAll(/<a href="(https:\/\/czechstartups\.gov\.cz\/\?investori=[^"]+)" title="([^"]+)"/g)) {
    karty.set(m[1], dekodujHtml(m[2]));
  }
  const vysledek = [];
  for (const [detail, nazev] of karty) {
    const stranka = (await stahni(detail)).toString("utf8");
    const web = stranka.match(/<a class="investori-button" href="([^"]+)"/);
    vysledek.push({ nazev, web: web ? web[1] : NEOVERENO, zdroj: "K1", url_zdroje: detail });
  }
  return vysledek;
}

// K2: CVCA – řádní členové. Název z karty, web = první externí odkaz v textu detailu.
// Kontaktní osoby a e-maily z detailu se neukládají (PLAN.md, kap. 9).
async function nactiK2() {
  const html = (await stahni(URL_K2)).toString("utf8");
  const vysledek = [];
  for (const m of html.matchAll(/<h2 class="entry-title">\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)) {
    const [, detail, nazev] = m;
    const stranka = (await stahni(detail)).toString("utf8");
    const obsah = stranka.slice(stranka.indexOf('class="entry-content"'));
    const web = [...obsah.matchAll(/<a href="(https?:\/\/[^"]+)"/g)]
      .map((x) => x[1])
      .find((u) => !u.includes("cvca.cz"));
    vysledek.push({ nazev: dekodujHtml(nazev), web: web || NEOVERENO, zdroj: "K2", url_zdroje: detail });
  }
  return vysledek;
}

// K3: EIF – equity fund partners. Kandidátem je správce fondu (sloupec Fund manager),
// řádky tabulky se poznají podle buňky ve sloupci Team location.
async function nactiK3() {
  const [polozky] = await polozkyPdf(await stahni(URL_K3));
  const sloupec = (nazev) => polozky.find((p) => p.text === nazev);
  const hlavicka = { spravce: sloupec("Fund manager"), tym: sloupec("Team location"), web: sloupec("Fund Manager website") };
  if (!hlavicka.spravce || !hlavicka.tym || !hlavicka.web) throw new Error("K3: nenalezena hlavička tabulky");
  const vBunce = (sl, y) => polozky.find((p) => Math.abs(p.x - sl.x) < 3 && Math.abs(p.y - y) < 1);
  return polozky
    .filter((p) => Math.abs(p.x - hlavicka.tym.x) < 3 && p.y < hlavicka.tym.y - 1)
    .map((radek) => ({
      nazev: vBunce(hlavicka.spravce, radek.y).text,
      web: vBunce(hlavicka.web, radek.y)?.text || NEOVERENO,
      zdroj: "K3",
      url_zdroje: URL_K3,
    }));
}

// K4: Analýza startupového ekosystému, Obr. 17 – popisky v levém sloupci grafu.
// Fyzické osoby a souhrnnou položku do kandidátů nedáváme (PLAN.md, kap. 9);
// vypíší se jen do terminálu ke kontrole, do souborů v repozitáři se neukládají.
const FIREMNI_SLOVA = /\b(ventures?|capital|vc|angels?|invest\w*|partners|fund|yard|cube|group|equity)\b/i;
async function nactiK4() {
  const stranky = await polozkyPdf(await stahni(URL_K4));
  const stranka = stranky.find((s) => {
    const text = s.map((p) => p.text).join(" ");
    return text.includes("Obrázek 17: Přehled aktivních") && !text.includes("....");
  });
  if (!stranka) throw new Error("K4: nenalezena stránka s Obr. 17");
  const osa = stranka.find((p) => p.text === "Počet startupů");
  const popisky = stranka
    .filter((p) => p.x < 110 && p.y > osa.y && !/^[\d\s]+$/.test(p.text) && !p.text.startsWith("Obrázek"))
    .sort((a, b) => b.y - a.y)
    .map((p) => p.text);

  const vyrazeno = [];
  const vysledek = [];
  for (const nazev of popisky) {
    if (/^angel investors$/i.test(nazev)) vyrazeno.push(`${nazev} (souhrnná položka)`);
    else if (/^\p{Lu}\p{Ll}+ \p{Lu}\p{Ll}+$/u.test(nazev) && !FIREMNI_SLOVA.test(nazev)) vyrazeno.push(`${nazev} (fyzická osoba)`);
    else vysledek.push({ nazev, web: NEOVERENO, zdroj: "K4", url_zdroje: URL_K4 });
  }
  return { vysledek, popisku: popisky.length, vyrazeno };
}

// --- Deduplikace (PLAN.md, kap. 5, krok 2) ---
const SOCIALNI_SITE = /(^|\.)(linkedin\.com|facebook\.com|twitter\.com|x\.com|instagram\.com|czechstartups\.gov\.cz|cvca\.cz)$/;

function domena(web) {
  try {
    const host = new URL(web).hostname.toLowerCase().replace(/^www\./, "");
    return SOCIALNI_SITE.test(host) ? null : host;
  } catch {
    return null;
  }
}

// Web převzatý ze zdroje: HTML entity, adresa bez protokolu, sledovací parametry utm_*.
function cistyWeb(web) {
  if (web === NEOVERENO) return web;
  try {
    const u = new URL(dekodujHtml(web).replace(/^\/\//, "https://"));
    for (const k of [...u.searchParams.keys()]) if (k.startsWith("utm_")) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return NEOVERENO;
  }
}

// Zobrazovaný název skupiny podle pořadí zdrojů K1 > K4 > K2 > K3
// (K1 a K4 uvádějí obchodní značky, K2 a K3 často právní názvy).
const PORADI = { K1: 0, K4: 1, K2: 2, K3: 3 };
const podlePoradi = (sk) => [...sk].sort((a, b) => PORADI[a.zdroj] - PORADI[b.zdroj]);
const unikatni = (pole) => [...new Set(pole)];

function deduplikuj(zaznamy, rozhodnuti) {
  const rodic = zaznamy.map((_, i) => i);
  const koren = (i) => (rodic[i] === i ? i : (rodic[i] = koren(rodic[i])));
  const spoj = (a, b) => { rodic[koren(a)] = koren(b); };
  const skupiny = () => {
    const m = new Map();
    zaznamy.forEach((z, i) => m.set(koren(i), [...(m.get(koren(i)) || []), z]));
    return m;
  };
  const nazevSkupiny = (i) => podlePoradi(skupiny().get(koren(i)))[0].nazev;

  // Jisté shody: stejný název po odstranění právní formy, nebo stejná doména i název bez obecných slov.
  for (let i = 0; i < zaznamy.length; i++)
    for (let j = i + 1; j < zaznamy.length; j++) {
      const [a, b] = [zaznamy[i], zaznamy[j]];
      const stejnaDomena = domena(a.web) && domena(a.web) === domena(b.web);
      if (klicPresny(a.nazev) === klicPresny(b.nazev) ||
          (stejnaDomena && klicVolny(a.nazev) === klicVolny(b.nazev))) spoj(i, j);
    }

  // Rozhodnutí člověka se vztahují k zobrazovaným názvům skupin.
  const rozhodnutiPar = (a, b) =>
    rozhodnuti.find((r) => (r.nazev_a === a && r.nazev_b === b) || (r.nazev_a === b && r.nazev_b === a))?.rozhodnuti;
  for (const r of rozhodnuti.filter((r) => r.rozhodnuti === "stejny")) {
    const i = zaznamy.findIndex((_, k) => nazevSkupiny(k) === r.nazev_a);
    const j = zaznamy.findIndex((_, k) => nazevSkupiny(k) === r.nazev_b);
    if (i < 0 || j < 0) console.warn(`Rozhodnutí nelze použít, název nenalezen: ${r.nazev_a} / ${r.nazev_b}`);
    else spoj(i, j);
  }

  // Nejisté shody mezi skupinami: stejný název bez obecných slov, nebo stejná doména. Rozhodne člověk.
  const nejiste = new Map();
  for (let i = 0; i < zaznamy.length; i++)
    for (let j = i + 1; j < zaznamy.length; j++) {
      const [a, b] = [zaznamy[i], zaznamy[j]];
      const [na, nb] = [nazevSkupiny(i), nazevSkupiny(j)];
      if (koren(i) === koren(j) || rozhodnutiPar(na, nb)) continue;
      const duvody = [];
      if (klicVolny(a.nazev) && klicVolny(a.nazev) === klicVolny(b.nazev)) duvody.push("stejný název bez obecných slov");
      if (domena(a.web) && domena(a.web) === domena(b.web)) duvody.push(`stejná doména ${domena(a.web)}`);
      const klic = [koren(i), koren(j)].sort().join("|");
      if (duvody.length && !nejiste.has(klic)) {
        const zdroje = (k) => unikatni(podlePoradi(skupiny().get(koren(k))).map((z) => z.zdroj)).join("; ");
        nejiste.set(klic, { nazev_a: na, zdroj_a: zdroje(i), nazev_b: nb, zdroj_b: zdroje(j), duvod: duvody.join("; ") });
      }
    }

  const kandidati = [...skupiny().values()].map((sk) => {
    sk = podlePoradi(sk);
    // Weby lišící se jen protokolem, „www.“ nebo koncovým lomítkem jsou totéž; ponechá se první podle pořadí zdrojů.
    const klicWebu = (w) => { const u = new URL(w); return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "") + u.search; };
    const weby = [...new Map(sk.filter((z) => z.web !== NEOVERENO).reverse().map((z) => [klicWebu(z.web), z.web])).values()].reverse();
    return {
      nazev: sk[0].nazev,
      web: weby.length ? weby.join(" ; ") : NEOVERENO,
      zdroj: unikatni(sk.map((z) => z.zdroj)).join("; "),
      url_zdroje: unikatni(sk.map((z) => z.url_zdroje)).join(" ; "),
      datum_stazeni: dnes(),
    };
  });
  kandidati.sort((a, b) => a.nazev.localeCompare(b.nazev, "cs"));
  return { kandidati, nejiste: [...nejiste.values()] };
}

// --- Běh ---
const k1 = await nactiK1();
const k2 = await nactiK2();
const k3 = await nactiK3();
const k4 = await nactiK4();
console.log(`K1: ${k1.length} karet, K2: ${k2.length} členů, K3: ${k3.length} fondů, K4: ${k4.popisku} položek`);
console.log(`K4 vyřazeno (jen terminál, neukládá se): ${k4.vyrazeno.join(", ")}`);

const rozhodnuti = nactiCsv("data/kandidati_rozhodnuti.csv");
const vsechny = [...k1, ...k2, ...k3, ...k4.vysledek].map((z) => ({ ...z, web: cistyWeb(z.web) }));
const { kandidati, nejiste } = deduplikuj(vsechny, rozhodnuti);

zapisCsv("data/kandidati.csv", ["nazev", "web", "zdroj", "url_zdroje", "datum_stazeni"], kandidati);
zapisCsv("data/kandidati_mozne_duplicity.csv", ["nazev_a", "zdroj_a", "nazev_b", "zdroj_b", "duvod"], nejiste);
console.log(`Záznamů celkem: ${vsechny.length}, po deduplikaci: ${kandidati.length}, nejistých shod: ${nejiste.length}`);
