# ADR: SPA-Architektur mit React für Project ReMotion

**Status:** Accepted (Umsetzung läuft seit UE3, wird über UE4/UE5 fortgesetzt)
**Datum:** UE3, Demo 8
**Referenziert in:** [`UE3_CHANGES.md`](UE3_CHANGES.md), [`UE3_THEORIE_ANTWORTEN.md`](UE3_THEORIE_ANTWORTEN.md)

---

## Kontext — was diese App eigentlich tut

Project ReMotion ist ein browserbasiertes **Fallakten-Explorations-Werkzeug für eine einzelne
Person** (keine Accounts, kein Login, keine Mehrbenutzer-Funktionen). Die zentrale Interaktion:
schnell und wiederholt zwischen Beweisstücken, Personen, Orten und Timeline-Ereignissen hin- und
herspringen, live filtern/suchen/sortieren, Lesezeichen setzen, Notizen schreiben, einen
Hypothesen-Entwurf mit sofort reagierendem Confidence-Regler pflegen. Die zugrunde liegenden Daten
sind **klein und statisch**: 18 Beweisstücke, 6 Personen, 6 Orte, 15 Timeline-Events — insgesamt
wenige hundert KB JSON, komplett im Speicher haltbar. Kein Server-seitiger Geschäftslogik-Code,
keine Datenbank, aktuell gehostet als reine statische Dateien auf GitHub Pages (UE2 Demo 9). Keine
öffentliche Auffindbarkeit über Suchmaschinen nötig (persönliches Kurs-Tool, kein zu indexierender
öffentlicher Inhalt).

## Entscheidung

Migration zu einer **SPA-Architektur mit React** (App-Shell + Dashboard in UE3, restliche Views in
UE4/UE5) — weg von der bisherigen, handgestrickten vanilla-SPA (UE3 Demo 1).

## Begründung — warum SPA für DIESE App die richtige Architektur ist

- **Die zentrale Interaktion der App ist genau das, was SPA am besten kann.** Ständiges,
  schnelles Kreuzverweisen zwischen Views (Beweisstück öffnen → verwandte Person nachschlagen →
  zur Timeline springen → zurück) ist der Kern-Workflow, nicht eine Nebenfunktion. Ein
  MPA-Vollneuladen bei **jeder** dieser kleinen Navigationen wäre kein theoretischer, sondern ein
  direkt spürbarer UX-Kostenpunkt bei genau der Aktion, die Nutzer:innen am häufigsten ausführen.
- **Die Daten sind bereits vollständig im Speicher — Serverseitiges Neu-Rendern brächte nichts.**
  Es gibt keine pro Anfrage unterschiedlichen, dynamisch berechneten Inhalte (kein Login, keine
  personalisierten Daten) — ein Server, der bei jedem Klick dasselbe kleine, statische Datenset neu
  zu HTML zusammenbaut, wäre reine Mehrarbeit ohne echten Gegenwert.
- **Live-Suche/-Filter über 18 Einträge profitiert direkt davon, dass alle Daten schon clientseitig
  vorliegen** — bei jedem Tastenanschlag den Server zu fragen wäre für eine so kleine Datenmenge
  unnötige Latenz.
- **Kein echtes SEO-Bedürfnis** — der CSR-Nachteil aus UE3 Demo 2 (F2: Suchmaschinen-Crawler sehen
  ohne JS praktisch nichts) trifft diese App kaum, weil sie nie öffentlich durchsuchbar sein soll.

## Begründung — warum React (und nicht ein anderer SPA-Ansatz)

- **Ein echter, in DIESER Codebase mehrfach beobachteter Fehler-Musterkomplex.** UE3 Demo 3 hat
  konkret gezeigt: die vanilla App hält DOM und Zustand von Hand synchron, und genau das war
  wiederholt Ursache echter Bugs in UE1 (die Filter-Array-Aliasing-Referenz, der eingefrorene
  Dashboard-Render-Cache) und ist bis heute die Ursache unnötiger Voll-Neubauten (Bookmark-Klick →
  komplette Liste neu). React beseitigt diese **ganze Fehlerklasse strukturell**, nicht nur den
  einen beobachteten Fall — kein hypothetischer, sondern ein an dieser konkreten App demonstrierter
  Vorteil.
