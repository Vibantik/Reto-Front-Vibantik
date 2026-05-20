// lista de categorias

import { ChevronRight, Settings } from "lucide-react";
import { ICON_MAP } from "../presupuestos.data.js";
import { fmt } from "../utils/presupuestos.utils.js";

export default function CategoryList({ catStats, onCategoryClick, onManageClick }) {
  return (
    <div className="pres-cat-list-card">
      <div className="pres-cat-list__header">
        <span className="pres-cat-list__title">Desglose por Categoría</span>
        <button
          className="pres-cat-list__manage-btn"
          id="pres-manage-categories-btn"
          onClick={onManageClick}
        >
          <Settings size={14} /> Gestionar
        </button>
      </div>

      {catStats.length === 0 && (
        <div className="pres-empty" style={{ padding: "20px 0" }}>
          <p>No hay categorías asignadas a este presupuesto.</p>
        </div>
      )}

      {catStats.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || Settings;
        return (
          <div
            key={cat.id_categ || cat.nombre_categ}
            id={`pres-cat-item-${cat.id_categ}`}
            className="pres-cat-item"
            role="button"
            tabIndex={0}
            onClick={() => onCategoryClick(cat.nombre_categ)}
            onKeyDown={(e) => e.key === "Enter" && onCategoryClick(cat.nombre_categ)}
          >
            {/* icono */}
            <div className="pres-cat-item__icon" style={{ background: cat.color }}>
              <Icon size={18} />
            </div>

            {/* nombre y barra */}
            <div className="pres-cat-item__info">
              <span className="pres-cat-item__name">{cat.nombre_categ || cat.nombre}</span>
              {!cat.isIncome && (
                <>
                  <div className="pres-cat-item__bar-row">
                    <div className="pres-cat-item__bar-track">
                      <div
                        className={`pres-cat-item__bar-fill ${cat.barClass}`}
                        style={{ width: `${cat.progress}%` }}
                      />
                    </div>
                    <span className="pres-cat-item__pct">{cat.progress}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#a2a9ad", marginTop: 2 }}>
                    de {fmt(cat.monto_limite || cat.monto_asignado || 0)}
                  </div>
                </>
              )}
            </div>

            {/* Executed amount */}
            <span 
              className="pres-cat-item__amount" 
              style={cat.isIncome ? { color: "var(--banorte-success)" } : {}}
            >
              {fmt(cat.executed)}
            </span>

            <ChevronRight size={16} className="pres-cat-item__arrow" />
          </div>
        );
      })}
    </div>
  );
}
