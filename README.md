# Kleine Handen

Rustige Montessori-spelletjes als web-app (PWA) voor iPhone en Android. Geen account, geen internet nodig na de eerste keer, geen reclame.

## Op GitHub Pages zetten

1. Maak een nieuwe repository, bijvoorbeeld `kleine-handen`.
2. Zet alle bestanden uit deze map in de root van de repository.
3. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. Na een minuut staat de app op `https://<gebruikersnaam>.github.io/kleine-handen/`.

## Op de telefoon zetten

- **iPhone:** open de link in Safari → deelknop → *Zet op beginscherm*.
- **Android:** open de link in Chrome → menu → *App installeren* of *Toevoegen aan startscherm*.

## Voor ouders

Houd het slotje linksboven twee seconden ingedrukt. Daar stel je de leeftijd (1–6) en het geluid in. De leeftijd bepaalt welke spelletjes zichtbaar zijn.

## Nieuwe versie uitrollen

Pas de bestanden aan, verhoog `CACHE` in `sw.js` en `VERSION` in `js/app.js`, en push. Telefoons halen de nieuwe versie bij de volgende start op.

## Een spel toevoegen

Maak `js/games/<naam>.js`, roep daarin `KH.games.push({ id, name, minAge, maxAge, icon, mount })` aan, en voeg het bestand toe aan `index.html` en aan `FILES` in `sw.js`. `mount(stage, ctx)` tekent in `stage` en geeft `{ destroy }` terug. `ctx.audio` heeft `pick`, `put`, `good`, `soft`, `done`.
