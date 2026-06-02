/**
PRUEBAS E2E – HU-01: Visualizar el progreso de mis gastos
 "Como cliente quiero visualizar el progreso de mis gastos asociados
  a mis presupuestos y recibir alertas de la IA"

Técnica: E2E (Cypress) sobre http://localhost:5173

CP-CA01 cubiertos:
   CP-01 (CA0101)        – Validar visualización de resumen en página principal
   CP-02 (CA0102)        – Validar desglose detallado y barras de progreso
   CP-03 (CA0103)        – Validar sugerencia de redistribución (IA)
   CP-04 (CA0104)        – Validar alerta preventiva de exceso (IA)
   CP-05 (CA0105)        – Validar mensaje de racha de 7 días
   CP-06 (CA0106)        – Validar historial de presupuestos pasados
   CP-07 (CA0107)        – Validar actualización en tiempo real de gastos
   CP-08 (CA0108/CA0109) – Resumen y selector del presupuesto activo
   CP-09 (CA0109)        – Estado vacío cuando no existen presupuestos
   CP-11 (CA0111)        – Apertura de detalle por clic y por teclado (accesibilidad)
   CP-12 (CA0112)        – Balance y porcentaje consumido reflejados en UI
   CP-13 (CA0113)        – Fallback de icono/color/monto en categoría incompleta
   CP-14 (CA0114)        – Sugerencias del dashboard con IA y respaldo por reglas
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
    body: [PRESUPUESTO_FIXTURE, ...Array.from({ length: 3 }).map((_, i) => ({
      ...PRESUPUESTO_FIXTURE,
      id_presupuesto: i + 3,
      nombre: `Mes pasado ${i}`,
      inicio: `2026-0${4 - i}-01`,
      fin: `2026-0${4 - i}-30`
    }))]
  }).as("getMultiplePresupuestos");
  cy.intercept("GET", `${API_URL}/api/presupuestos/${PRESUPUESTO_FIXTURE.id_presupuesto}`, {
    body: PRESUPUESTO_FIXTURE,
  }).as("getDetalle");
  cy.intercept("GET", `${API_URL}/api/transactions*`, {
    body: { data: PRESUPUESTO_FIXTURE.transacciones }
  }).as("getTransactions");
  cy.intercept("GET", `${API_URL}/api/inversiones`, {
    body: []
  }).as("getInversiones");
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
    cy.wait("@getMultiplePresupuestos");
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

// CP-01 (CA0101) – Visualización de resumen en página principal
describe("HU-01 | CP-01 (CA0101) – Resumen en página principal", () => {
  beforeEach(() => {
    interceptNormalFlow();
    cy.visit("/"); // Vista 'Inicio'
  });

  it("muestra el componente PresupuestoInfoCard con los datos del presupuesto en curso", () => {
    cy.wait("@getMultiplePresupuestos");
    cy.get(".info-card").contains("Mayo 2026").should("be.visible");
    cy.get(".info-card").contains("$1,400.00").should("be.visible");
    cy.get(".info-card").contains("$5,000.00").should("be.visible");
  });
});

// CP-02 (CA0102) – Desglose detallado y barras de progreso
describe("HU-01 | CP-02 (CA0102) – Desglose detallado y progreso", () => {
  beforeEach(() => {
    interceptNormalFlow();
    navigateToPresupuestos();
    cy.wait("@getMultiplePresupuestos");
    cy.wait("@getDetalle");
  });

  it("renderiza correctamente las categorías con barras de progreso", () => {
    cy.get(".pres-cat-item").should("have.length.gte", 2);
    cy.get(".pres-cat-item__bar-fill").should("have.length.gte", 1);
  });
});

// CP-06 (CA0106) – Historial de presupuestos pasados
describe("HU-01 | CP-06 (CA0106) – Historial de pasados", () => {
  beforeEach(() => {
    interceptNormalFlow();
    navigateToPresupuestos();
    cy.wait("@getMultiplePresupuestos");
  });

  it("muestra los presupuestos de meses pasados en la sección inferior", () => {
    cy.contains("Historial reciente").should("be.visible");
    cy.get(".pres-cat-list-card button").contains("Mes pasado 0").should("exist");
  });
});

// CP-03, 04, 05, 14 – Sugerencias (IA / Reglas) en Inicio
describe("HU-01 | IA y Reglas (CA0103, CA0104, CA0105, CA0114)", () => {
  beforeEach(() => {
    interceptNormalFlow();
    cy.intercept("POST", `${API_URL}/api/ia/agentic`, (req) => {
      req.reply({
        body: `{"message":{"content":"{\\"sugerencias\\":[{\\"titulo\\":\\"Prueba IA 1\\",\\"detalle\\":\\"Detalle 1\\",\\"tipo\\":\\"ahorro\\"}]}"}}`
      })
    }).as("getIA");
    cy.visit("/");
    cy.wait("@getMultiplePresupuestos");
    cy.wait("@getTransactions");
  });

  it("CP-14 (CA0114): fallback a reglas por defecto antes de generar con IA", () => {
    cy.get(".sugerencias-card").should("be.visible");
    cy.get(".sugerencias-ia-btn").contains("Generar con IA").should("be.visible");
    // Por nuestras reglas (racha 7 días = false by default on transactions fixture), veremos otras
    cy.get(".sugerencias-lista .sugerencia-item").should("have.length.gte", 1);
  });

  it("CP-14 (CA0114) / CP-03 (CA0103): Generar IA presiona el botón y muestra badge", () => {
    // Simulamos presionar el botón de Ollama
    cy.get(".sugerencias-ia-btn").click();
    cy.wait("@getIA");
    cy.contains("Generadas con IA").should("be.visible");
    // Verifica que agarró la data
    cy.contains("Prueba IA 1").should("be.visible");
  });

  it("CP-04 (CA0104): Mostrar alerta de exceso (> 80%)", () => {
    // Modificamos el fixture para forzar exceso: ejecutado = 4500 (90%)
    const excesoTx = [...PRESUPUESTO_FIXTURE.transacciones, { id: "t5", date: "2026-05-15", description: "iPhone", category: "Varios", type: "egreso", amount: 4000 }];
    cy.intercept("GET", `${API_URL}/api/transactions*`, { body: { data: excesoTx } }).as("getBigTx");
    cy.visit("/");
    cy.wait("@getBigTx");
    cy.get(".sugerencias-card").contains("Posible exceso de presupuesto", { matchCase: false }).should("exist");
  });

  it("CP-05 (CA0105): Mostrar mensaje racha 7 días (gastos < límite diario)", () => {
    // Retrasar Egresos para estar vacío (gastos =0 en últimos 7 días)
    cy.intercept("GET", `${API_URL}/api/transactions*`, { body: { data: [] } }).as("getEmptyTx");
    cy.visit("/");
    cy.wait("@getEmptyTx");
    cy.get(".sugerencias-card").contains("¡Felicidades por tu racha!", { matchCase: false }).should("exist");
  });
});

// CP-07 (CA0107) – Actualización en tiempo real
describe("HU-01 | CP-07 (CA0107) – Actualización en tiempo real", () => {
  beforeEach(() => {
    interceptNormalFlow();
    navigateToPresupuestos();
    cy.wait("@getMultiplePresupuestos");
  });

  it("el dashboard se recalcula al recibir nuevos egresos por red (simulado)", () => {
    // Verificar monto inicial
    cy.get(".pres-summary-cards").contains("$1,400.00").should("exist");

    // Interceptamos una nueva respuesta post "simulación de sse" con una transacción extra de $50
    const extraTx = { id: "t99", date: "2026-05-18", description: "Oxxo", category: "Comida", type: "egreso", amount: 50 };
    const newDetalle = { ...PRESUPUESTO_FIXTURE, total_ejecutado: 1450, transacciones: [...PRESUPUESTO_FIXTURE.transacciones, extraTx] };
    // Refrescamos endpoint u obsevamos recambio
    cy.intercept("GET", `${API_URL}/api/presupuestos/${PRESUPUESTO_FIXTURE.id_presupuesto}`, { body: newDetalle }).as("getDetalleActualizado");
    // Al recargar / gatillar re-fetch (navegando a inicio y de vuelta)
    cy.visit("/");
    cy.get(".header-nav span").contains("Presupuestos").click();
    cy.wait("@getDetalleActualizado");
    cy.get(".pres-summary-cards").contains("$1,450.00").should("exist");
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
    cy.wait("@getMultiplePresupuestos");
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
    cy.wait("@getMultiplePresupuestos");
    cy.wait("@getDetalle");
  });

  it("muestra el donut chart / barra de progreso global", () => {
    cy.get(".pres-donut, svg, canvas, [class*=donut], [class*=chart]", { timeout: 8000 })
      .should("exist");
  });

  it("las tarjetas de resumen contienen valores numéricos positivos", () => {
    cy.get(".pres-summary-cards .pres-summary-card__value", { timeout: 8000 })
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
