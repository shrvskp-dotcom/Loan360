# Lån360 – instruktioner til Claude

Lån360 er et white-label system, der digitaliserer boliglåneansøgninger i Danmark. Det sælges
til banker, sparekasser og kreditinstitutter. Banken er dataansvarlig, Lån360 er databehandler.

Ejeren (Shuaib) er forretningsansvarlig, ikke udvikler. Forklar beslutninger kort på dansk,
og byg i små trin, han kan klikke rundt i og afprøve.

## Kilder til sandhed

- `docs/prototype/prototype.html` – den godkendte klikbare prototype. Design, tekster og flows
  skal matche den, medmindre Shuaib beslutter andet.
- `docs/dokumentkatalog.md` – de 11 dokumentpunkter, samtykker og fallback til upload.
- `docs/visninger.md` – de tre perspektiver: rådgiver, kunde og systemejer.
- `docs/roadmap.md` – byggerækkefølgen og hvor langt vi er.

## Forretningsregler, der aldrig må brydes

- En sag har 1–2 ansøgere; hver er lønmodtager eller selvstændig. Alle kombinationer skal virke.
- Lønmodtagere får punkt 5 (3 lønsedler) og aldrig punkt 11. Selvstændige får punkt 11
  (2 årsregnskaber + saldobalance) og aldrig punkt 5. Et punkt, der ikke gælder, vises ikke.
- Afslår kunden et samtykke, bliver de berørte punkter til upload-felter.
- Medansøgeren har eget link og eget MitID; formål og budget udfyldes kun af hovedansøgeren.
- Kontoudtog: 12 måneder (6 accepteres som minimum).
- Udbetaling mindst 5 % af købsprisen.
- Nøgletal er et arbejdsgrundlag, aldrig en kreditbeslutning.
- Dokumentregler og status beregnes ét sted (domænemodulet) og testes med enhedstests.

## Sikkerhed og data (DORA/GDPR)

- Al data hostes i EU. Ingen rigtige persondata i udvikling – kun fiktive demodata.
- CPR gemmes krypteret og vises maskeret (`ddmmåå-XXXX`) i alle visninger.
- Revisionslog for enhver visning og ændring af en sag (hvem, hvad, hvornår).
- Systemejer-visningen viser aldrig persondata – kun sagsnumre, status og metadata.
- Integrationer (MitID, open banking, SKAT/eSkatData, PensionsInfo) bygges mod testmiljøer
  bag et adapter-lag, så de kan skiftes uden at røre resten af koden.
- Ingen hemmeligheder i git. Brug `.env` (ignoreret) og `.env.example`.

## Teknik

- Next.js (App Router) + TypeScript, PostgreSQL via Prisma, Vitest til tests.
- Dansk som standard, engelsk via oversættelsesfiler.
