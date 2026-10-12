# Odhad nákladů na databázi pro celý svět

Sestaveno 2026-10-12 podle PLAN.md, kap. 11. Značky: **[VÝPOČET]** = odvozeno z čísel níže, **[PŘEDPOKLAD]** = odhad bez přímého zdroje. Výsledek je rozsah, ne bodový odhad.

## Vstupy

| Vstup | Hodnota | Zdroj |
|-------|---------|-------|
| Ceník Claude Opus 5.5 (USD / milion tokenů) | vstup 4, zápis do cache 5 (5 min) a 8 (1 h), čtení z cache 0,20, výstup 20 | https://platform.claude.com/docs/en/about-claude/pricing.md, staženo 2026-10-11 a 2026-10-12 (shodné) |
| Webové vyhledávání | 10 USD za 1 000 dotazů | tamtéž |
| Batch API | sleva 50 % na vstupní i výstupní tokeny | tamtéž |
| Tokeny | součty `usage` ze záznamů sezení Claude Code, každá zpráva API jednou; po úkolech v `results/naklady-tokeny.csv` | `src/07_naklady.mjs` |
| Ruční práce | 40 min na 22 řádků (citace 10 min, obsah 30 min), tj. 1,82 min na řádek | ruční kontrola 2026-10-12, PLAN.md kap. 6 |
| Počty investorů ve světě | PE vč. VC 5 600–32 000, FO 1 600–4 800, andělé 14 000–51 000, velcí soukromí investoři 7 100–36 000 | PLAN.md, 7.4 (řádek „PE vč. VC“ obsahuje i VC, proto se VC zvlášť nepřičítá) |

**Omezení záznamů:** u agentů Claude Code ukládá `usage` ze začátku streamované odpovědi, takže výstupní tokeny v záznamu chybí. Vstupní a cachované tokeny jsou přesné. Výstup odhaduje `src/07_naklady.mjs` z délky vygenerovaného obsahu: 3–4 znaky na token a skryté myšlení 0 až 0,92× viditelného výstupu, což je poměr naměřený v hlavním sezení, které ukládá konečné `usage` **[PŘEDPOKLAD]**. Výstup tvoří jen malou část ceny, většinu tvoří čtení z cache.

## Skutečné náklady vzorku (ze záznamů sezení)

| Úkol | Čtení z cache | Zápis do cache | Výstup | Vyhledávání | Cena USD |
|------|---------------|----------------|--------|-------------|----------|
| Ověření 76 kandidátů (8 agentů) | 145,9 mil. | 3,3 mil. | 0,18–0,46 mil. | 206 | 51,4–57,0 |
| AI kontrolor 166 řádků (9 agentů a řídicí sezení) | 46,6 mil. | 1,6 mil. | 0,15–0,23 mil. | 169 | 23,4–25,2 |
| Rešerše pro plán (6 agentů) | 67,6 mil. | 1,4 mil. | 0,18–0,24 mil. | 188 | 25,9–27,1 |
| Hlavní sezení (plán, skripty, koordinace; stav 2026-10-12 19:15) | 102,8 mil. | 2,3 mil. | 0,45 mil. | 0 | 47,8 |
| **Celkem** | 362,9 mil. | 8,6 mil. | 0,96–1,38 mil. | 563 | **148,6–157,0** |

**Jednotkové náklady [VÝPOČET]:**
- Ověření: 0,68–0,75 USD na kandidáta (51,4–57,0 USD / 76), 2,7 vyhledávání a 10 agentominut na kandidáta.
- AI kontrola: 0,14–0,15 USD na kontrolní řádek, tj. 0,31–0,34 USD na kandidáta (166 řádků na 75 kandidátů).
- Rešerše pro plán a hlavní sezení jsou jednorázové náklady, nenásobí se počtem záznamů.

## Odhad pro celý svět

**Kandidátů na jeden záznam [VÝPOČET z vzorku, PŘEDPOKLAD, že poměr platí obecně]:** ve vzorku je 74 kandidátů a po opravách 55 záznamů, které by patřily do celé databáze (29 aktivních VC a 26 investorů mimo rozsah vzorku), tj. 1,35. Pro samotné VC je to 74 / 29 = 2,55. Rozsah tedy 1,35–2,55 kandidátu na záznam.

**AI ověření [VÝPOČET]:** N záznamů × kandidátů na záznam × 0,68–0,75 USD.

| Typ | Záznamů (7.4) | AI ověření USD |
|-----|---------------|----------------|
| PE vč. VC | 5 600–32 000 | 5 100–61 000 |
| Family office | 1 600–4 800 | 1 500–9 200 |
| Andělé | 14 000–51 000 | 13 000–98 000 |
| Velcí soukromí investoři | 7 100–36 000 | 6 500–69 000 |
| **Celkem** | **28 300–123 800** | **26 000–240 000** |

| Položka | Rozsah |
|---------|--------|
| AI ověření (tabulka výše) | 26 000–240 000 USD |
| Nezávislá AI kontrola všech kandidátů [VÝPOČET] | 12 000–110 000 USD |
| **AI celkem s kontrolou** | **38 000–350 000 USD** |
| Možná úspora: Batch API −50 % [PŘEDPOKLAD, že ověření jde přepsat z Claude Code na Batch API] | 19 000–175 000 USD |
| Ruční kontrola vzorku: 5 typů × 73–385 řádků (vzorec kap. 6 pro p = 0,95 až 0,5, e = 5 p. b.) × 1,82 min [VÝPOČET] | 11–58 hodin |
| Čas agentů: 38 000–316 000 kandidátů × 10 agentominut [VÝPOČET] | 6 300–53 000 agentohodin; při 50 souběžných agentech 130–1 050 hodin [PŘEDPOKLAD paralelismu] |
| Webová vyhledávání: 2,7 na kandidáta [VÝPOČET] | 100 000–860 000 dotazů (1 000–8 600 USD, v ceně AI ověření už jsou) |

## Předpoklady a proč může být skutečnost jiná

1. **Cena na kandidáta je změřená jen na VC v ČR** [PŘEDPOKLAD, že platí i pro ostatní]. U andělů, family office a velkých soukromých investorů je méně veřejných dokladů a v zemích mimo EU jsou zdroje v jiných jazycích. Cena na záznam tam bude spíš vyšší.
2. **Poměr kandidátů na záznam** pochází ze 74 kandidátů z kurátorovaných seznamů. Ze širších zdrojů (agregátory) bude podíl nezpůsobilých kandidátů vyšší.
3. **Výstupní tokeny agentů** jsou odhad (viz výše). Rozdíl mezi dolní a horní mezí je asi 10 % ceny.
4. **Ceník** je katalogový pro Claude API. Claude Code v rámci předplatného se účtuje jinak, takže skutečná platba za vzorek mohla být jiná.
5. **Ruční práce** zahrnuje jen kontrolu vzorku pro měření přesnosti. Nezahrnuje řešení nejasných případů (ve vzorku 10 ze 166 řádků s nálezem AI, z toho 4 nejasné), rozhodování o duplicitách, informování fyzických osob podle GDPR (kap. 9) ani opravu 28 % citací spojujících více prvků stránky.
6. **Limit 200 vyhledávání na tah** v Claude Code se ve vzorku vyčerpal. Ve světovém rozsahu je nutný vlastní běh přes API, kde limit není a platí cena za dotaz.
