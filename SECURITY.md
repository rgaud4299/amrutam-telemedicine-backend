# Security Checklist & Threat Model Document
## Amrutam Telemedicine Platform

---

## 1. Executive Security Summary
The Amrutam Telemedicine Platform processes sensitive personal identifiable information (PII) and electronic protected health information (ePHI), including patient medical diagnoses, digital prescriptions, consultation video sessions, and financial transactions. This document outlines the defense-in-depth posture, OWASP Top 10 mitigation strategies, STRIDE threat model, encryption standards, and key lifecycle management.

---

## 2. Threat Modeling (STRIDE Matrix)

| Threat Category | Potential Vector | Platform Mitigation & Countermeasure |
| :--- | :--- | :--- |
| **Spoofing Identity** | Fake doctor or patient impersonation | Secure JWT with short expiry (15m), HttpOnly refresh tokens, TOTP-based Multi-Factor Authentication (MFA). |
| **Tampering with Data** | Modification of digital prescriptions or payment amounts | Prescriptions are cryptographically signed (`digitalSignature`). Server-side price calculation; client amounts strictly validated against DB fee. |
| **Repudiation** | Denying an appointment or prescription issuance | Comprehensive immutable `AuditLog` table capturing `userId`, `action`, `ipAddress`, `userAgent`, and `timestamp` on every state mutation. |
| **Information Disclosure** | Unauthorized access to medical records or patient profiles | Granular RBAC (`PATIENT`, `DOCTOR`, `ADMIN`). Strict entity ownership checks ensuring users only query their own consultations/prescriptions. |
| **Denial of Service (DoS)** | Brute force login, GraphQL query exhaustion, API flooding | In-memory token bucket rate limiting (`authRateLimiter` 20 req/min, `apiRateLimiter` 300 req/min). GraphQL query depth limiting and pagination enforcement (`take` max 50). |
| **Elevation of Privilege** | Normal user attempting admin audit/analytics access | Enforced role authorization middleware (`authorize({ roles: ["ADMIN"] })`) at route level and GraphQL resolver level. |

---

## 3. OWASP Top 10 API Security Mitigations

### 1. Broken Object Level Authorization (BOLA / IDOR)
- **Mitigation**: Accessing `/api/v1/consultations/:id` or `/api/v1/prescriptions/consultation/:id` strictly validates:
  $$\text{userId} == \text{consultation.patientId} \lor \text{userId} == \text{consultation.doctorId}$$
  Unauthorized callers immediately receive `403 Forbidden`.

### 2. Broken Authentication
- **Mitigation**: 
  - Passwords hashed using `bcrypt` with salt cost 12.
  - JWT tokens signed with SHA-256 HMAC secrets.
  - MFA via RFC 6238 TOTP using `otplib`.
  - Refresh tokens stored with version revocation support.

### 3. Broken Object Property Level Authorization
- **Mitigation**: Strict Zod validation schemas discard unexpected payload fields before reaching controllers. Mass assignment is prevented.

### 4. Unrestricted Resource Consumption
- **Mitigation**: 
  - Express JSON payload size strictly limited to 10MB.
  - Rate limiting on public and sensitive routes.
  - All paginated endpoints enforce maximum limit bounds.

### 5. Broken Function Level Authorization (BFLA)
- **Mitigation**: Route-specific RBAC middleware validates user role against required permission list before request execution.

### 6. Unrestricted Access to Sensitive Business Flows
- **Mitigation**: Double-booking prevented via database row locks and atomic transactions. Payment processing enforces unique `idempotencyKey`.

### 7. Server-Side Request Forgery (SSRF)
- **Mitigation**: Meeting links and callback URLs validated against strict protocol and domain whitelists.

### 8. Security Misconfiguration
- **Mitigation**: CORS headers restricted to authorized origins. Stack traces stripped in production responses. Default credentials disabled.

### 9. Improper Inventory Management
- **Mitigation**: Clear API versioning (`/api/v1/*`). Deprecated endpoints decommissioned.

### 10. Unsafe Consumption of APIs
- **Mitigation**: Third-party integrations (Payment Gateway, AWS S3, Firebase) communicate over TLS 1.3 with validated TLS certificates and timeout guards.

---

## 4. Data Classification & Encryption

| Data Classification Tier | Examples | Storage Encryption | Transit Encryption | Retention Period |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Confidential Health (ePHI)** | Diagnoses, Prescriptions, Doctor Notes | AES-256 at rest (AWS KMS managed key) | TLS 1.3 / HTTPS | 7 Years (Medical Compliance) |
| **Tier 2: Sensitive Financial (PCI-DSS)** | Payments, Transaction IDs, Fee receipts | AES-256 at rest (Tokens only, no raw PAN stored) | TLS 1.3 / HTTPS | 7 Years (Financial Audit) |
| **Tier 3: Personally Identifiable (PII)** | Names, Emails, Phone numbers, DOB, Blood Group | AES-256 at rest | TLS 1.3 / HTTPS | Account lifetime + 30 days post deletion |
| **Tier 4: System Operational** | Audit logs, metrics, trace IDs | Encrypted CloudWatch Logs | TLS 1.3 | 1 Year |

---

## 5. Secret & Key Rotation Policy
1. **JWT Secrets**:
   - Rotated every 90 days.
   - Dual-secret verification supported during rotation window to prevent user logout.
2. **Database & Redis Credentials**:
   - Managed via AWS Secrets Manager with automatic 30-day rotation.
3. **AWS IAM Credentials**:
   - Short-lived IAM roles with OpenID Connect (OIDC) in GitHub Actions CI/CD; zero long-lived static access keys in repository.

---

## 6. Dependency Scanning & Static Code Analysis
- Automated CI pipeline runs `npm audit` to detect vulnerabilities in dependencies.
- GitHub Dependabot alerts configured for CVE scanning.
- Static application security testing (SAST) runs on every Pull Request.
