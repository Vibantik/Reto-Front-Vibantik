import { useState, useCallback, useEffect } from "react";
import { fetchTransactions } from "../../services/transactionsService";
import { INITIAL_CATEGORIES } from "./presupuestos.data.js";
import "./presupuestos.css";

import HubView            from "./hub/HubView.jsx";
import CategoryDetailView from "./detail/CategoryDetailView.jsx";
import CategoryConfigView from "./config/CategoryConfigView.jsx";


export default function PresupuestosPanel() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // capeada a 1k
        const result = await fetchTransactions({ limit: 1000 });
        
        // normalizar para view
        const normalized = (result.data || []).map(t => ({
          ...t,
          id: t.id || t.id_transacción,
          categoryId: String(t.id_categ || t.categoryId || ""),
          description: t.description || t.nombre_negocio || "Sin descripción",
          amount: Number(t.amount || 0),
          type: t.type === "ingreso" ? "ingreso" : "egreso"
        }));
        
        setTransactions(normalized);
      } catch (err) {
        console.error("Error fetching budget transactions:", err);
        setError("No se pudieron cargar los movimientos del presupuesto.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // view: hub, detail o config
  const [view,              setView]              = useState("hub");
  const [selectedCatId,     setSelectedCatId]     = useState(null);
  const [configHighlightId, setConfigHighlightId] = useState(null);
  // cual view abierta
  const [configOrigin,      setConfigOrigin]      = useState("hub");

  /* ── Navigation handlers ─────────────────────────────────────────────────── */
  const goToDetail = useCallback((catId) => {
    setSelectedCatId(catId);
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
      setSelectedCatId(null);
    } else if (view === "config") {
      // Return to detail (with the previously selected category) if that's where we came from.
      if (configOrigin === "detail" && selectedCatId) {
        setView("detail");
      } else {
        setView("hub");
      }
    }
  }, [view, configOrigin, selectedCatId]);

  const handleSaveCategories = useCallback((updated) => {
    setCategories(updated);
  }, []);

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <section aria-label="Panel de presupuestos" className="presupuestos-panel">
      {loading && <div className="pres-empty">Cargando movimientos...</div>}
      {error && <div className="pres-empty" style={{color: 'var(--banorte-red)'}}>{error}</div>}
      
      {!loading && !error && view === "hub" && (
        <HubView
          categories={categories}
          transactions={transactions}
          onCategoryClick={goToDetail}
          onManageClick={() => goToConfig(null, "hub")}
        />
      )}

      {!loading && !error && view === "detail" && selectedCatId && (
        <CategoryDetailView
          categoryId={selectedCatId}
          categories={categories}
          transactions={transactions}
          onBack={goBack}
          onEdit={(catId) => goToConfig(catId, "detail")}
        />
      )}

      {!loading && !error && view === "config" && (
        <CategoryConfigView
          categories={categories}
          highlightId={configHighlightId}
          onSave={handleSaveCategories}
          onBack={goBack}
        />
      )}

    </section>
  );
}
