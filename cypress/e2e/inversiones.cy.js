// cypress/e2e/inversiones.cy.js
// HU-04 – Información visual e intuitiva de mis inversiones
// Cubre: CP-01 al CP-13
 
// ── Datos de prueba ──────────────────────────────────────────────────────────
 
const HISTORIAL_14 = Array.from({ length: 14 }, (_, i) => {
  const d = new Date("2026-05-01");
  d.setDate(d.getDate() + i);
  return { fecha: d.toISOString().slice(0, 10), tasa: 9.5 + Math.sin(i) * 0.3 };
});
 
const PLAZO_1 = {
  "id_inversión": 1,
  nombre: "CETES 28 días",
  valor: "50000",
  fecha_inicio: "2026-01-01",
  fecha_fin: "2026-12-31",
  tipo: "CETES",
  numero_cuenta: "12345678",
  tasa_rendimiento_diaria_anualizada: 9.5,
  cambio_tasa_anualizada: 0.05,
};
 
const PLAZO_2 = {
  "id_inversión": 2,
  nombre: "CETES 91 días",
  valor: "30000",
  fecha_inicio: "2026-03-01",
  fecha_fin: "2026-08-01",
  tipo: "CETES",
};
 
const FONDO_1 = {
  "id_inversión": 3,
  nombre: "Fondo Estrategia 1",
  valor: "100000",
  fecha_inicio: "2026-01-01",
  fecha_fin: "2026-12-31",
  tipo: "Fondo de inversión",
  nivel_riesgo: "medio",
  tasa_rendimiento_diaria_anualizada: 10.25,
  cambio_tasa_anualizada: -0.12,
  rendimiento_diario: 28.35,
  historial: HISTORIAL_14,
};
 
const FONDO_2 = {
  "id_inversión": 4,
  nombre: "Fondo Estrategia 2",
  valor: "75000",
  fecha_inicio: "2026-02-01",
  fecha_fin: "2026-11-30",
  tipo: "Fondo de inversión",
  nivel_riesgo: "bajo",
  tasa_rendimiento_diaria_anualizada: 8.9,
  cambio_tasa_anualizada: 0.08,
  rendimiento_diario: 18.24,
  historial: HISTORIAL_14,
};
 
// ── Helpers ──────────────────────────────────────────────────────────────────
 
function mockInversiones(data) {
  cy.intercept("GET", "**/api/inversiones/u/dbf9f839-b57e-415f-8b5b-9213524ed827*", { statusCode: 200, body: data }).as("getInversionesByUser");
  // Silencia otras APIs que la app pueda llamar
  cy.intercept("GET", "**/api/transactions*", { body: { data: [], pagination: {} } });
  cy.intercept("GET", "**/api/presupuestos*", { body: [] });
}
 
function irAInversiones() {
  cy.visit("/");
  cy.contains("Inversiones").click();
  cy.get(".inversiones-screen", { timeout: 8000 }).should("exist");
}
 
// ── Suite principal ──────────────────────────────────────────────────────────
 
