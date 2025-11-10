# KitchenOnWheels Rentals – Backend

## 🎯 Project Status

**Current Phase:** Core Backend + Testing Complete ✅

**Completion Summary:**
- ✅ **6 Core Modules Complete** (Auth, Equipment, Bookings, Payments, Reports, Customers)
- ✅ **52 API Endpoints** fully implemented and tested
- ✅ **75+ E2E API Tests** with Cypress
- ✅ **WebSocket Real-time Updates** for bookings and payments
- ✅ **Stripe Payment Integration** with webhooks
- ✅ **AWS S3 File Uploads** for equipment images
- ✅ **MongoDB with Mongoose** for data persistence
- ✅ **Role-Based Access Control** (Customer, Admin, Logistics)
- ✅ **Comprehensive Test Suite** with Cypress (replaced Jest)
- ✅ **Redis Caching & Rate Limiting** for performance and security
- ⏳ **Remaining:** Email notifications (BullMQ), API documentation (Swagger)

## Project Overview

KitchenOnWheels Rentals Backend is the core API and data layer powering the KitchenOnWheels platform — a system for managing commercial kitchen equipment rentals.

### This backend handles:

- Authentication & authorization (multi-role: Customer, Admin, Logistics)
- Equipment management (CRUD operations)
- Booking, payments, and scheduling
- Reporting and analytics
- Real-time updates via WebSockets
- RESTful and scalable architecture for frontend integration

### Goals:

- Build a secure, modular, and maintainable backend using TypeScript
- Follow clean architecture principles and domain-driven design
- Provide well-documented, versioned APIs for frontend and future mobile apps

## Tech Stack (Aligned with FreeCodeCamp Core and Advanced Industry Practices)

| Category | freeCodeCamp Core | Advanced / Prioritized Tooling | Combined Stack Choice | Notes |
|----------|-------------------|--------------------------------|----------------------|-------|
| Runtime | Node.js | Node.js 20+ | Node.js 20+ | The standard JavaScript server environment. |
| Language | JavaScript | TypeScript 5+ | TypeScript 5+ | Prioritized for better scalability and developer experience. JavaScript is still the foundation. |
| Framework | Express.js | Express.js 5 | Express.js 5 | The minimal and widely-used framework for Node.js APIs. |
| Database | MongoDB (NoSQL) | PostgreSQL 14+ (Relational) | MongoDB | Using MongoDB with Mongoose ODM for flexible schema design and rapid development. |
| ORM/ODM | Mongoose ODM (for MongoDB) | Prisma ORM (for PostgreSQL) | Mongoose ODM | Mongoose provides a schema-based solution for MongoDB with built-in validation and middleware. |
| Authentication | JWT (Standard API practice) | JWT + Refresh Tokens | JWT + Refresh Tokens | Standard practice for secure stateless authentication. |
| Validation | Basic Validation | Zod | Zod | Powerful, TypeScript-first schema validation. |
| Caching/State | (General Caching) | Redis (for sessions & rate limiting) | Redis | Essential for scaling and managing sessions/limits. |
| File Storage | (General Cloud Storage) | AWS S3 (via aws-sdk) | AWS S3 | Industry-standard cloud object storage. |
| Queue & Jobs | (Not in core) | BullMQ (Redis-backed) | BullMQ | For handling asynchronous, long-running tasks. |
| API Docs | (Not in core) | Swagger (OpenAPI 3.0) | Swagger (OpenAPI 3.0) | Essential for documenting and testing the API. |
| Logging | (General logging) | Winston + Morgan | Winston + Morgan | Morgan for HTTP request logging; Winston for application and error logging. |
| Testing | Chai + Mocha + Supertest | Jest + Supertest | Cypress | Cypress for E2E API testing with 75+ tests covering all endpoints. Jest replaced with Cypress for better API testing experience. |
| Code Style | ESLint + Prettier | ESLint + Prettier | ESLint + Prettier | Industry standard for code quality and formatting. |
| Containerization | Docker | Docker + Docker Compose | Docker + Docker Compose | For consistent development and deployment environments. |
| Deployment | Heroku / Render / Cloud VMs | Vercel Functions / Render / AWS ECS | Render / AWS ECS / Vercel Functions | Modern, scalable deployment platforms. |

## Architecture Overview

The backend follows a Clean Architecture structure with the following layers:

