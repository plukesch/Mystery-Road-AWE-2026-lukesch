# UE3 Theorie-Fragen & Antworten — Exercise 3

Laufende Sammlung, gleiches Schema wie [`../ue2/UE2_THEORIE_ANTWORTEN.md`](../ue2/UE2_THEORIE_ANTWORTEN.md).

---

## Demo 1 — Historischer Überblick über die Web-Entwicklung

Fünf Epochen der Web-Entwicklung durchgegangen (statische Dokumente → serverseitig dynamisch →
AJAX/Web 2.0 → SPA-Frameworks → hybride moderne Architekturen), unsere App anhand konkreter
Merkmale (kein Backend, `fetch()` ohne Reload, Hash-Routing, kein Framework) in die frühe,
handgestrickte SPA-Ära eingeordnet. Details, Tabelle in `UE3_CHANGES.md`.

### F1: Welches konkrete Problem hat AJAX (und Bibliotheken wie jQuery) gelöst, das reine serverseitig gerenderte Seiten nicht lösen konnten? Welche neuen Probleme hat dieser Ansatz eingeführt, die SPA-Frameworks danach zu lösen versucht haben?

**Einfach gesagt:** vor AJAX war JEDE Interaktion — auch eine winzige, wie ein Element zu einem
Warenkorb hinzufügen — ein kompletter Neustart der Seite: alles wird verworfen, alles neu
geladen, Scroll-Position weg, alle Zwischenzustände weg. AJAX hat das erste Mal erlaubt, **nur den
betroffenen Teil** zu aktualisieren, im Hintergrund, ohne diesen kompletten Neustart.

**Das gelöste Problem, konkret:** vor AJAX war die einzige Möglichkeit, neue Daten vom Server zu
bekommen, ein `<a href>`-Klick oder Formular-Submit — beides löst zwingend eine **komplette neue
Anfrage** aus: der Browser verwirft die aktuelle Seite komplett, lädt eine neue HTML-Antwort,
parst und rendert sie von Grund auf neu. Das war langsam (die gesamte Seite — Navigation, Header,
Footer, alles Unveränderte — wird bei jeder noch so kleinen Änderung erneut über das Netzwerk
übertragen), fühlte sich ruckartig/störend an (kurzes weißes Aufblitzen, Scroll-Position verloren,
jeder Eingabezustand weg), und machte "live" wirkende Interaktionen (Tippen zeigt sofort
Suchvorschläge, eine Karte per Maus verschieben, ein Chat, der neue Nachrichten ohne Aktion des
Nutzers zeigt) praktisch unbaubar. `XMLHttpRequest` (die Technik hinter "AJAX") erlaubte JavaScript
erstmals, **im Hintergrund** beim Server nachzufragen und dann **gezielt nur einen Teil** des
bestehenden DOM zu aktualisieren — der Rest der Seite bleibt unangetastet. jQuery (2006) hat das
dann praktisch nutzbar gemacht, weil die rohen Browser-APIs dafür (XHR, DOM-Selektion,
Event-Handling) zwischen Browsern damals stark inkonsistent waren — jQuery hat eine einheitliche,
einfache API (`$.ajax()`, `.html()`, `.append()`, Selektoren) darübergelegt.

**Die neuen Probleme, die das eingeführt hat:** sobald man den DOM stückweise, über viele über die
Seite verteilte Callback-Funktionen hinweg aktualisieren kann (genau das Muster, das unsere eigene
App in `js/views/*.ts` noch heute zeigt — viele einzelne `innerHTML = ...`-Zuweisungen an
unterschiedlichen Stellen), entstehen neue Probleme:
- **DOM und Datenzustand laufen leicht auseinander.** Nichts erzwingt, dass der sichtbare DOM
  immer korrekt widerspiegelt, was der aktuelle Datenzustand eigentlich ist — jede Stelle im Code,
  die Daten ändert, muss sich selbst darum kümmern, auch den betroffenen DOM-Teil manuell
  nachzuziehen. Vergisst man eine Stelle, zeigt die UI etwas Falsches (siehe UE2 Demo 7 F3: genau
  dieses Muster war die Quelle mehrerer echter Bugs in UE1).
