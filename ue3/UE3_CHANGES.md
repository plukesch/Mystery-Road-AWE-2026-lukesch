# UE3 CHANGES

Laufendes Änderungsprotokoll für Exercise 3 (React Foundations & First Migration).
Baut auf dem fertigen Stand von [`../ue2/UE2_CHANGES.md`](../ue2/UE2_CHANGES.md) auf (Vite +
TypeScript + CI/CD aus UE2 sind Voraussetzung). Migriert App-Shell + Dashboard-View nach React,
der Rest der App bleibt vorerst vanilla TS (kommt in UE4/UE5).

---

## Demo 1 — Historischer Überblick über die Web-Entwicklung

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Bevor wir React einführen, lohnt sich die Frage: **warum gibt es React (und Frameworks wie es)
überhaupt?** Die Antwort ist eine Geschichte, keine Design-Entscheidung aus dem Nichts — jede neue
Technik war die Antwort auf ein konkretes Problem der vorigen. Fünf grobe Epochen:

| Epoche | Ca. Zeitraum | Wie Interaktion funktionierte |
|---|---|---|
| **1. Statische Dokumente** | früh-/Mitte 1990er | Der Server schickt fertiges HTML. Jeder Klick auf einen Link = neue Anfrage, neue Seite, kompletter Neuaufbau. Keine "App", nur verlinkte Dokumente |
| **2. Serverseitig dynamisch generiert** | Mitte/Ende 1990er | HTML wird jetzt **pro Anfrage** vom Server zusammengebaut (CGI, PHP, ASP, JSP) — Inhalt kann sich unterscheiden (z. B. eingeloggter Nutzer), aber **jede** Interaktion ist immer noch ein kompletter Seiten-Neuladen |
| **3. AJAX / "Web 2.0"** | ab ca. 2004/2005 | JavaScript kann jetzt **im Hintergrund** nachfragen (`XMLHttpRequest`), ohne die Seite neu zu laden, und nur einen **Teil** der Seite aktualisieren. jQuery (2006) macht das browserübergreifend praktikabel. Seiten fühlen sich zum ersten Mal "lebendig" an (Gmail, Google Maps) |
| **4. SPA-Frameworks** | ab ca. 2010–2013 | Die **ganze Seite** wird zu einer einzigen, dauerhaft laufenden JS-Anwendung. Navigation passiert **client-seitig** (zuerst per URL-Hash, später per History-API), kein Seiten-Reload mehr überhaupt. Backbone.js, AngularJS, dann React (2013), Vue (2014) |
| **5. Hybride/moderne Architekturen** | ab ca. 2016 | Frameworks, die SPA-Interaktivität **mit** den SEO-/Ladezeit-Vorteilen von serverseitigem Rendering kombinieren (Next.js, Nuxt, …) — Thema in einer späteren Übung |

*Analogie:* Epoche 1 ist ein gedrucktes Buch (ganz neu drucken für jede Änderung). Epoche 2 ist ein
Drucker, der bei jeder Anfrage neu druckt, aber den Inhalt anpassen kann. Epoche 3 ist ein
Whiteboard, auf dem man einzelne Wörter austauschen kann, ohne alles neu zu schreiben. Epoche 4
ist ein digitales Whiteboard mit einem eingebauten Assistenten, der selbst herausfindet, welche
Wörter sich geändert haben und nur die austauscht.

### Task — wo steht unsere App auf dieser Zeitlinie, und warum?

**Unsere App gehört eindeutig in Epoche 4 (SPA), und zwar in deren frühe, handgestrickte Variante
— ohne Framework, mit Hash-Routing.**

Konkrete, beobachtbare Belege dafür:

