-- Add MUNICIPAL_VERIFY to WorkflowState enum
ALTER TYPE "WorkflowState" ADD VALUE IF NOT EXISTS 'MUNICIPAL_VERIFY';

-- Add municipalSnapshot column to WorkflowRun
ALTER TABLE "WorkflowRun" ADD COLUMN IF NOT EXISTS "municipalSnapshot" JSONB;
