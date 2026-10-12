# Body k ruční kontrole a rozhodnutí (krok 2)

Sestaveno 2026-10-11 z hlášení AI agentů a z výstupu `src/02_overeni.mjs`. Podrobnosti a doklady jsou v poli `poznamka` v `data/overeni/kandidati/<kandidát>.json`. Rozhodnutí uživatele z 2026-10-11 jsou u bodů vyznačena **Rozhodnuto**. Verdikty se zapisují do `results/rucni-kontrola.csv` (kap. 6 PLAN.md).

## Duplicity

1. **Enern = Kaya VC?** Agent dávky 4 zjistil, že se Enern přejmenoval na KAYA. V ARES je subjekt IČO 10838821 „KAYA (fka Enern) s.r.o.“ (ověřeno 2026-10-11). Oba záznamy jsou teď aktivní VC, takže se investice TopK a Riptides počítají dvakrát. **Rozhodnuto:** sloučit až po ruční kontrole.
2. **N1 = Nation1** bylo sloučeno podle dokladů. Rozhodla AI, viz `data/overeni/n1-nation1.json`. Lucemburská registrační čísla správců jsou z North Data (sekundární kopie rejstříku). Potvrdit.

## Zařazení podle pravidel

3. **Flying Founders.** V PLAN.md je ve V9 jako příklad andělského klubu, ale podle zdrojů je to firma, která investuje vlastní kapitál. Jediná investice v okně je odkup newsletteru (buyout). Splňuje Z1 a Z2? **Rozhodnuto:** uživatel posoudí v ruční kontrole podle V9.
4. **NEWTON University Angels.** Je ve V9 jako příklad klubu, ale má vlastní fond (s.r.o., osoba rizikového kapitálu), proto VC. Potvrdit. **Rozhodnuto:** uživatel posoudí v ruční kontrole podle V9.
5. **KB SmartSolutions (CVC).** Jediná investice v okně je odkup posledních 4 % v Upvest. Jde o CVC, nebo o strategické akvizice?
6. **Jet Investment.** Firma je PE, ale doložené investice pocházejí z jejího VC programu Jet Ventures. VC, nebo PE?
7. **Rockaway.** Záznam je pod značkou Rockaway Ventures, jako `ico` je zapsaná AMISTA investiční společnost (externí obhospodařovatel). Má záznam vést formálního správce, nebo společnost týmu? United Founders (další VC skupiny) ve zdrojích K1–K4 chybí. **Rozhodnuto:** United Founders nepřidávat; zapsán v `notes/mezery-v-pokryti.md` jako příklad mezery v pokrytí.
8. **Orbit Capital.** Dluhová větev je vyřazená podle V5, equity větev je neaktivní. Počítat úvěry s opcí jako kvazi-equity?
9. **CVI.** Vyřazení podle V5 je hraniční, CVCA uvádí „výjimečně minoritní ekvitní investice“.
10. **AgriBoom Ventures** (VC, nebo PE; neaktivní) a **UP271** (FO, nebo VC; neaktivní).
11. **QQ Capital a Novira Capital.** Agent použil nový důvod „mimo rozsah (FO)“, který PLAN.md nezná. Schválit a doplnit do plánu, nebo přeřadit? **Rozhodnuto:** schváleno, FO doplněno do PLAN.md (kap. 2, mimo rozsah vzorku).
12. **Heartcore Capital** (bez týmu v ČR, ale web uvádí Prahu ve filtru týmu) a **3TS Capital Partners** (hranice VC/PE).
13. **Tachles VC.** Sídlo správce je v USA a tým v Praze. Uvedené IČO patří české dceřiné společnosti, u které není jisté, zda fond spravuje.

## Doklady investic

14. **24 investic** má citaci, která neobsahuje název cílové firmy v základním tvaru. Často jde o skloňování nebo o výpis z rejstříku s jiným právním názvem. Ověřit, že citace dokládá vztah investora a firmy (seznam: `results/investice.csv`; investice od Credo, Czech Founders, i&i Bio, J&T, JIC, Kaya, Miton, NUA, Purple, Reflex, Rockaway, Springtide, StartupYard, Tachles, Tensor, Tilia, Y Soft).
15. **12 investic**, u kterých ARES investora mezi společníky cílové firmy nenašel (`ares_spolecnik = ne`). Typicky jde o čerstvé investice, které ještě nejsou zapsané v rejstříku (např. Merchantee), nebo o investice přes zahraniční fond.
16. **Startovač.** Jedna citace důvodu po změně stránky neprošla, druhá prošla.

## Pokrytí

17. Kvůli vyčerpanému limitu vyhledávání mohou chybět investice nebo pole u těchto subjektů: Tachles, PurposeTech, Taiwania, StartupYard, Tilia, Springtide, Tensor a fondy Rockaway. Doplnit cíleným během po zmrazení?
