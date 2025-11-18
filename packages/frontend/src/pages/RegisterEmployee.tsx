import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerEmployee } from '../lib/authService';
import EmailVerification from './EmailVerification';

export default function RegisterEmployee() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [tenantName, setTenantName] = useState('');
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

    if (!tenantCode.trim()) {
      setError('Employer tenant code is required');
      return;
    }

    setLoading(true);

    try {
      const result = await registerEmployee({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        tenantCode: tenantCode.trim().toUpperCase(),
      });

      // Store tenant name for display
      setTenantName(result.tenantName);
      
      // Show email verification screen
      setShowVerification(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Firebase error handling
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or try logging in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please enter a valid email.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.message === 'Invalid tenant code. Please check with your employer.') {
        setError('Invalid employer code. Please check with your employer and try again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleVerified() {
    // Redirect to success page
    navigate('/register/success', { 
      state: { 
        role: 'employee', 
        tenantName,
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
            Employee Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Create your ESTA Tracker employee account
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
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tenantCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Employer Code
              </label>
              <input
                id="tenantCode"
                name="tenantCode"
                type="text"
                required
                className="input mt-1 block w-full uppercase"
                placeholder="ABC123"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Get this 6-character code from your employer
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
              {loading ? 'Creating account...' : 'Register as Employee'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate('/register/manager')}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Register as Manager instead?
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
