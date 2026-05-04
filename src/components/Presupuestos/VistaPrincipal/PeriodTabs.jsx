//  Periodos de tiempo: Este Mes / Mes Pasado / Personalizado

const PERIODS = [
  { id: "current", label: "Este Mes" },
  { id: "past",    label: "Mes Pasado" },
  { id: "custom",  label: "Personalizado" },
];

export default function PeriodTabs({ period, onChange }) {
  return (
    <div className="pres-tabs">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          id={`pres-period-${p.id}`}
          className={`pres-tab${period === p.id ? " active" : ""}`}
          onClick={() => onChange(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
