// Cartas de metricas globales: Presupuestado / Ejecutado / Balance.

import { fmt } from "../utils/presupuestos.utils.js";
// balance = ingresos - gastos
export default function SummaryCards({ totalBudget, totalExecuted, balance, globalPct }) {
  return (
    <div className="pres-summary-cards">
      <div className="pres-summary-card">
        <span className="pres-summary-card__label">Total Presupuestado</span>
        <span className="pres-summary-card__value">{fmt(totalBudget)}</span>
        <span className="pres-summary-card__sub">Ingresos + Gastos</span>
      </div>

      <div className="pres-summary-card">
        <span className="pres-summary-card__label">Total Ejecutado</span>
        <span className="pres-summary-card__value">{fmt(totalExecuted)}</span>
        <span className="pres-summary-card__sub">{globalPct}% del presupuesto</span>
      </div>

      <div className="pres-summary-card">
        <span className="pres-summary-card__label">Balance Disponible</span>
        <span className={`pres-summary-card__value ${balance >= 0 ? "success" : "danger"}`}>
          {fmt(balance)}
        </span>
        <span className="pres-summary-card__sub">
          {balance >= 0 ? "Dentro del presupuesto" : "Presupuesto excedido"}
        </span>
      </div>
    </div>
  );
}
