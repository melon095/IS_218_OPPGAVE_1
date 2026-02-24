# IS_218_OPPGAVE_1

## 1.Hva kartet løser
Kartløsningen visualiserer to beredskaps-datasett over hele Norge: **offentlige tilfluktsrom** og **brannstasjoner**. Brukeren kan filtrere innholdet romlig per fylke (basert på offisielle grenser fra Kartverket), i tillegg til attributtbaserte filtre for hvert datasett. Interaktive kontroller lar brukeren skru lag av og på, og klikk på punkter viser detaljert informasjon i popup-vinduer.

## 2.Demo av system
https://github.com/user-attachments/assets/c1e20ebe-c022-47d0-a008-3725b602b26e


## 3.Teknisk stack
| Komponent        | Teknologi            | Versjon                                       |
| ---------------- | -------------------- | --------------------------------------------- |
| Kartbibliotek    | MapLibre             | 5.16.0                                        |
| Bakgrunnskart    | Kartverket           | -                                             |
| Fylkegrenser-API | Kartverket           | v1                                            |
| Database         | Supabase             | -                                             |
| GIS-verktøy      | ogr2ogr              | GDAL 3.12.2 "Chicoutimi", released 2026/02/03 |
| Programmering    | JavaScript           | -                                             |
| Lokal server     | VS Code Live Preview | -                                             |

## 4.Data Katalog
| Datasett       | Kilde                                                                                                             | Format                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Bakgrunnskart  | [Kartverket](https://cache.kartverket.no/) (GeoNorge – Norgeskart)                                                | WMS                                     |
| Fylkegrenser   | [Kartverket administrative enheter-API](https://https://api.kartverket.no/kommuneinfo/v1/)                        | GeoJSON                                 |
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

### Filtreringsmuligheter

| Filter       | Datasett       | Beskrivelse                                                                                                       |
| ------------ | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Fylke        | Alle           | Brukeren kan velge ett eller fylke for å filtrere både tilfluktsrom og brannstasjoner innenfor det valgte fylket. |
| Stasjonstype | Brannstasjoner | Brukeren kan filtrere brannstasjoner basert på type som hovedstasjoner og lokale / underordnede stasjoner.        |
| Kapasitet    | Tilfluktsrom   | Brukeren kan filtrere tilfluktsrom basert på kapasitet, for eksempel alle rom med mer enn 100 plasser.            |

## 5.Arkitektur og dataflyt
- Punktdata er opprettet og redigert i ogr2ogr
- Datasettet eksporteres til GeoJSON og reprojiseres til EPSG:4326 (WGS 84) for bruk i webkart
- Brannstasjoner hentes som lokal GeoJSON via `fetch`.
- Tilfluktsromdata hentes først fra Supabase via REST API.
- Kartvisningen håndteres av MapLibre GL JS i nettleseren.
- Bakgrunnskart hentes direkte fra Kartverket via WMTS.
- Romlig filtrering og interaktivitet utføres i frontend.

## 6.Refleksjon
Løsningen håndterer romlig filtrering i frontend, noe som fungerer godt for små datasett, men som kunne vært forbedret ved å bruke en romlig database for bedre ytelse og skalerbarhet. Bruken av WMS som bakgrunnskart gir god kartkvalitet, men vektorfliser kunne gitt bedre ytelse og mer fleksibel styling. Brukergrensesnittet kunne vært videreutviklet med tydeligere tilbakemeldinger og mer avanserte filtervalg. Videre kunne datamodellen vært utvidet med flere attributter for å støtte mer detaljerte analyser. I en mer komplett løsning kunne også autentisering og dynamisk oppdatering av data vært aktuelt.
