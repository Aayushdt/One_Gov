-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DataCategory" AS ENUM ('IDENTITY', 'EDUCATION', 'INCOME');

-- CreateEnum
CREATE TYPE "WorkflowState" AS ENUM ('AWAITING_CONSENT', 'IDENTITY_VERIFY', 'EDUCATION_VERIFY', 'INCOME_VERIFY', 'ELIGIBILITY_CALC', 'SUBMITTED', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityMap" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "identityDeptId" TEXT NOT NULL,
    "educationDeptId" TEXT NOT NULL,
    "revenueDeptId" TEXT NOT NULL,
    CONSTRAINT "IdentityMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentArtefact" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "category" "DataCategory" NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'ACTIVE',
    "revokedAt" TIMESTAMP(3),
    "workflowRunId" TEXT NOT NULL,
    CONSTRAINT "ConsentArtefact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "state" "WorkflowState" NOT NULL DEFAULT 'AWAITING_CONSENT',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "failureReason" TEXT,
    "eligibleResult" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "identitySnapshot" JSONB,
    "educationSnapshot" JSONB,
    "incomeSnapshot" JSONB,
    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStateHistory" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "fromState" "WorkflowState" NOT NULL,
    "toState" "WorkflowState" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "WorkflowStateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "citizenId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payloadRaw" TEXT NOT NULL,
    "prevHash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_email_key" ON "Citizen"("email");
CREATE UNIQUE INDEX "IdentityMap_citizenId_key" ON "IdentityMap"("citizenId");
CREATE UNIQUE INDEX "ConsentArtefact_workflowRunId_category_key" ON "ConsentArtefact"("workflowRunId", "category");
CREATE INDEX "ConsentArtefact_citizenId_category_status_idx" ON "ConsentArtefact"("citizenId", "category", "status");
CREATE UNIQUE INDEX "AuditEntry_citizenId_seq_key" ON "AuditEntry"("citizenId", "seq");
CREATE INDEX "AuditEntry_citizenId_seq_idx" ON "AuditEntry"("citizenId", "seq");

-- AddForeignKey
ALTER TABLE "IdentityMap" ADD CONSTRAINT "IdentityMap_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConsentArtefact" ADD CONSTRAINT "ConsentArtefact_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConsentArtefact" ADD CONSTRAINT "ConsentArtefact_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowStateHistory" ADD CONSTRAINT "WorkflowStateHistory_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
