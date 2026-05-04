describe('Transacciones E2E', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('Movimientos').click()
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
    cy.get('[data-cy="transaction-search-input"]').type('OXXO')
    cy.get('[data-cy="transaction-card"]').should('have.length.greaterThan', 0)
    cy.get('[data-cy="transaction-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', 'OXXO')
    })
  })
})