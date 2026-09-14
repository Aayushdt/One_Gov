// PII-STRIP FIX (2026-09-14) & CONNECTOR REGISTRY (Phase 1 / Item 1):
// Concrete connector classes have been replaced by the manifest-driven
// ConnectorRunner (see ./runner.ts) which dynamically loads connector
// manifests from the ConnectorRegistry.
//
// ConsentViolationError and ConnectorError are re-exported here for backwards compatibility.

export {
  ConsentViolationError,
  ConnectorError,
  SchemaValidationError,
  ConnectorRunner,
  NORMALIZERS,
} from './runner';