- **Routes (Controllers)**: Handle HTTP requests/responses and delegate to services.
- **Services (Business Logic)**: Contain application logic independent of frameworks.
- **Repositories (Data Access)**: Encapsulate database interactions via Mongoose models.
- **Entities (Models)**: Define core domain models and types.
- **Middleware**: Handle authentication, logging, and validation globally.
- **Utils & Helpers**: Common utilities for validation, error handling, and formatting.

## API Modules

### ✅ Auth (COMPLETED)

**Endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/profile`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/change-password`

**Features:**
- ✅ JWT access & refresh tokens
- ✅ Role-based access control (Customer, Admin, Logistics)
- ✅ Password hashing (bcrypt)
- ✅ Email verification & password reset tokens
- ✅ Change password for authenticated users

### ✅ Equipment (COMPLETED)

**Endpoints:**
- `GET /api/v1/equipment` - Get all equipment (with filters)
- `GET /api/v1/equipment/categories` - Get all categories
- `GET /api/v1/equipment/search` - Search equipment
- `GET /api/v1/equipment/:id` - Get equipment by ID
- `GET /api/v1/equipment/:id/availability` - Check availability
- `POST /api/v1/equipment` (Admin) - Create equipment
- `PUT /api/v1/equipment/:id` (Admin) - Update equipment
- `PATCH /api/v1/equipment/:id/status` (Admin) - Update status
- `DELETE /api/v1/equipment/:id` (Admin) - Delete equipment
- `POST /api/v1/equipment/:id/images` (Admin) - Upload images
- `DELETE /api/v1/equipment/:id/images/:imageUrl` (Admin) - Delete image

**Features:**
- ✅ Full CRUD operations
- ✅ Category-based filtering and search
- ✅ Availability checking for date ranges
- ✅ S3 image uploads with Multer
- ✅ Status management (available, maintenance, retired)
- ✅ Pagination and sorting

### ✅ Bookings (COMPLETED)

**Endpoints:**
- `GET /api/v1/bookings` - Get all bookings (with filters)
- `GET /api/v1/bookings/:id` - Get booking by ID
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking
- `PATCH /api/v1/bookings/:id/confirm` (Admin) - Confirm booking
- `PATCH /api/v1/bookings/:id/start` (Admin) - Start booking
- `PATCH /api/v1/bookings/:id/complete` (Admin) - Complete booking
- `DELETE /api/v1/bookings/:id` (Admin) - Delete booking
- `GET /api/v1/bookings/equipment/:equipmentId/availability` - Check availability

**Features:**
- ✅ Date validation (past dates, date ranges, max 1 year ahead)
- ✅ Conflict resolution (overlapping bookings detection)
- ✅ Real-time updates via WebSocket
- ✅ Integration with payment gateway
- ✅ Automatic price calculation based on daily rate
- ✅ Booking lifecycle management (pending → confirmed → active → completed)
- ✅ Cancellation policy enforcement (24hr notice)

### ✅ Payments (COMPLETED)

