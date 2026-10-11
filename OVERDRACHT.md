# Overdracht: Kleine Handen

Lees dit voordat je iets aanpast. Het beschrijft wat de app is, hoe hij in elkaar zit, welke keuzes vaststaan, en wat de volgende opdracht is.

## Wat het is

Een web-app (PWA) met rustige speeltjes voor een kind van 1 jaar, bedoeld om mee te groeien tot 6. Geïnspireerd op Pok Pok: open einde, geen doelen, geen score, geen timer, geen tekst voor het kind, geen reclame, geen internet nodig. Alleen voor eigen gebruik van de ouder (Sebastiaan), niet voor een app store.

Draait als "Zet op beginscherm" vanaf GitHub Pages. Getest op iPhone. De ouder test alles zelf op het toestel; jij kunt de app niet zien of horen draaien, dus lever een testversie en vraag wat hij ziet.

## Vaste keuzes (niet veranderen zonder overleg)

- **Vanilla HTML/CSS/JS**, geen framework, geen build-stap. Eén map, direct te hosten.
- **Geen externe bestanden** behalve het Nunito-lettertype van Google Fonts en `js/vendor/matter.min.js` (lokaal). Geen plaatjes, geen audiobestanden, geen CDN-scripts. Alles inline SVG, canvas of Web Audio.
- **Geen auteursrechtelijk materiaal.** Geen Pok Pok-beeldmateriaal of look-alikes, geen bekende personages, geen beschermde muziek. Liedjes zijn eeuwenoude volksliedjes of eigen werk. "The Happy Song" (Imogen Heap) is bewust geweigerd.
- **Multitouch is de norm.** Een peuter legt zijn hele hand op het scherm. Elk speeltje moet meerdere vingers tegelijk aankunnen; gebruik `pointerId` per vinger, nooit één gedeelde sleepstatus. Dit is al eens misgegaan (blokken).
- **Zelf natuurkunde schrijven is verboden.** Blokken gebruiken Matter.js. Als een nieuw speeltje botsingen of stapelen nodig heeft: Matter.js.
- **Geluid is zacht.** Alles loopt door de masterketen in `js/audio.js` (lowpass, compressor, galm). Nooit rechtstreeks `connect(ctx.destination)`. De ouder kreeg hoofdpijn van kale oscillatoren; dat is opgelost en mag niet terugkomen.
- **Geen fout-geluiden, geen beloningsschermen.** Een verkeerde handeling geeft hooguit een zachte lage toon; iets wat lukt geeft een klein feestje (spetters, akkoordje), nooit een "level complete".
- **Thuisknop blijft.** Het kind gebruikt die zelf om te wisselen; in Pok Pok werkt het ook zo.
- **Taal:** Nederlands in de UI en in de communicatie met de ouder. Code en commentaar in het Engels.

## Liggend scherm (sinds 0.6.0)

- De app is gemaakt voor liggend gebruik, zoals Pok Pok. Alle SVG-speeltjes gebruiken `W = 780, H = 400`; canvas-speeltjes vullen het scherm.
- Rechtop toont `#rotate` (index.html, app.css) een plaatje van een telefoon die draait, zonder tekst. Het ouderscherm ligt daar bovenop.
- Beginscherm: alle tegels op één scherm, rijen van vier (`.tile-row`), tegelmaat via container-eenheden (`cqh`/`cqw`) in app.css.
- `.screen` heeft safe-area-padding aan alle vier kanten (notch links/rechts bij liggend).
- Manifest staat op `"orientation": "landscape"` en app.js probeert `screen.orientation.lock('landscape')` bij de eerste tik. Android doet daar iets mee. iPhone niet: iOS negeert de manifest-oriëntatie voor webapps, en `lock()` vereist volledig scherm, dat de iPhone voor webpagina's niet heeft (WebKit-bug 257695, stand 2024; niet opnieuw gecontroleerd). Op de iPhone draait het kind (of de ouder) het toestel zelf; rotatievergrendeling in het Bedieningspaneel moet uit staan.

