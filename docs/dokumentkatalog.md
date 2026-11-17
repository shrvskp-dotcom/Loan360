# Dokumentkatalog

Integrationer er *kandidater*. Hvilke der reelt kan bruges, afhænger af aftaler,
samtykkeløsninger og bankens egne systemer - det skal afklares med hver bank og må ikke
præsenteres som givet.

## De 11 punkter

Gælder for: **Alle** = hver ansøger. **Lønm.** / **Selvst.** = kun den type ansøger.
**Sag** = én gang for hele sagen (udfyldes af hovedansøgeren).

| # | Punkt | Gælder for | Automatisk kilde (med samtykke) | Fallback |
|---|-------|-----------|----------------------------------|----------|
| 1 | Personoplysninger: navn, CPR, adresse, mail, mobil, civilstand, børn, arbejde, bil, gæld | Alle | CPR via MitID; arbejdsgiver/indkomst fra SKAT; bil fra Motorregistret (valgfrit samtykke) | Kunden udfylder i "Dine oplysninger" |
| 2 | Kontooversigt pr. dags dato | Alle | Open banking (kunden vælger banker og konti) | Upload |
| 3 | Kontoudtog, 12 mdr. (min. 6) | Alle | Open banking | Upload |
| 4 | Pensionsrapport | Alle | PensionsInfo | Upload |
| 5 | Seneste 3 lønsedler | Lønm. | - | Upload (altid) |
| 6 | Årsopgørelse sidste år | Alle | SKAT (eSkatData) | Upload |
| 7 | Skatteoplysninger sidste år (inkl. forskudsopgørelse) | Alle | SKAT (eSkatData) | Upload |
| 8 | Restgæld og anden gæld | Alle | SKAT + Tinglysning (valgfrit samtykke) + kundens supplement | Upload |
| 9 | ID-oplysninger | Alle | MitID | - |
| 10 | Budget | Sag | Formular, forudfyldt med indtægt fra SKAT | Kunden udfylder |
| 11 | Seneste 2 årsregnskaber + saldobalance for i år | Selvst. | CVR-opslag til virksomhedsdata | Upload (altid) |

Opsummeringen af kunden (del af punkt 1) skrives af rådgiveren i sagsoverblikket.

## Ekstra punkter for sagen

| Punkt | Hvornår | Kilde |
|-------|---------|-------|
| Ejendomsdata (BBR) | Når formålet har en konkret ejendom og adressen er angivet | Automatisk ved oprettelse |
| Købsaftale / købstilbud | Valgfrit, rådgiveren vælger i invitationen | Upload (hovedansøger) |
| Gavebrev / dokumentation for egenbetaling | Valgfrit | Upload (hovedansøger) |
| Anden dokumentation | Valgfrit | Upload (hovedansøger) |

Valgte ekstra punkter tæller med i fremdriften. Punkter, der følger af beskæftigelsen, kan
ikke fravælges.

## Krævede punkter per kombination

- Lønmodtager alene: 1-9 + 10 (+ BBR/ekstra)
- Selvstændig alene: 1-4, 6-9, 11 + 10
- To lønmodtagere: 1-9 per ansøger + 10
- Selvstændig + lønmodtager: selvstændig 1-4, 6-9, 11; lønmodtager 1-9; + 10
- To selvstændige: 1-4, 6-9, 11 per ansøger + 10

## Samtykker i kundeflowet

| Kilde | Standard | Dækker punkt |
|-------|----------|--------------|
| SKAT (eSkatData) | Anbefalet, slået til | 1 (arbejde/indkomst), 6, 7, 8 |
| Dine banker (open banking) | Anbefalet, slået til | 2, 3 |
| PensionsInfo | Anbefalet, slået til | 4 |
| Køretøjsdata (Motorregistret) | Valgfri, slået fra | 1 (bil) |
| Tinglysning | Valgfri, slået fra | 8 (tinglyste lån og ejendomme) |

Afslås en anbefalet kilde, bliver punkterne til upload-felter i trinnet "Dokumenter".

## Finansieringsformål

Køb af ejerbolig, køb af andelsbolig, købsbevis, omlægning, ombygning/renovering, friværdi,
andet. Formålet styrer felterne i sagsdetaljer (købspris + udbetaling ved køb; værdi +
lånebeløb ved omlægning/friværdi) og om der hentes BBR.
