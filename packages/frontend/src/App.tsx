import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ServicesPage } from './pages/ServicesPage';
import { ConsentPage } from './pages/ConsentPage';
import { StatusPage } from './pages/StatusPage';
import { ResultPage } from './pages/ResultPage';
import { AuditPage } from './pages/AuditPage';
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
        <Route path="/services" element={<RequireAuth><ServicesPage /></RequireAuth>} />
        <Route path="/apply/:runId" element={<RequireAuth><ConsentPage /></RequireAuth>} />
        <Route path="/status/:runId" element={<RequireAuth><StatusPage /></RequireAuth>} />
        <Route path="/result/:runId" element={<RequireAuth><ResultPage /></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth><AuditPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
