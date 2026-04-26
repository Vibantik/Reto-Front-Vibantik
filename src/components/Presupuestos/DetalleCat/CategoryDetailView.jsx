// Vista de detalle de categoria con transacciones expandibles.

import { useState, useMemo } from "react";
import { ChevronLeft, Edit2, Search, Settings } from "lucide-react";

import { ICON_MAP } from "../presupuestos.data.js";
import { isIncomeCategory, sumForCategory, getProgress } from "../utils/presupuestos.utils.js";

import CategoryStatusCard from "./CategoryStatusCard.jsx";
import TransactionSearch  from "./TransactionSearch.jsx";
import TransactionGroup   from "./TransactionGroup.jsx";

export default function CategoryDetailView({
  categoryId,
  categories,
  transactions,
  onBack,
  onEdit,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return null;

  const isIncome = isIncomeCategory(cat);
  const Icon     = ICON_MAP[cat.icon] || Settings;

  /* filtrar y orden transacciones de esta categoria */
  const catTxns = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.categoryId === categoryId &&
            t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, categoryId, searchTerm]
  );

  /* totales */
  const executed = useMemo(
    () => sumForCategory(transactions, categoryId, isIncome),
    [transactions, categoryId, isIncome]
  );
  const balance  = cat.monto_limite - executed;
  const progress = getProgress(executed, cat.monto_limite);

  /* agrupar por fecha */
  const grouped = useMemo(
    () =>
      catTxns.reduce((acc, t) => {
        if (!acc[t.date]) acc[t.date] = [];
        acc[t.date].push(t);
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

        <div className="pres-detail-header__icon" style={{ background: cat.color }}>
          <Icon size={18} />
        </div>

        <h2 className="pres-detail-header__title">{cat.nombre}</h2>

        <button
          className="pres-detail-header__edit-btn"
          id="pres-detail-edit-cat-btn"
          onClick={() => onEdit(categoryId)}
        >
          <Edit2 size={14} /> Editar
        </button>
      </div>

      {/* Tarjeta de status */}
      <CategoryStatusCard
        budget={cat.monto_limite}
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
            categoryIcon={cat.icon}
            expandedId={expandedId}
            onToggle={toggleExpanded}
          />
        ))
      )}
    </div>
  );
}
