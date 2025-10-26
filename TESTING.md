# Testing Guide

## 🎯 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Run All Tests
```bash
npm test
```

## 📊 Test Suites

### All Tests (Recommended)
```bash
npm test
```

### Individual Test Suites
```bash
# Authentication Tests
npm run test:auth

# Equipment Management Tests
npm run test:equipment

# Booking Workflow Tests
npm run test:bookings

# Payment Processing Tests
npm run test:payments
```

### Interactive Mode (Cypress UI)
```bash
npm run test:open
```

### Headed Mode (See browser execution)
```bash
npm run test:headed
```

## 🧪 Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| Authentication | 15+ tests | ✅ Complete |
| Equipment | 20+ tests | ✅ Complete |
| Bookings | 25+ tests | ✅ Complete |
| Payments | 15+ tests | ✅ Complete |
| **Total** | **75+ tests** | **✅ Ready** |

## 📝 What's Tested

### Authentication Module
- ✅ User registration (all roles)
- ✅ Login/logout
- ✅ Token refresh
- ✅ Profile management
- ✅ Password change
- ✅ Email verification
- ✅ Password reset
- ✅ Input validation
- ✅ Error handling

### Equipment Module
- ✅ CRUD operations
- ✅ Role-based access control
- ✅ Equipment search & filtering
- ✅ Category management
- ✅ Status updates
- ✅ Availability checking
- ✅ Pagination & sorting
- ✅ Image uploads (endpoint testing)
- ✅ Authorization checks

### Bookings Module
- ✅ Booking creation
- ✅ Booking lifecycle (pending → confirmed → active → completed)
- ✅ Date validation
- ✅ Conflict detection
- ✅ Price calculation
- ✅ Cancellation policy
- ✅ Availability checks
- ✅ Admin operations
- ✅ Customer operations
- ✅ Authorization checks

### Payments Module
- ✅ Payment intent creation
- ✅ Payment retrieval
- ✅ Revenue tracking
- ✅ Refund processing (admin)
- ✅ Webhook validation
- ✅ Stripe integration (API structure)
- ✅ Authorization checks

## 🔧 Test Configuration

Tests are configured in `cypress.config.ts`:

```typescript
{
  baseUrl: 'http://localhost:5000',
  apiUrl: 'http://localhost:5000/api/v1',
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000
}
```

## 📁 Test Structure

```
cypress/
├── e2e/api/
│   ├── 01-auth.cy.ts       # Authentication tests
│   ├── 02-equipment.cy.ts  # Equipment tests
│   ├── 03-bookings.cy.ts   # Booking tests
│   └── 04-payments.cy.ts   # Payment tests
├── fixtures/
│   ├── users.json          # Test user data
│   └── equipment.json      # Test equipment data
└── support/
    ├── commands.ts         # Custom commands
    └── e2e.ts             # Global config
```

## 🚨 Before Running Tests

1. **Environment Setup**: Ensure `.env` file has correct MongoDB connection
2. **Database**: Use a test database (recommended)
3. **Server Running**: Backend must be running on port 5000
4. **Stripe Keys**: Set test Stripe keys in `.env`

### Recommended .env for Testing
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kitchenonwheels_test
JWT_SECRET=test-jwt-secret-key
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_test_webhook_secret
```

## 🐛 Troubleshooting

### Tests Failing?

1. **Check server is running**:
   ```bash
   curl http://localhost:5000/api/v1
   ```

2. **Verify Cypress installation**:
   ```bash
   npm run cypress:verify
   ```

3. **Clear Cypress cache**:
   ```bash
   npx cypress cache clear
   npx cypress install
   ```

4. **Check database connection**:
   - Ensure MongoDB is running
   - Verify connection string in `.env`

5. **View detailed logs**:
   ```bash
   npm run test:headed
   ```

### Common Issues

- **Port 5000 in use**: Change PORT in `.env` and `cypress.config.ts`
- **Database connection**: Verify MongoDB is running
- **Timeout errors**: Increase timeout in `cypress.config.ts`
- **Authentication errors**: Check JWT_SECRET matches between server and tests

## 📊 Test Results

After running tests, check:
- Console output for test results
- `cypress/screenshots/` for failure screenshots
- Cypress UI for detailed test execution

## 🎓 Writing New Tests

See `cypress/README.md` for detailed guide on writing new tests.

### Quick Example
```typescript
describe('New Feature API', () => {
  let token: string;

  before(() => {
    cy.login('test@example.com', 'password').then(t => token = t);
  });

  it('should perform action', () => {
    cy.apiRequest('GET', '/endpoint', token).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
```

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io)
- [API Testing Guide](https://docs.cypress.io/guides/guides/network-requests)
- [Custom Commands](./cypress/README.md)

## ✅ CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Cypress Tests
  run: |
    npm run dev &
    sleep 10
    npm test
```

## 🎯 Next Steps

1. ✅ All core API endpoints tested
2. ⏳ Add customer/report module tests (if needed)
3. ⏳ Integration with CI/CD pipeline
4. ⏳ Performance testing
5. ⏳ Load testing
