# Krok 2: pokyny pro AI agenty (ověření kandidátů)

Tento text dostal každý AI agent, který ověřoval část kandidátů z `data/kandidati.csv`.
Postup vychází z PLAN.md (kap. 5 a 11). Den kontroly je 2026-10-11.

## Než začneš

- Přečti `CLAUDE.md`, v `PLAN.md` kapitoly 1, 2, 3, 5, 9 a 10 a `notes/ciselnik-sektoru.md`.
- **Nikdy nespouštěj git.**
- Zapisuj jen do souborů, které ti byly přiděleny (`data/overeni/kandidati/<soubor>.json`). Nic jiného v projektu neměň.
- Nic si nevymýšlej a nedoplňuj z paměti. Co nedoložíš citací ze stránky, nezapisuj (u faktu dej `"hodnota": "neověřeno"` nebo fakt vynech).

## Nástroje

- Text stránky přesně tak, jak ho uvidí kontrolní skript:
  `node src/nastroje/text.mjs <url>` (celý text), `node src/nastroje/text.mjs <url> "<výraz>"` (výskyty s okolím).
  **Citace kopíruj jen z výstupu tohoto nástroje.** Výstup WebFetch bývá přeformulovaný nebo přeložený, jako citace se nepoužívá. WebSearch a WebFetch používej jen k hledání.
  Pokud stránka vrátí chybu nebo hledaný text v jejím textu není (obsah se načítá JavaScriptem), najdi jiný zdroj.
- ARES (obchodní rejstřík, bez klíče):
  - podle IČO: `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/<IČO>`
  - hledání podle názvu: `curl -s -X POST -H 'Content-Type: application/json' -d '{"obchodniJmeno":"<název>","pocet":10}' https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`
  - společníci (veřejný rejstřík): `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty-vr/<IČO>`
  - U faktu `ico` a `nazev` uveď jako `url` adresu ARES podle IČO a jako citaci úsek JSON z výstupu `text.mjs`, např. `"ico":"28538137","obchodniJmeno":"Credo Ventures a.s."`.
- Kontrola výstupu: `node src/nastroje/kontrola.mjs data/overeni/kandidati/<soubor>.json`. Opravuj, dokud nevypíše „OK“. Pokud problém nejde opravit poctivě (zdroj neexistuje), fakt nebo investici odstraň a napiš to do `poznamka`. Nikdy neupravuj citaci tak, aby jen prošla kontrolou, když ji zdroj neobsahuje.

## Postup pro každého kandidáta

1. **Co subjekt je.** Z jeho webu a dalších zdrojů zjisti, zda investuje vlastní nebo svěřený kapitál do soukromých firem. Pak urči stav:
   - `vyrazen`: platí pravidlo V1–V9 z PLAN.md (kap. 2) nebo subjekt nesplňuje některé ze Z1–Z5. Do `duvod` napiš kód (`V2`, `V9`, `nesplňuje Z1` …) a doklad dej jako fakt `duvod`.
   - `mimo_rozsah`: skutečný investor, který do vzorku nepatří. `duvod` = `PE` (typ PE), nebo `bez_tymu_v_CR` (zahraniční fond bez stálého investičního týmu v ČR). Dolož fakty `typ` a `zeme_sidla`, případně `tym_v_CR` = `ne`. Investice nemusíš hledat.
   - `aktivni` nebo `neaktivni`: VC (včetně CVC, akcelerátorů s podílem a státních fondů, viz kap. 3) se sídlem správce v ČR nebo se stálým investičním týmem v ČR. `aktivni` = aspoň jedna doložená investice od 2024-10-11; jinak `neaktivni` (V4) a do `poznamka` napiš, co jsi hledal.
2. **Fakta pro `aktivni` a `neaktivni`:** `nazev` (právní název správce v ČR), `ico`, `zeme_sidla`, `web`, `typ`, `tym_v_CR` (jen když je sídlo v zahraničí), příznaky `cvc` / `akcelerator` / `verejny` (jen když platí, hodnota `ano`), `vlastni_kapital` (jen když zdroj výslovně uvádí, že investují peníze zakladatelů či partnerů bez externích LP), `sektory_deklarovane`, `faze`, `tiket_deklarovany`, `kapital_celkem`. Co nedoložíš, vynech.
3. **Investice:** 1–5 nejnovějších investic od 2024-10-11, nejnovější první. Pořadí zdrojů: tisková zpráva investora nebo cílové firmy > důvěryhodná média (CzechCrunch, Forbes, HN, E15, Lupa, Seznam Zprávy, zahraniční odborná média) > portfolio na webu investora, jen když uvádí rok. Crunchbase, Dealroom, PitchBook, Tracxn a LinkedIn jsou jen vodítka, ne zdroj. U české cílové s.r.o. doplň IČO (ARES); skript pak ověří, zda je investor mezi společníky.
4. **Osobní údaje (PLAN.md, kap. 9):** do citací nevkládej jména fyzických osob (zakladatelů, partnerů, andělů). Vyber takový souvislý úsek textu, který jméno neobsahuje. Andělské spoluinvestory nezapisuj.

