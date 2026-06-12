import React from 'react'
import Chatbot from '../../src/components/Chatbot'
import { AgentRefreshProvider } from '../../src/utils/agentRefreshContext'

describe('<Chatbot />', () => {
  it('renders', () => {
    cy.mount(<AgentRefreshProvider><Chatbot /></AgentRefreshProvider>)
  })

  // Test 1: al abrir página esta cerrado
  it('cuando open=false, chat cerrado', () => {
    cy.mount(<AgentRefreshProvider><Chatbot open={false} /></AgentRefreshProvider>)
    cy.get('.chatbot-overlay').should('not.exist')
  })

  // Test 2: si se abre, aparece en la página
  it('cuando open=true, chat abierto', () => {
    cy.mount(<AgentRefreshProvider><Chatbot open={true} /></AgentRefreshProvider>)
    cy.get('.chatbot-panel').should('be.visible')
  })

   // Test 3: existe campo de texto con placeholder
  it('input listo en chatbot', () => {
    cy.mount(<AgentRefreshProvider><Chatbot open={true} /></AgentRefreshProvider>)
    cy.get('input.chatbot-input')
      .should('exist')
      .and('have.attr', 'placeholder', 'Escribe aquí...')
  })
})

