// ---------------------------------------------------------------------
// KLEINER TYPISIERTER DOM-HELFER
// demo 7 (ue2): getElementById() ist laut typ "HTMLElement | null" (eine
// beliebige id KOENNTE fehlen) - unsere ids sind aber fest in index.html
// verdrahtet und garantiert da, wenn die jeweilige view gerendert wird.
// buendelt das "ich weiss es hier besser als der allgemeine DOM-typ" an
// EINER stelle, statt es an jedem einzelnen aufruf zu wiederholen (mit
// "as X" + "!" ueberall). wirft einen klaren fehler statt des kryptischen
// "Cannot read properties of null" - sonst identisches verhalten (haette
// vorher auch gecrasht, wenn das element wirklich gefehlt haette).
// ---------------------------------------------------------------------
export function requireElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Expected #${id} to exist in the DOM`);
  }
  return el as T;
}
