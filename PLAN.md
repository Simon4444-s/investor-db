# Plán: databáze investorů

Stav: návrh, 2026-10-10, bez kódu a sběru dat. Značky: **[VOLBA]** = náš parametr, **[PŘEDPOKLAD]** = odhad bez zdroje, **[VÝPOČET]** = odvozeno z jiných čísel (postup uveden). Ostatní čísla mají URL a datum zdroje; seznam je v `data/raw/zdroje.csv`.

## Shrnutí

- **V databázi:** VC, PE, family office, angel investoři a velcí soukromí investoři s aspoň jednou veřejně doloženou investicí do soukromé firmy za posledních 24 měsíců (kap. 1–3).
- **Mimo databázi:** poradci a M&A boutiky, crowdfundingové platformy, andělské kluby bez vlastního fondu, grantové agentury, čistě dluhové financování a neaktivní fondy. Fondy fondů evidujeme zvlášť.
- **Ověření:** každá hodnota má URL, datum zdroje a doslovnou citaci; skript zkontroluje citaci v uložené kopii stránky a identitu v ARES. Nedoložené zůstane prázdné s „neověřeno“ (kap. 4, 5, 11).
- **Přesnost:** všech 166 kontrolních řádků vzorku VC v ČR zkontroloval nezávislý AI agent, 22 z nich i člověk. Přesnost je 95,2 % (158 ze 166; A 93,3 %, B 96,8 %, C 96,7 %).
  - Na 20 náhodných řádcích se AI s člověkem shodla ve 20 případech (95% interval 84–100 %). Vzorek ale neobsahoval žádnou chybu, takže schopnost AI chyby zachytit změřená není.
  - Ve dvou sporech AI chybu nahlásila neprávem. Z 8 jejích dalších nálezů se ve zdroji potvrdily 4 a byly opraveny (`results/opravy.md`).
  - Měříme přesnost záznamů a polí, vyplněnost a pokrytí (kap. 6).
- **Rozsah [PŘEDPOKLAD]:** VC v ČR 20–70 subjektů, všechny typy v ČR 130–440, VC ve světě 5 000–21 000 (odvození v 7.4).
- **Spolehlivost [PŘEDPOKLAD]:** nejvyšší u VC, nejnižší u family office a velkých soukromých investorů; skutečnou přesnost změří vzorek.
- **Proč vlastní ověřování:** Crunchbase a Dealroom se shodují jen asi u 30 % subjektů (OECD 2026, kap. 7.3).

## 1. Typy investorů

Každý subjekt má jeden hlavní typ; doplňkové vlastnosti řeší příznaky (kap. 3, 4).

| Typ | Definice |
|-----|----------|
| VC | Investiční firma nebo fond s vlastní značkou a veřejnou investiční strategií; kupuje menšinové podíly v mladých, rychle rostoucích soukromých firmách (pre-seed až growth). Kapitál je od externích investorů (LP), nebo z vlastních peněz zakladatelů či partnerů (`vlastni_kapital = ano`). |
| Private equity | Jako VC, ale investuje do zralých soukromých firem, typicky do většinových podílů (buyout, expanze). |
| Family office | Samostatná organizace, která spravuje majetek jedné či několika rodin a investuje ho mimo jiné do soukromých firem. |
| Angel investor | Fyzická osoba, která investuje vlastní peníze do raných fází soukromých firem, sama, v klubu nebo přes vlastní holding. |
| Velký soukromý investor | Jen jedna fyzická osoba nebo její holding bez vlastní investiční značky a strategie, s aspoň jednou doloženou investicí ≥ 1 mil. EUR nebo doloženým většinovým podílem v soukromé firmě **[VOLBA]**. Pod touto hranicí jde o angel investora. |

## 2. Pravidla zařazení a vyřazení

**Zařazení – musí platit všechna** (v závorce způsob ověření):

- **Z1** Investuje do nekotovaných firem vlastním kapitálem nebo kvazi-equity, např. konvertibilním úvěrem či SAFE (typ nástroje v dokladu).
- **Z2** Má aspoň jednu veřejně doloženou investici (i follow-on) s datem v posledních 24 měsících ke dni kontroly **[VOLBA]** (doklad s datem).
- **Z3** O investici rozhoduje a nese riziko, není jen zprostředkovatel (role v dokladu).
- **Z4** Je jednoznačně identifikovatelný: IČO či zahraniční registrační číslo, u fyzické osoby jméno a veřejný investorský profil, viz kap. 9 (ARES, rejstřík).
- **Z5** Nezanikl a není v likvidaci (obchodní rejstřík).

**Doklad investice** (od nejsilnějšího): 1) zápis v obchodním rejstříku (investor je společníkem cílové firmy); 2) tisková zpráva investora nebo cílové firmy; 3) článek v médiích se jménem investora, firmy a datem; 4) portfolio na webu investora, jen pokud uvádí rok investice. Nepočítá se záznam v agregátoru (Crunchbase, Dealroom) bez odkazu na primární zdroj.

**Vyřazení – stačí jedno** (v závorce důvod):

