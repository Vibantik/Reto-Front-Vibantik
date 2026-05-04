// src/components/InversionesPanel.jsx
import { useEffect, useState } from "react";
import { fetchInversiones } from "../services/inversionesService";
import FondoCard from "./FondoCard";
import { TrendingUp, Clock, PiggyBank, X, Calculator, RefreshCw } from "lucide-react";
import "./css/inversiones.css";
 
const fmt = (n) =>
  Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
 
const fmtFecha = (d) =>
  new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
 
// ── Simulador ────────────────────────────────────────────────────────────────
function SimuladorModal({ inversion, onClose }) {
  const valorBase = parseFloat(inversion.valor) || 0;
  const [monto, setMonto] = useState(Math.round(valorBase));
  const [plazo, setPlazo] = useState(90);
  const [tasa, setTasa] = useState(9.5);
 
  const rendimiento = monto * (tasa / 100) * (plazo / 365);
  const total = monto + rendimiento;
 
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(50,62,72,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "2rem",
          width: "100%", maxWidth: 420, position: "relative",
          boxShadow: "0 24px 64px rgba(50,62,72,0.18)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "var(--banorte-background)", border: "none",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--banorte-gray)",
          }}
        >
          <X size={16} />
        </button>
 
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Calculator size={20} color="var(--banorte-red)" />
          <h3 style={{ fontFamily: '"Gotham", sans-serif', fontSize: 18, fontWeight: 700, color: "var(--banorte-dark-gray)", margin: 0 }}>
            Simulador de renovación
          </h3>
        </div>
        <p style={{ fontFamily: '"Roboto", sans-serif', fontSize: 13, color: "var(--banorte-content-2)", marginBottom: 20 }}>
          Simula cuánto ganarías renovando <strong>{inversion.nombre}</strong>
        </p>
 
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: '"Gotham", sans-serif', fontSize: 12, color: "var(--banorte-gray)", display: "block", marginBottom: 6 }}>Monto a invertir</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--banorte-content-3)", fontSize: 14 }}>$</span>
            <input type="number" value={monto} min={1000} step={1000}
              onChange={(e) => setMonto(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 12px 10px 22px", border: "1.5px solid var(--banorte-content-5)", borderRadius: 10, fontFamily: '"Roboto", sans-serif', fontSize: 15, fontWeight: 600, color: "var(--banorte-dark-gray)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
 
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: '"Gotham", sans-serif', fontSize: 12, color: "var(--banorte-gray)", display: "block", marginBottom: 6 }}>
            Plazo: <strong>{plazo} días ({Math.round(plazo / 30)} meses)</strong>
          </label>
          <input type="range" min={28} max={365} step={28} value={plazo}
            onChange={(e) => setPlazo(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--banorte-red)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: '"Roboto", sans-serif', fontSize: 10, color: "var(--banorte-content-3)" }}>
            <span>28d</span><span>365d</span>
          </div>
        </div>
 
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: '"Gotham", sans-serif', fontSize: 12, color: "var(--banorte-gray)", display: "block", marginBottom: 6 }}>
            Tasa anual estimada: <strong>{tasa}%</strong>
          </label>
          <input type="range" min={5} max={15} step={0.5} value={tasa}
            onChange={(e) => setTasa(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#3B5BDB" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: '"Roboto", sans-serif', fontSize: 10, color: "var(--banorte-content-3)" }}>
            <span>5%</span><span>15%</span>
          </div>
        </div>
 
        <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 14, padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: '"Roboto", sans-serif', fontSize: 13, color: "var(--banorte-gray)" }}>Capital inicial</span>
            <span style={{ fontFamily: '"Gotham", sans-serif', fontSize: 13, fontWeight: 600 }}>{fmt(monto)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: '"Roboto", sans-serif', fontSize: 13, color: "var(--banorte-gray)" }}>Rendimiento estimado</span>
            <span style={{ fontFamily: '"Gotham", sans-serif', fontSize: 13, fontWeight: 600, color: "var(--banorte-success)" }}>+{fmt(rendimiento)}</span>
          </div>
          <div style={{ borderTop: "1px solid #fecaca", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: '"Gotham", sans-serif', fontSize: 14, fontWeight: 600, color: "var(--banorte-dark-gray)" }}>Total al vencimiento</span>
            <span style={{ fontFamily: '"Gotham", sans-serif', fontSize: 22, fontWeight: 800, color: "var(--banorte-red)" }}>{fmt(total)}</span>
          </div>
        </div>
 
        <p style={{ fontFamily: '"Roboto", sans-serif', fontSize: 10, color: "var(--banorte-content-3)", marginTop: 12, lineHeight: 1.5 }}>
          * Simulación informativa con tasa referencial. Los rendimientos reales pueden variar según las condiciones vigentes en Banorte.
        </p>
      </div>
    </div>
  );
}
 
