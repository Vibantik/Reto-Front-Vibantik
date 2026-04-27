import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Flag, Target } from "lucide-react";
import { createMeta, fetchMetas } from "../services/metasService";
import "./css/metas.css";

const USER_UUID = "dbf9f839-b57e-415f-8b5b-9213524ed827";

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
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombreMeta: "",
    monto: "",
    fechaInicio: "",
    fechaFin: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMetas(USER_UUID);
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      nombreMeta: "",
      monto: "",
      fechaInicio: "",
      fechaFin: "",
    });
  };

  const handleCreateMeta = (event) => {
    const create = async () => {
      setIsSubmitting(true);
      setSubmitError(null);

      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);
      const diffMs = fin.getTime() - inicio.getTime();
      const plazoDias = Number.isFinite(diffMs)
        ? Math.max(Math.ceil(diffMs / 86400000), 0)
        : 0;

      try {
        const createdMeta = await createMeta({
          uuid: USER_UUID,
          nombreMeta: formData.nombreMeta.trim(),
          monto: Number(formData.monto),
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          plazoDias,
        });

        setMetas((prev) => [createdMeta, ...prev]);
        setError(null);
        setFormOpen(false);
        resetForm();
      } catch (err) {
        setSubmitError(err.message || "No se pudo crear la meta.");
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    };

    event.preventDefault();
    create();
  };

  return (
    <section className="metas-screen">
      <div className="metas-header">
        <div>
          <p className="metas-kicker">Banorte</p>
          <h2>Metas</h2>
          <p className="metas-subtitle">Listado de tus metas de ahorro</p>
        </div>
        <div className="metas-header-actions">
          {!loading && !error && (
            <div className="metas-summary">
              <p>{metas.length} metas</p>
              <strong>{fmtCurrency(totalObjetivo)}</strong>
            </div>
          )}
          <button
            type="button"
            className="metas-create-btn"
            onClick={() => setFormOpen(true)}
          >
            Anadir meta
          </button>
        </div>
      </div>

      {formOpen && (
        <div
          className="metas-modal-overlay"
          onClick={() => {
            setFormOpen(false);
            resetForm();
          }}
        >
          <div
            className="metas-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Formulario para crear meta"
          >
            <div className="metas-modal-head">
              <h3>Crear meta</h3>
              <button
                type="button"
                className="metas-close-btn"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
              >
                Cerrar
              </button>
            </div>

            <form className="metas-form" onSubmit={handleCreateMeta}>
              <label>
                Titulo de la meta
                <input
                  type="text"
                  name="nombreMeta"
                  value={formData.nombreMeta}
                  onChange={handleInputChange}
                  placeholder="Ej. Viaje familiar"
                  required
                />
              </label>

              <label>
                Monto objetivo (MXN)
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  required
                />
              </label>

              <div className="metas-form-dates">
                <label>
                  Fecha de inicio
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Fecha limite
                  <input
                    type="date"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              <div className="metas-form-actions">
                <button
                  type="submit"
                  className="metas-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar meta"}
                </button>
              </div>
              {submitError && (
                <p className="metas-state metas-state-error">{submitError}</p>
              )}
            </form>
          </div>
        </div>
      )}

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
                  <h3>{meta.nombreMeta}</h3>
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