- **V1** Poradci, M&A boutiky, investiční bankéři (nevkládají kapitál, berou poplatek; Z3).
- **V2** Crowdfundingové platformy (rozhodují jednotlivci; Z3). Vlastní fond platformy se posuzuje zvlášť.
- **V3** Grantové agentury a dotační programy (nezískávají podíl; Z1).
- **V4** Neaktivní fondy (Z2). Záznam zůstane se stavem „neaktivní“.
- **V5** Čistě dluhové financování (Z1).
- **V6** Fondy jen kotovaných akcií, hedge fondy, realitní fondy (Z1).
- **V7** Inkubátory a programy bez vlastního kapitálu (Z1).
- **V8** Jednorázová SPV a syndikáty pro jeden deal (zařazují se jejich účastníci).
- **V9** Andělské kluby a sítě (např. CBAA, Garage Angels, The Seeders, Lumus), pokud nemají vlastní fond. Investují jejich členové (Z3); vlastní fond klubu se posuzuje zvlášť.

**Mimo rozsah vzorku** (není vyřazení): skutečný investor splňující Z1–Z5, který do vzorku nepatří, tedy PE, family office a zahraniční fondy bez týmu v ČR. Dostane stav `mimo rozsah vzorku` s důvodem a v plné databázi se zařadí.

## 3. Šedá zóna

- **Korporátní VC:** zařadit jako VC s příznakem `cvc`, pokud má samostatný investiční program (fond, tým, web); strategické akvizice korporace ne. *Proč:* pro startup je to zdroj kapitálu jako VC.
- **Akcelerátory:** zařadit jako VC s příznakem `akcelerator`, jen pokud za účast získávají podíl a mají doložené investice, jinak vyřadit (V7). *Proč:* podíl ve firmě znamená investiční riziko.
- **Státní fondy:** přímo investující zařadit podle strategie s příznakem `verejny`, granty vyřadit (V3). *Proč:* vstupují do kapitálu; původ peněz je důležitá informace.
- **Fondy fondů:** nezařadit, evidovat v tabulce `lp` s vazbou na podpořené fondy; při přímých co-investicích zařadit podle nich. *Proč:* neinvestují přímo do firem (Z1), ale jsou dobrým zdrojem kandidátů.
- **Investiční holdingy podnikatelů:** firma s vlastní investiční značkou a strategií → VC/PE (bez LP s `vlastni_kapital`); holding jedné osoby bez nich → velký soukromý investor nebo angel; organizace spravující majetek rodiny → FO. *Proč:* značka, strategie a vlastnictví jsou ověřitelné.

## 4. Datový model

Každý údaj je samostatný fakt se zdrojem; přehledová tabulka se z faktů skládá. **Vzorek** = implementujeme ve vzorku VC v ČR, **návrh** = jen pro plnou databázi.

**Tabulky:**
- `investori` (vzorek): jeden řádek = jeden subjekt.
- `investice` (vzorek): `investor_id, cilova_firma, ico_cilove_firmy, datum_investice, faze_kola, castka_kola, castka_investora, typ_dokladu, url_zdroje, datum_zdroje, citace`.
- `fakta` (vzorek): `subjekt_id, pole, hodnota, url_zdroje, datum_zdroje, datum_overeni, citace, stav`.
- `snapshoty` (vzorek): `url, datum_stazeni, hash` (SHA-256). Kopie stránek leží v `data/raw/snapshoty/` (v `.gitignore`); do repozitáře jde jen tato tabulka.
- `kurzy` (vzorek): `mena, datum, kurz_vuci_eur, url_zdroje`.
- `fondy` (návrh): fondy pod investiční firmou (IČO, ročník, velikost).
- `lp` (návrh): fondy fondů a jejich vazby (kap. 3).

**Pole tabulky `investori`:**

| Pole | Hodnota | Vzorek / návrh |
|------|---------|----------------|
| `nazev` (dle rejstříku), `znacka`, `ico`, `zeme_sidla` (ISO 3166-1), `web` | text | vzorek |
| `typ` | VC / PE / FO / angel / velký soukromý investor | vzorek |
| `priznaky` | `cvc`, `akcelerator`, `verejny`, `vlastni_kapital` | vzorek |
| `sektory_deklarovane` / `sektory_portfolio` | číselník; z webu investora / z doložených investic | vzorek |
| `tiket_deklarovany` | rozsah částek z webu investora | vzorek |
| `tiket_z_investic` | min–max z `castka_investora` v doložených kolech; částka celého kola se použije, jen když byl investor jediný | vzorek |
| `faze` | pre-seed / seed / A / B+ / growth / buyout | vzorek |
| `kapital_celkem` | částka + druh (součet fondů / AUM / committed) | vzorek |
| `pocet_investic_24m`, `posledni_investice` | odvozeno z `investice` | vzorek |
| `stav` (aktivní / neaktivní / vyřazen + kód V1–V9 / mimo rozsah vzorku), `datum_kontroly` | výčet, datum | vzorek |
| `regulace_cnb` | správce / § 15 ZISIF / neregulováno; registr JERRS je za CAPTCHA | návrh |
| `geograficky_fokus`, `klicove_osoby` (jméno, role), `kontakt` (jen firemní) | seznam, text | návrh |

**Pravidla:** každá hodnota má `url_zdroje`, `datum_zdroje`, `datum_overeni` a `citace`. Nedoložená hodnota je prázdná se `stav = neověřeno`. Částky: `castka_puvodni, mena, kurz, datum_kurzu, castka_eur`; kurz je referenční kurz ECB k datu zdroje, o víkendu a svátcích poslední předchozí **[VOLBA]**. ECB kotuje vůči EUR, stačí jeden zdroj.

