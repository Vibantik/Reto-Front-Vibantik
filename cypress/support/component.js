// cypress/support/component.js
import './commands'
import { mount } from 'cypress/react' 
Cypress.Commands.add('mount', mount)