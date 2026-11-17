# Lån360

Digital indsamling af dokumenter og data til boliglåneansøgninger i Danmark – for banker,
sparekasser og kreditinstitutter.

Tre perspektiver:
- **Rådgiver** – opretter sager, inviterer kunder og følger dokumentstatus.
- **Kunde** – logger ind med MitID, giver samtykke, uploader og indsender.
- **Systemejer** – driftsoverblik over banker, afdelinger, rådgivere og support.

Se `docs/` for prototype, dokumentkatalog og roadmap.

## Kom i gang (udvikling)

    cp .env.example .env
    npm install
    npm run db:reset
    npm run dev

Log ind på http://localhost:3000 med `mette.lund@nordvigbank.example` / `Demo1234!`.

Status: under udvikling. Kun fiktive demodata. Se `docs/roadmap.md`.
