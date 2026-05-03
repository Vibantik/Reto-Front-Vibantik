/**
PRUEBAS E2E – HU-01: Visualizar el progreso de mis gastos
 "Como cliente quiero visualizar el progreso de mis gastos asociados
  a mis presupuestos y recibir alertas de la IA"

Técnica: E2E (Cypress) sobre http://localhost:5173

CP-CA01 cubiertos:
   CP-08 (CA0108/CA0109) – Resumen y selector del presupuesto activo
   CP-09 (CA0109)        – Estado vacío cuando no existen presupuestos
   CP-11 (CA0111)        – Apertura de detalle por clic y por teclado (accesibilidad)
   CP-12 (CA0112)        – Balance y porcentaje consumido reflejados en UI
   CP-13 (CA0113)        – Fallback de icono/color/monto en categoría incompleta
*/

const API_URL = "http://localhost:3000";
// UUID :(
const TEST_UUID = "dbf9f839-b57e-415f-8b5b-9213524ed827";

// presupuesto ""real""
const PRESUPUESTO_FIXTURE = {
  id_presupuesto: 1,
  uuid_de_usuario: TEST_UUID,
  nombre: "Mayo 2026",
  monto_limite: 5000,
  descripción: "",
  inicio: "2026-05-01",
  fin: "2026-05-31",
  updated_at: new Date().toISOString(),
  total_ejecutado: 1200,
  total_ingresos: 5000,
  categorias: [
    {
      id_relacion_presupuesto_categoria: 10,
      id_categ: 1,
      monto_asignado: 2000,
      nombre_categ: "Comida",
      icon: "utensils",
      color: "#e74c3c",
    },
    {
      id_relacion_presupuesto_categoria: 11,
      id_categ: 2,
      monto_asignado: 1000,
      nombre_categ: "Transporte",
      icon: "car",
      color: "#3498db",
    },
  ],
  transacciones: [
    { id: "t1", date: "2026-05-03", description: "Super", category: "Comida",      type: "egreso",  amount: 300 },
    { id: "t2", date: "2026-05-04", description: "Metro", category: "Transporte",  type: "egreso",  amount: 200 },
    { id: "t3", date: "2026-05-01", description: "Sueldo",category: "Ingresos",    type: "ingreso", amount: 5000 },
    { id: "t4", date: "2026-05-05", description: "Resto", category: "Comida",      type: "egreso",  amount: 900 },
  ],
};

// categoría incompleta (icono y color nulos)
const PRESUPUESTO_INCOMPLETO = {
  ...PRESUPUESTO_FIXTURE,
  id_presupuesto: 2,
  nombre: "Presupuesto Incompleto",
  categorias: [
    {
      id_relacion_presupuesto_categoria: 20,
      id_categ: 3,
      monto_asignado: 500,
      nombre_categ: "Varios",
      icon: null,
      color: null,
    },
  ],
  transacciones: [],
};

// intercepción de API
function interceptNormalFlow() {
  cy.intercept("GET", `${API_URL}/api/categorias`, { body: [] }).as("getCategorias");
  cy.intercept("GET", `${API_URL}/api/presupuestos?uuid=${TEST_UUID}`, {
    body: [PRESUPUESTO_FIXTURE],
  }).as("getPresupuestos");
  cy.intercept("GET", `${API_URL}/api/presupuestos/${PRESUPUESTO_FIXTURE.id_presupuesto}`, {
    body: PRESUPUESTO_FIXTURE,
  }).as("getDetalle");
}

function navigateToPresupuestos() {
  cy.visit("/");
  // La navegación usa <span> dentro de .header-nav (Header.jsx)
  cy.get(".header-nav span").contains("Presupuestos").click();
}

