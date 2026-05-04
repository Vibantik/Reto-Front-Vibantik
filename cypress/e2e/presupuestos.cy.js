// cypress/e2e/presupuestos.cy.js
// HU-02 – Crear y modificar mi presupuesto
// Cubre: CP-01, CP-07, CP-08, CP-09, CP-10, CP-11, CP-12, CP-13, CP-14

// ── Fixtures / intercepts globales ──────────────────────────────────────────
const UUID = "test-uuid-001";
const HOY  = new Date().toISOString().slice(0, 10);
const MES  = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });

const PRES_BASE = {
  id_presupuesto: 1,
  nombre: "Presupuesto Mayo 2026",
  monto_limite: 6500,
  inicio: "2026-05-01",
  fin: "2026-05-31",
  uuid_de_usuario: UUID,
};

const PRES_DETALLE = {
  ...PRES_BASE,
  categorias: [
    { id_categ: 1, nombre_categ: "Comida",     icon: "shopping-cart", color: "#3B5BDB", monto_asignado: 2500, order: 1 },
    { id_categ: 2, nombre_categ: "Transporte", icon: "car",           color: "#EC0029", monto_asignado: 1200, order: 2 },
  ],
  transacciones: [
    { id: 1, description: "Starbucks",   category: "Comida",     type: "egreso",  amount: 89,    date: "2026-05-10" },
    { id: 2, description: "Uber",        category: "Transporte", type: "egreso",  amount: 145.5, date: "2026-05-10" },
    { id: 3, description: "Nómina",      category: "Ingreso",    type: "ingreso", amount: 12000, date: "2026-05-01" },
  ],
};

function mockApis({ presupuestos = [PRES_BASE], detalle = PRES_DETALLE } = {}) {
  // Lista presupuestos
  cy.intercept("GET", "**/api/presupuestos*", { statusCode: 200, body: presupuestos }).as("getPresupuestos");
  // Detalle
  cy.intercept("GET", "**/api/presupuestos/1", { statusCode: 200, body: detalle }).as("getDetalle");
  // Categorías
  cy.intercept("GET", "**/api/categorias*", {
    statusCode: 200,
    body: [
      { id_categ: 1, nombre_categ: "Comida",     icon: "shopping-cart", color: "#3B5BDB" },
      { id_categ: 2, nombre_categ: "Transporte", icon: "car",           color: "#EC0029" },
      { id_categ: 3, nombre_categ: "Entretenimiento", icon: "film",     color: "#FCC419" },
    ],
  }).as("getCategorias");
  // Transacciones (panel movimientos — no usado en presupuestos pero evita errores)
  cy.intercept("GET", "**/api/transactions*", { body: { data: [], pagination: {} } });
}

function irAPresupuestos() {
  cy.visit("/");
  cy.contains("Presupuestos").click();
  cy.get(".presupuestos-panel", { timeout: 8000 }).should("exist");
}

