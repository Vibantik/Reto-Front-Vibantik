import { useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
  Label,
} from "recharts";
import { AlertTriangle } from "lucide-react";

const data = [
  { name: "Renta", value: 55, pct: "45%", color: "#3B5BDB" },
  { name: "Alimentos", value: 25, pct: "9%", color: "#845EF7" },
  { name: "Entretenimiento", value: 15, pct: "78%", color: "#EC0029" },
  { name: "Ahorro", value: 5, pct: "93%", color: "#FCC419" },
];

function ActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.18))", transition: "all 0.3s ease" }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1a1a1a" fontSize={18} fontWeight={800}>
        {value}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#888" fontSize={12} fontWeight={500}>
        {payload.name}
      </text>
    </g>
  );
}

export default function ExpensesChart() {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onEnter = useCallback((_, index) => setActiveIndex(index), []);
  const onLeave = useCallback(() => setActiveIndex(-1), []);

  return (
    <div className="card expenses-card">
      <div className="expenses-layout">
        <div className="expenses-chart-area">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
                activeIndex={activeIndex}
                activeShape={ActiveShape}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    style={{ cursor: "pointer", transition: "opacity 0.3s" }}
                    opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.4}
                  />
                ))}
                {activeIndex === -1 && (
                  <>
                    <Label
                      value="Gastos"
                      position="centerBottom"
                      dy={-4}
                      style={{ fontSize: "13px", fill: "#888", fontWeight: 500 }}
                    />
                    <Label
                      value="del Mes"
                      position="centerTop"
                      dy={10}
                      style={{ fontSize: "13px", fill: "#888", fontWeight: 500 }}
                    />
                  </>
                )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="expenses-legend">
          {data.map((item, i) => (
            <div
              key={item.name}
              className={`legend-row ${activeIndex === i ? "legend-active" : ""}`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <span
                className="legend-bar"
                style={{ backgroundColor: item.color }}
              />
              <span className="legend-pct">{item.pct}</span>
              <span className="legend-name">{item.name.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="expenses-alert">
        <AlertTriangle size={16} color="#EC0029" />
        <span>
          ¡Cuidado! Tu presupuesto de <strong>Ahorro</strong> y{" "}
          <strong>Entretenimiento</strong> están cerca del límite.
        </span>
      </div>
    </div>
  );
}
