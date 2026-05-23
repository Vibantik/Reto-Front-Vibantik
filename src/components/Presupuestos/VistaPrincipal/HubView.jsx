import { useMemo } from "react";
import { Plus } from "lucide-react";

import { normalizeText, sumForCategory, getProgress, getBarClass, fmt } from "../utils/presupuestos.utils.js";
import { ICON_MAP } from "../presupuestos.data.js";
import { getBudgetHistory } from "../../../utils/budgetInsights";
import SummaryCards    from "./SummaryCards.jsx";
import BudgetDonutChart from "./BudgetDonutChart.jsx";
import CategoryList    from "./CategoryList.jsx";


export default function HubView({
  presupuestos,
  selectedPresId,
  onPresupuestoChange,
  onCreatePresupuesto,
  onDeletePresupuesto,
  creatingPresupuesto,
  presupuesto,
  categoriasConMonto,
  transactions,
  onCategoryClick,
  onManageClick,
}) {

  // Total Budget = monto_limite del presupuesto activo
  const totalBudget = presupuesto ? Number(presupuesto.monto_limite || 0) : 0;

  const totalExecuted = useMemo(
    () => transactions.filter((t) => t.type === "egreso").reduce((a, t) => a + t.amount, 0),
    [transactions]
  );

  const balance   = totalBudget - totalExecuted;
  const globalPct = totalBudget > 0
    ? Math.min(100, Math.round((totalExecuted / totalBudget) * 100))
    : 0;

  // Estadísticas por categoría del presupuesto
  const catStats = useMemo(
    () =>
      categoriasConMonto.map((cat) => {
        const norm = normalizeText(cat.nombre_categ);
        const isIncome = norm === "ingresos" || norm === "ingreso";
        const executed = sumForCategory(transactions, cat.nombre_categ, isIncome);
        const progress = getProgress(executed, cat.monto_asignado);
        const barClass = getBarClass(progress, isIncome);
        return {
          ...cat,
          nombre: cat.nombre_categ,
          executed,
          progress,
          barClass,
          isIncome,
          monto_limite: cat.monto_asignado,
        };
      }),
    [categoriasConMonto, transactions]
  );

  // Datos para el donut chart
  const chartData = useMemo(
    () =>
      catStats
        .filter((cat) => !cat.isIncome)
        .map((cat) => ({
          name: cat.nombre_categ,
          value: cat.executed,
          color: cat.color,
          catName: cat.nombre_categ,
        }))
        .filter((d) => d.value > 0),
    [catStats]
  );

  const historial = useMemo(
    () => getBudgetHistory(presupuestos, selectedPresId),
    [presupuestos, selectedPresId]
  );

  return (
    <>
      {/* Selector de presupuesto */}
      {presupuestos.length > 0 && (
        <div className="pres-budget-selector">
          <label htmlFor="pres-budget-select" className="pres-budget-selector__label">
            Presupuesto:
          </label>
          <select
            id="pres-budget-select"
            className="pres-budget-selector__select"
            value={selectedPresId || ""}
            onChange={(e) => onPresupuestoChange(Number(e.target.value))}
          >
            {presupuestos.map((p) => (
              <option key={p.id_presupuesto} value={p.id_presupuesto}>
                {p.nombre}{" "}
                ({new Date(p.inicio).toLocaleDateString("es-MX")}
                {p.fin ? ` — ${new Date(p.fin).toLocaleDateString("es-MX")}` : " — sin fin"})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="pres-budget-selector__create-btn"
            onClick={onCreatePresupuesto}
            disabled={creatingPresupuesto}
          >
            <Plus size={16} /> {creatingPresupuesto ? "Creando..." : "Nuevo presupuesto"}
          </button>
          
          <button
            type="button"
            className="pres-budget-selector__delete-btn"
            onClick={onDeletePresupuesto}
            aria-label="Eliminar presupuesto"
            style={{ marginLeft: '10px', backgroundColor: 'var(--banorte-red)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
          >
            Eliminar
          </button>
        </div>
      )}

      {presupuestos.length === 0 && (
        <div className="pres-empty">
          <p>No tienes presupuestos creados aún.</p>
          <p style={{ fontSize: 12, color: "#a2a9ad" }}>
            Crea tu primer presupuesto para comenzar a organizar tus gastos.
          </p>
          <button
            type="button"
            className="pres-empty__action-btn"
            onClick={onCreatePresupuesto}
            disabled={creatingPresupuesto}
          >
            <Plus size={16} /> {creatingPresupuesto ? "Creando..." : "Crear presupuesto"}
          </button>
        </div>
      )}

      {presupuesto && (
        <>
          <SummaryCards
            totalBudget={totalBudget}
            totalExecuted={totalExecuted}
            balance={balance}
            globalPct={globalPct}
          />

          <div className="pres-hub-body">
            <BudgetDonutChart
              chartData={chartData}
              globalPct={globalPct}
              totalExecuted={totalExecuted}
              onSliceClick={(catName) => onCategoryClick(catName)}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {(() => {
                const incomeCat = catStats.find((c) => c.isIncome);
                if (!incomeCat) return null;
                const Icon = ICON_MAP[incomeCat.icon] || Plus;
                return (
                  <div className="pres-cat-list-card">
                    <div className="pres-cat-list__header" style={{ marginBottom: 8 }}>
                      <span className="pres-cat-list__title">
                        Ingreso percibido durante periodo del presupuesto
                      </span>
                    </div>
                    <div
                      className="pres-cat-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => onCategoryClick(incomeCat.nombre_categ)}
                      onKeyDown={(e) => e.key === "Enter" && onCategoryClick(incomeCat.nombre_categ)}
                    >
                      <div className="pres-cat-item__icon" style={{ background: incomeCat.color }}>
                        <Icon size={18} />
                      </div>
                      <div className="pres-cat-item__info">
                        <span className="pres-cat-item__name">
                          {incomeCat.nombre_categ || incomeCat.nombre}
                        </span>
                      </div>
                      <span className="pres-cat-item__amount" style={{ color: "var(--banorte-success)" }}>
                        {fmt(incomeCat.executed)}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pres-cat-item__arrow"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                );
              })()}

              <CategoryList
                catStats={catStats.filter((c) => !c.isIncome)}
                onCategoryClick={(catName) => onCategoryClick(catName)}
                onManageClick={onManageClick}
              />

              {historial.length > 0 && (
                <div className="pres-cat-list-card">
                  <div className="pres-cat-list__header">
                    <span className="pres-cat-list__title">Historial reciente</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {historial.map((item) => (
                      <button
                        key={item.id_presupuesto}
                        type="button"
                        className="pres-cat-item"
                        onClick={() => onPresupuestoChange(Number(item.id_presupuesto))}
                      >
                        <div className="pres-cat-item__info" style={{ alignItems: "flex-start" }}>
                          <span className="pres-cat-item__name">{item.nombre}</span>
                          <span style={{ fontSize: 11, color: "#7b868c", marginTop: 2 }}>
                            {new Date(item.inicio).toLocaleDateString("es-MX")}
                            {item.fin ? ` - ${new Date(item.fin).toLocaleDateString("es-MX")}` : ""}
                          </span>
                        </div>
                        <span className="pres-cat-item__amount">{fmt(Number(item.monto_limite || 0))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* new transaction */}
          <button
            className="pres-fab"
            id="pres-new-transaction-fab"
            title="Nueva transacción"
            onClick={() => alert("💡 Aquí iría el flujo de nueva transacción")}
          >
            <Plus size={24} />
          </button>
        </>
      )}
    </>
  );
}