| Merkmal in unserer App | Was das über die Einordnung aussagt |
|---|---|
| **Kein Backend überhaupt.** Der "Server" ist nur ein statischer Datei-Server (`vite preview`/GitHub Pages) — er generiert nichts, er liefert nur Dateien aus | Schließt Epoche 1+2 aus (dort generiert der Server aktiv HTML pro Anfrage) |
| **`fetch()` lädt JSON-Dateien im Hintergrund nach** (`js/data.ts`), ohne Seiten-Reload, aktualisiert dann nur Teile des DOM | Klassisches AJAX-Muster (Epoche 3) — aber... |
| **...es gibt gar keinen vollständigen Seiten-Reload zwischen Views, jemals.** Ein Klick auf "Evidence" tauscht nur den sichtbaren Abschnitt aus (`navigateTo()`/`handleHashChange()`, `js/navigation.ts`), die ganze Seite bleibt eine einzige, durchgehend laufende JS-Anwendung | Das ist der entscheidende Unterschied zu Epoche 3 — die **ganze** App ist eine Seite, nicht viele einzelne Server-Seiten mit AJAX-Häppchen obendrauf. Das ist Epoche 4: SPA |
| **`#dashboard`, `#evidence`, ... als URLs** (`window.location.hash`) statt echter Pfade wie `/dashboard` | Genau das Hash-Routing-Muster, das **vor** der breiten Nutzung der History-API üblich war (siehe Theorie-F2 unten) — architektonisches Kennzeichen der **frühen** SPA-Ära, ca. 2010–2014 |
| **Kein Framework, kein Router, kein Zustands-Management** — alles handgeschrieben (`state.ts` als einfaches Objekt, `if`-Kette in `handleHashChange()`) | Genau das Muster, das Teams **vor** der Verbreitung von Backbone/Angular/React selbst bauen mussten, weil es noch keine Standard-Lösung dafür gab |

**Einordnung:** die App ist zwar erst kürzlich für diesen Kurs geschrieben worden, reproduziert
aber bewusst-unbewusst exakt das architektonische Muster einer **frühen, vor-Framework-SPA** (ca.
2010–2014) — technisch das, was ein Team damals hätte bauen müssen, weil React/Vue/ein
ausgereifter Router noch nicht existierten oder noch nicht verbreitet waren. Das macht sie zum
idealen Ausgangspunkt für diese Übung: Demo 6–10 migrieren genau diese handgestrickten Teile
(Routing, Rendering) zu dem, was Epoche 4 später standardisiert hat — React.

### Verifikation
Kein Code geändert (reine Konzept-/Einordnungs-Demo). Belege oben direkt aus bestehenden Dateien
abgeleitet (`js/navigation.ts`, `js/data.ts`, `js/state.ts`).

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Die Tabelle/Zeitlinie zeigen**, kurz durchgehen, den einen Satz sagen: "jede neue Technik war
die Antwort auf ein konkretes Problem der vorigen — kein Zufall, keine Mode."

**2. Live an der eigenen App zeigen, warum sie Epoche 4 ist**
DevTools → Network-Tab öffnen, zwischen zwei Views klicken (z. B. Dashboard → Evidence). Zeig: **kein
neuer Dokument-Request** in der Liste — nur ggf. `data/*.json`, falls noch nicht geladen. Sag: "kein
einziger voller Seiten-Reload, obwohl sich die URL (`#evidence`) ändert."

**3. `js/navigation.ts` kurz aufmachen**
Zeig `handleHashChange()` — die `if`/`else if`-Kette, die manuell entscheidet, was gerendert wird.
Sag: "das ist genau die Handarbeit, die ein Framework wie React später standardisiert."

---

## Demo 2 — SSR vs. CSR

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

**SSR (Server-Side Rendering)** heißt: der Server baut das **fertige** HTML mit den echten
Inhalten und schickt es so. **CSR (Client-Side Rendering)** heißt: der Server schickt nur ein
fast leeres HTML-Gerüst + JavaScript, und **der Browser selbst** baut daraus erst den eigentlichen
Inhalt zusammen, per Code.

*Analogie:* SSR ist ein Restaurant, das dir ein **fertig gekochtes** Gericht bringt. CSR ist ein
Restaurant, das dir eine **Kochbox mit rohen Zutaten und einem Rezept** bringt — du (der Browser)
musst erst selbst kochen, bevor überhaupt etwas Essbares auf dem Tisch steht.

### Task 1 — Vergleichstabelle

| | **SSR** | **CSR** |
|---|---|---|
| **Was der Server bei der ersten Anfrage schickt** | vollständiges HTML, **bereits mit echten Inhalten gefüllt** — Text ist sofort da, sobald das HTML ankommt | ein fast leeres HTML-"Gerüst" (oft nur ein `<div id="root"></div>`) + Links auf JS-/CSS-Dateien — der eigentliche Inhalt fehlt komplett |
| **Was der Browser tun muss, BEVOR Inhalt sichtbar ist** | nur: HTML empfangen und parsen — Inhalt ist von Anfang an im HTML enthalten | HTML laden → JS-Datei(en) laden → JS parsen und ausführen → JS baut den DOM selbst zusammen (oft erst nach eigenem Nachladen von Daten) |
| **Was bei nachfolgender Navigation passiert** | klassisch: komplett neue Anfrage an den Server, komplett neue HTML-Antwort (moderne SSR-Frameworks mischen das oft mit späterer clientseitiger Navigation) | **keine** neue Anfrage für die Seite selbst — JS tauscht nur den betroffenen DOM-Teil aus, lädt bei Bedarf nur neue **Daten** nach (nicht die ganze Seite) |

