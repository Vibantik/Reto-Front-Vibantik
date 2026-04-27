import { useState, useCallback, useEffect } from "react";
import {
  fetchCategorias,
  fetchPresupuestos,
  fetchPresupuesto,
  createPresupuesto,
} from "../../services/presupuestosService";
import { getUserUuid } from "../../utils/userUuid";
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


export default function PresupuestosPanel() {
  const [categorias, setCategorias]         = useState([]);
  const [presupuestos, setPresupuestos]     = useState([]);
  const [selectedPresId, setSelectedPresId] = useState(null);
  const [presupuestoDetalle, setPresupuestoDetalle] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [creatingPresupuesto, setCreatingPresupuesto] = useState(false);
  const [createError, setCreateError]       = useState(null);

  const uuid = getUserUuid();

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

  useEffect(() => { loadData(); }, []);

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

  const handleCreatePresupuesto = useCallback(async () => {
    if (creatingPresupuesto) return;
    setCreateError(null);

    const defaultName = `Presupuesto ${new Date().toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    })}`;
    const nombreInput = window.prompt("Nombre del nuevo presupuesto:", defaultName);
    if (nombreInput === null) return;

    const nombre = nombreInput.trim();
    if (!nombre) {
      setCreateError("El nombre del presupuesto es obligatorio.");
      return;
    }

    const montoInput = window.prompt("Monto limite total:", "0");
    if (montoInput === null) return;

    const montoLimite = Number(String(montoInput).replace(",", "."));
    if (!Number.isFinite(montoLimite) || montoLimite < 0) {
      setCreateError("El monto limite debe ser un numero mayor o igual a 0.");
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const inicioInput = window.prompt("Fecha de inicio (YYYY-MM-DD):", todayIso);
    if (inicioInput === null) return;

    const inicio = inicioInput.trim();
    if (!isValidIsoDate(inicio)) {
      setCreateError("La fecha de inicio debe tener el formato YYYY-MM-DD.");
      return;
    }

    const finInput = window.prompt(
      "Fecha de fin opcional (YYYY-MM-DD). Deja vacio para sin fin:",
      ""
    );
    if (finInput === null) return;

    const fin = finInput.trim();
    if (fin && !isValidIsoDate(fin)) {
      setCreateError("La fecha de fin debe tener el formato YYYY-MM-DD.");
      return;
    }

    if (fin && fin < inicio) {
      setCreateError("La fecha de fin no puede ser menor a la fecha de inicio.");
      return;
    }

    try {
      setCreatingPresupuesto(true);

      const payload = {
        uuid_de_usuario: uuid,
        nombre,
        monto_limite: montoLimite,
        inicio,
        categorias: [],
      };
      if (fin) payload.fin = fin;

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
    } catch (err) {
      console.error("Error creating presupuesto:", err);
      setCreateError(err?.message || "No se pudo crear el presupuesto.");
    } finally {
      setCreatingPresupuesto(false);
    }
  }, [creatingPresupuesto, uuid, loadData]);

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
          onCreatePresupuesto={handleCreatePresupuesto}
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

    </section>
  );
}
