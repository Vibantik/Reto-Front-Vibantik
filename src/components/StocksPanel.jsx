import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ExternalLink } from "lucide-react";

const stocks = [
  { ticker: "NVDA", key: "nvda", name: "NVDA Corporat...", price: 185.34, change: "+1.47%", color: "#3B5BDB", positive: true },
  { ticker: "CNC", key: "cnc", name: "Centene Corpo...", price: 37.54, change: "-13.34%", color: "#EC0029", positive: false },
  { ticker: "AADR", key: "aadr", name: "AdvisorShares...", price: 89.67, change: "+5.71%", color: "#FCC419", positive: true },
  { ticker: "ALSEA", key: "alsea", name: "Alsea, S.A.B...", price: 56.92, change: "+8.73%", color: "#20C997", positive: true },
];

const chartData = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
].map((month, i) => ({
  month,
  nvda: 15 + Math.sin(i * 0.8) * 10 + i * 2.5,
  cnc: 30 - Math.sin(i * 0.5) * 8 - i * 0.8,
  aadr: 20 + Math.cos(i * 0.6) * 12 + i * 1.5,
  alsea: 10 + Math.sin(i * 1.2) * 6 + i * 1,
}));

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="stock-tooltip">
      <p className="stock-tooltip-label">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="stock-tooltip-row">
          <span className="stock-tooltip-dot" style={{ background: p.stroke }} />
          <span>{p.dataKey.toUpperCase()}</span>
          <span className="stock-tooltip-val">{p.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function StocksPanel() {
  const [highlighted, setHighlighted] = useState(null);

  return (
    <div className="card stocks-card">
      <div className="stocks-layout">
        <div className="stocks-left">
          <div className="stocks-list">
            {stocks.map((s) => (
              <div
                key={s.ticker}
                className={`stock-row ${highlighted === s.key ? "stock-row-active" : ""}`}
                onMouseEnter={() => setHighlighted(s.key)}
                onMouseLeave={() => setHighlighted(null)}
              >
                <span className="stock-dot" style={{ backgroundColor: s.color }} />
                <div className="stock-info">
                  <span className="stock-ticker">{s.ticker}</span>
                  <span className="stock-name">{s.name}</span>
                </div>
                <div className="stock-price">
                  <span>{s.price.toFixed(2)}</span>
                  <span className={s.positive ? "stock-up" : "stock-down"}>
                    {s.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stocks-right">
          <div className="stocks-chart-header">
            <ExternalLink size={14} color="#999" />
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData}>
              <defs>
                {stocks.map((s) => (
                  <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#ddd", strokeDasharray: "4 4" }} />
              {stocks.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  fill={`url(#g-${s.key})`}
                  strokeWidth={highlighted === s.key ? 3.5 : highlighted ? 1 : 2}
                  fillOpacity={highlighted === s.key ? 1 : highlighted ? 0.15 : 0.6}
                  style={{ transition: "all 0.3s ease" }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