## 5. Postup ověření

Kdo krok dělá: kap. 11.

1. **Kandidáti:** seznamy ze zdrojů K1–K4, K6 a K7 (kap. 8) se zdrojem u každého kandidáta.
2. **Deduplikace** podle IČO, domény webu a normalizovaného názvu.
3. **Identita a stav:** IČO, sídlo a stav v ARES a obchodním rejstříku (Z4, Z5).
4. **Doklad investice (Z2):** aspoň jeden za 24 měsíců, přednost má rejstřík a tisková zpráva. Ukládá se URL, datum, citace a snapshot.
5. **Kontrola zdroje:** URL se načte, citace je doslovně ve snapshotu a hodnota je v citaci. Jinak se hodnota nezapíše („neověřeno“).
6. **Typ a příznaky** podle stromu:
   1. Označuje se jako family office, nebo spravuje majetek rodiny samostatná organizace? → FO.
   2. Vystupuje jako investiční firma (vlastní značka a veřejná investiční strategie)? → VC (rané fáze, menšinové podíly) nebo PE (zralé firmy, většinové podíly). Investuje z vlastních peněz zakladatelů či partnerů bez LP (zdroj to výslovně uvádí) → `vlastni_kapital = ano`, jinak „neověřeno“.
   3. Jinak jde o fyzickou osobu nebo její holding → velký soukromý investor (hranice v kap. 1), jinak angel.
   
   Když se deklarace liší od portfolia za 24 měsíců, rozhoduje portfolio a rozpor se zapíše.
7. **Sektory, fáze, tikety:** deklarované hodnoty z webu investora; `sektory_portfolio` a `tiket_z_investic` z doložených kol. Číselník sektorů definujeme před sběrem v `notes/`.
8. **Převod na EUR** kurzem ECB.
9. **Konflikt zdrojů:** rejstřík > web a tiskové zprávy investora > tisková zpráva cílové firmy > média > agregátory; při stejné úrovni platí novější datum.

## 6. Měření přesnosti

**Referenční pravda (plán):** ruční kontrola člověkem na náhodném vzorku 20 řádků; ostatní řádky kontroluje nezávislý AI agent, jehož spolehlivost měříme shodou s ruční kontrolou. **Stav k 2026-10-12:** člověk prošel týchž 22 řádků dvakrát. Nejdřív ověřil, zda je citace na stránce (`verdikt`), potom obsahově posoudil tvrzení (`verdikt_obsah`). Výsledky jsou v bodech 2 a 3 a v odstavci Přesnost. **Před kontrolou výstup sběru zmrazíme commitem** (commit dělá uživatel v GitHub Desktop). Opravy jdou do dalšího commitu; rozdíl mezi nimi ukáže ruční zásahy (kap. 11).

**Podklady.** `results/rucni-kontrola.csv` (166 řádků) generuje `src/03_rucni_kontrola.mjs`:
- **A – všichni kandidáti (75):** stav, důvod a hlavní doklad.
- **B – aktivní VC (31):** u každého nejnovější investice, která dokládá Z2.
- **C – náhodný vzorek 60 faktů:** 6 polí, která AI vykládala (typ, IČO, deklarované sektory, fáze, deklarovaný tiket, celkový kapitál), po 10 faktech, pevný seed 20261011 **[VOLBA]**.

Nahoře jsou subjekty, u kterých mohl vyčerpaný limit vyhledávání způsobit chybějící investice.

**Postup kontroly:**
1. **Nezávislý AI agent v samostatném sezení** zkontroluje všech 166 řádků. Nezná průběh sběru: smí číst jen `results/rucni-kontrola.csv` a PLAN.md (ne `data/`, ostatní soubory v `results/` ani `ai-log/`). U každého řádku otevře živou stránku z URL (ne uložený snapshot) a posoudí, jestli tvrzení z textu stránky plyne:
   - A: stav a důvod odpovídají Z1–Z5, V1–V9 a rozsahu vzorku; u `limit_vyhledavani = ano` a u neaktivních navíc hledá investice za posledních 24 měsíců.
   - B: investice proběhla, investorem je tento subjekt a datum spadá do okna Z2.
   - C: hodnota odpovídá textu stránky včetně převodu (číselník, měna, druh kapitálu, IČO správné entity).

   Zapíše `verdikt_ai` (správně / špatně / nelze ověřit) a `zduvodneni_ai` (jedna věta, u jiného zdroje než `url` s jeho URL). Sloupce člověka nemění. Verdikt „nelze ověřit“ dává, když se stránka nenačte (403, CAPTCHA, obsah jen přes JavaScript).
