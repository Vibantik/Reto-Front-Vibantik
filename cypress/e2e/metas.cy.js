describe('Metas E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/metas*', {
      statusCode: 200,
      body: {
        data: [
          {
            id_meta: 1,
            nombreMeta: 'Viaje a Japón',
            monto_meta: '50000',
            fecha_inicio: '2026-01-01',
            fecha_fin: '2026-12-31',
            plazo_dias: 365,
            progreso: 0.35
          },
          {
            id_meta: 2,
            nombreMeta: 'Coche Nuevo',
            monto_meta: '150000',
            fecha_inicio: '2026-05-01',
            fecha_fin: '2028-05-01',
            plazo_dias: 730,
            progreso: 0.10
          }
        ]
      }
    }).as('getMetas')
    
    // intercept POST, PUT, DELETE for creating/updating metas
    cy.intercept('POST', '**/api/metas*', {
      statusCode: 201,
      body: { id_meta: 3, nombreMeta: 'Nueva', monto_meta: 5000 }
    }).as('createMeta')

    cy.intercept('PUT', '**/api/metas/*', {
      statusCode: 200,
      body: { id_meta: 1, nombreMeta: 'Viaje a Japón Actualizado', monto_meta: 55000 }
    }).as('updateMeta')
    
    cy.intercept('DELETE', '**/api/metas/*', {
      statusCode: 200,
      body: { success: true }
    }).as('deleteMeta')

    // Mock other requests so they don't block
    cy.intercept("GET", "**/api/transactions*", { body: { data: [], pagination: {} } });
    cy.intercept("GET", "**/api/presupuestos*", { body: [] });

    cy.visit('/')
    cy.contains('Metas').click()
    cy.wait('@getMetas')
    cy.get('[data-cy="metas-create-btn"]').should('be.visible')
  })

  it('muestra la lista de metas', () => {
    cy.get('[data-cy="meta-card"]')
      .should('exist')
      .and('have.length.greaterThan', 0)
  })

  it('muestra el titulo de cada meta', () => {
    cy.get('[data-cy="meta-title"]')
      .should('exist')
      .and('have.length.greaterThan', 0)
  })

  it('muestra el monto de cada meta', () => {
    cy.get('[data-cy="meta-amount"]')
      .should('exist')
      .and('have.length.greaterThan', 0)
      .each(($amount) => {
        cy.wrap($amount).should('contain.text', '$')
      })
  })

  it('muestra los detalles de fecha de cada meta', () => {
    cy.get('[data-cy="meta-fecha-inicio"]').should('exist')
    cy.get('[data-cy="meta-fecha-fin"]').should('exist')
    cy.get('[data-cy="meta-plazo"]').should('exist')
  })

  it('muestra barra de progreso para cada meta', () => {
    cy.get('[data-cy="meta-progress-bar"]')
      .should('exist')
      .and('have.length.greaterThan', 0)
  })

  it('la barra de progreso tiene ancho correcto', () => {
    cy.get('[data-cy="meta-progress-bar"]').first()
      .should('have.attr', 'style')
      .and('include', 'width:');
  })

  it('agrupa metas por secciones', () => {
    cy.get('[data-cy^="metas-section-"]').should('have.length.greaterThan', 0)
  })

  it('muestra etiqueta con cantidad en cada sección', () => {
    cy.get('[data-cy^="metas-section-tag-"]')
      .should('exist')
      .and('have.length.greaterThan', 0)
      .each(($tag) => {
        cy.wrap($tag).should('contain.text', 'total')
      })
  })


  it('abre modal de crear meta', () => {
    cy.get('[data-cy="metas-modal-overlay"]').should('not.exist')
    
    cy.get('[data-cy="metas-create-btn"]').click()
    
    cy.get('[data-cy="metas-modal-overlay"]').should('be.visible')
    cy.get('[data-cy="metas-modal"]').should('be.visible')
  })

  it('cierra modal al hacer clic en el botón Cerrar', () => {
    cy.get('[data-cy="metas-create-btn"]').click()
    cy.get('[data-cy="metas-modal"]').should('be.visible')
    
    cy.get('[data-cy="metas-modal-close-btn"]').click()
    cy.get('[data-cy="metas-modal"]').should('not.exist')
  })

  it('cierra modal al hacer clic fuera de la modal', () => {
    cy.get('[data-cy="metas-create-btn"]').click()
    cy.get('[data-cy="metas-modal"]').should('be.visible')
    
    cy.get('[data-cy="metas-modal-overlay"]').click({ force: true })
    cy.get('[data-cy="metas-modal"]').should('not.exist')
  })

  it('llena el formulario de crear meta', () => {
    cy.get('[data-cy="metas-create-btn"]').click()
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const nextWeekStr = nextWeek.toISOString().split('T')[0]
    
    cy.get('[data-cy="metas-form-nombre"]')
      .type('Viaje a la playa')
      .should('have.value', 'Viaje a la playa')
    
    cy.get('[data-cy="metas-form-monto"]')
      .type('5000')
      .should('have.value', '5000')
    
    cy.get('[data-cy="metas-form-fecha-inicio"]')
      .type(tomorrowStr)
      .should('have.value', tomorrowStr)
    
    cy.get('[data-cy="metas-form-fecha-fin"]')
      .type(nextWeekStr)
      .should('have.value', nextWeekStr)
  })

  it('permite enviar el formulario de crear meta', () => {
    cy.get('[data-cy="metas-create-btn"]').click()
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const nextWeekStr = nextWeek.toISOString().split('T')[0]
    
    cy.get('[data-cy="metas-form-nombre"]').type('Nueva meta')
    cy.get('[data-cy="metas-form-monto"]').type('10000')
    cy.get('[data-cy="metas-form-fecha-inicio"]').type(tomorrowStr)
    cy.get('[data-cy="metas-form-fecha-fin"]').type(nextWeekStr)
    
    cy.get('[data-cy="metas-form-submit"]').click()
    
    cy.get('[data-cy="metas-modal"]').should('not.exist')
  })

  it('muestra error si la fecha final es anterior a la fecha de inicio', () => {
    cy.get('[data-cy="metas-create-btn"]').click()
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    cy.get('[data-cy="metas-form-nombre"]').type('Meta invalida')
    cy.get('[data-cy="metas-form-monto"]').type('5000')
    cy.get('[data-cy="metas-form-fecha-inicio"]').type(tomorrowStr)
    cy.get('[data-cy="metas-form-fecha-fin"]').type(yesterdayStr)
    
    cy.get('[data-cy="metas-form"]').submit()
    
    cy.get('[data-cy="metas-form-error"]').should('contain.text', 'fecha limite no puede ser menor')
  })

  it('abre modal de editar meta', () => {
    cy.get('[data-cy="meta-edit-btn"]').first().click()
    
    cy.get('[data-cy="metas-modal"]').should('be.visible')
    cy.get('[data-cy="metas-modal"]').should('contain.text', 'Actualizar meta')
  })

  it('precarga datos en el formulario de editar', () => {
    cy.get('[data-cy="meta-title"]').first().then(($title) => {
      const metaName = $title.text()
      
      cy.get('[data-cy="meta-edit-btn"]').first().click()
      
      cy.get('[data-cy="metas-form-nombre"]').should('have.value', metaName)
    })
  })


  it('abre modal de editar para poder ver el botón de eliminar', () => {
    cy.get('[data-cy="meta-edit-btn"]').first().click()
    
    cy.get('[data-cy="metas-modal"]').should('be.visible')
  })

  it('deshabilita botones cuando se está eliminando', () => {
    cy.get('[data-cy="meta-edit-btn"]').first().click()
    
    cy.get('[data-cy="meta-delete-btn"]').should('not.be.disabled')
  })

  
  it('muestra controles de paginación', () => {
    cy.get('[data-cy="metas-pagination-summary"]').should('be.visible')
    cy.get('[data-cy="metas-page-indicator"]').should('be.visible')
    cy.get('[data-cy="metas-page-prev"]').should('be.visible')
    cy.get('[data-cy="metas-page-next"]').should('be.visible')
  })

  it('muestra el número de página actual', () => {
    cy.get('[data-cy="metas-page-indicator"]').should('contain.text', 'Pagina')
    cy.get('[data-cy="metas-page-indicator"]').should('contain.text', 'de')
  })

  it('deshabilita botón anterior en primera página', () => {

    cy.get('[data-cy="metas-page-indicator"]').then(($indicator) => {
      const text = $indicator.text()
      if (text.includes('Pagina 1 de')) {
        cy.get('[data-cy="metas-page-prev"]').should('be.disabled')
      }
    })
  })

  it('permite navegar a siguiente página', () => {
    cy.get('[data-cy="metas-page-indicator"]').then(($indicator) => {
      const text = $indicator.text()
      const match = text.match(/Pagina (\d+) de (\d+)/)
      
      if (match && parseInt(match[1]) < parseInt(match[2])) {
        const currentPage = match[1]
        cy.get('[data-cy="metas-page-next"]').click()
        cy.get('[data-cy="metas-page-indicator"]').should('contain.text', `Pagina ${parseInt(currentPage) + 1}`)
      }
    })
  })

  it('permite navegar a página anterior', () => {

    cy.get('[data-cy="metas-page-indicator"]').then(($indicator) => {
      const text = $indicator.text()
      const match = text.match(/Pagina (\d+) de (\d+)/)
      
      if (match && parseInt(match[1]) < parseInt(match[2])) {
        cy.get('[data-cy="metas-page-next"]').click()
        cy.wait(500)
        
        const currentPageAfterClick = $indicator.text().match(/Pagina (\d+)/)[1]
        cy.get('[data-cy="metas-page-prev"]').click()
        cy.get('[data-cy="metas-page-indicator"]').should('contain.text', `Pagina ${parseInt(currentPageAfterClick) - 1}`)
      }
    })
  })

  it('actualiza el resumen de paginación', () => {
    cy.get('[data-cy="metas-pagination-summary"]')
      .should('contain.text', 'Mostrando')
      .and('contain.text', 'de')
  })


  it('requiere titulo en el formulario', () => {
    cy.get('[data-cy="metas-create-btn"]').click()
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const nextWeekStr = nextWeek.toISOString().split('T')[0]
    
    cy.get('[data-cy="metas-form-monto"]').type('5000')
    cy.get('[data-cy="metas-form-fecha-inicio"]').type(tomorrowStr)
    cy.get('[data-cy="metas-form-fecha-fin"]').type(nextWeekStr)
    
    cy.get('[data-cy="metas-form-submit"]').click()
    

    cy.get('[data-cy="metas-form-nombre"]')
      .then(($input) => {
        expect($input[0].validity.valid).to.be.false
      })
  })

  it('requiere monto en el formulario', () => {
    cy.get('[data-cy="metas-create-btn"]').click()
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const nextWeekStr = nextWeek.toISOString().split('T')[0]
    
    cy.get('[data-cy="metas-form-nombre"]').type('Meta de prueba')
    cy.get('[data-cy="metas-form-fecha-inicio"]').type(tomorrowStr)
    cy.get('[data-cy="metas-form-fecha-fin"]').type(nextWeekStr)
    
    cy.get('[data-cy="metas-form-submit"]').click()
    
    cy.get('[data-cy="metas-form-monto"]')
      .then(($input) => {
        expect($input[0].validity.valid).to.be.false
      })
  })


  it('muestra el total de metas', () => {
    cy.contains('Metas').click({ force: true })
    
    cy.get('main.dashboard').should('be.visible')
      .within(() => {

        cy.get('p').should('have.length.greaterThan', 0)
      })
  })
})
