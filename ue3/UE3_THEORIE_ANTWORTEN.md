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

---

## Demo 3 — Der virtuelle DOM

Virtueller DOM in eigenen Worten erklärt (leichtgewichtige JS-Kopie + Diffing statt direkter
DOM-Manipulation), konkretes Beispiel im **originalen** `app.js` gefunden: ein Bookmark-Klick
(`handleBookmarkClick`, Zeile 434) löst `renderEvidenceList()` aus, das **alle** gefilterten
Beweisstück-Karten komplett neu baut und per `innerHTML` ersetzt — obwohl sich nur ein
Stern-Symbol in einer einzigen Karte wirklich ändert. Details, Code-Zitat in `UE3_CHANGES.md`.

### F1: Anhand des gefundenen Beispiels — wie würde ein virtueller-DOM-Ansatz (konzeptionell, nicht zwingend React-spezifisch) vermeiden, die unveränderten Teile neu zu erzeugen?

**Einfach gesagt:** statt "beim Bookmark-Klick die GANZE Liste neu zusammenbauen" schreibt man nur
"so soll EINE Karte aussehen, abhängig von ihren Daten" — und lässt die Bibliothek selbst
herausfinden, welche der (bis zu 18) Karten sich wirklich geändert haben.

**Konkret auf unser Beispiel übertragen:** man würde eine Komponentenfunktion schreiben, die **eine
einzelne** Evidence-Karte beschreibt, abhängig von ihren Daten inklusive `isBookmarked`. Ändert
sich der Bookmark-Zustand (das `bookmarks`-Array), läuft diese Beschreibungsfunktion zwar
gedanklich für **alle** aktuell sichtbaren Karten erneut — aber das Ergebnis ist zunächst nur eine
**neue virtuelle Baum-Struktur**, keine echten DOM-Operationen. Der Diffing-Schritt vergleicht
diese neue virtuelle Struktur dann Knoten für Knoten mit der vorigen: bei den **17 unveränderten**
Karten stellt er fest "gleicher Tag, gleiche Attribute, gleiche Kinder" → **nichts** wird am echten
DOM angefasst. Bei der **einen** betroffenen Karte stellt er fest "dieses `class`-Attribut hat sich
geändert, dieser Text-Inhalt hat sich geändert" → genau **zwei** kleine, chirurgische
DOM-Operationen werden ausgeführt (Klasse setzen, Text ändern) — die anderen 17 Karten, ihre
Event-Listener, ihr Fokus-/Scroll-Zustand bleiben komplett unangetastet, im Gegensatz zu unserem
`innerHTML = html`, das alle 18 Karten gleichermaßen zerstört und neu erzeugt.

### F2: Ist der virtuelle DOM eine "schnellere" Art, den echten DOM zu aktualisieren, als direkt `innerHTML` aufzurufen? Erkläre genau, was hier tatsächlich gegeneinander abgewogen wird (denk an die Diffing-Arbeit selbst).

**Einfach gesagt:** nicht bedingungslos "schneller" — ein **anderer Tausch**. `innerHTML` ist
selbst extrem einfach und der Browser-HTML-Parser gut optimiert, macht aber **immer maximale**
DOM-Arbeit (alles zerstören, alles neu bauen). Virtueller DOM vermeidet diese Verschwendung, aber
das **Vergleichen selbst kostet auch Zeit** — man tauscht "garantiert alles neu bauen" gegen
"zuerst günstig vergleichen, dann nur das Nötige bauen".

**Genauer:** `container.innerHTML = html` ist zwar in **einer** Zeile geschrieben, lässt den
Browser aber **bedingungslos** Folgendes tun, egal wie viel sich wirklich geändert hat: alle
bisherigen Kind-Elemente zerstören (inkl. Verlust von z. B. Fokus, Scroll-Position innerhalb dieser
Kinder, angehängten Event-Listenern), den neuen HTML-String parsen, komplett neue Elemente
erzeugen, und für den **gesamten** betroffenen Bereich Layout und Paint neu berechnen — unabhängig
davon, ob sich am Ende 1 % oder 100 % sichtbar geändert hat. Der virtuelle DOM **vermeidet** diese
unnötige, teure echte-DOM-/Browser-Arbeit — aber der Diffing-Schritt selbst ist **nicht gratis**:
zwei komplette Baum-Strukturen (alte und neue virtuelle Kopie) müssen Knoten für Knoten verglichen
werden, das kostet CPU-Zeit, **auch dann**, wenn am Ende "nichts geändert" herauskommt.

**Der eigentliche Tausch:** billige, reine In-Memory-JavaScript-Rechenarbeit (Bäume aus einfachen
Objekten bauen und vergleichen) gegen teure, echte Browser-Arbeit (Layout, Reflow, Paint,
Zustandsverlust in zerstörten Elementen) sparen. Das lohnt sich, wenn ein großer Teil des Baums
typischerweise **gleich** bleibt und der betroffene DOM-Ausschnitt nicht winzig ist (genau unser
Bookmark-Beispiel: 17 von 18 Karten bleiben gleich). Es lohnt sich **nicht automatisch**, wenn sich
ohnehin fast der komplette sichtbare Baum ändert (dann zahlt man Diffing-Kosten **zusätzlich** zu
den DOM-Kosten, die man sowieso gehabt hätte) oder wenn der Baum von vornherein winzig ist (bei 5
Elementen ist der Unterschied zwischen beiden Ansätzen ohnehin vernachlässigbar).

### F3: Macht die Verwendung einer virtuellen-DOM-Bibliothek deine App automatisch schnell? Was könnte eine React-App trotzdem langsam machen?

**Einfach gesagt:** Nein. Der virtuelle DOM behebt genau **eine** Art von Ineffizienz (unnötiges,
naives Neubauen ganzer DOM-Abschnitte) — er ist keine allgemeine Performance-Garantie. Man kann
mit React auf ganz andere Arten trotzdem eine langsame App bauen.

Konkrete Dinge, die trotz virtuellem DOM langsam machen können:
- **Unnötig viele Re-Renders.** Ist eine App-Struktur/Komponenten-Aufteilung ungünstig (kein
  `memo`, zu große, undifferenzierte Komponenten), lässt React bei jeder Zustandsänderung viel
  **mehr** Komponentenfunktionen erneut laufen als nötig — selbst wenn jeder einzelne Diff billig
  ist, summiert sich das bei tausenden Knoten pro Tastenanschlag.
- **Teure Arbeit INNERHALB einer Render-Funktion.** Eine aufwendige Berechnung, das Sortieren
  eines riesigen Arrays, Datums-Formatierung für tausende Einträge — der virtuelle DOM optimiert
  nur den **DOM-Schreib**-Schritt am Ende, nicht die eigene JS-Logik, die vorher läuft.
- **Große Listen ohne (oder mit instabilen) `key`-Props.** Reacts Diffing-Algorithmus verlässt sich
  für Listen auf eine stabile Identität pro Element (`key`). Fehlt die oder ist sie instabil (z. B.
  der Array-Index bei einer sich neu sortierenden Liste), reißt React unnötig viele Listen-Einträge
  ab und baut sie neu — genau das Problem, das der virtuelle DOM eigentlich vermeiden sollte.
- **Netzwerk-/Datenladezeiten.** Keine Rendering-Strategie der Welt beschleunigt eine langsame
  API-Antwort oder einen langsamen Server — das ist eine komplett andere Achse (siehe Demo 2,
  SSR/CSR-Kompromisse).
