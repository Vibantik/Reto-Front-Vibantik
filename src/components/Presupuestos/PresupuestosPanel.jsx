import { useState, useCallback, useEffect } from "react";
import {
  fetchCategorias,
  fetchPresupuestos,
  fetchPresupuesto,
  createPresupuesto,
} from "../../services/presupuestosService";

import "./presupuestos.css";

import HubView            from "./VistaPrincipal/HubView.jsx";
import CategoryDetailView from "./DetalleCat/CategoryDetailView.jsx";
import CategoryConfigView from "./config/CategoryConfigView.jsx";


function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}


export default function PresupuestosPanel({ uuid }) {
  const [categorias, setCategorias]         = useState([]);
  const [presupuestos, setPresupuestos]     = useState([]);
  const [selectedPresId, setSelectedPresId] = useState(null);
  const [presupuestoDetalle, setPresupuestoDetalle] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [creatingPresupuesto, setCreatingPresupuesto] = useState(false);
  const [createError, setCreateError]       = useState(null);
  
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [formData, setFormData]             = useState({
    nombre: "",
    monto_limite: "",
    inicio: "",
    fin: "",
  });



  //datos iniciales
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [cats, presList] = await Promise.all([
        fetchCategorias(),
        fetchPresupuestos(uuid),
      ]);

      setCategorias(cats);
      setPresupuestos(presList);

      // Seleccionar presupuesto activo más reciente si hay
      if (presList.length > 0 && !selectedPresId) {
        const activo = presList.find((p) => {
          const now = new Date();
          const ini = new Date(p.inicio);
          const fin = p.fin ? new Date(p.fin) : null;
          return ini <= now && (!fin || fin >= now);
        });
        const target = activo || presList[0];
        setSelectedPresId(target.id_presupuesto);
      }
    } catch (err) {
      console.error("Error loading presupuestos data:", err);
      setError("No se pudieron cargar los datos del presupuesto.");
    } finally {
      setLoading(false);
    }
  }, [uuid, selectedPresId]);

  useEffect(() => { loadData(); }, [loadData]);

  // detalle presupuesto 
  useEffect(() => {
    if (!selectedPresId) {
      setPresupuestoDetalle(null);
      return;
    }

    let cancelled = false;
    const loadDetalle = async () => {
      try {
        const detalle = await fetchPresupuesto(selectedPresId);
        if (!cancelled) setPresupuestoDetalle(detalle);
      } catch (err) {
        console.error("Error loading presupuesto detalle:", err);
        if (!cancelled) setPresupuestoDetalle(null);
      }
    };
    loadDetalle();

    return () => { cancelled = true; };
  }, [selectedPresId]);

  //montos de presupuesto
  const categoriasConMonto = (presupuestoDetalle?.categorias || []).map((rpc) => ({
    id_categ: rpc.id_categ,
    nombre_categ: rpc.nombre_categ,
    icon: rpc.icon || "zap",
    color: rpc.color || "#7B868C",
    monto_asignado: Number(rpc.monto_asignado || 0),
  }));

  // transacciones del presupuesto, normalizadas
  const transacciones = (presupuestoDetalle?.transacciones || []).map((t) => ({
    ...t,
    amount: Number(t.amount || 0),
    type: t.type === "ingreso" ? "ingreso" : "egreso",
    description: t.description || "Sin descripción",
    category: t.category || "",
  }));

  // ! NAV
  const [view,              setView]              = useState("hub");
  const [selectedCatName,   setSelectedCatName]   = useState(null);
  const [configHighlightId, setConfigHighlightId] = useState(null);
  const [configOrigin,      setConfigOrigin]      = useState("hub");

  const goToDetail = useCallback((catName) => {
    setSelectedCatName(catName);
    setView("detail");
  }, []);

  const goToConfig = useCallback((highlightId = null, origin = "hub") => {
    setConfigHighlightId(highlightId);
    setConfigOrigin(origin);
    setView("config");
  }, []);

  const goBack = useCallback(() => {
    if (view === "detail") {
      setView("hub");
      setSelectedCatName(null);
    } else if (view === "config") {
      if (configOrigin === "detail" && selectedCatName) {
        setView("detail");
      } else {
        setView("hub");
      }
    }
  }, [view, configOrigin, selectedCatName]);

  const handleSaveCategories = useCallback(async () => {
    // Recargar datos después de guardar categorías
    await loadData();
    if (selectedPresId) {
      try {
        const detalle = await fetchPresupuesto(selectedPresId);
        setPresupuestoDetalle(detalle);
      } catch (err) {
        console.error("Error reloading presupuesto detalle:", err);
      }
    }
  }, [loadData, selectedPresId]);

  const handlePresupuestoChange = useCallback((id) => {
    setSelectedPresId(id);
  }, []);

  const openCreateModal = useCallback(() => {
    const defaultName = `Presupuesto ${new Date().toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    })}`;
    const todayIso = new Date().toISOString().slice(0, 10);
    
    // Recomendación basada en el ingreso del presupuesto anterior (el actualmente seleccionado)
    const ingresoRecomendado = transacciones
      .filter((t) => t.type === "ingreso")
      .reduce((a, t) => a + t.amount, 0);
    
    setFormData({
      nombre: defaultName,
      monto_limite: String(ingresoRecomendado || 0),
      inicio: todayIso,
      fin: "",
    });
    setCreateError(null);
    setIsModalOpen(true);
  }, [transacciones]);

  const closeCreateModal = useCallback(() => {
    setIsModalOpen(false);
    setCreateError(null);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreatePresupuestoSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (creatingPresupuesto) return;
    setCreateError(null);

    const { nombre, monto_limite, inicio, fin } = formData;
    
    const nombreStr = nombre.trim();
    if (!nombreStr) {
      setCreateError("El nombre del presupuesto es obligatorio.");
      return;
    }

    const montoNum = Number(String(monto_limite).replace(",", "."));
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      setCreateError("El monto limite debe ser un numero mayor o igual a 0.");
      return;
    }

    const inicioStr = inicio.trim();
    if (!isValidIsoDate(inicioStr)) {
      setCreateError("La fecha de inicio debe tener el formato YYYY-MM-DD.");
      return;
    }

    const finStr = fin.trim();
    if (finStr && !isValidIsoDate(finStr)) {
      setCreateError("La fecha de fin debe tener el formato YYYY-MM-DD.");
      return;
    }

    if (finStr && finStr < inicioStr) {
      setCreateError("La fecha de fin no puede ser menor a la fecha de inicio.");
      return;
    }

    try {
      setCreatingPresupuesto(true);

      const payload = {
        uuid_de_usuario: uuid,
        nombre: nombreStr,
        monto_limite: montoNum,
        inicio: inicioStr,
        categorias: [],
      };
      if (finStr) payload.fin = finStr;

      const created = await createPresupuesto(payload);
      const createdId = Number(
        created?.id_presupuesto ??
        created?.id ??
        created?.data?.id_presupuesto ??
        created?.data?.id
      );

      if (Number.isFinite(createdId)) {
        setSelectedPresId(createdId);
      }

      await loadData();
      closeCreateModal();
    } catch (err) {
      console.error("Error creating presupuesto:", err);
      setCreateError(err?.message || "No se pudo crear el presupuesto.");
    } finally {
      setCreatingPresupuesto(false);
    }
  }, [creatingPresupuesto, uuid, loadData, formData, closeCreateModal]);

  // ! Render 
  return (
    <section aria-label="Panel de presupuestos" className="presupuestos-panel">
      {loading && <div className="pres-empty">Cargando datos del presupuesto...</div>}
      {error && <div className="pres-empty" style={{color: 'var(--banorte-red)'}}>{error}</div>}
      {createError && <div className="pres-empty" style={{color: 'var(--banorte-red)'}}>{createError}</div>}
      
      {!loading && !error && view === "hub" && (
        <HubView
          presupuestos={presupuestos}
          selectedPresId={selectedPresId}
          onPresupuestoChange={handlePresupuestoChange}
          onCreatePresupuesto={openCreateModal}
          creatingPresupuesto={creatingPresupuesto}
          presupuesto={presupuestoDetalle}
          categoriasConMonto={categoriasConMonto}
          transactions={transacciones}
          allCategorias={categorias}
          onCategoryClick={goToDetail}
          onManageClick={() => goToConfig(null, "hub")}
          onReload={loadData}
        />
      )}

      {!loading && !error && view === "detail" && selectedCatName && (
        <CategoryDetailView
          categoryName={selectedCatName}
          categoriasConMonto={categoriasConMonto}
          allCategorias={categorias}
          transactions={transacciones}
          onBack={goBack}
          onEdit={(catName) => goToConfig(catName, "detail")}
        />
      )}

      {!loading && !error && view === "config" && (
        <CategoryConfigView
          categorias={categorias}
          presupuestoId={selectedPresId}
          categoriasConMonto={categoriasConMonto}
          highlightId={configHighlightId}
          onSave={handleSaveCategories}
          onBack={goBack}
        />
      )}

      {isModalOpen && (
        <div className="pres-modal-overlay" onClick={closeCreateModal}>
          <div className="pres-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="pres-modal-head">
              <h3>Crear presupuesto</h3>
              <button type="button" className="pres-close-btn" onClick={closeCreateModal}>
                Cerrar
              </button>
            </div>
            
            <form className="pres-form" onSubmit={handleCreatePresupuestoSubmit}>
              <label>
                Nombre del presupuesto
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej. Presupuesto Mensual"
                  required
                />
              </label>

              <label>
                Monto limite total
                <input
                  type="number"
                  name="monto_limite"
                  value={formData.monto_limite}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <div className="pres-form-dates">
                <label>
                  Fecha de inicio
                  <input
                    type="date"
                    name="inicio"
                    value={formData.inicio}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Fecha de fin (opcional)
                  <input
                    type="date"
                    name="fin"
                    value={formData.fin}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              {createError && (
                <div style={{ color: "var(--banorte-red)", fontSize: "13px", marginTop: "4px" }}>
                  {createError}
                </div>
              )}

              <div className="pres-form-actions">
                <button type="submit" className="pres-submit-btn" disabled={creatingPresupuesto}>
                  {creatingPresupuesto ? "Creando..." : "Crear presupuesto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
