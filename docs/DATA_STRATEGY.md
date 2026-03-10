# Data Aggregation & Synthesis Strategy

To properly train the AI models and validate the platform without exposing real citizen or operational data, this project relies on **Aggregated Open-Source Datasets** and **Synthesized Dummy Data**.

## 1. Aggregating Open-Source Historical Datasets

The NSSPIP platform's initial risk models are trained/benchmarked against these publicly available datasets.

### Recommended Sources

1. **Kenya Open Data Portal (opendata.go.ke)**: Check for annual economic surveys or abstracted demographic maps to establish baseline population densities for risk clustering.
2. **ACLED (Armed Conflict Location & Event Data Project)**: Provides high-quality, open-source data on political violence and protests in East Africa.
    * **Retrieval Process**: Export the ACLED dataset for Kenya manually via their export tool or via their API (requires free researcher registration).
3. **Kaggle Datasets**: Look for unclassified, aggregated datasets such as "Nairobi Crime Data" or global analogues (e.g., "Chicago Crime Dataset") to pre-train localized ML categorizations.

### Integration Pipeline

* **Format**: Convert retrieved CSVs/JSONs to standardized JSON representations.
* **Upload**: Use `npx prisma db seed` with expanded functions to inject these generic historical points into the database for visualization on the Intelligence maps without exposing PII.

---

## 2. Synthesizing Dummy Data (Mimicking NIS/Police Reports)

To simulate live operational data for the dashboard demo, we synthesize records that mimic the structure of standard police dockets and intelligence reports, complete with fake personally identifiable information (PII) that tests our encryption pipelines.

### Structure of Synthesized Data

We utilize `@faker-js/faker` to generate mock entries.

**Dummy PII Generation (To be Encrypted):**

```typescript
import { faker } from '@faker-js/faker';

const fakeSuspect = {
  name: faker.person.fullName(),
  phone: faker.phone.number(),
  home_address: faker.location.streetAddress(),
  vehicle_plate: faker.vehicle.vrm()
}
// This object is JSON.stringified() and then encrypted BEFORE storing in Postgres.
```

**Dummy Report Generation:**

```typescript
const fakeIntelReport = {
  title: `Operation ${faker.word.adjective()} ${faker.animal.type()} Intel`,
  content: `Surveillance indicates suspicious gathering near ${faker.location.street()}. Suspects observed exchanging briefcases.`,
  source: "Field Operative Alpha",
  classification: "SECRET"
}
```

### Seeding Execution

The `prisma/seed.ts` script handles the logic for seeding the PostgreSQL database. We can expand this script at any time to loop over `faker` functions, mass-generating thousands of fully encrypted records to stress-test the `ai-policing-platform` UI performance in handling large data volumes securely.
