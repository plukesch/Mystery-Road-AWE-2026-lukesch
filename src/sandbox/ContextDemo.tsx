// ---------------------------------------------------------------------
// WEGWERF-BEISPIEL (ue5 demo 8) - gehoert NICHT zur migrierten app.
// zeigt, was Context NICHT ist: ein State-Manager mit "Auswahl". der Wert im
// Context ist EIN Objekt { a, b }. zwei Nutzer lesen je nur EIN Feld - und
// werden trotzdem beide neu gerendert, sobald sich irgendein Feld aendert.
// ausserdem: ausserhalb eines Providers gibt es den Wert gar nicht.
// "gerendert: n x" zaehlt im Render-Koerper (deshalb ohne StrictMode, siehe
// context-main.tsx).
// ---------------------------------------------------------------------
import { createContext, memo, useContext, useState, type ReactNode } from "react";

interface Shared {
  a: number;
  b: number;
}

const SharedContext = createContext<Shared | null>(null);

function Provider({ children }: { children: ReactNode }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  return (
    <SharedContext value={{ a, b }}>
      <p>
        <button type="button" className="btn btn-secondary" onClick={() => setA(a + 1)}>
          a + 1
        </button>{" "}
        <button type="button" className="btn btn-secondary" onClick={() => setB(b + 1)}>
          b + 1
        </button>
      </p>
      {children}
    </SharedContext>
  );
}

let rendersA = 0;
let rendersB = 0;
let rendersMemoA = 0;

// liest NUR a
function ConsumerA() {
  const shared = useContext(SharedContext);
  rendersA += 1;
  return (
    <p id="consumer-a">
      A liest nur a = {shared?.a} &middot; gerendert: {rendersA}&times;
    </p>
  );
}

// liest NUR b
function ConsumerB() {
  const shared = useContext(SharedContext);
  rendersB += 1;
  return (
    <p id="consumer-b">
      B liest nur b = {shared?.b} &middot; gerendert: {rendersB}&times;
    </p>
  );
}

// liest nur a UND ist in memo() gepackt: memo ueberspringt ein Neurendern, wenn sich
// die PROPS nicht aendern. Ein geaenderter CONTEXT-Wert ist aber keine Prop - er
// loest das Neurendern trotzdem aus.
const MemoConsumerA = memo(function MemoConsumerA() {
  const shared = useContext(SharedContext);
  rendersMemoA += 1;
  return (
    <p id="consumer-memo">
      A in memo() liest nur a = {shared?.a} &middot; gerendert: {rendersMemoA}&times;
    </p>
  );
});

// steht ausserhalb des Providers
function Outside() {
  const shared = useContext(SharedContext);
  const text = shared === null ? "kein Wert (null)" : "Wert";
  return <p id="outside">Ausserhalb des Providers: {text}</p>;
}

export function ContextDemo() {
  return (
    <div className="stub-page" style={{ maxWidth: 900 }}>
      <h2>Context-Demo (Wegwerf-Beispiel)</h2>
      <ol>
        <li>Auf "a + 1" klicken: A und B zaehlen beide hoch, obwohl B nur b liest.</li>
        <li>Auf "b + 1" klicken: wieder beide. memo() hilft nicht.</li>
      </ol>
      <Provider>
        <ConsumerA />
        <ConsumerB />
        <MemoConsumerA />
      </Provider>
      <Outside />
    </div>
  );
}
