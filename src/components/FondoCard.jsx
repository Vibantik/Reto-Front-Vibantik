// src/components/FondoCard.jsx
import { useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import "./css/inversiones.css";
 
// ── Helpers de formato ───────────────────────────────────────────────────────
const fmtMXN = (n) =>
  Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
 
const fmtPct = (n) => `${Number(n).toFixed(2)}%`;
 
const fmtFecha = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
 
const fmtFechaLarga = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-MX", {
    weekday: "short", day: "2-digit", month: "long", year: "numeric",
  });
};
 
// ── Mapa de niveles de riesgo ────────────────────────────────────────────────
const RIESGO_MAP = {
  bajo:   { label: "BAJO",   color: "#16a34a", bg: "#dcfce7" },
  medio:  { label: "MEDIO",  color: "#d97706", bg: "#fef3c7" },
  alto:   { label: "ALTO",   color: "#dc2626", bg: "#fee2e2" },
};
 
// ── Tooltip personalizado de la gráfica ─────────────────────────────────────
function FondoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fondo-tooltip">
      <p className="fondo-tooltip-fecha">{fmtFechaLarga(label)}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className="fondo-tooltip-dot" />
        <span className="fondo-tooltip-valor">{fmtPct(payload[0].value)}</span>
      </div>
    </div>
  );
}
 
// ── Componente principal ─────────────────────────────────────────────────────
export default function FondoCard({ fondo, isExpandable = false }) {
  const {
    "id_inversión": idInversion,
    nombre,
    valor,
    fecha_inicio,
    fecha_fin,
    tipo,
    numero_cuenta,
    tasa_rendimiento_diaria_anualizada,
    cambio_tasa_anualizada,
    nivel_riesgo,
    rendimiento_diario,
    historial = [],
  } = fondo;
 
  const [activePoint, setActivePoint] = useState(null);
  const [expanded, setExpanded] = useState(!isExpandable);
 
  const riesgo = nivel_riesgo
    ? RIESGO_MAP[nivel_riesgo.toLowerCase()] ?? RIESGO_MAP.medio
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
    <div
      className={`inversion-card fondo-card ${expanded ? "" : "fondo-list-item"}`}
      data-cy="fondo-card"
    >
      {/* ── Vista colapsada (lista) ── */}
      {!expanded ? (
        <div className="fondo-list-row">
          <div className="fondo-list-nombre-col">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <p className="inversion-nombre" data-cy="fondo-nombre">{nombre}</p>
              {riesgo && (
                <span className="inversion-estatus" style={{ background: riesgo.bg, color: riesgo.color }}>
                  {riesgo.label}
                </span>
              )}
            </div>
            <p className="inversion-tipo" data-cy="fondo-tipo">{tipo}</p>
          </div>
 
          <div className="fondo-list-stats">
            {tasa_rendimiento_diaria_anualizada != null && (
              <div className="fondo-list-stat">
                <span className="fondo-kpi-label">Tasa anualizada</span>
                <span className="fondo-list-stat-valor">{fmtPct(tasa_rendimiento_diaria_anualizada)}</span>
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
            data-cy="fondo-toggle-btn"
            onClick={() => setExpanded(true)}
            aria-expanded="false"
          >
            <span className="fondo-toggle-chevron">›</span>
            Ver más
          </button>
        </div>
 
      ) : (
        /* ── Vista expandida ── */
        <>
          <div className="inversion-card-header">
            <div>
              <p className="inversion-nombre" data-cy="fondo-nombre-expanded">{nombre}</p>
              <p className="inversion-tipo" data-cy="fondo-tipo-expanded">
                {tipo}
                {idInversion && <> &nbsp;·&nbsp; Inv. #{idInversion}</>}
                {numero_cuenta && <> &nbsp;·&nbsp; Cta. {numero_cuenta}</>}
              </p>
            </div>
            {riesgo && (
              <span
                className="inversion-estatus"
                data-cy="fondo-riesgo"
                style={{ background: riesgo.bg, color: riesgo.color }}
              >
                {riesgo.label}
              </span>
            )}
          </div>
 
          <div className="fondo-kpi-row">
            <div className="fondo-kpi">
              <span className="fondo-kpi-label">Cantidad invertida</span>
              <span className="inversion-monto" data-cy="fondo-monto">{fmtMXN(valor)}</span>
            </div>
            {rendimiento_diario != null && (
              <div className="fondo-kpi fondo-kpi-right">
                <span className="fondo-kpi-label">Rendimiento diario</span>
                <span className="fondo-rendimiento-valor">{fmtMXN(rendimiento_diario)}</span>
              </div>
            )}
          </div>
 
          {(tasa_rendimiento_diaria_anualizada != null || cambio_tasa_anualizada != null || nivel_riesgo) && (
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
 
          {fecha_inicio && fecha_fin && (() => {
            const inicio = new Date(fecha_inicio);
            const fin    = new Date(fecha_fin);
            const hoy    = new Date();
            const total  = fin - inicio;
            const transcurrido = Math.min(hoy - inicio, total);
            const progreso = Math.max(0, Math.min(100, (transcurrido / total) * 100));
            const diasRest = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));
 
            return (
              <>
                <div className="inversion-detalles" data-cy="fondo-detalles">
                  <span data-cy="fondo-fecha-inicio"><strong>{fmtFecha(fecha_inicio)}</strong>Inicio</span>
                  <span data-cy="fondo-fecha-fin"><strong>{fmtFecha(fecha_fin)}</strong>Vencimiento</span>
                  <span data-cy="fondo-dias-restantes"><strong>{diasRest} días</strong>Restantes</span>
                </div>
                <div className="inversion-progreso-bar" data-cy="fondo-progreso-bar">
                  <div
                    className="inversion-progreso-fill"
                    data-cy="fondo-progreso-fill"
                    style={{ width: `${progreso.toFixed(1)}%` }}
                  />
                </div>
              </>
            );
          })()}
 
          {historial.length > 0 && (
            <div className="fondo-chart-wrapper">
              <p className="fondo-chart-title">Rendimiento diario anualizado (últimos 14 días)</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={historial}
                  margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                  onClick={onChartClick}
                  style={{ cursor: "crosshair" }}
                >
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
                    stroke="#ec0029"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#ec0029", stroke: "white", strokeWidth: 2 }}
                  />
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
              aria-expanded="true"
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