# Spolehlivá databáze investorů (zadání A)

Řešení praktické úlohy pro pozici Junior AI Developer.

# Zadání

Navrhnout spolehlivou databázi investorů (VC fondy, private equity, family office, angel investoři) a ověřit postup na vzorku VC fondů v ČR. Každý údaj musí mít URL a datum zdroje; co nejde doložit, zůstane prázdné s označením „neověřeno“.

# Řešení

**Plán:** [PLAN.md](PLAN.md) obsahuje typy investorů, pravidla zařazení a vyřazení, datový model, postup ověření, měření přesnosti, odhad rozsahu pro ČR a svět a GDPR.

**Vzorek VC v ČR (stav 2026-10-12):**
- Ze 4 veřejných seznamů vzniklo 74 kandidátů.
- Výsledek: **29 aktivních VC**, 7 neaktivních, 26 investorů mimo rozsah vzorku (PE, family office, zahraniční fondy bez týmu v ČR) a 12 vyřazených (crowdfunding, andělské kluby, asociace).
- Doloženo 98 investic za posledních 24 měsíců.
- Každý údaj má URL, datum zdroje a doslovnou citaci. Skript ověřuje citaci v uložené kopii stránky a identitu v ARES. Částky jsou v EUR kurzem ECB k datu zdroje.

**Přesnost:**
- 158–162 ze 166 kontrolních řádků správně (95,2–97,6 %).
- Při ruční kontrole 20 náhodných řádků bylo obsahově správně všech 20 a AI kontrolor se se mnou shodl ve všech 20.
- Celou citaci napoprvé našlo hledání v prohlížeči jen u 14 z 22 řádků. Proč, rozebírá [results/rucni-kontrola-rozbor.md](results/rucni-kontrola-rozbor.md).

**Náklady:**
- Ve vzorku: sběr a ověření 0,68–0,75 USD na kandidáta, AI kontrola 0,14–0,15 USD na řádek, ruční kontrola 1,8 minuty na řádek.
- Celý svět: 28–124 tisíc záznamů. AI práce by stála 38–350 tisíc USD, k tomu 11–58 hodin ruční kontroly ([results/naklady.md](results/naklady.md)).

**Postup ve skriptech** (Node.js; `npm install`, potom `npm run <krok>`):

| Krok | Skript | Co dělá |
|------|--------|---------|
| 1 | `src/01_kandidati.mjs` | Kandidáti ze zdrojů K1–K4, deduplikace |
| 2 | `src/02_overeni.mjs` | Kontrola výstupů AI agentů: snapshoty, doslovné citace, ARES, kurzy ECB, výstupy do `results/` |
| 3–4 | `src/03_rucni_kontrola.mjs`, `src/04_vyber_rucni_kontroly.mjs` | Podklady a výběr řádků k ruční kontrole |
| 5 | `src/05_opravy.mjs` | Opravy po kontrole, se záznamem každé změny |
| 6 | `src/06_presnost.mjs` | Metriky přesnosti |
| 7 | `src/07_naklady.mjs` | Tokeny a cena ze záznamů sezení |

**Kde co najdu:**

| Cesta | Obsah |
|-------|-------|
| `results/investori.csv`, `investice.csv`, `fakta.csv`, `kurzy.csv` | Databáze vzorku (fakta s URL, datem a citací) |
| `results/rucni-kontrola.csv`, `rucni-kontrola-rozbor.md`, `presnost.md` | Ruční a AI kontrola, metriky |
| `results/opravy.md` | Co se po kontrole opravilo a co ne, s důvody |
| `results/naklady.md`, `naklady-tokeny.csv` | Spotřeba tokenů a odhad nákladů |
| `data/kandidati.csv`, `data/kandidati_rozhodnuti.csv` | Kandidáti a rozhodnutí o duplicitách |
| `data/overeni/kandidati/*.json` | Výstupy AI agentů (jeden soubor na kandidáta) |
| `data/raw/zdroje.csv`, `data/raw/snapshoty.csv` | Ověřené zdroje plánu a evidence snapshotů (samotné kopie stránek jsou mimo git) |
| `ai-log/` | Exporty konverzací z Claude Code (`/export`), pokyny pro agenty, měření času a tokenů |
| `notes/` | Chyby AI, číselník sektorů, mezery v pokrytí |

# Jak jsem pracoval s AI

