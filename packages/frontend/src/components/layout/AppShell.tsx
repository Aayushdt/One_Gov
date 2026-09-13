import React from 'react';
import { Nav } from './Nav';
import { SystemHealthBar } from '../SystemHealthBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-base)' }}>
      <Nav />
      <main className="flex-1">{children}</main>
      <SystemHealthBar />
    </div>
  );
}
