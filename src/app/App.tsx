// ---------------------------------------------------------------------
// APP-SHELL (ue3 demo 9, ue4 demo 8: router)
// header-inner-verschachtelung (header > header-inner > brand + nav) 1:1 aus
// index.html uebernommen, damit dasselbe css unveraendert weiter passt.
// ab demo 8 weiss die shell NICHT mehr selbst, welche seite aktuell ist
// (frueher useHashRoute + currentView als prop): das steckt jetzt im router,
// NavBar und PageRouter fragen ihn selbst.
// ---------------------------------------------------------------------
import { Header } from "./Header";
import { NavBar } from "./NavBar";
import { PageRouter } from "./PageRouter";

export function App() {
  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <Header />
          <NavBar />
        </div>
      </header>

      <main className="app-main">
        <PageRouter />
      </main>
    </>
  );
}
