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