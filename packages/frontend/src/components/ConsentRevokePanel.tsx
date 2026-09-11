import React from 'react';
import { ConsentArtefact, DataCategory } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { api } from '../hooks/useApi';

interface Props {
  artefacts: ConsentArtefact[];
  runId: string;
  onRevoked: () => void;
}

const CATEGORY_LABELS: Record<DataCategory, string> = {
  IDENTITY: 'Identity & Demographics',
  EDUCATION: 'Higher Education',
  INCOME: 'Income Tax Band',
  TRANSPORT: 'Driving Licence & RTO',
  POLICE: 'Police Clearance',
  BANKING: 'Core Banking & KYC',
  WELFARE: 'Public Welfare & PDS',
  MUNICIPAL: 'Municipal Records',
};

export function ConsentRevokePanel({ artefacts, runId, onRevoked }: Props) {
  const [revoking, setRevoking] = React.useState<DataCategory | null>(null);

  const handleRevoke = async (category: DataCategory) => {
    setRevoking(category);
    try {
      await api.revokeConsent(runId, category);
      onRevoked();
    } catch (e) { console.error(e); }
    finally { setRevoking(null); }
  };

  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Active Consents</p>
      <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>For this application run</p>

      {artefacts.map((a, i) => (
        <div key={a.id} style={{ paddingTop: 12, paddingBottom: 12, borderTop: i === 0 ? '1px solid var(--color-border-subtle)' : undefined, borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Inter", system-ui, sans-serif' }}>{CATEGORY_LABELS[a.category]}</p>
            {a.status === 'REVOKED' && a.revokedAt && (
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                Revoked at {new Date(a.revokedAt).toLocaleTimeString()} — fetches blocked
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge variant={a.status === 'ACTIVE' ? 'active' : a.status === 'REVOKED' ? 'revoked' : 'expired'}>{a.status}</Badge>
            {a.status === 'ACTIVE' && (
              <Button variant="destructive" size="sm" onClick={() => handleRevoke(a.category)} disabled={revoking === a.category}>
                {revoking === a.category ? '…' : 'Revoke'}
              </Button>
            )}
          </div>
        </div>
      ))}

      {artefacts[0] && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Consent valid until</p>
          <p style={{ margin: '2px 0 0', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{new Date(artefacts[0].expiresAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
