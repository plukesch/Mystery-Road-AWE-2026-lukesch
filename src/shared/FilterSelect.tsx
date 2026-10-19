export interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectBaseProps {
  id: string;
  label: string;
  options: SelectOption[];
}

// ein dropdown ist ENTWEDER unkontrolliert (defaultValue) ODER kontrolliert
// (value + onChange) - nie gemischt. die zwei interfaces unten erzwingen das
// im typ: "value" ohne "onChange" ist ein COMPILER-fehler (in demo 2 war es eine
// laufzeit-warnung von react), und "defaultValue" zusammen mit "value" ebenfalls.
interface UncontrolledProps extends FilterSelectBaseProps {
  defaultValue: string;
  value?: undefined;
  onChange?: undefined;
}

interface ControlledProps extends FilterSelectBaseProps {
  value: string;
  onChange: (value: string) => void;
  defaultValue?: undefined;
}

type FilterSelectProps = UncontrolledProps | ControlledProps;

// ein dropdown samt (visuell versteckter) label.
// UNKONTROLLIERT (defaultValue): das dropdown startet mit dem uebergebenen wert,
// der browser verwaltet danach die auswahl selbst. so benutzt es die
// timeline-leiste (UE4: "visuell komplett, noch nicht gekoppelt").
// KONTROLLIERT (value + onChange, ue5 demo 4): der angezeigte wert kommt aus
// dem zustand der seite, jede auswahl meldet sich als STRING nach oben. so
// benutzt es die evidence-leiste.
// ue5 demo 1: lag bis dahin in features/timeline/TimelineToolbar.tsx; seit die
// evidence-leiste dasselbe dropdown braucht, hat die datei ZWEI nutzer in zwei
// features -> nach shared/ umgezogen (regel aus ue4 demo 6).
export function FilterSelect(props: FilterSelectProps) {
  const { id, label, options } = props;

  const optionElements = options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ));

  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      {props.value === undefined ? (
        <select id={id} defaultValue={props.defaultValue}>
          {optionElements}
        </select>
      ) : (
        <select
          id={id}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        >
          {optionElements}
        </select>
      )}
    </>
  );
}
