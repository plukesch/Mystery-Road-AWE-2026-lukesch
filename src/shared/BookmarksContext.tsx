// ---------------------------------------------------------------------
// BOOKMARKS ALS CONTEXT (ue5 demo 8)
// bis demo 7 hielt PageRouter die bookmarks und gab sie als PROPS (plus einen
// Callback) an Dashboard, Evidence und Workspace weiter. jetzt besitzt diese
// komponente den State, und jede komponente darunter liest ihn direkt mit
// useBookmarks() - ohne dass eine zwischen-komponente ihn durchreicht.
//
// WICHTIG: Context ist kein State. Der State steht weiter in einem ganz normalen
// useState (unten). Context transportiert nur den WERT von hier zu den
// Komponenten darunter, ohne Props-Kette.
// ---------------------------------------------------------------------
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toggleBookmark } from "./bookmarks";
import { loadBookmarks, saveBookmarks } from "./storage";

interface BookmarksContextValue {
  bookmarks: readonly string[];
  // wie vorher der Callback onToggleBookmark: der Besitzer legt die Regel fest
  // (neue Liste berechnen, State setzen, speichern), die Nutzer melden nur.
  toggle: (evidenceId: string) => void;
}

// null = "kein Provider darueber". useBookmarks() prueft das und wirft einen
// klaren Fehler, statt mit einem halb leeren Wert weiterzumachen.
const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  // eine FUNKTION als startwert: der localStorage wird nur beim ersten rendern gelesen
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);

  // useMemo: das Wert-Objekt bleibt dasselbe, solange sich die bookmarks nicht
  // aendern. Context vergleicht den Wert per Referenz - ein neues Objekt bei jedem
  // Rendern wuerde ALLE Nutzer jedes Mal neu rendern lassen, auch wenn sich nichts
  // geaendert hat (siehe THEORIE_ANTWORTEN demo 8 F1).
  const value = useMemo<BookmarksContextValue>(
    () => ({
      bookmarks,
      toggle: (evidenceId) => {
        const next = toggleBookmark(bookmarks, evidenceId);
        setBookmarks(next);
        saveBookmarks(next);
      },
    }),
    [bookmarks]
  );

  // React 19: der Context selbst ist der Provider (frueher <BookmarksContext.Provider>).
  return <BookmarksContext value={value}>{children}</BookmarksContext>;
}

export function useBookmarks(): BookmarksContextValue {
  const value = useContext(BookmarksContext);
  if (value === null) {
    throw new Error("useBookmarks() must be used inside <BookmarksProvider>");
  }
  return value;
}
