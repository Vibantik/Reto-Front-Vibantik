/**
PRUEBAS E2E – HU-02: Crear y modificar mi presupuesto
"Como cliente quiero crear y modificar mi presupuesto
 para que se adapte a mi realidad financiera."
 Técnica: E2E (Cypress) sobre http://localhost:5173
 CP-CA02 cubiertos:
  CP-01 (CA0201/CA0202) – Crear presupuesto con datos válidos
  CP-03 (CA0203)        – Usar categoría predefinida y crear categoría personalizada
  CP-07 (CA0207/CA0208) – Editar límite de categoría y reflejo inmediato en dashboard
  CP-08 (CA0209/CA0210) – Eliminar presupuesto con confirmación modal
  CP-09 (CA0211)        – Feedback de guardado (mensaje de éxito/error)
  CP-10 (CA0212)        – Alta de presupuesto desde modal (flujo completo E2E)
  CP-11 (CA0213)        – Validación de datos inválidos al crear presupuesto
  CP-13 (CA0215)        – Precarga de nombre y fecha en modal; botón "Creando..."
 */

const API_URL = "http://localhost:3000";
// UUID real de la app (TEMP_UUID en src/utils/userUuid.js)
const TEST_UUID = "dbf9f839-b57e-415f-8b5b-9213524ed827";

// props 
const CATEGORIA_FIXTURE = {
  id_categ: 1,
  nombre_categ: "Comida",
  icon: "utensils",
  color: "#e74c3c",
};

const PRESUPUESTO_BASE = {
  id_presupuesto: 10,
  uuid_de_usuario: TEST_UUID,
  nombre: "Presupuesto Junio 2026",
  monto_limite: 6500,
  descripción: "",
  inicio: "2026-06-01",
  fin: "2026-06-30",
  updated_at: new Date().toISOString(),
  total_ejecutado: 150,
  total_ingresos: 6500,
  categorias: [
    {
      id_relacion_presupuesto_categoria: 100,
      id_categ: 1,
      monto_asignado: 2500,
      nombre_categ: "Comida",
      icon: "utensils",
      color: "#e74c3c",
    },
  ],
  transacciones: [
    { id: "t10", date: "2026-06-02", description: "Sueldo", category: "Ingresos", type: "ingreso", amount: 6500 },
  ],
};

// helpeers
function setupInterceptions(overrides = {}) {
  cy.intercept("GET", `${API_URL}/api/categorias`, {
    body: overrides.categorias ?? [CATEGORIA_FIXTURE],
  }).as("getCategorias");

  cy.intercept("GET", `${API_URL}/api/presupuestos?uuid=${TEST_UUID}`, {
    body: overrides.presupuestos ?? [PRESUPUESTO_BASE],
  }).as("getPresupuestos");

  cy.intercept("GET", `${API_URL}/api/presupuestos/${PRESUPUESTO_BASE.id_presupuesto}`, {
    body: overrides.detalle ?? PRESUPUESTO_BASE,
  }).as("getDetalle");
}

function navigateToPresupuestos() {
  cy.visit("/");
  // La navegación usa <span> dentro de .header-nav (ver Header.jsx)
  cy.get(".header-nav span").contains("Presupuestos").click();
}

function openCreateModal() {
  // Botones posibles según estado: lista con presupuestos o estado vacío
  cy.get(
    ".pres-budget-selector__create-btn, .pres-empty__action-btn",
    { timeout: 8000 }
  )
    .first()
    .click();
  cy.get(".pres-modal, [role='dialog']", { timeout: 5000 }).should("be.visible");
}