2. **Ruční kontrola 20 řádků** (`rucne = ano`), plán: člověk u každého řádku posoudí totéž co agent a vyplní verdikt (správně / špatně / nelze ověřit; zapsaný nakonec ve sloupci `verdikt_obsah`), `poznamka` a `minuty`, a to bez čtení `verdikt_ai`, aby ho agent neovlivnil **[VOLBA]**. Výběr dělá `src/04_vyber_rucni_kontroly.mjs`: kvóty úměrně velikosti oddílů (A 9, B 4, C 7, metoda největšího zbytku); řádky s už vyplněným `verdikt` jsou ve výběru vždy a započítají se do kvóty; zbytek losuje generátor mulberry32 se seedem 20261011 **[VOLBA]**. Řádky, jejichž `verdikt_ai` člověk viděl před kontrolou (A034, B097), se z losu vylučují a nahradí je další řádky v losovacím pořadí. Spory mezi kontrolory (A005, A028: dávka A investici v okně nenašla, oddíl B ji doložil z rejstříku) kontroluje člověk navíc (`rucne = spor`); do shody se nepočítají, protože verdikt AI u nich není slepý.

   **Co ruční kontrola skutečně měřila (2026-10-12).** Dva průchody týchž 22 řádků (20 losovaných a 2 spory), celkem 40 minut, tj. 1,8 min na řádek; minuty po řádcích zapsané nejsou.

   **Průchod 1 – přítomnost citace (`verdikt`), 10 minut celkem:**
   - **Metoda:** člověk u každého řádku hledal celou citaci přes Cmd+F na živé stránce z URL. Výsledek: „citace nalezena“ 14×, „citace nenalezena“ 8×.
   - **Rozbor nenalezených:** text citace na stránce je u všech osmi (`results/rucni-kontrola-rozbor.md`). Čtyři citace spojují více prvků stránky, jedna obsahuje zalomení řádku, dvě se od zobrazeného textu liší (HTML entita, mezera před čárkou) a jedna je název stránky.
   - **Co změřil:** zda je uložená citace souvislým doslovným úsekem viditelného textu živé stránky. Jde o přísnější ruční obdobu kroku 5 v kap. 5, bez normalizace. Napoprvé to platilo u 14 z 22 řádků, po rozboru je text citace na stránce u 22 z 22.

   **Průchod 2 – obsah (`verdikt_obsah`), 30 minut celkem:**
   - **Metoda a výsledek:** člověk posoudil, zda z citace plyne tvrzení v řádku. U všech 22 řádků je verdikt „správně“.
   - **Rozdíl kritérií:** u oddílu A posuzoval člověk jen to, co plyne z citace. AI navíc mimo citaci hledala doklad Z2 a tým v ČR (bod 1). U oddílů B a C posuzují oba totéž.
3. **Spolehlivost agenta** = shoda s ruční kontrolou na 20 losovaných řádcích, tj. podíl řádků, kde `verdikt_ai` = `verdikt_obsah`. Zvlášť uvádíme nezachycené chyby (agent „správně“, člověk „špatně“), protože nadhodnocují přesnost. Shoda z 20 řádků je jen hrubý odhad.

   **Výsledek (2026-10-12):**
   - **20 losovaných řádků:** shoda 20/20 = 100 %, 95% interval 84–100 % **[VÝPOČET]** (Wilson). Nezachycené chyby 0, falešně nahlášené chyby 0.
     - Oba kontroloři dali u všech 20 řádků „správně“. Vzorek tedy neobsahuje žádnou chybu a kappa nejde spočítat.
     - Shoda proto ukazuje jen to, že AI na náhodných řádcích nehlásí chyby neprávem. Neukazuje, jak spolehlivě chyby zachytí.
     - Oba losované řádky, které AI označila „špatně“ (A034, B097), byly z výběru vyloučeny, protože kontrola u nich nebyla slepá.
   - **Spory A005 a A028 (mimo shodu):** AI dala „špatně“, člověk „správně“, shoda 0/2. Člověk verdikt AI znal.
     - Pro verdikt člověka svědčí doklad investice v okně z rejstříku: StartupYard Batch 14 je společníkem wopee labs od 2025-04-02 (řádek B080), NEWTON University Angels s.r.o. je společníkem NerveCor od 2025-07-01 (řádek B102).
     - AI v oddílu A tyto doklady nenašla a chybu nahlásila neprávem.
   - **Verdikty AI „špatně“ mimo ruční kontrolu (8), ověřeno ve zdroji 2026-10-12:** 4 potvrzené a opravené (A023 jen stav, A064, A070, B097), 4 nejasné, data beze změny (A034, A045, C116, C127); viz `results/opravy.md`. Ve sporech AI neměla pravdu ani jednou ze dvou.

**Spotřeba AI kontroly (změřeno 2026-10-11, model claude-opus-5-5):**
- **Čas:** 21 min od zadání do zápisu všech 166 verdiktů (21:18–21:39). Kontrolu dělalo 9 agentů souběžně po dávkách 15–20 řádků; jejich čas dohromady 63 min, tj. asi 23 s na řádek, nejdelší dávka 18 min.
- **Tokeny agentů:** 385 volání API, vstup celkem 39,9 mil. tokenů (z toho 38,7 mil. čtení z cache, 1,2 mil. zápis do cache), tj. asi 240 tis. vstupních tokenů na řádek. Řídicí sezení (příprava dávek, výběr, úpravy PLAN.md): 32 volání, vstup 3,2 mil. tokenů (z toho 3,1 mil. z cache), výstup 36 tis. tokenů. Výstupní tokeny agentů přepis Claude Code nezaznamenal úplně, proto je neuvádíme (neověřeno).
- **Cena [VÝPOČET]:** 23,4–25,2 USD za celou kontrolu (agenti 16,6–18,3 USD, řídicí sezení 6,8 USD), tj. 0,14–0,15 USD na řádek. Ceník Claude Opus 5.5 z https://platform.claude.com/docs/en/about-claude/pricing.md (staženo 2026-10-12, shodný s 2026-10-11). Výstupní tokeny agentů jsou odhadnuté z délky obsahu, viz `results/naklady.md`.

