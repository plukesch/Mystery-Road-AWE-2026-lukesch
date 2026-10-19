# Architektur der React-App (`src/`)

Die React-Seite (`react.html`, ab UE3) ist nach **Features** gegliedert, nicht nach Dateityp. Eine Änderung an
"Timeline" betrifft so einen Ordner, nicht fünf.

```
src/
  main.tsx                    Einstiegspunkt (mountet <App /> in einem HashRouter)
  app/                        die Shell: App, PageRouter (Routen-Tabelle + gemeinsamer State), Header, NavBar
  features/
    dashboard/                DashboardPage, DashboardView, IntroCard, StatCard, ...
    people-locations/         TeamLayout, PeopleTab, PersonDetail, LocationsTab, PersonCard, LocationCard, Card,
                              BulletList
    timeline/                 TimelinePage, TimelineToolbar, TimelineEventItem, CertaintyBadge, timelineHelpers.ts
    evidence/                 EvidencePage, EvidenceToolbar, EvidenceCard, EvidenceDetail, RelevanceBadge,
                              evidenceHelpers.ts
    workspace/                WorkspacePage, BookmarksList, NotesList, HypothesisForm, workspaceHelpers.ts,
                              hypothesisStorage.ts
  shared/                     nur, was von mehreren Stellen benutzt wird
    useCaseData.ts            Daten-Hook (Dashboard, People, Timeline, Evidence, Workspace)
    routes.ts                 ROUTES (alle URL-Pfade), personPath(), timelinePath(), evidencePath()
    storage.ts                localStorage-Helfer für Bookmarks und Notizen (vom State in app/PageRouter benutzt)
    bookmarks.ts              bookmarkedEvidence() (Dashboard-Zähler und Workspace-Liste, dieselbe Funktion) und
                              toggleBookmark() (die Shell ändert die Liste)
    reviewEdits.ts            ReviewEdit + applyReviewEdits(): Status-Änderungen über die geladene Liste legen
                              (Evidence, Dashboard, People & Locations)
    personEvidence.ts         "erwähnt dieses Beweisstück die Person?" (People-Detail + Evidence-Filter)
    FilterSelect.tsx          Dropdown mit versteckter Label, unkontrolliert (Timeline) oder kontrolliert
                              (Evidence)
    Badge.tsx                 wiederverwendbarer Badge (Timeline + Dashboard, 3 Stellen)
    StatusBadge.tsx           Status -> Badge-Variante (Dashboard + People-Detailseite)
  sandbox/                    Wegwerf-Beispiele (key-demo.html, mutation-demo.html), nicht Teil der App
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
- `shared/personEvidence.ts` ("erwähnt dieses Beweisstück die Person?", prüft ID **und** Anzeigename wegen E04) lag
  zuerst in `people-locations/` und zog in UE5 Demo 4 nach `shared/` um, als der Evidence-Filter "nach Person"
  dieselbe Prüfung brauchte. So zählt "Nova Byte" auf der Detailseite und im Filter nie unterschiedlich.
- `shared/bookmarks.ts` (`bookmarkedEvidence`) lag zuerst in `workspace/` und zog in UE5 Demo 4 um, als das
  Dashboard denselben Wert für seinen Zähler brauchte.

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
- Query-Parameter: `/timeline?person=<id>`. `TimelinePage` liest ihn mit `useSearchParams()` (nur lesend) und
  leitet die angezeigte Liste daraus ab; eine unbekannte oder leere Person wird ignoriert. Faustregel: **Pfad =
  was** (Identität, Pflicht), **Query = wie** (Einstellung, optional). Link darauf: `timelinePath(id)`.
- Query-Parameter: `/evidence?open=<id>` öffnet das Detail eines Beweisstücks (`EvidencePage`). Der "Open"-Link
  im Workspace ist ein `<Link>` darauf (`evidencePath(id)`).
- Zustand: bis UE4 hatten die Komponenten **keinen** eigenen Zustand; der einzige lag in
  `shared/useCaseData.ts`. Ab UE5 kommt Zustand dazu, **schrittweise** (siehe `ue5/UE5_CHANGES.md`). Stand nach
  Demo 5: **Bookmarks, Notizen und die Änderungen an Status/Relevanz** gehören mehreren Seiten (Dashboard,
  Evidence, Workspace, People) und leben deshalb im **niedrigsten gemeinsamen Vorfahren**, `app/PageRouter.tsx`
  (je ein `useState`). Die Seiten bekommen die **Werte als Props** und `EvidencePage` die **Änderungs-Callbacks**
  (`onToggleBookmark`, `onSaveNote`, `onChangeReview`). Der `localStorage` ist nur noch Speicher (beim Start
  gelesen, bei jeder Änderung geschrieben), kein zweiter Leser mehr. Was nur **eine** Komponente braucht, bleibt
  unten: die **sieben Filterwerte** in `EvidencePage` (je ein `useState`, Demo 7 macht daraus einen Reducer) und
  der Entwurf in `HypothesisForm` (ein `useState`-Objekt). Die **sichtbare Liste ist kein State**: sie wird in
  jedem Render aus (geladene Liste + Änderungen + Filter) abgeleitet (`applyReviewEdits` → `filterEvidence` →
  `sortEvidence`). Timeline ist weiter zustandslos. Das geöffnete Detail steht in der URL.
- Unveränderliche Updates (UE5 Demo 3): jede State-Änderung erzeugt ein **neues** Array/Objekt. Die geladenen
  Beweisstücke werden nie verändert; Status-Änderungen stehen separat (`reviewEdits`), `applyReviewEdits` legt sie
  über die geladene Liste. Lesende Helfer nehmen `readonly`-Parameter, damit Mutieren ein Typfehler ist.
- Unbekannte URLs leiten per `<Navigate replace>` auf das Dashboard um.

## Innerhalb eines Features

- Die `*Page.tsx` bzw. `*Layout.tsx` ist die **Feature-Komponente**: holt Daten, behandelt Lade-/Fehlerzustand.
- Die übrigen Komponenten sind **presentational**: Props rein, Markup raus. Ausnahme: die Tab-Inhalte
  (`PeopleTab`, `LocationsTab`) lesen vom Router (`useOutletContext`) und zählen deshalb zur Feature-Seite.
  Seit UE5 Demo 2 gilt das auch für `HypothesisForm`: es besitzt den Formular-Entwurf und liest/schreibt den
  `localStorage`, weil kein anderer Teil der App ihn braucht.
- Feature-lokale Helfer (reine Funktionen) liegen daneben, z. B. `timelineHelpers.ts`.

## Grenze zum Vanilla-Code (`js/`)

Die React-Seite importiert aus `js/` nur `import type` (Typen) und **reine** Funktionen (`js/utils.ts`). Nie
`js/state.ts` (hat ein eigenes Zustands-Objekt) oder Code, der `window` oder Event-Listener anfasst.

## Bekannte Schwächen

- Relative Pfade wie `../../../js/types` werden tief. Ein Pfad-Alias (`@js/…`) wäre eine spätere Verbesserung.
- Die Doku zu UE3 und UE4 Demo 1 bis 5 nennt noch die alten Pfade (`src/components/…`, `src/pages/…`) und das
  frühere handgebaute Hash-Routing (`useHashRoute`). Sie beschreibt den damaligen Stand und wurde nicht
  nachträglich geändert.
- Der Lade-/Fehler-Block (`useCaseData` + zwei frühe Returns) steckt jetzt in fünf Feature-Komponenten
  (`DashboardPage`, `TeamLayout`, `TimelinePage`, `EvidencePage`, `WorkspacePage`). Bewusst nicht extrahiert: UE5
  verschiebt das Laden in eine gemeinsame Datenschicht (Demo 5 bis 8), dann verschwinden die Kopien von selbst.
- `PageRouter` ist seit UE5 Demo 5 nicht mehr nur eine Routen-Tabelle, sondern hält auch den gemeinsamen State und
  reicht bis zu sechs Props an eine Seite weiter (`EvidencePage`). Ob das schon zu viel ist, prüfen Demo 6 und 8
  (Context).
- Filter und Suchtext von `EvidencePage` sind lokaler State: sie gehen beim Wechsel auf eine andere Seite verloren
  (in vanilla blieb der Text stehen). Status-Änderungen leben nur im Speicher und überleben keinen Neustart (wie in
  vanilla); Bookmarks und Notizen liegen zusätzlich im `localStorage`.
- Die Zeile "ID — Titel — Status-Badge" für ein Beweisstück steht zweimal (`RecentEvidenceList`,
  `PersonDetail`). Erst bei einem dritten Nutzer (Workspace, UE5) extrahieren.
- Der Leer-Zustand der Timeline ("No timeline events match …") ist mit den heutigen Daten nicht erreichbar
  (jede Person hat mindestens ein Event).
