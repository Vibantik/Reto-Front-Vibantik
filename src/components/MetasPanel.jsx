import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Flag, Target } from "lucide-react";
import { fetchMetas } from "../services/metasService";
import "./css/metas.css";

const fmtCurrency = (value) =>
  Number(value).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function MetasPanel() {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMetas();
        setMetas(data);
      } catch (err) {
        setError("No se pudieron cargar las metas.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalObjetivo = useMemo(
    () => metas.reduce((sum, meta) => sum + Number(meta.monto || 0), 0),
    [metas]
  );

  return (
    <section className="metas-screen">
      <div className="metas-header">
        <div>
          <p className="metas-kicker">Banorte</p>
          <h2>Metas</h2>
          <p className="metas-subtitle">Listado de tus metas de ahorro</p>
        </div>
        {!loading && !error && (
          <div className="metas-summary">
            <p>{metas.length} metas</p>
            <strong>{fmtCurrency(totalObjetivo)}</strong>
          </div>
        )}
      </div>

      {loading && <p className="metas-state">Cargando metas...</p>}
      {error && <p className="metas-state metas-state-error">{error}</p>}

      {!loading && !error && (
        <div className="metas-list">
          {metas.length === 0 ? (
            <p className="metas-empty">Aun no tienes metas registradas.</p>
          ) : (
            metas.map((meta) => (
              <article key={meta.id} className="meta-item">
                <div className="meta-item-top">
                  <h3>{meta.titulo}</h3>
                  <span className="meta-id">Meta #{meta.id}</span>
                </div>

                <p className="meta-amount">{fmtCurrency(meta.monto)}</p>

                <div className="meta-detail-grid">
                  <p>
                    <Target size={15} />
                    Plazo: <strong>{meta.plazoDias || "-"} dias</strong>
                  </p>
                  <p>
                    <CalendarDays size={15} />
                    Inicio: <strong>{fmtDate(meta.fechaInicio)}</strong>
                  </p>
                  <p>
                    <Flag size={15} />
                    Fin: <strong>{fmtDate(meta.fechaFin)}</strong>
                  </p>
                </div>

                <div className="meta-progress-track" aria-hidden="true">
                  <div
                    className="meta-progress-fill"
                    style={{ width: `${Math.round(meta.progreso * 100)}%` }}
                  ></div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default MetasPanel;