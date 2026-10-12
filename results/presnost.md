# Přesnost databáze (vzorek VC v ČR)

Vypočteno skriptem `src/06_presnost.mjs` 2026-10-12 podle PLAN.md, kap. 6. Intervaly jsou 95% podle Wilsona.
Podklady: `results/rucni-kontrola.csv` (verdikty), `results/rucni-kontrola-rozbor.md`, `results/opravy.md`.

## 1. Ruční kontrola (22 řádků)

Kontrolováno 22 řádků: 20 losovaných z oddílů A–C a 2 spory s AI kontrolorem (A005, A028). Nestranný odhad dávají jen losované řádky; spory jsou vybrané záměrně.

| Varianta | 20 losovaných | všech 22 |
|----------|---------------|----------|
| Obsah (tvrzení z citace plyne) | 20/20 = 100.0 % (95% CI 83.9–100.0 %) | 22/22 = 100.0 % (95% CI 85.1–100.0 %) |
| **Konzervativní:** obsah správně a celou citaci najde Cmd+F | 13/20 = 65.0 % (95% CI 43.3–81.9 %) | 14/22 = 63.6 % (95% CI 43.0–80.3 %) |
| **Optimistická:** obsah správně a text citace na stránce je (podle rozboru) | 20/20 = 100.0 % (95% CI 83.9–100.0 %) | 22/22 = 100.0 % (95% CI 85.1–100.0 %) |

Losované řádky podle oddílů: A 9, B 4, C 7. Na jednotlivé oddíly je to málo, proto je uvádíme jen souhrnně.

## 2. AI kontrolor (všech 166 řádků)

Nezávislý AI kontrolor v samostatném sezení posoudil každý řádek proti živé stránce. Verdikt „nelze ověřit“ nepoužil, konzervativní a optimistická varianta jeho vlastního hodnocení se proto neliší.

| Oddíl | Přesnost podle AI kontrolora |
|-------|------------------------------|
| A kandidáti (stav, důvod, doklad) | 68/75 = 90.7 % (95% CI 82.0–95.4 %) |
| B investice (Z2) | 30/31 = 96.8 % (95% CI 83.8–99.4 %) |
| C fakta (6 polí) | 58/60 = 96.7 % (95% CI 88.6–99.1 %) |
| **Celkem** | 156/166 = 94.0 % (95% CI 89.3–96.7 %) |

AI kontrolor označil jako špatné: A005, A023, A028, A034, A045, A064, A070, B097, C116, C127. Po ověření ve zdroji (`results/opravy.md`):
- potvrzeno a opraveno: A023, A064, A070, B097 (4; u A023 jen stav jako důsledek B097, typ VC/CVC zůstává k rozhodnutí),
- vyvráceno ruční kontrolou: A005, A028 (2),
- nerozhodnuto, data beze změny: A034, A045, C116, C127 (4).

| Varianta po ověření hlášených chyb | Přesnost výstupu |
|------------------------------------|------------------|
| Metoda kap. 6 PLAN.md (u 22 řádků ruční verdikt, jinak verdikt AI) | 158/166 = 95.2 % (95% CI 90.8–97.5 %) |
| Konzervativní (nerozhodnuté = chyba) | 158/166 = 95.2 % (95% CI 90.8–97.5 %) |
| Optimistická (nerozhodnuté = správně) | 162/166 = 97.6 % (95% CI 94.0–99.1 %) |

## 3. Shoda AI kontrolora s ruční kontrolou

- Na 20 losovaných řádcích se AI kontrolor shodl s ruční kontrolou ve všech: 20/20 = 100.0 % (95% CI 83.9–100.0 %). Na všech 22 řádcích: 20/22 = 90.9 % (95% CI 72.2–97.5 %).
- Cohenovo kappa nemá smysl počítat: ruční kontrola nenašla žádnou chybu, takže v jejích verdiktech není rozptyl.
- **Spor A005 (StartupYard, typ VC).** AI kontrolor tvrdil, že stav „aktivní“ není doložen, protože v okně Z2 nenašel investici v médiích. Ruční kontrola: tvrzení řádku (typ VC) z citace plyne. Investice v okně je doložena v řádku B080 z obchodního rejstříku (StartupYard Batch 14 s.r.o. společníkem wopee labs od 2025-04-02) a AI kontrolor sám B080 označil jako správně. **Rozhodnuto ve prospěch ruční kontroly.**
- **Spor A028 (NEWTON University Angels, typ VC).** AI kontrolor tvrdil, že chybí datované investice i IČO fondu. Ruční kontrola: subjekt má vlastní fond, proto V9 neplatí a typ VC je správně. Investice v okně jsou v řádku B102 z obchodního rejstříku (NerveCor, zápis 2025-07-01), který AI kontrolor sám označil jako správně; IČO 10878131 je ověřené v ARES. **Rozhodnuto ve prospěch ruční kontroly.**
- Společná příčina obou sporů: AI kontrolor posuzoval každý řádek izolovaně, hledal hlavně v médiích, nebral v úvahu doklady z rejstříku v jiných řádcích a posuzoval stav místo tvrzení řádku (typ).

## 4. Ruční kontrola citací

- Cmd+F na živé stránce našel celou citaci u 14 z 22 řádků (14/22 = 63.6 % (95% CI 43.0–80.3 %)).
- Rozbor 8 nenalezených (`results/rucni-kontrola-rozbor.md`): text všech citací na stránce je. Příčiny: citace spojuje více prvků stránky (A005, A008, A041, A062), zalomení řádku (C131), entity a mezery kolem odkazů v uložené citaci (B087, B099), text jen v `<title>` (A027).
- Opraveno (`results/opravy.md`): převod HTML na text (entity, řádkové značky, bez `<head>`); 49 citací převedeno na viditelný text; citace A005, A008, A027, A041, A062 a tři citace 3TS se stejnou vadou nahrazeny úryvkem jednoho prvku.
- **Systémová vada, neopravená:** nový příznak `citace_jeden_prvek` ukazuje, že 143 z 503 ověřených citací (28 %) spojuje více prvků stránky. Hodnoty jsou ve zdroji, ale citace není souvislý úryvek, který by našel Cmd+F.

## 5. Další metriky kap. 6

- **Vyplněnost u 29 aktivních VC** (podíl ověřených hodnot): ico 29/29, web 21/29, typ 29/29, sektory_deklarovane 25/29, faze 23/29, tiket_deklarovany 24/29, kapital_celkem 20/29, sektory_portfolio 29/29, tiket_z_investic_eur 5/29.
- **Platnost odkazů:** 282 z 282 zdrojových stránek se při kontrole načetlo.
- **Chybně vyřazení:** potvrzený případ 0; nerozhodnutý 1 (A045 Heartcore: jeden investor s lokalitou Praha, zda jde o tým v ČR).
- **Pokrytí:** neměřeno, referenční seznam K5 (CEE Funding Map) zatím nebyl vytěžen.

## 6. Minuty ruční práce

| Činnost | Minuty | Řádků | Minut na řádek |
|---------|--------|-------|----------------|
| Kontrola citací (Cmd+F) | 10 | 22 | 0.45 |
| Obsahová kontrola | 30 | 22 | 1.36 |
| **Celkem** | **40** | 22 | **1.82** |

Čas rozboru nenalezených citací a rozhodování sporů není v tabulce.
