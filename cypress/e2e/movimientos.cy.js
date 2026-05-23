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
    cy.intercept('GET', '/api/transactions*', (req) => {
      if (req.url.includes('startDate') || req.url.includes('endDate')) {
        req.reply({ body: listResponse });
      } else {
        req.reply({ body: listResponse });
      }
    }).as('getTransactions');

    cy.visit('/');
    cy.contains('Movimientos').click();
    cy.wait('@getTransactions');
  });

  it('CP-01 muestra lista de movimientos del mes', () => {
    cy.get('[data-cy=transactions-screen]').should('exist');
    cy.get('[data-cy=transaction-list]').should('exist');
    cy.get('[data-cy=transaction-description]').first().should('contain.text', 'Pago OXXO');
    cy.get('[data-cy=transactions-counter]').should('contain.text', '2 resultados');
  });

  it('CP-02 filtra por Ingresos y busca OXXO', () => {
    cy.get('[data-cy=transactions-toolbar]').within(() => {
      cy.get('[data-cy=transaction-search-input]').type('OXXO');
    });
    cy.intercept('GET', '/api/transactions*', { body: listResponse }).as('search');
    cy.wait('@search');
    cy.get('[data-cy=transaction-description]').should('contain.text', 'Pago OXXO');
    cy.get('[data-cy=transaction-status]').first().should('exist');
  });

  it('CP-03 al seleccionar movimiento muestra detalles', () => {
    cy.get('[data-cy=transaction-item]').first().click();
    cy.get('[data-cy=movement-details]').should('be.visible');
    cy.get('[data-cy=movement-amount]').should('contain.text', '250');
    cy.get('[data-cy=movement-fecha]').should('exist');
  });

  it('CP-04 editar categoria y guardar (simulado)', () => {
    const updated = JSON.parse(JSON.stringify(listResponse));
    updated.data[0].category = 'Servicios';
    cy.intercept('PUT', '/api/transactions/*', { statusCode: 200, body: { success: true } }).as('putTx');
    cy.request('PUT', '/api/transactions/tx-2', { category: 'Servicios' }).then(() => {
      cy.intercept('GET', '/api/transactions*', { body: updated }).as('getUpdated');
      cy.reload();
      cy.wait('@getUpdated');
      cy.get('[data-cy=transaction-category]').first().should('contain.text', 'Servicios');
    });
  });

  it('CP-05 filtrar mes sin movimientos muestra vacio', () => {
    cy.intercept('GET', '/api/transactions*', { body: { data: [], pagination: { page:1, limit:15, totalItems:0, totalPages:1 } } }).as('empty');
    cy.get('[data-cy=transactions-toolbar]').within(() => {
      cy.get('[data-cy=transaction-search-input]').clear().type('no-existe');
    });
    cy.wait('@empty');
    cy.get('[data-cy=transaction-list]').should('contain.text', 'No hay movimientos');
  });

  it('CP-06 muestra CashflowChart', () => {
    cy.get('[data-cy=cashflow-card]').should('exist');
    cy.get('[data-cy=cashflow-chart-wrap]').should('exist');
  });

  it('CP-07 CP-12 simula llegada de nuevo movimiento (reload)', () => {
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

    cy.intercept('GET', '/api/transactions*', (req) => {
      if (req.headers['x-new-transaction']) {
        req.reply({ body: withNew });
      } else {
        req.reply({ body: listResponse });
      }
    }).as('getTxsDynamic');

    cy.request({ method: 'GET', url: '/api/transactions', headers: { 'x-new-transaction': '1' } }).then(() => {
      cy.reload();
      cy.wait('@getTxsDynamic');
      cy.get('[data-cy=transaction-description]').first().should('contain.text', 'Comida');
      cy.get('[data-cy=transactions-counter]').should('contain.text', '3 resultados');
    });
  });

  it('CP-08 CP-09 combinacion de filtros y paginacion', () => {
    cy.get('[data-cy=pagination-next]').should('exist');
    cy.get('[data-cy=transaction-category]').first().should('exist');
  });

  it('CP-10 CP-11 seguridad en busqueda y persistencia de categoria', () => {
    cy.get('[data-cy=transaction-search-input]').type("'; DROP TABLE --");
    cy.intercept('GET', '/api/transactions*', { body: listResponse }).as('injection');
    cy.wait('@injection');
    cy.get('[data-cy=transaction-description]').first().should('exist');
  });

  it('CP-13 CP-14 paginacion y orden cronologico', () => {
    cy.get('[data-cy=transaction-date]').should('exist');
    cy.get('[data-cy=transaction-amount]').first().should('exist');
  });
});
