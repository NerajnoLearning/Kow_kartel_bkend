/// <reference types="cypress" />

describe('Equipment API', () => {
  const apiUrl = Cypress.env('apiUrl');
  let customerToken: string;
  let adminToken: string;
  let testEquipment: any;
  let createdEquipmentId: string;

  before(() => {
    // Create and login as customer
    const customerEmail = `customer-${Date.now()}@example.com`;
    cy.register({
      name: 'Test Customer',
      email: customerEmail,
      password: 'Customer123!@#',
      role: 'customer',
    });
    cy.login(customerEmail, 'Customer123!@#').then((token) => {
      customerToken = token;
    });

    // Create and login as admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    cy.register({
      name: 'Test Admin',
      email: adminEmail,
      password: 'Admin123!@#',
      role: 'admin',
    });
    cy.login(adminEmail, 'Admin123!@#').then((token) => {
      adminToken = token;
    });

    // Load test equipment data
    cy.fixture('equipment').then((equipment) => {
      testEquipment = equipment.commercialOven;
    });
  });

  describe('POST /api/v1/equipment (Admin Only)', () => {
    it('should create equipment successfully as admin', () => {
      cy.createEquipment(testEquipment, adminToken).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('name', testEquipment.name);
        expect(response.body.data).to.have.property('category', testEquipment.category);
        expect(response.body.data).to.have.property('dailyRate', testEquipment.dailyRate);
        expect(response.body.data).to.have.property('_id');
        createdEquipmentId = response.body.data._id;
      });
    });

    it('should fail to create equipment as customer', () => {
      cy.createEquipment(
        {
          ...testEquipment,
          name: 'Another Equipment',
        },
        customerToken
      ).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to create equipment without authentication', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/equipment`,
        body: testEquipment,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should fail to create equipment with invalid data', () => {
      cy.createEquipment(
        {
          name: 'Test',
          // Missing required fields
        },
        adminToken
      ).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to create equipment with negative daily rate', () => {
      cy.createEquipment(
        {
          ...testEquipment,
          name: 'Negative Rate Equipment',
          dailyRate: -50,
        },
        adminToken
      ).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('GET /api/v1/equipment', () => {
    it('should get all equipment without authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('data');
        expect(response.body.data.data).to.be.an('array');
        expect(response.body.data).to.have.property('pagination');
      });
    });

    it('should filter equipment by category', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment?category=ovens`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data.data).to.be.an('array');
        if (response.body.data.data.length > 0) {
          response.body.data.data.forEach((item: any) => {
            expect(item.category).to.eq('ovens');
          });
        }
      });
    });

    it('should filter equipment by status', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment?status=available`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data.data).to.be.an('array');
        if (response.body.data.data.length > 0) {
          response.body.data.data.forEach((item: any) => {
            expect(item.status).to.eq('available');
          });
        }
      });
    });

    it('should paginate equipment list', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment?page=1&limit=5`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data.pagination).to.have.property('page', 1);
        expect(response.body.data.pagination).to.have.property('limit', 5);
        expect(response.body.data.data.length).to.be.at.most(5);
      });
    });
  });

  describe('GET /api/v1/equipment/:id', () => {
    it('should get equipment by ID', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/${createdEquipmentId}`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('_id', createdEquipmentId);
        expect(response.body.data).to.have.property('name');
        expect(response.body.data).to.have.property('category');
      });
    });

    it('should return 404 for non-existent equipment', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/507f1f77bcf86cd799439011`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should return 400 for invalid equipment ID format', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/invalid-id`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
      });
    });
  });

  describe('GET /api/v1/equipment/categories', () => {
    it('should get all equipment categories', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/categories`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.be.greaterThan(0);
      });
    });
  });

  describe('GET /api/v1/equipment/search', () => {
    it('should search equipment by name', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/search?q=oven`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.be.an('array');
      });
    });

    it('should return empty array for non-matching search', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/search?q=nonexistentequipment12345`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.eq(0);
      });
    });
  });

  describe('PUT /api/v1/equipment/:id (Admin Only)', () => {
    it('should update equipment successfully as admin', () => {
      cy.apiRequest(
        'PUT',
        `/equipment/${createdEquipmentId}`,
        adminToken,
        {
          name: 'Updated Commercial Oven',
          dailyRate: 175,
        }
      ).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('name', 'Updated Commercial Oven');
        expect(response.body.data).to.have.property('dailyRate', 175);
      });
    });

    it('should fail to update equipment as customer', () => {
      cy.apiRequest(
        'PUT',
        `/equipment/${createdEquipmentId}`,
        customerToken,
        {
          name: 'Customer Update Attempt',
        }
      ).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should return 404 when updating non-existent equipment', () => {
      cy.apiRequest(
        'PUT',
        `/equipment/507f1f77bcf86cd799439011`,
        adminToken,
        {
          name: 'Does Not Exist',
        }
      ).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('PATCH /api/v1/equipment/:id/status (Admin Only)', () => {
    it('should update equipment status successfully', () => {
      cy.apiRequest(
        'PATCH',
        `/equipment/${createdEquipmentId}/status`,
        adminToken,
        {
          status: 'maintenance',
        }
      ).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('status', 'maintenance');
      });

      // Change back to available
      cy.apiRequest(
        'PATCH',
        `/equipment/${createdEquipmentId}/status`,
        adminToken,
        {
          status: 'available',
        }
      );
    });

    it('should fail to update status as customer', () => {
      cy.apiRequest(
        'PATCH',
        `/equipment/${createdEquipmentId}/status`,
        customerToken,
        {
          status: 'retired',
        }
      ).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    it('should fail with invalid status value', () => {
      cy.apiRequest(
        'PATCH',
        `/equipment/${createdEquipmentId}/status`,
        adminToken,
        {
          status: 'invalid-status',
        }
      ).then((response) => {
        expect(response.status).to.eq(400);
      });
    });
  });

  describe('GET /api/v1/equipment/:id/availability', () => {
    it('should check equipment availability for date range', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);

      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/${createdEquipmentId}/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('available');
        expect(response.body.data.available).to.be.a('boolean');
      });
    });

    it('should fail without required date parameters', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/${createdEquipmentId}/availability`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
      });
    });
  });

  describe('DELETE /api/v1/equipment/:id (Admin Only)', () => {
    it('should fail to delete equipment as customer', () => {
      cy.apiRequest('DELETE', `/equipment/${createdEquipmentId}`, customerToken).then(
        (response) => {
          expect(response.status).to.eq(403);
        }
      );
    });

    it('should delete equipment successfully as admin', () => {
      cy.apiRequest('DELETE', `/equipment/${createdEquipmentId}`, adminToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('status', 'success');
        }
      );

      // Verify equipment is deleted
      cy.request({
        method: 'GET',
        url: `${apiUrl}/equipment/${createdEquipmentId}`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it('should return 404 when deleting non-existent equipment', () => {
      cy.apiRequest('DELETE', `/equipment/507f1f77bcf86cd799439011`, adminToken).then(
        (response) => {
          expect(response.status).to.eq(404);
        }
      );
    });
  });
});
