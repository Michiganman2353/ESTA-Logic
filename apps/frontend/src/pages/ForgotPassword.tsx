import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { Navigation } from '@/components/Navigation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="my-4">
          Enter the email you used to create your account. After resetting your
          password, return to sign in.
        </p>
        <form
          className="grid gap-4 rounded-2xl border bg-white p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError('');
            setNotice('');
            void (async () => {
              try {
                if (!auth)
                  throw new Error(
                    'Account service is unavailable. Please try again later.'
                  );
                await sendPasswordResetEmail(auth, email.trim().toLowerCase());
                setNotice(
                  'If an account uses this email, you will receive a password reset link. Check your inbox and spam folder.'
                );
              } catch (failure) {
                const code = (failure as { code?: string }).code;
                if (code === 'auth/user-not-found')
                  setNotice(
                    'If an account uses this email, you will receive a password reset link. Check your inbox and spam folder.'
                  );
                else
                  setError(
                    code === 'auth/too-many-requests'
                      ? 'Too many attempts. Wait a few minutes and try again.'
                      : 'Unable to request a reset link. Check the email and your connection, then retry.'
                  );
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <label>
            Account email
            <input
              className="input mt-1 w-full"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Requesting…' : 'Send reset link'}
          </button>
        </form>
        {notice && (
          <p role="status" className="my-4 text-green-800">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="my-4 text-red-800">
            {error}
          </p>
        )}
        <Link
          className="mt-5 inline-block font-semibold text-blue-800 underline"
          to="/login"
        >
          Return to sign in
        </Link>
      </main>
    </div>
  );
}
