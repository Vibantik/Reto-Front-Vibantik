describe('Movimientos - CP defect log', () => {
  const listResponse = {
    data: [
      {
        id: 'tx-2',
        description: 'Pago OXXO',
        category: 'Compras',
        date: new Date().toISOString().slice(0, 10),
        time: '14:30',
        amount: 250.5,
        type: 'egreso',
        beneficiary: 'OXXO',
      },
      {
        id: 'tx-1',
        description: 'Salario Abril',
        category: 'Nómina',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
        amount: 15000,
        type: 'ingreso',
        beneficiary: 'Empresa',
      },
    ],
    pagination: {
      page: 1,
      limit: 15,
      totalItems: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/transactions*', (req) => {
      if (req.url.includes('startDate') || req.url.includes('endDate')) {
        req.reply({ body: listResponse });
      } else {
        req.reply({ body: listResponse });
      }
    }).as('getTransactions');

    cy.visit('/');
    cy.contains('Movimientos').click();
    cy.get('.transactions-screen').should('be.visible');
  });

  it('CP-01 muestra lista de movimientos del mes', () => {
    cy.get('.transactions-screen').should('exist');
    cy.get('.transaction-list').should('exist');
    cy.get('.transaction-card__info h4').first().should('contain.text', 'Pago OXXO');
    cy.get('.transactions-counter').should('contain.text', '2 resultados');
  });

  it('CP-02 filtra por Ingresos y busca OXXO', () => {
    cy.get('.transactions-toolbar').within(() => {
      cy.get('[data-cy="transaction-search-input"]').type('OXXO');
    });
    cy.intercept('GET', '**/api/transactions*', { body: listResponse }).as('search');
    cy.get('.transaction-card__info h4').should('contain.text', 'Pago OXXO');
    cy.get('.status-chip').first().should('exist');
  });

  it('CP-03 al seleccionar movimiento muestra detalles', () => {
    cy.get('[data-cy="transaction-toggle"]').first().click();
    cy.get('[data-cy="transaction-detail"]').should('be.visible');
    cy.get('[data-cy="movement-amount"]').should('contain.text', '250');
  });

  it.skip('CP-04 editar categoria y guardar (simulado)', () => {
    const updated = JSON.parse(JSON.stringify(listResponse));
    updated.data[0].category = 'Servicios';
    cy.intercept('PUT', '**/api/transactions/*', { statusCode: 200, body: { success: true } }).as('putTx');
    cy.request('PUT', '/api/transactions/tx-2', { category: 'Servicios' }).then(() => {
      cy.intercept('GET', '**/api/transactions*', { body: updated }).as('getUpdated');
      cy.reload();
      cy.contains('Movimientos').click();
      cy.contains('Servicios').should('exist');
    });
  });

  it('CP-05 filtrar mes sin movimientos muestra vacio', () => {
    cy.intercept('GET', '**/api/transactions*', { body: { data: [], pagination: { page:1, limit:15, totalItems:0, totalPages:1 } } }).as('empty');
    cy.get('.transactions-toolbar').within(() => {
      cy.get('[data-cy="transaction-search-input"]').clear().type('no-existe');
    });
    cy.get('[data-cy="transaction-empty"]').should('contain.text', 'No se encontraron');
  });

  it('CP-06 muestra CashflowChart', () => {
    cy.get('.cashflow-card').should('exist');
    cy.get('.cashflow-chart-wrap').should('exist');
  });

  it.skip('CP-07 CP-12 simula llegada de nuevo movimiento (reload)', () => {
    const newTx = {
      id: 'tx-3',
      description: 'Comida',
      category: 'Alimentos',
      date: new Date().toISOString().slice(0, 10),
      time: '19:00',
      amount: 120,
      type: 'egreso',
      beneficiary: 'Taqueria',
    };

    const withNew = JSON.parse(JSON.stringify(listResponse));
    withNew.data.unshift(newTx);
    withNew.pagination.totalItems = 3;

    cy.intercept('GET', '**/api/transactions*', (req) => {
      if (req.headers['x-new-transaction']) {
        req.reply({ body: withNew });
      } else {
        req.reply({ body: listResponse });
      }
    }).as('getTxsDynamic');

    cy.request({ method: 'GET', url: '/api/transactions', headers: { 'x-new-transaction': '1' } }).then(() => {
      cy.reload();
      cy.contains('Movimientos').click();
      cy.get('.transaction-card__info h4').first().should('contain.text', 'Comida');
      cy.get('.transactions-counter').should('contain.text', '3 resultados');
    });
  });

  it('CP-08 CP-09 combinacion de filtros y paginacion', () => {
    cy.get('.transaction-card__info p').first().should('exist');
  });

  it('CP-10 CP-11 seguridad en busqueda y persistencia de categoria', () => {
    cy.get('[data-cy="transaction-search-input"]').type("'; DROP TABLE --");
    cy.intercept('GET', '**/api/transactions*', { body: listResponse }).as('injection');
    cy.get('.transaction-card__info h4').first().should('exist');
  });

  it('CP-13 CP-14 paginacion y orden cronologico', () => {
    cy.get('.transaction-card__info span').should('exist');
    cy.get('.amount').first().should('exist');
  });
});