- **Teure CSS-/Layout-Muster**, die unabhängig vom Rendering-Ansatz Browser-Neuberechnungen
  erzwingen (z. B. bestimmte Layout-Eigenschaften, die bei jeder kleinen Änderung große Bereiche
  neu berechnen lassen) — der virtuelle DOM minimiert nur, **wie viele** DOM-Schreibvorgänge
  nötig sind, nicht, wie teuer jeder einzelne im schlimmsten Fall sein kann.

**Fazit:** virtueller DOM nimmt einem eine spezifische, verbreitete Fehlerquelle ab (das
Bookmark-Beispiel oben) — er ist aber kein Freifahrtschein, sich um Performance keine Gedanken mehr
zu machen.

---

## Demo 4 — SPA vs. MPA: State & Routing

Navigation-Ablauf als Mermaid-Diagramm dokumentiert, jedes Stück App-Zustand tabellarisch in
"übersteht Reload" vs. "geht verloren" eingeteilt, Zurück-Button-Verhalten **live in der deployten
App verifiziert** (nicht nur aus dem Code hergeleitet). Details in `UE3_CHANGES.md`.

### F1: In einer klassischen Multi-Page-App — wo lebt "die Daten der aktuellen Seite" zwischen zwei Anfragen? Wo lebt das stattdessen in dieser SPA, und was sind die Konsequenzen dieses Unterschieds (im Guten wie im Schlechten)?

**Einfach gesagt:** in einer klassischen MPA lebt "der aktuelle Zustand" praktisch **nirgends im
Browser** — der Browser ist zwischen zwei Seiten quasi ein leeres Blatt, alles Wichtige liegt auf
dem **Server**. In unserer SPA lebt der Zustand die ganze Zeit **im Arbeitsspeicher des Browsers
selbst**, in einem einzigen langlebigen JavaScript-Objekt.

**Klassische MPA:** zwischen zwei Anfragen "vergisst" der Browser buchstäblich alles — jede Anfrage
ist für ihn ein komplett neuer, unabhängiger Vorgang (HTTP ist von Natur aus zustandslos). Damit
trotzdem z. B. "eingeloggt bleiben" oder "Warenkorb-Inhalt merken" funktioniert, muss der Zustand
**auf dem Server** gespeichert werden (typischerweise eine Server-seitige Session, identifiziert
über eine Session-ID, die der Browser bei jeder Anfrage automatisch als Cookie mitschickt) — oder
er wird explizit in jeder Antwort mitgeschickt (versteckte Formularfelder, Query-Parameter). Der
Browser selbst ist dabei im Grunde ein "dummes Terminal": er zeigt an, was er bekommt, und wirft
es beim nächsten Klick komplett weg.

**Unsere SPA:** der komplette App-Zustand (`state.ts`s `state`-Objekt: geladene Daten, welches
Beweisstück offen ist, welcher Tab aktiv ist, …) lebt als **ein einziges, langlebiges
JavaScript-Objekt im Arbeitsspeicher des Browser-Tabs** — solange die Seite nicht neu geladen oder
der Tab geschlossen wird, bleibt es exakt so bestehen, wie es zuletzt war. Es ist **kein einziger
Server-Roundtrip** nötig, um sich zu "erinnern", welche View gerade sichtbar ist oder welche Filter
gesetzt sind.

**Konsequenzen, im Guten:**
- Keine wiederholten Server-Anfragen nötig, nur um sich an etwas zu erinnern — sofortige,
  latenzfreie View-Wechsel (Demo 1).
- Kann reiche, komplexe JS-Objekte direkt im Speicher halten (z. B. das komplette
  `Evidence`-Array mit allen Feldern), statt alles ständig durch URLs/Cookies/versteckte
  Formularfelder zu quetschen, die nur einfache Textwerte transportieren können.

**Konsequenzen, im Schlechten:**
- **Fragil.** Ein einziger voller Reload (oder ein Tab-Absturz) löscht diesen kompletten Zustand
  sofort und vollständig — außer den bewusst nach `localStorage` geschriebenen Teilen (Bookmarks,
  Notizen, gespeicherte Hypothese, siehe Task 2 oben). Eine Server-Session in einer MPA übersteht
  dagegen einen Browser-Reload meist problemlos, weil sie gar nicht im Browser liegt.
- **Nicht geräteübergreifend.** Der Zustand lebt nur in genau diesem einen Browser-Tab — anders als
  eine Server-Session, die (bei entsprechendem Login-System) auf einem anderen Gerät mit demselben
  Account sichtbar sein könnte.
- **Nicht automatisch teilbar/verlinkbar.** Weil fast der gesamte Zustand nur im Speicher lebt und
  nicht in der URL codiert ist, kann man z. B. **kein** Link auf "genau dieses geöffnete
  Beweisstück-Detail mit diesen Filtereinstellungen" verschicken — der Hash trägt bei uns nur den
  View-Namen (`#evidence`), nicht mehr.

### F2: Diese App implementiert Routing aktuell von Hand (`handleHashChange()`, eine `if`-Ketten-Verzweigung, manuelles CSS-Klassen-Umschalten). Wofür ist eine Router-Bibliothek eigentlich zuständig, was diese handgestrickte Version *nicht* abdeckt?

**Einfach gesagt:** unsere `if`-Kette kann genau eine Sache: zwischen 5 fest bekannten,
**parameterlosen** Ansichtsnamen wechseln. Eine echte Router-Bibliothek kann erheblich mehr — vor
allem Dinge, die genau dann wichtig werden, wenn man **auf ein bestimmtes Detail** verlinken/
zurückkehren will, nicht nur auf eine von fünf groben Ansichten.

Konkret, was fehlt:
- **URL-Parameter/Deep-Linking.** Ein echter Router könnte eine Route wie `/evidence/:id` haben —
  die ID würde automatisch aus der URL geparst. Bei uns ist das **nicht möglich**: ein bestimmtes
  Beweisstück-Detail lässt sich **nicht direkt verlinken oder mit `F5` neu laden** — es ist nur
  über "erst zur Evidence-Liste navigieren, dann eine Karte anklicken" erreichbar
  (`openEvidenceDetail()` ändert den Hash überhaupt nicht, siehe Task 2/Theorie-F3).
- **Echte History-API-Integration statt Hash-Krücke.** Ein Router kann kontrolliert entscheiden,
  wann ein neuer History-Eintrag angelegt wird (`push`) und wann ein bestehender nur ersetzt wird
  (`replace`) — bei uns entscheidet das implizit der Browser selbst, je nachdem, ob sich
  `location.hash` überhaupt ändert (siehe genau das beobachtete Zurück-Button-Problem, Theorie-F3).
