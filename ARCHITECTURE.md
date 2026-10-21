# System Architecture & Technical Design Document
## Amrutam Telemedicine Platform

---

## 1. System Overview & Scale Targets
Amrutam Telemedicine Platform is engineered as a highly scalable, fault-tolerant, resilient backend designed to handle high-concurrency telemedicine consultations, doctor availability schedules, real-time booking, digital prescriptions, and auditable financial transactions.

### Key Performance & Reliability Targets
- **Scale**: 100,000+ completed consultations per day (~1.15 sustained consultations/sec, peaking at 25-50 peak bookings/sec during morning slot openings).
- **Latency SLOs**:
  - Read queries (Doctors list, Slots, Profile): **p95 < 200ms**
  - Write transactions (Booking, Payment, Prescription): **p95 < 500ms**
- **System Availability**: **99.95%** (less than 4.38 hours downtime per year).
- **Data Durability**: Zero data loss (RPO = 0 for completed payments and consultations).

---

## 2. High-Level Architecture & Data Flow

```mermaid
graph TB
    subgraph Clients["Clients & Gateways"]
        PatientApp["Patient Web / Mobile App"]
        DoctorPortal["Doctor Web Portal"]
        AdminDashboard["Admin Dashboard"]
        CF["CloudFront CDN / Cloudflare WAF"]
    end

    subgraph Ingress["Ingress & Edge"]
        ALB["Application Load Balancer (AWS ALB)"]
        RateLimit["Rate Limiter & WAF Rules"]
    end

    subgraph ServiceCluster["Application Cluster (Amazon EKS)"]
        API1["Amrutam API Pod 1"]
        API2["Amrutam API Pod 2"]
        APIn["Amrutam API Pod N (HPA)"]
    end

    subgraph DataTier["Data & Cache Tier"]
        PGPrimary[("Amazon RDS PostgreSQL Primary (Multi-AZ)")]
        PGReplica[("RDS Read Replica (Scale Reads)")]
        RedisCache[("Redis Cluster (ElastiCache)")]
        S3Storage[("Amazon S3 (Prescriptions / Documents)")]
    end

    subgraph ObservabilityTier["Observability & Tracing"]
        Prometheus["Prometheus / Grafana"]
        CloudWatch["CloudWatch Logs & OpenTelemetry"]
    end

    PatientApp --> CF
    DoctorPortal --> CF
    AdminDashboard --> CF
    CF --> ALB
    ALB --> RateLimit
    RateLimit --> API1 & API2 & APIn

    API1 & API2 & APIn --> RedisCache
    API1 & API2 & APIn --> PGPrimary
    API1 & API2 & APIn --> PGReplica
    API1 & API2 & APIn --> S3Storage
    API1 & API2 & APIn --> Prometheus
    API1 & API2 & APIn --> CloudWatch
```

---