**Přesnost** = správně / (správně + špatně). U 22 ručně kontrolovaných řádků platí `verdikt_obsah`, u ostatních `verdikt_ai`. „Nelze ověřit“ uvádíme zvlášť a v konzervativní variantě ho počítáme jako špatně.

**Výsledek přesnosti (2026-10-12) [VÝPOČET]**, 95% interval podle Wilsona:

| Oddíl | správně | špatně | přesnost | interval |
|-------|---------|--------|----------|----------|
| A záznamy | 70 | 5 | 93,3 % | 85,3–97,1 % |
| B investice | 30 | 1 | 96,8 % | 83,8–99,4 % |
| C pole | 58 | 2 | 96,7 % | 88,6–99,1 % |
| Celkem | 158 | 8 | 95,2 % | 90,8–97,5 % |

- „Nelze ověřit“ nebylo ani jednou, konzervativní varianta je proto stejná.
- Všech 8 „špatně“ je verdikt AI. Ověřením ve zdroji se 4 potvrdily (opraveno), 4 zůstávají nejasné; přesnost výstupu po ověření je 158–162 ze 166 (95,2–97,6 %, `results/presnost.md`).
- Bez ruční kontroly, jen podle `verdikt_ai`: 156 ze 166 (94,0 %).

**Metriky:**
- **Přesnost záznamů** (A): správný stav, typ a důvod podle Z1–Z5, V1–V9 a rozsahu vzorku.
- **Doložení aktivity** (B): investice je doložená a spadá do okna Z2.
- **Přesnost polí** (C): zdroj hodnotu obsahuje a je správně převedena (číselník, měna, druh kapitálu, IČO správné entity).
- **Chybně vyřazení** (A): vyřazení nebo „mimo rozsah“, kteří měli být ve vzorku.
- **Vyplněnost a platnost odkazů:** počítá skript.
- **Pokrytí:** podíl způsobilých subjektů z referenčního seznamu K5, které databáze obsahuje; K5 se ke sběru nepoužije.

**Šířka intervalu [VÝPOČET]** (95 %, Wilson):

| Oddíl | n | vše správně | 90 % správně |
|-------|---|-------------|--------------|
| A záznamy | 75 | 95–100 % | 82–95 % |
| B investice | 31 | 89–100 % | 75–97 % |
| C všechna pole | 60 | 94–100 % | 80–95 % |
| C jedno pole | 10 | 72–100 % | 60–98 % |

A a B pokrývají celý vzorek, takže pro těchto 75 subjektů výběrová chyba není; interval vyjadřuje přesnost postupu při použití na další subjekty. Přesnost jednotlivého pole z 10 faktů je jen orientační. U velké databáze se velikost vzorku určí vzorcem n₀ = 1,96² · p(1 − p) / e² (pro p = 0,5 a e = 5 p. b. asi 385).

## 7. Odhad rozsahu

Otevřeno 2026-10-10 a 2026-10-11, číslo ve zdroji dohledáno. Zdroje měří různé věci, **čísla nelze sčítat**.

### 7.1 Česko – co uvádějí zdroje

| Typ | Údaj | Co měří | Zdroj |
|-----|------|---------|-------|
| VC + PE | 27 | Řádní členové CVCA (spočítáno) | https://cvca.cz/clenstvi/radni-clenove/ (bez data) |
| VC + andělé | „300+ angel a VC investorů“ | Údaj České startupové asociace | https://ris3.gov.cz/sites/default/files/2025-09/01_Analyza%20startupoveho%20ekosystemu%20v%20Cesku.pdf (2025) |
| FO | „nižší desítky rodinných kanceláří“ | Odhad společnosti EMUN | E15, https://www.e15.cz/byznys/superholding-amalar-prevzal-skupinu-ppf-bohate-rodiny-v-cesku-nasedly-na-trend-rodinnych-kancelari-1417807 (2024-10-31) |
| Andělé | 3 sítě, 340 andělů, 70 investic | „Visible market“ 2024 (členové sítí) | EBAN, https://www.eban.org/wp-content/uploads/2025/12/Stats-Compendium-2024.pdf (2025-12) |
| Velký soukromý | 2 270 | Majetek ≥ 30 mil. USD (Knight Frank 2026), ne investiční činnost | Euronews, https://www.euronews.com/2026/05/07/europes-ultra-rich-club-grew-by-26-in-five-years-led-by-germany (2026-05-06) |

Počet VC ani PE firem se sídlem v ČR žádný nalezený zdroj neuvádí.

### 7.2 Svět – co uvádějí zdroje

