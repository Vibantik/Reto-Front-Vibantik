const DEFAULT_COLOR = "#9ca3af";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function normalizeBudgetKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function pickActivePresupuesto(presupuestos = [], now = new Date()) {
  if (!Array.isArray(presupuestos) || presupuestos.length === 0) return null;

  const activos = presupuestos.filter((p) => {
    const ini = new Date(p.inicio);
    const fin = p.fin ? new Date(p.fin) : null;
    return ini <= now && (!fin || fin >= now);
  });

  const source = activos.length > 0 ? activos : presupuestos;
  return [...source].sort((a, b) => new Date(b.inicio) - new Date(a.inicio))[0];
}

export function buildCategoryMeta(categorias = [], presupuestoCats = []) {
  const metaByKey = new Map();

  (categorias || []).forEach((c) => {
    const key = normalizeBudgetKey(c?.nombre_categ);
    if (!key) return;
    metaByKey.set(key, {
      name: c.nombre_categ || "",
      color: c.color || DEFAULT_COLOR,
      presupuesto: 0,
    });
  });

  (presupuestoCats || []).forEach((c) => {
    const key = normalizeBudgetKey(c?.nombre_categ);
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
}

export function buildBudgetOverview(presupuestoDetalle = null) {
  const totalBudget = Number(presupuestoDetalle?.monto_limite || 0);
  const totalExecuted = (presupuestoDetalle?.transacciones || [])
    .filter((t) => t.type === "egreso")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalIncome = (presupuestoDetalle?.transacciones || [])
    .filter((t) => t.type === "ingreso")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance = totalBudget - totalExecuted;
  const globalPct = totalBudget > 0
    ? Math.min(100, Math.round((totalExecuted / totalBudget) * 100))
    : 0;

  return {
    totalBudget,
    totalExecuted,
    totalIncome,
    balance,
    globalPct,
  };
}

export function buildOverspendAlert(transactions = [], totalBudget = 0, now = new Date()) {
  if (!totalBudget || !Array.isArray(transactions) || transactions.length === 0) return null;

  const recentLimit = new Date(now);
  recentLimit.setHours(0, 0, 0, 0);
  recentLimit.setDate(recentLimit.getDate() - 4);

  const recentSpend = transactions
    .filter((t) => t.type === "egreso" && new Date(t.date) >= recentLimit)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  if (recentSpend / totalBudget < 0.8) return null;

  return {
    recentSpend,
    pct: Math.round((recentSpend / totalBudget) * 100),
    message: "La tendencia de los ultimos 5 dias indica posible exceso de presupuesto.",
  };
}

export function buildSevenDayStreak(transactions = [], totalBudget = 0, now = new Date()) {
  if (!totalBudget || !Array.isArray(transactions) || transactions.length === 0) return null;

  const budgetDays = Math.max(1, getBudgetDaysInMonth(now));
  const dailyLimit = totalBudget / budgetDays;
  const dailySpend = new Map();

  transactions
    .filter((t) => t.type === "egreso")
    .forEach((t) => {
      const key = toDayKey(t.date);
      dailySpend.set(key, (dailySpend.get(key) || 0) + Number(t.amount || 0));
    });

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const spent = dailySpend.get(toDayKey(day)) || 0;
    if (spent > dailyLimit) return null;
  }

  return {
    days: 7,
    dailyLimit,
    message: "Llevas 7 dias consecutivos manteniendo tus gastos bajo control.",
  };
}

export function buildRedistributionSuggestion({
  totalIncome = 0,
  totalBudget = 0,
  previousIncome = 0,
} = {}) {
  const baseline = previousIncome > 0 ? previousIncome : totalBudget;
  if (!baseline || totalIncome < baseline * 1.2) return null;

  const extra = totalIncome - baseline;
  return {
    extra,
    baseline,
    title: "Redistribuye tu ingreso extra",
    detail: `Tus ingresos subieron ${Math.round((totalIncome / baseline - 1) * 100)}%. Considera mover parte del excedente a ahorro, inversion o fondo de emergencia.`,
    tipo: "ahorro",
  };
}

export function getBudgetHistory(presupuestos = [], selectedPresId = null, now = new Date()) {
  return (presupuestos || [])
    .filter((p) => p.id_presupuesto !== selectedPresId)
    .filter((p) => {
      if (!p.fin) return false;
      return new Date(p.fin) < now;
    })
    .sort((a, b) => new Date(b.fin) - new Date(a.fin))
    .slice(0, 3);
}

function getBudgetDaysInMonth(dateLike) {
  const date = new Date(dateLike);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function toDayKey(dateLike) {
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function diffInDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end - start) / MS_PER_DAY);
}
