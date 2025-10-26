/// <reference types="cypress" />

describe('Payments API', () => {
  const apiUrl = Cypress.env('apiUrl');
  let customerToken: string;
  let adminToken: string;
  let equipmentId: string;
  let bookingId: string;
  let paymentIntentId: string;

  before(() => {
    // Create and login as customer
    const customerEmail = `customer-payment-${Date.now()}@example.com`;
    cy.register({
      name: 'Payment Customer',
      email: customerEmail,
      password: 'Customer123!@#',
      role: 'customer',
    });
    cy.login(customerEmail, 'Customer123!@#').then((token) => {
      customerToken = token;
    });

    // Create and login as admin
    const adminEmail = `admin-payment-${Date.now()}@example.com`;
    cy.register({
      name: 'Payment Admin',
      email: adminEmail,
      password: 'Admin123!@#',
      role: 'admin',
    });
    cy.login(adminEmail, 'Admin123!@#').then((token) => {
      adminToken = token;
    });

    // Create test equipment and booking
    cy.fixture('equipment').then((equipment) => {
      cy.createEquipment(equipment.commercialMixer, adminToken).then((response) => {
        equipmentId = response.body.data._id;

        // Create a booking
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 10);

        cy.createBooking(
          {
            equipmentId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            deliveryAddress: '123 Payment Test Street',
          },
          customerToken
        ).then((bookingResponse) => {
          bookingId = bookingResponse.body.data._id;
        });
      });
    });
  });

  describe('POST /api/v1/payments/intent', () => {
    it('should create payment intent successfully', () => {
      cy.apiRequest(
        'POST',
        '/payments/intent',
        customerToken,
        {
          bookingId,
        }
      ).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('payment');
        expect(response.body.data).to.have.property('clientSecret');
        expect(response.body.data.payment).to.have.property('bookingId', bookingId);
        expect(response.body.data.payment).to.have.property('status', 'pending');
        expect(response.body.data.payment).to.have.property('stripePaymentIntentId');
        paymentIntentId = response.body.data.payment.stripePaymentIntentId;
      });
    });

    it('should return existing payment intent if already created', () => {
      cy.apiRequest(
        'POST',
        '/payments/intent',
        customerToken,
        {
          bookingId,
        }
      ).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data.payment).to.have.property('bookingId', bookingId);
        // Should be the same payment intent
        expect(response.body.data.payment.stripePaymentIntentId).to.eq(paymentIntentId);
      });
    });

    it('should fail to create payment intent for non-existent booking', () => {
      cy.apiRequest(
        'POST',
        '/payments/intent',
        customerToken,
        {
          bookingId: '507f1f77bcf86cd799439011',
        }
      ).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.have.property('status', 'error');
      });
    });

    it('should fail to create payment intent without authentication', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/payments/intent`,
        body: { bookingId },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should fail to create payment intent for someone else\'s booking', () => {
      // Create another customer
      const anotherCustomerEmail = `another-customer-${Date.now()}@example.com`;
      cy.register({
        name: 'Another Customer',
        email: anotherCustomerEmail,
        password: 'Customer123!@#',
        role: 'customer',
      });
      cy.login(anotherCustomerEmail, 'Customer123!@#').then((token) => {
        cy.apiRequest(
          'POST',
          '/payments/intent',
          token,
          {
            bookingId,
          }
        ).then((response) => {
          expect(response.status).to.eq(403);
          expect(response.body).to.have.property('status', 'error');
        });
      });
    });
  });

  describe('GET /api/v1/payments/booking/:bookingId', () => {
    it('should get payment by booking ID as owner', () => {
      cy.apiRequest('GET', `/payments/booking/${bookingId}`, customerToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('status', 'success');
          expect(response.body.data).to.have.property('bookingId', bookingId);
        }
      );
    });

    it('should get payment by booking ID as admin', () => {
      cy.apiRequest('GET', `/payments/booking/${bookingId}`, adminToken).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body.data).to.have.property('bookingId', bookingId);
        }
      );
    });

    it('should return 404 for booking without payment', () => {
      // Create a booking without payment
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 33);

      cy.createBooking(
        {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '456 Test Street',
        },
        customerToken
      ).then((bookingResponse) => {
        const newBookingId = bookingResponse.body.data._id;

        cy.apiRequest('GET', `/payments/booking/${newBookingId}`, customerToken).then(
          (response) => {
            expect(response.status).to.eq(404);
          }
        );
      });
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    let paymentId: string;

    before(() => {
      // Get the payment ID
      cy.apiRequest('GET', `/payments/booking/${bookingId}`, customerToken).then(
        (response) => {
          paymentId = response.body.data._id;
        }
      );
    });

    it('should get payment by ID as owner', () => {
      cy.apiRequest('GET', `/payments/${paymentId}`, customerToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('_id', paymentId);
      });
    });

    it('should get payment by ID as admin', () => {
      cy.apiRequest('GET', `/payments/${paymentId}`, adminToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.have.property('_id', paymentId);
      });
    });

    it('should return 404 for non-existent payment', () => {
      cy.apiRequest('GET', '/payments/507f1f77bcf86cd799439011', customerToken).then(
        (response) => {
          expect(response.status).to.eq(404);
        }
      );
    });
  });

  describe('GET /api/v1/payments (Admin Only)', () => {
    it('should get all payments as admin', () => {
      cy.apiRequest('GET', '/payments', adminToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.be.an('array');
      });
    });

    it('should fail to get all payments as customer', () => {
      cy.apiRequest('GET', '/payments', customerToken).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.have.property('status', 'error');
      });
    });
  });

  describe('GET /api/v1/payments/revenue/total (Admin Only)', () => {
    it('should get total revenue as admin', () => {
      cy.apiRequest('GET', '/payments/revenue/total', adminToken).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'success');
        expect(response.body.data).to.have.property('totalRevenue');
        expect(response.body.data.totalRevenue).to.be.a('number');
      });
    });

    it('should fail to get total revenue as customer', () => {
      cy.apiRequest('GET', '/payments/revenue/total', customerToken).then((response) => {
        expect(response.status).to.eq(403);
      });
    });
  });

  describe('POST /api/v1/payments/:id/refund (Admin Only)', () => {
    let refundPaymentId: string;

    before(() => {
      // Create a new booking and payment for refund testing
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 40);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 43);

      cy.createBooking(
        {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress: '789 Refund Test Street',
        },
        customerToken
      ).then((bookingResponse) => {
        const refundBookingId = bookingResponse.body.data._id;

        cy.apiRequest(
          'POST',
          '/payments/intent',
          customerToken,
          {
            bookingId: refundBookingId,
          }
        ).then((paymentResponse) => {
          refundPaymentId = paymentResponse.body.data.payment._id;
        });
      });
    });

    it('should fail to refund as customer', () => {
      cy.apiRequest(
        'POST',
        `/payments/${refundPaymentId}/refund`,
        customerToken,
        {
          reason: 'Test refund',
        }
      ).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    it('should fail to refund pending payment', () => {
      cy.apiRequest(
        'POST',
        `/payments/${refundPaymentId}/refund`,
        adminToken,
        {
          reason: 'Test refund',
        }
      ).then((response) => {
        // Should fail because payment is not succeeded
        expect(response.status).to.eq(400);
      });
    });

    it('should return 404 for non-existent payment refund', () => {
      cy.apiRequest(
        'POST',
        '/payments/507f1f77bcf86cd799439011/refund',
        adminToken,
        {
          reason: 'Test refund',
        }
      ).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should reject webhook without signature', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/payments/webhook`,
        body: {
          type: 'payment_intent.succeeded',
          data: {},
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
      });
    });

    it('should reject webhook with invalid signature', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/payments/webhook`,
        headers: {
          'stripe-signature': 'invalid-signature',
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: {},
        }),
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
      });
    });

    // Note: Testing actual Stripe webhook signatures requires Stripe test keys
    // and proper webhook event construction, which is beyond API testing scope
  });
});
