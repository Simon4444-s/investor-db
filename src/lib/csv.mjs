// Jednoduché čtení a zápis CSV (RFC 4180: čárka, uvozovky, UTF-8).
import fs from "node:fs";

function pole(hodnota) {
  const s = hodnota == null ? "" : String(hodnota);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function zapisCsv(soubor, hlavicka, radky) {
  const text = [hlavicka, ...radky.map((r) => hlavicka.map((h) => r[h]))]
    .map((r) => r.map(pole).join(","))
    .join("\n");
  fs.writeFileSync(soubor, text + "\n");
}

export function nactiCsv(soubor) {
  if (!fs.existsSync(soubor)) return [];
  const text = fs.readFileSync(soubor, "utf8");
  const radky = [];
  let radek = [], hodnota = "", vUvozovkach = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (vUvozovkach) {
      if (c === '"' && text[i + 1] === '"') { hodnota += '"'; i++; }
      else if (c === '"') vUvozovkach = false;
      else hodnota += c;
    } else if (c === '"') vUvozovkach = true;
    else if (c === ",") { radek.push(hodnota); hodnota = ""; }
    else if (c === "\n") { radek.push(hodnota); radky.push(radek); radek = []; hodnota = ""; }
    else if (c !== "\r") hodnota += c;
  }
  if (hodnota !== "" || radek.length) { radek.push(hodnota); radky.push(radek); }
  const [hlavicka, ...data] = radky;
  return data.map((r) => Object.fromEntries(hlavicka.map((h, i) => [h, r[i] ?? ""])));
}
