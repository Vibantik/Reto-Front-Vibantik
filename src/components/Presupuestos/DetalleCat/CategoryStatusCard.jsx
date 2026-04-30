// Tarjeta de status de categoria con barra de progreso y alerta de sobrepresupuesto.

import { AlertCircle } from "lucide-react";
import { fmt, getBarClass } from "../utils/presupuestos.utils.js";

export default function CategoryStatusCard({ budget, executed, balance, progress, isIncome }) {
  const barClass = getBarClass(progress, isIncome);

  return (
    <div className="pres-detail-status">
      <div className="pres-detail-status__row" style={isIncome ? { gridTemplateColumns: "1fr" } : {}}>
        {!isIncome && (
          <>
            <div className="pres-detail-status__item">
              <span className="pres-detail-status__label">Presupuesto</span>
              <span className="pres-detail-status__amount">{fmt(budget)}</span>
            </div>
            <div className="pres-detail-status__item">
              <span className="pres-detail-status__label">Ejecutado</span>
              <span className="pres-detail-status__amount">{fmt(executed)}</span>
            </div>
          </>
        )}
        <div className="pres-detail-status__item" style={isIncome ? { textAlign: "left" } : {}}>
          <span className="pres-detail-status__label">{isIncome ? "Total Ingresado" : "Restante"}</span>
          <span className={`pres-detail-status__amount ${!isIncome && balance < 0 ? "danger" : "success"}`}>
            {fmt(isIncome ? executed : balance)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {!isIncome && (
        <div className="pres-detail-bar-track">
          <div
            className={`pres-detail-bar-fill pres-cat-item__bar-fill ${barClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* warning */}
      {!isIncome && progress > 90 && (
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
