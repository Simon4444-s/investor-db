// Krok 6 (PLAN.md, kap. 6): metriky přesnosti z ruční kontroly a z kontroly AI kontrolorem.
// Vstupy: results/rucni-kontrola.csv (verdikty), results/investori.csv, results/fakta.csv,
// results/investice.csv (stav po opravách). Výstup: results/presnost.md.
import fs from "node:fs";
import { nactiCsv } from "./lib/csv.mjs";

const r = nactiCsv("results/rucni-kontrola.csv");
const z = 1.96;
function wilson(x, n) {
  if (!n) return "–";
  const p = x / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return `${x}/${n} = ${((100 * x) / n).toFixed(1)} % (95% CI ${((c - h) * 100).toFixed(1)}–${((c + h) * 100).toFixed(1)} %)`;
}
const pocet = (a, f) => a.filter(f).length;

// --- Ruční kontrola: 20 losovaných řádků (rucne = ano) a 2 spory (rucne = spor) ---
const nahodne = r.filter((x) => x.rucne === "ano"), spory = r.filter((x) => x.rucne === "spor"), rucne = [...nahodne, ...spory];
const obsahOk = (x) => x.verdikt_obsah === "správně";
const citaceNalezena = (x) => x.verdikt === "citace nalezena";
// Podle rozboru (results/rucni-kontrola-rozbor.md) je text všech kontrolovaných citací na živé stránce.
const vSekci = (a, s) => a.filter((x) => x.sekce.startsWith(s));

// --- AI kontrolor: všech 166 řádků ---
const aiOk = (x) => x.verdikt_ai === "správně";
// Ověření chyb hlášených AI (results/opravy.md): potvrzené, vyvrácené ruční kontrolou, nerozhodnuté.
const POTVRZENE = ["A023", "A064", "A070", "B097"], VYVRACENE = ["A005", "A028"], NEROZHODNUTE = ["A034", "A045", "C116", "C127"];
const aiSpatne = r.filter((x) => !aiOk(x)).map((x) => x.id);

// --- Vyplněnost (aktivní VC po opravách) a platnost odkazů ---
const investori = nactiCsv("results/investori.csv"), aktivni = investori.filter((x) => x.stav === "aktivní");
const POLE = ["ico", "web", "typ", "sektory_deklarovane", "faze", "tiket_deklarovany", "kapital_celkem", "sektory_portfolio", "tiket_z_investic_eur"];
const souhrn = fs.readFileSync("results/overeni-souhrn.md", "utf8");
const snapshoty = souhrn.match(/Stažených zdrojových stránek \(snapshotů\): (\d+), z toho nedostupných: (\d+)/);
const overene = [...nactiCsv("results/fakta.csv"), ...nactiCsv("results/investice.csv")].filter((x) => x.stav === "ověřeno" && x.citace_jeden_prvek);

