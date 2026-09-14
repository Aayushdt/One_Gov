import { WorkflowState, DataCategory } from '@prisma/client';
import { prisma } from '../config/db';
import { connectorRegistry } from '../registry/connector.registry';
import { ConnectorRunner, ConsentViolationError, ConnectorError } from '../connectors/runner';
import { auditService } from '../audit/audit.service';
import { workflowRetryQueue } from './queue';
import { notificationService } from '../notifications/notification.service';
import { certificateService } from '../certificates/certificate.service';

export { ConsentViolationError, ConnectorError };

const RETRY_POLICY = {
  maxAttempts: 3,
  backoffMs: [2000, 5000, 10000],
  retryableStatusCodes: [503, 429, 504],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getSnapshotField(category: DataCategory): string {
  switch (category) {
    case DataCategory.IDENTITY: return 'identitySnapshot';
    case DataCategory.EDUCATION: return 'educationSnapshot';
    case DataCategory.INCOME: return 'incomeSnapshot';
    case DataCategory.TRANSPORT: return 'transportSnapshot';
    case DataCategory.POLICE: return 'policeSnapshot';
    case DataCategory.BANKING: return 'bankingSnapshot';
    case DataCategory.WELFARE: return 'welfareSnapshot';
    case DataCategory.MUNICIPAL: return 'municipalSnapshot';
    default: return `${(category as string).toLowerCase()}Snapshot`;
  }
}

function getExternalId(map: any, category: DataCategory, citizenId: string): string {
  switch (category) {
    case DataCategory.IDENTITY:
      return map.identityDeptId;
    case DataCategory.EDUCATION:
      return map.educationDeptId;
    case DataCategory.INCOME:
      return map.revenueDeptId;
    case DataCategory.TRANSPORT:
      return map.transportDeptId || `SIM-DL-${citizenId.slice(-6)}`;
    case DataCategory.POLICE:
      return map.policeDeptId || `SIM-POL-${citizenId.slice(-6)}`;
    case DataCategory.BANKING:
      return map.bankingDeptId || `SIM-BANK-${citizenId.slice(-6)}`;
    case DataCategory.WELFARE:
      return map.welfareDeptId || `SIM-WEL-${citizenId.slice(-6)}`;
    case DataCategory.MUNICIPAL:
      return map.municipalDeptId || `SIM-PROP-${citizenId.slice(-6)}`;
    default:
      return citizenId;
  }
}

export class WorkflowEngine {
  async advance(runId: string): Promise<void> {
    const run = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });
    const serviceType = run.serviceType || 'SCHOLARSHIP';

    // Retrieve service definition from registry
    const serviceDef = await connectorRegistry.getServiceDefinition(serviceType);
    if (!serviceDef) {
      throw new Error(`Unknown service type: ${serviceType}`);
    }

    const steps = (serviceDef.steps as any[]) || [];

    try {
      // 1. Initial State: Awaiting Consent
      if (run.state === WorkflowState.AWAITING_CONSENT) {
        await delay(600);
        const firstStepState = (steps[0]?.stateName as WorkflowState) || WorkflowState.IDENTITY_VERIFY;
        await this.transitionTo(run, firstStepState);
        await this.advance(runId);
        return;
      }

      // 2. Final State: Eligibility Calculation
      if (run.state === WorkflowState.ELIGIBILITY_CALC) {
        await this.calculateAndSubmit(run, serviceDef);
        return;
      }

      // 3. Completed or Terminal States
      if (run.state === WorkflowState.SUBMITTED || run.state === WorkflowState.FAILED) {
        return;
      }

      // 4. Connector Step Execution (including PENDING retry)
      // Determine which step to run
      let currentStepIndex = -1;
      if (run.state === WorkflowState.PENDING) {
        // Find the first step whose snapshot is not yet saved
        currentStepIndex = steps.findIndex((step) => {
          const snapshotKey = getSnapshotField(step.category);
          return (run as any)[snapshotKey] === null || (run as any)[snapshotKey] === undefined;
        });
      } else {
        currentStepIndex = steps.findIndex((s) => s.stateName === run.state);
      }

      if (currentStepIndex === -1) {
        // If all steps have snapshots, proceed to eligibility calculation
        await this.transitionTo(run, WorkflowState.ELIGIBILITY_CALC);
        await this.advance(runId);
        return;
      }

      const step = steps[currentStepIndex];

      // Federation guard on identity step
      const map = await prisma.identityMap.findUnique({ where: { citizenId: run.citizenId } });
      if (step.category === DataCategory.IDENTITY) {
        if (!map || !map.identityDeptId) {
          await delay(400);
          await prisma.workflowRun.update({
            where: { id: runId },
            data: {
              state: WorkflowState.FAILED,
              failureReason: 'UNLINKED_FEDERATION_RECORD',
              lastError: 'Self-registered citizen account is not linked to departmental registries (UIDAI Aadhaar / CBDT PAN / NAD). In GovLink, multi-agency verification requires an active federated IdentityMap. Please test using a seeded reference persona from DEMO_CREDENTIALS.md.',
            },
          });
          await auditService.log({
            citizenId: run.citizenId,
            eventType: 'WORKFLOW_STATE_CHANGE',
            actor: 'system',
            payload: {
              runId,
              fromState: run.state,
              toState: 'FAILED',
              reason: 'UNLINKED_FEDERATION_RECORD: Citizen has no linked departmental records in federated IdentityMap',
            },
          });
          return;
        }
      }

      const externalId = getExternalId(map, step.category, run.citizenId);

      // Fetch connector from registry
      const manifest = await connectorRegistry.getConnector(step.connectorSlug);
      if (!manifest) {
        throw new Error(`Connector manifest '${step.connectorSlug}' not found in registry`);
      }

      const runner = new ConnectorRunner(manifest);
      const attempt = (run.state === WorkflowState.PENDING || run.retryCount > 0) ? run.retryCount + 1 : 1;

      const cdm = await runner.fetchAndNormalize(externalId, runId, run.citizenId, attempt, serviceType);

      // Save snapshot
      const snapshotKey = getSnapshotField(step.category);
      await prisma.workflowRun.update({
        where: { id: runId },
        data: { [snapshotKey]: cdm as any },
      });

      await delay(800);

      // Determine next state
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < steps.length) {
        const nextState = steps[nextStepIndex].stateName as WorkflowState;
        await this.transitionTo(run, nextState);
      } else {
        await this.transitionTo(run, WorkflowState.ELIGIBILITY_CALC);
      }

      await this.advance(runId);
    } catch (err) {
      const freshRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: runId } });

      if (err instanceof ConsentViolationError) {
        await prisma.workflowRun.update({
          where: { id: runId },
          data: {
            state: WorkflowState.FAILED,
            failureReason: `CONSENT_REVOKED:${err.category}`,
            lastError: err.message,
          },
        });
        await auditService.log({
          citizenId: freshRun.citizenId,
          eventType: 'WORKFLOW_STATE_CHANGE',
          actor: 'system',
          payload: {
            runId,
            fromState: freshRun.state,
            toState: 'FAILED',
            reason: err.message,
          },
        });
        try {
          await notificationService.emitNotification({
            citizenId: freshRun.citizenId,
            type: 'WORKFLOW_FAILED',
            title: 'Application Pipeline Stopped',
            body: `Application halted: Consent for category ${err.category} was revoked.`,
            metadata: { runId, reason: err.message },
          });
        } catch (nErr) {
          console.error('[WorkflowEngine] Failed to emit failure notification:', nErr);
        }
        return;
      }

      if (err instanceof ConnectorError && RETRY_POLICY.retryableStatusCodes.includes(err.statusCode)) {
        const newRetryCount = freshRun.retryCount + 1;
        if (newRetryCount < RETRY_POLICY.maxAttempts) {
          const delayMs = RETRY_POLICY.backoffMs[newRetryCount - 1] ?? 10000;
          await prisma.workflowRun.update({
            where: { id: runId },
            data: {
              state: WorkflowState.PENDING,
              retryCount: newRetryCount,
              lastError: err.message,
            },
          });
          await auditService.log({
            citizenId: freshRun.citizenId,
            eventType: 'WORKFLOW_STATE_CHANGE',
            actor: 'system',
            payload: {
              runId,
              fromState: freshRun.state,
              toState: 'PENDING',
              attempt: newRetryCount,
              nextRetryMs: delayMs,
            },
          });
          await workflowRetryQueue.add('retry', { runId }, { delay: delayMs });
          return;
        }
      }

      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          state: WorkflowState.FAILED,
          failureReason: 'MAX_RETRIES_EXCEEDED',
          lastError: String(err),
        },
      });
      await auditService.log({
        citizenId: freshRun.citizenId,
        eventType: 'WORKFLOW_STATE_CHANGE',
        actor: 'system',
        payload: {
          runId,
          fromState: freshRun.state,
          toState: 'FAILED',
          error: String(err),
        },
      });
      try {
        await notificationService.emitNotification({
          citizenId: freshRun.citizenId,
          type: 'WORKFLOW_FAILED',
          title: 'Application Verification Failed',
          body: `Application stopped due to connector error or circuit breaker: ${String(err)}`,
          metadata: { runId, error: String(err) },
        });
      } catch (nErr) {
        console.error('[WorkflowEngine] Failed to emit failure notification:', nErr);
      }
    }
  }

  private async calculateAndSubmit(run: any, serviceDef: any): Promise<void> {
    const freshRun = await prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id } });
    const income = freshRun.incomeSnapshot as any;
    const education = freshRun.educationSnapshot as any;
    const transport = freshRun.transportSnapshot as any;
    const police = freshRun.policeSnapshot as any;
    const banking = freshRun.bankingSnapshot as any;
    const welfare = freshRun.welfareSnapshot as any;
    const serviceType = freshRun.serviceType || 'SCHOLARSHIP';

    let eligible = false;
    let reason = 'CRITERIA_NOT_MET';

    if (serviceType === 'TRANSPORT') {
      const municipal = freshRun.municipalSnapshot as any;
      eligible =
        transport?.dlStatus === 'VALID' &&
        transport?.cleanDrivingRecord === true &&
        police?.clearanceStatus === 'CLEARED' &&
        banking?.kycStatus === 'VERIFIED' &&
        municipal?.propertyTaxClearance === true;

      reason = eligible
        ? 'TRANSPORT_CLEARANCE_APPROVED'
        : transport?.dlStatus !== 'VALID'
        ? 'DRIVING_LICENCE_EXPIRED'
        : transport?.cleanDrivingRecord !== true
        ? 'UNPAID_TRAFFIC_CHALLANS'
        : police?.clearanceStatus !== 'CLEARED'
        ? 'POLICE_CLEARANCE_PENDING'
        : municipal?.propertyTaxClearance !== true
        ? 'PROPERTY_TAX_ENCUMBRANCE'
        : 'BANK_KYC_REQUIRED';
    } else if (serviceType === 'WELFARE') {
      eligible =
        (income?.eligibilityBand === 'LOW' || welfare?.bplStatus === true) &&
        banking?.dbtEnabled === true;

      reason = eligible
        ? 'WELFARE_BENEFIT_APPROVED'
        : banking?.dbtEnabled !== true
        ? 'DBT_BANK_LINK_REQUIRED'
        : 'INCOME_CEILING_EXCEEDED';
    } else {
      // Default: SCHOLARSHIP
      eligible = income?.meetsThreshold === true && education?.enrollmentStatus === 'ACTIVE';
      reason = eligible
        ? 'MEETS_ALL_CRITERIA'
        : income?.meetsThreshold !== true
        ? 'INCOME_CEILING_EXCEEDED'
        : 'ACTIVE_ENROLLMENT_REQUIRED';
    }

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { eligibleResult: eligible },
    });
    await auditService.log({
      citizenId: freshRun.citizenId,
      eventType: 'ELIGIBILITY_RESULT',
      actor: 'system',
      payload: { runId: run.id, serviceType, eligible, reason },
    });

    if (eligible) {
      try {
        await certificateService.issue(run.id);
      } catch (cErr) {
        console.error('[WorkflowEngine] Failed to issue certificate:', cErr);
      }
    }

    await delay(600);
    await this.transitionTo(freshRun, WorkflowState.SUBMITTED);
  }

  private async transitionTo(
    run: { id: string; citizenId: string; state: WorkflowState },
    nextState: WorkflowState
  ): Promise<void> {
    await prisma.$transaction([
      prisma.workflowRun.update({ where: { id: run.id }, data: { state: nextState } }),
      prisma.workflowStateHistory.create({
        data: { runId: run.id, fromState: run.state, toState: nextState },
      }),
    ]);
    await auditService.log({
      citizenId: run.citizenId,
      eventType: 'WORKFLOW_STATE_CHANGE',
      actor: 'system',
      payload: { runId: run.id, fromState: run.state, toState: nextState },
    });

    if (nextState === WorkflowState.SUBMITTED) {
      try {
        await notificationService.emitNotification({
          citizenId: run.citizenId,
          type: 'WORKFLOW_COMPLETED',
          title: 'Application Verification Completed',
          body: `Your application run (${run.id.slice(0, 8)}…) has completed automated verification and was successfully submitted.`,
          metadata: { runId: run.id, state: nextState },
        });
      } catch (e) {
        console.error('[WorkflowEngine] Failed to emit completion notification:', e);
      }
    }
  }
}

export const workflowEngine = new WorkflowEngine();