## Structuur

```
index.html              schil: beginscherm, speelscherm, ouderscherm; laadt alle scripts
manifest.webmanifest    PWA-manifest
sw.js                   service worker (offline). Bump CACHE bij elke wijziging.
css/app.css             kleuren (tokens in :root), tegels, speelveld, ouderscherm
js/app.js               router, ouderslot (2 s vasthouden), leeftijdsfilter, wake lock, VERSION
js/audio.js             geluidsmotor: masterketen, instrumenten, percussie
js/toy-utils.js         el() voor SVG, tween(), ease, shuffle, svgPoint(), fitCanvas(), timerBag(),
                        paintKit() (waterverf-vulling + korrel), blob() (handgetekende omtrek), mixHex()
js/vendor/matter.min.js Matter.js 0.20.0
js/games/*.js           één bestand per speeltje
icons/                  app-iconen (PNG), gegenereerd
README.md               installatie op GitHub Pages
```

### Een speeltje

Elk bestand in `js/games/` eindigt met:

```js
KH.games.push({
  id: 'naam',          // uniek
  name: 'Naam',        // label op de tegel
  minAge: 1, maxAge: 6,
  icon: `<svg viewBox="0 0 100 100">…</svg>`,   // tegel-icoon, inline
  mount                // function (stage, ctx) -> { destroy() }
});
```

`mount(stage, ctx)` tekent in `stage` (een lege div die het scherm vult) en geeft een object met `destroy()` terug dat alles opruimt: timers, tweens, requestAnimationFrame, audio-intervals, DOM. `ctx.audio` is `KH.audio`, `ctx.reducedMotion` is een boolean.

Nieuwe speeltjes: bestand maken, `<script>` toevoegen aan `index.html` (vóór `app.js`), pad toevoegen aan `FILES` in `sw.js`.

### Geluid (`KH.audio`)

- `noteAt(freq, at, dur, peak, instrument)`: een noot op een AudioContext-tijd. Instrumenten: `piano` (standaard), `musicbox`, `marimba`, `flute`, `harp`, `organ`, `xylo`.
- `tone(freq, dur)`, `bell(freq, dur, peak)`: nu meteen.
- `knock(freq, dur, peak)`: gefilterde ruis (tikken, kloppen). `shakerAt(at, peak)`.
- Kant-en-klaar: `click tick thud ding boop creak pick put good soft done`.
- `context()` geeft de AudioContext, `output()` de node waar je op aansluit als je zelf nodes bouwt.
- Pentatonisch (C D E G A) waar het kind zelf noten kiest, zodat alles samen klinkt.

### De speeltjes nu (versie 0.6.0)

| id | naam | leeftijd | techniek | wat het doet |
|---|---|---|---|---|
| busy | Friemelbord | 1–3 | SVG | schakelaars, knop, draaiknop, schuif, bel, luikje met zon, wieltje; onderdelen hebben gezichtjes die reageren |
| blobs | Muziekdruppels | 1–4 | canvas | tik = gloeiende druppel met noot; slepen = melodie |
| draw | Tekenen | 1–6 | canvas | dikke kwast, zes kleuren, spons wist langzaam |
| shapes | Vormenbord | 2–3 | SVG | drie dieren (cirkel=beer, vierkant=poes, driehoek=vogeltje) in drie gaten, zelfcorrigerend, wisselt na ronde; geen knop meer |
| blocks | Blokken | 2–5 | SVG + Matter.js | stapelen, omgooien; veer per vinger |
| radio | Radio | 1–6 | SVG + Web Audio | 7 zenders, elk eigen instrument + begeleiding; zittende beer, poes en hond dansen tussen bladeren |
| music | Muziekhoek | 1–6 | SVG | 8 regenboogtoetsen (glissando), trommel, bekken, shaker, bel, instrumentknop |

