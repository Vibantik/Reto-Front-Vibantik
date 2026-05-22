/* global describe, it, expect */

import {
  buildBudgetOverview,
  buildOverspendAlert,
  buildSevenDayStreak,
  buildRedistributionSuggestion,
  getBudgetHistory,
} from "../../src/utils/budgetInsights.js";

describe("budgetInsights", () => {
  it("calcula el resumen del presupuesto activo", () => {
    const overview = buildBudgetOverview({
      monto_limite: 5000,
      transacciones: [
        { type: "egreso", amount: 300 },
        { type: "egreso", amount: 900 },
        { type: "ingreso", amount: 6000 },
      ],
    });

    expect(overview.totalExecuted).to.equal(1200);
    expect(overview.balance).to.equal(3800);
    expect(overview.globalPct).to.equal(24);
    expect(overview.totalIncome).to.equal(6000);
  });

  it("detecta alerta preventiva cuando el gasto de 5 dias supera 80%", () => {
    const now = new Date("2026-05-18T12:00:00");
    const alert = buildOverspendAlert(
      [
        { type: "egreso", amount: 2500, date: "2026-05-18" },
        { type: "egreso", amount: 1800, date: "2026-05-16" },
      ],
      5000,
      now
    );

    expect(alert).to.not.equal(null);
    expect(alert.pct).to.equal(86);
  });

  it("reconoce una racha de 7 dias bajo el limite diario", () => {
    const now = new Date("2026-05-18T12:00:00");
    const transactions = Array.from({ length: 7 }, (_, index) => ({
      type: "egreso",
      amount: 100,
      date: `2026-05-${String(18 - index).padStart(2, "0")}`,
    }));

    const streak = buildSevenDayStreak(transactions, 5000, now);
    expect(streak).to.not.equal(null);
    expect(streak.days).to.equal(7);
  });

  it("genera sugerencia de redistribucion cuando el ingreso sube 20%", () => {
    const suggestion = buildRedistributionSuggestion({
      totalIncome: 7200,
      previousIncome: 6000,
      totalBudget: 5000,
    });

    expect(suggestion).to.not.equal(null);
    expect(suggestion.title).to.contain("Redistribuye");
  });

  it("lista presupuestos historicos excluyendo el presupuesto activo", () => {
    const history = getBudgetHistory(
      [
        { id_presupuesto: 1, nombre: "Mayo", monto_limite: 5000, inicio: "2026-05-01", fin: "2026-05-31" },
        { id_presupuesto: 2, nombre: "Abril", monto_limite: 4800, inicio: "2026-04-01", fin: "2026-04-30" },
        { id_presupuesto: 3, nombre: "Marzo", monto_limite: 4500, inicio: "2026-03-01", fin: "2026-03-31" },
      ],
      1,
      new Date("2026-05-18T12:00:00")
    );

    expect(history).to.have.length(2);
    expect(history[0].nombre).to.equal("Abril");
  });
});
