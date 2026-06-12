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

  const mockReporteIA = {
    ...mockReporte,
    periodo: { mes: 'Diciembre', anio: 2026 },
    resumen: {
      ...mockReporte.resumen,
      numTransacciones: 8
    }
  }

  const mockReporteEstandar = {
    ...mockReporte,
    periodo: { mes: 'Enero', anio: 2026 },
    analisisIA: null
  }

  // ─────────────────────────────────────────────
  // CP-01 | CA0601, CA0602
  // Validar interfaz de reportes
  // ─────────────────────────────────────────────
  describe('CP-01 – Interfaz inicial de Reportes', () => {
    it('muestra el selector de 24 meses y el toggle de IA apagado por defecto', () => {
      cy.visit('/')
      cy.contains('Reportes').click()

      // Selector de 24 meses visible
      cy.get('[data-testid="month-selector"], select[name="mes"], [aria-label*="mes"]')
        .should('be.visible')

      // Toggle IA apagado por defecto
      cy.get('[data-testid="toggle-ia"], input[type="checkbox"][name*="ia"], [role="switch"]')
        .first()
        .should('not.be.checked')
    })
  })

  // ─────────────────────────────────────────────
  // CP-02 | CA0603
  // Generar reporte estándar sin IA
  // ─────────────────────────────────────────────
  describe('CP-02 – Reporte estándar sin IA', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/reportes/generar', {
        statusCode: 200,
        body: mockReporteEstandar
      }).as('generarReporte')

      cy.visit('/')
      cy.contains('Reportes').click()
    })

    it('genera tabla, pie chart y opciones PDF/CSV inmediatamente para Enero', () => {
      // Seleccionar mes Enero
      cy.get('[data-testid="month-selector"], select[name="mes"], [aria-label*="mes"]')
        .first()
        .select('Enero')

      // Toggle IA debe estar off
      cy.get('[data-testid="toggle-ia"], input[type="checkbox"][name*="ia"], [role="switch"]')
        .first()
        .should('not.be.checked')

      cy.contains('Generar').click()
      cy.wait('@generarReporte')

      // Tabla de resultados
      cy.contains('Balance neto').should('be.visible')
      cy.contains('Gastos por categoría').should('be.visible')
      cy.contains('Comida').should('be.visible')

      // Pie chart presente
      cy.get('canvas, svg[data-chart], [data-testid="pie-chart"]').should('exist')

      // Opciones de descarga
      cy.contains(/PDF/i).should('be.visible')
      cy.contains(/CSV/i).should('be.visible')

      // No debe mostrar caja azul de IA
      cy.contains('Análisis Aura').should('not.exist')
    })
  })

  // ─────────────────────────────────────────────
  // CP-03 | CA0604, CA0606
  // Generar reporte con análisis IA
  // ─────────────────────────────────────────────
  describe('CP-03 – Reporte con análisis IA', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/reportes/generar', (req) => {
        req.reply((res) => {
          res.delay = 800
          res.send({ statusCode: 200, body: mockReporteIA })
        })
      }).as('generarReporteIA')

      cy.visit('/')
      cy.contains('Reportes').click()
    })

    it('muestra spinner de progreso y luego caja azul con patrones para Diciembre', () => {
      cy.get('[data-testid="month-selector"], select[name="mes"], [aria-label*="mes"]')
        .first()
        .select('Diciembre')

      // Activar toggle IA
      cy.get('[data-testid="toggle-ia"], input[type="checkbox"][name*="ia"], [role="switch"]')
        .first()
        .click()
        .should('be.checked')

      cy.contains('Generar').click()

      // Spinner de progreso visible durante la carga
      cy.get('[data-testid="spinner"], .spinner, [role="progressbar"], [aria-label*="cargando"]')
        .should('exist')

      cy.wait('@generarReporteIA')

      // Spinner desaparece
      cy.get('[data-testid="spinner"], .spinner, [role="progressbar"]')
        .should('not.exist')

      // Caja azul de análisis IA visible
      cy.contains('Análisis Aura').should('be.visible')
      cy.contains('Tus gastos son estables.').should('be.visible')
      cy.contains('Transporte').should('be.visible')
      cy.contains('Usa menos el coche').should('be.visible')
    })
  })

  // ─────────────────────────────────────────────
  // CP-04 | CA0605
  // Bloqueo de IA sin transacciones suficientes
  // ─────────────────────────────────────────────
  describe.skip('CP-04 – Bloqueo del toggle IA por datos insuficientes', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/transacciones*', {
        statusCode: 200,
        body: [{ id: 1 }, { id: 2 }] // Solo 2 transacciones
      }).as('getTransacciones')

      cy.visit('/')
      cy.contains('Reportes').click()
    })

    it('deshabilita el toggle IA y muestra mensaje cuando el mes tiene 2 transacciones', () => {
      // Seleccionar mes reciente con pocas transacciones
      cy.get('[data-testid="month-selector"], select[name="mes"], [aria-label*="mes"]')
        .first()
        .select(1) // primer opción (mes reciente)

      // Toggle debe estar deshabilitado
      cy.get('[data-testid="toggle-ia"], input[type="checkbox"][name*="ia"], [role="switch"]')
        .first()
        .should('be.disabled')

      // Mensaje informativo visible
      cy.contains('Mes sin datos suficientes').should('be.visible')
    })
  })

  // ─────────────────────────────────────────────
  // CP-05 | CA0607
  // Render del dashboard inicial
  // ─────────────────────────────────────────────
  describe('CP-05 – Dashboard inicial', () => {
    it('muestra ExpensesChart, SugerenciasCard, StocksPanel e InversionInfoCard en Inicio', () => {
      cy.visit('/')

      // Pestaña Inicio activa por defecto
      cy.get('[data-testid="tab-inicio"], [aria-label="Inicio"], nav').contains('Inicio')
        .should('be.visible')

      // Widgets principales presentes
      cy.get('[data-testid="expenses-chart"], [data-component="ExpensesChart"]')
        .should('exist')
      cy.get('[data-testid="sugerencias-card"], [data-component="SugerenciasCard"]')
        .should('exist')
      cy.get('[data-testid="stocks-panel"], [data-component="StocksPanel"]')
        .should('exist')
      cy.get('[data-testid="inversion-info-card"], [data-component="InversionInfoCard"]')
        .should('exist')
    })
  })

  // ─────────────────────────────────────────────
  // CP-06 | CA0608
  // Comportamiento de la pestaña Transferencias
  // ─────────────────────────────────────────────
  describe('CP-06 – Pestaña Transferencias', () => {
    it('muestra tarjeta Próximamente y permite volver sin recargar', () => {
      cy.visit('/')

      cy.contains('Transferencias').click()

      // Contenido de "próximamente"
      cy.contains(/próximamente/i).should('be.visible')

      // Volver a otro módulo sin recarga de página
      cy.contains('Inicio').click()
      cy.get('[data-testid="expenses-chart"], [data-component="ExpensesChart"]')
        .should('exist')
    })
  })

  // ─────────────────────────────────────────────
  // CP-07 | CA0609
  // Payload mínimo de guardado de preferencias
  // ─────────────────────────────────────────────
  describe.skip('CP-07 – Payload de preferencias', () => {
    it('envía solo banderas booleanas y no expone errores sensibles del backend', () => {
      cy.intercept('POST', '**/api/preferencias*', (req) => {
        // Validar que solo contenga banderas booleanas
        expect(req.body).to.have.keys(['activ_reportes', 'activ_ia'])
        expect(req.body.activ_reportes).to.be.a('boolean')
        expect(req.body.activ_ia).to.be.a('boolean')
        req.reply({ statusCode: 500, body: { error: 'Internal Server Error', stack: 'SECRET' } })
      }).as('guardarPreferencias')

      cy.visit('/')

      // Abrir sidebar desde avatar
      cy.get('[data-testid="avatar"], [aria-label="perfil"], [aria-label="configuración"]')
        .click()

      // Modificar toggle de Reportes Inteligentes
      cy.contains(/reportes inteligentes/i)
        .closest('[class]')
        .find('input[type="checkbox"], [role="switch"]')
        .click()

      cy.contains(/guardar/i).click()
      cy.wait('@guardarPreferencias')

      // UI no debe mostrar detalles del error del backend
      cy.contains('Internal Server Error').should('not.exist')
      cy.contains('stack').should('not.exist')
      cy.contains('SECRET').should('not.exist')

      // Debe mostrar mensaje de error genérico
      cy.contains(/error|no se pudo|intenta de nuevo/i).should('be.visible')
    })
  })

  // ─────────────────────────────────────────────
  // CP-08 | CA0610
  // Acceso inicial y apertura de configuración
  // ─────────────────────────────────────────────
  describe('CP-08 – Acceso inicial y sidebar de configuración', () => {
    it('inicia en Inicio y la sidebar no oculta irreversiblemente el contenido', () => {
      cy.visit('/')

      // Inicia en Inicio por defecto
      cy.get('[data-testid="tab-inicio"], nav').contains('Inicio')
        .should('be.visible')
      cy.get('[data-testid="expenses-chart"], [data-component="ExpensesChart"]')
        .should('exist')

      // Abrir sidebar
      cy.get('[data-testid="avatar"], [aria-label="perfil"], [aria-label="abrir configuración"]')
        .click()

      cy.get('[data-testid="sidebar"], aside, [role="dialog"]')
        .should('be.visible')

      // Dashboard sigue siendo comprensible / accesible
      cy.get('main, [data-testid="main-content"]').should('exist')

      // Cerrar sidebar y confirmar que el dashboard sigue operando
      cy.get('[data-testid="close-sidebar"], [aria-label="cerrar"], button').contains(/cerrar|✕|×/i).click()

      cy.get('[data-testid="expenses-chart"], [data-component="ExpensesChart"]')
        .should('exist')
    })
  })

  // ─────────────────────────────────────────────
  // CP-09 | CA0611
  // Resumen calculado de InversionInfoCard
  // ─────────────────────────────────────────────
  describe('CP-09 – InversionInfoCard: resumen calculado', () => {
    beforeEach(() => {
      const hoy = new Date()
      const en25dias = new Date(hoy.getTime() + 25 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      cy.intercept('GET', '**/api/inversiones*', {
        statusCode: 200,
        body: [
          { id: 1, estado: 'activa', monto: 40000, vencimiento: en25dias },
          { id: 2, estado: 'activa', monto: 50000, vencimiento: '2027-01-01' },
          { id: 3, estado: 'activa', monto: 30000, vencimiento: '2027-06-01' }
        ]
      }).as('getInversiones')

      cy.visit('/')
    })

    it('muestra 3 activas, total MXN 120,000 y 1 por vencer en <=30 días', () => {
      cy.wait('@getInversiones')

      cy.get('[data-testid="inversion-info-card"], [data-component="InversionInfoCard"]')
        .within(() => {
          // 3 inversiones activas
          cy.contains('3').should('be.visible')
          // Total invertido
          cy.contains(/120[,.]?000|120000/i).should('be.visible')
          // 1 por vencer en <= 30 días
          cy.contains('1').should('be.visible')
          cy.contains(/por vencer|próxim/i).should('be.visible')
        })
    })
  })

  // ─────────────────────────────────────────────
  // CP-10 | CA0612
  // Fallback de InversionInfoCard ante fallo del servicio
  // ─────────────────────────────────────────────
  describe('CP-10 – InversionInfoCard: fallback ante error del servicio', () => {
    it('muestra mensaje alternativo y dashboard permanece navegable', () => {
      cy.intercept('GET', '**/api/inversiones*', {
        statusCode: 500,
        body: { error: 'Service unavailable' }
      }).as('getInversionesFail')

      cy.visit('/')
      cy.wait('@getInversionesFail')

      // Tarjeta muestra mensaje de fallback
      cy.get('[data-testid="inversion-info-card"], [data-component="InversionInfoCard"]')
        .within(() => {
          cy.contains(/no disponible|error|no se pudo|intenta más tarde/i).should('be.visible')
        })

      // Resto del dashboard sigue operando
      cy.get('[data-testid="expenses-chart"], [data-component="ExpensesChart"]')
        .should('exist')
      cy.get('[data-testid="sugerencias-card"], [data-component="SugerenciasCard"]')
        .should('exist')

      // Navegación sigue funcionando
      cy.contains('Transferencias').click()
      cy.contains(/próximamente/i).should('be.visible')
    })
  })

  // ─────────────────────────────────────────────
  // CP-11 | CA0613
  // Enriquecimiento del resumen mensual con IA
  // ─────────────────────────────────────────────
  describe.skip('CP-11 – Resumen mensual enriquecido con IA desde Inicio', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/ia/resumen*', {
        statusCode: 200,
        body: {
          sugerencias: ['Reduce gastos en Transporte', 'Incrementa tu fondo de emergencia'],
          resumen_ia: 'Este mes tus egresos superaron tu promedio histórico en un 12%.',
          mes_actual: 'Mayo'
        }
      }).as('generarResumenIA')

      cy.intercept('GET', '**/api/inversiones*', {
        statusCode: 200,
        body: [
          { id: 1, estado: 'activa', monto: 50000, vencimiento: '2027-01-01' }
        ]
      }).as('getInversiones')

      cy.visit('/')
    })

    it('incorpora sugerencias de IA sin perder el resumen base del mes actual', () => {
      // Botón "Generar con IA" visible en Inicio
      cy.contains(/generar con ia/i).should('be.visible').click()

      cy.wait('@generarResumenIA')

      // Sugerencias de IA visibles
      cy.contains('Reduce gastos en Transporte').should('be.visible')
      cy.contains('Incrementa tu fondo de emergencia').should('be.visible')

      // Resumen base del mes sigue presente
      cy.contains(/mayo/i).should('be.visible')
      cy.get('[data-testid="expenses-chart"], [data-component="ExpensesChart"]')
        .should('exist')

      // Consistencia: resumen sigue reflejando el mes actual
      cy.contains(/este mes/i).should('be.visible')
    })
  })

  // ─────────────────────────────────────────────
  // Suite original — flujo básico de Reportes
  // ─────────────────────────────────────────────
  describe('Flujo básico de Reportes (suite original)', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/reportes/generar', {
        statusCode: 200,
        body: mockReporte
      }).as('generarReporte')

      cy.visit('/')
      cy.contains('Reportes').click()
    })

    it('muestra el formulario de generación de reporte', () => {
      cy.contains('Reporte mensual').should('be.visible')
      cy.contains('Generar').should('be.visible')
    })

    it('permite generar un reporte con IA y muestra los resultados', () => {
      cy.contains('Generar').click()
      cy.wait('@generarReporte')

      cy.contains('Balance neto').should('be.visible')
      cy.contains('$10,000.00').should('be.visible')
      cy.contains('Gastos por categoría').should('be.visible')
      cy.contains('Comida').should('be.visible')
      cy.contains('Análisis Aura').should('be.visible')
      cy.contains('Tus gastos son estables.').should('be.visible')
    })

    it('permite iniciar un nuevo reporte después de generar uno', () => {
      cy.contains('Generar').click()
      cy.wait('@generarReporte')

      cy.contains('Nuevo reporte').click()

      cy.contains('Reporte mensual').should('be.visible')
      cy.contains('Generar').should('be.visible')
    })
  })
})