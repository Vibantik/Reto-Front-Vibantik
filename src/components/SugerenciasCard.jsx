// src/components/SugerenciasCard.jsx
import { useState, useEffect } from "react";
import { Lightbulb, RefreshCw, TrendingUp, AlertCircle, PiggyBank, Sparkles } from "lucide-react";
import { fetchTransactions } from "../services/transactionsService";
import { fetchInversiones }  from "../services/inversionesService";
import AuraWrapped from "./AuraWrapped";
import "./css/sugerencias.css";

const API_URL = "http://localhost:3000";

// ── Sugerencias con Ollama ────────────────────────────────────────────────────
async function generarConIA(r) {
  const prompt = `Eres asesor financiero de Banorte. Da EXACTAMENTE 3 sugerencias accionables. SOLO JSON sin texto extra:
{"sugerencias":[{"titulo":"...","detalle":"...","tipo":"ahorro|inversion|alerta"}]}
Datos: Egresos $${r.totalEgresos.toFixed(0)}, Mayor gasto ${r.categoriaTop} $${r.montoTop.toFixed(0)}, Transacciones ${r.numTransacciones}, Inversiones activas ${r.inversionesActivas}, Por vencer ${r.porVencer}`;

  const res = await fetch(`${API_URL}/api/ia/agentic`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages:[{ role:"user", content:prompt }] }),
  });
  if (!res.ok) throw new Error("IA error");

  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    dec.decode(value, {stream:true}).split("\n").filter(Boolean).forEach(l => {
      try { const j=JSON.parse(l); if(j.message?.content) acc+=j.message.content; } catch{}
    });
  }
  const m = acc.match(/\{[\s\S]*?\}/);
  if (!m) throw new Error("no json");
  return JSON.parse(m[0]).sugerencias ?? [];
}

// ── Sugerencias por reglas (sin IA) ──────────────────────────────────────────
function reglas(r) {
  const items = [];
  if (r.totalEgresos > 0 && r.categoriaTop !== "Sin datos") {
    const pct = Math.round((r.montoTop / r.totalEgresos) * 100);
    items.push({
      titulo: `${pct}% de tus gastos en ${r.categoriaTop}`,
      detalle: `Llevas $${r.montoTop.toLocaleString("es-MX")} en ${r.categoriaTop} este mes. Considera establecer un presupuesto.`,
      tipo: pct > 40 ? "alerta" : "ahorro",
    });
  }
  if (r.porVencer > 0) {
    items.push({ titulo:`${r.porVencer} inversión${r.porVencer>1?"es":""} por vencer`, detalle:"Vencen en los próximos 30 días. Evalúa renovarlas o redirigir el capital.", tipo:"inversion" });
  } else if (r.inversionesActivas === 0) {
    items.push({ titulo:"Sin inversiones activas", detalle:"Considera abrir un plazo fijo o fondo de inversión con Banorte.", tipo:"inversion" });
  }
  const ratio = r.totalInvertido / (r.totalEgresos || 1);
  items.push(ratio < 0.5
    ? { titulo:"Aumenta tu capital invertido", detalle:`Tu ahorro invertido es el ${Math.round(ratio*100)}% de tus gastos mensuales. Invierte más para hacer crecer tu patrimonio.`, tipo:"ahorro" }
    : { titulo:"Buen nivel de inversión", detalle:"Tu capital está bien equilibrado. Considera diversificar en fondos de distintos plazos.", tipo:"inversion" }
  );
  return items.slice(0, 3);
}