// ── Card de inversión a plazo ────────────────────────────────────────────────
function InversionCardPlazo({ inversion, onSimular }) {
  const { nombre, valor, fecha_inicio, fecha_fin, tipo } = inversion;
  const inicio = new Date(fecha_inicio);
  const fin    = new Date(fecha_fin);
  const hoy    = new Date();
 
  const progreso      = Math.max(0, Math.min(100, ((hoy - inicio) / (fin - inicio)) * 100));
  const diasRestantes = Math.max(0, Math.ceil((fin - hoy) / 86400000));
  const valorNum      = parseFloat(valor);
  const vencida       = hoy > fin;
  const porVencer     = !vencida && diasRestantes <= 30;
 
  const plazoAnios     = (fin - inicio) / (365 * 86400000);
  const rendimientoEst = valorNum * 0.095 * plazoAnios;
 
  const estatusColor = vencida ? "#dc2626" : porVencer ? "#d97706" : "#16a34a";
  const estatusBg    = vencida ? "#fee2e2" : porVencer ? "#fef3c7" : "#dcfce7";
  const estatusLabel = vencida ? "VENCIDA"  : porVencer ? "POR VENCER" : "ACTIVA";
  const barColor     = vencida
    ? "var(--banorte-content-4)"
    : porVencer
    ? "linear-gradient(90deg,#f59e0b,#d97706)"
    : "linear-gradient(90deg,#c8102e,var(--banorte-red))";
 
  return (
    <div className="inversion-card" style={porVencer ? { borderColor: "#fde68a", background: "#fffdf5" } : {}}>
      <div className="inversion-card-header">
        <p className="inversion-nombre">{nombre}</p>
        <span className="inversion-estatus" style={{ background: estatusBg, color: estatusColor }}>
          {estatusLabel}
        </span>
      </div>
 
      <p className="inversion-tipo">{tipo}</p>
 
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }}>
        <div>
          <p style={{ fontFamily: '"Roboto", sans-serif', fontSize: 11, color: "var(--banorte-content-2)", margin: "0 0 2px" }}>Capital invertido</p>
          <p className="inversion-monto">{fmt(valorNum)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: '"Roboto", sans-serif', fontSize: 11, color: "var(--banorte-content-2)", margin: "0 0 2px" }}>Rendimiento estimado</p>
          <p style={{ fontFamily: '"Gotham", sans-serif', fontSize: 15, fontWeight: 700, color: "var(--banorte-success)", margin: 0 }}>
            +{fmt(rendimientoEst)}
          </p>
        </div>
      </div>
 
      <div className="inversion-detalles">
        <span><strong>{fmtFecha(fecha_inicio)}</strong><br />Inicio</span>
        <span><strong>{fmtFecha(fecha_fin)}</strong><br />Vencimiento</span>
        <span>
          <strong style={porVencer ? { color: "#d97706" } : {}}>
            {vencida ? "Venció" : `${diasRestantes}d`}
          </strong>
          <br />Restantes
        </span>
      </div>
 
      <div className="inversion-progreso-bar">
        <div className="inversion-progreso-fill" style={{ width: `${progreso.toFixed(1)}%`, background: barColor }} />
      </div>
 
      <button
        onClick={() => onSimular(inversion)}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff5f5"; }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", padding: "9px 0", marginTop: 4,
          background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10,
          fontFamily: '"Gotham", sans-serif', fontSize: 12, fontWeight: 600,
          color: "var(--banorte-red)", cursor: "pointer", transition: "background 0.15s",
        }}
      >
        <Calculator size={13} />
        Simular renovación
      </button>
    </div>
  );
}
 
// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, valor, nota, warn }) {
  return (
    <div style={{
      background: warn ? "#fffbeb" : "var(--banorte-background-3)",
      border: `1px solid ${warn ? "#fde68a" : "var(--banorte-content-5)"}`,
      borderRadius: 16, padding: "1.1rem 1.25rem",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ marginBottom: 2 }}>{icon}</div>
      <p style={{ fontFamily: '"Roboto", sans-serif', fontSize: 11, color: "var(--banorte-content-2)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
        {label}
      </p>
      <p style={{ fontFamily: '"Gotham", sans-serif', fontSize: 22, fontWeight: 700, margin: 0, color: warn ? "#d97706" : "var(--banorte-dark-gray)" }}>
        {valor}
      </p>
      {nota && <p style={{ fontFamily: '"Roboto", sans-serif', fontSize: 10, color: "var(--banorte-content-3)", margin: 0 }}>{nota}</p>}
    </div>
  );
}
 
// ── Panel principal ──────────────────────────────────────────────────────────
export default function InversionesPanel() {
  const [inversiones, setInversiones] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [invSimular, setInvSimular]   = useState(null);
 
  useEffect(() => {
    fetchInversiones()
      .then(setInversiones)
      .catch(() => setError("No se pudieron cargar las inversiones."))
      .finally(() => setLoading(false));
  }, []);
 
  const esFondo = (i) => i.tipo?.toLowerCase() === "fondo de inversión";
  const plazo   = inversiones.filter((i) => !esFondo(i));
  const fondos  = inversiones.filter((i) => esFondo(i));
 
  const hoy         = new Date();
  const en30        = new Date(); en30.setDate(en30.getDate() + 30);
  const activas     = inversiones.filter((i) => new Date(i.fecha_fin) > hoy);
  const porVencer   = activas.filter((i) => new Date(i.fecha_fin) <= en30).length;
  const totalGlobal = inversiones.reduce((s, i) => s + parseFloat(i.valor || 0), 0);
  const rendTotal   = totalGlobal * 0.095 * (180 / 365);
 
  return (
    <section className="inversiones-screen">
      {loading && <p style={{ fontFamily: '"Roboto", sans-serif', color: "var(--banorte-content-2)" }}>Cargando inversiones…</p>}
      {error   && <p style={{ fontFamily: '"Roboto", sans-serif', color: "var(--banorte-red)" }}>{error}</p>}
 
      {!loading && !error && (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
            <KpiCard icon={<PiggyBank size={16} color="var(--banorte-red)" />} label="Total invertido" valor={fmt(totalGlobal)} />
            <KpiCard
              icon={<TrendingUp size={16} color="var(--banorte-success)" />}
              label="Rendim. estimado"
              valor={<span style={{ color: "var(--banorte-success)" }}>+{fmt(rendTotal)}</span>}
              nota="9.5% anual · 180d ref."
            />
            <KpiCard icon={<Clock size={16} color={porVencer > 0 ? "#d97706" : "var(--banorte-content-3)"} />} label="Por vencer (30d)" valor={porVencer} warn={porVencer > 0} />
            <KpiCard icon={<RefreshCw size={16} color="#3B5BDB" />} label="Activas" valor={activas.length} />
          </div>
 
          {/* Inversiones a Plazo */}
          <div className="inversiones-header">
            <div>
              <p className="inversiones-kicker">Banorte</p>
              <h2>Inversiones a Plazo</h2>
            </div>
            {plazo.length > 0 && (
              <div className="inversiones-total">
                <p className="label">Total</p>
                <p className="monto">{fmt(plazo.reduce((s, i) => s + parseFloat(i.valor || 0), 0))}</p>
              </div>
            )}
          </div>
          <div className="inversiones-grid">
            {plazo.length === 0
              ? <p style={{ fontFamily: '"Roboto", sans-serif', color: "var(--banorte-content-3)" }}>No tienes inversiones a plazo activas.</p>
              : plazo.map((inv) => <InversionCardPlazo key={inv["id_inversión"]} inversion={inv} onSimular={setInvSimular} />)
            }
          </div>
 
          {/* Fondos de Inversión */}
          <div className="inversiones-header" style={{ marginTop: "2rem" }}>
            <div>
              <p className="inversiones-kicker">Banorte</p>
              <h2>Fondos de Inversión</h2>
            </div>
            {fondos.length > 0 && (
              <div className="inversiones-total">
                <p className="label">Total</p>
                <p className="monto">{fmt(fondos.reduce((s, i) => s + parseFloat(i.valor || 0), 0))}</p>
              </div>
            )}
          </div>
          <div className="inversiones-grid">
            {fondos.length === 0
              ? <p style={{ fontFamily: '"Roboto", sans-serif', color: "var(--banorte-content-3)" }}>No tienes fondos de inversión activos.</p>
              : fondos.map((f) => <FondoCard key={f["id_inversión"]} fondo={f} isExpandable={fondos.length > 1} />)
            }
          </div>
        </>
      )}
 
      {invSimular && <SimuladorModal inversion={invSimular} onClose={() => setInvSimular(null)} />}
    </section>
  );
}