**Endpoints:**
- `POST /api/v1/payments/intent` - Create payment intent
- `GET /api/v1/payments/booking/:bookingId` - Get payment by booking
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments/:id/refund` (Admin) - Refund payment
- `GET /api/v1/payments` (Admin) - Get all payments
- `GET /api/v1/payments/revenue/total` (Admin) - Get total revenue
- `POST /api/v1/payments/webhook` - Stripe webhook handler

**Features:**
- ✅ Secure Stripe integration with Payment Intents API
- ✅ Full and partial refunds
- ✅ Webhook signature validation
- ✅ Transaction logging and metadata
- ✅ Real-time payment status updates via WebSocket
- ✅ Automatic booking confirmation on successful payment
- ✅ Revenue tracking

### ✅ Reports (COMPLETED)

**Endpoints:**
- `GET /api/v1/reports/dashboard` - Dashboard summary
- `GET /api/v1/reports/revenue` - Revenue report
- `GET /api/v1/reports/utilization` - Equipment utilization report
- `GET /api/v1/reports/bookings` - Booking statistics
- `GET /api/v1/reports/customers` - Customer analytics
- `GET /api/v1/reports/popular-equipment` - Popular equipment
- `GET /api/v1/reports/comprehensive` - Comprehensive report

**Features:**
- ✅ Analytics aggregation with MongoDB aggregation pipeline
- ✅ Revenue breakdown by day/week/month
- ✅ Equipment utilization tracking
- ✅ Customer analytics (total, active, new this month)
- ✅ Top customers by spending
- ✅ Popular equipment rankings
- ✅ Dashboard summary with key metrics
- ⏳ CSV/PDF export (planned)
- ✅ Admin dashboard data integration

### ✅ Customers (COMPLETED)

**Endpoints:**
- `GET /api/v1/customers` (Admin) - Get all customers
- `GET /api/v1/customers/overview` (Admin) - Customer overview stats
- `GET /api/v1/customers/top` (Admin) - Top customers by spending
- `GET /api/v1/customers/:id` - Get customer profile
- `PUT /api/v1/customers/:id` - Update customer profile
- `DELETE /api/v1/customers/:id` (Admin) - Delete customer
- `GET /api/v1/customers/:id/stats` - Get customer statistics
- `GET /api/v1/customers/:id/bookings` - Get customer booking history

**Features:**
- ✅ Profile management (name, phone, address)
- ✅ Customer statistics (total bookings, active bookings, total spent)
- ✅ Booking history linkage
- ✅ Top customers tracking by revenue
- ✅ Search and filtering
- ✅ Pagination and sorting
- ⏳ Loyalty and referral tracking (planned)

## Project Structure

Legend: ✅ = Completed | ⏳ = Planned/Not Started

```
kitchenonwheels-backend/
├── src/
│   ├── ✅ app.ts                     # Express app initialization
│   ├── ✅ server.ts                  # App entry point with WebSocket initialization
│   │
│   ├── config/                       # Configuration files
│   │   ├── ✅ env.ts                 # Environment variables with Zod validation
│   │   ├── ✅ db.ts                  # MongoDB/Mongoose connection setup
│   │   ├── ✅ redis.ts               # Redis connection with cache utilities
│   │   └── ✅ logger.ts              # Winston logger setup
│   │
│   ├── routes/                       # Express routers
│   │   ├── ✅ auth.routes.ts         # Authentication routes
│   │   ├── ✅ equipment.routes.ts    # Equipment management routes
│   │   ├── ✅ booking.routes.ts      # Booking management routes
│   │   ├── ✅ payment.routes.ts      # Payment processing routes
│   │   ├── ✅ report.routes.ts       # Analytics and reporting routes
│   │   ├── ✅ customer.routes.ts     # Customer management routes
│   │   └── ✅ index.ts               # Main router combining all routes
│   │
│   ├── controllers/                  # Route handlers
│   │   ├── ✅ auth.controller.ts     # 9 endpoints (register, login, refresh, etc.)
│   │   ├── ✅ equipment.controller.ts # 11 endpoints (CRUD, search, images)
│   │   ├── ✅ booking.controller.ts  # 10 endpoints (CRUD, lifecycle management)
│   │   ├── ✅ payment.controller.ts  # 7 endpoints (intent, webhook, refunds)
│   │   ├── ✅ report.controller.ts   # 7 endpoints (dashboard, analytics)
│   │   └── ✅ customer.controller.ts # 8 endpoints (profile, stats, history)
│   │
│   ├── services/                     # Business logic
│   │   ├── ✅ auth.service.ts        # JWT, password reset, verification
│   │   ├── ✅ equipment.service.ts   # Equipment management with S3 + Redis caching
│   │   ├── ✅ booking.service.ts     # Conflict detection, pricing logic
│   │   ├── ✅ payment.service.ts     # Stripe integration, webhooks
│   │   ├── ✅ report.service.ts      # Analytics and reporting logic + Redis caching
│   │   └── ✅ customer.service.ts    # Customer profile and statistics
│   │
│   ├── repositories/                 # Data access via Mongoose models
│   │   ├── ✅ user.repository.ts     # User CRUD and authentication queries
│   │   ├── ✅ equipment.repository.ts # Equipment queries with filters
│   │   ├── ✅ booking.repository.ts  # Booking queries with conflict detection
│   │   ├── ✅ payment.repository.ts  # Payment tracking and revenue queries
│   │   ├── ✅ customer.repository.ts # Customer queries and analytics
│   │   ├── ✅ report.repository.ts   # Complex aggregation queries
│   │   └── ✅ index.ts               # Repository exports
│   │
│   ├── models/                       # Mongoose schemas and models
│   │   ├── ✅ user.model.ts          # User schema with bcrypt hooks
│   │   ├── ✅ equipment.model.ts     # Equipment schema with enums
│   │   ├── ✅ booking.model.ts       # Booking schema with references
│   │   └── ✅ payment.model.ts       # Payment schema with Stripe metadata
│   │
│   ├── types/                        # TypeScript types and interfaces
│   │   ├── ⏳ auth.types.ts          # (types defined inline in services)
│   │   ├── ⏳ booking.types.ts       # (types defined inline in services)
│   │   ├── ⏳ equipment.types.ts     # (types defined inline in services)
│   │   └── ⏳ common.types.ts        # (planned)
│   │
│   ├── validators/                   # Zod validation schemas
│   │   ├── ✅ auth.schema.ts         # Login, register, password reset schemas
│   │   ├── ✅ booking.schema.ts      # Booking creation and update schemas
│   │   ├── ✅ equipment.schema.ts    # Equipment CRUD schemas
│   │   ├── ✅ payment.schema.ts      # Payment and refund schemas
│   │   ├── ✅ customer.schema.ts     # Customer profile schemas
│   │   └── ✅ report.schema.ts       # Report query parameter schemas
│   │
│   ├── middlewares/
│   │   ├── ✅ auth.middleware.ts     # JWT verification
│   │   ├── ✅ error.middleware.ts    # Global error handler
│   │   ├── ✅ rateLimit.middleware.ts # Redis-backed rate limiting
│   │   ├── ✅ validate.middleware.ts # Zod schema validation
│   │   ├── ✅ role.middleware.ts     # Role-based authorization
│   │   └── ✅ upload.middleware.ts   # Multer file upload configuration
│   │
│   ├── utils/
│   │   ├── ✅ constants.ts           # HTTP status codes, rate limits, etc.
│   │   ├── ✅ errorHandler.ts        # Custom error classes
│   │   ├── ✅ jwt.ts                 # JWT sign/verify utilities
│   │   ├── ✅ fileUpload.ts          # AWS S3 upload service
│   │   ├── ⏳ response.ts            # (standard response format used inline)
│   │   └── ⏳ pagination.ts          # (pagination logic in repositories)
│   │
│   ├── jobs/                         # Background jobs (BullMQ)
│   │   ├── ⏳ index.ts               # Job queue initialization (planned)
│   │   ├── ⏳ notification.job.ts    # Email notifications (planned)
│   │   └── ⏳ report.job.ts          # Scheduled reports (planned)
│   │
│   ├── websockets/                   # Real-time communication
│   │   ├── ✅ index.ts               # Socket.IO server with JWT auth
│   │   ├── ✅ events.ts              # Event name constants
│   │   ├── ✅ emitters.ts            # Event emitter functions
│   │   └── ⏳ booking.socket.ts      # (events handled via emitters)
│   │
│   ├── docs/                         # API documentation
│   │   ├── ⏳ swagger.ts             # Swagger setup (planned)
│   │   └── ⏳ openapi.yaml           # OpenAPI specification (planned)
│   │
│   └── (tests moved to cypress/)    # Tests now in Cypress
│
├── cypress/                          # Cypress E2E API Testing
│   ├── e2e/api/                      # API test suites
│   │   ├── ✅ 01-auth.cy.ts         # Authentication tests (15+ tests)
│   │   ├── ✅ 02-equipment.cy.ts    # Equipment tests (20+ tests)
│   │   ├── ✅ 03-bookings.cy.ts     # Booking tests (25+ tests)
│   │   └── ✅ 04-payments.cy.ts     # Payment tests (15+ tests)
│   ├── fixtures/                     # Test data
│   │   ├── ✅ users.json            # Test user fixtures
│   │   └── ✅ equipment.json        # Test equipment fixtures
│   ├── support/                      # Cypress support files
│   │   ├── ✅ commands.ts           # Custom commands (login, register, apiRequest, etc.)
│   │   └── ✅ e2e.ts                # Global configuration
│   └── ✅ README.md                  # Cypress testing documentation
│
├── ✅ cypress.config.ts              # Cypress configuration
├── ✅ TESTING.md                     # Testing quick start guide
├── ✅ .env.example                   # Example environment variables
├── ✅  docker-compose.yml             # Docker setup (planned)
├── ⏳ Dockerfile                     # (planned)
├── ✅ package.json                   # Dependencies and scripts (with Cypress)
├── ✅ tsconfig.json                  # TypeScript configuration
├── ✅ tsconfig.build.json            # Build-specific TS config
├── ✅ .eslintrc.js                   # ESLint configuration
├── ✅ .prettierrc                    # Prettier configuration
├── ✅ .gitignore                     # Git ignore (includes Cypress artifacts)
└── ⏳ README.md                      # (planned)
```

## Development Workflow

### Clone & Install
```bash
git clone https://github.com/your-org/kitchenonwheels-backend.git
cd kitchenonwheels-backend
npm install
```

### Setup Environment
```bash
cp .env.example .env
```

### Run in Dev
```bash
npm run dev
```

### Run Tests
```bash
# Run all Cypress tests
npm test