| Typ | Údaj | Co měří | Zdroj |
|-----|------|---------|-------|
| VC | 2 984 | VC firmy v USA s fondem za posledních 8 ročníků (2025) | NVCA, https://nvca.org/wp-content/uploads/2026/04/NVCA-2026-Yearbook-4.9.26.pdf (2026-04) |
| VC | 1 249 | Firmy s VC investicí do evropských firem v roce 2025 | Invest Europe, https://www.investeurope.eu/media/2icnrmzc/20260507-invest-europe-activity-data-report-2025.pdf (2026-05) |
| PE vč. VC | 1 854 | Totéž pro všechny PE investice | Tamtéž |
| VC | Izrael 242, Korea 253, Japonsko 176, Kanada 92 | VC firmy podle sídla: správci (IVC, H1 2025); registrované VC společnosti (KVCA, 06/2026); VC členové JVCA (04/2026); aktivní správci (BDC, 2025) | https://www.gornitzky.co.il/wp-content/uploads/2025/09/IVC_GNY_KPMG_INVESTORS-REPORT-H1_2025_Final.pdf ; http://diva.kvca.or.kr/div/cmn/DivDisclsMainInq ; https://www.fsa.go.jp/singi/vc/siryou/20260618/03.pdf (2026-06-18) ; https://www.bdc.ca/globalassets/digizuite/62218-bdc-canada-venture-capital-landscape.pdf (2026-05) |
| PE vč. VC | Čína 11 087; Indie 2 038 | Registrovaní správci PE a VC dohromady (AMAC, 08/2026); registrované fondy AIF, ne firmy (SEBI, 2026-10-11) | https://www.amac.org.cn/sjtj/tjbg/smjj/202609/P020260924626051449295.pdf ; https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=16 |
| VC; PE vč. VC | 21 254; 31 653 | Aktivní firmy v databázi Preqin, celý svět; všech správců PE vč. VC 35 626, z toho Asie 10 154 (Čína 5 835, Indie 828) | https://www.preqin.com/data/venture-capital ; https://www.preqin.com/data/private-equity ; https://www.preqin.com/data/data-coverage-map-view (bez data) |
| FO | 8 030 (Evropa 2 020) | Single family office, odhad 2024 | Deloitte, https://www.deloitte.com/content/dam/assets-shared/docs/services/deloitte-private/2024/2024-defining-the-family-office-landscape-executive-report.pdf (2024) |
| Andělé | cca 47 610 | Evropa, členové sítí (2024) | EBAN, viz 7.1 |
| Andělé | 445 535 | Odhad aktivních andělů v USA (2024) | UNH, https://paulcollege.unh.edu/sites/default/files/media/2025-12/FY%202024%20Analysis%20Report%20Final.pdf (datum vydání neověřeno) |
| Velký soukromý | 713 626 | Majetek > 30 mil. USD (2026) | Knight Frank, https://www.knightfrank.com/research/article/2026/4/wealth-sizing-model-2026-results (2026-04-23) |

### 7.3 Spolehlivost dat podle studií

