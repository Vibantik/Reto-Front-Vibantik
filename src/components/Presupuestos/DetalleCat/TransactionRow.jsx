// Fila de transacción expandible dentro de un grupo de transacciones.

import { ChevronDown, Edit2, Landmark, FileText } from "lucide-react";
import { fmt } from "../utils/presupuestos.utils.js";
import { ICON_MAP } from "../presupuestos.data.js";

export default function TransactionRow({ transaction: t, categoryIcon, isExpanded, onToggle }) {
  const isIncomeT = t.type === "ingreso";
  const Icon      = ICON_MAP[categoryIcon] || Landmark;

  return (
    <div>
      {/* fila */}
      <div
        className="pres-txn-row"
        id={`pres-txn-row-${t.id}`}
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <div className="pres-txn-row__avatar">
          <Icon size={18} />
        </div>

        <div className="pres-txn-row__info">
          <p className="pres-txn-row__name">{t.description}</p>
          <p className="pres-txn-row__sub">
            {isIncomeT ? "Ingreso" : "Gasto"}{t.category ? ` · ${t.category}` : ""}
          </p>
        </div>

        <div className="pres-txn-row__right">
          <span className={`pres-txn-row__amount ${isIncomeT ? "income" : "expense"}`}>
            {isIncomeT ? "+" : "-"}{fmt(t.amount)}
          </span>
          <ChevronDown
            size={16}
            className={`pres-txn-row__chevron${isExpanded ? " open" : ""}`}
          />
        </div>
      </div>

      {/* detalle expandido */}
      {isExpanded && (
        <div className="pres-txn-expand">
          <div className="pres-txn-expand__grid">
            <div className="pres-txn-expand__field">
              <Landmark size={14} />
              <span>Categoría: {t.category || "Sin categoría"}</span>
            </div>
            <div className="pres-txn-expand__field">
              <FileText size={14} />
              <span>Tipo: {t.type}</span>
            </div>
          </div>

          <button
            className="pres-txn-expand__edit-btn"
            id={`pres-txn-edit-${t.id}`}
            onClick={(e) => {
              e.stopPropagation();
              alert(`Editar transacción: ${t.description}`);
            }}
          >
            <Edit2 size={12} /> Editar Transacción
          </button>
        </div>
      )}
    </div>
  );
}
