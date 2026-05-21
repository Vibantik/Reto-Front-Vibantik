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
import {
  fetchCategorias,
  fetchPresupuestos,
  fetchPresupuesto,
} from "../services/presupuestosService";


const DEFAULT_COLOR = "#9ca3af";

const normalizeKey = (value) => String(value || "").trim().toLowerCase();
// TODO : revisar que si este correcto cuando hay multiples presupuestos activos
const pickActivePresupuesto = (presupuestos = []) => {
  if (!Array.isArray(presupuestos) || presupuestos.length === 0) return null;
  const now = new Date();
  const activos = presupuestos.filter((p) => {
    const ini = new Date(p.inicio);
    const fin = p.fin ? new Date(p.fin) : null;
    return ini <= now && (!fin || fin >= now);
  });
  const source = activos.length > 0 ? activos : presupuestos;
  return [...source].sort((a, b) => new Date(b.inicio) - new Date(a.inicio))[0];
};

const buildCategoryMeta = (categorias = [], presupuestoCats = []) => {
  const metaByKey = new Map();

  (categorias || []).forEach((c) => {
    const key = normalizeKey(c?.nombre_categ);
    if (!key) return;
    metaByKey.set(key, {
      name: c.nombre_categ || "",
      color: c.color || DEFAULT_COLOR,
      presupuesto: 0,
    });
  });

  (presupuestoCats || []).forEach((c) => {
    const key = normalizeKey(c?.nombre_categ);
    if (!key) return;
    const prev = metaByKey.get(key) || {
      name: c.nombre_categ || "",
      color: DEFAULT_COLOR,
      presupuesto: 0,
    };
    metaByKey.set(key, {
      name: prev.name || c.nombre_categ || "",
      color: c.color || prev.color || DEFAULT_COLOR,
      presupuesto: Number(c.monto_asignado || 0),
    });
  });

  return metaByKey;
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
 
export default function ExpensesChart({ uuid }) {
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
 
        const [result, categorias, presList] = await Promise.all([
          fetchTransactions({
            page: 1,
            limit: 200,
            type: "egreso",
            startDate: primerDia,
            endDate: ultimoDiaStr,
          }),
          fetchCategorias().catch(() => []),
          fetchPresupuestos(uuid).catch(() => []),
        ]);

        let presupuestoDetalle = null;
        const activo = pickActivePresupuesto(presList);
        if (activo?.id_presupuesto != null) {
          try {
            presupuestoDetalle = await fetchPresupuesto(activo.id_presupuesto);
          } catch (err) {
            console.error("Error cargando presupuesto activo:", err);
          }
        }

        const metaByKey = buildCategoryMeta(
          categorias,
          presupuestoDetalle?.categorias || []
        );

        const transactions = result.data ?? [];
        const porCategoria = new Map();
        transactions.forEach((t) => {
          const raw = t.category || "Otros";
          const key = normalizeKey(raw) || "otros";
          const meta = metaByKey.get(key);
          const displayName = meta?.name || raw || "Otros";
          const prev = porCategoria.get(key);
          const nextValue = (prev?.value || 0) + parseFloat(t.amount || 0);
          porCategoria.set(key, { name: displayName, value: nextValue });
        });

        const total = Array.from(porCategoria.values()).reduce(
          (s, v) => s + v.value,
          0
        );
        setTotalEgresos(total);

        const chartData = Array.from(porCategoria.entries())
          .sort((a, b) => b[1].value - a[1].value)
          .map(([key, entry]) => ({
            name: entry.name,
            value: entry.value,
            pct: total > 0 ? `${Math.round((entry.value / total) * 100)}%` : "0%",
            color: metaByKey.get(key)?.color ?? DEFAULT_COLOR,
          }));

        setData(chartData);

        // * Detecta categorias sobre presupuesto (>80%)
        const sobrePres = [];
        for (const [key, meta] of metaByKey.entries()) {
          const presupuesto = Number(meta.presupuesto || 0);
          if (!presupuesto) continue;
          const gasto = porCategoria.get(key)?.value || 0;
          if (gasto / presupuesto > 0.8) {
            sobrePres.push(meta.name || key);
          }
        }
        setAlertas(sobrePres);
 
      } catch (err) {
        console.error("Error cargando gastos:", err);
        // para no romper UI
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid]);
 
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
 