import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Residents } from './pages/Residents';
import { Households } from './pages/Households';
import { Certificates } from './pages/Certificates';
import { Appointments } from './pages/Appointments';
import { BlotterPage } from './pages/Blotter';
import { Businesses } from './pages/Businesses';
import { Settings } from './pages/Settings';
import { VerifyDocument } from './pages/VerifyDocument';
import { Landing } from './pages/Landing';
import { KioskCertificates } from './pages/KioskCertificates';
import { QueueSchedule } from './pages/QueueSchedule';
import { QueueMonitor } from './pages/QueueMonitor';

// Route Guard to protect routes and handle RBAC checks
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[]; layout?: 'dashboard' | 'none' }> = ({ children, allowedRoles, layout = 'dashboard' }) => {
  const { token, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-3">Synchronizing sessions...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return layout === 'none' ? <>{children}</> : <DashboardLayout>{children}</DashboardLayout>;
};

// Route Guard for public-only auth routes (Login/Register)
const PublicAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Verification Page */}
        <Route path="/verify/document/:hash" element={<VerifyDocument />} />

        {/* Public Auth Routes */}
        <Route 
          path="/login" 
          element={
            <PublicAuthRoute>
              <Login />
            </PublicAuthRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicAuthRoute>
              <Register />
            </PublicAuthRoute>
          } 
        />

        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/residents" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Staff']}>
              <Residents />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/households" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Staff']}>
              <Households />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/certificates" 
          element={
            <ProtectedRoute>
              <Certificates />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/queue-schedule" 
          element={
            <ProtectedRoute>
              <QueueSchedule />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/kiosk/certificates" 
          element={<KioskCertificates />} 
        />

        <Route 
          path="/kiosk/queue" 
          element={<QueueMonitor />} 
        />

        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/blotter" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Barangay Captain', 'Secretary', 'Staff']}>
              <BlotterPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/businesses" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Barangay Captain', 'Secretary', 'Treasurer', 'Staff']}>
              <Businesses />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Security Watermark */}
      <div className="fixed inset-0 pointer-events-none select-none z-[9999] flex items-center justify-center overflow-hidden opacity-[0.008] dark:opacity-[0.004]">
        <div className="text-[7vw] font-light uppercase tracking-[0.3em] -rotate-[30deg] whitespace-nowrap text-black dark:text-slate-200">
          DEV LAWREENE B ARANAS
        </div>
      </div>
    </BrowserRouter>
  );
};
export default App;