- **Wachsender "Spaghetti" aus verteiltem, imperativem DOM-Manipulations-Code.** Je mehr
  Interaktivität eine Seite bekommt, desto schwerer wird nachvollziehbar, "was ändert sich wann,
  ausgelöst wodurch" — berüchtigt als "jQuery-Spaghetti" aus dieser Ära.
- **Kein Standard-Konzept für "App-Zustand" oder "Navigation".** Jedes Team hat sich eigene,
  Ad-hoc-Lösungen ausgedacht (genau wie unsere App ihr eigenes `state.ts`-Objekt und ihr eigenes
  Hash-Routing hat) — keine gemeinsame, bewährte Lösung, jedes Projekt löst dieselben Grundprobleme
  wieder neu und leicht unterschiedlich.

SPA-Frameworks (Backbone, Angular, später React, Vue) haben genau das versucht zu lösen, indem sie
ein **deklaratives** Modell einführten: man beschreibt, wie die UI **abhängig vom aktuellen
Zustand** aussehen soll, und das Framework selbst berechnet (z. B. über einen virtuellen DOM, siehe
Demo 3), welche minimalen echten DOM-Änderungen dafür nötig sind — die Bürde, DOM und Zustand
manuell synchron zu halten, verschwindet, und Routing/Zustands-Verwaltung werden zu
Standard-Bausteinen statt Ad-hoc-Erfindungen.

### F2: Diese App benutzt aktuell Hash-basiertes Routing (`#dashboard`, `#evidence`, ...) ohne vollständigen Seiten-Reload zwischen Views. Zu welcher Ära gehört dieses Muster, und was sagt es darüber aus, wann sich diese architektonische Entscheidung durchgesetzt hat?

**Einfach gesagt:** Hash-Routing (`#evidence` statt `/evidence`) ist ein Trick aus der **frühen**
SPA-Ära (ca. 2010–2014) — von **vor** der Zeit, als Browser eine bessere, offizielle Lösung dafür
breit unterstützten. Es war damals der einzige zuverlässige Weg, "die URL ändert sich, Vor-/
Zurück-Button funktioniert" hinzubekommen, **ohne** dass der Browser eine komplette neue Seite vom
Server anfordert.

**Warum ausgerechnet der Teil nach `#`?** Der Teil einer URL nach `#` (das "Fragment") wurde
historisch nur **innerhalb** des Browsers benutzt (z. B. um zu einer Überschrift auf derselben
Seite zu springen) — er wird beim eigentlichen Netzwerk-Request an den Server **gar nicht erst
mitgeschickt**. Das bedeutet: `window.location.hash = "evidence"` ändert sichtbar die
Adresszeile **und** legt einen neuen Eintrag in der Browser-Historie an (Vor-/Zurück-Button
funktionieren!) — **ohne** jemals eine neue Anfrage an den Server auszulösen. Zusätzlich feuert der
Browser dabei ein `hashchange`-Event, auf das man reagieren kann (`window.addEventListener
("hashchange", handleHashChange)` — genau unsere `js/navigation.ts`).

**Warum war das nötig, statt einfach "echte" Pfade (`/evidence`) zu benutzen?** Weil das Ändern
eines echten Pfads auf die alte Art (`location.pathname = ...`) **immer** eine komplette neue
Anfrage an den Server auslöste — genau das Reload-Verhalten, das eine SPA ja vermeiden will. Die
**richtige** Lösung dafür — die **History-API** (`history.pushState()`/`popstate`-Event) — wurde
zwar technisch schon ca. 2010 in Browsern spezifiziert, war aber erst praktikabel **breit**
nutzbar, als ältere Browser ohne Unterstützung dafür (v. a. ältere Internet-Explorer-Versionen)
genügend an Marktanteil verloren hatten — realistisch erst Mitte der 2010er. **Bis dahin** war
Hash-Routing die einzige verlässliche, framework-unabhängige Methode.

