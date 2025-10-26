/// <reference types="cypress" />

// ***********************************************
// Custom commands for API testing
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login and get access token
       * @example cy.login('customer@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<string>;

      /**
       * Custom command to register a new user
       * @example cy.register({ name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'customer' })
       */
      register(userData: {
        name: string;
        email: string;
        password: string;
        role?: string;
      }): Chainable<any>;

      /**
       * Custom command to make authenticated API request
       * @example cy.apiRequest('GET', '/equipment', accessToken)
       */
      apiRequest(
        method: string,
        url: string,
        token?: string,
        body?: any
      ): Chainable<any>;

      /**
       * Custom command to create equipment (admin only)
       */
      createEquipment(equipmentData: any, token: string): Chainable<any>;

      /**
       * Custom command to create a booking
       */
      createBooking(bookingData: any, token: string): Chainable<any>;

      /**
       * Custom command to clean up test data
       */
      cleanupTestData(): Chainable<void>;
    }
  }
}

/**
 * Login command - returns access token
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  const apiUrl = Cypress.env('apiUrl');

  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email, password },
      failOnStatusCode: false,
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('accessToken');
      return response.body.data.accessToken;
    });
});

/**
 * Register command - creates a new user
 */
Cypress.Commands.add('register', (userData) => {
  const apiUrl = Cypress.env('apiUrl');

  return cy.request({
    method: 'POST',
    url: `${apiUrl}/auth/register`,
    body: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'customer',
    },
    failOnStatusCode: false,
  });
});

/**
 * Authenticated API request command
 */
Cypress.Commands.add('apiRequest', (method, url, token, body = null) => {
  const apiUrl = Cypress.env('apiUrl');
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestOptions: any = {
    method,
    url: `${apiUrl}${url}`,
    headers,
    failOnStatusCode: false,
  };

  if (body) {
    requestOptions.body = body;
  }

  return cy.request(requestOptions);
});

/**
 * Create equipment command (admin only)
 */
Cypress.Commands.add('createEquipment', (equipmentData, token) => {
  const apiUrl = Cypress.env('apiUrl');

  return cy.request({
    method: 'POST',
    url: `${apiUrl}/equipment`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: equipmentData,
    failOnStatusCode: false,
  });
});

/**
 * Create booking command
 */
Cypress.Commands.add('createBooking', (bookingData, token) => {
  const apiUrl = Cypress.env('apiUrl');

  return cy.request({
    method: 'POST',
    url: `${apiUrl}/bookings`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: bookingData,
    failOnStatusCode: false,
  });
});

/**
 * Cleanup test data (if needed)
 */
Cypress.Commands.add('cleanupTestData', () => {
  // This can be implemented to clean up test data from the database
  // For now, it's a placeholder
  cy.log('Cleanup test data');
});

export {};
