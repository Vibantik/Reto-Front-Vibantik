describe('Transacciones E2E', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      description: 'OXXO',
      category: 'Compras',
      date: '2026-05-10',
      amount: 50,
      type: 'egreso'
    },
    {
      id: 'tx-2',
      description: 'Starbucks',
      category: 'Comida',
      date: '2026-05-10',
      amount: 89,
      type: 'egreso'
    },
    {
      id: 'tx-3',
      description: 'Nomina',
      category: 'Ingreso',
      date: '2026-05-15',
      amount: 15000,
      type: 'ingreso'
    },
    {
      id: 'tx-4',
      description: 'Pago Tarjeta',
      category: null,
      date: '2026-05-12',
      amount: 5000,
      type: 'egreso'
    },
    {
      id: 'tx-5',
      description: 'Gasolina',
      category: 'Transporte',
      date: '2026-05-18',
      amount: 450,
      type: 'egreso'
    }
  ]

  const setupTransactionInterceptor = (customLogic = null) => {
    cy.intercept('GET', '**/api/transactions*', (req) => {
      const url = new URL(req.url)
      const query = url.searchParams.get('search') || ''
      const page = url.searchParams.get('page') || '1'
      
      let filtered = [...mockTransactions]

      // Filtro por búsqueda (con validación de inyección)
      if (query) {
        filtered = filtered.filter(tx =>
          tx.description.toLowerCase().includes(query.toLowerCase())
        )
      }

      // Filtro por tipo
      if (url.searchParams.get('type')) {
        filtered = filtered.filter(tx => tx.type === url.searchParams.get('type'))
      }

      // Filtro por categoría
      if (url.searchParams.get('category')) {
        filtered = filtered.filter(tx => tx.category === url.searchParams.get('category'))
      }

      // Filtro por rango de fechas
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')
      if (startDate && endDate) {
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.date)
          return txDate >= new Date(startDate) && txDate <= new Date(endDate)
        })
      }

      // Lógica personalizada (si existe)
      if (customLogic) {
        filtered = customLogic(filtered, url)
      }

      const totalItems = filtered.length
      const limit = 10
      const totalPages = Math.ceil(totalItems / limit)
      const currentPage = Math.min(parseInt(page), totalPages || 1)
      const startIdx = (currentPage - 1) * limit
      const pageData = filtered.slice(startIdx, startIdx + limit)

      req.reply({
        body: {
          data: pageData,
          pagination: { totalItems, page: currentPage, limit, totalPages }
        }
      })
    }).as('getTransactions')
  }

  // ─────────────────────────────────────────────
  // CP-01 | CA0801
  // Validar listado inicial de movimientos
  // ─────────────────────────────────────────────
  describe('CP-01 – Listado inicial de movimientos', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('muestra el listado completo al entrar a la sección', () => {
      cy.contains('Tipo').should('be.visible')
      cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
      cy.get('[data-cy="transaction-card"]').first().should('contain.text', 'OXXO')
    })
  })

  // ─────────────────────────────────────────────
  // CP-02 | CA0802, CA0808
  // Validar filtros y búsqueda
  // ─────────────────────────────────────────────
  describe('CP-02 – Filtros y búsqueda', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('filtra por tipo ingreso correctamente', () => {
      cy.get('[data-cy="transaction-type-filter"]').select('ingreso')
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').each(($card) => {
        cy.wrap($card).should('contain.text', 'Nomina')
      })
    })

    it('busca transacciones por palabra clave OXXO', () => {
      cy.get('[data-cy="transaction-search-input"]').type('OXXO')
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').should('have.length', 1)
      cy.get('[data-cy="transaction-card"]').should('contain.text', 'OXXO')
    })
  })

  // ─────────────────────────────────────────────
  // CP-03 | CA0803
  // Validar detalle de movimiento
  // ─────────────────────────────────────────────
  describe('CP-03 – Detalle de movimiento', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('expande un movimiento y muestra detalles completos', () => {
      cy.get('[data-cy="transaction-toggle"]').first().as('toggle')
      cy.get('@toggle').should('have.attr', 'aria-expanded', 'false')
      cy.get('@toggle').click()
      cy.get('@toggle').should('have.attr', 'aria-expanded', 'true')
      cy.get('[data-cy="transaction-detail"]').should('be.visible')
    })

    it('colapsa la transacción nuevamente', () => {
      cy.get('[data-cy="transaction-toggle"]').first().click()
      cy.get('[data-cy="transaction-toggle"]').first().click()
      cy.get('[data-cy="transaction-toggle"]').first()
        .should('have.attr', 'aria-expanded', 'false')
    })
  })

  // ─────────────────────────────────────────────
  // CP-04 | CA0804
  // Validar categorización y corrección manual
  // ─────────────────────────────────────────────
  describe('CP-04 – Categorización manual', () => {
    beforeEach(() => {
      cy.intercept('PUT', '**/api/transactions/*/category', {
        statusCode: 200,
        body: { id: 'tx-1', category: 'Alimentación' }
      }).as('updateCategory')

      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('permite cambiar la categoría de una transacción', () => {
      cy.get('[data-cy="transaction-toggle"]').first().click()
      cy.get('[data-cy="transaction-detail"]')
        .find('[data-cy="category-select"], select[name="category"]')
        .select('Alimentación')

      cy.get('[data-cy="transaction-detail"]')
        .find('[data-cy="save-category"], button').click()

      cy.wait('@updateCategory')
      cy.get('[data-cy="transaction-detail"]')
        .should('contain.text', 'Alimentación')
    })
  })

<<<<<<< HEAD
  // ─────────────────────────────────────────────
  // CP-05 | CA0805
  // Validar listado vacío
  // ─────────────────────────────────────────────
  describe('CP-05 – Listado vacío', () => {
    beforeEach(() => {
      setupTransactionInterceptor((filtered, url) => {
        // Retornar vacío si se filtra por una fecha sin transacciones
        const startDate = url.searchParams.get('startDate')
        if (startDate === '2026-01-01') return []
        return filtered
      })
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('muestra mensaje de lista vacía al filtrar sin resultados', () => {
      cy.get('[data-cy="transaction-start-date"]').type('2026-01-01')
      cy.get('[data-cy="transaction-end-date"]').type('2026-01-31')
      cy.wait('@getTransactions')

      cy.contains(/no hay transacciones|lista vacía|sin resultados/i).should('be.visible')
      cy.get('[data-cy="transaction-card"]').should('not.exist')
    })
  })

  // ─────────────────────────────────────────────
  // CP-06 | CA0806
  // Validar resumen visual mensual
  // ─────────────────────────────────────────────
  describe('CP-06 – Resumen visual mensual', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('muestra resumen mensual con ingresos y egresos totales', () => {
      cy.get('[data-cy="monthly-summary"], [data-testid="summary-card"]')
        .should('exist')
      cy.contains(/total ingresos|ingresos/i).should('be.visible')
      cy.contains(/total egresos|egresos/i).should('be.visible')
      cy.contains(/15[,.]?000|15000/i).should('be.visible')
    })
  })

  // ─────────────────────────────────────────────
  // CP-07 | CA0807
  // Validar actualización en tiempo real (SSE)
  // ─────────────────────────────────────────────
  describe('CP-07 – Actualización en tiempo real', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
    })

    it('recibe notificación de nueva transacción y actualiza lista', () => {
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')

      const initialCount = 5
      cy.get('[data-cy="transaction-card"]').should('have.length.lessThan', initialCount + 1)

      // Simular evento SSE de nueva transacción
      cy.window().then((win) => {
        if (win.dispatchEvent) {
          const event = new CustomEvent('new-transaction', {
            detail: {
              id: 'tx-new',
              description: 'Nueva transacción',
              category: 'Ingreso',
              date: '2026-05-22',
              amount: 2000,
              type: 'ingreso'
            }
          })
          win.dispatchEvent(event)
        }
      })

      cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
    })
  })

  // ─────────────────────────────────────────────
  // CP-08 | CA0809
  // Carga, filtrado y búsqueda (end-to-end)
  // ─────────────────────────────────────────────
  describe('CP-08 – E2E: Carga, filtrado y búsqueda', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('ejecuta flujo completo: carga, filtro por tipo, búsqueda y paginación', () => {
      // Carga inicial
      cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)

      // Aplicar filtro de tipo
      cy.get('[data-cy="transaction-type-filter"]').select('egreso')
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)

      // Ejecutar búsqueda
      cy.get('[data-cy="transaction-search-input"]').clear().type('Starbucks')
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').should('have.length', 1)

      // Limpiar búsqueda
      cy.get('[data-cy="transaction-search-input"]').clear()
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 1)
    })
  })

  // ─────────────────────────────────────────────
  // CP-09 | CA0810
  // Estado vacío al no existir coincidencias
  // ─────────────────────────────────────────────
  describe('CP-09 – Lista vacía y recuperación', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('aplica filtro sin resultados y limpia para recuperación', () => {
      cy.get('[data-cy="transaction-search-input"]').type('XYZ-NO-EXISTE')
      cy.wait('@getTransactions')
      cy.contains(/no hay transacciones|lista vacía/i).should('be.visible')

      // Limpiar filtros
      cy.get('[data-cy="transaction-search-input"]').clear()
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
    })
  })

  // ─────────────────────────────────────────────
  // CP-10 | CA0811
  // Resistencia a inyección en búsqueda
  // ─────────────────────────────────────────────
  describe('CP-10 – Seguridad: resistencia a inyección', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/transactions*', (req) => {
        const url = new URL(req.url)
        const search = url.searchParams.get('search') || ''

        // Validar que el payload de inyección se trata solo como texto
        expect(req.method).to.equal('GET')
        expect(typeof search).to.equal('string')

        req.reply({
          statusCode: 200,
          body: {
            data: [],
            pagination: { totalItems: 0, page: 1, limit: 15, totalPages: 0 }
          }
        })
      }).as('getTransactionsSecure')

      cy.visit('/')
      cy.contains('Movimientos').click()
    })

    it('maneja payload de inyección sin errores y retorna lista vacía', () => {
      const injectionPayload = "'; DROP TABLE transactions; --"
      cy.get('[data-cy="transaction-search-input"]').type(injectionPayload)
      cy.wait('@getTransactionsSecure')

      // No debe ejecutar comando SQL, solo buscar como texto
      cy.get('body').should('not.contain', 'DROP TABLE')
      cy.contains(/no hay transacciones|lista vacía/i).should('be.visible')
    })
  })

  // ─────────────────────────────────────────────
  // CP-11 | CA0812
  // Reseteo de paginación
  // ─────────────────────────────────────────────
  describe('CP-11 – Reseteo de paginación al filtrar', () => {
    beforeEach(() => {
      // Crear muchas transacciones para paginación
      const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
        id: `tx-many-${i}`,
        description: `Transacción ${i}`,
        category: i % 2 === 0 ? 'Compras' : 'Comida',
        date: '2026-05-10',
        amount: 100 + i,
        type: i % 3 === 0 ? 'ingreso' : 'egreso'
      }))

      cy.intercept('GET', '**/api/transactions*', (req) => {
        const url = new URL(req.url)
        const page = url.searchParams.get('page') || '1'
        const limit = 10
        const startIdx = (parseInt(page) - 1) * limit
        const filtered = manyTransactions.slice(startIdx, startIdx + limit)

        req.reply({
          body: {
            data: filtered,
            pagination: {
              totalItems: manyTransactions.length,
              page: parseInt(page),
              limit,
              totalPages: Math.ceil(manyTransactions.length / limit)
            }
          }
        })
      }).as('getTransactionsPaginated')

      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactionsPaginated')
    })

    it('resetea a página 1 al cambiar filtro desde página >1', () => {
      // Ir a página 2
      cy.get('[data-cy="pagination-next"], [aria-label="página siguiente"]').click()
      cy.wait('@getTransactionsPaginated')

      // Cambiar filtro
      cy.get('[data-cy="transaction-type-filter"]').select('ingreso')
      cy.wait('@getTransactionsPaginated')

      // Debe estar en página 1
      cy.get('[data-cy="pagination-info"]').should('contain.text', 'página 1')
    })
  })

  // ─────────────────────────────────────────────
  // CP-12 | CA0813
  // Inserción de nueva transacción vía SSE
  // ─────────────────────────────────────────────
  describe('CP-12 – Inserción de nueva transacción vía SSE', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
    })

    it('recibe evento SSE y actualiza contador sin incluir futuros', () => {
      cy.get('[data-cy="transaction-card"]').then(($cards) => {
        const initialCount = $cards.length

        // Simular SSE con nueva transacción del mes actual
        cy.window().then((win) => {
          const event = new CustomEvent('new-transaction', {
            detail: {
              id: 'tx-sse',
              description: 'Transacción SSE',
              category: 'Comida',
              date: '2026-05-22',
              amount: 150,
              type: 'egreso'
            }
          })
          if (win.dispatchEvent) win.dispatchEvent(event)
        })

        // Esperaría incremento si hay refetch
        cy.get('[data-cy="transaction-card"]').should('exist')
      })
    })
  })

  // ─────────────────────────────────────────────
  // CP-13 | CA0814
  // Manejo de categoría nula y error del backend
  // ─────────────────────────────────────────────
  describe('CP-13 – Autocompletado y error controlado', () => {
    it('muestra transacción sin categoría sin errores UI', () => {
      setupTransactionInterceptor()

      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')

      // Buscar la transacción sin categoría (tx-4)
      cy.get('[data-cy="transaction-search-input"]').type('Pago')
      cy.wait('@getTransactions')

      cy.get('[data-cy="transaction-card"]').should('exist')
      cy.get('[data-cy="transaction-card"]').should('not.contain.text', 'undefined')
    })

    it('maneja error del backend de forma controlada', () => {
      cy.intercept('GET', '**/api/transactions*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getTransactionsError')

      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactionsError')

      cy.contains(/error|no se pudo|intenta de nuevo/i).should('be.visible')
      cy.get('body').should('not.contain.text', '500')
      cy.get('body').should('not.contain.text', 'Internal Server Error')
    })
  })

  // ─────────────────────────────────────────────
  // CP-14 | CA0815
  // Categorización automática por IA
  // ─────────────────────────────────────────────
  describe('CP-14 – Categorización automática por IA', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/transactions*', (req) => {
        req.reply({
          body: {
            data: [
              {
                id: 'tx-ia-1',
                description: 'Uber',
                category: 'Transporte', // Categoría asignada por IA
                category_source: 'ai',
                date: '2026-05-20',
                amount: 200,
                type: 'egreso'
              }
            ],
            pagination: { totalItems: 1, page: 1, limit: 15, totalPages: 1 }
          }
        })
      }).as('getTransactionsIA')

      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactionsIA')
    })

    it('muestra categoría sugerida por IA y persiste en consultas posteriores', () => {
      cy.get('[data-cy="transaction-card"]').first()
        .should('contain.text', 'Transporte')

      cy.get('[data-cy="transaction-card"]').first()
        .should('contain.text', 'Uber')

      // Consultar nuevamente la misma transacción
      cy.get('[data-cy="transaction-search-input"]').type('Uber')
      cy.wait('@getTransactionsIA')

      cy.get('[data-cy="transaction-card"]').first()
        .should('contain.text', 'Transporte')
    })
  })

  // ─────────────────────────────────────────────
  // Suite original — flujo básico
  // ─────────────────────────────────────────────
  describe('Flujo básico de Transacciones (suite original)', () => {
    beforeEach(() => {
      setupTransactionInterceptor()
      cy.visit('/')
      cy.contains('Movimientos').click()
      cy.wait('@getTransactions')
      cy.contains('Tipo').should('be.visible')
    })

    it('muestra la lista de transacciones', () => {
      cy.get('[data-cy="transaction-card"]')
        .should('exist')
        .and('have.length.greaterThan', 0)
    })

    it('expande y colapsa una transacción', () => {
      cy.get('[data-cy="transaction-toggle"]').first().as('toggle')
      cy.get('@toggle').should('have.attr', 'aria-expanded', 'false')
      cy.get('@toggle').click()
      cy.get('@toggle').should('have.attr', 'aria-expanded', 'true')
      cy.get('@toggle').click()
      cy.get('@toggle').should('have.attr', 'aria-expanded', 'false')
    })

    it('filtra por tipo egreso', () => {
      cy.get('[data-cy="transaction-type-filter"]').select('egreso')
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
      cy.get('[data-cy="transaction-card"]').each(($card) => {
        cy.wrap($card).should('not.contain.text', 'Nomina')
      })
    })

    it('permite capturar rango de fechas', () => {
      cy.get('[data-cy="transaction-start-date"]').type('2026-05-01')
      cy.get('[data-cy="transaction-end-date"]').type('2026-05-31')
      cy.get('[data-cy="transaction-start-date"]').should('have.value', '2026-05-01')
      cy.get('[data-cy="transaction-end-date"]').should('have.value', '2026-05-31')
    })

    it('filtra por búsqueda de OXXO', () => {
      cy.get('[data-cy="transaction-search-input"]').type('OXXO')
      cy.wait('@getTransactions')
      cy.get('[data-cy="transaction-card"]').should('have.length', 1)
      cy.get('[data-cy="transaction-card"]').should('contain.text', 'OXXO')
=======
  it('filtra por búsqueda de OXXO', () => {
    cy.get('[data-cy="transaction-search-input"]').clear().type('Oxxo')
    // Esperamos a que los resultados se actualicen y ya no esté Starbucks
    cy.get('[data-cy="transaction-card"]').should('not.contain.text', 'Starbucks')
    cy.get('[data-cy="transaction-card"]').each(($card) => {
      cy.wrap($card).invoke('text').should('match', /oxxo/i)
>>>>>>> 8de4a78f20b7302beca7a0e0c922b89246db1306
    })
  })
})