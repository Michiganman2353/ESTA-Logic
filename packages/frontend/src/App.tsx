import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUserData, UserData } from './lib/authService';
import { User as FirebaseUser } from 'firebase/auth';

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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChange(async (user) => {
      setFirebaseUser(user);
      
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Connection Error
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
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
