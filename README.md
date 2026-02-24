# IS_218_OPPGAVE_1
## 1.Hva kartet løser
Kartløsningen er utviklet for å gjøre det enklere å finne og bruke offentlige toaletter i et avgrenset område. Kartet visualiserer toaletter som geografiske objekter og gir brukeren mulighet til å filtrere disse basert på egenskaper som tilgjengelighet (for eksempel rampe og innendørs lys). Interaktive kontroller gjør det mulig å skru lag av og på, samt filtrere hvilke objekter som vises, slik at kartet kan tilpasses ulike brukerbehov.

## 2.Demo av system
https://github.com/user-attachments/assets/176e6ab0-1e43-495b-a9c7-fb13a237bad4

## 3.Teknisk stack
| Komponent | Teknologi | Versjon |
|-----------|-----------|---------|
| Kartbibliotek | MapLibre | 5.16.0 |
| Bakgrunnskart | Kartverket | - |
| Eksternt kartlag | Kartverket WMS (GeoNorge) | - |
| Datasett (lokalt) | GeoJSON | - |
| GIS-verktøy | QGIS | 3.40.14 |
| Programmering | JavaScript | - |
| Server (lokal) | VS Code Live Preview | - |

## 4.Data Katalog
| Datasett | Kilde | Format | Bearbeiding |
|--------|------|--------|------------|
| Bakgrunnskart | [Kartverket](https://cache.kartverket.no/) (GeoNorge – Norgeskart) | WMS (OGC) | Lest direkte via ekstern WMS-tjeneste |
| Offentlige toaletter (tilgjengelighet) | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilgjengelighet/843ab449-888c-4b08-bd66-d8b3efc0e529) | GeoJSON | Brukt som temalag, kan skrus av/på
| Kirker | [GeoNorge](https://kartkatalog.geonorge.no/metadata/kirkebygg-forenklet/eea87664-d936-478e-897a-c38ca7c478a0) | GML - Lastet opp i Supabase via ogr2ogr | Brukt som temalag, kan skrus av/på


## 5.Arkitektur og dataflyt
- Punktdata er opprettet og redigert i QGIS
- Datasettet eksporteres til GeoJSON og reprojiseres til EPSG:4326 (WGS 84) for bruk i webkart
- GeoJSON og Supabase lastes inn i webapplikasjonen ved hjelp av JavaScript og funksjonen _fetch_ og beskrives som et temalag i kartet
- Kartvisningen håndteres av et kartbibliotek i nettleseren
- Bakgrunnskart hentes direkte fra Kartverket via en ekstern OGC WMS-tjeneste
- Romlig filtrering og interaktivitet utføres i frontend

## 6.Refleksjon
Løsningen håndterer romlig filtrering i frontend, noe som fungerer godt for små datasett, men som kunne vært forbedret ved å bruke en romlig database for bedre ytelse og skalerbarhet. Bruken av WMS som bakgrunnskart gir god kartkvalitet, men vektorfliser kunne gitt bedre ytelse og mer fleksibel styling. Brukergrensesnittet kunne vært videreutviklet med tydeligere tilbakemeldinger og mer avanserte filtervalg. Videre kunne datamodellen vært utvidet med flere attributter for å støtte mer detaljerte analyser. I en mer komplett løsning kunne også autentisering og dynamisk oppdatering av data vært aktuelt.

Lyd fra [Youtube](https://www.youtube.com/watch?v=6fbN1NA9ibI)