## Pravidla pro citace a data

- `citace`: doslovný souvislý úsek textu stránky z `text.mjs`, 1–3 věty, nejvýše cca 400 znaků.
- `hodnota_v_citaci`: přesný podřetězec citace, který dokládá hodnotu (např. `$1M - $5M checks`, název cílové firmy).
- `hodnota`: hodnota v našem formátu (viz níže). Musí věcně odpovídat `hodnota_v_citaci`.
- `datum_zdroje`: datum vydání stránky nebo dokumentu ve tvaru `YYYY-MM-DD`, `YYYY-MM` nebo `YYYY`. Pokud ho stránka neuvádí, napiš `neověřeno`.
- `datum_v_textu`: přesný podřetězec textu stránky, který datum dokládá (např. `12. března 2025` nebo `datePublished: 2025-03-12T08:00:00+01:00` z části `[metadata]`). Při `neověřeno` nech prázdné.
- U investice je `datum_investice` datum oznámení investice (zpravidla datum článku nebo tiskové zprávy).

## Formáty hodnot

- `typ`: `VC`, `PE`, `FO`, `angel`, `velky_soukromy`. Příznaky a `tym_v_CR`: `ano` / `ne`.
- `sektory_deklarovane`, `faze`: kódy z `notes/ciselnik-sektoru.md` oddělené `;` (např. `ai;software`, `pre-seed;seed`).
- `tiket_deklarovany`: `min-max MĚNA` nebo `částka MĚNA`, celá čísla bez mezer (např. `1000000-5000000 USD`).
- `kapital_celkem`: `částka MĚNA; druh=…`, kde druh je `součet fondů`, `velikost fondu`, `AUM` nebo `committed`.
- Měny: `CZK`, `EUR`, `USD`, `GBP`, `CHF`, `PLN`. Na EUR nepřepočítávej, udělá to skript kurzem ECB.
- Částky u investice: `{"castka": 25000000, "mena": "CZK"}` nebo `null`. `castka_investora` vyplň jen tehdy, když zdroj uvádí částku tohoto investora, nebo když byl jediným investorem kola (pak to musí být vidět v citaci).

## Výstup: jeden soubor JSON na kandidáta

```json
{
  "kandidat": "Credo Ventures",
  "znacka": "Credo Ventures",
  "stav": "aktivni",
  "duvod": null,
  "typ": "VC",
  "fakta": [
    {"pole": "tiket_deklarovany", "hodnota": "1000000-5000000 USD",
     "url": "https://www.credoventures.com/",
     "citace": "● Leading Pre-Seed rounds. ● $1M - $5M checks.",
     "hodnota_v_citaci": "$1M - $5M checks",
     "datum_zdroje": "neověřeno", "datum_v_textu": ""}
  ],
  "investice": [
    {"cilova_firma": "…", "ico_cilove_firmy": "", "datum_investice": "2025-05-14",
     "faze_kola": "seed", "castka_kola": {"castka": 3000000, "mena": "EUR"}, "castka_investora": null,
     "role": "lead", "typ_dokladu": "TZ", "sektor": "ai",
     "url": "…", "citace": "…", "hodnota_v_citaci": "…",
     "datum_zdroje": "2025-05-14", "datum_v_textu": "14. 5. 2025"}
  ],
  "poznamka": "Co se nepodařilo doložit a proč."
}
```

`kandidat` musí být přesně název z `data/kandidati.csv`. Pole `role`: `lead`, `ucast` nebo `neuvedeno`. Pole `typ_dokladu`: `rejstrik`, `TZ`, `media` nebo `portfolio`.

## Rozsah práce

Na kandidáta mimo vzorek stačí obvykle 3–6 kroků. U VC ve vzorku buď efektivní (orientačně do 25 kroků). Na konci vrať stručné shrnutí: za každého kandidáta stav, typ, počet investic a co zůstalo neověřeno.