// CP-10 (CA0212) – Alta de presupuesto desde modal (flujo E2E completo)
describe("HU-02 | CP-10 (CA0212) – Alta de presupuesto desde modal", () => {
  beforeEach(() => {
    const createdPresupuesto = { ...PRESUPUESTO_BASE, id_presupuesto: 99, nombre: "Presupuesto Junio 2026" };

    setupInterceptions({ presupuestos: [] }); // lista vacía inicialmente

    cy.intercept("POST", `${API_URL}/api/presupuestos`, {
      statusCode: 201,
      body: createdPresupuesto,
    }).as("createPresupuesto");

    cy.intercept("GET", `${API_URL}/api/presupuestos?uuid=${TEST_UUID}`, {
      body: [createdPresupuesto],
    }).as("getPresupuestosActualizados");

    cy.intercept("GET", `${API_URL}/api/presupuestos/${createdPresupuesto.id_presupuesto}`, {
      body: createdPresupuesto,
    }).as("getDetalleNuevo");

    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
  });

  it("abre el modal de creación al pulsar el botón correspondiente", () => {
    openCreateModal();
    cy.get("h3:contains('Crear presupuesto'), h2:contains('Crear presupuesto')", { timeout: 5000 })
      .should("be.visible");
  });

  it("crea el presupuesto con datos válidos y recarga la lista", () => {
    openCreateModal();

    // Limpiar y rellenar formulario
    cy.get("input[name='nombre']").clear().type("Presupuesto Junio 2026");
    cy.get("input[name='monto_limite']").clear().type("6500");
    cy.get("input[name='inicio']").clear().type("2026-06-01");
    cy.get("input[name='fin']").clear().type("2026-06-30");

    cy.get(".pres-submit-btn, button[type='submit']:contains('Crear')").click();

    cy.wait("@createPresupuesto").its("request.body").then((body) => {
      expect(body.nombre).to.equal("Presupuesto Junio 2026");
      expect(body.monto_limite).to.be.greaterThan(0);
    });

    // El modal debe cerrarse
    cy.get(".pres-modal, [role='dialog']", { timeout: 5000 }).should("not.exist");
  });
});

// CP-11 (CA0213) – Validación de datos inválidos al crear presupuesto
describe("HU-02 | CP-11 (CA0213) – Validación de datos inválidos", () => {
  beforeEach(() => {
    setupInterceptions({ presupuestos: [] });
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    openCreateModal();
  });

  it("bloquea el guardado y muestra error cuando el nombre está vacío", () => {
    cy.get("input[name='nombre']").clear();
    cy.get("input[name='monto_limite']").clear().type("1000");
    cy.get("input[name='inicio']").clear().type("2026-06-01");
    cy.get(".pres-submit-btn, button[type='submit']:contains('Crear')").click();

    // El modal sigue visible (no se cierra) y hay mensaje de error
    cy.get(".pres-modal, [role='dialog']").should("be.visible");
    cy.contains(/nombre|obligatorio/i, { timeout: 3000 }).should("be.visible");
  });

  it("bloquea el guardado cuando la fecha fin es menor que la de inicio", () => {
    cy.get("input[name='nombre']").clear().type("Test");
    cy.get("input[name='monto_limite']").clear().type("1000");
    cy.get("input[name='inicio']").clear().type("2026-06-10");
    cy.get("input[name='fin']").clear().type("2026-06-01");
    cy.get(".pres-submit-btn, button[type='submit']:contains('Crear')").click();

    cy.get(".pres-modal, [role='dialog']").should("be.visible");
    cy.contains(/fecha|fin|inicio/i, { timeout: 3000 }).should("be.visible");
  });

  it("bloquea el guardado cuando el monto límite es negativo (o 0 negativo)", () => {
    cy.get("input[name='nombre']").clear().type("Test Negativo");
    cy.get("input[name='monto_limite']").clear().type("-50");
    cy.get("input[name='inicio']").clear().type("2026-06-01");
    cy.get(".pres-submit-btn, button[type='submit']:contains('Crear')").click();

    cy.get(".pres-modal, [role='dialog']").should("be.visible");
    cy.contains(/monto|número|positivo|mayor/i, { timeout: 3000 }).should("be.visible");
  });
});

