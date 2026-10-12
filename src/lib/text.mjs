// Převod stažené stránky (HTML nebo PDF) na prostý text.
// Stejný převod používají agenti při hledání citací i kontrolní skript (PLAN.md, kap. 5, krok 5),
// aby „doslovná citace“ znamenala v obou případech totéž.
// Verze 2 (2026-10-12, po rozboru ruční kontroly citací):
//   - text je jen z viditelné části stránky (bez <head>, tedy bez <title>),
//   - řádkové značky (<a>, <span>, <strong> …) se odstraní bez vložení mezery, takže nevzniká „slovo ,“,
//   - dekódují se pojmenované HTML entity (&rsquo;, &eacute;, &euro; …),
//   - hranice blokových prvků se pamatují, aby šlo poznat citaci poskládanou z více prvků.
import { polozkyPdf } from "./pdf.mjs";

const ENTITY = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", ndash: "–", mdash: "—", hellip: "…",
  lsquo: "‘", rsquo: "’", sbquo: "‚", ldquo: "“", rdquo: "”", bdquo: "„", laquo: "«", raquo: "»",
  lsaquo: "‹", rsaquo: "›", bull: "•", middot: "·", copy: "©", reg: "®", trade: "™", euro: "€", pound: "£",
  yen: "¥", cent: "¢", deg: "°", times: "×", divide: "÷", plusmn: "±", minus: "−", frac12: "½", frac14: "¼",
  frac34: "¾", sup2: "²", sup3: "³", micro: "µ", para: "¶", sect: "§", shy: "\u00ad", zwnj: "\u200c", zwj: "\u200d",
  aacute: "á", Aacute: "Á", eacute: "é", Eacute: "É", iacute: "í", Iacute: "Í", oacute: "ó", Oacute: "Ó",
  uacute: "ú", Uacute: "Ú", yacute: "ý", Yacute: "Ý", ecaron: "ě", Ecaron: "Ě", scaron: "š", Scaron: "Š",
  ccaron: "č", Ccaron: "Č", rcaron: "ř", Rcaron: "Ř", zcaron: "ž", Zcaron: "Ž", dcaron: "ď", Dcaron: "Ď",
  tcaron: "ť", Tcaron: "Ť", ncaron: "ň", Ncaron: "Ň", uring: "ů", Uring: "Ů", auml: "ä", Auml: "Ä", ouml: "ö",
  Ouml: "Ö", uuml: "ü", Uuml: "Ü", szlig: "ß", agrave: "à", egrave: "è", ccedil: "ç", ntilde: "ñ", oslash: "ø",
  aring: "å", aelig: "æ", euml: "ë", iuml: "ï", ocirc: "ô", acirc: "â", ecirc: "ê", icirc: "î", ucirc: "û",
};

export function dekodujHtml(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, n) => ENTITY[n] ?? m)
    .trim();
}

// Sjednocení bílých znaků (nezlomitelná mezera, měkký spojovník, znaky nulové šířky, hranice prvků).
export const normalizuj = (s) =>
  s.replace(/[\u00ad\u200b-\u200d\ufeff]/g, "").replace(/[\s\u00a0\u202f\u2029]+/g, " ").trim();

const RADKOVE = "a|abbr|b|bdi|bdo|cite|code|data|del|dfn|em|font|i|ins|kbd|label|mark|q|s|samp|small|span|strong|sub|sup|time|u|var|wbr";
const HRANICE = "\u2029"; // oddělovač blokových prvků

// Text viditelné části stránky; hranice blokových prvků jsou označené znakem HRANICE.
function htmlNaSurovyText(html) {
  return dekodujHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<head\b[\s\S]*?<\/head>/i, " ")
      .replace(/<(script|style|noscript|svg|template|title)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ") // zalomení řádku uvnitř odstavce není hranice prvku
      .replace(new RegExp(`</?(?:${RADKOVE})\\b[^>]*>`, "gi"), "")
      .replace(/<[^>]+>/g, HRANICE)
  );
}

function metadataData(html) {
  // Data publikace bývají jen v metadatech nebo v JSON-LD; připojí se na konec textu.
  const m = [];
  for (const x of html.matchAll(/"(datePublished|dateModified|dateCreated)"\s*:\s*"([^"]+)"/g)) m.push(`${x[1]}: ${x[2]}`);
  for (const x of html.matchAll(/<meta[^>]+(?:property|name)="([^"]*(?:time|date)[^"]*)"[^>]+content="([^"]+)"/gi)) m.push(`${x[1]}: ${x[2]}`);
  for (const x of html.matchAll(/<time[^>]+datetime="([^"]+)"/gi)) m.push(`time: ${x[1]}`);
  return m.length ? " [metadata] " + [...new Set(m)].join(" ; ") : "";
}

export function htmlNaText(html) {
  return normalizuj(htmlNaSurovyText(html) + metadataData(html));
}

// Úseky textu po blokových prvcích (odstavec, nadpis, buňka …) pro kontrolu, že citace je souvislý úryvek.
export function htmlNaUseky(html) {
  return htmlNaSurovyText(html).split(HRANICE).map(normalizuj).filter(Boolean).concat(normalizuj(metadataData(html)));
}

export async function pdfNaText(data) {
  const stranky = await polozkyPdf(data);
  return normalizuj(stranky.map((s) => s.map((p) => p.text).join(" ")).join(" "));
}

export const jePdf = (data) => data.subarray(0, 5).toString("latin1") === "%PDF-";
const jeJson = (data) => /^\s*[[{]/.test(data.subarray(0, 50).toString("utf8"));

export async function naText(data) {
  if (jePdf(data)) return pdfNaText(data);
  const s = data.toString("utf8");
  return jeJson(data) ? normalizuj(s) : htmlNaText(s);
}

// PDF a JSON (ARES) nemají prvky stránky, celý text je jeden úsek.
export async function naUseky(data) {
  if (jePdf(data) || jeJson(data)) return [await naText(data)];
  return htmlNaUseky(data.toString("utf8"));
}
