# De tre perspektiver

Fælles: en demobjælke øverst (Lån360-logo, "Prototype · fiktive data", skift mellem
perspektiver, DA/EN). Under den vises bankens egen brugerflade.

## 1. Rådgiver (bankens portal)

Opbygning: venstremenu (Mit overblik, Boligsager, Opret ny sag, Beskeder med tæller),
topbjælke med søgning (kunde/sagsnummer - ikke CPR), notifikationsklokke og rådgiverens navn.

**Mit overblik**
- Hilsen ("Godmorgen, Mette") og knappen "Opret ny boligsag".
- Nøgletal, der kan klikkes: aktive sager, afventer kunde, klar til vurdering, afsluttede
  (30 dage).
- "Mine boligsager": faner per status med antal; kolonner kunde + adresse, ansøgere
  (kombination), formål, status, kundens fremdrift (x/y), seneste aktivitet.
- Højrekolonne: "Opgaver i dag" afledt af sagerne (gennemgå klar sag, følg op på mangler,
  send påmindelse til kunde, der ikke har åbnet linket), seneste beskeder, et tip.

**Opret ny boligsag (6 trin)**
1. Kunde: navn, CPR, e-mail, telefon, adresse, **beskæftigelse (lønmodtager/selvstændig)**,
   og for selvstændige virksomhedsnavn + CVR. Hjælpetekst viser, hvad typen betyder.
2. Medansøger: kontakt til/fra; samme felter + relation og "samme adresse".
3. Finansieringsformål (radiokort).
4. Sagsdetaljer: købspris og udbetaling (eller værdi og lånebeløb), lånebehov beregnes,
   5 %-krav valideres, overtagelsesdato, ejendomstype, ejendommens adresse, særlige forhold,
   ejendomsmægler (valgfri).
5. Gennemgang: kort per afsnit med "Rediger", liste over krævede dokumenter per ansøger,
   bekræftelses-afkrydsning.
6. Send invitation: dokumentliste (låste krævede punkter + valgfrie ekstra), personlig
   besked, kanal (e-mail/SMS), automatiske påmindelser efter 3 og 7 dage, forhåndsvisning.
   Bagefter en kvitteringsside: sendt til, tidspunkt, link gyldigt 30 dage, påmindelser,
   handlinger (åbn kundens visning, kopiér link, opret ny sag).
Højrekolonne: "Godt at vide" per trin og demo-knapper til at udfylde eksempeldata.

**Sagsvisning**
- Hoved: "Sag: navne", status, formål, adresse, sagsnummer, ansøgere med maskeret CPR og type.
- Faner: Sagsoverblik, Dokumentation (x/y), Økonomi, Historik.
- Sagsoverblik: fremdrift per ansøger (har indsendt / i gang / har ikke åbnet linket) med
  "Åbn kundens visning" og "Kopiér link", boligens nøgletal (inkl. BBR), kundeopsummering
  (rådgiverens tekst), kontaktoplysninger.
- Dokumentation: tabel per ansøger + "Fælles for sagen" med dokument, kilde, status,
  modtaget-dato og handling (Vis, Afvis med begrundelse, Anmod).
- Økonomi: indtægter per ansøger, udgifter fra budget, rådighedsbeløb, opsparing, gæld,
  pension; nøgletal (udbetaling %, belåning, gældsfaktor) mærket "ikke en kreditvurdering".
- Højrekolonne: fremdriftsring, næste skridt, statusforløb, "Send til kreditvurdering" (kun
  aktiv når alt er modtaget), "Send påmindelse", seneste kundeaktivitet.

## 2. Kunde (via link fra rådgiveren)

Kunden er ikke fagperson og skal guides. Bankens navn øverst, sprogknap, log ud. Til højre
altid: din rådgiver (navn, bank, afdeling, telefon og mail som tekst), din sag (formål,
oprettet, sagsnummer), "Godt at vide" for det aktuelle trin, "Har du spørgsmål?".

Trin (trinlisten beregnes - medansøger springer formål og budget over; bankkonti forsvinder,
hvis kunden afslår bank-samtykket):
1. Velkommen: "Lad os gøre din boligsag klar", ca. 10 minutter, sådan foregår det i 5 trin,
   sikkerhedsboks, "Hvad får min rådgiver adgang til?" (fold-ud med kundens krævede punkter).
2. Formål (kun hovedansøger), forvalgt fra rådgiverens sag.
3. Identifikation med MitID (simuleret).
4. Samtykker med kontakter per kilde (se dokumentkataloget).
5. Bankkonti: vælg bank → forbind → vælg konti; "tilføj endnu en bank"; eksempel på data.
6. Dine oplysninger: låste felter fra CPR/SKAT, redigerbar mail/telefon, civilstand, børn,
   beskæftigelse, bil, gæld + fritekst til gæld, der ikke står der.
7. Dokumenter: upload-felter for lønsedler eller årsregnskab + saldobalance, fallback-
   uploads for afslåede samtykker, rådgiverens ekstra dokumenter; afviste dokumenter vises med
   rådgiverens begrundelse.
8. Budget (kun hovedansøger): indtægter forudfyldt fra SKAT, udgifter, live rådighedsbeløb.
9. Gennemgang: kategorier med Klar/Mangler og "Ret"-knap, bekræftelse, "Send til min
   rådgiver". Kunden må gerne sende med mangler.
Kvittering: sagsnummer, dato, status ("Modtaget af din rådgiver"), hvad der evt. mangler med
knap til at tilføje det, hvad sker der nu, besked om medansøger der mangler.

## 3. Systemejer (Lån360)

Til salg, drift og support - ikke til at se kundernes dokumenter.
- Nøgletal: antal kunder (banker), aktive sager, gennemsnitlig fremdrift, andel med mangler.
- Hierarki bank → afdeling → rådgiver med aktive sager, fasefordeling (søjle), gennemsnitlig
  fremdrift, ældste åbne sag, sidst logget ind.
- Supportflag: sager uden aktivitet i 7+ dage, fejlede integrationer, rådgivere der ikke har
  logget ind i 7+ dage, med "Kontakt rådgiver".
- Ingen persondata: kun sagsnumre, status og metadata. Det er både et GDPR-hensyn og et
  salgsargument.
