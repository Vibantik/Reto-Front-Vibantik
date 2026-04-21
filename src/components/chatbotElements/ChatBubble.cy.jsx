import React from 'react'
import ChatBubble from './ChatBubble'

describe('<ChatBubble />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<ChatBubble />)
  })
})