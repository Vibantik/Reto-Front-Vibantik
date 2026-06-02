const MODULE_LABELS = {
  metas: "Metas",
  presupuestos: "Presupuestos",
  inversiones: "Inversiones",
  movimientos: "Movimientos",
};

function renderResultPreview(result) {
  if (!result) return null;

  if (Array.isArray(result)) {
    return (
      <ul className="agent-result-list">
        {result.slice(0, 4).map((item, i) => (
          <li key={i} className="agent-result-list-item">
            {item.nombreMeta && (
              <span>
                <strong>{item.nombreMeta}</strong>
                {item.monto_meta != null && (
                  <> — {Number(item.monto_meta).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</>
                )}
              </span>
            )}
            {item.nombre && <span><strong>{item.nombre}</strong></span>}
            {!item.nombreMeta && !item.nombre && (
              <span className="agent-result-raw">{JSON.stringify(item)}</span>
            )}
          </li>
        ))}
        {result.length > 4 && (
          <li className="agent-result-more">…y {result.length - 4} más</li>
        )}
      </ul>
    );
  }

  if (typeof result === "object") {
    const interesting = ["nombreMeta", "nombre", "monto_meta", "monto", "fecha_fin", "descripcion", "tipo"];
    const entries = interesting
      .filter((k) => result[k] !== undefined && result[k] !== null)
      .map((k) => [k, result[k]]);

    if (entries.length === 0) return null;

    return (
      <dl className="agent-result-dl">
        {entries.map(([k, v]) => {
          let displayValue = String(v);
          if ((k.toLowerCase().includes("fecha") || k.toLowerCase().includes("date")) && typeof v === "string") {
            const d = new Date(v.includes("T") ? v : v + "T00:00:00");
            if (!isNaN(d)) {
              displayValue = d.toLocaleDateString("es-MX", { dateStyle: "medium" });
            }
          }
          if (k.toLowerCase().includes("monto") && !isNaN(v)) {
            displayValue = Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
          }

          return (
            <div key={k} className="agent-result-dl-row">
              <dt>{k}</dt>
              <dd>{displayValue}</dd>
            </div>
          );
        })}
      </dl>
    );
  }

}

export default function ActionResultCard({ result, onNavigate }) {
  const success = result.success !== false;
  const module = result.module;
  const isArray = Array.isArray(result.result);
  const moduleLabel = MODULE_LABELS[module];

  return (
    <div className={`agent-result-card bubble-enter ${success ? "success" : "error"}`}>
      <div className="agent-result-header">
        <span className="agent-result-message">{result.message}</span>
      </div>

      {success && result.result && (
        <div className="agent-result-preview">
          {renderResultPreview(result.result)}
        </div>
      )}

      {isArray && moduleLabel && onNavigate && (
        <button
          className="agent-result-nav-btn"
          onClick={() => onNavigate(moduleLabel)}
        >
          Ver todos en {moduleLabel} →
        </button>
      )}
    </div>
  );
}
