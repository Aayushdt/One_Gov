import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ServicesPage } from './pages/ServicesPage';
import { ConsentPage } from './pages/ConsentPage';
import { StatusPage } from './pages/StatusPage';
import { ResultPage } from './pages/ResultPage';
import { AuditPage } from './pages/AuditPage';
import { OpsPage } from './pages/OpsPage';
import { ConsentDashboardPage } from './pages/ConsentDashboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuditNarrativePage } from './pages/AuditNarrativePage';
import { CertificatePage } from './pages/CertificatePage';
import { DataExportPage } from './pages/DataExportPage';
import { AppealPage } from './pages/AppealPage';
import { AdminOnboardingPage } from './pages/AdminOnboardingPage';
import { AdminAppealsPage } from './pages/AdminAppealsPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { useAuthStore } from './store/authStore';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const citizenId = useAuthStore(s => s.citizenId);
  if (!citizenId) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/certificate" element={<VerifyCertificatePage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/services" element={<RequireAuth><ServicesPage /></RequireAuth>} />
        <Route path="/consent-dashboard" element={<RequireAuth><ConsentDashboardPage /></RequireAuth>} />
        <Route path="/apply/:runId" element={<RequireAuth><ConsentPage /></RequireAuth>} />
        <Route path="/consent/:runId" element={<RequireAuth><ConsentPage /></RequireAuth>} />
        <Route path="/status/:runId" element={<RequireAuth><StatusPage /></RequireAuth>} />
        <Route path="/result/:runId" element={<RequireAuth><ResultPage /></RequireAuth>} />
        <Route path="/certificate/:runId" element={<RequireAuth><CertificatePage /></RequireAuth>} />
        <Route path="/appeal/:runId" element={<RequireAuth><AppealPage /></RequireAuth>} />
        <Route path="/data-export" element={<RequireAuth><DataExportPage /></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth><AuditPage /></RequireAuth>} />
        <Route path="/my-history" element={<RequireAuth><AuditNarrativePage /></RequireAuth>} />
        <Route path="/admin/onboarding" element={<RequireAuth><AdminOnboardingPage /></RequireAuth>} />
        <Route path="/admin/appeals" element={<RequireAuth><AdminAppealsPage /></RequireAuth>} />
        <Route path="/ops" element={<OpsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