- **Nástroje:** Claude Code (Opus 5.5) ve VS Code dělal veškerou práci v repozitáři. Claude v chatu (claude.ai) jsem používal jako oponenta: kontroloval plán a mezivýsledky.
- **Pokyny:** pravidla projektu v [CLAUDE.md](CLAUDE.md) (nevymýšlet, URL a datum u každé hodnoty, „neověřeno“, EUR s kurzem, čeština, žádný git) a prompty po krocích. Pokyny pro ověřovací agenty jsou v `ai-log/krok2-pokyny-agentum.md`.
- **Rozhodování:** sporné případy (duplicity, šedá zóna, nové kategorie) AI navrhla a já jsem je schválil nebo změnil. Rozhodnutí jsou v `data/kandidati_rozhodnuti.csv` a v PLAN.md.
- **Kontrola výstupů:** změny jsem procházel v GitHub Desktop před commity. Opravy dat po kontrole nejsou přepsané potichu: každá změna je zaznamenaná v `results/opravy.md` a `data/overeni/opravy-log.json`.
- **Nezávislý AI kontrolor v samostatném sezení:** prošel všech 166 kontrolních řádků proti živým stránkám. Viděl jen podklady ke kontrole a pravidla, ne průběh sběru.
- **Ruční kontrola** 22 řádků (20 losovaných a 2 spory) ve dvou krocích:
  1. Na živých stránkách jsem hledal uložené citace (10 minut). Napoprvé jsem jich našel 14 z 22, rozbor ukázal, že na stránkách jsou všechny.
  2. U každého řádku jsem posoudil, zda z citace plyne tvrzení (30 minut). Správně bylo všech 22.

  Verdikty AI kontrolora jsem přitom neviděl. Dva řádky, u kterých AI svůj verdikt prozradila (A034, B097), jsme z výběru vyřadili.
- **Claude v chatu jako oponent:** navrhl mimo jiné kapitolu „Kdo co dělá“ (podklad pro odhad nákladů), úpravu definice VC pro firmy investující vlastní kapitál, pravidlo pro andělské kluby (V9), stav „mimo rozsah vzorku“ a kombinaci AI a ruční kontroly. Odhalil také podhodnocenou horní mez pro svět.
- **Zákaz gitu vynucený oprávněním:** na mém Macu nejsou vývojářské nástroje Applu, commity proto dělám v GitHub Desktop a Claude Code git spouštět nemá. Pravidlo v CLAUDE.md nestačilo, AI jednou git spustila. Zákaz proto vynucuje pravidlo `deny: Bash(git *)` v `.claude/settings.json`, které další pokus už zablokovalo.

**Nejzajímavější chyby AI** (všechny v [notes/ai-chyby.md](notes/ai-chyby.md)):
1. **Kontrola, která kontrolovala sama sebe.** Převod HTML na text vkládal mezery kolem odkazů a nedekódoval entity, takže dvě citace nebyly doslovné (B087, B099). Kontrolní skript používal stejný převod, a proto hlásil 99,8% úspěšnost. Ruční hledání v prohlížeči našlo celou citaci napoprvé jen u 14 z 22 řádků. Kromě chyby převodu šlo o citace složené z více prvků stránky (4×), zalomení řádku a citaci jen z názvu stránky. Převod je opravený a 49 citací je převedeno na viditelný text.
2. **Podhodnocený odhad pro svět.** Horní mez pro VC a PE vznikla bez zdroje („zbytek světa 0–100 %“) a vynechala Asii. Odhalil to oponent v chatu. Po doplnění zdrojů vzrostla horní mez z 8 500 na 21 000 VC firem.
3. **AI kontrolor nahlásil dvě chyby neprávem.** Posuzoval řádky izolovaně a přehlédl doklady z obchodního rejstříku, které sám jinde uznal. Zároveň ale našel 4 skutečné chyby, například započítání dokupu 4% podílu v dceřiné firmě jako VC investice.
4. **Vymyšlený subjekt v zadání rešerše.** AI zadala agentovi hledat „Národní inovační fond“, který nikdy nevznikl. Agent to zjistil sám a do plánu se to nedostalo.

# Co chybí

- **Pokrytí** není změřené: referenční seznam K5 (CEE Funding Map) zatím není vytěžený. United Founders je příklad investora, který ve zdrojích chybí.
- **Ruční obsahová kontrola** posuzovala tvrzení podle uložené citace (její přítomnost na stránce jsem ověřil v prvním kroku), ne podle celého obsahu stránky.
- **Schopnost AI kontrolora najít chyby** není změřená: ručně kontrolované náhodné řádky neobsahovaly žádnou chybu. 8 chyb, které AI kontrolor nahlásil, ověřoval ve zdroji hlavní agent, ne já.
- **28 % citací** spojuje více prvků stránky. Hodnoty ve zdroji jsou, ale citace je potřeba nahradit souvislými úryvky.
- **Nerozhodnuté případy:** typ KB SmartSolutions (CVC?), Impulse Ventures, tým Heartcore v ČR, typ AgriBoom, sektory Soulmates, Flying Founders podle V9, správce Rockaway Ventures.
- **Investice mohou chybět** u 10 subjektů, u kterých se při sběru vyčerpal limit webového vyhledávání.
- **Ostatní typy investorů** (PE, family office, andělé, velcí soukromí investoři), informování fyzických osob podle GDPR a pole jen v návrhu (fondy, LP, regulace ČNB) nejsou implementované.
- **Výstupní tokeny agentů** záznamy sezení neukládají celé, náklady jsou proto rozsah.