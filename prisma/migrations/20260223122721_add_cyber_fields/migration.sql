-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "dataProtectionImpact" TEXT;
ALTER TABLE "Incident" ADD COLUMN "mitreAttackId" TEXT;

-- AlterTable
ALTER TABLE "Threat" ADD COLUMN "affectedCitizens" INTEGER;
ALTER TABLE "Threat" ADD COLUMN "dpaViolation" TEXT;
