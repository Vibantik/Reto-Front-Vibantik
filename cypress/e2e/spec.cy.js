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
    cy.visit('http://localhost:5173/')
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

  // PERSONALIZACIÓN
  it('opens the settings sidebar when the profile icon is clicked',  () => {
    cy.get('.sidebar').should('not.have.class', 'open')

    cy.get('.header-avatar').click()
    
    cy.get('.sidebar').should('have.class', 'open')
    // revisa que existan las 7 opciones esperadas
    cy.get('.toggle-switch').should('have.length', 7)
  })

  it('toggles a setting', () => {
    cy.get('.header-avatar').click()

    // 1. toggle a la primera opción
    cy.get('.toggle-switch').first().click()
    // 2. estado default era "on", ahora debe ser "off"
    // se usan defaults porque el back-end aún está en local
    cy.get('.toggle-switch').first().should('have.class', 'off')
  })
})