- **Kurskontext, ehrlich benannt.** Ein Teil der Begründung ist explizit pädagogisch — React ist
  das in dieser Übung vorgegebene, marktrelevante Werkzeug, nicht rein aus technischer Notwendigkeit
  dieser einen kleinen App heraus gewählt. Das gehört in eine ehrliche ADR.
- **Ökosystem-Reife.** Ausgereifte, typsichere Bibliotheken (React Router für spätere Übungen),
  riesige Dokumentation/Community, geringeres langfristiges Wartungsrisiko als bei einer kleineren,
  jüngeren Bibliothek.

## Ehrliche Nachteile/Kompromisse (nicht nur Vorteile)

| Nachteil | Konkret, mit Zahl |
|---|---|
| **Deutlich mehr Grundgewicht.** | UE3 Demo 6, real gemessen: `react-*.js` allein wiegt **219 KB** (gzip 69 KB) — mehr als **das Zehnfache** der gesamten bisherigen vanilla-App (`main-*.js`, 20 KB, gzip 5,8 KB). Für eine App dieser funktionalen Größe ist das ein echter, gemessener Kostenpunkt, keine Vermutung. |
| **Reacts Kernstärke ist hier arguably unterfordert.** | React glänzt bei komplexem, tief verschachteltem, häufig wechselndem Zustand über viele interagierende Komponenten. Bei 5 Views ohne Echtzeit-Kollaboration und ohne wirklich komplexen globalen Zustand könnte ein leichteres Werkzeug (Preact, Svelte, oder sogar vanilla JS + ein kleiner Router) einen großen Teil desselben Korrektheits-/DX-Vorteils zu einem Bruchteil der Bundle-Kosten liefern. |
| **CSR-Nachteile aus Demo 2 werden nicht behoben.** | React ändert nichts daran, dass ohne JavaScript nichts von der eigentlichen App sichtbar ist (UE3 Demo 2, F2) — dafür bräuchte es SSR (z. B. Next.js), was laut Aufgabenstellung dieser Übung explizit **außerhalb des Scopes** liegt. |
| **Migrations-Risiko/-Aufwand selbst.** | Eine funktionierende, in UE1/UE2 getestete App umzuschreiben ist ein echtes Regressions-Risiko (Demo 9/10 der Aufgabe verlangt deshalb ausdrücklich, unverändertes Verhalten zu bestätigen) — ein reiner Kostenpunkt, den "so lassen, wie es ist" nicht gehabt hätte. |
| **Höhere Einstiegshürde.** | JSX, Hooks, Reacts Render-Modell (UE3 Demo 5) sind zusätzliche Konzepte gegenüber reinem DOM-Code — für dieses Solo-Kursprojekt kaum spürbar, aber für ein reales Team mit gemischter Erfahrung ein echter, nicht zu ignorierender Kostenpunkt. |

## Konsequenz

Das erhöhte Bundle-Gewicht und der Migrationsaufwand werden bewusst in Kauf genommen, im Austausch
gegen die strukturelle Beseitigung einer real demonstrierten Fehlerklasse und den beabsichtigten
Lerneffekt, den diese Übungsreihe (UE3–UE5) explizit verfolgt.

## Betrachtete Alternativen

| Alternative | Warum verworfen |
|---|---|
| Vanilla bleibt, nur kleine Hand-Optimierungen (z. B. selbstgebautes Diffing) | würde React in schlechterer Form selbst neu erfinden — mehr eigener Code zum Warten, weniger ausgereift |
| Vanilla JS + nur ein kleiner Router, kein Framework | löst das Routing-Problem (UE3 Demo 4), aber **nicht** das eigentlich demonstrierte Problem (DOM/Zustand-Synchronisation, Demo 3) |
| Leichteres Framework (Preact, Svelte, Solid) | technisch plausibel, kleineres Bundle — aber außerhalb des Scopes dieser Übung (React ist laut Aufgabenstellung/Kapitel-Lektüre vorgegeben) |
| Echtes SSR (z. B. Next.js) | von der Aufgabenstellung selbst explizit als "out of scope for this exercise" markiert |
