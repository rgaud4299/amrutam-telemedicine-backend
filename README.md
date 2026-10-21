# Amrutam Telemedicine Backend

[![Build & Deploy](https://github.com/amrutam/telemedicine-backend/actions/workflows/deploy.yml/badge.svg)](https://github.com/amrutam/telemedicine-backend/actions)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue.svg)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/prisma-6.19-2D3748.svg)](https://www.prisma.io)
[![GraphQL](https://img.shields.io/badge/graphql-apollo--server-e10098.svg)](https://www.apollographql.com)

A production-grade, highly scalable telemedicine backend built for **Amrutam** to manage doctor availability, real-time consultation bookings, e-prescriptions, payments, and compliance audit trails with high concurrency (100k daily consultations).

---

## Architecture & Tech Stack

- **Runtime**: Node.js (v20+) with TypeScript
- **Framework**: Express.js (REST Mutations & Endpoints) + Apollo Server (GraphQL Queries)
- **Database & ORM**: PostgreSQL 16 + Prisma ORM
- **Cache & Concurrency**: Redis (distributed caching & rate limiting)
- **Authentication**: JWT (Access + Refresh tokens) + Multi-Factor Authentication (MFA/TOTP) + RBAC
- **Validation**: Zod (strict runtime schema validation)
- **Observability**: Custom latency histograms (p50, p95, p99), structured request-id tracing, `/metrics` endpoint
- **Containerization & CI/CD**: Docker, Docker Compose, AWS EKS deployment via GitHub Actions

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma            # Database models & relationships
├── src/
│   ├── config/
│   │   └── prisma.ts            # Global Prisma Client instance
│   ├── graphql/
│   │   ├── schema.ts            # Apollo Server typeDefs & resolvers entry
│   │   ├── context.ts           # Authentication context builder
│   │   └── telemedicine.graphql.ts # GraphQL schemas & resolvers (All GET queries)
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # JWT & RBAC role guards
│   │   ├── errorHandler.ts      # Global centralized error handler
│   │   ├── rateLimiter.ts       # Sliding window rate limiter
│   │   ├── requestId.ts         # Correlation ID / X-Request-Id tracer
│   │   └── validate.ts          # Zod validation middleware
│   ├── modules/
│   │   ├── analytics/           # Admin metrics & platform analytics
│   │   ├── audit/               # Compliance & audit log trails
│   │   ├── auth/                # Register, login, refresh token, MFA
│   │   ├── consultations/       # Booking transactions & status workflow
│   │   ├── doctors/             # Doctor directory & profile management
│   │   ├── payments/            # Checkout, idempotency & receipts
│   │   ├── prescriptions/       # Medical prescriptions & diagnoses
│   │   ├── profiles/            # Patient & doctor profile details
│   │   └── slots/               # Doctor availability slot scheduling
│   ├── utils/
│   │   ├── appError.ts          # Operational error class
│   │   ├── jwt.ts & token.ts    # Token generation & verification
│   │   ├── metrics.ts           # Latency metrics snapshot collector
│   │   └── response.ts          # Standardized API response wrappers
│   └── index.ts                 # Application bootstrap (Express + Apollo)
├── Dockerfile                   # Production container build
└── package.json                 # Project dependencies & scripts
docker-compose.yml               # Multi-container orchestration (DB + Redis + API)
ARCHITECTURE.md                  # Comprehensive system architecture doc
SECURITY.md                      # Security checklist & STRIDE threat model
```

---

## Quick Start & Setup

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 15
- Redis >= 7 (optional for local dev)
- Docker & Docker Compose (optional)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/amrutam/telemedicine-backend.git
cd telemedicine-backend/backend
npm install
```

### 3. Environment Variables
Create a `.env` file in the `backend/` folder:
```env
PORT=9000
HOST="0.0.0.0"
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/amrutam_telemedicine?schema=public"
REDIS_URL="redis://localhost:6379"

ACCESS_TOKEN_SECRET="your_secure_jwt_access_token_secret"
REFRESH_TOKEN_SECRET="your_secure_jwt_refresh_token_secret"
ADMIN_ACCESS_TOKEN_SECRET="your_secure_jwt_admin_token_secret"

SERVER_URL="http://localhost:9000"
```

### 4. Database Setup & Prisma Generation
```bash
npx prisma generate
npx prisma db push
```

### 5. Running the Application
```bash
# Development mode with hot-reload
npm run dev

# Production build & run
npm run build
node dist/index.js
```
The server will start at `http://localhost:9000`.

---

## Running with Docker Compose
To run PostgreSQL, Redis, and the Telemedicine API with a single command:
```bash
docker compose up -d
```
Logs can be viewed with:
```bash
docker compose logs -f api
```

---

## API Documentation

### 1. REST Endpoints (Mutations & Operations)

#### Authentication (`/api/v1/auth`)
- `POST /register`: Register a new patient or doctor.
- `POST /login`: Authenticate and receive JWT tokens.
- `POST /refresh-token`: Refresh expired access token.
- `GET /me`: Fetch authenticated user profile.
- `POST /mfa/setup`: Generate TOTP secret & QR URI.
- `POST /mfa/enable`: Verify code and activate MFA.

#### Profiles (`/api/v1/profiles`)
- `GET /`: Get my profile information.
- `PUT /`: Update name, gender, blood group, address.

#### Doctors (`/api/v1/doctors`)
- `GET /`: List doctors with specialization search and pagination.
- `GET /:id`: Doctor details with upcoming available slots.
- `PUT /profile`: Update doctor qualifications, fees, bio (Doctor only).

#### Availability Slots (`/api/v1/slots`)
- `GET /doctor/:doctorId`: Fetch free slots for a doctor.
- `POST /`: Create single slot (Doctor only).
- `POST /bulk`: Bulk generate availability slots (Doctor only).
- `DELETE /:slotId`: Delete unbooked slot (Doctor only).

#### Consultations (`/api/v1/consultations`)
- `POST /book`: Book an appointment (Atomic row lock, Patient only).
- `GET /my`: List consultations with status filter.
- `GET /:id`: Get consultation details.
- `PATCH /:id/status`: Update status (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- `PATCH /:id/cancel`: Cancel consultation and release slot.

#### Prescriptions (`/api/v1/prescriptions`)
- `POST /`: Create medical prescription with medications and dosage (Doctor only).
- `GET /consultation/:consultationId`: View prescription for consultation.
- `GET /my`: View all patient/doctor prescriptions.

#### Payments (`/api/v1/payments`)
- `POST /`: Process consultation payment with `Idempotency-Key` (Patient only).
- `GET /my`: Payment transaction history.
- `GET /:id`: Single payment receipt.

#### Admin & Audit (`/api/v1/audit-logs`, `/api/v1/analytics`)
- `GET /api/v1/audit-logs`: Paginated compliance logs (Admin only).
- `GET /api/v1/analytics`: Overview metrics, revenue, consultation breakdown (Admin only).

---

### 2. GraphQL Schema (All GET Queries)
Endpoint: `POST http://localhost:9000/graphql`
Headers: `Authorization: Bearer <ACCESS_TOKEN>`

Example Query:
```graphql
query GetDoctorDetails {
  doctors(specialization: "Ayurveda", page: 1, limit: 10) {
    doctors {
      id
      name
      specialization
      feeCents
      rating
    }
    total
  }
  myConsultations(status: "CONFIRMED") {
    id
    status
    createdAt
    slot {
      startTime
      endTime
    }
  }
}
```

---

## Observability & Metrics
- **Health Check**: `GET http://localhost:9000/health`
- **Latency & System Metrics**: `GET http://localhost:9000/metrics`
  Returns real-time request counts, p50, p95, p99 latencies, uptime, and HTTP status code distribution.

---

## Security & Reliability
Refer to [`SECURITY.md`](./SECURITY.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for in-depth details on:
- OWASP Top 10 API Security Mitigations
- Row-Level Locking & Concurrency Prevention
- 100k Daily Consultations Scaling & Partitioning
- Sagas & Compensation Transactions
- Disaster Recovery (RPO < 1m, RTO < 15m)
