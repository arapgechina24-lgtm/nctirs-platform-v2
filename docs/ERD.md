# Entity Relationship Diagram (ERD)

This document visualizes the PostgreSQL database schema for the AI-Powered National Security and Smart Policing Intelligence Platform (NSSPIP).

## Core Architecture

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : maintains
    User ||--o{ Incident : reports
    User ||--o{ Intelligence : authors

    User {
        String id PK
        String name
        String email UK
        DateTime emailVerified
        String image
        String encryptedDetails "PII encrypted"
        enum role "ADMIN, COMMANDER, OFFICER, ANALYST"
        DateTime createdAt
        DateTime updatedAt
    }

    Account {
        String id PK
        String userId FK
        String type
        String provider
        String providerAccountId
        String refresh_token
        String access_token
        Int expires_at
        String token_type
        String scope
        String id_token
        String session_state
    }

    Session {
        String id PK
        String sessionToken UK
        String userId FK
        DateTime expires
    }

    VerificationToken {
        String identifier
        String token UK
        DateTime expires
    }

    Incident {
        String id PK
        String title
        String description
        enum status "OPEN, IN_PROGRESS, RESOLVED, CLOSED"
        enum priority "LOW, MEDIUM, HIGH, CRITICAL"
        String location
        Float latitude
        Float longitude
        String encryptedDetails "JSON encrypted specifics"
        String reportedBy FK
        DateTime createdAt
        DateTime updatedAt
    }

    Intelligence {
        String id PK
        String title
        String content
        String source
        enum classification "UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP_SECRET"
        String createdBy FK
        DateTime createdAt
        DateTime expiresAt
    }
```

## Security & Encryption Model

* **Zero PII Strategy**: The `User.encryptedDetails` and `Incident.encryptedDetails` fields are stored as `@db.Text` mapped to `String` and contain AES-256-GCM encrypted content (such as phone numbers, detailed suspect descriptors, or precise home addresses) before being written to PostgreSQL.
* **Geospatial Processing**: The `latitude` and `longitude` fields in the `Incident` index allow for rapid clustering and geospatial queries utilized by the AI Engine via PostGIS compatibility mapping.