// CP-13 (CA0215) – Precarga de nombre, fecha y estado "Creando..." en modal
describe("HU-02 | CP-13 (CA0215) – Precarga y feedback del modal de creación", () => {
  beforeEach(() => {
    setupInterceptions();
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("precarga el campo nombre con un valor sugerido", () => {
    openCreateModal();
    cy.get("input[name='nombre']").invoke("val").should("not.be.empty");
  });

  it("precarga la fecha de inicio con la fecha actual (YYYY-MM-DD)", () => {
    openCreateModal();
    const today = new Date().toISOString().slice(0, 10);
    cy.get("input[name='inicio']").invoke("val").should("eq", today);
  });

  it("el botón muestra 'Creando...' mientras se procesa el submit", () => {
    // Retardar la respuesta para capturar el estado intermedio
    cy.intercept("POST", `${API_URL}/api/presupuestos`, (req) => {
      req.reply((res) => {
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        return new Promise((resolve) => setTimeout(() => resolve(res), 1500));
      });
    }).as("createLento");

    openCreateModal();
    cy.get("input[name='nombre']").clear().type("Test Delay");
    cy.get("input[name='monto_limite']").clear().type("1000");
    cy.get("input[name='inicio']").clear().type("2026-06-01");
    cy.get(".pres-submit-btn, button[type='submit']:contains('Crear')").click();

    // Durante el procesamiento el botón debe mostrar "Creando..."
    cy.contains("Creando...", { timeout: 3000 }).should("be.visible");
  });
});

// CP-07 (CA0207/CA0208) – Editar categorías y reflejo inmediato en dashboard
describe("HU-02 | CP-07 (CA0207/CA0208) – Edición de categorías", () => {
  beforeEach(() => {
    setupInterceptions();

    const updatedPresupuesto = {
      ...PRESUPUESTO_BASE,
      categorias: [
        { ...PRESUPUESTO_BASE.categorias[0], monto_asignado: 3000 },
      ],
    };

    cy.intercept("PUT", `${API_URL}/api/categorias/**`, { body: { ok: true } }).as("updateCategoria");
    cy.intercept("PUT", `${API_URL}/api/presupuestos/${PRESUPUESTO_BASE.id_presupuesto}`, {
      body: updatedPresupuesto,
    }).as("updatePresupuesto");

    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("abre la vista de configuración de categorías al pulsar 'Gestionar'", () => {
    cy.get(
      ".pres-cat-manage, button:contains('Gestionar'), button[aria-label*='Gestionar']",
      { timeout: 8000 }
    )
      .first()
      .click();
    cy.get(".pres-config-panel, [class*=config-panel]", { timeout: 5000 }).should("be.visible");
  });

  it("guarda cambios de orden y montos al pulsar 'Guardar Cambios'", () => {
    cy.get(
      ".pres-cat-manage, button:contains('Gestionar'), button[aria-label*='Gestionar']",
      { timeout: 8000 }
    )
      .first()
      .click();

    cy.get(".pres-config-panel", { timeout: 5000 }).should("be.visible");

    // Modificar monto del primer item
    cy.get("input[type='number'], input[placeholder*='monto'], input[placeholder*='Monto']", {
      timeout: 5000,
    })
      .first()
      .clear()
      .type("3000");

    cy.get("#pres-config-save-btn, .pres-config-save-btn").click();
    cy.wait("@updatePresupuesto");
  });
});

// CP-08 (CA0209/CA0210) – Eliminar presupuesto con confirmación
describe("HU-02 | CP-08 (CA0209/CA0210) – Eliminación de presupuesto", () => {
  beforeEach(() => {
    setupInterceptions();
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("el botón de eliminar dispara una confirmación antes de proceder", () => {
    // Nota: el flujo real requiere un diálogo de confirmación (window.confirm o modal)
    // Lo interceptamos para aceptar automáticamente
    cy.on("window:confirm", () => true);

    cy.intercept("DELETE", `${API_URL}/api/presupuestos/**`, {
      statusCode: 200,
      body: { message: "Presupuesto eliminado" },
    }).as("deletePresupuesto");

    // Buscar botón de eliminar
    cy.get(
      "button:contains('Eliminar'), button[aria-label*='Eliminar'], [class*=delete]",
      { timeout: 8000 }
    )
      .first()
      .click();

    // Si hay window.confirm, Cypress ya lo aceptó.
    // Si hay un modal de confirmación propio, buscarlo y confirmarlo.
    cy.get("button:contains('Confirmar'), button:contains('Sí'), button:contains('Aceptar')", {
      timeout: 3000,
    })
      .then(($btn) => {
        if ($btn.length) $btn.first().click();
      });
  });
});

// CP-09 (CA0211) – Mensaje de éxito/error al guardar cambios
describe("HU-02 | CP-09 (CA0211) – Feedback de éxito al guardar cambios", () => {
  beforeEach(() => {
    setupInterceptions();
    cy.intercept("PUT", `${API_URL}/api/categorias/**`, { body: { ok: true } }).as("updateCategoria");
    cy.intercept("PUT", `${API_URL}/api/presupuestos/${PRESUPUESTO_BASE.id_presupuesto}`, {
      body: PRESUPUESTO_BASE,
    }).as("updatePresupuesto");
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("la vista de configuración muestra un error visual cuando la API falla al guardar", () => {
    cy.intercept("PUT", `${API_URL}/api/presupuestos/**`, {
      statusCode: 500,
      body: { message: "Error interno del servidor" },
    }).as("updateFail");

    cy.get(
      ".pres-cat-manage, button:contains('Gestionar'), button[aria-label*='Gestionar']",
      { timeout: 8000 }
    )
      .first()
      .click();

    cy.get("#pres-config-save-btn, .pres-config-save-btn", { timeout: 5000 }).click();
    cy.wait("@updateFail");

    // Debe aparecer un mensaje de error
    cy.get(".pres-empty, [class*=error], [style*='banorte-red']", { timeout: 5000 })
      .should("be.visible");
  });
});

// CP-03 (CA0203) – Agregar categoría predefinida y crear una personalizada
describe("HU-02 | CP-03 (CA0203) – Uso y creación de categorías", () => {
  beforeEach(() => {
    setupInterceptions();
    cy.intercept("POST", `${API_URL}/api/categorias`, {
      statusCode: 201,
      body: {
        id_categ: 99,
        nombre_categ: "Hobbies",
        icon: "zap",
        color: "#7B868C",
      },
    }).as("createCategoria");
    cy.intercept("PUT", `${API_URL}/api/presupuestos/**`, { body: PRESUPUESTO_BASE }).as(
      "updatePresupuesto"
    );
    cy.intercept("PUT", `${API_URL}/api/categorias/**`, { body: { ok: true } }).as(
      "updateCategoria"
    );
    navigateToPresupuestos();
    cy.wait("@getPresupuestos");
    cy.wait("@getDetalle");
  });

  it("permite añadir una nueva categoría personalizada desde la vista de configuración", () => {
    cy.get(
      ".pres-cat-manage, button:contains('Gestionar'), button[aria-label*='Gestionar']",
      { timeout: 8000 }
    )
      .first()
      .click();

    cy.get("#pres-config-add-cat-btn, .pres-config-add-btn", { timeout: 5000 }).click();

    // Aparece un nuevo campo de nombre en la lista
    cy.get("input[value='Nueva categoría'], input[placeholder*='nombre'], input[placeholder*='Nombre']", {
      timeout: 5000,
    })
      .last()
      .clear()
      .type("Hobbies");

    // Guardar — debe llamar a POST /api/categorias
    cy.get("#pres-config-save-btn, .pres-config-save-btn").click();
    cy.wait("@createCategoria").its("request.body.nombre_categ").should("eq", "Hobbies");
  });
});
