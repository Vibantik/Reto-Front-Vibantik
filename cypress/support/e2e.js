// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

beforeEach(() => {
  cy.intercept('GET', '**/api/transactions/stream', (req) => {
    req.reply({ statusCode: 200, headers: { 'Content-Type': 'text/event-stream' }, body: '' })
  })

  cy.intercept('GET', /\/api\/transactions\?.*type=ingreso/, { fixture: 'transactions-ingreso.json' })
  cy.intercept('GET', /\/api\/transactions\?.*type=egreso/, { fixture: 'transactions-egreso.json' })
  cy.intercept('GET', /\/api\/transactions\?.*category=Comida/, { fixture: 'transactions-comida.json' })
  cy.intercept('GET', /\/api\/transactions(\?(?!.*type=ingreso)(?!.*type=egreso)(?!.*category=Comida).*)?$/, { fixture: 'transactions.json' })
})