### Task 2 — echte Webseite, mit beobachtbarem Beweis eingeordnet

**Wikipedia = SSR.** Live per Browser-Tools geprüft (nicht nur behauptet): die Netzwerk-Antwort auf
die erste Anfrage einer Artikelseite (`en.wikipedia.org/wiki/Single-page_application`) ist ein
vollständiges HTML-Dokument, das bereits die komplette Seitenstruktur (Kopfzeile, Navigation,
Artikel-Gerüst) enthält — **kein** leeres `<div id="root">`. Zwei konkrete, direkt im HTML sichtbare
Belege:

1. Das `<html>`-Tag trägt von Anfang an die Klasse **`client-nojs`** — ein Fallback-Zustand, den
   MediaWiki (Wikipedias Software) extra für Besucher:innen **ohne** JavaScript pflegt. Eine
   Software würde sich diese Mühe nicht machen, wenn die Seite ohne JS gar nicht funktionieren
   würde (klassisches CSR-Verhalten) — das ist ein starkes Indiz, dass der eigentliche Inhalt schon
   ohne JS da ist.
2. `<meta name="generator" content="MediaWiki 1.47.0-wmf.21">` — der Server selbst hat dieses HTML
   gerade eben, für genau diese Anfrage, aus einer Wiki-Datenbank **serverseitig generiert**.

Ein direkter Blick in den restlichen HTML-Body (nicht in dieser Doku abgedruckt, im Netzwerk-Tab
selbst nachvollziehbar) zeigt: der komplette Artikeltext ist bereits Teil dieser ersten Antwort.

### Verifikation
Task 2 live über die Browser-Netzwerk-Antwort geprüft (kein reines "sollte SSR sein" aus dem
Gedächtnis) — siehe Belege oben.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Wikipedia als SSR-Beweis**
`en.wikipedia.org` auf einen beliebigen Artikel, `F12` → Network-Tab → die erste Dokument-Anfrage
anklicken → Response-Tab. Zeig: der komplette Artikeltext steht schon im rohen HTML, **bevor**
irgendein JS gelaufen ist. Zeig `class="client-nojs"` im `<html>`-Tag.

**2. Unsere App als CSR-Gegenbeweis**
Unsere deployte GitHub-Pages-URL öffnen, `F12` → Network-Tab, Seite neu laden. Zeig: die erste
Dokument-Antwort (`index.html`) ist **winzig** im Vergleich — öffne sie im Response-Tab, zeig,
dass z. B. `<div id="evidenceList" class="evidence-grid"></div>` **leer** ist. Zeig danach die
JS-Datei (`assets/index-*.js`) und die nachfolgenden `data/*.json`-Requests — "der Inhalt kommt
hier komplett separat, nach dem HTML, über JavaScript."

---

## Demo 3 — Der virtuelle DOM

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

**Was ist der virtuelle DOM, in eigenen Worten?** Eine **leichtgewichtige, rein in JavaScript
gehaltene Kopie** dessen, wie der echte DOM aussehen soll — ein Baum aus einfachen
JavaScript-Objekten, kein einziges echtes Browser-Element dabei. Ändert sich etwas, baut die
Bibliothek (z. B. React) eine **neue** solche Kopie, **vergleicht** sie mit der **vorigen** Kopie
("diffing") und findet dabei genau heraus, was sich wirklich unterscheidet. Erst **dann** werden
am echten DOM nur genau die Stellen angefasst, die sich tatsächlich geändert haben.

*Analogie:* Stell dir einen 50-seitigen gedruckten Bericht vor, bei dem sich auf **einer** Seite
ein Tippfehler geändert hat. Unser aktueller Ansatz (`innerHTML = ...`) ist: den **kompletten**
Bericht neu drucken und komplett austauschen — auch wenn 49 von 50 Seiten identisch geblieben
sind. Der virtuelle-DOM-Ansatz ist: zuerst eine **billige Wegwerf-Kopie** (auf Schmierpapier, nicht
gedruckt) von "wie soll der Bericht jetzt aussehen" anfertigen, Seite für Seite mit der alten
Wegwerf-Kopie vergleichen, feststellen "nur Seite 47 unterscheidet sich" — und **nur diese eine
Seite** im echten, gedruckten Bericht austauschen.