Radio-liedjes: Kortjakje, Vader Jacob, Boerderij, Bootje, Lammetje, Ik zag twee beren (noten van bladmuziek), Blij-liedje (eigen). Harmonie per maat wordt automatisch afgeleid (I/IV/V).

## Stijl

- Palet staat in `css/app.css`: sage-achtergrond `#ECF1EA`, hout `#D9A86C` / `#B07E44` / `#F2D9B0`, inkt `#3C4A3E`, en de speelkleuren rood `#D9574C`, blauw `#4A7BC9`, geel `#E8B83A`, groen `#6FA36B`, paars `#8C5BB5`. Gebruik deze, bedenk geen nieuwe.
- Vlak, afgeronde hoeken, zachte slagschaduw (`feDropShadow`), houtnerf als dunne lijntjes. Geen gradients behalve subtiel op hout.
- Alles wat het kind aanraakt is minimaal 44 px en reageert zichtbaar (bounce, kleur, spetters).

## Werkwijze met de ouder

- Hij is direct en kort. Geen lange uitleg, geen hedging. Zeg wat je deed en wat je niet kunt controleren.
- Hij test op de iPhone en stuurt screenshots. Een screenshot met "wtf" betekent: een echte bug, kijk goed.
- Hij wil geen aannames. Als je iets niet zeker weet (hoe Pok Pok iets doet, hoe iOS zich gedraagt), zeg dat.
- Als een aanpak niet werkt, stop met pleisters plakken en bouw het goed (zo is Matter.js erin gekomen).

## Opleveren

Twee dingen, altijd allebei:

1. **Testpagina**: één HTML-bestand met alles inline (CSS, scripts in de volgorde van `index.html`, Matter.js erbij), gepubliceerd als artifact zodat hij het op zijn telefoon opent. Service worker en manifest horen daar niet in.
2. **Zip** van de projectmap voor GitHub Pages, met `VERSION` in `js/app.js` en `CACHE` in `sw.js` opgehoogd.

Controleer vóór opleveren minstens `node --check` op elk gewijzigd script. Er is een jsdom-rooktest die elk speeltje mount en unmount; die staat niet in de map maar is in twintig regels na te maken (stub `ResizeObserver`, `getScreenCTM`, `createSVGPoint`, canvas-`getContext`, `matchMedia`, `AudioContext = undefined`). Sinds 0.4.2 is ook met Playwright (Chromium in de sandbox) getest: elk speeltje openen, met meerdere vingers tikken, terug; met en zonder reduced motion; viewport liggend 844×390. Let op: rechtop dekt `#rotate` alles af, dus test liggend.

## Illustraties (punt 4): gedaan in 0.4.2–0.5.0

Oorspronkelijke opdracht hieronder; daarna wat er gekozen is.

De app is functioneel compleet. Wat nog mist is karakter: alles is code-getekend en strak, maar vlak en onpersoonlijk. Pok Pok wint het op handgetekende illustratie. Dat kunnen we niet evenaren, maar wel een stuk dichterbij komen.

Doel: de code-getekende illustraties persoonlijker maken, in dezelfde stijl en hetzelfde palet. Concreet:

1. **Radio-dansers** (`js/games/radio.js`, `dancers`): nu drie gekleurde ovalen met ogen. Maak er drie personages van met een eigen vorm en karakter (bijvoorbeeld een beer, een kikker, een vogel) die herkenbaar dansen: armen/oren die meebewegen op de maat, een huppel bij de tik.
2. **Vormenbord** (`js/games/shapes.js`): de stukken mogen dieren of voorwerpen worden in plaats van kale vormen, zolang de vorm van het gat de vorm van het stuk blijft (cirkel/vierkant/driehoek als silhouet).
3. **Friemelbord** (`js/games/busy.js`): de zon achter het luikje heeft al een gezicht; geef meer onderdelen een klein gezichtje of detail.
4. **Beginscherm** (`index.html` / `css/app.css` / `js/app.js`): een rustige achtergrond met een paar langzaam drijvende wolkjes of een zonnetje. Subtiel, niet druk; `prefers-reduced-motion` respecteren.
5. **Tegel-iconen**: bijwerken zodat ze bij de nieuwe personages passen.

