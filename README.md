# IS 218 Oppgave - Gruppe 6

- [IS 218 Oppgave - Gruppe 6](#is-218-oppgave---gruppe-6)
- [Oppgave 1](#oppgave-1)
  - [1. Hva kartet løser](#1-hva-kartet-løser)
  - [2. Demo av system](#2-demo-av-system)
  - [3. Teknisk stack](#3-teknisk-stack)
  - [4. Data Katalog](#4-data-katalog)
    - [4.1 Filtreringsmuligheter](#41-filtreringsmuligheter)
  - [5. Arkitektur og dataflyt](#5-arkitektur-og-dataflyt)
  - [6. Refleksjon](#6-refleksjon)
- [Oppgave 2](#oppgave-2)
  - [Utvidelse av Webkartet](#utvidelse-av-webkartet)
    - [Video](#video)
  - [Romlig analyse ved hjelp av Jupyter Notebook](#romlig-analyse-ved-hjelp-av-jupyter-notebook)

# Oppgave 1

## 1. Hva kartet løser
Kartløsningen visualiserer to beredskaps-datasett over hele Norge: **offentlige tilfluktsrom** og **brannstasjoner**. Brukeren kan filtrere innholdet romlig per fylke (basert på offisielle grenser fra Kartverket), i tillegg til attributtbaserte filtre for hvert datasett. Interaktive kontroller lar brukeren skru lag av og på, og klikk på punkter viser detaljert informasjon i popup-vinduer.

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

## 4. Data Katalog
| Datasett       | Kilde                                                                                                             | Format                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Bakgrunnskart  | [Kartverket](https://cache.kartverket.no/) (GeoNorge – Norgeskart)                                                | WMS                                     |
| Fylkegrenser   | [Kartverket administrative enheter-API](https://api.kartverket.no/kommuneinfo/v1/)                                | GeoJSON                                 |
| Tilfluktsrom   | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoJSON                                 |
| Brannstasjoner | [GeoNorge](https://kartkatalog.geonorge.no/metadata/brannstasjoner/0ccce81d-a72e-46ca-8bd9-57b362376485)          | GML - Lastet opp i Supabase via ogr2ogr |

Dataset blei videre bearbeidet i ogr2ogr for å konvertere GML til GeoJSON og reprojiseres til EPSG:4326 (WGS 84) for bruk i webkart. Det bearbeidede datasettet ble deretter lastet opp til Supabase.

```bash
# Konvertering av GML til GeoJSON og reprojisering
ogr2ogr -f GeoJSON -t_srs EPSG:4326 brannstasjoner.geojson brannstasjoner.gml
ogr2ogr -t_srs EPSG:4326 tilfluktsrom.gml tilfluktsrom.gml

# Laste opp til Supabase, krever at passord er satt i .pgpass fil
ogr2ogr -f "PostgreSQL" PG:"host=aws-1-eu-west-2.pooler.supabase.com dbname=postgres user=postgres.xxx" tilfluktsrom.gml -nln tilfluktsrom
```

### 4.1 Filtreringsmuligheter

| Filter       | Datasett       | Beskrivelse                                                                                                       |
| ------------ | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Fylke        | Alle           | Brukeren kan velge ett eller fylke for å filtrere både tilfluktsrom og brannstasjoner innenfor det valgte fylket. |
| Stasjonstype | Brannstasjoner | Brukeren kan filtrere brannstasjoner basert på type som hovedstasjoner og lokale / underordnede stasjoner.        |
| Kapasitet    | Tilfluktsrom   | Brukeren kan filtrere tilfluktsrom basert på kapasitet, for eksempel alle rom med mer enn 100 plasser.            |

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

## Utvidelse av Webkartet
Utvidelsen til oppgaven lar brukeren velge en posisjon på kartet for å se hvor mange tilfluktsrom som er i nærheten. Denne funksjonen er gjort mulig av funksjonen finn_tilfluktsrom, som bruker PostGIS funksjoner for å beregne antall rom i SQL spørringen. Funksjonen blir kallt opp i [sokRadius.mjs](./Oppgave2-database/sokRadius.mjs) som også sørger for å lage visuelt feedback til brukeren, som skjer både i menyen, og som en markør på kartet. Dersom det er flere tilfluktsrom enn det er plass på en markør, vil det være mulig å scrolle gjennom dem. Dette gjør at brukeren ikke må dra på kartet for å kunne se informasjonen.

SQL-koden for å finne tilfluktsrom er plassert i [./Oppgave2-database/sql/finn_tilfukts_function.sql](./Oppgave2-database/sql/finn_tilfukts_function.sql) og ser slik ut:

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

### Video
https://github.com/user-attachments/assets/b6126059-9991-4c9d-8188-8a5716618e5b

## Romlig analyse ved hjelp av Jupyter Notebook
I tillegg til utvidelsen av webkartet, har vi også utført en romlig analyse ved hjelp av Jupyter Notebook. Analysen fokuserte på å undersøke forholdet mellom tilfluktsrom og befolkningstetthet i Norge. Vi brukte data om befolkningstetthet fra Statistisk sentralbyrå (SSB) og data om tilfluktsrom fra Kartverket. Vi brukte Python-biblioteker som GeoPandas og Matplotlib for å visualisere resultatatene. Analysen viste at det er en tendens til at områder med høy befolkningstetthet har flere tilfluktsrom, men det er også noen unntak, spesielt i mer rurale områder. Dette kan indikere at det er behov for å vurdere plasseringen av tilfluktsrom i forhold til befolkningstetthet for å sikre at de er tilgjengelige for de som trenger dem mest. Videre analyser kunne inkludert faktorer som avstand til nærmeste tilfluktsrom og tilgjengelighet for personer med nedsatt mobilitet.

[URL til Jupyter Notebook](./romlig-analyse/romlig-analyse.ipynb)

| Datasett           | URL                                                                                                               | Format     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| Befolkningstetthet | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoParquet |
| Tilfluktsrom       | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoParquet |

Datasettene ble lastet ned som GML-filer og deretter konvertert til GeoParquet ved hjelp av ogr2ogr.
