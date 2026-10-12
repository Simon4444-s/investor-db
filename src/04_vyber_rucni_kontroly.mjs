// Výběr 20 řádků z results/rucni-kontrola.csv, které zkontroluje člověk (sloupec rucne = ano).
// Ostatní řádky kontroluje nezávislý AI agent; shoda obou kontrol měří spolehlivost agenta (PLAN.md, kap. 6).
//
// Postup:
// 1. Kvóty pro oddíly A, B, C úměrně počtu řádků, zaokrouhlení metodou největšího zbytku.
// 2. Řádky s vyplněným sloupcem verdikt (už ručně zkontrolované) jsou ve výběru vždy a
//    započítají se do kvóty svého oddílu.
// 3. Zbytek kvóty se losuje generátorem mulberry32 s pevným seedem; oddíly v pořadí A, B, C,
//    všechny řádky oddílu seřazené podle id, zamíchané Fisher-Yatesem. Bere se prvních N
//    řádků pořadí, které nejsou povinné, vyloučené ani sporné. Pořadí nezávisí na vyplněném
//    verdiktu, takže opakované spuštění během ruční kontroly výběr nezmění.
// 4. Sporné řádky dostanou rucne = spor a do kvóty 20 se nepočítají.
//
// Spuštění: node src/04_vyber_rucni_kontroly.mjs
// Skript mění jen sloupec rucne; ostatní sloupce (verdikt, verdikt_ai, …) zachová.

import fs from 'node:fs';

const SOUBOR = 'results/rucni-kontrola.csv';
const VELIKOST_VYBERU = 20;
const SEED = 20261011;
const NOVE_SLOUPCE = ['verdikt_ai', 'zduvodneni_ai', 'rucne'];
// Verdikt AI u těchto řádků uživatel viděl před ruční kontrolou, slepá kontrola není čistá (2026-10-12).
const VYLOUCENE = ['A034', 'B097'];
// Spory mezi kontrolory: dávka A nenašla investici v okně, dávka B ji doložila z rejstříku (B080, B102).
const SPORY = ['A005', 'A028'];

function parsujCsv(text) {
  const radky = [];
  let radek = [];
  let pole = '';
  let vUvozovkach = false;
  for (let i = 0; i < text.length; i++) {
    const znak = text[i];
    if (vUvozovkach) {
      if (znak === '"') {
        if (text[i + 1] === '"') { pole += '"'; i++; } else vUvozovkach = false;
      } else pole += znak;
    } else if (znak === '"') vUvozovkach = true;
    else if (znak === ',') { radek.push(pole); pole = ''; }
    else if (znak === '\n') { radek.push(pole); radky.push(radek); radek = []; pole = ''; }
    else if (znak !== '\r') pole += znak;
  }
  if (pole !== '' || radek.length) { radek.push(pole); radky.push(radek); }
  return radky;
}

const csvPole = (hodnota = '') => (/[",\n\r]/.test(hodnota) ? `"${hodnota.replace(/"/g, '""')}"` : hodnota);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const [hlavicka, ...data] = parsujCsv(fs.readFileSync(SOUBOR, 'utf8'));
for (const sloupec of NOVE_SLOUPCE) if (!hlavicka.includes(sloupec)) hlavicka.push(sloupec);
const zaznamy = data.map((r) => Object.fromEntries(hlavicka.map((s, i) => [s, r[i] ?? ''])));

// 1. Kvóty podle oddílu (první písmeno id).
const oddily = ['A', 'B', 'C'];
const podleOddilu = Object.fromEntries(oddily.map((o) => [o, zaznamy.filter((z) => z.id.startsWith(o))]));
const podily = oddily.map((o) => (VELIKOST_VYBERU * podleOddilu[o].length) / zaznamy.length);
const kvoty = podily.map(Math.floor);
const poradiZbytku = oddily.map((_, i) => i).sort((i, j) => (podily[j] % 1) - (podily[i] % 1));
for (let k = 0; kvoty.reduce((a, b) => a + b) < VELIKOST_VYBERU; k++) kvoty[poradiZbytku[k]]++;

// 2. a 3. Povinné řádky a los.
const nahoda = mulberry32(SEED);
const vybrane = new Set();
oddily.forEach((oddil, i) => {
  const poradi = [...podleOddilu[oddil]].sort((a, b) => a.id.localeCompare(b.id));
  for (let j = poradi.length - 1; j > 0; j--) {
    const k = Math.floor(nahoda() * (j + 1));
    [poradi[j], poradi[k]] = [poradi[k], poradi[j]];
  }
  const mimoLos = (z) => VYLOUCENE.includes(z.id) || SPORY.includes(z.id);
  const povinne = poradi.filter((z) => z.verdikt.trim() !== '' && !mimoLos(z));
  const losovane = poradi
    .filter((z) => z.verdikt.trim() === '' && !mimoLos(z))
    .slice(0, Math.max(0, kvoty[i] - povinne.length));
  for (const z of [...povinne, ...losovane]) vybrane.add(z.id);
  console.log(`${oddil}: kvóta ${kvoty[i]}, ručně vyplněno ${povinne.length}, losováno ${losovane.length}`);
});

for (const z of zaznamy) z.rucne = SPORY.includes(z.id) ? 'spor' : vybrane.has(z.id) ? 'ano' : '';
const vystup = [hlavicka, ...zaznamy.map((z) => hlavicka.map((s) => z[s]))]
  .map((r) => r.map(csvPole).join(','))
  .join('\n');
fs.writeFileSync(SOUBOR, vystup + '\n');
console.log(`Vybráno ${vybrane.size} řádků: ${[...vybrane].sort().join(', ')}`);