- Crunchbase a Dealroom se shodují asi u 30 % subjektů; údaj o investorech má asi 73 % dealů (OECD, https://www.oecd.org/content/dam/oecd/en/publications/reports/2026/03/the-oecd-start-ups-database_6b7828eb/be8e5317-en.pdf, 2026-03).
- „Nearly half of all venture investors active in 2021 have since exited the market“ (NVCA 2026), takže data rychle stárnou.
- Databáze v letech 1986–1999 vynechaly zhruba 15 % kol a 20 % kapitálu (Kaplan, Sensoy, Strömberg, pracovní verze 2002, https://web.archive.org/web/20221002215846id_/https://www.hhs.se/contentassets/dd8251e6b9f041bf83865e5a47e687c1/kaplansensoystrombergwp2002.pdf).

### 7.4 Odhad pro naši databázi

Záznamy splňující Z1–Z5 získatelné z veřejných zdrojů. Podíly doložitelných subjektů jsou **[PŘEDPOKLAD]**, rozsahy **[VÝPOČET]** zaokrouhlené na 2 platné číslice; zpřesní je vzorek.

| Typ | ČR | Odvození ČR | Svět | Odvození svět | Spolehlivost [PŘEDPOKLAD] |
|-----|----|-------------|------|---------------|---------------------------|
| VC | 20–70 | Min: K4 má 22 firem a programů (27 − 4 jednotlivci − souhrnná položka „Angel investors“), aspoň 20 splní Z1–Z5. Max: 80 unikátních položek v K1–K4 (52 + 20 z K2 + 0 z K3 + 8 z K4) − 4 jednotlivci − 3 asociace − 17 PE − 1 dluhový člen CVCA = 55, + 0–15 z K5–K7. | 5 000–21 000 | Min: VC firmy podle sídla USA 2 984 + Evropa 1 249 + Korea 253 + Izrael 242 + Japonsko 176 + Kanada 92 = 4 996. Čína, Indie, Latinská Amerika, Afrika a Blízký východ = 0 (chybí počet aktivních VC firem). Max: Preqin 21 254 aktivních VC firem, celý svět vč. Asie. | Vysoká: investice oznamují. |
| PE | 12–25 | 17 členů CVCA s typem PE × 70–100 % (Z2, působení v ČR) = 12–17; max + 2 členové nejasného typu + 0–6 mimo CVCA. CVCA tvrdí, že zastupuje „téměř všech PE&VC fondů působících v ČR“; přitom nejméně 16 z 22 firem a programů, které K4 uvádí jako aktivní VC investory, není jejím řádným členem. Jeden zdroj proto nestačí. | 5 600–32 000 | Zahrnuje i VC, s řádkem VC nesčítat. Min: jako u VC, ale Evropa 1 854 (USA bez PE, zdroj chybí) = 5 601. Max: Preqin 31 653 aktivních firem. Čínu může max podhodnocovat: AMAC registruje 11 087 správců PE a VC, Preqin v Číně eviduje 5 835. | Střední: transakce veřejné, částky často ne. |
| FO | 2–24 | „Nižší desítky“ = 10–40; doložitelných 20–60 %. | 1 600–4 800 | 8 030 × 20–60 %. | Nízká: FO jsou diskrétní. |
| Angel | 68–200 | 340 (EBAN) × 20–60 %. | 14 000–51 000 | Evropa 47 610 × 20–60 % + USA 445 535 × 1–5 % (americký odhad zahrnuje i neveřejné anděly). | Nízká až střední: EBAN uvádí, že data aktivitu podhodnocují. |
| Velký soukromý | 23–110 | 2 270 × 1–5 %. | 7 100–36 000 | 713 626 × 1–5 %. | Nízká: majetek neříká nic o investicích. |
| **Celkem ČR** | **130–440** | Součet řádků před zaokrouhlením. | | | |

Nejméně spolehlivá pole budou tiket a celkový kapitál; částky se často nezveřejňují **[PŘEDPOKLAD]**.

## 8. Vzorek VC fondů v ČR: zdroje kandidátů

Otevřeno 2026-10-10; počty spočítány ručně, není-li uvedeno jinak.

| # | Zdroj | Obsah a rozsah | Pozn. |
|---|-------|----------------|-------|
| K1 | CzechInvest – Investoři, https://czechstartups.gov.cz/startup-ekosystem/investori/ | 52 karet včetně asociací a crowdfundingu | Bez data aktualizace. |
| K2 | CVCA – řádní členové, https://cvca.cz/clenstvi/radni-clenove/ | 27 členů, 17 s typem investic PE | Profily vyplňují členové. |
| K3 | EIF – equity fund partners ČR, https://www.eif.org/files/attachments/czechia-equity-fundmanagers.pdf | 7 fondů s týmem v ČR, z toho 3 VC; „as at 30 September 2026“ | Jen fondy s podporou EIF. |
| K4 | Analýza startupového ekosystému v Česku (CzechInvest/RIS3, 2025, CC BY 4.0), https://ris3.gov.cz/sites/default/files/2025-09/01_Analyza%20startupoveho%20ekosystemu%20v%20Cesku.pdf | Obr. 17: 27 aktivních investorů (Dealroom 2025) | Seřazeno podle aktivity. |
| K5 | CEE Funding Map, https://www.pampam.city/funds-poland-BJpHbykKoXoBaILayYBs ; oznámení https://czechinvest.gov.cz/en/Homepage/Novinky/Kveten-2026/CEE-Funding-Map-prinasi-prehled-aktivnich-investor (2026-05-22) | Jen VC s aspoň 2 investicemi ročně, aktualizace po 6 měsících; počet neuveden | **Referenční seznam pro pokrytí**, ke sběru se nepoužije. Není zcela nezávislý (spolupracoval CzechInvest). |
| K6 | Czechia Dealroom, https://czechia.dealroom.co/intro | „over 650 investors“ podle CzechInvest, nejen z ČR | Vrací HTTP 403, jen ručně. |
| K7 | CzechCrunch – Nejaktivnější fondy 2025, https://cc.cz/startupovecesko/ | Jména jen v grafu (obrázek) | Jen ručně. |

**Zdroje pro ověření:**

- **Veřejný rejstřík a Sbírka listin**, https://or.justice.cz/ias/ui/rejstrik: identita a stav. U s.r.o. se zapisují všichni společníci a výše podílu (§ 48 odst. 1 písm. j) zák. č. 304/2013 Sb.), u a.s. jen jediný akcionář (písm. k)).
- **ARES REST API**, https://ares.gov.cz/: IČO, sídlo a společníci strojově.
- **Registr ČNB (JERRS)**, https://jerrs.cnb.cz/apljerrsdad/JERRS.WEB07.INTRO_PAGE?p_lang=cz: regulované subjekty; seznamy za CAPTCHA, jen ručně.
- **Kurzy ECB**, https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip: historie kurzů vůči EUR (CZK ověřena v https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml).

České VC fondy bývají zahraniční struktury (např. SCSp, U.A., viz K3), proto je ověřujeme přes správcovskou společnost v ČR.

## 9. Ochrana osobních údajů (fyzické osoby)

Nejde o právní posouzení; před ostrým provozem ho musí udělat právník.
- **Vzorek:** jen právnické osoby, výstupy neobsahují osobní údaje. Snapshoty z rejstříku obsahují data narození a adresy (§ 25 odst. 1 písm. e) zák. č. 304/2013 Sb.), proto zůstávají mimo git.
- **Právní titul (plná databáze):** oprávněný zájem (čl. 6 odst. 1 písm. f) GDPR) s testem „three cumulative conditions“ podle EDPB Guidelines 1/2024 (verze pro konzultaci, „Adopted on 8 October 2024“). Zveřejnění údaje podle nich „does not automatically mean“, že ho lze takto zpracovat.
- **Koho zařadíme:** jen osobu, která sama veřejně vystupuje jako investor. Ukládáme jméno, roli a doložené investice, nikdy datum narození, adresu ani soukromé kontakty („minimalizace údajů“, čl. 5 odst. 1 písm. c)).
- **Informování:** osobu informujeme „nejpozději do jednoho měsíce“ (čl. 14 odst. 3 písm. a)), včetně zdroje údajů (čl. 14 odst. 2 písm. f)). Na výjimku „nepřiměřené úsilí“ (čl. 14 odst. 5 písm. b)) nespoléháme: polský NSA v případu Bisnode potvrdil povinnost informovat osoby z veřejných rejstříků a výjimku vyložil úzce (UODO, 2023-09-20, https://uodo.gov.pl/en/553/1572).
- **Údaje z obchodního rejstříku** použijeme jen k internímu ověření; ÚOOÚ v protokolu UOOU-02127/19-37 (2019-11-13) uvedl, že „není možné obchodní rejstřík překlápět“ (https://uoou.gov.cz/media/poskytnute-informace/412021/uoou-0212719-37.pdf).
- **Námitka** (čl. 21 GDPR): osobu smažeme a zapíšeme na seznam vyloučených.
- Zdroje: GDPR https://eur-lex.europa.eu/legal-content/CS/TXT/HTML/?uri=CELEX:32016R0679 ; EDPB https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202401_legitimateinterest_en.pdf

## 10. Nejasnosti v zadání a rozhodnutí

- **Co je „spolehlivá“ databáze?** Každý údaj je dohledatelný ke zdroji s datem a přesnost je změřená (kap. 6). Prázdné pole má přednost před nedoloženým.
- **„VC fondy v ČR“: sídlo, nebo aktivita?** Sídlo správce či fondu v ČR, nebo stálý investiční tým v ČR. Zahraniční fondy, které jen investovaly do české firmy, mají stav „mimo rozsah vzorku“.
- **Záznam = fond, nebo správce?** Investiční firma (značka/správce); jednotlivé fondy jsou v tabulce `fondy`.
- **Co je „aktivní“ investor?** Doložená investice za 24 měsíců (Z2).
- **Hranice angel / velký soukromý / FO / VC a PE z vlastních peněz:** kap. 1 a strom v kap. 5.
- **„Celkový kapitál“: AUM, committed, nebo velikost fondů?** Ukládá se údaj ze zdroje i s jeho druhem; druhy se nesčítají.
- **Měna a kurz:** EUR, referenční kurz ECB k datu zdroje.
- **Formát výstupu:** CSV v UTF-8 v `results/`, popis polí v README.

## 11. Kdo co dělá

Společné pokyny pro AI agenty: pravidla z CLAUDE.md, výstup jako JSON `{hodnota, url, datum_zdroje, citace}`, nic z paměti modelu; co agent nedoloží, vrátí jako „neověřeno“.

1. **Kandidáti – AI agent + člověk.** Agent ze stránek K1–K4 vypíše jen názvy a URL investorů s citací. K6 (HTTP 403) a K7 (graf) prochází člověk.
2. **Deduplikace – skript + člověk.** Normalizace názvu, domény a IČO; nejisté shody (např. „N1“ v K1 a „Nation1“ v K2) rozhodne člověk.
3. **Identita a stav – skript + člověk.** ARES REST API (hledání podle názvu, IČO, sídlo, stav); více shod rozhodne člověk.
4. **Doklad investice – AI agent + skript.** Agent hledá doklady za 24 měsíců, nejvýše 5 na investora **[VOLBA]**. Skript u cílové s.r.o. ověří v ARES, že investor je mezi společníky.
5. **Kontrola zdroje – skript.** Stáhne stránku do snapshotu, zapíše hash, ověří HTTP 200 a doslovnou shodu citace (po normalizaci mezer) i hodnoty v citaci.
6. **Typ a příznaky – AI agent + člověk.** Agent navrhne typ podle stromu s citací ke každé větvi; člověk schválí každý návrh.
7. **Sektory, fáze, tikety – AI agent + skript.** Agent čte deklarované hodnoty a třídí cílové firmy jen do číselníku; skript počítá `sektory_portfolio`, `tiket_z_investic`, `pocet_investic_24m`.
8. **Převod na EUR – skript.** Kurzy ECB z `eurofxref-hist.zip`.
9. **Konflikt zdrojů – skript + člověk.** Pořadí z kap. 5; rozpory na stejné úrovni rozhodne člověk.

**Kontrola (kap. 6) – nezávislý AI agent (všechny řádky) + člověk (20 řádků)**, po zmrazení výstupu commitem.

**Co ve vzorku měříme pro odhad nákladů na celý svět** (po záznamech, log v `ai-log/`):

- **Tokeny a cena API na záznam:** vstupní a výstupní tokeny z odpovědí API; cena podle ceníku platného v den měření (URL a datum ceníku uvedeme ve výsledcích).
- **Minuty ruční práce na záznam:** ruční log začátku a konce práce na záznamu (kontrola, CAPTCHA, rozpory).
- **Podíl záznamů s ručním zásahem:** záznamy, kde člověk změnil hodnotu nebo udělal krok místo skriptu či agenta; z rozdílu mezi zmrazeným a opraveným commitem a z logu.
- **Podíl hodnot zamítnutých kontrolou citace:** z logu kroku 5.

**Naměřeno ve vzorku (2026-10-12):** ruční kontrola 22 řádků trvala 40 min (kontrola citací 10 min, obsahová kontrola 30 min), tj. 1,8 min na řádek. Tokeny a cena ze záznamů sezení jsou v `results/naklady.md`.

**Odhad nákladů [VÝPOČET]:** součet přes typy N_typ × (cena API na záznam + minuty na záznam × hodinová sazba / 60), N_typ z 7.4. **[PŘEDPOKLAD]** VC v ČR jsou nejlépe zdokumentovaný typ, jinde bude ručních zásahů víc, takže jde o dolní odhad.
