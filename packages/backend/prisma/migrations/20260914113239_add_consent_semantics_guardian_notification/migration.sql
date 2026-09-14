-- AlterTable
ALTER TABLE "ConsentArtefact" ADD COLUMN     "guardianId" TEXT,
ADD COLUMN     "maxUses" INTEGER,
ADD COLUMN     "useCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GuardianRelationship" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GuardianRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardianRelationship_guardianId_dependentId_key" ON "GuardianRelationship"("guardianId", "dependentId");

-- CreateIndex
CREATE INDEX "Notification_citizenId_readAt_idx" ON "Notification"("citizenId", "readAt");

-- CreateIndex
CREATE INDEX "ConsentArtefact_citizenId_status_expiresAt_idx" ON "ConsentArtefact"("citizenId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "ConsentArtefact" ADD CONSTRAINT "ConsentArtefact_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianRelationship" ADD CONSTRAINT "GuardianRelationship_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianRelationship" ADD CONSTRAINT "GuardianRelationship_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
