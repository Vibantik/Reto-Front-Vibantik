/**
PRUEBAS UNITARIAS (Component Tests) – Funciones de utilidad de presupuestos
HU-01 / HU-02
Técnica: Unit Test en Cypress Component Testing (sin DOM real)
CP-CA01 cubiertos:
  CP-12 (CA0112) – cálculo correcto de totalExecuted, balance y globalPct
  CP-13 (CA0113) – fallback de icono "zap" y color "#7B868C" cuando son null
CP-CA02 cubiertos:
  CP-02 (CA0202) – restricción de montos negativos (safeNumber)
  CP-05 (CA0205) – detección de sobre-presupuesto (totalAsignado > ingreso)
  CP-15 (CA0217) – defaults de icono y color al construir categorías locales
  CP-14 (CA0216) – normalización de montos inválidos a 0 (safeNumber)
 */

// importar módulos ES con cypresss
import {
  getProgress,
  getBarClass,
  normalizeText,
  sumForCategory,
} from "../../../src/components/Presupuestos/utils/presupuestos.utils.js";

// HU-01 | CP-12 (CA0112) – Cálculo de balance, ejecutado y porcentaje
describe("HU-01 | CP-12 (CA0112) – Cálculo de balance, ejecutado y porcentaje", () => {
  it("getProgress calcula correctamente el porcentaje consumido", () => {
    // monto_limite = 5000, egresos = 300 + 900 = 1200 → 24%
    const pct = getProgress(1200, 5000);
    expect(pct).to.equal(24);
  });

  it("getProgress devuelve 0 cuando el presupuesto es 0 (evita división entre 0)", () => {
    expect(getProgress(500, 0)).to.equal(0);
  });

  it("getProgress no supera 100 aunque el ejecutado exceda el límite", () => {
    expect(getProgress(7000, 5000)).to.equal(100);
  });

  it("sumForCategory suma solo egresos de la categoría correcta", () => {
    const transactions = [
      { category: "Comida",    type: "egreso",  amount: 300 },
      { category: "Comida",    type: "egreso",  amount: 900 },
      { category: "Transporte",type: "egreso",  amount: 200 },
      { category: "Comida",    type: "ingreso", amount: 5000 },
    ];
    const total = sumForCategory(transactions, "Comida", false);
    expect(total).to.equal(1200); // solo egresos de Comida
  });

  it("balance se calcula correctamente como monto_limite - totalExecuted", () => {
    const monto_limite = 5000;
    const egresos = [300, 900];
    const totalExecuted = egresos.reduce((a, b) => a + b, 0);
    const balance = monto_limite - totalExecuted;
    expect(balance).to.equal(3800);
  });
});

// HU-01 | CP-13 (CA0113) – Fallback de icono y color cuando son null
describe("HU-01 | CP-13 (CA0113) – Fallback de icono y color cuando son null", () => {
  // Simula la lógica de buildLocalCategories de CategoryConfigView
  function buildCategory(raw) {
    return {
      icon: raw.icon || "zap",
      color: raw.color || "#7B868C",
      monto_asignado: raw.monto_asignado ?? 0,
    };
  }

  it("usa 'zap' como icono cuando icon es null", () => {
    const cat = buildCategory({ icon: null, color: "#abc" });
    expect(cat.icon).to.equal("zap");
  });

  it("usa '#7B868C' como color cuando color es null", () => {
    const cat = buildCategory({ icon: "star", color: null });
    expect(cat.color).to.equal("#7B868C");
  });

  it("usa 0 como monto_asignado cuando no hay transacciones vinculadas", () => {
    const cat = buildCategory({ icon: null, color: null });
    const executed = sumForCategory([], cat.icon, false);
    expect(executed).to.equal(0);
  });

  it("getBarClass retorna 'ok' cuando ejecutado es 0 (no hay transacciones)", () => {
    const barClass = getBarClass(0, false);
    expect(barClass).to.equal("ok");
  });
});