# Run tests in interactive mode
npm run test:open

# Run specific test suites
npm run test:auth        # Authentication tests
npm run test:equipment   # Equipment tests
npm run test:bookings    # Booking tests
npm run test:payments    # Payment tests

# Run in headed mode (see browser)
npm run test:headed
```

**Test Coverage:**
- ✅ 75+ E2E API tests
- ✅ Authentication (15+ tests)
- ✅ Equipment Management (20+ tests)
- ✅ Bookings Workflow (25+ tests)
- ✅ Payment Processing (15+ tests)

See [TESTING.md](./TESTING.md) for detailed testing guide.

### Build & Start
```bash
npm run build && npm start
```

## API Flows

### 1. Authentication Flow

**Registration:**
1. Client → `POST /api/v1/auth/register` with user data
2. Validation middleware validates payload (Zod)
3. Service checks if email already exists
4. Password hashed with bcrypt
5. User created in database
6. Verification email queued via BullMQ
7. Response: `{ status: 201, data: { userId, message: "Verification email sent" } }`

**Login:**
1. Client → `POST /api/v1/auth/login` with credentials
2. Service validates credentials against database
3. JWT access token (15min TTL) & refresh token (7d TTL) generated
4. Tokens stored in Redis for session management
5. Response: `{ status: 200, data: { accessToken, refreshToken, user } }`

**Example Request/Response:**
```json
// POST /api/v1/auth/login
{
  "email": "customer@example.com",
  "password": "securePassword123"
}

