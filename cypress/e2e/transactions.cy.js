describe('Transacciones E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/transactions*', (req) => {
      const url = new URL(req.url)
      const query = url.searchParams.get('search') || ''
      
      const transactions = [
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
        }
      ]
      
      let filtered = transactions
      if (query.toLowerCase() === 'oxxo') {
        filtered = [transactions[0]]
      } else if (url.searchParams.get('type') === 'ingreso') {
        filtered = [transactions[2]]
      } else if (url.searchParams.get('type') === 'egreso') {
        filtered = [transactions[0], transactions[1]]
      } else if (url.searchParams.get('category') === 'Comida') {
        filtered = [transactions[1]]
      }

      req.reply({
        body: {
          data: filtered,
          pagination: { totalItems: filtered.length, page: 1, limit: 15, totalPages: 1 }
        }
      })
    }).as('getTransactions')

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

  it('filtra por tipo ingreso', () => {
    cy.get('[data-cy="transaction-type-filter"]').select('ingreso').should('have.value', 'ingreso')
    cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
    cy.get('[data-cy="transaction-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', 'Ingreso')
    })
  })

  it('filtra por tipo egreso', () => {
    cy.get('[data-cy="transaction-type-filter"]').select('egreso').should('have.value', 'egreso')
    cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
    cy.get('[data-cy="transaction-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', 'Egreso')
    })
  })

  it('filtra por categoría comida', () => {
    cy.get('[data-cy="transaction-category-filter"]').select('Comida').should('have.value', 'Comida')
    cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
    cy.get('[data-cy="transaction-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', 'Comida')
    })
  })

  it('permite capturar rango de fechas', () => {
    cy.get('[data-cy="transaction-start-date"]').type('2026-05-01').should('have.value', '2026-05-01')
    cy.get('[data-cy="transaction-end-date"]').type('2026-05-31').should('have.value', '2026-05-31')
  })

  it('filtra por búsqueda de OXXO', () => {
    cy.get('[data-cy="transaction-search-input"]').clear().type('Oxxo')
    // Esperamos a que los resultados se actualicen y ya no esté Starbucks
    cy.get('[data-cy="transaction-card"]').should('not.contain.text', 'Starbucks')
    cy.get('[data-cy="transaction-card"]').each(($card) => {
      cy.wrap($card).invoke('text').should('match', /oxxo/i)
    })
  })
})