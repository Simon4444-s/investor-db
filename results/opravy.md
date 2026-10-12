# Opravy dat po ruční kontrole (2026-10-12)

Data se opravovala až po zmrazení výstupu a po obou kontrolách (ruční a AI kontrolor). Opravy provedl skript `src/05_opravy.mjs`, který zapsal každou změnu do `data/overeni/opravy-log.json` (64 záznamů). Sloučení duplicit je v `data/kandidati_rozhodnuti.csv`. Poté proběhla nová kontrola (`src/02_overeni.mjs`) proti verzím stránek z 2026-10-12. Odstraněné fakty a investice se nemazaly: jsou v polích `nahrazena_fakta` a `vyrazene_investice` příslušného JSON s důvodem.

## Výsledek

| Stav | Před opravami | Po opravách |
|------|---------------|-------------|
| aktivní | 31 | 29 |
| neaktivní (V4) | 5 | 7 |
| mimo rozsah vzorku | 25 | 26 |
| vyřazen | 14 | 12 |
| **kandidátů** | **75** | **74** |

Změnilo se 5 záznamů (CVI, Enern, Kaya VC, KB SmartSolutions, Limerock). Žádný jiný fakt ani investice nezměnily stav, ani při kontrole proti dnešním verzím stránek.

## 1. Sloučení Enern a Kaya VC

- Rozhodnutí uživatele z 2026-10-11 („sloučit po ruční kontrole“) je zapsané v `data/kandidati_rozhodnuti.csv`. ARES: IČO 10838821 „KAYA (fka Enern) s.r.o.“.
- Záznam se vede jako **Kaya VC**, s identitou KAYA Advisory s.r.o. (IČO 22585737, správce fondu Kaya 5 podle EIF). IČO z původního záznamu Enern (01790765) se nepřebírá.
- Kaya VC převzala 2 investice, které měl jen Enern: Viktor (2026-05-19) a Jutro Medical (2025-12-16). TopK a Riptides byly v obou záznamech, započítají se jednou. Kaya VC má teď 5 investic.

## 2. Rozhodnutí podle V9

- **NEWTON University Angels:** beze změny, zůstává VC. Ruční kontrola (A028) potvrdila typ VC, protože subjekt má vlastní fond a V9 se uplatní jen na kluby bez fondu.
- **Flying Founders:** beze změny (VC, `vlastni_kapital = ano`). Mezi 22 ručně kontrolovanými řádky nebyl, rozhodnutí podle V9 tedy zatím neproběhlo. AI kontrolor řádky A015 i B089 označil jako správné.
- V PLAN.md (V9) jsou příklady andělských klubů upravené na subjekty, které skutečně byly vyřazeny (CBAA, Garage Angels, The Seeders, Lumus). NEWTON a Flying Founders jsem z příkladů vyřadil.

## 3. Chyby z rozboru ruční kontroly citací

| Řádek | Vada | Oprava |
|-------|------|--------|
| B087, B099 | Uložená citace obsahovala HTML entity a mezeru před čárkou za odkazem. | **Kořenová příčina v našem kódu:** převod HTML na text (`src/lib/text.mjs`) nedekódoval pojmenované entity a kolem řádkových značek (`<a>`, `<span>`) vkládal mezeru. Opraveno a 49 citací převedeno na skutečný viditelný text (mj. „Tilia Impact V entures“ → „Tilia Impact Ventures“). |
| A005, A008, A041, A062 | Citace spojovala několik prvků stránky. | Nahrazeno souvislým úryvkem jednoho prvku, který hodnotu dokládá. U A008 navíc nová URL https://tilia.vc/ (stará adresa přesměrovává); totéž u 2 dalších faktů Tilie. |
| A027 | Doklad byl jen v `<title>`. | Převod textu nově vynechává `<head>`. Citace nahrazena viditelným textem n1.rocks: „We invest early and stay for the journey. …“ |
| 3TS (3 fakty) | Stejná vada jako A027: citace z `<title>` nebo z více prvků. Ruční kontrola je nezachytila, odhalil je nový převod. | Nahrazeno viditelnými úryvky (typ, sídlo, web). |
| C131 | Citace přes zalomení řádku `<br>`. | Bez změny dat. Převod nově bere `<br>` jako mezeru, ne jako hranici prvku. |

