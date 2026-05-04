- [IS 218 Oppgave - Gruppe 6](#is-218-oppgave---gruppe-6)
  - [Linker](#linker)
  - [Kjøreinstruksjoner](#kjøreinstruksjoner)


# IS 218 Oppgave - Gruppe 6

## Linker

[Oppgave 1](./oppgave1/README.md) | [Oppgave 2](./oppgave2/README.md) | [Oppgave 3](./oppgave3/README.md)

## Kjøreinstruksjoner

Den enkleste måten å kjøre prosjektet på er å klone repoet og starte en lokal server i rotmappen. Dette kan gjøres ved å bruke VS Code Live Preview eller en enkel Python HTTP-server.

```bash
git clone https://github.com/melon095/IS_218_OPPGAVE_1.git
cd IS_218_OPPGAVE_1
python3 -m http.server
```

Det anbefales å bytte ut `python3` med `py` for Windows-brukere. Når serveren kjører, kan du åpne nettleseren og navigere til `http://localhost:8000/` for å se prosjektet i aksjon. Hver oppgave har sin egen mappe med en `README.md` som beskriver hva som er gjort, datakilder og en video-demo av funksjonaliteten.

For å se oppgave 1, naviger til `http://localhost:8000/oppgave1/`, for oppgave 2 til `http://localhost:8000/oppgave2/`, og for oppgave 3 til `http://localhost:8000/oppgave3/`. Rotmappen inneholder også en `index.html` som gir deg en hyperlenke til hver oppgave. Obs. Ikke åpne `index.html` direkte i nettleseren uten en server. 
