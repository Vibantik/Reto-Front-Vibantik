import { useCallback, useEffect, useState } from "react";
import {
  Lightbulb,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { fetchTransactions } from "../services/transactionsService";
import { fetchInversiones } from "../services/inversionesService";
import {
  fetchPresupuesto,
  fetchPresupuestos,
} from "../services/presupuestosService";
import { subscribeToTransactionStream } from "../services/transactionsStream";
import { getUserUuid } from "../utils/userUuid";
import {
  buildBudgetOverview,
  buildRedistributionSuggestion,
  pickActivePresupuesto,
} from "../utils/budgetInsights";
import AuraWrapped from "./AuraWrapped";
import "./css/Sugerencias.css";

const API_URL = import.meta.env.VITE_API_URL;

async function generarConIA(resumen) {
  const prompt = `Eres un asesor financiero de Banorte. Analiza este resumen y da EXACTAMENTE 3 sugerencias cortas y accionables. Responde SOLO con JSON valido sin texto extra. Formato exacto: {"sugerencias":[{"titulo":"...","detalle":"...","tipo":"ahorro|inversion|alerta"}]}

Datos del usuario:
- Egresos del mes: $${resumen.totalEgresos.toFixed(0)} MXN
- Ingresos del mes: $${resumen.totalIngresos.toFixed(0)} MXN
- Mayor gasto en: ${resumen.categoriaTop} ($${resumen.montoTop.toFixed(0)})
- Presupuesto activo: ${resumen.presupuestoNombre || "Sin presupuesto"} ($${resumen.totalBudget.toFixed(0)} MXN)
- Transacciones este mes: ${resumen.numTransacciones}
- Inversiones activas: ${resumen.inversionesActivas} (total: $${resumen.totalInvertido.toFixed(0)} MXN)
- Inversiones por vencer en 30 dias: ${resumen.porVencer}`;

  const res = await fetch(`${API_URL}/api/ia/agentic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok || !res.body) throw new Error("IA error");

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    dec.decode(value, { stream: true })
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) acc += json.message.content;
        } catch {
          // Ignore stream chunks that are not valid JSON.
        }
      });
  }

  const start = acc.indexOf("{");
  const end = acc.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no json");
  return JSON.parse(acc.slice(start, end + 1)).sugerencias ?? [];
}

function reglas(resumen) {
  const items = [];
  const redistribution = buildRedistributionSuggestion({
    totalIncome: resumen.totalIngresos,
    totalBudget: resumen.totalBudget,
    previousIncome: resumen.previousIncome,
  });

  if (redistribution) {
    items.push({
      titulo: redistribution.title,
      detalle: redistribution.detail,
      tipo: redistribution.tipo,
    });
  }

  if (resumen.streak7Days) {
    items.push({
      titulo: "¡Felicidades por tu racha!",
      detalle: "Llevas 7 días consecutivos manteniendo tus gastos por debajo del límite diario. ¡Sigue así!",
      tipo: "ahorro",
    });
  }

  if (resumen.totalBudget > 0 && resumen.totalEgresos >= resumen.totalBudget * 0.8) {
    items.push({
      titulo: "Posible exceso de presupuesto",
      detalle: "Tus egresos ya consumen mas del 80% del presupuesto activo. Revisa ajustes antes de cerrar el mes.",
      tipo: "alerta",
    });
  }

  if (resumen.totalEgresos > 0 && resumen.categoriaTop !== "Sin datos") {
    const pct = Math.round((resumen.montoTop / resumen.totalEgresos) * 100);
    items.push({
      titulo: `${pct}% de tus gastos en ${resumen.categoriaTop}`,
      detalle: `Llevas $${resumen.montoTop.toLocaleString("es-MX")} en ${resumen.categoriaTop} este mes. Considera establecer un presupuesto especifico para esa categoria.`,
      tipo: pct > 40 ? "alerta" : "ahorro",
    });
  }

  if (resumen.porVencer > 0) {
    items.push({
      titulo: `${resumen.porVencer} inversion${resumen.porVencer > 1 ? "es" : ""} por vencer`,
      detalle: "Vencen en los proximos 30 dias. Evalua renovarlas o redirigir el capital.",
      tipo: "inversion",
    });
  } else if (resumen.inversionesActivas === 0) {
    items.push({
      titulo: "Sin inversiones activas",
      detalle: "Considera abrir un plazo fijo o fondo de inversion con Banorte.",
      tipo: "inversion",
    });
  }

  const ratio = resumen.totalInvertido / (resumen.totalEgresos || 1);
  items.push(
    ratio < 0.5
      ? {
          titulo: "Aumenta tu capital invertido",
          detalle: `Tu ahorro invertido es el ${Math.round(ratio * 100)}% de tus gastos mensuales. Invierte mas para hacer crecer tu patrimonio.`,
          tipo: "ahorro",
        }
      : {
          titulo: "Buen nivel de inversion",
          detalle: "Tu capital esta bien equilibrado. Considera diversificar en fondos de distintos plazos.",
          tipo: "inversion",
        }
  );

  while (items.length < 3) {
    items.push({
      titulo: "Mantente constante",
      detalle: "Sigue revisando tus movimientos y el presupuesto activo para detectar desbalances a tiempo.",
      tipo: "ahorro",
    });
  }

  return items.slice(0, 3);
}

function mergeWithFallback(aiSuggestions = [], fallbackSuggestions = []) {
  const normalizedAI = (aiSuggestions || [])
    .filter((item) => item?.titulo && item?.detalle)
    .map((item) => ({
      titulo: item.titulo,
      detalle: item.detalle,
      tipo: item.tipo || "ahorro",
    }));

  const merged = [...normalizedAI];
  for (const fallback of fallbackSuggestions) {
    if (merged.length >= 3) break;
    merged.push(fallback);
  }

  return merged.slice(0, 3);
}

const TIPO = {
  ahorro: { color: "#6CC04A", bg: "#f0faf0", Icon: PiggyBank },
  inversion: { color: "#3B5BDB", bg: "#eef2ff", Icon: TrendingUp },
  alerta: { color: "#EB0029", bg: "#fff5f5", Icon: AlertCircle },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SugerenciasCard({ uuid }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [fallbackSuggestions, setFallbackSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iaActiva, setIaActiva] = useState(false);
  const [errorIA, setErrorIA] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [wrapped, setWrapped] = useState(false);

  const loadBaseSuggestions = useCallback(async () => {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const ini = `${ahora.getFullYear()}-${mes}-01`;
    const hoy = ahora.toISOString().slice(0, 10);

    setLoading(true);
    try {
      const [txRes, inv, presupuestos] = await Promise.all([
        fetchTransactions({ page: 1, limit: 400, startDate: ini, endDate: hoy }),
        fetchInversiones(uuid).catch(() => []),
        fetchPresupuestos(uuid).catch(() => []),
      ]);

      const activo = pickActivePresupuesto(presupuestos, ahora);
      const historial = (presupuestos || [])
        .filter((p) => p.id_presupuesto !== activo?.id_presupuesto)
        .sort((a, b) => new Date(b.inicio) - new Date(a.inicio));

      const [activoDetalle, previoDetalle] = await Promise.all([
        activo?.id_presupuesto ? fetchPresupuesto(activo.id_presupuesto).catch(() => null) : Promise.resolve(null),
        historial[0]?.id_presupuesto ? fetchPresupuesto(historial[0].id_presupuesto).catch(() => null) : Promise.resolve(null),
      ]);

      const txs = txRes.data ?? [];
      const egresos = txs.filter((t) => t.type !== "ingreso");
      const ingresos = txs.filter((t) => t.type === "ingreso");
      const porCat = {};
      egresos.forEach((t) => {
        const key = t.category || "Otros";
        porCat[key] = (porCat[key] || 0) + parseFloat(t.amount || 0);
      });

      const top = Object.entries(porCat).sort((a, b) => b[1] - a[1])[0] ?? ["Sin datos", 0];
      const hoyD = new Date();
      const en30 = new Date();
      en30.setDate(en30.getDate() + 30);
      const activas = inv.filter((item) => new Date(item.fecha_fin) > hoyD);
      const overview = buildBudgetOverview(activoDetalle);
      const previousIncome = buildBudgetOverview(previoDetalle).totalIncome;

      const nextResumen = {
        totalEgresos: egresos.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        totalIngresos: ingresos.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        categoriaTop: top[0],
        montoTop: top[1],
        numTransacciones: txs.length,
        inversionesActivas: activas.length,
        totalInvertido: activas.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0),
        porVencer: activas.filter((item) => new Date(item.fecha_fin) <= en30).length,
        totalBudget: overview.totalBudget,
        previousIncome,
        presupuestoNombre: activo?.nombre || "Sin presupuesto",
        streak7Days: false,
      };

      if (overview.totalBudget > 0) {
        const dailyLimit = overview.totalBudget / 30; // calculo de uso diario permitido
        let streak = true;
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const dailyTx = egresos.filter(t => t.date && t.date.slice(0,10) === dateStr);
          const sum = dailyTx.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
          if (sum >= dailyLimit) {
            streak = false;
            break;
          }
        }
        nextResumen.streak7Days = streak;
      }

      const rulesSuggestions = reglas(nextResumen);
      setResumen(nextResumen);
      setFallbackSuggestions(rulesSuggestions);
      if (!iaActiva) {
        setSugerencias(rulesSuggestions);
      }
    } catch (error) {
      console.error("Error loading dashboard suggestions:", error);
      setSugerencias([]);
      setFallbackSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [iaActiva, uuid]);

  useEffect(() => {
    loadBaseSuggestions();
    const unsubscribe = subscribeToTransactionStream(() => {
      loadBaseSuggestions();
    });
    return unsubscribe;
  }, [loadBaseSuggestions]);

  const handleIA = async () => {
    if (!resumen || loading) return;
    setLoading(true);
    setErrorIA(false);

    try {
      const aiSuggestions = await generarConIA(resumen);
      setSugerencias(mergeWithFallback(aiSuggestions, fallbackSuggestions));
      setIaActiva(true);
    } catch (error) {
      console.error("Error generating IA suggestions:", error);
      setErrorIA(true);
      setIaActiva(false);
      setSugerencias(fallbackSuggestions);
    } finally {
      setLoading(false);
    }
  };

  const mesLabel = new Date().toLocaleDateString("es-MX", { month: "long" });

  return (
    <>
      <div className="card sugerencias-card">
        <div className="sugerencias-header">
          <div className="sugerencias-titulo-wrap">
            <Lightbulb size={18} color="var(--banorte-red)" />
            <h2 className="sugerencias-titulo">Sugerencias</h2>
          </div>
          <div className="sugerencias-meta-wrap">
            {iaActiva && <span className="sugerencias-badge">Generadas con IA</span>}
            {errorIA && <span className="sugerencias-badge sugerencias-badge--error">IA no disponible</span>}
            <button
              className={`sugerencias-ia-btn ${loading ? "sugerencias-ia-btn--loading" : ""}`}
              onClick={handleIA}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              {loading ? "Analizando..." : "Generar con IA"}
            </button>
          </div>
        </div>

        <p className="sugerencias-subtitulo">
          {iaActiva
            ? "Basadas en tus datos y analizadas por Aura"
            : "Basadas en tus movimientos del mes, presupuesto activo e inversiones"}
        </p>

        <div className="sugerencias-lista">
          {loading && !sugerencias.length
            ? [1, 2, 3].map((i) => <div key={i} className="sugerencias-skeleton" />)
            : sugerencias.map((suggestion, index) => {
                const cfg = TIPO[suggestion.tipo] ?? TIPO.ahorro;
                const { Icon } = cfg;
                return (
                  <div
                    key={`${suggestion.titulo}-${index}`}
                    className="sugerencia-item"
                    style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}
                  >
                    <Icon size={14} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="sugerencia-titulo" style={{ color: cfg.color }}>
                        {suggestion.titulo}
                      </p>
                      <p className="sugerencia-detalle">{suggestion.detalle}</p>
                    </div>
                  </div>
                );
              })}
        </div>

        <button
          onClick={() => setWrapped(true)}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "11px 16px",
            background: "#323E48",
            border: "1px solid #4A5568",
            borderRadius: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: '"Gotham",sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            transition: "background 0.18s, border-color 0.18s, transform 0.15s",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "#EB0029";
            event.currentTarget.style.borderColor = "#EB0029";
            event.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "#323E48";
            event.currentTarget.style.borderColor = "#4A5568";
            event.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Sparkles size={14} color="rgba(255,255,255,0.75)" />
          Resumen de {mesLabel} con Aura
        </button>
      </div>

      {wrapped && <AuraWrapped uuid={uuid} onClose={() => setWrapped(false)}/>}
    </>
  );
}
