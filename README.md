# Papa Pietro – Pizza Calculator

Minimalistyczny kalkulator składników ciasta do pizzy. Wybierz rodzaj mąki, ustaw hydrację, sól, oliwę, drożdże oraz profil fermentacji TK/TO, a aplikacja policzy potrzebne gramy dla kulek po 250 g.

## Szybki start
```bash
npm install
npm run dev
```
Dev server wystartuje na porcie wskazanym przez Vite (domyślnie `5173`).

## Build produkcyjny
```bash
npm run build
npm run preview   # podgląd buildu
```
Artefakty lądują w katalogu `dist/`.

## CI
Workflow `.github/workflows/build.yaml` buduje projekt na push/PR (Node 20, `npm ci`, `npm run build`) i wypuszcza artefakt `dist`.
