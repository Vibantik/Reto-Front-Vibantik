import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Flag, Target } from "lucide-react";
import { createMeta, deleteMeta, fetchMetas, updateMeta } from "../services/metasService";
import { getUserUuid } from "../utils/userUuid";
import "./css/metas.css";

const ITEMS_PER_PAGE = 10;
const SECTION_DEFINITIONS = [
  { key: "enCurso", title: "Objetivos activos" },
  { key: "completadas", title: "Objetivos logrados" },
  { key: "finalizadasCompletadas", title: "Objetivos vencidos logrados" },
  { key: "finalizadasNoCompletadas", title: "Objetivos vencidos pendientes" },
];

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

const categorizeMetas = (metas, todayInput) => {
  const today = new Date(`${todayInput}T00:00:00`);

  const buckets = {
    enCurso: [],
    completadas: [],
    finalizadasCompletadas: [],
    finalizadasNoCompletadas: [],
  };

  metas.forEach((meta) => {
    const progreso = Number(meta.progreso ?? 0);
    const isCompleted = progreso >= 1;
    const fechaFinDate = meta.fechaFin ? new Date(`${String(meta.fechaFin).slice(0, 10)}T00:00:00`) : null;
    const isFinalizada = Boolean(fechaFinDate && fechaFinDate < today);

    if (!isFinalizada && !isCompleted) {
      buckets.enCurso.push(meta);
    } else if (!isFinalizada && isCompleted) {
      buckets.completadas.push(meta);
    } else if (isFinalizada && isCompleted) {
      buckets.finalizadasCompletadas.push(meta);
    } else {
      buckets.finalizadasNoCompletadas.push(meta);
    }
  });

  return buckets;
};

