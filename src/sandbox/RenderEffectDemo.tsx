// ---------------------------------------------------------------------
// WEGWERF-BEISPIEL (ue6 demo 1) - gehoert NICHT zur migrierten app.
// zeigt nebeneinander:
//  - links:  eine komponente mit SEITENEFFEKTEN IM RENDER (absichtlich falsch)
//  - mitte:  dieselbe Aufgabe richtig (Effekt, Event-Handler, useId, State)
//  - rechts: ein ABGELEITETER Wert im Render (rechnen ist KEIN Seiteneffekt)
// plus ein "Messgeraet", das Konsole und localStorage mithoert.
// mit StrictMode (Standard) und ohne (?strict=0) aufrufbar.
// ---------------------------------------------------------------------
import { useEffect, useId, useState } from "react";

// ---- Messgeraet (absichtlich NICHT rein: nur in dieser Sandbox) -------------
interface Counters {
  consoleLogs: number;
  lastRenderWrites: number;
  noteWrites: number;
  pureCalls: number;
}

interface DemoWindow {
  __renderEffectCounters?: Counters;
  __renderEffectWrapped?: boolean;
}

// die Zaehler stehen am window, damit sie ein Neuladen des Moduls (HMR) ueberleben.
const demoWindow = window as unknown as DemoWindow;
const counters: Counters = demoWindow.__renderEffectCounters ?? {
  consoleLogs: 0,
  lastRenderWrites: 0,
  noteWrites: 0,
  pureCalls: 0,
};
demoWindow.__renderEffectCounters = counters;

// console.log und localStorage.setItem EINMAL umhuellen und mitzaehlen
if (!demoWindow.__renderEffectWrapped) {
  demoWindow.__renderEffectWrapped = true;

  const originalLog = console.log.bind(console);
  console.log = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("[demo]")) counters.consoleLogs += 1;
    originalLog(...args);
  };

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
    if (key === "demo-last-render") counters.lastRenderWrites += 1;
    if (key === "demo-note") counters.noteWrites += 1;
    originalSetItem.call(this, key, value);
  };
}

// ---- links: FALSCH - Seiteneffekte im Render --------------------------------
let badRenderCalls = 0; // eine Variable AUSSERHALB der Komponente
let nextInstanceId = 1; // eine "Ids vergeben"-Zaehlerei AUSSERHALB der Komponente

function BadRender() {
  // (1) die Aussenwelt veraendern: eine Modulvariable hochzaehlen
  badRenderCalls += 1;
  // (2) in die Konsole schreiben
  console.log("[demo] BadRender wird gerendert");
  // (3) eine "eindeutige" ID im Render vergeben
  const instanceId = nextInstanceId++;
  // (4) in den localStorage SCHREIBEN
  localStorage.setItem("demo-last-render", String(badRenderCalls));
  // (5) aus dem localStorage LESEN (hier: ein Wert, den etwas anderes veraendern kann)
  const outside = localStorage.getItem("demo-outside") ?? "(noch nichts gespeichert)";

  return (
    <div id="bad">
      <h3>Falsch: Seiteneffekte im Render</h3>
      <p>
        Render-Aufrufe (Modulvariable): <strong id="bad-calls">{badRenderCalls}</strong>
      </p>
      <p>
        ID dieser Instanz (nextInstanceId++): <strong id="bad-id">{instanceId}</strong>
      </p>
      <p>
        Aus localStorage gelesen: <strong id="bad-outside">{outside}</strong>
      </p>
    </div>
  );
}

// ---- mitte: RICHTIG - jeder Seiteneffekt an seinem Platz ---------------------
function GoodRender() {
  // (3) die stabile ID bekommt man von React: bei jedem Render dieselbe, ohne
  // dass man etwas ausserhalb veraendert
  const id = useId();
  // (5) EINMAL beim ersten Rendern gelesen (lazy initial state). eine reine
  // LESE-Operation, die nichts veraendert; danach gehoert der Wert dem State.
  const [note, setNote] = useState(() => localStorage.getItem("demo-note") ?? "");

  // (4) SCHREIBEN gehoert in einen EFFEKT: er laeuft NACH dem Zeichnen und nur,
  // wenn sich `note` geaendert hat (nicht bei jedem Render).
  useEffect(() => {
    localStorage.setItem("demo-note", note);
  }, [note]);

  // (2) in die Konsole schreiben, WEIL der Nutzer geklickt hat: ein EVENT-HANDLER
  function handleLogClick() {
    console.log("[demo] Knopf geklickt");
  }

  return (
    <div id="good">
      <h3>Richtig: jeder Seiteneffekt an seinem Platz</h3>
      <p>
        ID dieser Instanz (useId): <strong id="good-id">{id}</strong>
      </p>
      <textarea
        id="good-note"
        className="note-textarea"
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p>
        <button type="button" className="btn btn-secondary" onClick={handleLogClick}>
          In die Konsole schreiben (Klick)
        </button>
      </p>
    </div>
  );
}

