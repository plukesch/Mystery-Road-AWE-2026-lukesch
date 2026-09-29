// ---------------------------------------------------------------------
// ROOT-KOMPONENTE (ue3 demo 6)
// noch kein shell/routing (demo 9), noch kein dashboard (demo 10) -
// nur der minimale beweis, dass react+ts+vite hier zusammenspielen.
// ---------------------------------------------------------------------
export function App() {
  return (
    <div className="react-placeholder">
      <h1>Project ReMotion &mdash; React-Shell (WIP)</h1>
      <p>
        Dies ist der React-Einstiegspunkt aus UE3 Demo 6. Die echte App-Shell (Header, Navigation,
        Routing) kommt in Demo 9, das Dashboard in Demo 10 &mdash; bis dahin beweist diese Seite
        nur, dass React, TypeScript und Vite hier korrekt zusammenspielen.
      </p>
      <p>
        Die bestehende, voll funktionsfähige vanilla-App bleibt unverändert unter{" "}
        <a href="/">der Startseite</a> erreichbar.
      </p>
    </div>
  );
}
