# KitchenOnWheels Rentals - Backend API

A comprehensive backend API for managing commercial kitchen equipment rentals, built with TypeScript, Express.js, MongoDB, and Mongoose.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for MongoDB and Redis)
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd Kow_kartel_bkend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB and Redis with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:5000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

#### Change Password
```http
PUT /api/v1/auth/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

### Health Check
```http
GET /api/v1/health
```

## 🏗️ Project Structure

```
src/
├── app.ts                      # Express app setup
├── server.ts                   # Server entry point
├── config/                     # Configuration files
│   ├── db.ts                   # MongoDB connection
│   ├── env.ts                  # Environment validation
│   ├── logger.ts               # Winston logger
│   └── redis.ts                # Redis connection
├── models/                     # Mongoose models
│   ├── user.model.ts
│   ├── equipment.model.ts
│   ├── booking.model.ts
│   └── payment.model.ts
├── repositories/               # Data access layer
│   ├── user.repository.ts
│   ├── equipment.repository.ts
│   ├── booking.repository.ts
│   └── payment.repository.ts
├── services/                   # Business logic
│   └── auth.service.ts
├── controllers/                # Route handlers
│   └── auth.controller.ts
├── routes/                     # API routes
│   ├── auth.routes.ts
│   └── index.ts
├── middlewares/                # Express middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── validate.middleware.ts
│   ├── role.middleware.ts
│   └── rateLimit.middleware.ts
├── validators/                 # Zod validation schemas
│   └── auth.schema.ts
├── utils/                      # Utility functions
│   ├── constants.ts
│   ├── errorHandler.ts
│   ├── jwt.ts
│   └── response.ts
└── types/                      # TypeScript types
    └── common.types.ts
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Express.js 5
- **Database**: MongoDB 7.0
- **ODM**: Mongoose 8.19
- **Caching**: Redis 7
- **Authentication**: JWT + Refresh Tokens
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Role-based access control (RBAC)
- Input validation with Zod
- Helmet.js security headers
- CORS protection
- Rate limiting (Redis-backed)
- Request sanitization

## 📦 Docker Support

### Start all services
```bash
docker-compose up -d
```

### Services included:
- **MongoDB**: Port 27017
- **Redis**: Port 6379
- **Mongo Express**: Port 8081 (Web UI)

### Stop services
```bash
docker-compose down
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

### Critical Variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for access tokens (min 32 chars)
- `REFRESH_TOKEN_SECRET` - Secret key for refresh tokens (min 32 chars)
- `ALLOWED_ORIGINS` - CORS allowed origins

## 🚧 Roadmap

- [x] MongoDB integration with Mongoose
- [x] Authentication & Authorization
- [x] Repository pattern implementation
- [x] Equipment management endpoints
- [x] Booking system with conflict detection
- [x] Stripe payment integration
- [ ] WebSocket for real-time updates
- [ ] Email notifications (BullMQ)
- [ ] S3 file uploads
- [ ] Admin dashboard endpoints
- [ ] API documentation (Swagger)
- [ ] Comprehensive test suite
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 👤 Author

Your Name

## 📞 Support

For issues and questions, please open an issue on GitHub.