- **Zentrales "nicht gefunden"-Handling.** Unser Fallback ("unbekannter Hash → immer stillschweigend
  Dashboard") ist ein Sonderfall, den `handleHashChange()` selbst von Hand prüfen muss
  (`validViews.indexOf(hash) === -1`). Ein Router hat dafür ein eingebautes, generisches Konzept
  (eine dedizierte "not found"-Route), statt dass jede App das neu erfindet.
- **Aktiver-Link-Status als automatischer Nebeneffekt statt eigene Schleife.** Bei uns läuft eine
  eigene, separate Schleife über alle `.nav-btn`-Elemente, um manuell `.active` zu setzen/entfernen
  (`js/navigation.ts`) — ein Router-Ökosystem (z. B. React Router) bietet dafür meist eingebaute
  Hilfsmittel, die den aktiven Zustand automatisch aus dem aktuellen Pfad ableiten, ohne eine
  separate, von Hand synchron zu haltende Schleife.
- **Navigations-Absicherung (Race Conditions).** Unser `loadAllData()` hat **keinerlei**
  Abbruch-Logik — navigiert man während eines laufenden `fetch()` schnell weg und wieder zurück,
  könnte theoretisch eine ältere Antwort eine neuere überschreiben. Ausgereifte Router-Lösungen
  bieten dafür oft eingebaute Mechanismen (Anfragen bei Navigation automatisch abbrechen).

### F3: Wenn eine Nutzer:in jetzt den Browser-Zurück-Button drückt — was passiert in dieser App, und warum?

**Einfach gesagt:** **kommt drauf an, was gerade offen ist** — reiner View-Wechsel (z. B. Dashboard
→ Evidence) funktioniert mit Zurück tatsächlich korrekt, weil er echte Browser-History-Einträge
erzeugt. Ein geöffnetes Beweisstück-Detail dagegen **nicht** — dort tut Zurück etwas Unerwartetes.
Beides live in der deployten App geprüft, nicht nur vermutet.

**Fall 1 — reiner View-Wechsel (live verifiziert):** Dashboard → Klick auf "Evidence" (`location.hash
= "evidence"`, Browser legt dabei **automatisch** einen neuen History-Eintrag an, weil sich der
Hash-Wert tatsächlich geändert hat) → Zurück-Button gedrückt → Ergebnis: korrekt zurück auf
Dashboard. Funktioniert, **weil** jede Hash-Änderung nativ (ganz ohne App-Code) einen echten
Browser-History-Eintrag erzeugt — der native `hashchange`-Mechanismus, auf den `handleHashChange()`
lauscht, ist tatsächlich mit der Browser-History verbunden.

**Fall 2 — Beweisstück-Detail geöffnet (live verifiziert, überraschendes Ergebnis):** Dashboard →
Evidence (`#evidence`, neuer History-Eintrag) → ein Beweisstück angeklickt (`openEvidenceDetail()`
läuft, öffnet die Detail-Ansicht) → Zurück-Button gedrückt → **tatsächliches Ergebnis: Sprung
direkt zurück zum Dashboard** (URL wird wieder leer) — **nicht** zurück zur Evidence-Liste mit
geschlossenem Detail, wie man es intuitiv erwarten würde.

**Warum das so passiert:** `openEvidenceDetail()` (`js/views/evidence.ts`) ändert
`window.location.hash` **überhaupt nicht** — es zeigt die Detail-Section einfach direkt per
`classList.remove("hidden")` innerhalb derselben `#evidence`-Ansicht. Weil sich der Hash beim
Öffnen des Details nie geändert hat, hat der Browser dafür **keinen eigenen History-Eintrag**
angelegt. Aus Sicht der Browser-History gibt es also nur zwei Einträge (leerer Hash, dann
`#evidence`) — das Öffnen des Details ist in der History **unsichtbar**. Der Zurück-Button "springt"
deshalb über den erwarteten Zwischenschritt ("Detail zu, Liste offen") direkt zum tatsächlich
vorigen History-Eintrag (Dashboard). Genau das ist ein konkretes, live beobachtbares Beispiel für
die in F2 beschriebene Lücke: ein echter Router hätte fürs Öffnen eines Details typischerweise
einen eigenen History-Eintrag (z. B. `/evidence/E14`) angelegt — unsere handgestrickte Lösung tut
das nur für die fünf groben Views, nicht für Zustände innerhalb einer View.

---

## Demo 5 — React-Einführung

Eine winzige, statische JSX-Komponente (`CaseSummaryCard`, kein State/Props) geschrieben, "Komponente"
in eigenen Worten definiert und direkt gegen `renderEvidenceCardHTML()` aus dem originalen `app.js`
abgegrenzt (String-Rückgabe vs. strukturiertes Objekt). Details, Code, Analogie in `UE3_CHANGES.md`.

### F1: Was ist JSX eigentlich? Wozu wird es kompiliert?

**Einfach gesagt:** JSX ist **kein** eigenständiges neues Feature des Browsers oder von
JavaScript selbst — es ist nur eine **bequemere Schreibweise**, die ein Build-Werkzeug (bei uns
später Vite/esbuild, Demo 6) in ganz normale JavaScript-Funktionsaufrufe übersetzt, **bevor** der
Code je im Browser landet. Der Browser sieht JSX nie.

**Genauer:** JSX sieht aus wie HTML mitten in JavaScript (`<div className="...">...</div>`), ist
aber tatsächlich reine **Syntax für Funktionsaufrufe**. Unsere Beispiel-Komponente aus Task 1:

```tsx
function CaseSummaryCard() {
  return (
    <div className="case-summary">
      <h2>Project ReMotion</h2>
      <p>Investigate the failure of an AI-assisted rehabilitation robot.</p>
    </div>
  );
}
```

wird vom Compiler (moderne "automatische" JSX-Transformation, Standard seit React 17) ungefähr zu
diesem reinen JavaScript:

```js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

function CaseSummaryCard() {
  return _jsxs("div", {
    className: "case-summary",
    children: [
      _jsx("h2", { children: "Project ReMotion" }),
      _jsx("p", { children: "Investigate the failure of an AI-assisted rehabilitation robot." }),
    ],
  });
}
```

Jeder `_jsx(...)`/`_jsxs(...)`-Aufruf gibt dabei **kein** echtes DOM-Element zurück, sondern ein
**einfaches JavaScript-Objekt** — ein sogenanntes "React-Element": `{ type: "div", props: {
className: "case-summary", children: [...] } }` (vereinfacht dargestellt). Genau **das** ist der
Rohstoff des virtuellen DOM aus UE3 Demo 3 — leichtgewichtige Objekte, die React später
miteinander vergleicht ("diffen"), bevor irgendetwas am echten DOM verändert wird.

**Fazit:** JSX ist reiner **syntaktischer Zucker** über `React.createElement()`-artigen
Funktionsaufrufen — geschrieben, damit man UI-Struktur nicht als verschachtelte Funktionsaufrufe
mit vielen Klammern tippen muss, sondern in einer vertrauten, HTML-ähnlichen Form. Ohne
Build-Schritt (Vite/Babel/esbuild) ist JSX **nicht lauffähig** — kein Browser versteht `<div>`
mitten in JavaScript-Code von sich aus.

### F2: Vergleiche deine winzige Komponente mit der alten `renderEvidenceCardHTML(ev)`-Funktion (String-Verkettung, die einen HTML-String zurückgibt). Was ist grundlegend unterschiedlich daran, wie das Ergebnis jeweils zu echtem DOM wird?

**Einfach gesagt:** `renderEvidenceCardHTML()` liefert **Text**, der vom Browser komplett neu
**gelesen und interpretiert** werden muss. Meine JSX-Komponente liefert ein **fertig
strukturiertes Objekt**, das React direkt **auslesen und vergleichen** kann, ohne jemals Text zu
parsen.

**Der Weg von `renderEvidenceCardHTML()` zu echtem DOM:**
1. Funktion gibt einen **String** zurück (`'<div class="evidence-card">...' `).
2. Irgendein Aufrufer weist diesen String einem `.innerHTML` zu.
3. Der Browser **parst diesen Text als HTML** (derselbe Parser, den er auch für eine komplette
   heruntergeladene Webseite benutzt) und erzeugt daraus **komplett neue** DOM-Knoten.
4. Alle zuvor an dieser Stelle vorhandenen DOM-Knoten werden dabei **zerstört**, egal ob sich ihr
   Inhalt wirklich geändert hat (siehe UE3 Demo 3, das Bookmark-Beispiel).

**Der Weg von `CaseSummaryCard()` zu echtem DOM (über React):**
1. Funktion gibt ein **JavaScript-Objekt** zurück (kein Text) — `_jsxs("div", { ... })`, siehe F1.
2. React liest dieses Objekt **strukturell** (Tag-Name, Props, Kinder als eigene, direkt
   zugreifbare Felder) — **kein** Text-Parsing nötig.
3. React **vergleicht** dieses Objekt mit dem vorigen Render-Ergebnis (Diffing, siehe Demo 3).
4. React erzeugt/ändert **nur** die echten DOM-Knoten, bei denen der Vergleich einen Unterschied
   gefunden hat — alles andere bleibt exakt das bestehende, unangetastete DOM-Element.

**Der fundamentale Unterschied:** bei `renderEvidenceCardHTML()` ist der HTML-**Text** der einzige
Kontaktpunkt zum Browser — jede Aktualisierung bedeutet zwangsläufig "neuer Text → neu parsen →
neu bauen". Bei JSX/React ist das Zwischenergebnis ein **strukturiertes, direkt vergleichbares
Objekt** — die Aktualisierung bedeutet "vergleiche Struktur → ändere nur das wirklich
Unterschiedliche". Ersteres kennt nur "alles" oder "nichts", Letzteres kennt "genau das eine Feld".

### F3: Was bedeutet es, dass "Komponenten einfach nur Funktionen sind" in React? Was würde kaputtgehen, wenn der Funktionskörper einer Komponente bei jedem Rendern einen Seiteneffekt hätte (z. B. eine globale Variable verändert)?

**Einfach gesagt:** eine React-Komponente ist eine ganz normale JS-Funktion — mit einer
zusätzlichen, stillschweigenden **Verhaltens-Regel**: React ruft diese Funktion **wann und wie oft
es selbst will** (nicht der Code, der sie "benutzt"), und erwartet, dass zweimaliges Aufrufen mit
denselben Eingaben **keinen** Unterschied macht, außer im zurückgegebenen JSX. Verletzt man diese
Regel mit einem Seiteneffekt im Funktionskörper, bricht genau diese Annahme — mit teils sehr
verwirrenden Folgen.

**Warum React sich das Recht nimmt, eine Komponentenfunktion beliebig oft aufzurufen:** React
plant und optimiert Rendering selbst — z. B. ruft der **Strict Mode** in der Entwicklung
Komponentenfunktionen absichtlich **zweimal** pro Update auf, gezielt um genau solche
Seiteneffekt-Bugs frühzeitig sichtbar zu machen. Modernere React-Features können einen begonnenen
Render sogar komplett **verwerfen**, ohne ihn je am echten DOM anzuwenden (z. B. wenn währenddessen
eine wichtigere Aktualisierung dazwischenkommt). Die Grundannahme dahinter: eine
Komponentenfunktion aufzurufen ist "billig" und **folgenlos**, bis React sich aktiv entscheidet,
das Ergebnis wirklich zu übernehmen.

**Konkret, was kaputtgeht bei einem Seiteneffekt im Funktionskörper** (z. B.
`window.__renderCount++;` direkt im Komponenten-Code, nicht in einem dafür vorgesehenen Hook):
- **Der Effekt feuert öfter, als sichtbare Updates passieren.** Unter Strict Mode würde
  `__renderCount` bei jedem sichtbaren Update **doppelt** hochzählen — der Wert stimmt nicht mehr
  mit dem überein, was die Nutzer:in tatsächlich an Änderungen gesehen hat.
- **Der Effekt feuert sogar für Renders, die nie angezeigt werden.** Wird ein begonnener Render
  verworfen (Concurrent-Rendering-Features), hat der Seiteneffekt trotzdem schon stattgefunden —
  ein globaler Zähler steigt, eine Netzwerk-Anfrage feuert vielleicht sogar, **obwohl** am
  Bildschirm nie etwas davon sichtbar wurde. Sehr schwer nachvollziehbare Bugs ("warum steigt der
  Zähler schneller, als ich klicke?").
- **Reacts eigene Optimierungen (Batching, Neu-Ordnen von Arbeit, Wiederverwendung) verlassen
  sich genau auf diese Nebenwirkungsfreiheit.** Ist sie verletzt, wird das Verhalten der App vom
  internen Scheduling-Zeitpunkt von React abhängig — nicht mehr deterministisch vorhersagbar aus
  Sicht des eigenen Codes, Bugs werden zeitpunkt-/reihenfolgeabhängig und damit schwer reproduzierbar.

**Zum Vergleich mit unserer aktuellen App:** genau diese Disziplin fehlt (und muss auch nicht
existieren) in unserem heutigen Code — `renderEvidenceCardHTML()` darf problemlos direkt globalen
Zustand lesen, weil **wir selbst** exakt kontrollieren, wann und wie oft sie aufgerufen wird (kein
Framework ruft sie eigenmächtig auf). React führt diese "reine Funktion"-Disziplin bewusst neu ein,
gerade **weil** es selbst die Kontrolle über den Aufrufzeitpunkt übernimmt.

---

## Demo 6 — React + TypeScript Entry Point im Vite-Projekt

React + TypeScript real ins Vite-Projekt geholt (`react`, `react-dom`, `@vitejs/plugin-react`,
`@types/react`, `@types/react-dom`), minimaler Einstiegspunkt (`react.html` + `src/main.tsx` +
`src/App.tsx`) live geprüft — läuft **parallel** zur unveränderten vanilla-App, beide gleichzeitig
im Browser getestet. Details, Tabellen in `UE3_CHANGES.md`.

### F1: Was musstest du tatsächlich installieren und konfigurieren, um JSX durch Vite kompilieren zu lassen? Wofür ist jedes einzelne Teil zuständig?

**Einfach gesagt:** vier neue Pakete, zwei Konfig-Änderungen — jedes Teil hat eine klar
abgegrenzte, eigene Aufgabe, keine Überschneidung.

| Teil | Installiert als | Zuständig für |
|---|---|---|
| `react` | `dependencies` | die eigentliche React-**Bibliothek** — Komponenten-Konzept, `useState`/Hooks (später), die Logik hinter dem virtuellen DOM (UE3 Demo 3) |
| `react-dom` | `dependencies` | die Brücke von Reacts virtuellem Modell zum **echten Browser-DOM** — `createRoot(...).render(...)` ist der einzige Punkt, an dem React tatsächlich echte DOM-Knoten erzeugt/ändert |
| `@vitejs/plugin-react` | `devDependencies` | übersetzt `.tsx`/`.jsx`-Dateien (JSX-Syntax → `_jsx(...)`-Aufrufe, siehe UE3 Demo 5 F1) beim Entwickeln/Bauen, per esbuild. Bringt zusätzlich **Fast Refresh** (React-spezifisches HMR, das Komponenten-Zustand bei Code-Änderungen erhält — eine Erweiterung von Vites normalem HMR aus UE2 Demo 2) |
| `@types/react`, `@types/react-dom` | `devDependencies` | reine **TypeScript-Typdefinitionen** — React selbst ist in JavaScript geschrieben, diese Pakete liefern die `.d.ts`-Beschreibung nach, damit `tsc` React-Code überhaupt typprüfen kann (ohne sie: `Cannot find module 'react'`) |
| `tsconfig.json`: `"jsx": "react-jsx"` | Konfiguration, kein Paket | sagt **`tsc`** (nicht dem eigentlichen Compiler!), wie es JSX beim **Typprüfen** interpretieren soll — welches Modul (`react/jsx-runtime`) die JSX-Funktionen bereitstellt. Übersetzt selbst nichts, `tsc` läuft bei uns ohnehin nur zur Prüfung (`noEmit: true`, UE2 Demo 5) |
| `vite.config.js`: `plugins: [react()]` | Konfiguration | aktiviert das oben installierte Plugin tatsächlich im Build-Prozess |

**Wichtig, damit die Verantwortlichkeiten nicht verschwimmen:** `@vitejs/plugin-react` ist das
Einzige, was JSX **tatsächlich in lauffähiges JavaScript übersetzt** (genau wie schon bei
TypeScript: `tsc` prüft nur, esbuild/Vite übersetzt wirklich, UE2 Demo 5). `tsconfig.json`s
`"jsx"`-Option betrifft ausschließlich, was `tsc` beim **Prüfen** annimmt — beide müssen zur selben
Transformation passen (hier: die "automatische" Runtime), sonst würde `tsc` etwas anderes
typprüfen, als esbuild tatsächlich erzeugt.

### F2: Wie kommt deine `<App />`-Komponente vom Quellcode auf die tatsächliche Seite? Verfolge den Weg von deiner `.tsx`-Datei zum DOM.

**Einfach gesagt:** Browser lädt `react.html` → lädt `main.tsx` als Skript → `main.tsx` importiert
`App` und übergibt sie React → React baut daraus echte DOM-Knoten und hängt sie in den einen,
vorgesehenen leeren `<div>` ein.

**Schritt für Schritt:**

1. Browser fordert `react.html` an, findet darin `<div id="react-root"></div>` (leer) und
   `<script type="module" src="/src/main.tsx">`.
2. Der Browser lädt `main.tsx` — im Dev-Modus übersetzt Vite diese Datei **on demand** beim Abruf
   (esbuild + `@vitejs/plugin-react`, UE2 Demo 2), im Produktions-Build passiert dieselbe
   Übersetzung vorab bei `vite build`.
3. `main.tsx` sucht sich per `document.getElementById("react-root")` genau dieses eine leere
   `<div>` und ruft `createRoot(rootElement)` auf — das erzeugt eine **React-Root**, den
   Verwaltungspunkt, über den React ab jetzt diesen einen DOM-Ausschnitt kontrolliert.
4. `.render(<StrictMode><App /></StrictMode>)` wird aufgerufen. `<App />` ist (nach der
   JSX-Übersetzung) ein Funktionsaufruf `_jsx(App, {})` — React ruft dabei **die
   `App`-Funktion selbst auf** und bekommt deren Rückgabewert: ein React-Element-Baum (Objekte,
   kein DOM, siehe UE3 Demo 5 F1/F2).
5. React geht diesen Element-Baum durch und erzeugt — **zum ersten Mal in dieser Kette** — echte
   DOM-Knoten daraus (`document.createElement("div")`, `document.createElement("h1")`, …) und hängt
   sie unter `#react-root` ein.
6. **Erst jetzt**, am Ende dieser Kette, ist der Inhalt von `App` tatsächlich im echten,
   sichtbaren DOM und damit auf dem Bildschirm sichtbar.

Der entscheidende Punkt: **kein** Schritt zwischen 1 und 4 berührt jemals echtes DOM — bis
Schritt 5 ist alles entweder Quelltext, übersetzter JS-Code, oder reine JavaScript-Objekte
(React-Elemente). `react-dom` (genauer: die `createRoot`-API daraus) ist die **einzige** Stelle in
der ganzen Kette, die tatsächlich mit dem echten Browser-DOM spricht.

### F3: Welche Entscheidung hast du getroffen, wie vanilla- und React-Version während der Migration koexistieren, und warum? Was würde bei der entgegengesetzten Wahl schiefgehen?

**Einfach gesagt:** zwei **komplett getrennte** HTML-Seiten (`index.html` bleibt die vanilla-App
unangetastet, `react.html` ist die neue, separate React-Seite) statt einer einzigen Seite mit
Laufzeit-Umschaltung zwischen beiden Versionen.

**Die Entscheidung, konkret:** `vite.config.js`s `build.rollupOptions.input` registriert **beide**
HTML-Dateien als eigene Build-Einstiegspunkte — Vite unterstützt das nativ als "Multi-Page-App",
ganz ohne Zusatzwerkzeug. Jede der beiden Seiten lädt **nur ihr eigenes** JS-Bundle
(`js/main.ts` bzw. `src/main.tsx`) — niemals beide gleichzeitig.

**Warum diese Wahl, und nicht eine Laufzeit-Umschaltung** (z. B. ein Flag/Query-Parameter in einer
einzigen `index.html`, das zur Laufzeit entscheidet, welche App gemountet wird):
- **Garantierte Isolation.** Die vanilla-App hängt Funktionen an `window` (`window.navigateTo = ...`,
  UE2 Demo 7), hört auf `hashchange`, hat ein einziges globales `state`-Objekt. Bei einer
  gemeinsamen Seite müsste man aktiv sicherstellen, dass die React-Version davon nichts abbekommt
  (und umgekehrt) — mit zwei komplett getrennten Seiten stellt sich diese Frage gar nicht erst,
  weil zu jedem Zeitpunkt nur **eine** der beiden Apps überhaupt geladen ist.
- **Einfacher Direktvergleich.** Für die Präsentation (und für mich selbst beim Vergleichen
  während der Migration) ist "alte Version hier, neue Version da drüben" so einfach wie möglich zu
  zeigen — ein Tab-Wechsel, keine Sonderlogik zum Umschalten nötig.

**Was bei der Gegenrichtung (eine gemeinsame Seite, Laufzeit-Umschaltung) schiefgehen würde:**
- **Beide Apps' JS würde potenziell geladen/ausgeführt**, selbst wenn nur eine "sichtbar" gemountet
  ist — `js/main.ts`s `window.navigateTo = navigateTo;`-Zuweisungen (UE2 Demo 7) und React könnten
  um denselben `window`-Namensraum konkurrieren, beide könnten eigene `DOMContentLoaded`- bzw.
  Mount-Logik gleichzeitig auslösen.
- **Zusätzliche, unnötige Komplexität genau in der fragilsten Phase.** Während der Migration will
  man möglichst **wenige** bewegliche Teile gleichzeitig — eine Umschaltlogik ist selbst neuer,
  ungetesteter Code, der wieder eigene Bugs haben könnte, rein um zwei Dinge zu trennen, die man mit
  zwei Dateien für umsonst bekommt.
- **Müsste ohnehin wieder aufgeräumt werden.** Sobald Demo 9/10 die echte Shell/das Dashboard
  fertigstellen und die vanilla-App irgendwann ganz abgelöst wird (spätere Übungen), wäre die
  Umschaltlogik nur eine temporäre Krücke, die dann wieder entfernt werden müsste — die
  Zwei-Seiten-Lösung verschwindet dagegen einfach von selbst, sobald `index.html` irgendwann direkt
  auf die React-App zeigt.

---

## Demo 7 — Komponenten-Hierarchie für die gesamte App

Komponenten-Baum für die **gesamte** App entworfen (nicht nur Dashboard), als Mermaid-Diagramm in
[`UE3_DEMO7_COMPONENT_HIERARCHY.md`](UE3_DEMO7_COMPONENT_HIERARCHY.md), inkl. Props/Daten-Tabelle
für 6 konkrete Komponenten. Details dort, Kurzüberblick in `UE3_CHANGES.md`.

### F1: Welche Kriterien hast du benutzt, um zu entscheiden, ob etwas eine eigene Komponente sein soll, statt inline in einer größeren zu bleiben?

**Einfach gesagt:** eine eigene Komponente lohnt sich, sobald etwas **mehrfach gebraucht wird**,
**für sich allein verständlich** ist, oder die Eltern-Komponente sonst **zu unübersichtlich**
würde. Ein einmaliges, eng mit seinem Kontext verwobenes Stück Markup bleibt dagegen einfach
inline.

Konkret angewandte Kriterien:
- **Wiederverwendung (das stärkste Kriterium).** Taucht dieselbe visuelle/strukturelle Einheit an
  mehr als einer Stelle im Baum auf (`Badge`, `BookmarkButton`, `TagChip`, `MiniListItem`), ist sie
  eine eigene Komponente — alles andere würde bedeuten, dieselbe Markup-Logik mehrfach von Hand zu
  wiederholen, genau das Problem, das die vanilla App schon hat (siehe F2).
- **Natürliche Listen-Elemente.** Alles, was aus einem Array gemappt wird (`EvidenceCard`,
  `PersonCard`, `TimelineEventItem`, `StatCard`), braucht ohnehin eine eigene
  Komponentengrenze — React verlangt für Listen stabile `key`-Props pro Element, das erzwingt
  praktisch schon eine Komponentengrenze.
- **Eigener, klar abgegrenzter Verantwortungsbereich.** `HypothesisForm` verwaltet seinen eigenen
  Entwurfs-Zustand (Confidence, Texteingaben) unabhängig vom Rest der Workspace-Seite — eine
  eigene Komponente macht diese Verantwortung sichtbar und testbar, statt sie in einer riesigen
  `WorkspacePage`-Funktion zu verstecken.
- **Lesbarkeits-Schwelle.** Würde eine Seiten-Komponente (z. B. `DashboardPage`) sonst 200+ Zeilen
  JSX in einer einzigen Funktion enthalten, ist das ein Signal, benannte Unterteile herauszuziehen
  (`StatCard`, `ReviewProgressBar`, `RecentEvidenceList`) — auch wenn jede davon nur **einmal**
  vorkommt. Hier zählt nicht Wiederverwendung, sondern **Struktur/Benennbarkeit**: ein Name wie
  `<ReviewProgressBar />` sagt mehr als ein anonymer Block verschachtelter `<div>`s.

**Was bewusst inline bleibt:** rein einmalige, eng an ihren Kontext gebundene Markup-Fragmente ohne
eigenen sinnvollen Namen — z. B. das reine Layout-Grid, das `StatCard`s nebeneinander anordnet,
bräuchte keine eigene `StatCardGrid`-Komponente, wenn es nur ein `<div className="stats-grid">` um
eine `.map()`-Schleife ist.

### F2: Wähle eine Komponente in deinem Diagramm, die an mehr als einer Stelle in der App vorkommt. Was hat dich dazu gebracht, sie zu extrahieren statt ihr Markup zu duplizieren, und wie vergleicht sich das damit, wie die originale vanilla App genau diese Duplikation behandelt hat (oder nicht)?

**Einfach gesagt:** `Badge` — taucht in **drei** verschiedenen Views auf (Evidence-Karte,
Evidence-Detail, Timeline-Event). Die vanilla App hat diese Wiederholung nur **halb** gelöst: die
**Logik** (welche CSS-Klasse für welchen Status) ist schon in einer gemeinsamen Funktion
gebündelt — das **Markup** selbst wird trotzdem an jeder der drei Stellen von Hand neu
hingeschrieben.

**Konkret, was in der vanilla App passiert:** `js/utils.ts`s `getStatusBadgeClass()` und
`getRelevanceBadgeClass()` sind bereits geteilte Funktionen — ein Stück Wiederverwendung gibt es
also schon. Aber das eigentliche `<span class="badge ...">`-HTML wird trotzdem **an jeder
Aufrufstelle separat** zusammengebaut:
```js
// evidence.ts, renderEvidenceCardHTML():
html += '<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
// evidence.ts, renderEvidenceDetail() - fast identisch, nochmal von Hand:
// (Status-Select statt Badge, aber dieselbe Grundidee wiederholt sich)
// timeline.ts hat sogar eine EIGENE, komplett separate Funktion dafür:
function certaintyBadgeClass(certainty) { ... }  // eigene Logik, eigenes Markup
```
Die Logik ist also **teilweise** geteilt (Status/Relevance), aber für Certainty (Timeline) gibt es
eine **komplett eigene, dritte** Funktion mit eigener, leicht abweichender Fallback-Kette — genau
die Art von Drift, die entsteht, wenn Wiederholung nur teilweise bekämpft wird.

**Was mich zur Extraktion gebracht hat:** eine `Badge`-Komponente (`variant`, `label` als Props)
bündelt **Logik UND Markup an einer einzigen Stelle** — alle drei Aufrufer (`EvidenceCard`,
`EvidenceDetailPanel`, `TimelineEventItem`) reichen nur noch durch, welchen Status sie zeigen
wollen, statt das `<span class="badge ...">`-Markup selbst zu kennen. Ändert sich morgen das
Aussehen eines Badges (z. B. ein neues Icon), reicht **eine** Änderung an **einer** Stelle — bei der
vanilla App müsste man mindestens drei Funktionen einzeln finden und anpassen.

**Der Unterschied zur vanilla App, zusammengefasst:** die vanilla App konnte **Berechnungslogik**
teilen (reine Funktionen wie `getStatusBadgeClass`), aber **kein Markup** — HTML-Strings lassen
sich nicht so einfach komponieren wie Funktionsaufrufe (kein natürliches "Baustein einbetten"-
Konzept). React-Komponenten sind selbst schon Funktionen, die JSX zurückgeben — Markup **und**
Logik lassen sich dadurch gemeinsam in einer einzigen, benannten Einheit bündeln, nicht nur die
Logik-Hälfte davon.

### F3: Dein Diagramm enthält Komponenten, die du erst in späteren Übungen baust. Warum ist es sinnvoll, die gesamte Hierarchie jetzt zu entwerfen, statt nur das zu diagrammieren, was du gerade baust?

**Einfach gesagt:** einen Bauplan für ein ganzes Haus zu zeichnen, bevor man das erste Zimmer
einrichtet, ist billig — ein bereits eingerichtetes Zimmer im Nachhinein umzubauen, weil man erst
später merkt, dass die Wand woanders hätte stehen müssen, ist teuer. Architektur-Entscheidungen
sind **vor** der Umsetzung fast kostenlos zu ändern, **nach** der Umsetzung nicht mehr.

Konkrete Gründe:
- **Verhindert Interface-Nacharbeit.** Würde ich `DashboardPage` isoliert entwerfen, ohne zu
  wissen, dass `EvidencePage` später eine `EvidenceCard` braucht, könnte ich versehentlich eine
  dashboard-spezifische Mini-Karte bauen, deren Props-Form für die spätere Evidence-Liste gar nicht
  passt — mit dem vollständigen Diagramm sehe ich schon jetzt, dass `EvidenceCard` an mehreren
  Stellen (Grid, evtl. Dashboards "Recent evidence") ähnlich gebraucht wird, und kann die
  Props-Form gleich passend planen.
- **Deckt Wiederverwendungs-Chancen auf, bevor Code existiert, der dupliziert werden könnte.** Ohne
  den Gesamtblick würde ich beim Dashboard-Bau gar nicht merken, dass `Badge`/`TagChip` später in
  drei weiteren Views gebraucht werden (siehe F2) — ich würde sie isoliert fürs Dashboard bauen und
  in UE4/UE5 **erneut** von Hand duplizieren. Genau das Problem, das React eigentlich lösen soll
  (F2), würde man sich sonst selbst neu einhandeln.
- **Konsistente Namens-/Prop-Konventionen von Anfang an.** Eine einmal für die ganze App getroffene
  Entscheidung ("Status-Varianten heißen überall `variant`, nicht mal `status`, mal `kind`, mal
  `type`") verhindert, dass jede Übung ihren eigenen, leicht inkonsistenten Stil entwickelt.
- **Günstig, weil es nur ein Diagramm ist.** Der Entwurf selbst kostet nichts außer Nachdenkzeit —
  keine einzige Zeile Code muss geschrieben oder später wieder umgeschrieben werden, nur weil sich
  die große Linie später als falsch herausstellt. Genau dieselbe Lektion wie bei den TypeScript-
  Domain-Typen in UE2 (Demo 6): einmal ehrlich über die volle Form nachdenken, **bevor** man
  anfängt, ist billiger als es Stück für Stück im Nachhinein zu korrigieren.

---

## Demo 8 — Architecture Decision Record: warum SPA/React

Vollständige ADR im Standard-Format (Kontext, Entscheidung, Begründung, **ehrliche Nachteile**,
Konsequenz, verworfene Alternativen) geschrieben:
[`UE3_DEMO8_ADR_SPA_REACT.md`](UE3_DEMO8_ADR_SPA_REACT.md). Details, Bundle-Größen-Vergleich dort
und in `UE3_CHANGES.md`.

### F1: Was würdest du verlieren, wenn du diese App stattdessen als serverseitig gerendertes vanilla HTML/JS beibehalten würdest? Was würdest du verlieren, wenn du speziell React wählst statt eines *anderen* SPA-Ansatzes (z. B. vanilla JS mit Router, oder eine leichtere Bibliothek)?

**Einfach gesagt:** zwei ganz unterschiedliche Fragen — die erste ist "SPA oder nicht", die zweite
ist "React oder eine andere SPA-Lösung". Bei der ersten verliert man die Kern-Interaktion der App
selbst. Bei der zweiten verliert man vor allem Bundle-Gewicht, gewinnt aber echte, in dieser
Codebase demonstrierte Korrektheits-Vorteile.

**Teil A — Verlust bei serverseitig gerendertem vanilla HTML/JS statt SPA:**
- **Der zentrale Workflow der App würde spürbar langsamer.** Das ständige Kreuzverweisen zwischen
  Beweisstück, Person, Ort, Timeline (der Hauptgrund, warum diese App überhaupt existiert) würde
  bei **jedem** Sprung einen kompletten Server-Roundtrip + Seiten-Neuaufbau bedeuten — genau das,
  was UE3 Demo 1/2 als den historischen Auslöser für SPA-Architekturen überhaupt identifiziert hat.
- **Die Live-Suche/-Filter würde klobiger.** Aktuell filtert die Suche bei jedem Tastenanschlag
  sofort im Speicher (18 Einträge, keine Latenz spürbar) — server-seitig bräuchte das entweder eine
  Anfrage pro Tastenanschlag oder ein Formular-Submit-Modell, beides eine schlechtere UX für genau
  dieselbe kleine Datenmenge.
- **Der kostenlose, einfache Static-Host (GitHub Pages, UE2 Demo 9) wäre nicht mehr möglich** —
  echtes serverseitiges Rendern braucht einen tatsächlich laufenden Server-Prozess (oder
  zumindest Serverless-Functions), also echte, aktuell gar nicht vorhandene Infrastruktur.
- **Zum Ausgleich (ehrlich):** man würde die CSR-Nachteile aus UE3 Demo 2 (F2) zurückgewinnen —
  Inhalt sichtbar ohne JS, bessere Suchmaschinen-Indexierbarkeit. Für diese konkrete App (kein
  öffentliches SEO-Bedürfnis, siehe ADR) wiegt das aber nicht genug, um den Verlust der
  Kern-Interaktivität aufzuwiegen.

**Teil B — Verlust bei React speziell, statt vanilla JS + Router oder einer leichteren Bibliothek:**
- **Bundle-Gewicht.** Real gemessen (UE3 Demo 6): `react-*.js` allein 219 KB (gzip 69 KB) — mehr
  als das Zehnfache der gesamten bisherigen vanilla-App. Ein hand-optimierter Router + sorgfältig
  geschriebenes vanilla-Rendering, oder eine leichtere Bibliothek (Preact ist z. B. nur wenige KB
  groß), könnte einen großen Teil desselben Nutzens für einen Bruchteil dieses Gewichts liefern.
- **Zusätzliche Konzepte/Einstiegshürde** — JSX, Hooks, Reacts Render-Modell (UE3 Demo 5) sind
  Lernaufwand, den plain DOM-Code nicht hat.
- **Zum Ausgleich (der Grund, warum React trotzdem gewählt wurde):** React beseitigt **strukturell**
  eine Fehlerklasse, die in dieser konkreten Codebase **real** mehrfach aufgetreten ist (UE1s
  Aliasing-Bug, der eingefrorene Dashboard-Cache, das Bookmark-Vollneubau-Muster aus UE3 Demo 3) —
  ein hand-optimierter vanilla-Router allein würde nur das Routing-Problem lösen (UE3 Demo 4), nicht
  dieses DOM-Synchronisations-Problem. Dazu kommt der explizit pädagogische Kursgrund (siehe ADR).

### F2: Wenn diese App zwingend Nutzer:innen auf sehr schwachen Geräten oder mit schlechter Verbindung unterstützen müsste — würdest du bei SPA bleiben oder die Architektur ändern? Warum (nicht)?

**Einfach gesagt:** **Nein**, nicht bei der aktuellen, rein clientseitigen React-SPA bleiben — unter
dieser Anforderung würde ich zu einer hybriden/SSR-Architektur wechseln (die laut Aufgabenstellung
dieser Übung zwar aktuell explizit außerhalb des Scopes liegt, aber genau die richtige Antwort auf
dieses hypothetische Szenario wäre).

**Warum, konkret begründet:**
- **Schwache Geräte:** das eigentliche Problem ist oft nicht nur der **Download**, sondern das
  **Parsen und Ausführen** von JavaScript auf einer langsamen CPU. Reacts ~220 KB Bundle (**bevor**
  überhaupt eigener App-Code dazukommt) muss komplett geparst und ausgeführt werden (inkl. Reacts
  eigener Rendering-/Reconciliation-Maschinerie), **bevor** irgendetwas interaktiv ist — auf einem
  schwachen Prozessor kann allein das mehrere Sekunden kosten, unabhängig von der
  Netzwerkgeschwindigkeit. Genau die CSR-Kosten aus UE3 Demo 2 (F1/F2), hier nur deutlich verstärkt.
- **Schlechte Verbindung:** die in UE3 Demo 2 (F1) nachgezeichnete Lade-Kette (HTML → JS-Bundle
  laden → **danach erst** mehrere, teils **sequenzielle** JSON-Anfragen, siehe `data.ts`s
  `await`-Kette: `case.json` → `people.json` → `locations.json` nacheinander, nicht parallel) wird
  bei hoher Latenz unverhältnismäßig teuer — jeder zusätzliche Roundtrip multipliziert sich mit der
  Latenz, statt sich zu addieren.
- **Die richtige Antwort unter dieser harten Anforderung wäre eine hybride Architektur**
  (Server-Side Rendering bzw. Pre-Rendering, wie in Kapitel 14 des Kurs-Skripts behandelt —
  explizit außerhalb des Scopes dieser Übung, siehe Exercise-3-Einleitung): der **erste** sichtbare
  Inhalt käme dann direkt im initialen HTML, unabhängig davon, ob/wie schnell JavaScript überhaupt
  läuft — React selbst müsste dafür nicht zwingend aufgegeben werden (Frameworks wie Next.js
  rendern React-Komponenten serverseitig vor und "hydrieren" sie danach clientseitig), aber die
  **aktuelle, rein clientseitige** SPA-Architektur dieser App würde so nicht mehr ausreichen.

**Fazit:** "SPA vs. nicht-SPA" und "React vs. kein React" sind zwei getrennte Achsen — unter dieser
harten Anforderung würde primär die **Rendering-Strategie** wechseln (CSR → SSR/hybrid), nicht
zwingend das Komponenten-Modell (React könnte bleiben, nur eben serverseitig vorgerendert statt
rein clientseitig).

---

## Demo 9 — Die App-Shell migrieren

Header, NavBar, Routing-Grundgerüst (`useHashRoute`-Hook + `PageRouter`) in React/TypeScript
gebaut, fünf Platzhalter-Seiten verdrahtet. Live geprüft: alle 5 Views wechseln korrekt, aktiver
Nav-Status stimmt, ungültiger Hash fällt auf Dashboard zurück, vanilla-App bleibt unangetastet.
Details, Datei-Tabelle in `UE3_CHANGES.md`.

### F1: Wie wird "die aktuelle View" in deiner React-Shell verfolgt? Vergleiche das direkt mit `currentPage`/`handleHashChange()` aus der vanilla-Version — was ist tatsächlich unterschiedlich, was ist nur oberflächlich unterschiedlich, aber konzeptionell dasselbe?

**Einfach gesagt:** dieselbe Grund-Idee (Hash der URL auslesen, auf Änderungen hören, unbekannte
Werte auf "dashboard" abfangen) — aber wo vanilla eine geteilte Variable von Hand pflegt und
danach von Hand die passenden Render-Funktionen aufruft, übernimmt bei React das **automatisch**,
sobald sich der zugehörige State-Wert ändert.

**Konzeptionell dasselbe (nur oberflächlich unterschiedlich):**

| vanilla (`js/navigation.ts`) | React (`src/hooks/useHashRoute.ts`) |
|---|---|
| `state.currentPage` — ein Feld auf einem globalen, mutable Objekt | `useState<ViewName>` — React-interner State, an die Komponente gebunden, die den Hook aufruft |
| `window.addEventListener("hashchange", handleHashChange)` — einmalig beim App-Start registriert | `useEffect(() => { window.addEventListener("hashchange", ...) }, [])` — dieselbe native Browser-API, nur innerhalb von Reacts Lifecycle-Mechanismus registriert (inkl. sauberem Aufräumen über die Cleanup-Funktion) |
| `if (validViews.indexOf(hash) === -1) hash = "dashboard";` | `(VIEWS as readonly string[]).includes(hash) ? hash : "dashboard"` — exakt dieselbe Fallback-Logik, nur als Ausdruck statt als Zuweisung geschrieben |
| Die Quelle der Wahrheit ist **derselbe** Browser-Mechanismus in beiden Fällen: `window.location.hash` + das native `hashchange`-Event. Nichts an der eigentlichen Routing-Grundlage hat sich geändert. | |

**Tatsächlich unterschiedlich:**
- **Wie die Änderung sichtbar wird.** In vanilla **muss** `handleHashChange()` selbst explizit
  wissen, was sich beim View-Wechsel alles aktualisieren muss, und die passenden `renderX()`-
  Funktionen **von Hand aufrufen** (`if (hash === "dashboard") { renderDashboard(); ... }`). Bei
  React reicht es, `state.currentPage` (bzw. den Rückgabewert des Hooks) in JSX zu **lesen** — React
  merkt sich selbst, welche Komponenten diesen Wert benutzen, und rendert **automatisch** genau die
  neu, die betroffen sind (`NavBar` für die aktive Klasse, `PageRouter` für die sichtbare Seite) —
  ohne dass irgendwo eine explizite Liste "was muss bei einer Änderung alles neu laufen" gepflegt
  werden muss.
- **Was im DOM tatsächlich vorhanden ist.** Die vanilla App hält **alle fünf** `<section class="view">`
  durchgehend im DOM und blendet vier davon per CSS-Klasse (`.active`/kein `.active`) aus — React
  rendert dagegen **nur** die eine aktuell aktive Seiten-Komponente, die anderen vier existieren für
  diesen Render-Durchlauf im DOM **gar nicht**. Kein "unsichtbar, aber trotzdem da"-Zustand mehr.
- **Kein manuelles `.active`-Umschalten mehr.** Vanilla braucht eine eigene Schleife, die bei jedem
  View-Wechsel zuerst bei **allen** Nav-Buttons `.active` entfernt und dann bei genau einem wieder
  setzt (`js/navigation.ts`). Bei React ist `isActive` einfach ein aus dem aktuellen State
  **abgeleiteter** Wert (`item.viewName === currentView`) — es gibt keinen Zwischenzustand, in dem
  "die alte Klasse ist noch nicht entfernt", weil jedes Rendern die Klasse komplett neu aus dem
  aktuellen Zustand berechnet, statt den alten DOM-Zustand schrittweise zu verändern.

### F2: Was passiert in deiner Shell, wenn eine Nutzer:in zu einer nicht existierenden View navigiert? Wie vergleicht sich das mit dem Fallback-auf-Dashboard-Verhalten der vanilla-App?

**Einfach gesagt:** **identisch** — bewusst so entschieden, nicht zufällig. Ein ungültiger Hash
(z. B. `#nonsense`) fällt in beiden Versionen auf `"dashboard"` zurück, live geprüft in beiden.

**Konkret geprüft:** `http://localhost:5173/.../react.html#nonsense` aufgerufen → die React-Shell
zeigt das Dashboard, exakt wie die vanilla App das bei genau demselben ungültigen Hash tut
(`js/navigation.ts`: `if (validViews.indexOf(hash) === -1) hash = "dashboard";`).

**Warum ich das bewusst 1:1 übernommen habe, statt etwas "Besseres" zu bauen** (z. B. eine eigene
"Seite nicht gefunden"-Ansicht, wie sie ein echter Router typischerweise anbieten würde, siehe UE3
Demo 4, F2): das Ziel dieser Migration ist laut Aufgabenstellung **Verhaltens-Parität** — dieselbe
App, nur mit einem anderen Werkzeug gebaut, nicht eine gleichzeitige Neugestaltung. Ein
abweichendes Fallback-Verhalten wäre eine unauffällige, aber echte Verhaltensänderung gewesen, die
niemand explizit angefordert hat — genau die Art Detail, die man beim Migrieren leicht übersieht
und die dann als "das ist doch jetzt anders?"-Überraschung auffällt.

**Technisch, warum es überhaupt so einfach 1:1 ging:** `useHashRoute()`s `readCurrentView()`-
Hilfsfunktion ist bewusst als direkte Portierung von `handleHashChange()`s Fallback-Zeile
geschrieben (siehe F1-Tabelle) — dieselbe Bedingung, nur als Ausdruck statt als Zuweisung. Ein
"echter" Router (React Router, spätere Übungen) hätte dafür ein eingebautes, generischeres
"nicht gefunden"-Konzept (eine dedizierte Route/Komponente) — das hier bewusst noch **nicht**
gebaut wurde, weil Demo 9 selbst nur ein "auch ohne volle Router-Bibliothek" (siehe
Aufgabenstellung) verlangt, kein vollwertiges Routing-System.