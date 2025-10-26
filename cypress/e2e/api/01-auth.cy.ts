/// <reference types="cypress" />

describe('Authentication API', () => {
  const apiUrl = Cypress.env('apiUrl');
  let testUser: any;

  before(() => {
    cy.fixture('users').then((users) => {
      testUser = {
        ...users.customer,
        email: `test-${Date.now()}@example.com`, // Unique email for each test run
      };
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new customer successfully', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/register`,
        body: testUser,
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('user');
        expect(response.body.data.user).to.have.property('email', testUser.email);
        expect(response.body.data.user).to.have.property('role', 'customer');
        expect(response.body.data.user).to.not.have.property('password');
      });
    });

    it('should fail to register with duplicate email', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/register`,
        body: testUser,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(409);
        expect(response.body).to.have.property('status', 'error');
        expect(response.body.message).to.include('already exists');
      });
    });

    it('should fail to register with invalid email', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/register`,
        body: {
          ...testUser,
          email: 'invalid-email',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to register with weak password', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/register`,
        body: {
          ...testUser,
          email: `weak-${Date.now()}@example.com`,
          password: '123',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to register without required fields', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/register`,
        body: {
          email: `missing-${Date.now()}@example.com`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('accessToken');
        expect(response.body.data).to.have.property('refreshToken');
        expect(response.body.data).to.have.property('user');
        expect(response.body.data.user).to.have.property('email', testUser.email);
        expect(response.body.data.user).to.not.have.property('password');
      });
    });

    it('should fail to login with incorrect password', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: testUser.email,
          password: 'WrongPassword123!',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to login with non-existent email', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to login without credentials', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;

    before(() => {
      cy.login(testUser.email, testUser.password).then((token) => {
        accessToken = token;
      });
    });

    it('should get user profile with valid token', () => {
      cy.apiRequest('GET', '/auth/profile', accessToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('email', testUser.email);
        expect(response.body.data).to.have.property('name', testUser.name);
        expect(response.body.data).to.not.have.property('password');
      });
    });

    it('should fail to get profile without token', () => {
      cy.apiRequest('GET', '/auth/profile').then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to get profile with invalid token', () => {
      cy.apiRequest('GET', '/auth/profile', 'invalid-token').then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    before(() => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      }).then((response) => {
        refreshToken = response.body.data.refreshToken;
      });
    });

    it('should refresh access token with valid refresh token', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/refresh`,
        body: {
          refreshToken,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('accessToken');
      });
    });

    it('should fail to refresh with invalid token', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/refresh`,
        body: {
          refreshToken: 'invalid-refresh-token',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    before(() => {
      cy.login(testUser.email, testUser.password).then((token) => {
        accessToken = token;
      });
    });

    it('should logout successfully with valid token', () => {
      cy.apiRequest('POST', '/auth/logout', accessToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
      });
    });

    it('should fail to logout without token', () => {
      cy.apiRequest('POST', '/auth/logout').then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    let accessToken: string;
    const newPassword = 'NewPassword123!@#';

    beforeEach(() => {
      cy.login(testUser.email, testUser.password).then((token) => {
        accessToken = token;
      });
    });

    it('should change password successfully', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/change-password`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          currentPassword: testUser.password,
          newPassword: newPassword,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
      });

      // Verify can login with new password
      cy.login(testUser.email, newPassword).then((token) => {
        expect(token).to.be.a('string');
      });

      // Change back to original password for other tests
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/change-password`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          currentPassword: newPassword,
          newPassword: testUser.password,
        },
      });
    });

    it('should fail to change password with incorrect current password', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/change-password`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          currentPassword: 'WrongPassword123!',
          newPassword: newPassword,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });
});
