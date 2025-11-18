import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUserData, UserData } from './lib/authService';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterEmployee from './pages/RegisterEmployee';
import RegisterManager from './pages/RegisterManager';
import RegisterSuccess from './pages/RegisterSuccess';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AuditLog from './pages/AuditLog';

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChange(async (user) => {
      
      if (user) {
        try {
          // Get user data from Firestore
          const data = await getCurrentUserData();
          
          if (data) {
            // Only set userData if email is verified and status is active
            if (data.emailVerified && data.status === 'active') {
              setUserData(data);
            } else {
              setUserData(null);
            }
          } else {
            setUserData(null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-xl mb-4">Loading...</div>
          <div className="text-sm text-gray-500">Connecting to ESTA Tracker</div>
        </div>
      </div>
    );
  }

  // Convert UserData to User type for compatibility with existing components
  const legacyUser = userData ? {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role === 'manager' ? 'employer' as const : userData.role,
    employerId: userData.tenantId || undefined,
    employerSize: 'small' as const, // Will be fetched from tenant data when needed
    status: userData.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!userData ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!userData ? <Register /> : <Navigate to="/" />} />
        <Route path="/register/employee" element={!userData ? <RegisterEmployee /> : <Navigate to="/" />} />
        <Route path="/register/manager" element={!userData ? <RegisterManager /> : <Navigate to="/" />} />
        <Route path="/register/success" element={<RegisterSuccess />} />
        
        {legacyUser ? (
          <>
            <Route path="/" element={<Dashboard user={legacyUser} />} />
            <Route path="/employee" element={<EmployeeDashboard user={legacyUser} />} />
            <Route path="/employer" element={<EmployerDashboard user={legacyUser} />} />
            <Route path="/audit" element={<AuditLog user={legacyUser} />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