**Bonus, direkt beobachtbar an unserer eigenen App:** Hash-Routing braucht **keinerlei
Server-Konfiguration** — der Server bekommt den `#...`-Teil ja nie zu Gesicht, jeder simple
statische Datei-Server liefert unter jedem Hash-Wert einfach dieselbe `index.html` aus. Genau
deshalb konnte unsere App in UE2 (Demo 9) ohne jede Server-seitige "leite alle Pfade auf
`index.html` um"-Regel auf GitHub Pages deployt werden — eine `pushState`-basierte SPA (echte
Pfade wie `/evidence`) hätte genau so eine Umleitungs-Regel gebraucht, sonst würde ein direkter
Aufruf von `.../evidence` (statt `.../#evidence`) beim Server mit einem echten `404` scheitern.

**Fazit zur Einordnung:** Hash-Routing in dieser App ist ein klares architektonisches Kennzeichen
der **frühen, vor-Router-Bibliothek-SPA-Ära** — nicht, weil die App alt ist, sondern weil sie
genau das Muster reproduziert, das man damals von Hand bauen musste, bevor Router-Bibliotheken
(und später React selbst, über z. B. React Router) diese Entscheidung standardisiert und
vereinfacht haben.

---

## Demo 2 — SSR vs. CSR

Vergleichstabelle SSR/CSR erstellt, Wikipedia live per Browser-Netzwerk-Tab als echtes SSR-Beispiel
verifiziert (`class="client-nojs"`, `generator: MediaWiki` im rohen HTML-Response). Details in
`UE3_CHANGES.md`.

### F1: Erkläre, warum diese Übungs-App SSR oder CSR ist, und warum. Geh Schritt für Schritt durch, was zwischen der Browser-Anfrage der Seite und dem tatsächlichen Sichtbarwerden des Dashboards passiert.

**Einfach gesagt:** unsere App ist **komplett CSR** — der Server schickt immer exakt dasselbe,
fast leere HTML (für jede Anfrage identisch, keine Berechnung), und **alles**, was wie "die App"
aussieht, baut JavaScript im Browser erst danach zusammen.

**Warum CSR, konkret begründet:** der "Server" hinter unserer App ist entweder `vite preview`
(lokal) oder GitHub Pages (live) — beides **reine statische Datei-Server**. Sie führen bei einer
Anfrage **keinerlei Code aus**, der die HTML-Antwort individuell zusammenbaut — sie liefern
byte-identisch dieselbe, zur Build-Zeit (`npm run build`, UE2 Demo 3) bereits fertig erzeugte
`index.html` aus, egal wer fragt oder wann. Das ist das Gegenteil von SSR, wo der Server bei
**jeder** Anfrage aktiv HTML generiert.

**Schritt für Schritt, vom Request bis zum sichtbaren Dashboard:**

1. Browser fordert die Seiten-URL an (z. B. die GitHub-Pages-URL).
2. Server liefert `index.html` aus — ein **statisches**, vorproduziertes Dokument. Es enthält
   zwar schon das komplette Grundgerüst (Header, Navigations-Buttons, die 5 `<section>`-Bereiche),
   aber die eigentlich **interessanten** Container sind leer, z. B. `<div id="evidenceList"
   class="evidence-grid"></div>` — kein einziges Beweisstück, keine Dashboard-Zahl steht schon im
   HTML.
3. Browser parst das HTML, sieht `<script type="module" src=".../index-XXXX.js">`, startet den
   **Download** dieser (gebündelten, minifizierten) JS-Datei.
