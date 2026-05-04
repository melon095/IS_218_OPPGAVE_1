- [Oppgave 2](#oppgave-2)
  - [1. Utvidelse av Webkartet](#1-utvidelse-av-webkartet)
    - [1.2 Video](#12-video)
  - [2. Romlig analyse ved hjelp av Jupyter Notebook](#2-romlig-analyse-ved-hjelp-av-jupyter-notebook)

# Oppgave 2

## 1. Utvidelse av Webkartet
Utvidelsen i oppgaven lar brukeren velge en posisjon på kartet for å se hvor mange tilfluktsrom som finnes i nærheten. Denne funksjonen er muliggjort av funksjonen `finn_tilfluktsrom`, som bruker PostGIS-funksjoner til å beregne antall rom i SQL-spørringen. Funksjonen kalles fra [../felles-skripter/sokRadius.js](../felles-skripter/sokRadius.js), som også sørger for visuell tilbakemelding til brukeren både i menyen og som en markør på kartet. Dersom det er flere tilfluktsrom enn det er plass til i markøren, kan brukeren scrolle gjennom dem. Dette gjør at brukeren slipper å flytte kartet for å se informasjonen.

SQL-koden for å finne tilfluktsrom ligger i [../sql/finn_tilfukts_function.sql](../sql/finn_tilfukts_function.sql) og ser slik ut:

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

### 1.2 Video
https://github.com/user-attachments/assets/67349eb6-83f5-42d8-83f6-d4addbe363ba

## 2. Romlig analyse ved hjelp av Jupyter Notebook
I tillegg til utvidelsen av webkartet har vi utført en romlig analyse ved hjelp av Jupyter Notebook. Analysen fokuserte på forholdet mellom tilfluktsrom og befolkningstetthet i Norge. Vi brukte data om befolkningstetthet fra Statistisk sentralbyrå (SSB) og data om tilfluktsrom fra Kartverket. Python-biblioteker som GeoPandas og Matplotlib ble brukt til å visualisere resultatene. Analysen viste en tendens til at områder med høy befolkningstetthet har flere tilfluktsrom, men også noen unntak, særlig i mer rurale områder. Dette kan tyde på at plasseringen av tilfluktsrom bør vurderes opp mot befolkningstetthet for å sikre god tilgjengelighet. Videre analyser kan inkludere faktorer som avstand til nærmeste tilfluktsrom og tilgjengelighet for personer med nedsatt mobilitet.

[URL til Jupyter Notebook](./romlig-analyse/romlig-analyse.ipynb)

| Datasett           | URL                                                                                                               | Format     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| Befolkningstetthet | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoParquet |
| Tilfluktsrom       | [GeoNorge](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8) | GeoParquet |

Datasettene ble lastet ned som GML-filer og deretter konvertert til GeoParquet ved hjelp av ogr2ogr.