## 3. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o| Profile : "has profile"
    User ||--o| Doctor : "has doctor details"
    User ||--o{ Consultation : "as patient"
    User ||--o{ Consultation : "as doctor"
    User ||--o{ Prescription : "receives"
    User ||--o{ Payment : "initiates"
    User ||--o{ AuditLog : "triggers"
    
    Doctor ||--o{ AvailabilitySlot : "defines availability"
    
    AvailabilitySlot ||--o{ Consultation : "books"
    
    Consultation ||--o| Prescription : "generates"
    Consultation ||--o| Payment : "settles"

    User {
        string id PK
        string email UK
        string phone UK
        string passwordHash
        enum role "PATIENT | DOCTOR | ADMIN"
        boolean isMfaEnabled
        enum status "ACTIVE | INACTIVE | SUSPENDED"
        datetime createdAt
    }

    Profile {
        string id PK
        string userId FK
        string firstName
        string lastName
        enum gender
        datetime dob
        enum bloodGroup
        string address
    }

    Doctor {
        string id PK
        string userId FK
        string specialization
        string qualifications
        int experienceYears
        int feeCents
        string bio
        string licenseNumber
        float rating
    }

    AvailabilitySlot {
        string id PK
        string doctorId FK
        datetime date
        datetime startTime
        datetime endTime
        boolean isBooked
        int version
    }

    Consultation {
        string id PK
        string patientId FK
        string doctorId FK
        string slotId FK
        enum status "PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED"
        string meetingLink
        datetime createdAt
    }

    Prescription {
        string id PK
        string consultationId FK
        string doctorId FK
        string patientId FK
        string diagnosis
        json medications
        string instructions
        string digitalSignature
        datetime createdAt
    }

    Payment {
        string id PK
        string consultationId FK
        string patientId FK
        int amountCents
        string currency
        enum status "PENDING | SUCCESS | FAILED"
        string idempotencyKey UK
        string transactionId
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string entity
        string entityId
        string ipAddress
        string userAgent
        json metadata
        datetime timestamp
    }
```

---

## 4. End-to-End Booking Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant API as Telemedicine API Gateway
    participant Cache as Redis Cache
    participant DB as PostgreSQL (Multi-AZ)
    participant PaymentGW as Payment Gateway
    actor Doctor as Doctor

    Patient->>API: GET /api/v1/slots/doctor/:id (Check available slots)
    API->>Cache: Check cached slot list
    alt Cache Miss
        API->>DB: Query AvailabilitySlot (isBooked = false)
        DB-->>API: Return available slots
        API->>Cache: Set cache (TTL 30s)
    end
    API-->>Patient: 200 OK (Slot List)

    Patient->>API: POST /api/v1/consultations/book { doctorId, slotId }
    Note over API,DB: ACID Transaction with Row-Level Lock
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT * FROM AvailabilitySlot WHERE id = slotId FOR UPDATE
    alt Slot already booked
        DB-->>API: Conflict (isBooked == true)
        API->>DB: ROLLBACK
        API-->>Patient: 409 Conflict ("Slot is already booked")
    else Slot available
        API->>DB: UPDATE AvailabilitySlot SET isBooked = true, version = version + 1
        API->>DB: INSERT INTO Consultation (status = 'PENDING')
        API->>DB: INSERT INTO AuditLog (action = 'BOOK_CONSULTATION')
        API->>DB: COMMIT TRANSACTION
        API->>Cache: Invalidate doctor slots cache
        API-->>Patient: 201 Created (Consultation ID)
    end

    Patient->>API: POST /api/v1/payments { consultationId, amountCents, idempotencyKey }
    API->>PaymentGW: Charge card / UPI (Idempotent call)
    PaymentGW-->>API: Payment Approved (txn_123456)
    API->>DB: INSERT INTO Payment (status = 'SUCCESS')
    API->>DB: UPDATE Consultation SET status = 'CONFIRMED'
    API->>DB: INSERT INTO AuditLog (action = 'PAYMENT_SUCCESS')
    API-->>Patient: 200 OK (Confirmed with meeting link)
    API--)Doctor: Real-time notification of booked appointment
```

---

## 5. Concurrency Handling & Preventing Double-Booking
When multiple patients attempt to book the exact same slot simultaneously:
1. **Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)**:
   - The booking transaction locks the slot record in PostgreSQL for the duration of the reservation.
   - Any concurrent transaction attempting to read or update that row waits until the transaction completes.
2. **Optimistic Versioning (`version` column)**:
   - Every `AvailabilitySlot` includes an incrementing `version` integer.
   - Updates enforce `WHERE id = :slotId AND isBooked = false AND version = :currentVersion`.
3. **Cache Invalidation & Redis Distributed Locks**:
   - Once booked, the Redis key `slots:doctor:{id}:{date}` is immediately invalidated.

---

## 6. Data Partitioning & Scale Strategy (100k Daily Consultations)
To sustainably scale past 100k daily consultations (~3M/month, ~36M records/year):
1. **Partitioning Strategy**:
   - **Range Partitioning by Month**: The `Consultation`, `Payment`, and `AuditLog` tables are partitioned by `createdAt` range (`PARTITION BY RANGE (createdAt)`).
   - Monthly partitions allow PostgreSQL query planner to perform partition pruning, isolating queries to current month tables.
2. **Read/Write Splitting**:
   - Write operations (Bookings, Consultations, Payments) route to the PostgreSQL Primary database.
   - Read queries (Doctor directories, slot listings, patient medical history) route to Read Replicas via connection pooler (PgBouncer).
3. **Archival & Hot/Cold Tiering**:
   - Closed consultations and payments older than 180 days are offloaded to cold storage (Amazon S3 via parquet exports) for compliance and analytics, keeping operational indexes compact in RAM.

---

## 7. Distributed Transaction Management & Sagas
In distributed multi-step operations (Booking -> Payment Authorization -> Notification -> Confirmation):
- **Orchestration Saga Pattern**:
  - If payment authorization fails or times out, a compensating transaction executes:
    1. Mark consultation as `CANCELLED`.
    2. Revert `AvailabilitySlot.isBooked` to `false`.
    3. Issue refund if captured partially.
    4. Append compensation record to `AuditLog`.
- **Idempotency Guarantees**:
  - Payment requests require an `Idempotency-Key` UUID.
  - Duplicate submissions with the same key return the stored transaction response without double-charging.

---

## 8. Retry & Backoff Strategies
- **Exponential Backoff with Jitter**:
  - Transient external failures (Payment Gateway, SMS/Email delivery) use exponential backoff:
    $$T_{\text{wait}} = \min(M, B \times 2^{\text{attempt}}) \pm \text{jitter}$$
- **Circuit Breaker Pattern**:
  - If external service failure rate exceeds 50% over a 30-second window, circuit trips open for 15 seconds to prevent cascading resource starvation.

---

## 9. Backup & Disaster Recovery (DR) Strategy
- **Recovery Objectives**:
  - **RPO (Recovery Point Objective)**: < 1 minute (Continuous WAL archiving to Amazon S3).
  - **RTO (Recovery Time Objective)**: < 15 minutes (Automated RDS Multi-AZ failover).
- **Automated Backup Strategy**:
  - Daily snapshot backups retained for 35 days.
  - Multi-Region replication to secondary AWS region (e.g. `ap-south-1` to `ap-southeast-1`).
  - Quarterly automated disaster recovery drill validating point-in-time recovery (PITR).
