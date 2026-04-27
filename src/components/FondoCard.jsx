// src/components/FondoCard.jsx
import { useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import "./css/inversiones.css";

const fmtPct = (n) =>
  `${Number(n).toLocaleString("es-MX", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}%`;

const fmtMXN = (n) =>
  Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const fmtFecha = (isoStr) =>
  new Date(isoStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });

const fmtFechaLarga = (isoStr) =>
  new Date(isoStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// niveles de riesgo
const RIESGO_MAP = {
  bajo: { color: "#16a34a", bg: "#dcfce7", label: "BAJO" },
  medio: { color: "#d97706", bg: "#fef3c7", label: "MEDIO" },
  alto: { color: "#dc2626", bg: "#fee2e2", label: "ALTO" },
};

function FondoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fondo-tooltip">
      <p className="fondo-tooltip-fecha">{fmtFechaLarga(label)}</p>
      <p className="fondo-tooltip-valor">
        <span className="fondo-tooltip-dot" />
        {fmtPct(payload[0].value)}
      </p>
    </div>
  );
}

export default function FondoCard({ fondo, isExpandable = false }) {
  const {
    "id_inversión": idInversion,
    nombre,
    valor,
    fecha_inicio,
    fecha_fin,
    tipo,

    // algunos fields opcionales pq aun no los tenemos en la bd (puede que cambien)
    numero_cuenta,
    tasa_rendimiento_diaria_anualizada,
    cambio_tasa_anualizada,
    nivel_riesgo,
    rendimiento_diario,
    historial = [],   // formato array: { fecha: "YYYY-MM-DD", tasa: number }
  } = fondo;

  const [activePoint, setActivePoint] = useState(null);
  const [expanded, setExpanded] = useState(!isExpandable);

  const riesgo = nivel_riesgo
    ? (RIESGO_MAP[nivel_riesgo.toLowerCase()] ?? RIESGO_MAP.medio)
    : null;

  const cambioNum = Number(cambio_tasa_anualizada);
  const cambioPositivo = cambioNum >= 0;

  const onChartClick = useCallback((chartData) => {
    if (chartData?.activePayload?.length) {
      setActivePoint({
        fecha: chartData.activeLabel,
        tasa: chartData.activePayload[0].value,
      });
    }
  }, []);

  return (
    <div className={`inversion-card fondo-card ${expanded ? "" : "fondo-list-item"}`}>

      {!expanded ? (
        <div className="fondo-list-row">
          <div className="fondo-list-nombre-col">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <p className="inversion-nombre">{nombre}</p>
              {riesgo && (
                <span
                  className="inversion-estatus"
                  style={{ background: riesgo.bg, color: riesgo.color }}
                >
                  {riesgo.label}
                </span>
              )}
            </div>
            <p className="inversion-tipo">{tipo}</p>
          </div>

          <div className="fondo-list-stats">
            {tasa_rendimiento_diaria_anualizada != null && (
              <div className="fondo-list-stat">
                <span className="fondo-kpi-label">Tasa anualizada</span>
                <span className="fondo-list-stat-valor">
                  {fmtPct(tasa_rendimiento_diaria_anualizada)}
                </span>
              </div>
            )}
            {cambio_tasa_anualizada != null && (
              <div className="fondo-list-stat fondo-list-stat--right">
                <span className="fondo-kpi-label">Cambio</span>
                <span className={`fondo-list-stat-valor ${cambioPositivo ? "cambio-positivo" : "cambio-negativo"}`}>
                  {cambioPositivo ? "▲" : "▼"}&nbsp;{fmtPct(Math.abs(cambioNum))}
                </span>
              </div>
            )}
          </div>

          <button
            className="fondo-toggle-btn"
            onClick={() => setExpanded(true)}
            aria-expanded={false}
          >
            <span className="fondo-toggle-chevron">›</span>
            Ver más
          </button>
        </div>
      ) : (
        <>
          <div className="inversion-card-header">
            <div>
              <p className="inversion-nombre">{nombre}</p>
              <p className="inversion-tipo">
                {tipo}
                {idInversion && <> &nbsp;·&nbsp; Inv. #{idInversion}</>}
                {numero_cuenta && <> &nbsp;·&nbsp; Cta. {numero_cuenta}</>}
              </p>
            </div>
            {riesgo && (
              <span
                className="inversion-estatus"
                style={{ background: riesgo.bg, color: riesgo.color }}
              >
                {riesgo.label}
              </span>
            )}
          </div>

          {/* monto + rendimiento */}
          <div className="fondo-kpi-row">
            <div className="fondo-kpi">
              <span className="fondo-kpi-label">Cantidad invertida</span>
              <span className="inversion-monto">{fmtMXN(valor)}</span>
            </div>
            {rendimiento_diario != null && (
              <div className="fondo-kpi fondo-kpi-right">
                <span className="fondo-kpi-label">Rendimiento diario</span>
                <span className="fondo-rendimiento-valor">{fmtMXN(rendimiento_diario)}</span>
              </div>
            )}
          </div>

          {/* opcional: tasa/cambio/riesgo */}
          {(tasa_rendimiento_diaria_anualizada != null ||
            cambio_tasa_anualizada != null ||
            nivel_riesgo) && (
              <div className="inversion-detalles fondo-tasa-row">
                {tasa_rendimiento_diaria_anualizada != null && (
                  <span>
                    <strong>{fmtPct(tasa_rendimiento_diaria_anualizada)}</strong>
                    Tasa anualizada
                  </span>
                )}
                {cambio_tasa_anualizada != null && (
                  <span>
                    <strong className={cambioPositivo ? "cambio-positivo" : "cambio-negativo"}>
                      {cambioPositivo ? "▲" : "▼"}&nbsp;{fmtPct(Math.abs(cambioNum))}
                    </strong>
                    Cambio en tasa
                  </span>
                )}
                {riesgo && (
                  <span>
                    <strong style={{ color: riesgo.color }}>{riesgo.label}</strong>
                    Nivel de riesgo
                  </span>
                )}
              </div>
            )}

          {/* progress bar con fechas (same as InversionCard) */}
          {fecha_inicio && fecha_fin && (() => {
            const inicio = new Date(fecha_inicio);
            const fin = new Date(fecha_fin);
            const hoy = new Date();
            const total = fin - inicio;
            const transcurrido = Math.min(hoy - inicio, total);
            const progreso = Math.max(0, Math.min(100, (transcurrido / total) * 100));
            const diasRest = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));

            return (
              <>
                <div className="inversion-detalles">
                  <span>
                    <strong>{fmtFecha(fecha_inicio)}</strong>
                    Inicio
                  </span>
                  <span>
                    <strong>{fmtFecha(fecha_fin)}</strong>
                    Vencimiento
                  </span>
                  <span>
                    <strong>{diasRest} días</strong>
                    Restantes
                  </span>
                </div>
                <div className="inversion-progreso-bar">
                  <div
                    className="inversion-progreso-fill"
                    style={{ width: `${progreso.toFixed(1)}%` }}
                  />
                </div>
              </>
            );
          })()}

          {/* grafica de historial */}
          {historial.length > 0 && (
            <div className="fondo-chart-wrapper">
              <p className="fondo-chart-title">
                Rendimiento diario anualizado (últimos 14 días)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={historial}
                  margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                  onClick={onChartClick}
                  style={{ cursor: "crosshair" }}
                >
                  <defs>
                    <linearGradient id="fondoLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ec0029" />
                      <stop offset="100%" stopColor="#FCC419" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={fmtFecha}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    content={<FondoTooltip />}
                    cursor={{ stroke: "#ec0029", strokeWidth: 1, strokeDasharray: "4 2" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasa"
                    stroke="url(#fondoLineGrad)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#ec0029",
                      stroke: "white",
                      strokeWidth: 2,
                      style: { filter: "drop-shadow(0 2px 6px rgba(236,0,41,0.4))" },
                    }}
                  />
                  {/* seleccionar punto */}
                  {activePoint && (
                    <ReferenceDot
                      x={activePoint.fecha}
                      y={activePoint.tasa}
                      r={6}
                      fill="#ec0029"
                      stroke="white"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>

              {/* punto seleccionado de grafica */}
              {activePoint ? (
                <div className="fondo-selected-point">
                  <span className="fondo-selected-fecha">{fmtFechaLarga(activePoint.fecha)}</span>
                  <span className="fondo-selected-tasa">{fmtPct(activePoint.tasa)}</span>
                  <button
                    className="fondo-clear-btn"
                    onClick={() => setActivePoint(null)}
                    aria-label="Limpiar selección"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="fondo-chart-hint">Haz clic en un punto para ver el detalle</p>
              )}
            </div>
          )}

          {isExpandable && (
            <button
              className="fondo-toggle-btn"
              onClick={() => setExpanded(false)}
              aria-expanded={true}
              style={{ alignSelf: "center", marginTop: "1rem" }}
            >
              <span className="fondo-toggle-chevron fondo-toggle-chevron--up">›</span>
              Ver menos
            </button>
          )}
        </>
      )}
    </div>
  );
}