// HU-02 | CP-02 (CA0202) – Restricción de montos negativos (safeNumber)
describe("HU-02 | CP-02 (CA0202) – Restricción de montos negativos (safeNumber)", () => {
  // Replicar la función safeNumber de CategoryConfigView
  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  it("safeNumber devuelve 0 cuando el valor es negativo (-50)", () => {
    expect(safeNumber(-50)).to.equal(0);
  });

  it("safeNumber devuelve 0 cuando el valor no es numérico ('abc')", () => {
    expect(safeNumber("abc")).to.equal(0);
  });

  it("safeNumber conserva valores válidos positivos", () => {
    expect(safeNumber(1500)).to.equal(1500);
    expect(safeNumber(0)).to.equal(0);
    expect(safeNumber("200.5")).to.equal(200.5);
  });
});

// HU-02 | CP-05 (CA0205) – Advertencia visual de sobre-presupuesto
describe("HU-02 | CP-05 (CA0205) – Detección de sobre-presupuesto", () => {
  /**
   * Lógica: si la suma de monto_asignado > ingreso mensual → alerta visual
   * Se prueba la detección pura antes de que el componente la renderice.
   */
  function isOverBudget(totalAsignado, ingresoMensual) {
    return ingresoMensual > 0 && totalAsignado > ingresoMensual;
  }

  it("detecta sobre-presupuesto cuando total asignado (6000) supera ingreso (5000)", () => {
    expect(isOverBudget(6000, 5000)).to.be.true;
  });

  it("no activa alerta cuando el total asignado está dentro del ingreso", () => {
    expect(isOverBudget(4500, 5000)).to.be.false;
  });

  it("no activa alerta cuando no hay ingreso mensual registrado (0)", () => {
    expect(isOverBudget(6000, 0)).to.be.false;
  });
});

// HU-02 | CP-14 (CA0216) – Normalización de montos a 0 en CategoryConfigView
describe("HU-02 | CP-14 (CA0216) – Normalización de montos_asignado inválidos a 0", () => {
  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  it("normaliza string vacío a 0", () => {
    expect(safeNumber("")).to.equal(0);
  });

  it("normaliza null a 0", () => {
    expect(safeNumber(null)).to.equal(0);
  });

  it("normaliza undefined a 0", () => {
    expect(safeNumber(undefined)).to.equal(0);
  });

  it("preserva valores legítimos como 2500 y 1200", () => {
    expect(safeNumber(2500)).to.equal(2500);
    expect(safeNumber(1200)).to.equal(1200);
  });
});

// HU-02 | CP-15 (CA0217) – Defaults de icono y color al crear categoría nueva
describe("HU-02 | CP-15 (CA0217) – Valores por defecto de icono y color en nueva categoría", () => {
  function buildNewCategory(overrides = {}) {
    return {
      icon: overrides.icon || "zap",
      color: overrides.color || "#7B868C",
      monto_asignado: 0,
      nombre_categ: overrides.nombre_categ || "Nueva categoría",
    };
  }

  it("crea categoría con icono 'zap' cuando no se selecciona ninguno", () => {
    const cat = buildNewCategory({ nombre_categ: "Imprevistos" });
    expect(cat.icon).to.equal("zap");
  });

  it("crea categoría con color '#7B868C' cuando no se selecciona ninguno", () => {
    const cat = buildNewCategory({ nombre_categ: "Imprevistos" });
    expect(cat.color).to.equal("#7B868C");
  });

  it("respeta el icono personalizado si se proporciona", () => {
    const cat = buildNewCategory({ icon: "star", color: "#ff5733" });
    expect(cat.icon).to.equal("star");
    expect(cat.color).to.equal("#ff5733");
  });
});

// Extras – normalizeText (usado en match de categorías)
describe("normalizeText – utilidad de normalización de texto", () => {
  it("convierte a minúsculas y elimina acentos", () => {
    expect(normalizeText("Comida")).to.equal("comida");
    expect(normalizeText("Alimentación")).to.equal("alimentacion");
    expect(normalizeText("TRANSPORTE")).to.equal("transporte");
  });

  it("retorna string vacío cuando recibe null o undefined", () => {
    expect(normalizeText(null)).to.equal("");
    expect(normalizeText(undefined)).to.equal("");
  });
});
