// src/components/session/withEmailVerification.js
import React, { useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFirebase } from '../firebase/context';
import { AuthUserContext } from './context';

// Hook
export const useEmailVerification = (authUser) => {
  const { doSendEmailVerification } = useFirebase();
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsVerification = authUser &&
    !authUser.emailVerified &&
    authUser.providerData.some(provider => provider.providerId === 'password');

  const sendVerification = async () => {
    if (!needsVerification) return;
    setLoading(true);
    setError('');
    try {
      await doSendEmailVerification();
      setIsSent(true);
      // Queue for PWA offline retry
      localStorage.setItem('verificationSent', Date.now().toString());
    } catch (err) {
      setError(err.message || 'Failed to send email. Retry?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check localStorage for offline retry
    const sentTime = localStorage.getItem('verificationSent');
    if (sentTime && Date.now() - parseInt(sentTime) > 5 * 60 * 1000) { // 5 min
      localStorage.removeItem('verificationSent');
      setIsSent(false);
    }
  }, []);

  return { needsVerification, sendVerification, isSent, loading, error };
};

// Legacy HOC (for migration – remove later)
export const withEmailVerification = (Component) => (props) => {
  const authUser = useContext(AuthUserContext);
  const { needsVerification, sendVerification, isSent, loading, error } = useEmailVerification(authUser);

  if (!needsVerification) return <Component {...props} />;

  return (
    <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
          Verify Your Email
        </h3>
        {isSent ? (
          <p className="text-yellow-800 dark:text-yellow-200 mb-4">
            Confirmation email sent! Check your inbox (including spam). Refresh after verifying.
          </p>
        ) : (
          <p className="text-yellow-800 dark:text-yellow-200 mb-4">
            Please verify your email to access full features. Check your inbox (including spam).
          </p>
        )}
        <button
          onClick={sendVerification}
          disabled={loading || isSent}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Sending...' : isSent ? 'Sent' : 'Send Verification Email'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </motion.div>
    </div>
  );
};

export default withEmailVerification;