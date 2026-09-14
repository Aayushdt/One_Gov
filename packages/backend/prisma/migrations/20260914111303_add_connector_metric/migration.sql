-- CreateTable
CREATE TABLE "ConnectorMetric" (
    "id" TEXT NOT NULL,
    "connectorSlug" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "durationMs" INTEGER,
    "statusCode" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConnectorMetric_connectorSlug_recordedAt_idx" ON "ConnectorMetric"("connectorSlug", "recordedAt");
