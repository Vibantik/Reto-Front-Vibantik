// src/components/SugerenciasCard.jsx
import { useState, useEffect } from "react";
import { Lightbulb, RefreshCw, TrendingUp, AlertCircle, PiggyBank } from "lucide-react";
import { fetchTransactions } from "../services/transactionsService";
import { fetchInversiones } from "../services/inversionesService";
import "./css/sugerencias.css";
 
const API_URL = "http://localhost:3000";
 
async function generarConIA(resumen) {
  const prompt = `Eres un asesor financiero de Banorte. Analiza este resumen y da EXACTAMENTE 3 sugerencias cortas y accionables. Responde SOLO con JSON válido sin texto extra. Formato exacto: {"sugerencias":[{"titulo":"...","detalle":"...","tipo":"ahorro|inversion|alerta"}]}
 
Datos del usuario:
- Egresos del mes: $${resumen.totalEgresos.toFixed(0)} MXN
- Mayor gasto en: ${resumen.categoriaTop} ($${resumen.montoTop.toFixed(0)})
- Transacciones este mes: ${resumen.numTransacciones}
- Inversiones activas: ${resumen.inversionesActivas} (total: $${resumen.totalInvertido.toFixed(0)} MXN)
- Inversiones por vencer en 30 días: ${resumen.porVencer}`;
 
  const res = await fetch(`${API_URL}/api/ia/agentic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });
 
  if (!res.ok) throw new Error("Error IA");
 
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
 
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) accumulated += json.message.content;
      } catch { /* skip */ }
    }
  }
 
  const match = accumulated.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Sin JSON en respuesta");
  return JSON.parse(match[0]).sugerencias ?? [];
}
 
function sugerenciasDeReglas(resumen) {
  const items = [];
 
  if (resumen.totalEgresos > 0 && resumen.categoriaTop !== "Sin datos") {
    const pct = Math.round((resumen.montoTop / resumen.totalEgresos) * 100);
    items.push({
      titulo: `${pct}% de tus gastos en ${resumen.categoriaTop}`,
      detalle: `Llevas $${resumen.montoTop.toLocaleString("es-MX")} en ${resumen.categoriaTop} este mes. Establece un presupuesto para esta categoría.`,
      tipo: pct > 40 ? "alerta" : "ahorro",
    });
  }
 
  if (resumen.porVencer > 0) {
    items.push({
      titulo: `${resumen.porVencer} inversión${resumen.porVencer > 1 ? "es" : ""} por vencer`,
      detalle: "Tienes inversiones que vencen en los próximos 30 días. Evalúa si renovarlas o redirigir el capital.",
      tipo: "inversion",
    });
  } else if (resumen.inversionesActivas === 0) {
    items.push({
      titulo: "Sin inversiones activas",
      detalle: "No tienes inversiones activas en este momento. Considera abrir un plazo fijo o fondo de inversión.",
      tipo: "inversion",
    });
  }
 
  const ratio = resumen.totalInvertido / (resumen.totalEgresos || 1);
  if (ratio < 0.5) {
    items.push({
      titulo: "Aumenta tu capital invertido",
      detalle: `Tu ahorro invertido representa solo el ${Math.round(ratio * 100)}% de tus gastos mensuales. Invertir más hace crecer tu patrimonio.`,
      tipo: "ahorro",
    });
  } else {
    items.push({
      titulo: "Buen nivel de inversión",
      detalle: "Tu capital invertido está bien equilibrado. Considera diversificar en fondos de distintos plazos.",
      tipo: "inversion",
    });
  }
 
  return items.slice(0, 3);
}
 
const TIPO = {
  ahorro:    { color: "var(--banorte-success)", bg: "#f0faf0", Icon: PiggyBank },
  inversion: { color: "#3B5BDB",                bg: "#eef2ff", Icon: TrendingUp },
  alerta:    { color: "var(--banorte-red)",      bg: "#fff5f5", Icon: AlertCircle },
};
 
export default function SugerenciasCard() {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iaActiva, setIaActiva] = useState(false);
  const [errorIA, setErrorIA] = useState(false);
  const [resumen, setResumen] = useState(null);
 
  const cargarResumen = async () => {
    const ahora = new Date();
    const primerDia = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;
    const hoyStr = ahora.toISOString().slice(0, 10);
 
    const [txResult, inversiones] = await Promise.all([
      fetchTransactions({ page: 1, limit: 200, type: "egreso", startDate: primerDia, endDate: hoyStr }),
      fetchInversiones().catch(() => []),
    ]);
 
    const txs = txResult.data ?? [];
    const porCat = {};
    txs.forEach((t) => { porCat[t.category || "Otros"] = (porCat[t.category || "Otros"] || 0) + parseFloat(t.amount || 0); });
    const top = Object.entries(porCat).sort((a, b) => b[1] - a[1])[0] ?? ["Sin datos", 0];
 
    const hoy = new Date();
    const en30 = new Date(); en30.setDate(en30.getDate() + 30);
    const activas = inversiones.filter((i) => new Date(i.fecha_fin) > hoy);
 
    return {
      totalEgresos: Object.values(porCat).reduce((s, v) => s + v, 0),
      categoriaTop: top[0],
      montoTop: top[1],
      numTransacciones: txs.length,
      inversionesActivas: activas.length,
      totalInvertido: activas.reduce((s, i) => s + parseFloat(i.valor || 0), 0),
      porVencer: activas.filter((i) => new Date(i.fecha_fin) <= en30).length,
    };
  };
 
  // Carga inicial: reglas (rápido, sin IA)
  useEffect(() => {
    cargarResumen()
      .then((r) => { setResumen(r); setSugerencias(sugerenciasDeReglas(r)); })
      .catch(() => setSugerencias([]))
      .finally(() => setLoading(false));
  }, []);
 
  // Botón "Generar con IA"
  const handleIA = async () => {
    if (!resumen || loading) return;
    setLoading(true);
    setErrorIA(false);
    try {
      const result = await generarConIA(resumen);
      setSugerencias(result);
      setIaActiva(true);
    } catch {
      setErrorIA(true);
      // Mantiene las sugerencias de reglas que ya están
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="card sugerencias-card">
      <div className="sugerencias-header">
        <div className="sugerencias-titulo-wrap">
          <Lightbulb size={18} color="var(--banorte-red)" />
          <h2 className="sugerencias-titulo">Sugerencias</h2>
        </div>
        <div className="sugerencias-meta-wrap">
          {iaActiva && <span className="sugerencias-badge">Generadas con IA</span>}
          {errorIA && <span className="sugerencias-badge sugerencias-badge--error">Ollama no disponible</span>}
          <button
            className={`sugerencias-ia-btn ${loading ? "sugerencias-ia-btn--loading" : ""}`}
            onClick={handleIA}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            {loading ? "Analizando…" : "Generar con IA"}
          </button>
        </div>
      </div>
 
      <p className="sugerencias-subtitulo">
        {iaActiva ? "Basadas en tus datos · analizadas por Aura" : "Basadas en tus movimientos reales de este mes"}
      </p>
 
      <div className="sugerencias-lista">
        {loading && !sugerencias.length
          ? [1, 2, 3].map((i) => <div key={i} className="sugerencias-skeleton" />)
          : sugerencias.map((s, i) => {
              const cfg = TIPO[s.tipo] ?? TIPO.ahorro;
              const { Icon } = cfg;
              return (
                <div
                  key={i}
                  className="sugerencia-item"
                  style={{ background: cfg.bg, borderColor: cfg.color + "33" }}
                >
                  <Icon size={15} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="sugerencia-titulo" style={{ color: cfg.color }}>{s.titulo}</p>
                    <p className="sugerencia-detalle">{s.detalle}</p>
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
 