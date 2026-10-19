export interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  options: SelectOption[];
  defaultValue: string;
}

// ein dropdown samt (visuell versteckter) label. defaultValue statt value:
// das dropdown ist UNKONTROLLIERT - es startet mit dem uebergebenen wert, der
// browser verwaltet danach die auswahl selbst. genau das verlangte UE4 fuer die
// timeline-leiste ("visuell komplett, noch nicht gekoppelt"); mit "value" ohne
// onChange waere das dropdown dagegen schreibgeschuetzt.
// ue5 demo 1: lag bis dahin in features/timeline/TimelineToolbar.tsx. seit die
// evidence-leiste dasselbe dropdown braucht, hat die datei ZWEI nutzer in zwei
// features -> nach shared/ umgezogen (regel aus ue4 demo 6).
export function FilterSelect({ id, label, options, defaultValue }: FilterSelectProps) {
  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <select id={id} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