Randvoorwaarden:
- Inline SVG, geen externe bestanden. Geen bekende personages of merken.
- Stel vooraf twee vragen aan de ouder: welke dieren/dingen zijn zoon leuk vindt, en of hij voorkeur heeft voor dieren of voor vormen in het vormenbord.
- Lever na elk onderdeel een testpagina, niet alles in één keer. Hij kijkt op de telefoon en stuurt bij.
- Optioneel, als hij dat wil: een map `art/` met vaste bestandsnamen waar eigen SVG/PNG-tekeningen in kunnen; aanwezig bestand wint van de code-versie. Dit vraagt een kleine loader en een lijst in `sw.js`.

### Gekozen stijl (0.5.0)

- Voorbeeld van de ouder: waterverf-kinderkamerposters (zittende safaridieren). Niet natekenen; alleen de vormtaal.
- Dieren zitten: peervormig lijf, voorpoten als zuiltjes die op de grond blijven (ze tillen alleen een stukje op, nooit schuin uitzwaaien: dat zag er raar uit), achtervoeten opzij, breed zacht-vierkant hoofd, grote lichte snuit, kleine stipogen ver uit elkaar, roze blosjes, korte penseelstreepjes op het voorhoofd.
- Omtrekken met `U.blob()` (licht onregelmatig, vast per vorm). Vulling met `kit.shape()` uit `U.paintKit(svg)`: radiaal verloop (licht midden, donkere rand) plus korrel-overlay (`class="grain"`), geen SVG-filters op bewegende delen.
- Korrel is uit te zetten in het ouderscherm ("Tekeningen → Waterverf-korrel"), via `.no-grain` op `<html>`.
- Palet blijft zoals hierboven (ouder koos: kleuren zijn goed). Bladgroen is afgeleid: `mixHex('#6FA36B', INK, .35)` en `mixHex('#6FA36B', '#E8B83A', .3)`.
- Dieren van de ouder: beer, poes, hond (radio); vogel mag ook (vormenbord). Geen `art/`-map: ouder levert hooguit screenshots als stijlvoorbeeld.

### Bugs gevonden en opgelost (0.4.2–0.5.0)

- `.screen`/`.sheet` overschreven het `hidden`-attribuut: op GitHub Pages stond het ouderscherm altijd open. Opgelost met `[hidden]{display:none!important}` in app.css. (De testpagina in Claude had dit niet, omdat dat kader die regel zelf toevoegt.)
- Muziekdruppels: tik net na de frame-tijdstempel gaf negatieve leeftijd, `createRadialGradient` gooide een fout en de animatie stopte. Leeftijd wordt nu op 0 geklemd.
- Friemelbord: plaat van het draaiwiel liep over het deurtje en buiten het bord.

## Bekende open punten

- Korrel op bewegende dansers: niet getest op een iPhone. Als het hapert: korrel uit in het ouderscherm, of de korrel alleen op stilstaande delen.
- Zendericoon "beer" op de radio is nog de oude platte stijl.

- Wake lock en service worker zijn niet getest vanaf GitHub Pages (de testpagina in Claude draait in een beveiligd kader waar dat niet werkt).
- Safari pauzeert de AudioContext in de achtergrond; de eerste tik na terugkomen kan stil zijn. `KH.audio.unlock` wordt op elke pointerdown aangeroepen, dat zou het moeten opvangen.
- Tekening blijft bij draaien van het toestel via een snapshot; niet op iOS gecontroleerd.
- Ritmes van Boerderij en Lammetje komen uit het geheugen, niet van bladmuziek.
