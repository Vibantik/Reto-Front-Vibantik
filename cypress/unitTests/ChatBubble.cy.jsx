import React from 'react'
import ChatBubble from '../../src/components/chatbotElements/ChatBubble'

describe('<ChatBubble />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<ChatBubble />)
  })

  // Test 1: role="user" en clase correcta
  it('burbuja gris cuando usuario', () => {
    cy.mount(<ChatBubble role="user" content="Mi mensaje" />)
    // .should('have.class', className) checks for specific CSS classes
    cy.get('.chat-bubble').should('have.class', 'user')
  })

  // Test 2: role="bot"en clase correcta
  it('burbuja roja para cuando bot', () => {
    cy.mount(<ChatBubble role="bot" content="Mensaje del bot" />)
    cy.get('.chat-bubble').should('have.class', 'bot')
  })


})