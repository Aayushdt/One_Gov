import { WorkflowState, DataCategory } from '@prisma/client';
import { prisma } from '../config/db';
import {
  identityConnector, educationConnector, revenueConnector,
  transportConnector, policeConnector, bankingConnector, welfareConnector,
  ConsentViolationError, ConnectorError
} from '../connectors/connectors';
import { auditService } from '../audit/audit.service';
import { workflowRetryQueue } from './queue';

const RETRY_POLICY = {
  maxAttempts: 3,
  backoffMs: [2000, 5000, 10000],
  retryableStatusCodes: [503, 429, 504],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class WorkflowEngine {
  async advance(runId: string): Promise<void> {
    const run = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });
    const serviceType = run.serviceType || 'SCHOLARSHIP';

    try {
      switch (run.state) {
        case WorkflowState.AWAITING_CONSENT:
          await delay(600);
          await this.transitionTo(run, WorkflowState.IDENTITY_VERIFY);
          await this.advance(runId);
          break;

        case WorkflowState.IDENTITY_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const identity = await identityConnector.fetchAndNormalize(map.identityDeptId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { identitySnapshot: identity as any } });
          await delay(800);

          if (serviceType === 'TRANSPORT') {
            await this.transitionTo(run, WorkflowState.TRANSPORT_VERIFY);
          } else if (serviceType === 'WELFARE') {
            await this.transitionTo(run, WorkflowState.INCOME_VERIFY);
          } else {
            await this.transitionTo(run, WorkflowState.EDUCATION_VERIFY);
          }
          await this.advance(runId);
          break;
        }

        case WorkflowState.EDUCATION_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const education = await educationConnector.fetchAndNormalize(map.educationDeptId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { educationSnapshot: education as any } });
          await delay(800);
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
          await delay(800);

          if (serviceType === 'WELFARE') {
            await this.transitionTo(freshRun, WorkflowState.WELFARE_VERIFY);
          } else {
            await this.transitionTo(freshRun, WorkflowState.ELIGIBILITY_CALC);
          }
          await this.advance(runId);
          break;
        }

        case WorkflowState.TRANSPORT_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const transportId = map.transportDeptId || `SIM-DL-${run.citizenId.slice(-6)}`;
          const transport = await transportConnector.fetchAndNormalize(transportId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { transportSnapshot: transport as any } });
          await delay(800);
          await this.transitionTo(run, WorkflowState.POLICE_VERIFY);
          await this.advance(runId);
          break;
        }

        case WorkflowState.POLICE_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const policeId = map.policeDeptId || `SIM-POL-${run.citizenId.slice(-6)}`;
          const police = await policeConnector.fetchAndNormalize(policeId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { policeSnapshot: police as any } });
          await delay(800);
          await this.transitionTo(run, WorkflowState.BANKING_VERIFY);
          await this.advance(runId);
          break;
        }

        case WorkflowState.WELFARE_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const welfareId = map.welfareDeptId || `SIM-WEL-${run.citizenId.slice(-6)}`;
          const welfare = await welfareConnector.fetchAndNormalize(welfareId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { welfareSnapshot: welfare as any } });
          await delay(800);
          await this.transitionTo(run, WorkflowState.BANKING_VERIFY);
          await this.advance(runId);
          break;
        }

        case WorkflowState.BANKING_VERIFY: {
          const map = await prisma.identityMap.findUniqueOrThrow({ where: { citizenId: run.citizenId } });
          const bankingId = map.bankingDeptId || `SIM-BANK-${run.citizenId.slice(-6)}`;
          const banking = await bankingConnector.fetchAndNormalize(bankingId, runId, run.citizenId);
          await prisma.workflowRun.update({ where: { id: runId }, data: { bankingSnapshot: banking as any } });
          await delay(800);
          await this.transitionTo(run, WorkflowState.ELIGIBILITY_CALC);
          await this.advance(runId);
          break;
        }

        case WorkflowState.ELIGIBILITY_CALC: {
          const freshRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });
          const income = freshRun.incomeSnapshot as any;
          const education = freshRun.educationSnapshot as any;
          const transport = freshRun.transportSnapshot as any;
          const police = freshRun.policeSnapshot as any;
          const banking = freshRun.bankingSnapshot as any;
          const welfare = freshRun.welfareSnapshot as any;

          let eligible = false;
          let reason = 'CRITERIA_NOT_MET';

          if (serviceType === 'TRANSPORT') {
            eligible = transport?.dlStatus === 'VALID' && transport?.cleanDrivingRecord === true && police?.clearanceStatus === 'CLEARED' && banking?.kycStatus === 'VERIFIED';
            reason = eligible ? 'TRANSPORT_CLEARANCE_APPROVED' : transport?.dlStatus !== 'VALID' ? 'DRIVING_LICENCE_EXPIRED' : transport?.cleanDrivingRecord !== true ? 'UNPAID_TRAFFIC_CHALLANS' : police?.clearanceStatus !== 'CLEARED' ? 'POLICE_CLEARANCE_PENDING' : 'BANK_KYC_REQUIRED';
          } else if (serviceType === 'WELFARE') {
            eligible = (income?.eligibilityBand === 'LOW' || welfare?.bplStatus === true) && banking?.dbtEnabled === true;
            reason = eligible ? 'WELFARE_BENEFIT_APPROVED' : banking?.dbtEnabled !== true ? 'DBT_BANK_LINK_REQUIRED' : 'INCOME_CEILING_EXCEEDED';
          } else {
            // Default: STEM / Higher Education Scholarship
            eligible = income?.meetsThreshold === true && education?.enrollmentStatus === 'ACTIVE';
            reason = eligible ? 'MEETS_ALL_CRITERIA' : income?.meetsThreshold !== true ? 'INCOME_CEILING_EXCEEDED' : 'ACTIVE_ENROLLMENT_REQUIRED';
          }

          await prisma.workflowRun.update({ where: { id: runId }, data: { eligibleResult: eligible } });
          await auditService.log({ citizenId: freshRun.citizenId, eventType: 'ELIGIBILITY_RESULT', actor: 'system', payload: { runId, serviceType, eligible, reason } });
          await delay(600);
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