// Response
{
  "status": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_123",
      "email": "customer@example.com",
      "role": "customer",
      "name": "John Doe"
    }
  }
}
```

### 2. Booking Creation Flow

1. Customer sends booking request → `POST /api/v1/bookings`
2. Auth middleware verifies JWT token
3. Validation middleware checks payload (Zod)
4. Service verifies equipment availability via repository
5. **Conflict check**: Ensure no overlapping bookings
6. Booking persisted in database with status: "pending"
7. Payment intent created via Stripe
8. Confirmation email queued via BullMQ
9. WebSocket notifies admin of new booking
10. Response: `{ status: 201, data: { booking, paymentIntent } }`

**Example Request/Response:**
```json
// POST /api/v1/bookings
{
  "equipmentId": "eq_456",
  "startDate": "2025-02-01",
  "endDate": "2025-02-05",
  "deliveryAddress": "123 Main St, City, State 12345",
  "notes": "Need setup assistance"
}

// Success Response
{
  "status": 201,
  "data": {
    "booking": {
      "id": "bk_789",
      "equipmentId": "eq_456",
      "customerId": "usr_123",
      "startDate": "2025-02-01",
      "endDate": "2025-02-05",
      "status": "pending",
      "totalAmount": 500.00
    },
    "paymentIntent": {
      "clientSecret": "pi_xxx_secret_yyy"
    }
  }
}
```

**Error Cases:**
- Equipment unavailable → `{ status: 409, error: "Equipment not available for selected dates" }`
- Invalid dates → `{ status: 400, error: "End date must be after start date" }`
- Unauthorized → `{ status: 401, error: "Authentication required" }`

### 3. Payment Processing Flow

1. Client → `POST /api/v1/payments/intent` with booking ID
2. Auth middleware verifies JWT token
3. Service retrieves booking details
4. Stripe payment intent created with calculated amount
5. Response with client secret for frontend
6. Client completes payment (handled by Stripe)
7. Stripe webhook → `POST /api/v1/payments/webhook`
8. Webhook signature validated
9. Payment status confirmed in database
10. Booking status updated to "confirmed"
11. Receipt email queued via BullMQ
12. WebSocket update sent to customer

**Example Webhook Payload:**
```json
// Stripe webhook event
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 50000,
      "metadata": {
        "bookingId": "bk_789"
      }
    }
  }
}
```

### 4. Equipment Search & Filter Flow

1. Client → `GET /api/v1/equipment?category=ovens&available=true&startDate=2025-02-01&endDate=2025-02-05`
2. Validation middleware validates query parameters
3. Repository builds dynamic query with filters
4. Availability checked against bookings table for date range
5. Results paginated (default: 20 per page)
6. Response: `{ status: 200, data: { equipment: [...], pagination: {...} } }`

**Example Request/Response:**
```json
// GET /api/v1/equipment?category=ovens&available=true&page=1&limit=10

