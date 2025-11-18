import { useState } from 'react';
import { signIn, getCurrentUserData } from '../lib/authService';
import { useNavigate } from 'react-router-dom';
import EmailVerification from './EmailVerification';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      
      // Check if email is verified
      if (!user.emailVerified) {
        setShowVerification(true);
        setLoading(false);
        return;
      }

      // Get user data from Firestore
      const userData = await getCurrentUserData();
      
      if (!userData) {
        setError('User account not found. Please contact support.');
        setLoading(false);
        return;
      }

      // Check if account is active
      if (userData.status !== 'active') {
        setError('Your account is pending approval. Please check your email or contact support.');
        setLoading(false);
        return;
      }

      // Successfully logged in - navigate to dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Firebase error handling
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleVerified() {
    // Reload page to trigger auth check
    window.location.reload();
  }

  // Show email verification screen if user hasn't verified email
  if (showVerification) {
    return <EmailVerification email={email} onVerified={handleVerified} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Michigan ESTA Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Earned Sick Time Act Compliance
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input appearance-none rounded-none relative block w-full rounded-t-md"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input appearance-none rounded-none relative block w-full rounded-b-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary group relative w-full flex justify-center py-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Don't have an account? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
