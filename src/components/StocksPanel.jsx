import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { fetchInversiones } from "../services/inversionesService";
 
const COLORS = ["#3B5BDB", "#EC0029", "#FCC419", "#20C997", "#845EF7", "#FF922B"];
 
function buildChartData(inversiones) {
  // Genera progreso mensual de cada inversión basado en fechas reales
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const ahora = new Date();
  const añoActual = ahora.getFullYear();
 
  return meses.map((mes, i) => {
    const punto = { month: mes };
    inversiones.forEach((inv, idx) => {
      const inicio = new Date(inv.fecha_inicio);
      const fin = new Date(inv.fecha_fin);
      const valor = parseFloat(inv.valor) || 0;
      const mesDate = new Date(añoActual, i, 15);
 
      if (mesDate < inicio) {
        punto[`inv_${idx}`] = null;
      } else if (mesDate > fin) {
        punto[`inv_${idx}`] = valor;
      } else {
        // Interpolación lineal del valor entre inicio y fin
        const total = fin - inicio;
        const transcurrido = mesDate - inicio;
        const pct = Math.min(1, transcurrido / total);
        // Simula crecimiento con leve curva
        punto[`inv_${idx}`] = parseFloat((valor * (0.85 + pct * 0.15)).toFixed(2));
      }
    });
    return punto;
  });
}
 
function CustomTooltip({ active, payload, label, inversiones }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="stock-tooltip">
      <p className="stock-tooltip-label">{label}</p>
      {payload.filter(p => p.value !== null).map((p, i) => {
        const idx = parseInt(p.dataKey.split("_")[1]);
        return (
          <div key={p.dataKey} className="stock-tooltip-row">
            <span className="stock-tooltip-dot" style={{ background: p.stroke }} />
            <span>{inversiones[idx]?.nombre ?? p.dataKey}</span>
            <span className="stock-tooltip-val">
              {Number(p.value).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
 
export default function StocksPanel() {
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlighted, setHighlighted] = useState(null);
 
  useEffect(() => {
    fetchInversiones()
      .then(data => setInversiones(data.slice(0, 6))) // máx 6 para colores
      .catch(() => setInversiones([]))
      .finally(() => setLoading(false));
  }, []);
 
  const chartData = buildChartData(inversiones);

  // ajustar para tamaño de stocks
  const { yMin, yMax } = chartData.reduce(
    (acc, point) => {
      Object.values(point).forEach((value) => {
        if (typeof value !== "number" || Number.isNaN(value)) return;
        acc.min = Math.min(acc.min, value);
        acc.max = Math.max(acc.max, value);
      });
      return acc;
    },
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
  );

  const yPadding = Number.isFinite(yMax - yMin) ? (yMax - yMin) * 0.15 : 0;
  const yDomain = Number.isFinite(yMin) && Number.isFinite(yMax)
    ? [Math.max(0, yMin - yPadding), yMax + yPadding]
    : [0, "auto"];
 
  const fmt = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
 
  const fmtFecha = (d) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
 
  const totalInvertido = inversiones.reduce((s, i) => s + parseFloat(i.valor || 0), 0);
 
  if (loading) {
    return (
      <div className="card stocks-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Cargando inversiones…</p>
      </div>
    );
  }
 
  if (inversiones.length === 0) {
    return (
      <div className="card stocks-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>No hay inversiones registradas.</p>
      </div>
    );
  }
 
  return (
    <div className="card stocks-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Banorte</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "2px 0 0" }}>Mis Inversiones</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Total invertido</p>
          <p style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>{fmt(totalInvertido)}</p>
        </div>
      </div>
 
      <div className="stocks-layout">
        <div className="stocks-left">
          <div className="stocks-list">
            {inversiones.map((inv, idx) => {
              const key = `inv_${idx}`;
              const color = COLORS[idx % COLORS.length];
              const vencida = new Date() > new Date(inv.fecha_fin);
              return (
                <div
                  key={inv["id_inversión"]}
                  className={`stock-row ${highlighted === key ? "stock-row-active" : ""}`}
                  onMouseEnter={() => setHighlighted(key)}
                  onMouseLeave={() => setHighlighted(null)}
                >
                  <span className="stock-dot" style={{ backgroundColor: color }} />
                  <div className="stock-info">
                    <span className="stock-ticker" style={{ fontSize: 12 }}>{inv.nombre}</span>
                    <span className="stock-name">{inv.tipo}</span>
                  </div>
                  <div className="stock-price">
                    <span>{fmt(inv.valor)}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: vencida ? "#dc2626" : "#16a34a",
                      display: "flex", alignItems: "center", gap: 2
                    }}>
                      {vencida
                        ? <><TrendingDown size={11} /> VENCIDA</>
                        : <><TrendingUp size={11} /> {fmtFecha(inv.fecha_fin)}</>
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        <div className="stocks-right">
          <div className="stocks-chart-header">
            <span style={{ fontSize: 10, color: "#9ca3af" }}>Proyección anual por inversión</span>
            <ExternalLink size={14} color="#999" />
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData}>
              <defs>
                {inversiones.map((_, idx) => (
                  <linearGradient key={idx} id={`g-inv-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#999" }}
                axisLine={false}
                tickLine={false}
                domain={yDomain}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip inversiones={inversiones} />} cursor={{ stroke: "#ddd", strokeDasharray: "4 4" }} />
              {inversiones.map((_, idx) => {
                const key = `inv_${idx}`;
                const color = COLORS[idx % COLORS.length];
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={`url(#g-inv-${idx})`}
                    strokeWidth={highlighted === key ? 3.5 : highlighted ? 1 : 2}
                    fillOpacity={highlighted === key ? 1 : highlighted ? 0.1 : 0.6}
                    connectNulls
                    style={{ transition: "all 0.3s ease" }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}