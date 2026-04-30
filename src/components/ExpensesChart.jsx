import { useState, useCallback, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
  Label,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { fetchTransactions } from "../services/transactionsService";
 
const CATEGORY_COLORS = {
  Comida:          "#3B5BDB",
  Transporte:      "#845EF7",
  Entretenimiento: "#EC0029",
  Servicios:       "#FCC419",
  Salud:           "#20C997",
  Compras:         "#FF922B",
  Ingreso:         "#16a34a",
  Otros:           "#9ca3af",
};
 
// Presupuestos de referencia por categoría (MXN/mes)
const PRESUPUESTOS = {
  Comida:          3000,
  Transporte:      1500,
  Entretenimiento: 1000,
  Servicios:       1200,
  Salud:           800,
  Compras:         2000,
};
 
function ActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.18))", transition: "all 0.3s ease" }}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1a1a1a" fontSize={16} fontWeight={800}>
        {Number(value).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#888" fontSize={12} fontWeight={500}>
        {payload.name}
      </text>
    </g>
  );
}
 
export default function ExpensesChart() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [data, setData] = useState([]);
  const [totalEgresos, setTotalEgresos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState([]);
 
  useEffect(() => {
    const load = async () => {
      try {
        // Trae todos los egresos del mes actual (limit alto para tenerlos todos)
        const ahora = new Date();
        const primerDia = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;
        const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
        const ultimoDiaStr = `${ultimoDia.getFullYear()}-${String(ultimoDia.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia.getDate()).padStart(2, "0")}`;
 
        const result = await fetchTransactions({
          page: 1, limit: 200,
          type: "egreso",
          startDate: primerDia,
          endDate: ultimoDiaStr,
        });
 
        const transactions = result.data ?? [];
 
        // Agrupa por categoría
        const porCategoria = {};
        transactions.forEach((t) => {
          const cat = t.category || "Otros";
          porCategoria[cat] = (porCategoria[cat] || 0) + parseFloat(t.amount || 0);
        });
 
        const total = Object.values(porCategoria).reduce((s, v) => s + v, 0);
        setTotalEgresos(total);
 
        const chartData = Object.entries(porCategoria)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({
            name,
            value,
            pct: total > 0 ? `${Math.round((value / total) * 100)}%` : "0%",
            color: CATEGORY_COLORS[name] ?? "#9ca3af",
          }));
 
        setData(chartData);
 
        // Detecta categorías sobre presupuesto (>80%)
        const sobrePres = Object.entries(PRESUPUESTOS)
          .filter(([cat, pres]) => porCategoria[cat] && (porCategoria[cat] / pres) > 0.8)
          .map(([cat]) => cat);
        setAlertas(sobrePres);
 
      } catch (err) {
        console.error("Error cargando gastos:", err);
        // Fallback: datos vacíos, no rompe la UI
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
 
  const onEnter = useCallback((_, index) => setActiveIndex(index), []);
  const onLeave = useCallback(() => setActiveIndex(-1), []);
 
  if (loading) {
    return (
      <div className="card expenses-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Cargando gastos del mes…</p>
      </div>
    );
  }
 
  if (data.length === 0) {
    return (
      <div className="card expenses-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Sin egresos registrados este mes.</p>
      </div>
    );
  }
 
  const mesActual = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });
 
  return (
    <div className="card expenses-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div>
          <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Banorte</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "2px 0 0" }}>Gastos de {mesActual}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Total egresos</p>
          <p style={{ fontSize: 17, fontWeight: 800, color: "#EC0029", margin: 0 }}>
            {Number(totalEgresos).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
          </p>
        </div>
      </div>
 
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
                    opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.35}
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
              <span className="legend-bar" style={{ backgroundColor: item.color }} />
              <span className="legend-pct">{item.pct}</span>
              <span className="legend-name">{item.name.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
 
      {alertas.length > 0 && (
        <div className="expenses-alert">
          <AlertTriangle size={16} color="#EC0029" />
          <span>
            ¡Cuidado! Tu presupuesto de{" "}
            {alertas.map((a, i) => (
              <span key={a}>
                <strong>{a}</strong>
                {i < alertas.length - 2 ? ", " : i === alertas.length - 2 ? " y " : ""}
              </span>
            ))}{" "}
            {alertas.length === 1 ? "está cerca del límite." : "están cerca del límite."}
          </span>
        </div>
      )}
    </div>
  );
}
 