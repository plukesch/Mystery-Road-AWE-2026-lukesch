// ---------------------------------------------------------------------
// APP-SHELL (ue3 demo 9)
// ersetzt den demo-6-platzhalter. spiegelbild von js/main.ts + js/navigation.ts,
// aber react-idiomatisch: EIN useHashRoute()-aufruf statt state.currentPage +
// manuell aufgerufener render-funktionen. header-inner-verschachtelung
// (header > header-inner > brand + nav) 1:1 aus index.html uebernommen,
// damit dasselbe css unveraendert weiter passt.
// ---------------------------------------------------------------------
import { Header } from "./components/Header";
import { NavBar } from "./components/NavBar";
import { PageRouter } from "./PageRouter";
import { useHashRoute } from "./hooks/useHashRoute";

export function App() {
  const currentView = useHashRoute();

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <Header />
          <NavBar currentView={currentView} />
        </div>
      </header>

      <main className="app-main">
        <PageRouter view={currentView} />
      </main>
    </>
  );
}
