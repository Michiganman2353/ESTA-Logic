import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerManager } from '../lib/authService';
import EmailVerification from './EmailVerification';

export default function RegisterManager() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [tenantCode, setTenantCode] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Full name is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    const empCount = parseInt(employeeCount);
    if (isNaN(empCount) || empCount < 1) {
      setError('Please enter a valid employee count');
      return;
    }

    setLoading(true);

    try {
      const result = await registerManager({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        companyName: companyName.trim(),
        employeeCount: empCount,
      });

      // Store tenant code to display later
      setTenantCode(result.tenantCode);
      
      // Show email verification screen
      setShowVerification(true);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Firebase error handling
      const error = err as { code?: string; message?: string };
      
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or try logging in.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address. Please enter a valid email.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleVerified() {
    // Redirect to success page with tenant code
    navigate('/register/success', { 
      state: { 
        role: 'manager', 
        tenantCode, 
        companyName,
        email 
      } 
    });
  }

  // Show email verification screen after successful registration
  if (showVerification) {
    return <EmailVerification email={email} onVerified={handleVerified} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Manager Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Create your ESTA Tracker manager account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input mt-1 block w-full"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input mt-1 block w-full"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                className="input mt-1 block w-full"
                placeholder="Your Company LLC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of Employees
              </label>
              <input
                id="employeeCount"
                name="employeeCount"
                type="number"
                min="1"
                required
                className="input mt-1 block w-full"
                placeholder="10"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This determines your compliance requirements under Michigan ESTA law
              </p>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input mt-1 block w-full"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input mt-1 block w-full"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary group relative w-full flex justify-center py-2"
            >
              {loading ? 'Creating account...' : 'Register as Manager'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate('/register/employee')}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Register as Employee instead?
            </button>
            <div>
              <a
                href="/login"
                className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400"
              >
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