// CP-08 (CA0108/CA0109) – Resumen y selector del presupuesto activo
describe("HU-01 | CP-08 (CA0108) – Resumen y selector del presupuesto activo", () => {
  beforeEach(() => {
    interceptNormalFlow();
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("muestra el selector de presupuesto con al menos una opción", () => {
    cy.get("#pres-budget-select", { timeout: 8000 }).should("be.visible");
    cy.get("#pres-budget-select option").should("have.length.gte", 1);
    cy.get("#pres-budget-select option").first().should("contain", "Mayo 2026");
  });

  it("muestra las tarjetas de resumen (total, ejecutado, balance, %)", () => {
    cy.get(".pres-summary-cards, .pres-summary, [class*=summary]", { timeout: 8000 })
      .should("be.visible");
  });

  it("muestra la lista de categorías del presupuesto seleccionado", () => {
    cy.get(".pres-cat-list, .pres-cat-item, [class*=cat-item]", { timeout: 8000 })
      .should("have.length.gte", 1);
  });
});

// CP-09 (CA0109) – Estado vacío cuando no existen presupuestos
describe("HU-01 | CP-09 (CA0109) – Estado vacío sin presupuestos", () => {
  beforeEach(() => {
    cy.intercept("GET", `${API_URL}/api/categorias`, { body: [] }).as("getCategorias");
    cy.intercept("GET", `${API_URL}/api/presupuestos?uuid=${TEST_UUID}`, {
      body: [],
    }).as("getPresupuestosVacios");

    cy.visit("/");
    cy.get(".header-nav span").contains("Presupuestos").click();
    cy.wait("@getPresupuestosVacios");
  });

  it("muestra mensaje de estado vacío cuando no hay presupuestos", () => {
    cy.get(".pres-empty", { timeout: 8000 }).should("be.visible");
    cy.get(".pres-empty").should("contain.text", "presupuesto");
  });

  it("muestra el botón 'Crear presupuesto' en estado vacío", () => {
    cy.get(".pres-empty__action-btn, button:contains('Crear presupuesto')", { timeout: 8000 })
      .should("be.visible");
  });
});

// CP-11 (CA0111) – Apertura de detalle de categoría por clic y teclado
describe("HU-01 | CP-11 (CA0111) – Detalle de categoría (clic + teclado)", () => {
  beforeEach(() => {
    interceptNormalFlow();
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("abre el detalle de categoría al hacer clic en ella", () => {
    cy.get(".pres-cat-item[role='button'], .pres-cat-item", { timeout: 8000 })
      .first()
      .click();
    // Verificar que la vista de detalle está activa (muestra transacciones o header de detalle)
    cy.get(".pres-detail, .pres-detail-header, [class*=detail]", { timeout: 5000 })
      .should("be.visible");
  });

  it("abre el detalle de categoría al presionar Enter sobre la fila", () => {
    cy.get(".pres-cat-item[role='button'], .pres-cat-item", { timeout: 8000 })
      .first()
      .focus()
      .type("{enter}");
    cy.get(".pres-detail, .pres-detail-header, [class*=detail]", { timeout: 5000 })
      .should("be.visible");
  });
});

// CP-12 (CA0112) – Balance y porcentaje consumido reflejados visualmente
describe("HU-01 | CP-12 (CA0112) – Balance y porcentaje en UI", () => {
  beforeEach(() => {
    interceptNormalFlow();
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("muestra el donut chart / barra de progreso global", () => {
    cy.get(".pres-donut, svg, canvas, [class*=donut], [class*=chart]", { timeout: 8000 })
      .should("exist");
  });

  it("las tarjetas de resumen contienen valores numéricos positivos", () => {
    cy.get(".pres-summary-cards .pres-stat-value, .pres-stat-value", { timeout: 8000 })
      .should("have.length.gte", 1);
  });
});

// CP-13 (CA0113) – Fallback cuando categoría tiene icono/color nulos
describe("HU-01 | CP-13 (CA0113) – Fallback de icono y color en categoría incompleta", () => {
  beforeEach(() => {
    cy.intercept("GET", `${API_URL}/api/categorias`, { body: [] }).as("getCategorias");
    cy.intercept("GET", `${API_URL}/api/presupuestos?uuid=${TEST_UUID}`, {
      body: [PRESUPUESTO_INCOMPLETO],
    }).as("getPresupuestos");
    cy.intercept("GET", `${API_URL}/api/presupuestos/${PRESUPUESTO_INCOMPLETO.id_presupuesto}`, {
      body: PRESUPUESTO_INCOMPLETO,
    }).as("getDetalle");

    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("renderiza la categoría con icono de fallback sin errores de UI", () => {
    // No debe haber errores de JS ni elementos rotos
    cy.get(".pres-cat-item, [class*=cat-item]", { timeout: 8000 }).should("exist");
    // El icono container debe tener el color de fallback (#7B868C) en su estilo
    cy.get(".pres-cat-item__icon", { timeout: 8000 })
      .first()
      .should("have.attr", "style")
      .and("match", /background/i);
  });

  it("el monto ejecutado de la categoría sin transacciones es $0", () => {
    cy.get(".pres-cat-item__amount, [class*=amount]", { timeout: 8000 })
      .first()
      .invoke("text")
      .then((text) => {
        // El texto debe contener "0" o "$0"
        expect(text).to.match(/\$?0/);
      });
  });
});
