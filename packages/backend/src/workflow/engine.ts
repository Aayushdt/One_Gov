import { WorkflowState, DataCategory } from '@prisma/client';
import { prisma } from '../config/db';
import { identityConnector, educationConnector, revenueConnector, ConsentViolationError, ConnectorError } from '../connectors/connectors';
import { auditService } from '../audit/audit.service';
import { workflowRetryQueue } from './queue';

const RETRY_POLICY = {
  maxAttempts: 3,
  backoffMs: [2000, 5000, 10000],
  retryableStatusCodes: [503, 429, 504],
};

class WorkflowEngine {
  async advance(runId: string): Promise<void> {
    const run = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });

    try {
      switch (run.state) {
        case WorkflowState.AWAITING_CONSENT:
          await this.transitionTo(run, WorkflowState.IDENTITY_VERIFY);
          await this.advance(runId);
          break;

        case WorkflowState.IDENTITY_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const identity = await identityConnector.fetchAndNormalize(map.identityDeptId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { identitySnapshot: identity as any } });
          await this.transitionTo(run, WorkflowState.EDUCATION_VERIFY);
          await this.advance(runId);
          break;
        }

        case WorkflowState.EDUCATION_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const education = await educationConnector.fetchAndNormalize(map.educationDeptId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { educationSnapshot: education as any } });
          await this.transitionTo(run, WorkflowState.INCOME_VERIFY);
          await this.advance(runId);
          break;
        }

        case WorkflowState.INCOME_VERIFY:
        case WorkflowState.PENDING: {
          const freshRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: freshRun.citizenId } });
          const income = await revenueConnector.fetchAndNormalize(map.revenueDeptId, runId, freshRun.citizenId, freshRun.retryCount + 1);
          await prisma.workflowRun.update({ where: { id: runId }, data: { incomeSnapshot: income as any } });
          await this.transitionTo(freshRun, WorkflowState.ELIGIBILITY_CALC);
          await this.advance(runId);
          break;
        }

        case WorkflowState.ELIGIBILITY_CALC: {
          const freshRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });
          const income = freshRun.incomeSnapshot as any;
          const education = freshRun.educationSnapshot as any;
          const eligible = income?.meetsThreshold === true && education?.enrollmentStatus === 'ACTIVE';
          await prisma.workflowRun.update({ where: { id: runId }, data: { eligibleResult: eligible } });
          await auditService.log({ citizenId: freshRun.citizenId, eventType: 'ELIGIBILITY_RESULT', actor: 'system', payload: { runId, eligible, reason: eligible ? 'MEETS_ALL_CRITERIA' : 'CRITERIA_NOT_MET' } });
          await this.transitionTo(freshRun, WorkflowState.SUBMITTED);
          break;
        }
      }
    } catch (err) {
      const freshRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });

      if (err instanceof ConsentViolationError) {
        await prisma.workflowRun.update({ where: { id: runId }, data: { state: WorkflowState.FAILED, failureReason: `CONSENT_REVOKED:${err.category}`, lastError: err.message } });
        await auditService.log({ citizenId: freshRun.citizenId, eventType: 'WORKFLOW_STATE_CHANGE', actor: 'system', payload: { runId, fromState: freshRun.state, toState: 'FAILED', reason: err.message } });
        return;
      }

      if (err instanceof ConnectorError && RETRY_POLICY.retryableStatusCodes.includes(err.statusCode)) {
        const newRetryCount = freshRun.retryCount + 1;
        if (newRetryCount < RETRY_POLICY.maxAttempts) {
          const delayMs = RETRY_POLICY.backoffMs[newRetryCount - 1] ?? 10000;
          await prisma.workflowRun.update({ where: { id: runId }, data: { state: WorkflowState.PENDING, retryCount: newRetryCount, lastError: err.message } });
          await auditService.log({ citizenId: freshRun.citizenId, eventType: 'WORKFLOW_STATE_CHANGE', actor: 'system', payload: { runId, fromState: freshRun.state, toState: 'PENDING', attempt: newRetryCount, nextRetryMs: delayMs } });
          await workflowRetryQueue.add('retry', { runId }, { delay: delayMs });
          return;
        }
      }

      await prisma.workflowRun.update({ where: { id: runId }, data: { state: WorkflowState.FAILED, failureReason: 'MAX_RETRIES_EXCEEDED', lastError: String(err) } });
      await auditService.log({ citizenId: freshRun.citizenId, eventType: 'WORKFLOW_STATE_CHANGE', actor: 'system', payload: { runId, fromState: freshRun.state, toState: 'FAILED', error: String(err) } });
    }
  }

  private async transitionTo(run: { id: string; citizenId: string; state: WorkflowState }, nextState: WorkflowState) {
    await prisma.$transaction([
      prisma.workflowRun.update({ where: { id: run.id }, data: { state: nextState } }),
      prisma.workflowStateHistory.create({ data: { runId: run.id, fromState: run.state, toState: nextState } }),
    ]);
    await auditService.log({ citizenId: run.citizenId, eventType: 'WORKFLOW_STATE_CHANGE', actor: 'system', payload: { runId: run.id, fromState: run.state, toState: nextState } });
  }
}

export const workflowEngine = new WorkflowEngine();