const md = `# Přesnost databáze (vzorek VC v ČR)

Vypočteno skriptem \`src/06_presnost.mjs\` ${new Date().toISOString().slice(0, 10)} podle PLAN.md, kap. 6. Intervaly jsou 95% podle Wilsona.
Podklady: \`results/rucni-kontrola.csv\` (verdikty), \`results/rucni-kontrola-rozbor.md\`, \`results/opravy.md\`.

## 1. Ruční kontrola (22 řádků)

Kontrolováno 22 řádků: 20 losovaných z oddílů A–C a 2 spory s AI kontrolorem (A005, A028). Nestranný odhad dávají jen losované řádky; spory jsou vybrané záměrně.

| Varianta | 20 losovaných | všech 22 |
|----------|---------------|----------|
| Obsah (tvrzení z citace plyne) | ${wilson(pocet(nahodne, obsahOk), nahodne.length)} | ${wilson(pocet(rucne, obsahOk), rucne.length)} |
| **Konzervativní:** obsah správně a celou citaci najde Cmd+F | ${wilson(pocet(nahodne, (x) => obsahOk(x) && citaceNalezena(x)), nahodne.length)} | ${wilson(pocet(rucne, (x) => obsahOk(x) && citaceNalezena(x)), rucne.length)} |
| **Optimistická:** obsah správně a text citace na stránce je (podle rozboru) | ${wilson(pocet(nahodne, obsahOk), nahodne.length)} | ${wilson(pocet(rucne, obsahOk), rucne.length)} |

Losované řádky podle oddílů: A ${vSekci(nahodne, "A").length}, B ${vSekci(nahodne, "B").length}, C ${vSekci(nahodne, "C").length}. Na jednotlivé oddíly je to málo, proto je uvádíme jen souhrnně.

## 2. AI kontrolor (všech 166 řádků)

Nezávislý AI kontrolor v samostatném sezení posoudil každý řádek proti živé stránce. Verdikt „nelze ověřit“ nepoužil, konzervativní a optimistická varianta jeho vlastního hodnocení se proto neliší.

| Oddíl | Přesnost podle AI kontrolora |
|-------|------------------------------|
| A kandidáti (stav, důvod, doklad) | ${wilson(pocet(vSekci(r, "A"), aiOk), vSekci(r, "A").length)} |
| B investice (Z2) | ${wilson(pocet(vSekci(r, "B"), aiOk), vSekci(r, "B").length)} |
| C fakta (6 polí) | ${wilson(pocet(vSekci(r, "C"), aiOk), vSekci(r, "C").length)} |
| **Celkem** | ${wilson(pocet(r, aiOk), r.length)} |

AI kontrolor označil jako špatné: ${aiSpatne.join(", ")}. Po ověření ve zdroji (\`results/opravy.md\`):
- potvrzeno a opraveno: ${POTVRZENE.join(", ")} (${POTVRZENE.length}; u A023 jen stav jako důsledek B097, typ VC/CVC zůstává k rozhodnutí),
- vyvráceno ruční kontrolou: ${VYVRACENE.join(", ")} (${VYVRACENE.length}),
- nerozhodnuto, data beze změny: ${NEROZHODNUTE.join(", ")} (${NEROZHODNUTE.length}).

| Varianta po ověření hlášených chyb | Přesnost výstupu |
|------------------------------------|------------------|
| Metoda kap. 6 PLAN.md (u 22 řádků ruční verdikt, jinak verdikt AI) | ${wilson(pocet(r, (x) => (["ano", "spor"].includes(x.rucne) ? obsahOk(x) : aiOk(x))), r.length)} |
| Konzervativní (nerozhodnuté = chyba) | ${wilson(r.length - POTVRZENE.length - NEROZHODNUTE.length, r.length)} |
| Optimistická (nerozhodnuté = správně) | ${wilson(r.length - POTVRZENE.length, r.length)} |

## 3. Shoda AI kontrolora s ruční kontrolou

- Na 20 losovaných řádcích se AI kontrolor shodl s ruční kontrolou ve všech: ${wilson(pocet(nahodne, (x) => aiOk(x) === obsahOk(x)), nahodne.length)}. Na všech 22 řádcích: ${wilson(pocet(rucne, (x) => aiOk(x) === obsahOk(x)), rucne.length)}.
- Cohenovo kappa nemá smysl počítat: ruční kontrola nenašla žádnou chybu, takže v jejích verdiktech není rozptyl.
- **Spor A005 (StartupYard, typ VC).** AI kontrolor tvrdil, že stav „aktivní“ není doložen, protože v okně Z2 nenašel investici v médiích. Ruční kontrola: tvrzení řádku (typ VC) z citace plyne. Investice v okně je doložena v řádku B080 z obchodního rejstříku (StartupYard Batch 14 s.r.o. společníkem wopee labs od 2025-04-02) a AI kontrolor sám B080 označil jako správně. **Rozhodnuto ve prospěch ruční kontroly.**
- **Spor A028 (NEWTON University Angels, typ VC).** AI kontrolor tvrdil, že chybí datované investice i IČO fondu. Ruční kontrola: subjekt má vlastní fond, proto V9 neplatí a typ VC je správně. Investice v okně jsou v řádku B102 z obchodního rejstříku (NerveCor, zápis 2025-07-01), který AI kontrolor sám označil jako správně; IČO 10878131 je ověřené v ARES. **Rozhodnuto ve prospěch ruční kontroly.**
- Společná příčina obou sporů: AI kontrolor posuzoval každý řádek izolovaně, hledal hlavně v médiích, nebral v úvahu doklady z rejstříku v jiných řádcích a posuzoval stav místo tvrzení řádku (typ).

## 4. Ruční kontrola citací

- Cmd+F na živé stránce našel celou citaci u ${pocet(rucne, citaceNalezena)} z ${rucne.length} řádků (${wilson(pocet(rucne, citaceNalezena), rucne.length)}).
- Rozbor 8 nenalezených (\`results/rucni-kontrola-rozbor.md\`): text všech citací na stránce je. Příčiny: citace spojuje více prvků stránky (A005, A008, A041, A062), zalomení řádku (C131), entity a mezery kolem odkazů v uložené citaci (B087, B099), text jen v \`<title>\` (A027).
- Opraveno (\`results/opravy.md\`): převod HTML na text (entity, řádkové značky, bez \`<head>\`); 49 citací převedeno na viditelný text; citace A005, A008, A027, A041, A062 a tři citace 3TS se stejnou vadou nahrazeny úryvkem jednoho prvku.
- **Systémová vada, neopravená:** nový příznak \`citace_jeden_prvek\` ukazuje, že ${pocet(overene, (x) => x.citace_jeden_prvek === "ne")} z ${overene.length} ověřených citací (${((100 * pocet(overene, (x) => x.citace_jeden_prvek === "ne")) / overene.length).toFixed(0)} %) spojuje více prvků stránky. Hodnoty jsou ve zdroji, ale citace není souvislý úryvek, který by našel Cmd+F.

## 5. Další metriky kap. 6

- **Vyplněnost u ${aktivni.length} aktivních VC** (podíl ověřených hodnot): ${POLE.map((p) => `${p} ${pocet(aktivni, (x) => x[p] && x[p] !== "neověřeno")}/${aktivni.length}`).join(", ")}.
- **Platnost odkazů:** ${snapshoty ? `${snapshoty[1] - snapshoty[2]} z ${snapshoty[1]} zdrojových stránek se při kontrole načetlo` : "–"}.
- **Chybně vyřazení:** potvrzený případ 0; nerozhodnutý 1 (A045 Heartcore: jeden investor s lokalitou Praha, zda jde o tým v ČR).
- **Pokrytí:** neměřeno, referenční seznam K5 (CEE Funding Map) zatím nebyl vytěžen.

## 6. Minuty ruční práce

| Činnost | Minuty | Řádků | Minut na řádek |
|---------|--------|-------|----------------|
| Kontrola citací (Cmd+F) | 10 | ${rucne.length} | ${(10 / rucne.length).toFixed(2)} |
| Obsahová kontrola | 30 | ${rucne.length} | ${(30 / rucne.length).toFixed(2)} |
| **Celkem** | **40** | ${rucne.length} | **${(40 / rucne.length).toFixed(2)}** |

Čas rozboru nenalezených citací a rozhodování sporů není v tabulce.
`;
fs.writeFileSync("results/presnost.md", md);
console.log(md.split("\n").slice(0, 30).join("\n"));
