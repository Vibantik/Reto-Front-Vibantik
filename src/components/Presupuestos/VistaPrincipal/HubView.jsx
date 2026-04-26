import { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import { isIncomeCategory, sumForCategory, getProgress, getBarClass } from "../utils/presupuestos.utils.js";
import PeriodTabs      from "./PeriodTabs.jsx";
import SummaryCards    from "./SummaryCards.jsx";
import BudgetDonutChart from "./BudgetDonutChart.jsx";
import CategoryList    from "./CategoryList.jsx";


export default function HubView({ categories, transactions, onCategoryClick, onManageClick }) {
  const [period, setPeriod] = useState("current");

  //filtro
  const filteredTxns = useMemo(() => transactions, [transactions, period]);

  // totales 
  const totalBudget = useMemo(
    () => categories.reduce((a, c) => a + c.monto_limite, 0),
    [categories]
  );

  const totalExecuted = useMemo(
    () => filteredTxns.filter((t) => t.type === "egreso").reduce((a, t) => a + t.amount, 0),
    [filteredTxns]
  );

  const totalIncome = useMemo(
    () => filteredTxns.filter((t) => t.type === "ingreso").reduce((a, t) => a + t.amount, 0),
    [filteredTxns]
  );

  const balance   = totalIncome - totalExecuted;
  const globalPct = totalBudget > 0
    ? Math.min(100, Math.round((totalExecuted / totalBudget) * 100))
    : 0;

  // grafico
  const chartData = useMemo(
    () =>
      categories
        .map((cat) => {
          const income   = isIncomeCategory(cat);
          const executed = sumForCategory(filteredTxns, cat.id, income);
          return { name: cat.nombre, value: executed, color: cat.color, catId: cat.id };
        })
        .filter((d) => d.value > 0),
    [categories, filteredTxns]
  );

  //stats por categoria lista
  const catStats = useMemo(
    () =>
      categories.map((cat) => {
        const income   = isIncomeCategory(cat);
        const executed = sumForCategory(filteredTxns, cat.id, income);
        const progress = getProgress(executed, cat.monto_limite);
        const barClass = getBarClass(progress, income);
        return { ...cat, executed, progress, barClass, isIncome: income };
      }),
    [categories, filteredTxns]
  );

  return (
    <>
      <PeriodTabs period={period} onChange={setPeriod} />

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
          categories={categories}
          onSliceClick={onCategoryClick}
        />

        <CategoryList
          catStats={catStats}
          onCategoryClick={onCategoryClick}
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
  );
}
