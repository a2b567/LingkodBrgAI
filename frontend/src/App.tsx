import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Core entry routes (synchronously imported for instant reliability)
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';

// Auto-retrying lazy loader that gracefully handles deployment chunk hash invalidations
function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const hasReloaded = sessionStorage.getItem('chunk_reload');
    try {
      const component = await factory();
      sessionStorage.removeItem('chunk_reload');
      return component;
    } catch (error: any) {
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// Lazy-loaded secondary modules (asynchronously fetched on demand with auto-reload protection)
const Dashboard = lazyRetry(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Residents = lazyRetry(() => import('./pages/Residents').then(m => ({ default: m.Residents })));
const Households = lazyRetry(() => import('./pages/Households').then(m => ({ default: m.Households })));
const Certificates = lazyRetry(() => import('./pages/Certificates').then(m => ({ default: m.Certificates })));
const Appointments = lazyRetry(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const BlotterPage = lazyRetry(() => import('./pages/Blotter').then(m => ({ default: m.BlotterPage })));
const Businesses = lazyRetry(() => import('./pages/Businesses').then(m => ({ default: m.Businesses })));
const Settings = lazyRetry(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const VerifyDocument = lazyRetry(() => import('./pages/VerifyDocument').then(m => ({ default: m.VerifyDocument })));
const KioskCertificates = lazyRetry(() => import('./pages/KioskCertificates').then(m => ({ default: m.KioskCertificates })));
const QueueSchedule = lazyRetry(() => import('./pages/QueueSchedule').then(m => ({ default: m.QueueSchedule })));
const QueueMonitor = lazyRetry(() => import('./pages/QueueMonitor').then(m => ({ default: m.QueueMonitor })));
const HealthRecords = lazyRetry(() => import('./pages/HealthRecords').then(m => ({ default: m.HealthRecords })));
const ClinicQueueView = lazyRetry(() => import('./pages/ClinicQueueView').then(m => ({ default: m.ClinicQueueView })));
const StaffAccounts = lazyRetry(() => import('./pages/StaffAccounts').then(m => ({ default: m.StaffAccounts })));
const DevConsole = lazyRetry(() => import('./pages/DevConsole').then(m => ({ default: m.DevConsole })));

// Ultra lightweight route fallback loader
const RouteFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center">
    <div className="w-8 h-8 border-3 border-gov-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[11px] font-semibold text-slate-400 mt-3 tracking-wide">Loading module...</span>
  </div>
);


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
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        {/* Public Verification Page */}
        <Route path="/verify/document/:hash" element={<VerifyDocument />} />
        <Route path="/verify/resident/:hash" element={<VerifyDocument />} />
        <Route path="/verify/:hash" element={<VerifyDocument />} />

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
          path="/health-records" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Barangay Captain', 'Health Worker', 'Staff']}>
              <HealthRecords />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/clinic-queue" 
          element={
            <ProtectedRoute>
              <ClinicQueueView />
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

        <Route 
          path="/staff-accounts" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Barangay Captain']}>
              <StaffAccounts />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dev-console" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevConsole />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>

      {/* Global Progressive Web App Install Banner */}
      <PWAInstallBanner />
    </BrowserRouter>
  );
};
export default App;
