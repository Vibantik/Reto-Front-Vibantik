import React from 'react'
import Chatbot from '../../src/components/Chatbot'

describe('<Chatbot />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Chatbot />)
  })

  // Test 1: al abrir página esta cerrado
  it('cuando open=false, chat cerrado', () => {
    cy.mount(<Chatbot open={false} />)
    cy.get('.chatbot-overlay').should('not.exist')
  })

  // Test 2: si se abre, aparece en la página
  it('cuando open=true, chat abierto', () => {
    cy.mount(<Chatbot open={true} />)
    cy.get('.chatbot-panel').should('be.visible')
  })

   // Test 3: existe campo de texto con placeholder
  it('input listo en chatbot', () => {
    cy.mount(<Chatbot open={true} />)
    cy.get('input.chatbot-input')
      .should('exist')
      .and('have.attr', 'placeholder', 'Escribe aquí...')
  })
})