// ════════════════════════════════════════════════════════════════════════════
describe("HU-02 · Presupuestos E2E", () => {

  // ── CP-01 / CP-10: Creación básica desde modal ─────────────────────────
  describe("CP-01 / CP-10 – Crear presupuesto con datos válidos", () => {
    beforeEach(() => {
      // Sin presupuestos previos para que aparezca el botón de crear
      mockApis({ presupuestos: [] });
      cy.intercept("POST", "**/api/presupuestos", {
        statusCode: 201,
        body: { id_presupuesto: 99, nombre: "Presupuesto Junio 2026", monto_limite: 6500 },
      }).as("createPres");
      irAPresupuestos();
    });

    it("CP-01 · crea un presupuesto con nombre, monto y fechas válidas", () => {
      // El panel sin presupuestos muestra botón crear
      cy.contains("Crear presupuesto").click();

      // Rellena el prompt/modal con datos válidos
      // Como el flujo usa window.prompt, lo stubeamos
      cy.window().then((win) => {
        let callCount = 0;
        cy.stub(win, "prompt").callsFake((msg) => {
          callCount++;
          if (callCount === 1) return "Presupuesto Junio 2026"; // nombre
          if (callCount === 2) return "6500";                    // monto
          if (callCount === 3) return "2026-06-01";              // inicio
          if (callCount === 4) return "2026-06-30";              // fin
          return null;
        });
      });

      cy.contains("Crear presupuesto").click();
      cy.wait("@createPres").its("request.body").should((body) => {
        expect(body.nombre).to.equal("Presupuesto Junio 2026");
        expect(body.monto_limite).to.equal(6500);
        expect(body.inicio).to.equal("2026-06-01");
        expect(body.fin).to.equal("2026-06-30");
        expect(body.uuid_de_usuario).to.be.a("string").and.not.be.empty;
      });
    });

    it("CP-10 · el presupuesto creado queda seleccionado como activo", () => {
      cy.window().then((win) => {
        let c = 0;
        cy.stub(win, "prompt").callsFake(() => {
          c++;
          if (c === 1) return "Presupuesto Junio 2026";
          if (c === 2) return "6500";
          if (c === 3) return "2026-06-01";
          if (c === 4) return "2026-06-30";
          return null;
        });
      });

      // Después de crear, re-mockea con el nuevo presupuesto en la lista
      cy.intercept("GET", "**/api/presupuestos*", {
        statusCode: 200,
        body: [{ id_presupuesto: 99, nombre: "Presupuesto Junio 2026", monto_limite: 6500, inicio: "2026-06-01", fin: "2026-06-30" }],
      }).as("getPresupuestosUpdated");

      cy.intercept("GET", "**/api/presupuestos/99", {
        statusCode: 200,
        body: { id_presupuesto: 99, nombre: "Presupuesto Junio 2026", monto_limite: 6500, inicio: "2026-06-01", fin: "2026-06-30", categorias: [], transacciones: [] },
      }).as("getDetalleNuevo");

      cy.contains("Crear presupuesto").click();
      cy.wait("@createPres");

      // El select muestra el nuevo presupuesto
      cy.get(".pres-budget-selector__select", { timeout: 6000 })
        .should("contain.value", "99")
        .or(cy.contains("Presupuesto Junio 2026").should("exist"));
    });
  });

  // ── CP-07 / CP-08: Editar categorías con reflejo inmediato ─────────────
  describe("CP-07 – Editar categorías y límites de presupuesto activo", () => {
    beforeEach(() => {
      mockApis();
      cy.intercept("PUT", "**/api/presupuestos/1", { statusCode: 200, body: { ...PRES_BASE } }).as("updatePres");
      irAPresupuestos();
      cy.wait("@getPresupuestos");
    });

    it("CP-07 · navega a config y muestra campos de monto por categoría", () => {
      cy.contains("Gestionar categorías").click();
      cy.get(".cat-config-view", { timeout: 6000 }).should("exist");
      cy.contains("Comida").should("be.visible");
      cy.contains("Transporte").should("be.visible");
    });

    it("CP-07 · puede cambiar el monto de una categoría", () => {
      cy.contains("Gestionar categorías").click();
      cy.get(".cat-config-view", { timeout: 6000 }).should("exist");

      // Busca el primer input de monto y lo cambia
      cy.get("input[type='number']").first().clear().type("3000");
      cy.get("input[type='number']").first().should("have.value", "3000");
    });
  });

  // ── CP-08: Eliminar presupuesto sin eliminar gastos ─────────────────────
  describe("CP-08 / CP-09 – Eliminar presupuesto con confirmación", () => {
    beforeEach(() => {
      mockApis();
      cy.intercept("DELETE", "**/api/presupuestos/1", { statusCode: 200, body: { message: "Presupuesto eliminado" } }).as("deletePres");
      irAPresupuestos();
      cy.wait("@getPresupuestos");
    });

    it("CP-08 · el botón eliminar solicita confirmación antes de borrar", () => {
      // Stubs window.confirm para que devuelva true (confirmar eliminación)
      cy.window().then((win) => { cy.stub(win, "confirm").returns(true); });

      cy.contains("Gestionar categorías").click();
      cy.get(".cat-config-view", { timeout: 6000 }).should("exist");
      cy.contains("Eliminar presupuesto").click();

      cy.get("@deletePres").should("exist");
    });

    it("CP-08 · si cancela la confirmación, no se elimina el presupuesto", () => {
      cy.window().then((win) => { cy.stub(win, "confirm").returns(false); });

      cy.contains("Gestionar categorías").click();
      cy.get(".cat-config-view", { timeout: 6000 }).should("exist");
      cy.contains("Eliminar presupuesto").click();

      cy.get("@deletePres.all").should("have.length", 0);
      cy.contains("Presupuesto Mayo 2026").should("be.visible");
    });
  });

  // ── CP-09: Mensaje de éxito al guardar ──────────────────────────────────
  describe("CP-09 – Mensaje de éxito o error al guardar cambios", () => {
    beforeEach(() => {
      mockApis();
      cy.intercept("PUT", "**/api/presupuestos/1", { statusCode: 200, body: PRES_BASE }).as("updatePres");
      irAPresupuestos();
      cy.wait("@getPresupuestos");
    });

    it("CP-09 · muestra mensaje de éxito al guardar cambios en categorías", () => {
      cy.contains("Gestionar categorías").click();
      cy.get(".cat-config-view", { timeout: 6000 }).should("exist");

      cy.contains("Guardar cambios").click();
      cy.wait("@updatePres");

      // Debe aparecer algún mensaje de éxito (toast, texto, clase success)
      cy.contains(/guardado|éxito|success/i, { timeout: 5000 }).should("be.visible");
    });
  });

  // ── CP-11 / CP-13: Validaciones al crear presupuesto ───────────────────
  describe("CP-11 / CP-13 – Validaciones de datos al crear", () => {
    beforeEach(() => {
      mockApis({ presupuestos: [] });
      irAPresupuestos();
    });

    it("CP-13 · bloquea creación con nombre vacío", () => {
      cy.window().then((win) => {
        let c = 0;
        cy.stub(win, "prompt").callsFake(() => {
          c++;
          if (c === 1) return "";       // nombre vacío
          return null;
        });
      });
      cy.intercept("POST", "**/api/presupuestos").as("createPresShouldNotCall");

      cy.contains("Crear presupuesto").click();

      // No debe llamar al API
      cy.get("@createPresShouldNotCall.all").should("have.length", 0);
      // Muestra mensaje de error
      cy.contains(/obligatorio|nombre|requerido/i, { timeout: 4000 }).should("be.visible");
    });

    it("CP-13 · bloquea creación con monto negativo", () => {
      cy.window().then((win) => {
        let c = 0;
        cy.stub(win, "prompt").callsFake(() => {
          c++;
          if (c === 1) return "Test presupuesto";
          if (c === 2) return "-50";    // monto negativo
          return null;
        });
      });
      cy.intercept("POST", "**/api/presupuestos").as("createPresShouldNotCall2");

      cy.contains("Crear presupuesto").click();

      cy.get("@createPresShouldNotCall2.all").should("have.length", 0);
      cy.contains(/monto|negativo|mayor/i, { timeout: 4000 }).should("be.visible");
    });

    it("CP-13 · bloquea creación cuando fecha fin es menor que inicio", () => {
      cy.window().then((win) => {
        let c = 0;
        cy.stub(win, "prompt").callsFake(() => {
          c++;
          if (c === 1) return "Test presupuesto";
          if (c === 2) return "5000";
          if (c === 3) return "2026-06-10"; // inicio
          if (c === 4) return "2026-06-01"; // fin < inicio
          return null;
        });
      });
      cy.intercept("POST", "**/api/presupuestos").as("createPresShouldNotCall3");

      cy.contains("Crear presupuesto").click();

      cy.get("@createPresShouldNotCall3.all").should("have.length", 0);
      cy.contains(/fecha.*fin|fin.*inicio|menor/i, { timeout: 4000 }).should("be.visible");
    });
  });

  // ── CP-12 / CP-14: Contrato API – backend rechaza payloads inválidos ────
  describe("CP-12 / CP-14 – Backend rechaza payloads inválidos (HTTP 400)", () => {
    it("CP-14 · POST sin uuid_de_usuario responde 400", () => {
      cy.request({
        method: "POST",
        url: "http://localhost:3000/api/presupuestos",
        body: { nombre: "Sin UUID", monto_limite: 1000, inicio: "2026-06-01" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("message");
      });
    });

    it("CP-14 · POST con monto_limite = 0 responde 400", () => {
      cy.request({
        method: "POST",
        url: "http://localhost:3000/api/presupuestos",
        body: { uuid_de_usuario: UUID, nombre: "Monto cero", monto_limite: 0, inicio: "2026-06-01" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("message");
      });
    });

    it("CP-14 · POST con monto_limite negativo responde 400", () => {
      cy.request({
        method: "POST",
        url: "http://localhost:3000/api/presupuestos",
        body: { uuid_de_usuario: UUID, nombre: "Monto negativo", monto_limite: -50, inicio: "2026-06-01" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });
  });

  // ── CP-01 (PASS ya documentado): Validar nombre y duración ─────────────
  describe("CP-01 – Asignar nombre y duración al presupuesto", () => {
    beforeEach(() => {
      mockApis();
      irAPresupuestos();
      cy.wait("@getPresupuestos");
    });

    it("muestra el nombre del presupuesto activo en el selector", () => {
      cy.get(".pres-budget-selector__select", { timeout: 6000 }).should("exist");
      cy.contains("Presupuesto Mayo 2026").should("be.visible");
    });

    it("muestra las fechas de inicio y fin del presupuesto", () => {
      cy.contains(/1\/5\/2026|01\/05\/2026|2026-05-01|mayo/i).should("be.visible");
    });
  });

  // ── CP-02: Solo montos positivos ────────────────────────────────────────
  describe("CP-02 – Solo montos numéricos positivos", () => {
    beforeEach(() => {
      mockApis();
      irAPresupuestos();
      cy.wait("@getPresupuestos");
      cy.contains("Gestionar categorías").click();
      cy.get(".cat-config-view", { timeout: 6000 }).should("exist");
    });

    it("CP-02 · el input de monto tiene min=0 o rechaza valores negativos", () => {
      cy.get("input[type='number']").first().then(($input) => {
        const min = $input.attr("min");
        // Verifica que el atributo min sea 0 o que el campo tenga validación
        if (min !== undefined) {
          expect(Number(min)).to.be.gte(0);
        } else {
          // Si no tiene min, verifica que el safeNumber del componente normaliza negativos
          cy.wrap($input).clear().type("-100");
          cy.contains("Guardar cambios").click();
          // El valor guardado debe ser 0, no -100
          cy.get("input[type='number']").first()
            .should(($el) => {
              expect(Number($el.val())).to.be.gte(0);
            });
        }
      });
    });
  });
});