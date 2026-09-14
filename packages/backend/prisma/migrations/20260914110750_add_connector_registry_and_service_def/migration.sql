/*
  Warnings:

  - Made the column `onegovId` on table `Citizen` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "WorkflowState" ADD VALUE 'CONNECTOR_STEP';

-- AlterTable
ALTER TABLE "Citizen" ALTER COLUMN "onegovId" SET NOT NULL;

-- CreateTable
CREATE TABLE "ConnectorManifest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "DataCategory" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authMethod" TEXT NOT NULL DEFAULT 'none',
    "authConfig" JSONB,
    "fieldSchema" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDefinition" (
    "id" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "eligibilityRules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "serviceDefId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stateName" TEXT NOT NULL,
    "connectorSlug" TEXT NOT NULL,
    "category" "DataCategory" NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorManifest_slug_key" ON "ConnectorManifest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDefinition_serviceType_key" ON "ServiceDefinition"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_serviceDefId_order_key" ON "WorkflowStep"("serviceDefId", "order");

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_serviceDefId_fkey" FOREIGN KEY ("serviceDefId") REFERENCES "ServiceDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
