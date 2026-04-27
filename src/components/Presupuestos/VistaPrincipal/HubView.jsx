import { useMemo } from "react";
import { Plus } from "lucide-react";

import { normalizeText, sumForCategory, getProgress, getBarClass, fmt } from "../utils/presupuestos.utils.js";
import SummaryCards    from "./SummaryCards.jsx";
import BudgetDonutChart from "./BudgetDonutChart.jsx";
import CategoryList    from "./CategoryList.jsx";


export default function HubView({
  presupuestos,
  selectedPresId,
  onPresupuestoChange,
  onCreatePresupuesto,
  creatingPresupuesto,
  presupuesto,
  categoriasConMonto,
  transactions,
  allCategorias,
  onCategoryClick,
  onManageClick,
  onReload,
}) {

  // Total Budget = monto_limite del presupuesto activo
  const totalBudget = presupuesto ? Number(presupuesto.monto_limite || 0) : 0;

  const totalExecuted = useMemo(
    () => transactions.filter((t) => t.type === "egreso").reduce((a, t) => a + t.amount, 0),
    [transactions]
  );

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "ingreso").reduce((a, t) => a + t.amount, 0),
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
        const isIncome = normalizeText(cat.nombre_categ) === "ingresos";
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
        .map((cat) => ({
          name: cat.nombre_categ,
          value: cat.executed,
          color: cat.color,
          catName: cat.nombre_categ,
        }))
        .filter((d) => d.value > 0),
    [catStats]
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

            <CategoryList
              catStats={catStats}
              onCategoryClick={(catName) => onCategoryClick(catName)}
              onManageClick={onManageClick}
            />
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
