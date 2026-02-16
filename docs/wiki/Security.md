# Security Model

## Zero-Trust Implementation

The platform assumes no trust for any entity, inside or outside the perimeter.

### 1. Authentication

- **Provider**: NextAuth.js v5.
- **Strategy**: JWT-based sessions.
- **Encryption**: `AUTH_SECRET` ensures session integrity.

### 2. Authorization (RBAC)

Role-Based Access Control is enforced at the API and Page level.

| Role | Access Level | Description |
|------|--------------|-------------|
| **ADMIN** | L4 | Full system access, user management. |
| **ANALYST** | L3 | Incident management, AI analysis. |
| **OPERATOR** | L2 | Read-only dashboard access. |
| **USER** | L1 | Basic reporting capabilities. |

### 3. Deployment Lockdown

For hackathons and private demos, the deployment is protected by a **Pre-Auth Layer**.

- **Environmental Variable**: `DEPLOYMENT_PASSWORD`
- **Mechanism**: Middleware intercepts all requests. Basic Auth prompt appears before Next.js app loads.

### 4. API Security

- **Rate Limiting**: Token bucket algorithm limits requests per IP/User.
- **Validation**: Zod schemas prevent injection attacks.
- **Headers**:
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `X-Frame-Options`