**Neopraveno:** nový příznak `citace_jeden_prvek` ve výstupech ukazuje, že 143 z 503 ověřených citací (28 %) spojuje více prvků stránky, stejně jako A005 nebo A041. Hodnoty ve zdroji jsou, ale citace není souvislý úryvek. Oprava znamená vybrat nové citace a nechat je znovu zkontrolovat; patří do dalšího kola (viz README, Co chybí).

## 4. Chyby nahlášené jen AI kontrolorem

U každé jsem důkaz ověřil přímo ve zdroji 2026-10-12. Opraveny jsou jen ty, kde je chyba jasná.

| Řádek | Nález AI | Ověření ve zdroji | Rozhodnutí |
|-------|----------|-------------------|------------|
| B097 | Odkup 4 % v Upvestu není VC investice. | Uložená citace (CzechCrunch) sama uvádí: „…v Upvestu držela podíl na úrovni 96 procent, teď oznámila finální odkup i zbývajících čtyř procent.“ ARES: KB SmartSolutions je společníkem Upvestu od 2020-07-01. Jde o dokončení strategické akvizice (kap. 3). | **Opraveno:** investice vyřazena jako doklad Z2. |
| A023 | KB SmartSolutions drží strategické většinové podíly, nejde o VC. | Důsledek B097: jiná investice v okně není doložena. Zda jde o CVC s vlastním programem, ze zdrojů jednoznačně neplyne. | **Opraveno částečně:** stav aktivní → neaktivní (V4). Typ VC/CVC beze změny, k rozhodnutí. |
| A064 | CVI není čistě dluhový investor, V5 neplatí. | https://cvi.pl/en/looking-for-financing/how-can-we-help/: „Instruments offered: … convertible debt and private equity“ a „In the case of private equity investments, we are looking for minority packages with a strong partner“. | **Opraveno:** vyřazen (V5) → mimo rozsah vzorku (PE). Nové fakty `typ` a `duvod` s citacemi; původní fakt V5 v `nahrazena_fakta`. |
| A070 | Neaktivní fond má mít stav „neaktivní (V4)“, ne „vyřazen (nesplňuje Z2)“. | PLAN.md, V4: „Záznam zůstane se stavem neaktivní.“ Doklad (SFDR: žádné investiční rozhodnutí od 1. 11. 2016) beze změny. | **Opraveno:** stav → neaktivní (V4). |
| A034 | Impulse Ventures měl follow-on v Safetice (2025), V4 je sporné. | https://en.ain.ua/2025/01/24/safetica-announces-a-4m-investment píše, že kolo vedl zakladatel jako osoba („Czech entrepreneur …, co-founder and CEO at Impulse Ventures, led the investment round“); tisková zpráva Safetiky podle agenta uvádí Impulse Capital. Že investoval fond Impulse Ventures, ze zdrojů neplyne. | **Neopraveno:** chyba není jasná. |
| A045 | Heartcore má investora v Praze, „bez týmu v ČR“ je sporné. | Stránka týmu heartcore.com uvádí ve filtru lokalit „Prague“ a jednoho investora s lokalitou Praha. Zda jeden člověk tvoří „stálý investiční tým v ČR“ (kap. 10), je úsudek. | **Neopraveno:** k rozhodnutí. |
| C116 | AgriBoom se deklaruje spíš jako PE. | Web agriboom.com uvádí obě strategie: VC (tikety od 10 tisíc do 4 mil. EUR) i „Private Equity investiční strategie“ (firmy s obratem 10–150 mil. EUR). | **Neopraveno:** typ VC zdroji neodporuje jednoznačně. |
| C127 | Soulmates: sektory převádějí jen 5 z 8 oblastí. | Citace uvádí air, water, energy, mobility, food and agriculture, education, healthcare, circular economy. Air, water a circular economy lze podle číselníku zařadit pod `energie` (Energetika a klima: cleantech, ESG), která v hodnotě je. | **Neopraveno:** jde o výklad číselníku, ne jasnou chybu. Zpřesnit číselník. |

## 5. Spory A005 a A028

Oba spory rozhodla ruční kontrola, data beze změny. Rozbor je v `results/presnost.md`, oddíl 3.

## 6. Ostatní neopravené případy

- **Startovač:** první citace důvodu (V2) na startovac.cz neprošla už při kontrole 2026-10-11 (obsah stránky se mění). Druhá citace téhož důvodu (czechstartups.gov.cz) platí, vyřazení je doložené.
- **Tilia:** hodnota pole `web` zůstává https://tiliaimpactventures.cz/. Adresa funguje, jen přesměrovává; jestli web uvádět jako tilia.vc, rozhodne uživatel.
