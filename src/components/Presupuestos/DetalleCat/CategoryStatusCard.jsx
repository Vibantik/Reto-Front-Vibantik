// Tarjeta de status de categoria con barra de progreso y alerta de sobrepresupuesto.

import { AlertCircle } from "lucide-react";
import { fmt, getBarClass } from "../utils/presupuestos.utils.js";

export default function CategoryStatusCard({ budget, executed, balance, progress, isIncome }) {
  const barClass = getBarClass(progress, isIncome);

  return (
    <div className="pres-detail-status">
      <div className="pres-detail-status__row">
        <div className="pres-detail-status__item">
          <span className="pres-detail-status__label">Presupuesto</span>
          <span className="pres-detail-status__amount">{fmt(budget)}</span>
        </div>
        <div className="pres-detail-status__item">
          <span className="pres-detail-status__label">Ejecutado</span>
          <span className="pres-detail-status__amount">{fmt(executed)}</span>
        </div>
        <div className="pres-detail-status__item">
          <span className="pres-detail-status__label">Restante</span>
          <span className={`pres-detail-status__amount ${balance >= 0 ? "success" : "danger"}`}>
            {fmt(balance)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="pres-detail-bar-track">
        <div
          className={`pres-detail-bar-fill pres-cat-item__bar-fill ${barClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* warning */}
      {progress > 90 && !isIncome && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            fontSize: 12,
            color: "#eb0029",
          }}
        >
          <AlertCircle size={14} />
          {progress >= 100 ? "¡Presupuesto excedido!" : "Cerca del límite presupuestario"}
        </div>
      )}
    </div>
  );
}
