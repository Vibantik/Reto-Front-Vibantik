// Helper functions de presupuestos

//Formato a MXN
export const fmt = (n) =>
  n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });

//Porcentaje de progreso (0-100) de ejecutado vs presupuesto.
export function getProgress(executed, budget) {
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((executed / budget) * 100));
}

//modifier class para progress bar.
export function getBarClass(progress, isIncome) {
  if (isIncome) return "income";
  if (progress > 90) return "danger";
  if (progress > 75) return "warn";
  return "ok";
}

//Formato (YYYY-MM-DD)
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

//normalizar texto de bd
export function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // quitar acentos
    .trim();
}

// agrupar transacciones por fecha
export function dateKey(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().slice(0, 10);
}

//tratar categoria con base a tipo de transacción
export function isIncomeCategory(cat) {
  return normalizeText(cat.nombre_categ || cat.nombre) === "ingresos";
}

//Sumar transacciones para una categoría usando match de texto normalizado.
export function sumForCategory(transactions, categoryName, income) {
  const type = income ? "ingreso" : "egreso";
  const normCat = normalizeText(categoryName);
  return transactions
    .filter((t) => normalizeText(t.category) === normCat && t.type === type)
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
}
