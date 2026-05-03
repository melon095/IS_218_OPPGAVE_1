# IS 218 Oppgave - Gruppe 6

- [IS 218 Oppgave - Gruppe 6](#is-218-oppgave---gruppe-6)
- [Oppgave 1](#oppgave-1)
  - [1. Hva kartet løser](#1-hva-kartet-løser)
  - [2. Demo av system](#2-demo-av-system)
  - [3. Teknisk stack](#3-teknisk-stack)
  - [4. Datakatalog](#4-datakatalog)
    - [4.1 Filtreringsmuligheter](#41-filtreringsmuligheter)
  - [5. Arkitektur og dataflyt](#5-arkitektur-og-dataflyt)
  - [6. Refleksjon](#6-refleksjon)
- [Oppgave 2](#oppgave-2)
  - [1. Utvidelse av Webkartet](#1-utvidelse-av-webkartet)
    - [1.1 Datasett brukt videre i løsningen](#11-datasett-brukt-videre-i-løsningen)
    - [1.2 Video](#12-video)
  - [2. Romlig analyse ved hjelp av Jupyter Notebook](#2-romlig-analyse-ved-hjelp-av-jupyter-notebook)
- [Oppgave 3](#oppgave-3)
  - [1. Datakatalog](#1-datakatalog)
  - [2. Video](#2-video)

# Oppgave 1

## 1. Hva kartet løser
Kartløsningen visualiserer to datasett over hele Norge: **offentlige tilfluktsrom** og **brannstasjoner**. Brukeren kan filtrere innholdet romlig per fylke (basert på offisielle grenser fra Kartverket), i tillegg til attributtbaserte filtre for hvert datasett. Interaktive kontroller lar brukeren skru lag av og på, og klikk på punkter viser detaljert informasjon i popup-vinduer.

Koden for oppgave 1 er ikke inkludert i denne commiten. For å teste oppgave 1 må du klone repoet og sjekke ut taggen `oppgave-1`. Du kan også se oppgaven via permanent commit-lenke [her](https://github.com/melon095/IS_218_OPPGAVE_1/commit/23f48d576cb8af12307d668cc73fba6a712c3c48) eller via [oppgave-1-taggen](https://github.com/melon095/IS_218_OPPGAVE_1/releases/tag/oppgave-1).

## 2. Demo av system
https://github.com/user-attachments/assets/f6a73c03-efca-43c6-a7b2-e22edfeae587

## 3. Teknisk stack
| Komponent        | Teknologi            | Versjon                                       |
| ---------------- | -------------------- | --------------------------------------------- |
| Kartbibliotek    | MapLibre             | 5.16.0                                        |
| Bakgrunnskart    | Kartverket           | -                                             |
| Fylkegrenser-API | Kartverket           | v1                                            |
| Database         | Supabase             | -                                             |
| GIS-verktøy      | ogr2ogr              | GDAL 3.12.2 "Chicoutimi", released 2026/02/03 |
| Programmering    | JavaScript           | -                                             |
| Lokal server     | VS Code Live Preview | -                                             |

## 4. Datakatalog
| Datasett       | Kilde                                                                                                             | Format                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Bakgrunnskart  | [Kartverket](https://cache.kartverket.no/) (GeoNorge – Norgeskart)                                                | WMS                                     |
| Fylkegrenser   | [Kartverket administrative enheter-API](https://api.kartverket.no/kommuneinfo/v1/)                                | GeoJSON                                 |
| Tilfluktsrom   | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoJSON                                 |
| Brannstasjoner | [GeoNorge](https://kartkatalog.geonorge.no/metadata/brannstasjoner/0ccce81d-a72e-46ca-8bd9-57b362376485)          | GML - Lastet opp i Supabase via ogr2ogr |

Datasettet ble videre bearbeidet i ogr2ogr for å reprojisere data til EPSG:4326 (WGS 84) for bruk i webkart. Det bearbeidede datasettet ble deretter lastet opp til Supabase.

```bash
# Konvertering av GML til GeoJSON og reprojisering
ogr2ogr -t_srs EPSG:4326 tilfluktsrom.gml tilfluktsrom.gml

# Last opp til Supabase (krever at passord er satt i .pgpass-filen)
ogr2ogr -f "PostgreSQL" PG:"host=aws-1-eu-west-2.pooler.supabase.com dbname=postgres user=postgres.xxx" tilfluktsrom.gml -nln tilfluktsrom
```

### 4.1 Filtreringsmuligheter

| Filter       | Datasett       | Beskrivelse                                                                                                          |
| ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Fylke        | Alle           | Brukeren kan velge ett eller flere fylker for å filtrere både tilfluktsrom og brannstasjoner innenfor valgte fylker. |
| Stasjonstype | Brannstasjoner | Brukeren kan filtrere brannstasjoner basert på type som hovedstasjoner og lokale / underordnede stasjoner.           |
| Kapasitet    | Tilfluktsrom   | Brukeren kan filtrere tilfluktsrom basert på kapasitet, for eksempel alle rom med mer enn 100 plasser.               |

## 5. Arkitektur og dataflyt
- Punktdata er opprettet og redigert i ogr2ogr
- Datasettet eksporteres til GeoJSON og reprojiseres til EPSG:4326 (WGS 84) for bruk i webkart
- Brannstasjoner hentes som lokal GeoJSON via `fetch`.
- Tilfluktsromdata hentes først fra Supabase via REST API.
- Kartvisningen håndteres av MapLibre GL JS i nettleseren.
- Bakgrunnskart hentes direkte fra Kartverket via WMTS.
- Romlig filtrering og interaktivitet utføres i frontend.

## 6. Refleksjon
Løsningen håndterer romlig filtrering i frontend, noe som fungerer godt for små datasett, men som kunne vært forbedret ved å bruke en romlig database for bedre ytelse og skalerbarhet. Bruken av WMS som bakgrunnskart gir god kartkvalitet, men vektorfliser kunne gitt bedre ytelse og mer fleksibel styling. Brukergrensesnittet kunne vært videreutviklet med tydeligere tilbakemeldinger og mer avanserte filtervalg. Videre kunne datamodellen vært utvidet med flere attributter for å støtte mer detaljerte analyser. I en mer komplett løsning kunne også autentisering og dynamisk oppdatering av data vært aktuelt.

# Oppgave 2

## 1. Utvidelse av Webkartet
Utvidelsen i oppgaven lar brukeren velge en posisjon på kartet for å se hvor mange tilfluktsrom som finnes i nærheten. Denne funksjonen er muliggjort av funksjonen `finn_tilfluktsrom`, som bruker PostGIS-funksjoner til å beregne antall rom i SQL-spørringen. Funksjonen kalles fra [sokRadius.mjs](./scripts/sokRadius.mjs), som også sørger for visuell tilbakemelding til brukeren både i menyen og som en markør på kartet. Dersom det er flere tilfluktsrom enn det er plass til i markøren, kan brukeren scrolle gjennom dem. Dette gjør at brukeren slipper å flytte kartet for å se informasjonen.

SQL-koden for å finne tilfluktsrom ligger i [./sql/finn_tilfukts_function.sql](./sql/finn_tilfukts_function.sql) og ser slik ut:

```sql
CREATE OR REPLACE FUNCTION finn_tilfluktsrom(
  lng double precision,
  lat double precision,
  radius double precision
)
RETURNS SETOF tilfluktsrom
AS $$
  SELECT *
  FROM tilfluktsrom
  WHERE ST_DWithin(
    posisjon::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius
  );
$$ LANGUAGE sql;
```

Det anbefales å sjekke ut taggen `oppgave-2` for å teste denne funksjonaliteten. Du kan også bruke permanent commit-lenke [her](https://github.com/melon095/IS_218_OPPGAVE_1/commit/490359ce1aa0a7946975ba5a7834ab3975d7cd2e) eller [oppgave-2-taggen](https://github.com/melon095/IS_218_OPPGAVE_1/releases/tag/oppgave-2).

### 1.2 Video
https://github.com/user-attachments/assets/b6126059-9991-4c9d-8188-8a5716618e5b

## 2. Romlig analyse ved hjelp av Jupyter Notebook
I tillegg til utvidelsen av webkartet har vi utført en romlig analyse ved hjelp av Jupyter Notebook. Analysen fokuserte på forholdet mellom tilfluktsrom og befolkningstetthet i Norge. Vi brukte data om befolkningstetthet fra Statistisk sentralbyrå (SSB) og data om tilfluktsrom fra Kartverket. Python-biblioteker som GeoPandas og Matplotlib ble brukt til å visualisere resultatene. Analysen viste en tendens til at områder med høy befolkningstetthet har flere tilfluktsrom, men også noen unntak, særlig i mer rurale områder. Dette kan tyde på at plasseringen av tilfluktsrom bør vurderes opp mot befolkningstetthet for å sikre god tilgjengelighet. Videre analyser kan inkludere faktorer som avstand til nærmeste tilfluktsrom og tilgjengelighet for personer med nedsatt mobilitet.

[URL til Jupyter Notebook](./romlig-analyse/romlig-analyse.ipynb)

| Datasett           | URL                                                                                                               | Format     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| Befolkningstetthet | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoParquet |
| Tilfluktsrom       | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoParquet |

Datasettene ble lastet ned som GML-filer og deretter konvertert til GeoParquet ved hjelp av ogr2ogr.

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
