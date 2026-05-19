describe('Reportes Inteligentes E2E', () => {
  const mockReporte = {
    periodo: { mes: 'Mayo', anio: 2026 },
    resumen: {
      totalIngresos: 25000,
      numIngresos: 2,
      totalEgresos: 15000,
      numEgresos: 5,
      balance: 10000,
      numTransacciones: 7
    },
    categorias: [
      { nombre: 'Comida', total: 5000, porcentaje: 33.3 },
      { nombre: 'Transporte', total: 10000, porcentaje: 66.7 }
    ],
    analisisIA: {
      salud_financiera: 'buenos',
      patron_principal: 'Tus gastos son estables.',
      categoria_critica: 'Transporte',
      recomendaciones: ['Usa menos el coche'],
      proyeccion: 'Ahorrarás más el próximo mes'
    }
  }

  beforeEach(() => {
    cy.intercept('POST', '**/api/reportes/generar', {
      statusCode: 200,
      body: mockReporte
    }).as('generarReporte')

    cy.visit('/')
    // Asumimos que existe un enlace o botón para "Reportes"
    // Si no lo hay, tal vez se pueda acceder via click en Sidebar
    cy.contains('Reportes').click()
  })

  it('muestra el formulario de generación de reporte', () => {
    cy.contains('Reporte mensual').should('be.visible')
    cy.contains('Generar').should('be.visible')
  })

  it('permite generar un reporte con IA y muestra los resultados', () => {
    // Buscar checkbox o switch para IA
    // Como no tenemos el código exacto de la parte inferior, hacemos click en Generar
    cy.contains('Generar').click()
    cy.wait('@generarReporte')

    // Validar que se muestre el balance
    cy.contains('Balance neto').should('be.visible')
    cy.contains('$10,000.00').should('be.visible')
    
    // Validar categorías
    cy.contains('Gastos por categoría').should('be.visible')
    cy.contains('Comida').should('be.visible')
    
    // Validar análisis IA
    cy.contains('Análisis Aura').should('be.visible')
    cy.contains('Tus gastos son estables.').should('be.visible')
  })

  it('permite iniciar un nuevo reporte después de generar uno', () => {
    cy.contains('Generar').click()
    cy.wait('@generarReporte')
    
    // Botón de nuevo reporte
    cy.contains('Nuevo reporte').click()
    
    // Vuelve al formulario inicial
    cy.contains('Reporte mensual').should('be.visible')
    cy.contains('Generar').should('be.visible')
  })
})