// Response
{
  "status": 200,
  "data": {
    "equipment": [
      {
        "id": "eq_456",
        "name": "Commercial Convection Oven",
        "category": "ovens",
        "dailyRate": 100.00,
        "imageUrls": ["https://s3.../oven1.jpg"],
        "specifications": {
          "capacity": "5 full-size pans",
          "power": "240V"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

### 5. Admin Equipment Management Flow

1. Admin → `POST /api/v1/equipment` with equipment data & images
2. Auth middleware verifies JWT token
3. Role middleware checks for admin role
4. Validation middleware validates equipment schema (Zod)
5. Images uploaded to S3 via `fileUpload` utility
6. Equipment created in database with S3 URLs
7. Cache invalidated (Redis) for equipment listings
8. Response: `{ status: 201, data: equipment }`

**Example Request/Response:**
```json
// POST /api/v1/equipment (multipart/form-data)
{
  "name": "Industrial Refrigerator",
  "category": "refrigeration",
  "dailyRate": 75.00,
  "description": "Large capacity commercial refrigerator",
  "specifications": {
    "capacity": "48 cubic feet",
    "temperature": "-5°F to 38°F"
  }
  // + image files
}

// Response
{
  "status": 201,
  "data": {
    "id": "eq_999",
    "name": "Industrial Refrigerator",
    "category": "refrigeration",
    "dailyRate": 75.00,
    "imageUrls": [
      "https://s3.amazonaws.com/bucket/eq_999_1.jpg",
      "https://s3.amazonaws.com/bucket/eq_999_2.jpg"
    ],
    "createdAt": "2025-01-25T10:30:00Z"
  }
}
```

**Error Cases:**
- Forbidden (non-admin) → `{ status: 403, error: "Admin access required" }`
- Invalid schema → `{ status: 400, error: "Validation failed", details: [...] }`
- Image upload failure → `{ status: 500, error: "Failed to upload images to S3" }`

### 6. Booking Cancellation & Refund Flow

1. Customer → `DELETE /api/v1/bookings/:id` or `PUT /api/v1/bookings/:id` with status: "cancelled"
2. Auth middleware verifies JWT token
3. Service checks if booking belongs to customer or user is admin
4. Cancellation policy applied (e.g., 24hr notice for full refund)
5. If payment made, refund initiated via Stripe
6. Booking status updated to "cancelled"
7. Equipment availability updated
8. Cancellation email queued
9. Response: `{ status: 200, data: { booking, refund } }`

**Error Cases:**
- Too late to cancel → `{ status: 400, error: "Cancellation period expired" }`
- Booking already started → `{ status: 400, error: "Cannot cancel active booking" }`

## Security Practices

- Enforce HTTPS and CORS restrictions
- Use JWT access/refresh with short TTL
- Passwords hashed with bcrypt
- Input validation using Zod schemas
- Helmet middleware for secure headers
- Rate limiting (Redis-based)
- Role-based access control middleware
- Audit logs for admin actions
- Sanitization of request inputs

## Logging & Monitoring

- Winston for structured logs
- Morgan for HTTP request logs
- Sentry for error tracking (optional)
- Health Check Endpoint: `/api/v1/health`
- Log levels: error, warn, info, debug

## Testing

- **Unit Tests**: Service logic & utils (Jest)
- **Integration Tests**: API routes (Supertest)
- **E2E Tests**: Booking + Payment workflows
- **Coverage Target**: ≥ 80%

## Deployment Notes

- CI/CD via GitHub Actions
- Staging & production environment parity
- Dockerized services (API, Redis, MongoDB)
- Cloud-native logging (AWS CloudWatch / Render Logs)
- Environment-specific config (NODE_ENV)

## Environment Variables

The application requires the following environment variables (see `.env.example`):

```bash
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/kitchenonwheels

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=kitchenonwheels-uploads

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (e.g., SendGrid, Mailgun)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM=noreply@kitchenonwheels.com

# Logging & Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://app.kitchenonwheels.com
```

## Database Models

### Core Entities

**User Model:**
```typescript
{
  id: string
  email: string
  password: string (hashed)
  name: string
  role: 'customer' | 'admin' | 'logistics'
  verified: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Equipment Model:**
```typescript
{
  id: string
  name: string
  category: string
  description: string
  dailyRate: number
  imageUrls: string[]
  specifications: Record<string, any>
  status: 'available' | 'maintenance' | 'retired'
  createdAt: Date
  updatedAt: Date
}
```

**Booking Model:**
```typescript
{
  id: string
  customerId: string
  equipmentId: string
  startDate: Date
  endDate: Date
  deliveryAddress: string
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  totalAmount: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

**Payment Model:**
```typescript
{
  id: string
  bookingId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

## Middleware Execution Order

Request flow through middleware stack:

1. **Morgan** - HTTP request logging
2. **Helmet** - Security headers
3. **CORS** - Cross-origin resource sharing
4. **express.json()** - Body parsing
5. **Rate Limiter** - DDoS protection (Redis-backed)
6. **Auth Middleware** - JWT validation (protected routes only)
7. **Role Middleware** - Role-based access control (admin routes)
8. **Validation Middleware** - Request validation (Zod schemas)
9. **Route Handler** - Controller execution
10. **Error Middleware** - Global error handling

## WebSocket Events

Real-time events for booking updates:

**Client → Server:**
- `subscribe:bookings` - Subscribe to booking updates
- `unsubscribe:bookings` - Unsubscribe from updates

**Server → Client:**
- `booking:created` - New booking created
- `booking:updated` - Booking status changed
- `booking:cancelled` - Booking cancelled
- `payment:confirmed` - Payment successful
- `equipment:updated` - Equipment availability changed

**Example:**
```typescript
// Server emits
socket.emit('booking:created', {
  bookingId: 'bk_789',
  customerId: 'usr_123',
  equipmentId: 'eq_456',
  status: 'pending'
});
```

## Background Jobs

BullMQ job queues for asynchronous tasks:

**Email Queue:**
- `send-verification-email` - Email verification on registration
- `send-booking-confirmation` - Booking confirmation email
- `send-payment-receipt` - Payment receipt email
- `send-cancellation-notice` - Cancellation notification

**Report Queue:**
- `generate-revenue-report` - Daily/weekly revenue reports
- `generate-utilization-report` - Equipment utilization analytics
- `export-customer-data` - CSV/PDF export for customers

**Notification Queue:**
- `notify-admin-new-booking` - Admin notification for new bookings
- `notify-payment-reminder` - Payment reminder before booking starts
- `notify-booking-end-soon` - Reminder before booking ends

**Job Configuration:**
```typescript
// Example job options
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: 100,
  removeOnFail: 50
}
```

## Error Handling Standards

**Error Response Format:**
```json
{
  "status": 400,
  "error": "Error message for client",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2025-01-25T10:30:00Z",
  "path": "/api/v1/auth/register"
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid or missing JWT
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., booking overlap)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## API Versioning

**Strategy:** URL-based versioning

- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`
- Deprecation notice: 6 months before removal
- Version header support: `Accept-Version: v1`

**Versioning Checklist:**
- Maintain backward compatibility when possible
- Document breaking changes in CHANGELOG.md
- Provide migration guides for major versions
- Support N-1 versions (current + previous)

## Rate Limiting

**Default Limits:**
- Public endpoints: 100 requests/15min per IP
- Authenticated endpoints: 1000 requests/15min per user
- Admin endpoints: 5000 requests/15min per admin
- Webhook endpoints: No limit (signature validated)

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643126400
```

**Exceeded Response:**
```json
{
  "status": 429,
  "error": "Rate limit exceeded",
  "retryAfter": 900
}
```

## Testing

### Test Framework: Cypress

The project uses **Cypress** for comprehensive E2E API testing, replacing Jest/Supertest for better API testing experience.

**Why Cypress?**
- ✅ Better API testing capabilities
- ✅ Interactive test runner
- ✅ Excellent debugging tools
- ✅ Built-in retry logic
- ✅ Screenshot/video recording on failures
- ✅ TypeScript support out of the box

### Test Structure

```
cypress/
├── e2e/api/
│   ├── 01-auth.cy.ts       # Authentication & authorization tests
│   ├── 02-equipment.cy.ts  # Equipment CRUD & management tests
│   ├── 03-bookings.cy.ts   # Booking workflow & lifecycle tests
│   └── 04-payments.cy.ts   # Payment processing & Stripe tests
├── fixtures/
│   ├── users.json          # Test user data
│   └── equipment.json      # Test equipment data
└── support/
    ├── commands.ts         # Custom test commands
    └── e2e.ts             # Global configuration
```

### Test Coverage (75+ Tests)

| Module | Tests | Coverage |
|--------|-------|----------|
| **Authentication** | 15+ | Registration, Login, Logout, Token Refresh, Profile, Password Reset, Email Verification |
| **Equipment** | 20+ | CRUD, Search, Filters, Categories, Status Updates, Availability, Image Uploads, Authorization |
| **Bookings** | 25+ | Create, Update, Cancel, Lifecycle (pending→confirmed→active→completed), Conflict Detection, Date Validation, Authorization |
| **Payments** | 15+ | Payment Intents, Retrieval, Refunds, Revenue Tracking, Webhooks, Authorization |

### Custom Commands

```typescript
// Login and get access token
cy.login(email, password).then(token => { ... });

// Register new user
cy.register({ name, email, password, role });

// Make authenticated API request
cy.apiRequest('GET', '/endpoint', token, body);

// Create equipment (admin only)
cy.createEquipment(equipmentData, adminToken);

// Create booking
cy.createBooking(bookingData, customerToken);
```

### Running Tests

```bash
# Run all tests
npm test

# Interactive mode with Cypress UI
npm run test:open

# Headed mode (see browser execution)
npm run test:headed

# Run specific test suites
npm run test:auth        # Authentication tests
npm run test:equipment   # Equipment tests
npm run test:bookings    # Booking tests
npm run test:payments    # Payment tests
```

### Test Configuration

**Base URL:** `http://localhost:5000`
**API URL:** `http://localhost:5000/api/v1`

**Timeouts:**
- Command: 10000ms
- Request: 10000ms
- Response: 10000ms

### What's Tested

✅ **Functionality**: All API endpoints and business logic
✅ **Authorization**: Role-based access control (customer, admin, logistics)
✅ **Authentication**: JWT token validation and refresh
✅ **Validation**: Input validation with Zod schemas
✅ **Error Handling**: Proper error responses and status codes
✅ **Business Rules**: Booking conflicts, date validation, cancellation policies
✅ **Integration**: Stripe webhooks, S3 uploads (endpoint structure)
✅ **Status Codes**: Correct HTTP status codes for all scenarios

### Test Data Management

- Unique test users created per test run (using timestamps)
- Test fixtures for equipment and user data
- Automatic cleanup where needed
- Isolated test environments

### Best Practices Followed

1. **Test Isolation**: Each test is independent
2. **Unique Data**: Timestamps ensure unique test data
3. **Clear Descriptions**: Descriptive test names
4. **Error Scenarios**: Both success and failure cases tested
5. **Authorization**: All endpoints test proper access control
6. **Before Hooks**: Setup data in `before()` blocks
7. **Assertions**: Multiple assertions per test for thorough validation

### CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    npm run dev &
    sleep 10
    npm test
```

### Documentation

- [TESTING.md](./TESTING.md) - Quick start testing guide
- [cypress/README.md](./cypress/README.md) - Detailed Cypress documentation

## Continuous Improvement

Update this documentation when:
- New endpoints or services are added
- Infrastructure or stack changes occur
- Coding conventions or linting rules evolve
- New team members onboard or architecture updates
- Database schema changes
- Environment variables added/modified
