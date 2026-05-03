- [Oppgave 3](#oppgave-3)
  - [1. Datakatalog](#1-datakatalog)
  - [2. Video](#2-video)

# Oppgave 3

I oppgave 3 bygger vi videre på løsningene fra oppgave 1 og 2, og samler nå tre datasett i én helhetlig kartapplikasjon: befolkningstetthet, tilfluktsrom og fylkegrenser. Befolkningstetthet og tilfluktsrom visualiseres som egne kartlag, mens fylkegrensene brukes til romlig avgrensning i filteret slik at brukeren kan fokusere analysen på ett fylke om gangen.

To av datasettene er nå lagret i Supabase: `befolkning` og `tilfluktsrom`. Disse hentes i frontend med RPC-kall, i stedet for statiske filer. SQL-funksjonene som eksponerer data ligger i [./sql](./sql): `alle_befolkningsdata()`, `alle_tilfluktsrom()` og `finn_tilfluktsrom(...)`. Dette gir en tydeligere dataflyt mellom database og kartklient, og gjør det enklere å utvide med nye spørringer senere.

I tillegg har vi videreutviklet grensesnittet med bedre struktur, mer universell utforming og mer mobilvennlig layout, slik at funksjonaliteten fra de tidligere oppgavene blir lettere å bruke i praksis.

## 1. Datakatalog

| Datasett           | URL                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Befolkningstetthet | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) |
| Tilfluktsrom       | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) |
| Fylkegrenser       | [Kartverket administrative enheter-API](https://api.kartverket.no/kommuneinfo/v1/)                                |


## 2. Video
https://github.com/user-attachments/assets/b143cab1-5079-446d-a755-d6798b46292b
