-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'CITIZEN';

-- AlterTable
ALTER TABLE "WorkflowRun" ADD COLUMN     "retentionAppliedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "disputedCategory" "DataCategory" NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "adminNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceFlag" (
    "id" TEXT NOT NULL,
    "auditEntryId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "GrievanceFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityCertificate" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'Ed25519',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "EligibilityCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "downloadUrl" TEXT,
    "fileSize" INTEGER,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appeal_citizenId_status_idx" ON "Appeal"("citizenId", "status");

-- CreateIndex
CREATE INDEX "Appeal_runId_idx" ON "Appeal"("runId");

-- CreateIndex
CREATE INDEX "GrievanceFlag_citizenId_status_idx" ON "GrievanceFlag"("citizenId", "status");

-- CreateIndex
CREATE INDEX "GrievanceFlag_auditEntryId_idx" ON "GrievanceFlag"("auditEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityCertificate_runId_key" ON "EligibilityCertificate"("runId");

-- CreateIndex
CREATE INDEX "EligibilityCertificate_citizenId_idx" ON "EligibilityCertificate"("citizenId");

-- CreateIndex
CREATE INDEX "DataExportRequest_citizenId_status_idx" ON "DataExportRequest"("citizenId", "status");

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceFlag" ADD CONSTRAINT "GrievanceFlag_auditEntryId_fkey" FOREIGN KEY ("auditEntryId") REFERENCES "AuditEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceFlag" ADD CONSTRAINT "GrievanceFlag_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCertificate" ADD CONSTRAINT "EligibilityCertificate_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCertificate" ADD CONSTRAINT "EligibilityCertificate_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