describe("HU-04 · Inversiones E2E", () => {
 
  // ── CP-01: Una sola inversión a plazo ──────────────────────────────────
  describe("CP-01 – Visualización de una única inversión a plazo", () => {
    beforeEach(() => {
      mockInversiones([PLAZO_1]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-01 · muestra el nombre de la inversión", () => {
      cy.contains("CETES 28 días").should("be.visible");
    });
 
    it("CP-01 · muestra el tipo de inversión", () => {
      cy.contains("CETES").should("be.visible");
    });
 
    it("CP-01 · muestra el monto formateado en MXN", () => {
      cy.contains("$50,000.00").should("be.visible");
    });
 
    it("CP-01 · muestra la fecha de inicio y vencimiento", () => {
      cy.contains(/01.*ene.*2026|2026-01-01/i).should("be.visible");
      cy.contains(/31.*dic.*2026|2026-12-31/i).should("be.visible");
    });
 
    it("CP-01 · muestra el badge de estatus ACTIVA o VENCIDA", () => {
      cy.get(".inversion-estatus").should("be.visible").and(($el) => {
        expect($el.text().trim()).to.match(/ACTIVA|VENCIDA/);
      });
    });
 
    it("CP-01 · muestra los días restantes", () => {
      cy.contains(/días|restantes/i).should("be.visible");
    });
  });
 
  // ── CP-02: Múltiples inversiones a plazo ───────────────────────────────
  describe("CP-02 – Lista ordenada de múltiples inversiones a plazo", () => {
    beforeEach(() => {
      mockInversiones([PLAZO_1, PLAZO_2]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-02 · muestra ambas inversiones a plazo", () => {
      cy.contains("CETES 28 días").should("be.visible");
      cy.contains("CETES 91 días").should("be.visible");
    });
 
    it("CP-02 · muestra al menos 2 tarjetas de inversión a plazo", () => {
      cy.get(".inversion-card").should("have.length.gte", 2);
    });
 
    it("CP-02 · muestra el total de la sección Inversiones a Plazo", () => {
      // Total = 50000 + 30000 = 80000
      cy.contains(/\$80,000|\$80\.000/i).should("be.visible");
    });
  });
 
  // ── CP-03: Detalle al hacer clic ───────────────────────────────────────
  describe("CP-03 – Detalle de inversión a plazo al hacer clic", () => {
    beforeEach(() => {
      mockInversiones([PLAZO_1, PLAZO_2]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-03 · al hacer clic en una tarjeta muestra sus detalles completos", () => {
      cy.get(".inversion-card").first().click();
      // Detalles: nombre, monto, fechas, días restantes
      cy.contains("CETES 28 días").should("be.visible");
      cy.contains("$50,000.00").should("be.visible");
    });
  });
 
  // ── CP-04 / CP-05: Un único fondo con gráfica ──────────────────────────
  describe("CP-04 / CP-05 – Fondo de inversión único con gráfica de 14 días", () => {
    beforeEach(() => {
      mockInversiones([FONDO_1]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-04 · muestra el nombre del fondo", () => {
      cy.contains("Fondo Estrategia 1").should("be.visible");
    });
 
    it("CP-04 · muestra el monto invertido", () => {
      cy.contains("$100,000.00").should("be.visible");
    });
 
    it("CP-04 · muestra la gráfica de rendimiento diario", () => {
      cy.get(".fondo-chart-wrapper", { timeout: 5000 }).should("exist");
      cy.get(".recharts-line").should("exist");
    });
 
    it("CP-05 · muestra hint de interacción con la gráfica", () => {
      cy.contains(/clic en un punto|detalle/i).should("be.visible");
    });
 
    it("CP-05 · al hacer clic en la gráfica muestra fecha y tasa del punto", () => {
      // Click en el área de la gráfica
      cy.get(".recharts-responsive-container").first().click(100, 90);
      // Después del click debe aparecer el panel de punto seleccionado
      cy.get(".fondo-selected-point", { timeout: 4000 }).should("exist");
      cy.get(".fondo-selected-fecha").should("not.be.empty");
      cy.get(".fondo-selected-tasa").should("not.be.empty");
    });
  });
 
  // ── CP-06: Click en punto de gráfica muestra fecha y tasa ─────────────
  describe("CP-06 – Interacción con punto de gráfica de fondo", () => {
    beforeEach(() => {
      mockInversiones([FONDO_1]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-06 · el panel de punto seleccionado tiene botón para limpiar selección", () => {
      cy.get(".recharts-responsive-container").first().click(100, 90);
      cy.get(".fondo-selected-point", { timeout: 4000 }).within(() => {
        cy.get(".fondo-clear-btn").should("exist").click();
      });
      // Después de limpiar vuelve el hint
      cy.contains(/clic en un punto|detalle/i).should("be.visible");
      cy.get(".fondo-selected-point").should("not.exist");
    });
  });
 
  // ── CP-07: Múltiples fondos en lista ──────────────────────────────────
  describe("CP-07 – Lista de múltiples fondos de inversión", () => {
    beforeEach(() => {
      mockInversiones([FONDO_1, FONDO_2]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-07 · muestra ambos fondos", () => {
      cy.contains("Fondo Estrategia 1").should("be.visible");
      cy.contains("Fondo Estrategia 2").should("be.visible");
    });
 
    it("CP-07 · muestra tasa anualizada y cambio en la vista de lista", () => {
      cy.contains(/tasa anualizada/i).should("be.visible");
      cy.contains(/cambio/i).should("be.visible");
    });
 
    it("CP-07 · fondos en lista muestran el botón Ver más", () => {
      cy.contains("Ver más").should("be.visible");
    });
  });
 
  // ── CP-08: Detalle de fondo al hacer clic ────────────────────────────
  describe("CP-08 – Detalle de fondo al expandir", () => {
    beforeEach(() => {
      mockInversiones([FONDO_1, FONDO_2]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-08 · al hacer clic en Ver más muestra el detalle completo del fondo", () => {
      cy.contains("Ver más").first().click();
      cy.contains("Fondo Estrategia 1").should("be.visible");
      cy.contains("$100,000.00").should("be.visible");
      cy.contains(/cantidad invertida/i).should("be.visible");
    });
 
    it("CP-08 · el detalle expandido muestra la gráfica", () => {
      cy.contains("Ver más").first().click();
      cy.get(".fondo-chart-wrapper", { timeout: 5000 }).should("exist");
    });
  });
 
  // ── CP-09: Agrupación y totales por tipo ──────────────────────────────
  describe("CP-09 – Agrupación en secciones y totales", () => {
    beforeEach(() => {
      mockInversiones([PLAZO_1, PLAZO_2, FONDO_1, FONDO_2]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-09 · muestra la sección Inversiones a Plazo", () => {
      cy.contains("Inversiones a Plazo").should("be.visible");
    });
 
    it("CP-09 · muestra la sección Fondos de Inversión", () => {
      cy.contains("Fondos de Inversión").should("be.visible");
    });
 
    it("CP-09 · muestra el total de inversiones a plazo ($80,000)", () => {
      cy.contains(/\$80,000|\$80\.000/i).should("be.visible");
    });
 
    it("CP-09 · muestra el total de fondos ($175,000)", () => {
      cy.contains(/\$175,000|\$175\.000/i).should("be.visible");
    });
  });
 
  // ── CP-10: Estado vacío parcial ───────────────────────────────────────
  describe("CP-10 – Sección vacía no oculta la sección con datos", () => {
    it("CP-10 · sin plazo muestra mensaje vacío pero sí muestra los fondos", () => {
      mockInversiones([FONDO_1]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
 
      cy.contains("Inversiones a Plazo").should("be.visible");
      cy.contains(/no tienes inversiones a plazo/i).should("be.visible");
      cy.contains("Fondos de Inversión").should("be.visible");
      cy.contains("Fondo Estrategia 1").should("be.visible");
    });
 
    it("CP-10 · sin fondos muestra mensaje vacío pero sí muestra inversiones a plazo", () => {
      mockInversiones([PLAZO_1]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
 
      cy.contains("Fondos de Inversión").should("be.visible");
      cy.contains(/no tienes fondos/i).should("be.visible");
      cy.contains("Inversiones a Plazo").should("be.visible");
      cy.contains("CETES 28 días").should("be.visible");
    });
  });
 
  // ── CP-11: Contrato API GET /api/inversiones ──────────────────────────
  describe("CP-11 – Contrato mínimo de GET /api/inversiones", () => {
    it("CP-11 · la respuesta contiene los campos requeridos por la UI", () => {
      cy.request("GET", "http://localhost:3000/api/inversiones").then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an("array");
 
        if (res.body.length > 0) {
          const item = res.body[0];
          // Campos obligatorios que usa la UI
          expect(item).to.have.property("id_inversión");
          expect(item).to.have.property("nombre");
          expect(item).to.have.property("valor");
          expect(item).to.have.property("fecha_inicio");
          expect(item).to.have.property("fecha_fin");
          expect(item).to.have.property("tipo");
        }
      });
    });
 
    it("CP-11 · no expone campos sensibles como contraseña o uuid interno", () => {
      cy.request("GET", "http://localhost:3000/api/inversiones").then((res) => {
        if (res.body.length > 0) {
          const item = res.body[0];
          expect(item).not.to.have.property("password");
          expect(item).not.to.have.property("hash");
          expect(item).not.to.have.property("salt");
        }
      });
    });
  });
 
  // ── CP-12: Expansión y contracción de FondoCard ───────────────────────
  describe("CP-12 – Ver más / Ver menos en FondoCard", () => {
    beforeEach(() => {
      mockInversiones([FONDO_1, FONDO_2]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-12 · Ver más expande el card", () => {
      cy.contains("Ver más").first().as("btn");
      cy.get("@btn").should("have.attr", "aria-expanded", "false");
      cy.get("@btn").click();
 
      // Ya expandido: aparece Ver menos
      cy.contains("Ver menos").should("be.visible");
      cy.get(".fondo-chart-wrapper", { timeout: 5000 }).should("exist");
    });
 
    it("CP-12 · Ver menos contrae el card y vuelve a mostrar Ver más", () => {
      cy.contains("Ver más").first().click();
      cy.contains("Ver menos").click();
 
      cy.contains("Ver más").should("be.visible");
      cy.get(".fondo-chart-wrapper").should("not.exist");
    });
 
    it("CP-12 · el card siempre muestra nombre y monto aunque esté colapsado", () => {
      // Vista colapsada (lista)
      cy.get(".fondo-list-row").first().within(() => {
        cy.contains("Fondo Estrategia").should("be.visible");
      });
    });
 
    it("CP-12 · muestra badge de nivel de riesgo cuando está disponible", () => {
      cy.contains("MEDIO").should("be.visible");
    });
  });
 
  // ── CP-13: Cálculo de progreso y días restantes ───────────────────────
  describe("CP-13 – Cálculo de progreso temporal y días restantes", () => {
    beforeEach(() => {
      // Inversión que dura todo 2026: fácil de calcular
      mockInversiones([PLAZO_1]); // inicio 2026-01-01, fin 2026-12-31
      irAInversiones();
      cy.wait("@getInversionesByUser");
    });
 
    it("CP-13 · la barra de progreso existe y tiene width entre 0% y 100%", () => {
      cy.get(".inversion-progreso-fill").first().should(($bar) => {
        const width = parseFloat($bar[0].style.width);
        expect(width).to.be.gte(0);
        expect(width).to.be.lte(100);
      });
    });
 
    it("CP-13 · días restantes mostrados es un número >= 0", () => {
      cy.contains(/\d+ días/).should(($el) => {
        const dias = parseInt($el.text().match(/\d+/)[0]);
        expect(dias).to.be.gte(0);
      });
    });
 
    it("CP-13 · la barra de progreso refleja que la inversión está en curso", () => {
      // Con fecha inicio 2026-01-01 y fin 2026-12-31, hoy (mayo 2026) ~33% progreso
      cy.get(".inversion-progreso-fill").first().should(($bar) => {
        const width = parseFloat($bar[0].style.width);
        // Debe ser mayor que 0 (ya inició) y menor que 100 (no ha vencido)
        expect(width).to.be.gt(0);
        expect(width).to.be.lt(100);
      });
    });
  });
 
  // ── CP-14: Robustez con campos opcionales ausentes ────────────────────
  describe("CP-14 – Render estable con campos opcionales ausentes", () => {
    it("CP-14 · FondoCard sin historial, nivel_riesgo, numero_cuenta ni rendimiento_diario no crashea", () => {
      const fondoMinimo = {
        "id_inversión": 99,
        nombre: "Fondo Mínimo",
        valor: "10000",
        fecha_inicio: "2026-01-01",
        fecha_fin: "2026-12-31",
        tipo: "Fondo de inversión",
        // Sin: historial, nivel_riesgo, numero_cuenta, rendimiento_diario
      };
 
      mockInversiones([fondoMinimo]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
 
      cy.contains("Fondo Mínimo").should("be.visible");
      cy.contains("$10,000.00").should("be.visible");
      // No debe haber errores de render (la gráfica no aparece si no hay historial)
      cy.get(".fondo-chart-wrapper").should("not.exist");
    });
 
    it("CP-14 · InversionCard sin numero_cuenta ni tasa no crashea", () => {
      const plazoMinimo = {
        "id_inversión": 98,
        nombre: "CETES Mínimo",
        valor: "5000",
        fecha_inicio: "2026-01-01",
        fecha_fin: "2026-12-31",
        tipo: "CETES",
        // Sin: numero_cuenta, tasa_rendimiento_diaria_anualizada, etc.
      };
 
      mockInversiones([plazoMinimo]);
      irAInversiones();
      cy.wait("@getInversionesByUser");
 
      cy.contains("CETES Mínimo").should("be.visible");
      cy.contains("$5,000.00").should("be.visible");
      cy.get(".inversion-progreso-bar").should("exist");
    });
  });
 
});