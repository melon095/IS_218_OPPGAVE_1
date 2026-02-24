# IS_218_OPPGAVE_1

## 1.Hva kartet løser
Kartløsningen er utviklet for å gjøre det enklere å finne og bruke offentlige toaletter i et avgrenset område. Kartet visualiserer toaletter som geografiske objekter og gir brukeren mulighet til å filtrere disse basert på egenskaper som tilgjengelighet (for eksempel rampe og innendørs lys). Interaktive kontroller gjør det mulig å skru lag av og på, samt filtrere hvilke objekter som vises, slik at kartet kan tilpasses ulike brukerbehov.

## 2.Demo av system
https://github.com/user-attachments/assets/c1e20ebe-c022-47d0-a008-3725b602b26e


## 3.Teknisk stack
<<<<<<< Updated upstream
| Komponent | Teknologi | Versjon |
|-----------|-----------|---------|
| Kartbibliotek | MapLibre | 5.16.0 |
| Bakgrunnskart | KartVerket | 1.0.0 |
| Eksternt kartlag | Kartverket WMS (GeoNorge) | - |
| Datasett (lokalt) | GeoJSON | - |
| GIS-verktøy | QGIS | 3.40.14 |
| Programmering | JavaScript | ES2025 |
| Server (lokal) | VS Code Live Preview | - |

## 4.DataKatalog
| Datasett | Kilde | Format | Bearbeiding |
|--------|------|--------|------------|
| Bakgrunnskart | Kartverket (GeoNorge – Norgeskart) | WMS (OGC) | Lest direkte via ekstern WMS-tjeneste |
| Offentlige toalletter (tilgjengelighet) | GeoNorge - https://kartkatalog.geonorge.no/metadata/tilgjengelighet/search=Tilgjen | GeoJSON | Brukt som temalag, kan skrus av/på
| Kirker | GeoNorge - https://kartkatalog.geonorge.no/metadata/kirkebygg-forenklet/eea87664-d936-478e-897ac478a0?search=kirker | GeoJSON | Brukt som temalag, kan skrus av/på
=======
| Komponent         | Teknologi                 | Versjon |
| ----------------- | ------------------------- | ------- |
| Kartbibliotek     | MapLibre                  | 5.16.0  |
| Bakgrunnskart     | Kartverket                | -       |
| Eksternt kartlag  | Kartverket WMS (GeoNorge) | -       |
| Datasett (lokalt) | GeoJSON                   | -       |
| GIS-verktøy       | QGIS                      | 3.40.14 |
| Programmering     | JavaScript                | -       |
| Server (lokal)    | VS Code Live Preview      | -       |

## 4.Data Katalog
| Datasett       | Kilde                                                                                                             | Format                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Bakgrunnskart  | [Kartverket](https://cache.kartverket.no/) (GeoNorge – Norgeskart)                                                | WMS (OGC)                               |
| Tilfluktsrom   | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoJSON                                 |
| Brannstasjoner | [GeoNorge](https://kartkatalog.geonorge.no/metadata/brannstasjoner/0ccce81d-a72e-46ca-8bd9-57b362376485)          | GML - Lastet opp i Supabase via ogr2ogr |
>>>>>>> Stashed changes

Dataset blei videre bearbeidet i ogr2ogr for å konvertere GML til GeoJSON og reprojiseres til EPSG:4326 (WGS 84) for bruk i webkart. Det bearbeidede datasettet ble deretter lastet opp til Supabase.

```bash
# Konvertering av GML til GeoJSON og reprojisering
ogr2ogr -f GeoJSON -t_srs EPSG:4326 brannstasjoner.geojson brannstasjoner.gml
ogr2ogr -t_srs EPSG:4326 tilfluktsrom.gml tilfluktsrom.gml
z
# Laste opp til Supabase, krever at passord er satt i .pgpass fil
ogr2ogr -f "PostgreSQL" PG:"host=aws-1-eu-west-2.pooler.supabase.com dbname=postgres user=postgres.xxx" tilfluktsrom.gml -nln tilfluktsrom
```

## 5.Arkitektur og dataflyt
- Punktdata er opprettet og redigert i QGIS
- Datasettet eksporteres til GeoJSON og reprojiseres til EPSG:4326 (WGS 84) for bruk i webkart
- GeoJSON lastes inn i webapplikasjonen ved hjelp av JavaScript og beskrives som et temalag i kartet
- Kartvisningen håndteres av et kartbibliotek i nettleseren
- Bakgrunnskart hentes direkte fra Kartverket via en ekstern OGC WMS-tjeneste
- Romlig filtrering og interaktivitet utføres i frontend

## 6.Refleksjon
Løsningen håndterer romlig filtrering i frontend, noe som fungerer godt for små datasett, men som kunne vært forbedret ved å bruke en romlig database for bedre ytelse og skalerbarhet. Bruken av WMS som bakgrunnskart gir god kartkvalitet, men vektorfliser kunne gitt bedre ytelse og mer fleksibel styling. Brukergrensesnittet kunne vært videreutviklet med tydeligere tilbakemeldinger og mer avanserte filtervalg. Videre kunne datamodellen vært utvidet med flere attributter for å støtte mer detaljerte analyser. I en mer komplett løsning kunne også autentisering og dynamisk oppdatering av data vært aktuelt.