// ---- rechts: ein ABGELEITETER Wert - rechnen ist kein Seiteneffekt -----------
function squareSum(numbers: readonly number[]): number {
  counters.pureCalls += 1; // Messgeraet: zaehlt, wie oft die Funktion aufgerufen wird
  return numbers.reduce((sum, n) => sum + n * n, 0);
}

function PureDerived() {
  const numbers = [1, 2, 3, 4];
  // abgeleitet: gleiche Eingaben -> gleiches Ergebnis, nichts ausserhalb veraendert
  const total = squareSum(numbers);

  return (
    <div id="pure">
      <h3>Richtig: abgeleiteter Wert</h3>
      <p>
        Quadratsumme von 1, 2, 3, 4: <strong id="pure-total">{total}</strong>
      </p>
    </div>
  );
}

// ---- das Messgeraet als Komponente --------------------------------------------
// eigener State: ein Klick auf "Messen" rendert NUR diese Komponente neu, nicht
// die Geschwister (sonst wuerde das Messen die Zaehler selbst veraendern).
interface Snapshot extends Counters {
  badRenderCalls: number;
  nextInstanceId: number;
}

function Measurement() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  function handleMeasure() {
    setSnapshot({ ...counters, badRenderCalls, nextInstanceId });
  }

  function handleReset() {
    badRenderCalls = 0;
    nextInstanceId = 1;
    counters.consoleLogs = 0;
    counters.lastRenderWrites = 0;
    counters.noteWrites = 0;
    counters.pureCalls = 0;
    setSnapshot(null);
  }

  const text =
    snapshot === null
      ? "(noch nicht gemessen)"
      : [
          `BadRender: Render-Aufrufe (Modulvariable)  = ${snapshot.badRenderCalls}`,
          `BadRender: naechste freie ID               = ${snapshot.nextInstanceId}`,
          `BadRender: localStorage-Schreibzugriffe    = ${snapshot.lastRenderWrites}`,
          `console.log("[demo] ...") insgesamt        = ${snapshot.consoleLogs}`,
          `GoodRender: Schreibzugriffe (Effekt)       = ${snapshot.noteWrites}`,
          `squareSum(): Aufrufe                       = ${snapshot.pureCalls}`,
        ].join("\n");

  return (
    <div>
      <h3>Messung</h3>
      <p>
        <button type="button" className="btn btn-primary" onClick={handleMeasure}>
          Messen
        </button>{" "}
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
          Zähler zurücksetzen
        </button>
      </p>
      <pre id="measurement" style={{ background: "#f7f9fc", padding: 12 }}>
        {text}
      </pre>
    </div>
  );
}

interface RenderEffectDemoProps {
  strict: boolean;
}

export function RenderEffectDemo({ strict }: RenderEffectDemoProps) {
  // ein State, der mit den drei Komponenten nichts zu tun hat - er loest nur ein
  // neues Rendern der Eltern-Komponente und damit aller Kinder aus.
  const [clicks, setClicks] = useState(0);
  const modeText = strict ? "an (Entwicklung)" : "aus (wie Produktion)";

  return (
    <div className="stub-page" style={{ maxWidth: 1000 }}>
      <h2>Render-vs-Effekt-Demo (Wegwerf-Beispiel)</h2>
      <p>
        StrictMode: <strong id="strict-mode">{modeText}</strong>
      </p>
      <ol>
        <li>Seite laden, "Messen" klicken: links zählt alles doppelt (StrictMode).</li>
        <li>"Neurendern" klicken: links ändern sich Zähler und ID, ohne dass etwas geschah.</li>
        <li>"localStorage von außen ändern" klicken: links bleibt der Wert alt (stale).</li>
      </ol>
      <p>
        <button type="button" className="btn btn-secondary" onClick={() => setClicks(clicks + 1)}>
          Unabhängiges Neurendern ({clicks})
        </button>{" "}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => localStorage.setItem("demo-outside", `von außen (${Date.now()})`)}
        >
          localStorage von außen ändern
        </button>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <BadRender />
        <GoodRender />
        <PureDerived />
      </div>
      <Measurement />
    </div>
  );
}
