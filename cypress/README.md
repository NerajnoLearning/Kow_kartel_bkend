# Cypress API Testing

This directory contains E2E API tests for the KitchenOnWheels backend using Cypress.

## 📁 Structure

```
cypress/
├── e2e/
│   └── api/
│       ├── 01-auth.cy.ts          # Authentication tests
│       ├── 02-equipment.cy.ts     # Equipment management tests
│       ├── 03-bookings.cy.ts      # Booking workflow tests
│       └── 04-payments.cy.ts      # Payment processing tests
├── fixtures/
│   ├── users.json                 # Test user data
│   └── equipment.json             # Test equipment data
├── support/
│   ├── commands.ts                # Custom Cypress commands
│   └── e2e.ts                     # Global test configuration
└── README.md                       # This file
```

## 🚀 Running Tests

### Prerequisites
1. Make sure the backend server is running:
   ```bash
   npm run dev
   ```

2. Ensure you have a test database configured (MongoDB)

### Run All Tests
```bash
npm test
```

### Run Tests in Interactive Mode
```bash
npm run test:open
```

### Run Tests in Headed Mode (see browser)
```bash
npm run test:headed
```

### Run Specific Test Suites
```bash
# Authentication tests only
npm run test:auth

# Equipment tests only
npm run test:equipment

# Booking tests only
npm run test:bookings

# Payment tests only
npm run test:payments
```

## 🔧 Custom Commands

The following custom commands are available for testing:

### `cy.login(email, password)`
Login and get access token
```typescript
cy.login('customer@test.com', 'password123').then((token) => {
  // Use token for authenticated requests
});
```

### `cy.register(userData)`
Register a new user
```typescript
cy.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'customer'
});
```

### `cy.apiRequest(method, url, token, body)`
Make authenticated API request
```typescript
cy.apiRequest('GET', '/equipment', accessToken).then((response) => {
  expect(response.status).to.eq(200);
});
```

### `cy.createEquipment(equipmentData, token)`
Create equipment (admin only)
```typescript
cy.createEquipment({
  name: 'Commercial Oven',
  category: 'ovens',
  dailyRate: 150
}, adminToken);
```

### `cy.createBooking(bookingData, token)`
Create a booking
```typescript
cy.createBooking({
  equipmentId: '123abc',
  startDate: new Date(),
  endDate: new Date(),
  deliveryAddress: '123 Test St'
}, customerToken);
```

## 📊 Test Coverage

### Authentication (01-auth.cy.ts)
- ✅ User registration (customer, admin, logistics)
- ✅ Login with valid/invalid credentials
- ✅ Get user profile
- ✅ Refresh access token
- ✅ Logout
- ✅ Change password
- ✅ Email verification
- ✅ Password reset

### Equipment (02-equipment.cy.ts)
- ✅ Create equipment (admin only)
- ✅ Get all equipment with filters
- ✅ Get equipment by ID
- ✅ Update equipment (admin only)
- ✅ Update equipment status (admin only)
- ✅ Delete equipment (admin only)
- ✅ Get equipment categories
- ✅ Search equipment
- ✅ Check equipment availability
- ✅ Authorization checks

### Bookings (03-bookings.cy.ts)
- ✅ Create booking
- ✅ Get all bookings (filtered)
- ✅ Get booking by ID
- ✅ Update booking
- ✅ Confirm booking (admin only)
- ✅ Start booking (admin only)
- ✅ Complete booking (admin only)
- ✅ Cancel booking
- ✅ Delete booking (admin only)
- ✅ Check availability
- ✅ Date validation
- ✅ Conflict detection
- ✅ Authorization checks

### Payments (04-payments.cy.ts)
- ✅ Create payment intent
- ✅ Get payment by booking ID
- ✅ Get payment by ID
- ✅ Get all payments (admin only)
- ✅ Get total revenue (admin only)
- ✅ Refund payment (admin only)
- ✅ Webhook validation
- ✅ Authorization checks

## 🌐 Environment Variables

Tests use the following environment variables defined in `cypress.config.ts`:

- `baseUrl`: http://localhost:5000
- `apiUrl`: http://localhost:5000/api/v1

To modify these, edit the `cypress.config.ts` file.

## 📝 Writing New Tests

When adding new tests:

1. Create a new test file in `cypress/e2e/api/`
2. Follow the naming convention: `##-module-name.cy.ts`
3. Use TypeScript for better type safety
4. Utilize custom commands from `cypress/support/commands.ts`
5. Add test data to `cypress/fixtures/` if needed
6. Add a new npm script in `package.json` for running the specific test

### Example Test Structure

```typescript
/// <reference types="cypress" />

describe('Feature Name API', () => {
  const apiUrl = Cypress.env('apiUrl');
  let authToken: string;

  before(() => {
    // Setup: create users, login, etc.
    cy.login('test@example.com', 'password').then((token) => {
      authToken = token;
    });
  });

  describe('POST /api/v1/endpoint', () => {
    it('should perform action successfully', () => {
      cy.apiRequest('POST', '/endpoint', authToken, { data: 'value' })
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('data');
        });
    });

    it('should fail with invalid data', () => {
      cy.apiRequest('POST', '/endpoint', authToken, {})
        .then((response) => {
          expect(response.status).to.eq(400);
        });
    });
  });
});
```

## 🐛 Debugging

### View Test Results
Cypress automatically creates screenshots on test failure in `cypress/screenshots/`

### Enable Video Recording
Set `video: true` in `cypress.config.ts`

### Run in Headed Mode
```bash
npm run test:headed
```

### Use Cypress Test Runner
```bash
npm run test:open
```

## 🔍 Best Practices

1. **Test Isolation**: Each test should be independent and not rely on previous tests
2. **Unique Data**: Use timestamps or UUIDs for unique test data (e.g., emails)
3. **Clean State**: Reset or clean up test data when possible
4. **Clear Descriptions**: Use descriptive test names that explain what's being tested
5. **Error Scenarios**: Test both success and failure cases
6. **Authorization**: Always test authorization and authentication requirements
7. **Status Codes**: Verify correct HTTP status codes
8. **Response Structure**: Validate response body structure and required fields

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [API Testing with Cypress](https://docs.cypress.io/guides/guides/network-requests)