4. Browser **führt das JS aus** — das ist der Moment, ab dem überhaupt etwas passiert: `main.ts`s
   `initApp()` läuft, meldet Event-Listener an, zeigt das `loadingOverlay` ("Loading case
   file…") und ruft `loadAllData()` auf.
5. `loadAllData()` (`js/data.ts`) startet **weitere, separate Netzwerk-Anfragen** — diesmal an die
   JSON-Dateien (`data/case.json`, `data/people.json`, `data/locations.json`, sequenziell
   `await`et, dann `evidence.json`/`timeline.json`). Das sind waschechte eigene Requests, die der
   Browser **erst jetzt**, nach dem Ausführen von JS, überhaupt auslöst.
6. Sobald die Antworten da sind, ruft der Code `renderDashboard()` (`js/views/dashboard.ts`) auf —
   diese Funktion baut aus den geladenen Daten einen HTML-String und schreibt ihn per
   `container.innerHTML = html` in den zuvor leeren `<div id="dashboardContent">`.
7. **Erst jetzt**, am Ende dieser Kette, ist das Dashboard mit echten Zahlen/Inhalten tatsächlich
   sichtbar — mehrere Netzwerk-Anfragen und ein kompletter JS-Ausführungsdurchlauf **nach** dem
   ursprünglichen HTML liegen dazwischen.

Genau diese Lücke zwischen Schritt 2 (HTML da) und Schritt 7 (Inhalt sichtbar) ist der Grund,
warum die App überhaupt einen `loadingOverlay`-Spinner braucht — bei echtem SSR (Wikipedia, siehe
Task 2) gibt es diese Lücke nicht, der Inhalt ist im selben Moment da wie das HTML selbst.

### F2: Nenne einen echten Preis, den diese Architektur-Entscheidung zahlt (denk an das, was ein:e Nutzer:in mit deaktiviertem JavaScript, einer langsamen Verbindung, oder ein Suchmaschinen-Crawler sehen würde), und warum.

**Einfach gesagt:** eine Person ohne JavaScript (oder ein einfacher Suchmaschinen-Crawler, der
kein JS ausführt) sieht bei unserer App **nichts von der eigentlichen App** — nur die leere Hülle
und einen Lade-Spinner, der niemals verschwindet.

**Konkret, Schritt für Schritt, was passiert wäre (kein hypothetisches Szenario — direkt aus dem
Ablauf oben ableitbar):** ohne JavaScript bleibt der Browser exakt bei Schritt 3 stehen — die
`.js`-Datei wird zwar heruntergeladen, aber **nie ausgeführt**. Das bedeutet: `initApp()` läuft
nie, `loadAllData()` läuft nie, `renderDashboard()` läuft nie. Sichtbar wäre: Header, Navigations-
Buttons (die aber selbst nicht funktionieren würden — sie hängen an `onclick="navigateTo(...)"`,
einer JS-Funktion, die nie existiert) und der statische Hinweistext im Dashboard ("How to use this
portal" — der einzige Teil, der wirklich schon im HTML steht). Der Lade-Spinner ("Loading case
file…") bliebe **für immer** sichtbar, weil nichts ihn je wieder ausblendet. **Keine** Beweisstücke,
**keine** Personen, **keine** Timeline — die komplette eigentliche Funktion der App wäre
unsichtbar.

**Warum das ein echter, bewusster Kompromiss ist, kein Versehen:** die Alternative (SSR) würde
bedeuten, dass ein **echter Server** bei jeder Anfrage aktiv HTML mit den aktuellen Case-Daten
zusammenbaut — das würde einen Server-Prozess/Backend voraussetzen, das diese App bewusst **nicht
hat** (sie ist als reine statische Datei-Sammlung konzipiert, siehe UE2 Demo 9: GitHub Pages kann
das kostenlos hosten, genau **weil** kein Server-Code nötig ist). Dieselbe Eigenschaft, die den
Host so einfach/kostenlos macht (kein Backend nötig), ist exakt das, was JS-lose Besucher:innen
und einfache Crawler leer ausgehen lässt. Bei einer echten, öffentlich zu findenden Webseite (im
Gegensatz zu diesem Kursprojekt) wäre das ein ernstzunehmender Nachteil für Suchmaschinen-Sichtbarkeit
(SEO) — ein Crawler ohne vollständige JS-Ausführung würde im HTML praktisch nur die Wörter "How to
use this portal" finden, nicht die eigentlichen Fallakten-Inhalte, die die Seite ja ausmachen.