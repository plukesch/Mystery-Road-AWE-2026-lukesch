# Architektur der React-App (`src/`)

Die React-Seite (`react.html`, ab UE3) ist nach **Features** gegliedert, nicht nach Dateityp. Eine Änderung an
"Timeline" betrifft so einen Ordner, nicht fünf.

```
src/
  main.tsx                    Einstiegspunkt (mountet <App /> in einem HashRouter)
  app/                        die Shell: App, PageRouter (Routen-Tabelle), Header, NavBar
  features/
    dashboard/                DashboardPage, DashboardView, IntroCard, StatCard, ... , bookmarks.ts
    people-locations/         TeamLayout, PeopleTab, PersonDetail, LocationsTab, PersonCard, LocationCard, Card,
                              BulletList, personEvidence.ts
    timeline/                 TimelinePage, TimelineEventItem, CertaintyBadge, timelineHelpers.ts
    evidence/                 Platzhalter (Migration in UE5)
    workspace/                Platzhalter (Migration in UE5)
  shared/                     nur, was von mehreren Stellen benutzt wird
    useCaseData.ts            Daten-Hook (Dashboard, People, Timeline)
    routes.ts                 ROUTES (alle URL-Pfade) und personPath() (Shell + Dashboard + People)
    Badge.tsx                 wiederverwendbarer Badge (Timeline + Dashboard, 3 Stellen)
    StatusBadge.tsx           Status -> Badge-Variante (Dashboard + People-Detailseite)
  sandbox/                    Wegwerf-Beispiele (key-demo.html), nicht Teil der App
```

## Regel: "shared" oder "feature-lokal"?

Eine Datei liegt in `shared/` nur dann, wenn sie **heute** von mindestens **zwei verschiedenen Stellen**
benutzt wird: zwei Features, oder die Shell und ein Feature. Hat sie nur einen Nutzer, bleibt sie im Ordner
dieses Features, auch wenn sie "allgemein aussehen könnte". Taucht später ein zweiter Nutzer auf, zieht sie nach
`shared/` um.

Beispiele aus dieser Struktur:

- `shared/useCaseData.ts` wird von Dashboard, People und Timeline benutzt: shared.
- `shared/routes.ts` (die URL-Pfade) wird von der Shell (NavBar, PageRouter) und von Features (IntroCard,
  TeamLayout) benutzt: shared.
- `people-locations/Card.tsx` und `BulletList.tsx` werden nur innerhalb von People & Locations benutzt: lokal,
  obwohl sie generisch wirken.
- `shared/Badge.tsx` wird in zwei Features an drei Stellen benutzt (`CertaintyBadge`, `StatusBadge`,
  `CaseSummaryCard`): shared. Es kam erst nach `shared/`, als der zweite Nutzer wirklich existierte.
- `timeline/CertaintyBadge.tsx` ist ein dünner Fach-Wrapper um `Badge` (übersetzt "Certainty" in eine Variante)
  mit genau einem Nutzer: lokal.
- `shared/StatusBadge.tsx` (derselbe Wrapper für "Status") lag zuerst in `dashboard/` und zog in Demo 9 nach
  `shared/` um, als die Person-Detailseite (People) ihn ebenfalls brauchte. Ein Beispiel für die Regel "zieht
  um, sobald ein zweiter Nutzer da ist".

## Abhängigkeitsrichtung

```
app  -->  features  -->  shared
```

- `shared/` importiert **nie** aus `features/` oder `app/`.
- Ein Feature importiert **nie** aus einem anderen Feature und **nie** aus `app/`.
- Einzige Stelle, an der `app/` Features kennt, ist `PageRouter.tsx` (verdrahtet Route und Seite).

Mechanisch prüfbar mit einer Textsuche über die `import`-Zeilen (siehe `ue4/UE4_CHANGES.md`, Demo 6).

## Routing

- Bibliothek: React Router, `HashRouter` (URLs wie `react.html#/team/people`). Grund: GitHub Pages ist ein
  statischer Host ohne Rewrite-Regeln, und die Assets laden relativ zu `react.html`.
- Die Routen-Tabelle steht in `app/PageRouter.tsx`, die Pfade selbst in `shared/routes.ts`.
- Verschachtelte Route: `/team` ist das Layout (`TeamLayout`: Überschrift, Tab-Leiste, lädt die Daten
  einmal), `/team/people`, `/team/people/:personId` und `/team/locations` füllen dessen `<Outlet />` und lesen
  die Daten über den Outlet-Context.
- Route mit Parameter: `/team/people/:personId`. `PersonDetail` liest die ID mit `useParams()` (Typ
  `string | undefined`) und sucht die Person in den Daten; eine unbekannte ID zeigt eine eigene
  "nicht gefunden"-Meldung. Links darauf baut `personPath(id)` (kodiert die ID für die URL).
- Unbekannte URLs leiten per `<Navigate replace>` auf das Dashboard um.

## Innerhalb eines Features

- Die `*Page.tsx` bzw. `*Layout.tsx` ist die **Feature-Komponente**: holt Daten, behandelt Lade-/Fehlerzustand.
- Die übrigen Komponenten sind **presentational**: Props rein, Markup raus. Ausnahme: die Tab-Inhalte
  (`PeopleTab`, `LocationsTab`) lesen vom Router (`useOutletContext`) und zählen deshalb zur Feature-Seite.
- Feature-lokale Helfer (reine Funktionen) liegen daneben, z. B. `timelineHelpers.ts`.

## Grenze zum Vanilla-Code (`js/`)

Die React-Seite importiert aus `js/` nur `import type` (Typen) und **reine** Funktionen (`js/utils.ts`). Nie
`js/state.ts` (hat ein eigenes Zustands-Objekt) oder Code, der `window` oder Event-Listener anfasst.

## Bekannte Schwächen

- Relative Pfade wie `../../../js/types` werden tief. Ein Pfad-Alias (`@js/…`) wäre eine spätere Verbesserung.
- Die Doku zu UE3 und UE4 Demo 1 bis 5 nennt noch die alten Pfade (`src/components/…`, `src/pages/…`) und das
  frühere handgebaute Hash-Routing (`useHashRoute`). Sie beschreibt den damaligen Stand und wurde nicht
  nachträglich geändert.
- Der Lade-/Fehler-Block (`useCaseData` + zwei frühe Returns) steckt noch in drei Feature-Komponenten
  (`DashboardPage`, `TeamLayout`, `TimelinePage`).
