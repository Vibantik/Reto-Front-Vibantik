// Vista de detalle de categoria con transacciones expandibles.

import { useState, useMemo } from "react";
import { ChevronLeft, Edit2, Search, Settings } from "lucide-react";

import { ICON_MAP } from "../presupuestos.data.js";
import { normalizeText, sumForCategory, getProgress, dateKey } from "../utils/presupuestos.utils.js";

import CategoryStatusCard from "./CategoryStatusCard.jsx";
import TransactionSearch  from "./TransactionSearch.jsx";
import TransactionGroup   from "./TransactionGroup.jsx";

export default function CategoryDetailView({
  categoryName,
  categoriasConMonto,
  allCategorias,
  transactions,
  onBack,
  onEdit,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Encontrar la categoría por nombre normalizado
  const normName = normalizeText(categoryName);
  const catMonto = categoriasConMonto.find(
    (c) => normalizeText(c.nombre_categ) === normName
  );
  const catInfo = allCategorias.find(
    (c) => normalizeText(c.nombre_categ) === normName
  );

  const displayName = catMonto?.nombre_categ || catInfo?.nombre_categ || categoryName;
  const icon = catMonto?.icon || catInfo?.icon || "zap";
  const color = catMonto?.color || catInfo?.color || "#7B868C";
  const montoLimite = catMonto?.monto_asignado || 0;
  const Icon = ICON_MAP[icon] || Settings;

  const isIncome = normName === "ingresos";

  // filtrar transacciones de categoria escogida
  const catTxns = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            normalizeText(t.category) === normName &&
            t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, normName, searchTerm]
  );

  // totales
  const executed = useMemo(
    () => sumForCategory(transactions, categoryName, isIncome),
    [transactions, categoryName, isIncome]
  );
  const balance  = montoLimite - executed;
  const progress = getProgress(executed, montoLimite);

  // agrupar por fecha (YYYY-MM-DD) 
  const grouped = useMemo(
    () =>
      catTxns.reduce((acc, t) => {
        const key = dateKey(t.date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {}),
    [catTxns]
  );

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const toggleExpanded = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="pres-detail-panel">
      <div className="pres-detail-header">
        <button
          className="pres-detail-header__back"
          id="pres-detail-back-btn"
          onClick={onBack}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="pres-detail-header__icon" style={{ background: color }}>
          <Icon size={18} />
        </div>

        <h2 className="pres-detail-header__title">{displayName}</h2>

        <button
          className="pres-detail-header__edit-btn"
          id="pres-detail-edit-cat-btn"
          onClick={() => onEdit(categoryName)}
        >
          <Edit2 size={14} /> Editar
        </button>
      </div>

      {/* Tarjeta de status */}
      <CategoryStatusCard
        budget={montoLimite}
        executed={executed}
        balance={balance}
        progress={progress}
        isIncome={isIncome}
      />

      {/* Search bar */}
      <TransactionSearch value={searchTerm} onChange={setSearchTerm} />

      {/* lista de transacciones agrupadas por fecha */}
      {sortedDates.length === 0 ? (
        <div className="pres-empty">
          <Search size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
          <p>No hay transacciones que coincidan con la búsqueda.</p>
        </div>
      ) : (
        sortedDates.map((date) => (
          <TransactionGroup
            key={date}
            date={date}
            transactions={grouped[date]}
            categoryIcon={icon}
            expandedId={expandedId}
            onToggle={toggleExpanded}
          />
        ))
      )}
    </div>
  );
}