**Welches Problem löst das?** Direkte DOM-Manipulation hat vorher zwei unschöne Optionen gehabt:
entweder **von Hand ganz genau** aufschreiben, welches einzelne Element sich wie ändern soll
(präzise, aber mühsam, fehleranfällig, wird bei komplexer UI schnell unübersichtlich), oder **den
einfachen Weg** gehen und einfach den ganzen betroffenen Bereich neu zusammenbauen
(`innerHTML = ganzerNeuerString` — simpel zu schreiben, aber verschwenderisch: zerstört und baut
weit mehr DOM neu, als nötig wäre). Der virtuelle DOM gibt beides zugleich: man schreibt einfachen,
deklarativen Code ("so soll die Komponente aussehen, als würde sie immer von Null gezeichnet"),
bekommt aber effiziente, chirurgisch genaue Updates am echten DOM automatisch — weil der
Diffing-Schritt selbst herausfindet, was minimal geändert werden muss.

### Task — konkretes Beispiel im ORIGINALEN `app.js` (vor UE1)

**Gefunden in `app.js`, Zeilen 434–449 (`handleBookmarkClick`) + 369–394 (`renderEvidenceList`):**

```js
function handleBookmarkClick(evidenceId) {
  var ev = findEvidenceById(evidenceId);
  if (!ev) return;
  if (bookmarks.indexOf(evidenceId) === -1) {
    bookmarks.push(evidenceId);
    ev.bookmarked = true;
  } else {
    bookmarks = bookmarks.filter(function (id) { return id !== evidenceId; });
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (currentPage === "evidence") renderEvidenceList();   // <- das komplette Grid!
}

function renderEvidenceList() {
  // ...
  var results = getFilteredEvidence();
  var html = "";
  for (var i = 0; i < results.length; i++) {
    html += renderEvidenceCardHTML(results[i]);   // <- ALLE Karten neu gebaut
  }
  container.innerHTML = html;   // <- kompletter Grid-Inhalt ersetzt
}
```

**Was hier passiert, wenn man EIN Lesezeichen anklickt:** `bookmarks`-Array ändert sich um genau
**einen** Eintrag. Aber `handleBookmarkClick` ruft danach `renderEvidenceList()` auf — und die
baut **alle** gefilterten Beweisstücke (bis zu 18 Karten) komplett neu als HTML-String zusammen
(`renderEvidenceCardHTML()` für **jede einzelne** Karte, nicht nur die betroffene) und ersetzt mit
`container.innerHTML = html` den **kompletten** Inhalt des Grids auf einmal. Tatsächlich geändert
hätte sich nur: ein Stern-Symbol (★ statt ☆) und eine CSS-Klasse (`active`) an **einem einzigen**
Button in **einer einzigen** Karte.

*(Derselbe Musterfehler steckt übrigens bis heute auch in der aktuellen TypeScript-Version —
`views/evidence.ts`s `handleBookmarkClick` ruft ebenfalls die volle `renderEvidenceList()` auf. Der
UE1-Refaktor hat nur Dateien aufgeteilt, nicht die Render-Strategie geändert — genau das ist der
Teil, den React/der virtuelle DOM jetzt lösen soll.)*

### Verifikation
Kein Code geändert (Konzept-Demo). Beispiel direkt im Original-Quelltext (`app.js`) verifiziert,
Zeilennummern oben zitiert.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. `app.js` aufmachen, Zeile 448 zeigen**
`if (currentPage === "evidence") renderEvidenceList();` — sag: "ein Klick auf EINEN Stern ruft das
auf, was die KOMPLETTE Liste neu baut."

**2. Live im Browser beweisen**
Deployte App öffnen (oder `npm run dev`), Evidence-View, DevTools → Elements-Tab, ein Beweisstück-
Karten-Element im DOM-Baum aufklappen/markieren. Auf den Bookmark-Stern klicken. Zeig: im
Elements-Tab **blinkt kurz die komplette Liste** (Chrome hebt neu eingefügte DOM-Knoten farblich
hervor) — nicht nur die eine Karte.