// ── Config visual por tipo ────────────────────────────────────────────────────
const TIPO = {
  ahorro:    { color:"#6CC04A", bg:"#f0faf0", Icon:PiggyBank },
  inversion: { color:"#3B5BDB", bg:"#eef2ff", Icon:TrendingUp },
  alerta:    { color:"#EB0029", bg:"#fff5f5", Icon:AlertCircle },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SugerenciasCard() {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [iaActiva,    setIaActiva]    = useState(false);
  const [errorIA,     setErrorIA]     = useState(false);
  const [resumen,     setResumen]     = useState(null);
  const [wrapped,     setWrapped]     = useState(false);

  // Carga inicial con reglas
  useEffect(() => {
    const ahora = new Date();
    const mes   = String(ahora.getMonth()+1).padStart(2,"0");
    const ini   = `${ahora.getFullYear()}-${mes}-01`;
    const hoy   = ahora.toISOString().slice(0,10);

    Promise.all([
      fetchTransactions({ page:1, limit:200, type:"egreso", startDate:ini, endDate:hoy }),
      fetchInversiones().catch(() => []),
    ]).then(([txRes, inv]) => {
      const txs  = txRes.data ?? [];
      const porCat = {};
      txs.forEach(t => { porCat[t.category||"Otros"] = (porCat[t.category||"Otros"]||0) + parseFloat(t.amount||0); });
      const top  = Object.entries(porCat).sort((a,b)=>b[1]-a[1])[0] ?? ["Sin datos",0];
      const hoyD = new Date();
      const en30 = new Date(); en30.setDate(en30.getDate()+30);
      const act  = inv.filter(i => new Date(i.fecha_fin) > hoyD);
      const r = {
        totalEgresos: Object.values(porCat).reduce((s,v)=>s+v,0),
        categoriaTop: top[0], montoTop: top[1],
        numTransacciones: txs.length,
        inversionesActivas: act.length,
        totalInvertido: act.reduce((s,i)=>s+parseFloat(i.valor||0),0),
        porVencer: act.filter(i=>new Date(i.fecha_fin)<=en30).length,
      };
      setResumen(r);
      setSugerencias(reglas(r));
    }).catch(() => setSugerencias([])).finally(() => setLoading(false));
  }, []);

  const handleIA = async () => {
    if (!resumen || loading) return;
    setLoading(true); setErrorIA(false);
    try {
      const s = await generarConIA(resumen);
      setSugerencias(s); setIaActiva(true);
    } catch { setErrorIA(true); }
    finally  { setLoading(false); }
  };

  const mesLabel = new Date().toLocaleDateString("es-MX", { month:"long" });

  return (
    <>
      <div className="card sugerencias-card">

        {/* Header */}
        <div className="sugerencias-header">
          <div className="sugerencias-titulo-wrap">
            <Lightbulb size={18} color="var(--banorte-red)"/>
            <h2 className="sugerencias-titulo">Sugerencias</h2>
          </div>
          <div className="sugerencias-meta-wrap">
            {iaActiva  && <span className="sugerencias-badge">Con IA</span>}
            {errorIA   && <span className="sugerencias-badge sugerencias-badge--error">Ollama no disponible</span>}
            <button
              className={`sugerencias-ia-btn ${loading?"sugerencias-ia-btn--loading":""}`}
              onClick={handleIA}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading?"spin":""}/>
              {loading ? "Analizando…" : "Con IA"}
            </button>
          </div>
        </div>

        <p className="sugerencias-subtitulo">
          {iaActiva ? "Basadas en tus datos · analizadas por Aura" : "Basadas en tus movimientos de este mes"}
        </p>

        {/* Lista */}
        <div className="sugerencias-lista">
          {loading && !sugerencias.length
            ? [1,2,3].map(i => <div key={i} className="sugerencias-skeleton"/>)
            : sugerencias.map((s,i) => {
                const cfg = TIPO[s.tipo] ?? TIPO.ahorro;
                const { Icon } = cfg;
                return (
                  <div key={i} className="sugerencia-item" style={{ background:cfg.bg, borderColor:cfg.color+"30" }}>
                    <Icon size={14} color={cfg.color} style={{ flexShrink:0, marginTop:2 }}/>
                    <div>
                      <p className="sugerencia-titulo" style={{ color:cfg.color }}>{s.titulo}</p>
                      <p className="sugerencia-detalle">{s.detalle}</p>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Botón Aura Wrapped */}
        <button
          onClick={() => setWrapped(true)}
          style={{
            marginTop:"1rem", width:"100%", padding:"11px 16px",
            background:"#323E48", border:"1px solid #4A5568",
            borderRadius:12, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            fontFamily:'"Gotham",sans-serif', fontSize:12, fontWeight:600, color:"#fff",
            transition:"background 0.18s, border-color 0.18s, transform 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background="#EB0029"; e.currentTarget.style.borderColor="#EB0029"; e.currentTarget.style.transform="translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#323E48"; e.currentTarget.style.borderColor="#4A5568"; e.currentTarget.style.transform="translateY(0)"; }}
        >
          <Sparkles size={14} color="rgba(255,255,255,0.75)"/>
          Resumen de {mesLabel} con Aura
        </button>
      </div>

      {wrapped && <AuraWrapped onClose={() => setWrapped(false)}/>}
    </>
  );
}