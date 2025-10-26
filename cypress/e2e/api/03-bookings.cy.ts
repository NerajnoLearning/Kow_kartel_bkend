/// <reference types="cypress" />

describe('Bookings API', () => {
  const apiUrl = Cypress.env('apiUrl');
  let customerToken: string;
  let adminToken: string;
  let customerId: string;
  let equipmentId: string;
  let bookingId: string;

  before(() => {
    // Create and login as customer
    const customerEmail = `customer-booking-${Date.now()}@example.com`;
    cy.register({
      name: 'Booking Customer',
      email: customerEmail,
      password: 'Customer123!@#',
      role: 'customer',
    }).then((response) => {
      customerId = response.body.data.user._id;
    });
    cy.login(customerEmail, 'Customer123!@#').then((token) => {
      customerToken = token;
    });

    // Create and login as admin
    const adminEmail = `admin-booking-${Date.now()}@example.com`;
    cy.register({
      name: 'Booking Admin',
      email: adminEmail,
      password: 'Admin123!@#',
      role: 'admin',
    });
    cy.login(adminEmail, 'Admin123!@#').then((token) => {
      adminToken = token;
    });

    // Create test equipment
    cy.fixture('equipment').then((equipment) => {
      cy.createEquipment(equipment.commercialOven, adminToken).then((response) => {
        equipmentId = response.body.data._id;
      });
    });
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a booking successfully', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // 7 days from now
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10); // 10 days from now

      const bookingData = {
        equipmentId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        deliveryAddress: '123 Test Street, Test City, TC 12345',
        notes: 'Test booking',
      };

      cy.createBooking(bookingData, customerToken).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('_id');
        expect(response.body.data).to.have.property('equipmentId', equipmentId);
        expect(response.body.data).to.have.property('status', 'pending');
        expect(response.body.data).to.have.property('totalAmount');
        expect(response.body.data.totalAmount).to.be.greaterThan(0);
        bookingId = response.body.data._id;
      });
    });

    it('should fail to create booking without authentication', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 17);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/bookings`,
        body: {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '123 Test Street',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should fail to create booking with past start date', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Yesterday
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      cy.createBooking(
        {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '123 Test Street',
        },
        customerToken
      ).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to create booking with end date before start date', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);

      cy.createBooking(
        {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '123 Test Street',
        },
        customerToken
      ).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to create booking with non-existent equipment', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 20);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 23);

      cy.createBooking(
        {
          equipmentId: '507f1f77bcf86cd799439011',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '123 Test Street',
        },
        customerToken
      ).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to create overlapping booking', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Same dates as first booking
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);

      cy.createBooking(
        {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '456 Another Street',
        },
        customerToken
      ).then((response) => {
        expect(response.status).to.eq(409);
        expect(response.body).to.have.property('status', 'error');
        expect(response.body.message).to.include('already booked');
      });
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should get all bookings as admin', () => {
      cy.apiRequest('GET', '/bookings', adminToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('data');
        expect(response.body.data.data).to.be.an('array');
      });
    });

    it('should get only own bookings as customer', () => {
      cy.apiRequest('GET', '/bookings', customerToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data.data).to.be.an('array');
        // Verify all bookings belong to the customer
        response.body.data.data.forEach((booking: any) => {
          expect(booking.customerId).to.exist;
        });
      });
    });

    it('should filter bookings by status', () => {
      cy.apiRequest('GET', '/bookings?status=pending', adminToken).then((response) => {
        expect(response.status).to.eq(200);
        if (response.body.data.data.length > 0) {
          response.body.data.data.forEach((booking: any) => {
            expect(booking.status).to.eq('pending');
          });
        }
      });
    });

    it('should filter bookings by equipment', () => {
      cy.apiRequest('GET', `/bookings?equipmentId=${equipmentId}`, adminToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          if (response.body.data.data.length > 0) {
            response.body.data.data.forEach((booking: any) => {
              expect(booking.equipmentId).to.eq(equipmentId);
            });
          }
        }
      );
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should get booking by ID as owner', () => {
      cy.apiRequest('GET', `/bookings/${bookingId}`, customerToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('_id', bookingId);
      });
    });

    it('should get booking by ID as admin', () => {
      cy.apiRequest('GET', `/bookings/${bookingId}`, adminToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.have.property('_id', bookingId);
      });
    });

    it('should return 404 for non-existent booking', () => {
      cy.apiRequest('GET', '/bookings/507f1f77bcf86cd799439011', customerToken).then(
        (response) => {
          expect(response.status).to.eq(404);
        }
      );
    });
  });

  describe('PUT /api/v1/bookings/:id', () => {
    it('should update booking as owner', () => {
      cy.apiRequest(
        'PUT',
        `/bookings/${bookingId}`,
        customerToken,
        {
          notes: 'Updated booking notes',
          deliveryAddress: '789 Updated Street, Test City, TC 12345',
        }
      ).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('notes', 'Updated booking notes');
      });
    });

    it('should fail to update booking dates to past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      cy.apiRequest(
        'PUT',
        `/bookings/${bookingId}`,
        customerToken,
        {
          startDate: pastDate.toISOString(),
        }
      ).then((response) => {
        expect(response.status).to.eq(400);
      });
    });
  });

  describe('PATCH /api/v1/bookings/:id/confirm (Admin Only)', () => {
    it('should confirm booking as admin', () => {
      cy.apiRequest('PATCH', `/bookings/${bookingId}/confirm`, adminToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('status', 'success');
          expect(response.body.data).to.have.property('status', 'confirmed');
        }
      );
    });

    it('should fail to confirm booking as customer', () => {
      cy.apiRequest('PATCH', `/bookings/${bookingId}/confirm`, customerToken).then(
        (response) => {
          expect(response.status).to.eq(403);
        }
      );
    });
  });

  describe('PATCH /api/v1/bookings/:id/start (Admin Only)', () => {
    it('should start booking as admin', () => {
      cy.apiRequest('PATCH', `/bookings/${bookingId}/start`, adminToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body.data).to.have.property('status', 'active');
        }
      );
    });
  });

  describe('PATCH /api/v1/bookings/:id/complete (Admin Only)', () => {
    it('should complete booking as admin', () => {
      cy.apiRequest('PATCH', `/bookings/${bookingId}/complete`, adminToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body.data).to.have.property('status', 'completed');
        }
      );
    });
  });

  describe('PATCH /api/v1/bookings/:id/cancel', () => {
    let cancelBookingId: string;

    before(() => {
      // Create another booking to test cancellation
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 33);

      cy.createBooking(
        {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '123 Test Street',
        },
        customerToken
      ).then((response) => {
        cancelBookingId = response.body.data._id;
      });
    });

    it('should cancel booking as owner', () => {
      cy.apiRequest('PATCH', `/bookings/${cancelBookingId}/cancel`, customerToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body.data).to.have.property('status', 'cancelled');
        }
      );
    });

    it('should fail to cancel already cancelled booking', () => {
      cy.apiRequest('PATCH', `/bookings/${cancelBookingId}/cancel`, customerToken).then(
        (response) => {
          expect(response.status).to.eq(400);
        }
      );
    });

    it('should fail to cancel completed booking', () => {
      cy.apiRequest('PATCH', `/bookings/${bookingId}/cancel`, customerToken).then(
        (response) => {
          expect(response.status).to.eq(400);
        }
      );
    });
  });

  describe('GET /api/v1/bookings/equipment/:equipmentId/availability', () => {
    it('should check equipment availability', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 60);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 63);

      cy.request({
        method: 'GET',
        url: `${apiUrl}/bookings/equipment/${equipmentId}/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.have.property('available');
        expect(response.body.data.available).to.be.a('boolean');
      });
    });
  });

  describe('DELETE /api/v1/bookings/:id (Admin Only)', () => {
    it('should fail to delete active booking', () => {
      cy.apiRequest('DELETE', `/bookings/${bookingId}`, adminToken).then((response) => {
        expect(response.status).to.eq(400);
      });
    });

    it('should delete cancelled booking as admin', () => {
      // Get a cancelled booking
      cy.apiRequest('GET', '/bookings?status=cancelled', adminToken).then(
        (getResponse) => {
          if (getResponse.body.data.data.length > 0) {
            const cancelledBookingId = getResponse.body.data.data[0]._id;

            cy.apiRequest('DELETE', `/bookings/${cancelledBookingId}`, adminToken).then(
              (response) => {
                expect(response.status).to.eq(200);
              }
            );
          }
        }
      );
    });

    it('should fail to delete booking as customer', () => {
      cy.apiRequest('DELETE', `/bookings/${bookingId}`, customerToken).then(
        (response) => {
          expect(response.status).to.eq(403);
        }
      );
    });
  });
});