function MetasPanel({ uuid }) {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMetaId, setEditingMetaId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    nombreMeta: "",
    monto: "",
    fechaInicio: "",
    fechaFin: "",
  });

  const todayInput = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yyyy = local.getFullYear();
    const mm = String(local.getMonth() + 1).padStart(2, "0");
    const dd = String(local.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setActionError(null);
      try {
        const data = await fetchMetas(uuid);
        setMetas(data);
      } catch (err) {
        setError("No se pudieron cargar las metas.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [uuid]);

  const totalObjetivo = useMemo(
    () => metas.reduce((sum, meta) => sum + Number(meta.monto || 0), 0),
    [metas]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(metas.length / ITEMS_PER_PAGE)),
    [metas.length]
  );

  const firstItemIndex = metas.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const lastItemIndex = Math.min(currentPage * ITEMS_PER_PAGE, metas.length);

  const paginatedMetas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return metas.slice(start, start + ITEMS_PER_PAGE);
  }, [metas, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const sectionedMetas = useMemo(() => {
    return categorizeMetas(metas, todayInput);
  }, [metas, todayInput]);

  const paginatedSectionedMetas = useMemo(
    () => categorizeMetas(paginatedMetas, todayInput),
    [paginatedMetas, todayInput]
  );

  const isPastDate = (dateValue) => {
    if (!dateValue) return false;
    return dateValue < todayInput;
  };

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

  const closeModal = () => {
    setFormOpen(false);
    setEditingMetaId(null);
    setSubmitError(null);
    resetForm();
  };

  const openCreateModal = () => {
    setEditingMetaId(null);
    setSubmitError(null);
    setActionError(null);
    resetForm();
    setFormOpen(true);
  };

  const openEditModal = (meta) => {
    setEditingMetaId(meta.id);
    setSubmitError(null);
    setFormData({
      nombreMeta: meta.nombreMeta ?? "",
      monto: String(meta.monto ?? ""),
      fechaInicio: (meta.fechaInicio ?? "").slice(0, 10),
      fechaFin: (meta.fechaFin ?? "").slice(0, 10),
    });
    setActionError(null);
    setFormOpen(true);
  };

  const handleDeleteMeta = async (metaId) => {
    const shouldDelete = window.confirm("Quieres eliminar esta meta?");
    if (!shouldDelete) return;

    setDeletingId(metaId);
    setActionError(null);
    try {
      await deleteMeta({ idMeta: metaId, uuid: uuid });
      setMetas((prev) => prev.filter((meta) => meta.id !== metaId));
      if (editingMetaId === metaId) closeModal();
    } catch (err) {
      setActionError(err.message || "No se pudo eliminar la meta.");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const isEditMode = editingMetaId !== null;

  const handleCreateMeta = (event) => {
    event.preventDefault();

    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);
    const diffMs = fin.getTime() - inicio.getTime();
    const plazoDias = Number.isFinite(diffMs)
      ? Math.max(Math.ceil(diffMs / 86400000), 0)
      : 0;

    if (isPastDate(formData.fechaInicio) || isPastDate(formData.fechaFin)) {
      setSubmitError("No puedes seleccionar fechas anteriores a la fecha actual.");
      return;
    }

    if (formData.fechaFin < formData.fechaInicio) {
      setSubmitError("La fecha limite no puede ser menor a la fecha de inicio.");
      return;
    }

    if (isEditMode) {
      const update = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        setActionError(null);
        try {
          const updatedMeta = await updateMeta({
            idMeta: editingMetaId,
            uuid: uuid,
            nombreMeta: formData.nombreMeta.trim(),
            monto: Number(formData.monto),
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin,
            plazoDias,
          });

          setMetas((prev) =>
            prev.map((meta) => (meta.id === editingMetaId ? updatedMeta : meta))
          );
          closeModal();
        } catch (err) {
          setSubmitError(err.message || "No se pudo actualizar la meta.");
          console.error(err);
        } finally {
          setIsSubmitting(false);
        }
      };

      update();
      return;
    }

    const create = async () => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const createdMeta = await createMeta({
          uuid: uuid,
          nombreMeta: formData.nombreMeta.trim(),
          monto: Number(formData.monto),
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          plazoDias,
        });

        setMetas((prev) => [createdMeta, ...prev]);
        setCurrentPage(1);
        setError(null);
        closeModal();
      } catch (err) {
        setSubmitError(err.message || "No se pudo crear la meta.");
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    };

    create();
  };

  const renderMetaCard = (meta) => (
    <article key={meta.id} className="meta-item" data-cy="meta-card">
      <div className="meta-item-top">
        <h3 data-cy="meta-title">{meta.nombreMeta}</h3>
      </div>

      <p className="meta-amount" data-cy="meta-amount">{fmtCurrency(meta.monto)}</p>

      <div className="meta-detail-grid">
        <p>
          <Target size={15} />
          Plazo: <strong data-cy="meta-plazo">{meta.plazoDias || "-"} dias</strong>
        </p>
        <p>
          <CalendarDays size={15} />
          Inicio: <strong data-cy="meta-fecha-inicio">{fmtDate(meta.fechaInicio)}</strong>
        </p>
        <p>
          <Flag size={15} />
          Fin: <strong data-cy="meta-fecha-fin">{fmtDate(meta.fechaFin)}</strong>
        </p>
      </div>

      <div className="meta-progress-track" aria-hidden="true">
        <div
          className="meta-progress-fill"
          data-cy="meta-progress-bar"
          style={{ width: `${Math.round(meta.progreso * 100)}%` }}
        ></div>
      </div>

      <div className="meta-item-actions">
        <button
          type="button"
          className="meta-edit-btn"
          data-cy="meta-edit-btn"
          onClick={() => openEditModal(meta)}
          disabled={deletingId === meta.id}
        >
          Actualizar meta
        </button>
        <button
          type="button"
          className="meta-delete-btn"
          data-cy="meta-delete-btn"
          onClick={() => handleDeleteMeta(meta.id)}
          disabled={deletingId === meta.id}
        >
          {deletingId === meta.id ? "Eliminando..." : "Eliminar meta"}
        </button>
      </div>
    </article>
  );

  const renderSection = (sectionKey, title) => {
    const sectionItems = paginatedSectionedMetas[sectionKey];
    if (sectionItems.length === 0) return null;
    const totalInCategory = sectionedMetas[sectionKey].length;

    return (
      <section key={sectionKey} className="metas-section" data-cy={`metas-section-${sectionKey}`}>
        <div className="metas-section-header">
          <h3>{title}</h3>
          <span className="metas-section-tag" data-cy={`metas-section-tag-${sectionKey}`}>
            {sectionItems.length} en esta pagina · {totalInCategory} total
          </span>
        </div>
        {sectionItems.map((meta) => renderMetaCard(meta))}
      </section>
    );
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
            data-cy="metas-create-btn"
            onClick={openCreateModal}
          >
            Anadir meta
          </button>
        </div>
      </div>

      {formOpen && (
        <div
          className="metas-modal-overlay"
          data-cy="metas-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="metas-modal"
            data-cy="metas-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Formulario para crear meta"
          >
            <div className="metas-modal-head">
              <h3>{isEditMode ? "Actualizar meta" : "Crear meta"}</h3>
              <button
                type="button"
                className="metas-close-btn"
                data-cy="metas-modal-close-btn"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </div>

            <form className="metas-form" data-cy="metas-form" onSubmit={handleCreateMeta}>
              <label>
                Titulo de la meta
                <input
                  type="text"
                  name="nombreMeta"
                  data-cy="metas-form-nombre"
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
                  data-cy="metas-form-monto"
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
                    data-cy="metas-form-fecha-inicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    min={todayInput}
                    required
                  />
                </label>

                <label>
                  Fecha limite
                  <input
                    type="date"
                    name="fechaFin"
                    data-cy="metas-form-fecha-fin"
                    value={formData.fechaFin}
                    onChange={handleInputChange}
                    min={formData.fechaInicio || todayInput}
                    required
                  />
                </label>
              </div>

              <div className="metas-form-actions">
                <button
                  type="submit"
                  className="metas-submit-btn"
                  data-cy="metas-form-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Guardando..."
                    : isEditMode
                      ? "Actualizar meta"
                      : "Guardar meta"}
                </button>
              </div>
              {submitError && (
                <p className="metas-state metas-state-error" data-cy="metas-form-error">{submitError}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {loading && <p className="metas-state">Cargando metas...</p>}
      {error && <p className="metas-state metas-state-error">{error}</p>}
      {!error && actionError && <p className="metas-state metas-state-error">{actionError}</p>}

      {!loading && !error && (
        <div className="metas-list">
          {metas.length === 0 ? (
            <p className="metas-empty">Aun no tienes metas registradas.</p>
          ) : (
            <>
              {SECTION_DEFINITIONS.map(({ key, title }) => renderSection(key, title))}

              <div className="metas-pagination">
                <p className="metas-pagination-summary" data-cy="metas-pagination-summary">
                  Mostrando {firstItemIndex}-{lastItemIndex} de {metas.length}
                </p>
                <div className="metas-pagination-controls">
                  <button
                    type="button"
                    className="metas-page-btn"
                    data-cy="metas-page-prev"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <span className="metas-page-indicator" data-cy="metas-page-indicator">
                    Pagina {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="metas-page-btn"
                    data-cy="metas-page-next"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default MetasPanel;
