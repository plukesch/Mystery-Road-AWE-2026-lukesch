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