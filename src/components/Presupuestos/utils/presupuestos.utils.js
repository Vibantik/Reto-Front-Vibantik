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

//Formato fecha (YYYY-MM-DD) 
export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

//tratar categoria con base a nombre
export function isIncomeCategory(cat) {
  return cat.nombre === "ingreso";
}

//Sumar transacciones para una categoria en una dirección (egreso | ingreso).
export function sumForCategory(transactions, categoryId, income) {
  const type = income ? "ingreso" : "egreso";
  return transactions
    .filter((t) => t.categoryId === categoryId && t.type === type)
    .reduce((acc, t) => acc + t.amount, 0);
}
