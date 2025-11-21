/**
 * App Component
 * 
 * This is the root component for the ESTA Tracker web application.
 * It manages authentication state, routes, and global error handling.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { MaintenanceMode } from './components/MaintenanceMode';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterEmployee from './pages/RegisterEmployee';
import RegisterManager from './pages/RegisterManager';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';

function AppRoutes() {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MaintenanceMode />
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!currentUser ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register" 
          element={!currentUser ? <Register /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register/employee" 
          element={!currentUser ? <RegisterEmployee /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register/manager"
          element={!currentUser ? <RegisterManager /> : <Navigate to="/" replace />}
        />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected routes (no null assertions) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/employee" 
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/employer" 
          element={
            <ProtectedRoute allowedRoles={['employer', 'admin']}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/audit" 
          element={
            <ProtectedRoute>
              <AuditLog />
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

        {/* Catch-all */}
        <Route 
          path="*" 
          element={<Navigate to={currentUser ? "/" : "/login"} replace />} 
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;