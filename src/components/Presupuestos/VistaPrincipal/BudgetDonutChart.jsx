//dona + leyenda de colores para la vista de hub.
// clikck-> detalle de esa categoría

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fmt } from "../utils/presupuestos.utils.js";

//tooltip
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="pres-tooltip">
      <p className="pres-tooltip__label">{name}</p>
      <p className="pres-tooltip__value">{fmt(value)}</p>
    </div>
  );
}

export default function BudgetDonutChart({
  chartData,
  globalPct,
  totalExecuted,
  categories,
  onSliceClick,
}) {
  return (
    <div className="pres-chart-card">
      <span className="pres-chart-card__title">Balance Global vs. Presupuesto</span>

      <div className="pres-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={75}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              className="cursor-pointer"
              onClick={(data) => {
                const cat = categories.find((c) => c.nombre === data.name);
                if (cat) onSliceClick(cat.id);
              }}
            >
              {chartData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* overlay doma */}
        <div className="pres-donut-center">
          <span className="pres-donut-center__label">BALANCE GLOBAL VS. PRESUPUESTO</span>
          <span className="pres-donut-center__pct">{globalPct}%</span>
          <span className="pres-donut-center__amount">{fmt(totalExecuted)}</span>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 14px",
          justifyContent: "center",
        }}
      >
        {chartData.map((d) => (
          <div
            key={d.catId}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#5B6670" }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: d.color,
                display: "inline-block",
              }}
            />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
