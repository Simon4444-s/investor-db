# Rozbor nenalezených citací z ruční kontroly

Ruční kontrola 2026-10-12 prošla 22 řádků z `results/rucni-kontrola.csv` (20 losovaných a 2 spory) za 10 minut. Kontrolovala jen to, zda celou citaci najde vyhledávání v prohlížeči (Cmd+F) na živé stránce z URL. Výsledek: 14× „citace nalezena“, 8× „citace nenalezena“.

## Postup rozboru

Živé stránky všech 8 řádků jsem stáhl 2026-10-12 v 18:33 (curl, všechny HTTP 200). U každé stránky jsem ověřil, zda je citace:

1. doslova v HTML,
2. v textu stránky po dekódování HTML entit, sjednocení mezer a spojení prvků mezerou,
3. celá uvnitř jednoho prvku.

Na hranicích, kde se citace rozpadá, jsem prohlédl zdrojové HTML. Rozbor nesimuluje prohlížeč: že Cmd+F citaci nenašel, je výsledek ruční kontroly; rozbor vysvětluje proč.

## Výsledek

**Text všech 8 citací na živé stránce je. Žádná citace nechybí;** Cmd+F je nenašel kvůli tomu, jak je citace uložená nebo jak je text na stránce rozdělený.

| id | Investor | Kde je text na stránce | Proč ho Cmd+F nenašel |
|----|----------|------------------------|-----------------------|
| A005 | StartupYard | Otázka „Do you invest in start-ups?“ je nadpis `<h2>`, odpověď je v následujícím odstavci `<p>`. | Citace spojuje dva prvky. |
| A008 | Tilia Impact Ventures | URL přesměruje na https://tilia.vc/. První věta je v nadpisu `<h2>`, zbytek v pěti samostatných dlaždicích `<h4>`: „0.3 - 1.2m EUR initial ticket“, „Equity / Convertible debt“, „Early stage“, „Sector-agnostic, Impact-driven“, „CEE+“. | Citace spojuje šest prvků. |
| A027 | N1 | Jen v názvu stránky `<title>` a v metadatech `og:title` a `twitter:title`, ve viditelném textu není. | Název stránky se zobrazuje jen v záložce, vyhledávání v textu stránky ho nenajde. |
| A041 | Enterprise Investors (profil na cvca.cz) | Tabulka: „Typ investic“ je v jedné buňce, „buyout (MBO & MBI), expansion capital“ v sousední. | Citace spojuje popisek a hodnotu ze dvou buněk. |
| A062 | CBAA | „01“ je samostatný štítek, „Andělští investoři“ nadpis `<h3>`, obě věty jsou v odstavci `<p>`. | Citace spojuje tři prvky. |
| B087 | DEPO Ventures (FrenchWeb) | Celá věta je v jednom odstavci. | Uložená citace obsahuje doslovné entity `&rsquo;` (stránka zobrazuje „’“) a mezery před čárkami za odkazy („DEPO Ventures ,“, „SCE Freiraum Ventures ,“). |
| B099 | Look AI Ventures | Celá věta je v jednom odstavci. | Uložená citace má mezeru před čárkou za odkazem („Embodied AI ,“). |
| C131 | Tensor Ventures | V jednom prvku, ale se dvěma zalomeními řádku `<br>` („AI,“ / „Quantum Revolution, Computational Biotech“ / „or Sustainable Tech.“). | Citace má na místě zalomení mezery. |

Podle příčiny:

- Text rozdělený do více prvků: 4 (A005, A008, A041, A062).
- Zalomení řádku: 1 (C131).
- Chyba při uložení citace (HTML entity, mezera před čárkou u odkazu): 2 (B087, B099).
- Název stránky: 1 (A027).
- Citace na stránce opravdu není: 0.

V zadání rozboru stálo 9 nenalezených citací; v seznamu z ruční kontroly je jich 8.

## Co z toho plyne

- Po rozboru je text citace na živé stránce u **22 z 22** kontrolovaných řádků. Všech 8 „nenalezena“ jsou falešně negativní výsledky hledání celé citace přes Cmd+F, ne chybějící zdroje.
- Ruční kontrola neposuzovala, zda z citace plyne tvrzení v řádku (stav, typ, datum investice, převod hodnoty). Co tedy měřila, popisuje kap. 6 PLAN.md.
- Skutečné nedostatky v datech, které rozbor odhalil:
  - B087 a B099: uložená citace se od zobrazeného textu liší (entity, mezera před čárkou), takže není doslovná.
  - A005, A008, A041, A062: citace je poskládaná z několika prvků stránky, ne souvislý úryvek.
  - A027: doklad je jen v názvu stránky, ne ve viditelném textu.
  - A008: URL v databázi přesměruje na jinou doménu (tilia.vc).
