//! test 

describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
})

// ! e2e prueba

describe('My App E2E Tests', () => {

  //va a root
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads the homepage successfully', () => {
    // revisa dashboard
    cy.get('main.dashboard').should('be.visible')
  })

  it('opens the chatbot when the floating button is clicked', () => {
    // 1. chatbot cerrado
    cy.get('.chatbot-overlay').should('not.exist')

    // 2. click boton de chatbot
    cy.get('button.fab').click()

    // 3. chatbot abre 
    cy.get('.chatbot-overlay').should('be.visible')
    cy.get('.chatbot-title').should('contain', 'Habla con Aura')
  })
})