# IS_218_OPPGAVE_1
## 1.Kartets oppgave
## Hva kartet løser
Kartløsningen er utviklet for å gjøre det enklere å finne og bruke offentlige toaletter i et avgrenset område. Kartet visualiserer toaletter som geografiske objekter og gir brukeren mulighet til å filtrere disse basert på egenskaper som tilgjengelighet (for eksempel rampe og innendørs lys). Interaktive kontroller gjør det mulig å skru lag av og på, samt filtrere hvilke objekter som vises, slik at kartet kan tilpasses ulike brukerbehov.

## 2.Demo av system


## 3.Teknisk stack
| Komponent | Teknologi |
|-----------|-----------| 
| Kartbibliotek | MapLibre |
| Bakgrunnskart | KartVerket |
| Eksternt kartlag | Kartverket WMS (GeoNorge) |
| Datasett (lokalt) | GeoJSON |
| GIS-verktøy | QGIS |
| Programmering | JavaScript |
| Server (lokal) | Python http.server |

## 4.DataKatalog
| Datasett | Kilde | Format | Bearbeiding |
|--------|------|--------|------------|
| Punkter | Egendefinert (laget i QGIS) | GeoJSON | Opprettet i QGIS, reprojisert til EPSG:4326 |
| Bakgrunnskart | Kartverket (GeoNorge – Norgeskart) | WMS (OGC) | Lest direkte via ekstern WMS-tjeneste |
| Norgeskart | Kartverket (GeoNorge) | WMS | Lest direkte via OGC WMS |

## 5.Arkitektur og dataflyt
- Punktdata er opprettet og redigert i QGIS
- Datasettet eksporteres til GeoJSON og reprojiseres til EPSG:4326 (WGS 84) for bruk i webkart
- GeoJSON lastes inn i webapplikasjonen ved hjelp av JavaScript og beskrives som et temalag i kartet
- Kartvisningen håndteres av et kartbibliotek i nettleseren
- Bakgrunnskart hentes direkte fra Kartverket via en ekstern OGC WMS-tjeneste
- Romlig filtrering og interaktivitet utføres i frontend

## 6.Refleksjon
Løsningen håndterer romlig filtrering i frontend, noe som fungerer godt for små datasett, men som kunne vært forbedret ved å bruke en romlig database for bedre ytelse og skalerbarhet. Bruken av WMS som bakgrunnskart gir god kartkvalitet, men vektorfliser kunne gitt bedre ytelse og mer fleksibel styling. Brukergrensesnittet kunne vært videreutviklet med tydeligere tilbakemeldinger og mer avanserte filtervalg. Videre kunne datamodellen vært utvidet med flere attributter for å støtte mer detaljerte analyser. I en mer komplett løsning kunne også autentisering og dynamisk oppdatering av data vært aktuelt.

## Link til datasettene
- Tilgjengelighet: https://kartkatalog.geonorge.no/metadata/tilgjengelighet/843ab449-888c-4b08-bd66-d8b3efc0e529?search=Tilgjen
- Kirker: https://kartkatalog.geonorge.no/metadata/kirkebygg-forenklet/eea87664-d936-478e-897a-c38ca7c478a0?search=kirker
