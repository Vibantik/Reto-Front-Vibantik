// Cada linea dentro de categoryConfigView
// Cambia icon, nombre, limte, orden y borrar

import { GripVertical, Trash2 } from "lucide-react";
import { ICON_MAP } from "../presupuestos.data.js";
import { normalizeText, fmt } from "../utils/presupuestos.utils.js";


export default function CategoryConfigItem({
  cat,
  index,
  total,
  isHighlighted,
  onUpdate,
  onDelete,
  onMove,
  onIconClick,
}) {
  const Icon = ICON_MAP[cat.icon] || ICON_MAP["zap"];
  const catKey = cat.id_categ ?? cat.uid;
  const isIncome = normalizeText(cat.nombre_categ) === "ingresos" || normalizeText(cat.nombre_categ) === "ingreso";

  return (
    <div
      id={`pres-config-item-${catKey}`}
      className={`pres-config-item${isHighlighted ? " highlighted" : ""}`}
    >
      {/* ! TODO: Drag handle (rn solo visual ) */}
      <span className="pres-config-item__drag" title="Arrastrar para reordenar">
        <GripVertical size={20} />
      </span>

      {/* Icon picker trigger */}
      <button
        id={`pres-icon-btn-${catKey}`}
        className="pres-config-item__icon-btn"
        style={{ background: cat.color, cursor: isIncome ? "default" : "pointer" }}
        title={isIncome ? "Categoría fija" : "Cambiar icono"}
        onClick={() => !isIncome && onIconClick(cat.uid)}
      >
        <Icon size={20} />
      </button>

      {/* Nombre y presupuesto */}
      <div className="pres-config-item__fields">
        <input
          id={`pres-cat-name-${catKey}`}
          className="pres-config-item__name-input"
          value={cat.nombre_categ}
          placeholder="Nombre de categoría"
          disabled={isIncome}
          onChange={(e) => onUpdate(cat.uid, "nombre_categ", e.target.value)}
        />
        <div className="pres-config-item__budget-row">
          <span>$</span>
          {isIncome ? (
            <span style={{ color: "var(--banorte-success)", fontWeight: 600 }}>
              Auto-calculado
            </span>
          ) : (
            <>
              <input
                id={`pres-cat-budget-${catKey}`}
                className="pres-config-item__budget-input"
                type="number"
                min={0}
                value={cat.monto_asignado}
                onChange={(e) => onUpdate(cat.uid, "monto_asignado", Number(e.target.value))}
              />
              <span style={{ marginLeft: "auto", color: "#a2a9ad" }}>
                /{cat.monto_asignado > 0 ? fmt(cat.monto_asignado) : "sin límite"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Up / Down botones*/}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <button
          title="Subir"
          disabled={index === 0}
          style={{
            background: "none",
            border: "none",
            cursor: index === 0 ? "default" : "pointer",
            color: index === 0 ? "#cfd2d3" : "#7B868C",
            padding: 2,
          }}
          onClick={() => index > 0 && onMove(index, index - 1)}
        >
          ▲
        </button>
        <button
          title="Bajar"
          disabled={index === total - 1}
          style={{
            background: "none",
            border: "none",
            cursor: index === total - 1 ? "default" : "pointer",
            color: index === total - 1 ? "#cfd2d3" : "#7B868C",
            padding: 2,
          }}
          onClick={() => index < total - 1 && onMove(index, index + 1)}
        >
          ▼
        </button>
      </div>

      {/* Delete */}
      {isIncome ? (
        <div style={{ width: 36, height: 36 }} />
      ) : (
        <button
          id={`pres-cat-delete-${catKey}`}
          className="pres-config-item__delete-btn"
          title="Eliminar categoría"
          onClick={() => onDelete(cat.uid)}
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
