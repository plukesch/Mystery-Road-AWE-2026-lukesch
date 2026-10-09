# Architektur der React-App (`src/`)

Die React-Seite (`react.html`, ab UE3) ist nach **Features** gegliedert, nicht nach Dateityp. Eine Änderung an
"Timeline" betrifft so einen Ordner, nicht fünf.

```
src/
  main.tsx                    Einstiegspunkt (mountet <App />)
  app/                        die Shell: App, PageRouter, Header, NavBar, NavButton, useHashRoute
  features/
    dashboard/                DashboardPage, DashboardView, IntroCard, StatCard, StatusBadge, ... , bookmarks.ts
    people-locations/         PeoplePage, PersonCard, LocationCard, Card, BulletList, countEvidence.ts
    timeline/                 TimelinePage, TimelineEventItem, CertaintyBadge, timelineHelpers.ts
    evidence/                 Platzhalter (Migration in UE5)
    workspace/                Platzhalter (Migration in UE5)
  shared/                     nur, was von mehreren Stellen benutzt wird
    useCaseData.ts            Daten-Hook (Dashboard, People, Timeline)
    navigation.ts             VIEWS, ViewName, navigateTo (Shell + Dashboard)
    Badge.tsx                 wiederverwendbarer Badge (Timeline + Dashboard, 3 Stellen)
  sandbox/                    Wegwerf-Beispiele (key-demo.html), nicht Teil der App
```

## Regel: "shared" oder "feature-lokal"?

Eine Datei liegt in `shared/` nur dann, wenn sie **heute** von mindestens **zwei verschiedenen Stellen**
benutzt wird: zwei Features, oder die Shell und ein Feature. Hat sie nur einen Nutzer, bleibt sie im Ordner
dieses Features, auch wenn sie "allgemein aussehen könnte". Taucht später ein zweiter Nutzer auf, zieht sie nach
`shared/` um.

Beispiele aus dieser Struktur:

- `shared/useCaseData.ts` wird von Dashboard, People und Timeline benutzt: shared.
- `shared/navigation.ts` wird von der Shell (NavBar, NavButton) und vom Dashboard (IntroCard) benutzt: shared.
- `people-locations/Card.tsx` und `BulletList.tsx` werden nur innerhalb von People & Locations benutzt: lokal,
  obwohl sie generisch wirken.
- `shared/Badge.tsx` wird in zwei Features an drei Stellen benutzt (`CertaintyBadge`, `StatusBadge`,
  `CaseSummaryCard`): shared. Es kam erst nach `shared/`, als der zweite Nutzer wirklich existierte.
- `timeline/CertaintyBadge.tsx` und `dashboard/StatusBadge.tsx` sind dünne Fach-Wrapper um `Badge` (sie
  übersetzen "Certainty" bzw. "Status" in eine Variante) und haben je genau einen Nutzer: lokal.

## Abhängigkeitsrichtung

```
app  -->  features  -->  shared
```

- `shared/` importiert **nie** aus `features/` oder `app/`.
- Ein Feature importiert **nie** aus einem anderen Feature und **nie** aus `app/`.
- Einzige Stelle, an der `app/` Features kennt, ist `PageRouter.tsx` (verdrahtet Route und Seite).

Mechanisch prüfbar mit einer Textsuche über die `import`-Zeilen (siehe `ue4/UE4_CHANGES.md`, Demo 6).

## Innerhalb eines Features

- Die `*Page.tsx` ist die **Feature-Komponente**: holt Daten, behandelt Lade-/Fehlerzustand.
- Die übrigen Komponenten sind **presentational**: Props rein, Markup raus.
- Feature-lokale Helfer (reine Funktionen) liegen daneben, z. B. `timelineHelpers.ts`.

## Grenze zum Vanilla-Code (`js/`)

Die React-Seite importiert aus `js/` nur `import type` (Typen) und **reine** Funktionen (`js/utils.ts`). Nie
`js/state.ts` (hat ein eigenes Zustands-Objekt) oder Code, der `window` oder Event-Listener anfasst.

## Bekannte Schwächen

- Relative Pfade wie `../../../js/types` werden tief. Ein Pfad-Alias (`@js/…`) wäre eine spätere Verbesserung.
- Die Doku zu UE3 und UE4 Demo 1 bis 5 nennt noch die alten Pfade (`src/components/…`, `src/pages/…`). Sie
  beschreibt den damaligen Stand und wurde nicht nachträglich geändert.
