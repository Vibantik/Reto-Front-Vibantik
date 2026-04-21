import React from 'react'
import Chatbot from './Chatbot'

describe('<Chatbot />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Chatbot />)
  })
  
})