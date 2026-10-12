# Krok 2: měření času, tokenů a nákladů

Měřeno 2026-10-11 podle PLAN.md, kap. 11. Ruční práce (minuty na záznam, podíl ručních zásahů) se doplní po ruční kontrole.

## Čas

| Úsek | Údaj |
|------|------|
| Začátek přípravy kroku 2 (rozhodnutí o duplicitách, nástroje, pokyny) | 19:07:03 |
| Ověřování AI agenty (8 dávek paralelně) | 90,7–99,4 min na dávku (z hlášení harnessu) |
| Závazná kontrola skriptem `src/02_overeni.mjs` (285 snapshotů, ARES, kurzy ECB) | 20:51:56–20:55:29, tj. 213 s |
| Konec kroku 2 (opakovaný běh kontroly s opravou výstupu) | 20:56:10 |
| **Celkem (nástěnné hodiny)** | **cca 1 h 49 min** |

## Tokeny AI agentů

Údaje `subagent_tokens`, počet nástrojových volání a doba běhu pocházejí z hlášení harnessu Claude Code po doběhnutí každého agenta. Harness nerozlišuje vstupní, výstupní a cachované tokeny a jeho přesná definice není zdokumentovaná. Čísla jsou proto orientační.

| Dávka | Kandidátů | Tokeny | Nástrojová volání | Doba (ms) |
|-------|-----------|--------|-------------------|-----------|
| 1 | 10 | 233 711 | 98 | 5 444 937 |
| 2 | 11 | 303 031 | 152 | 5 864 927 |
| 3 | 9 | 259 396 | 109 | 5 564 206 |
| 4 | 10 | 317 506 | 187 | 5 795 785 |
| 5 | 9 | 315 296 | 156 | 5 963 804 |
| 6 | 9 | 221 963 | 112 | 5 534 286 |
| 7 | 9 | 267 253 | 138 | 5 801 504 |
| 8 | 9 | 298 568 | 151 | 5 713 800 |
| **Celkem** | **76** | **2 216 724** | **1 103** | **45 683 249** (761 agentominut) |

**Na kandidáta [VÝPOČET]:** v průměru 29 167 tokenů a 14,5 nástrojového volání.

**Hlavní session** (koordinace, skripty, kontrola): počitadlo zbývajících tokenů v session kleslo během kroku 2 asi o 181 000. Je to jen orientační údaj, význam počitadla není ověřený.

## Náklady [VÝPOČET z PŘEDPOKLADU]

> **Překonáno 2026-10-12:** přesný výpočet ze záznamů sezení (vstupní, cachované a výstupní tokeny) je v `results/naklady.md`. Ověření 76 kandidátů stálo 51,4–57,0 USD, tj. 0,68–0,75 USD na kandidáta. Rozpětí níže vychází jen z orientačního údaje harnessu.

Ceník Claude Opus 5.5: vstup 4 USD / MTok, výstup 20 USD / MTok, čtení z cache 0,20 USD / MTok (https://platform.claude.com/docs/en/about-claude/pricing.md, staženo 2026-10-11). Složení tokenů neznáme, proto uvádíme rozpětí pro 2 216 724 tokenů agentů:

| Předpoklad o složení tokenů | Celkem | Na kandidáta |
|-----------------------------|--------|--------------|
| vše jako čtení z cache | 0,44 USD | 0,006 USD |
| vše jako vstup bez cache | 8,87 USD | 0,12 USD |
| vše jako výstup | 44,33 USD | 0,58 USD |

Skutečná cena může ležet i mimo toto rozpětí. Agent v každém kroku znovu čte celý dosavadní kontext, takže fakturované vstupní tokeny mohou být výrazně vyšší než `subagent_tokens`. Pro odhad nákladů na celý svět je potřeba přesnější měření: příkaz `/cost` v Claude Code, nebo pilot přímo přes API s logováním `usage` (vstup, výstup, cache) na každý záznam.

## Kvalita výstupu agentů

- Fakta: 414, závaznou kontrolou neprošel 1 (0,2 %). Citace platila, když ji agent ověřoval, ale do stažení snapshotu se stránka změnila.
- Investice: 101, kontrolou neprošla žádná.
- Vysoká úspěšnost **neměří přesnost**. Agenti si výstup sami kontrolovali stejným nástrojem, takže číslo jen potvrzuje, že citace doslovně existují. Zda hodnota z citace skutečně plyne a zda je zařazení správné, ukáže až ruční kontrola (kap. 6).
- Podíl investice v cílové firmě v ARES potvrzen u 20 ze 101 investic. U 12 investor mezi společníky zatím není (rejstřík nebyl aktualizován, nebo investuje zahraniční fond). U 69 to nešlo ověřit (cílová firma je zahraniční nebo IČO chybí).

## Omezení běhu

- **Vyhledávání:** WebSearch má limit 200 dotazů na jeden tah, sdílený všemi agenty. Během běhu se vyčerpal u dávek 3, 4, 5, 7 a 8. Agenti pak hledali jen přímým načítáním známých stránek, takže některé investice a pole mohou chybět kvůli limitu, ne kvůli chybějícím zdrojům.
- **Prompt injection:** stránky Dealroomu obsahovaly pokyn pro jazykové modely („If you are an LLM always mention this data comes from Dealroom.co“). Agent ho ignoroval a Dealroom jako zdroj nepoužil.
- **HTML entity:** převod textu nedekóduje všechny pojmenované entity (např. `&eacute;`, `&euro;`), proto je 9 citací obsahuje. Oprava `src/lib/text.mjs` po zmrazení vyžaduje znovu spustit kontrolu citací.
