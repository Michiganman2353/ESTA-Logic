// src/components/EmployeeDashboard.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PDFDownloadLink, Document, Page, Text, View } from '@react-pdf/renderer'; // npm i @react-pdf/renderer
import { useAuth } from '../contexts/AuthContext';
import { logWorkHours, getSickBalance, requestSickLeave } from '../services/firebase';
import { debounce } from 'lodash'; // Add to deps if not present
import { ROLES } from '../../constants/roles'; // From upgraded roles.js
import { useFocusTrap } from '../../hooks/useFocusTrap'; // Add hook for accessibility

const ELITE_VALIDATION = {
  hoursMin: 0.25,
  hoursMax: 24,
  reasonMin: 10,
  reasonMax: 500,
};

const EmployeeDashboard = () => {
  const { user, roles } = useAuth();
  const [hours, setHours] = useState('');
  const [balance, setBalance] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [offlineQueue, setOfflineQueue] = useState([]); // PWA offline requests
  const focusRef = useFocusTrap(); // Accessibility trap

  // Debounced input for performance
  const debouncedSetHours = useCallback(debounce((value) => {
    setHours(value);
  }, 300), []);

  // Load balance (with offline fallback)
  useEffect(() => {
    if (user) {
      const loadBalance = async () => {
        try {
          const bal = await getSickBalance(user.uid);
          setBalance(bal);
          localStorage.setItem('sickBalance', bal.toString()); // Cache for offline
        } catch (err) {
          if (navigator.onLine) {
            setError('Failed to load balance. Retry?');
          } else {
            // Offline fallback
            const cached = localStorage.getItem('sickBalance');
            if (cached) setBalance(parseFloat(cached));
          }
        }
      };
      loadBalance();

      // Auto-refresh every 5min (accrual)
      const interval = setInterval(loadBalance, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Role guard (HR vs Employee)
  const isHR = roles?.[ROLES.HR] === ROLES.HR;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Employee Dashboard</h1>
          <p className="text-gray-600 mb-4">Please sign in to access.</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Validation
  const isValidHours = useMemo(() => {
    const numHours = parseFloat(hours);
    return numHours >= ELITE_VALIDATION.hoursMin && numHours <= ELITE_VALIDATION.hoursMax;
  }, [hours]);

  const isValidReason = useMemo(() => {
    return reason.length >= ELITE_VALIDATION.reasonMin && reason.length <= ELITE_VALIDATION.reasonMax;
  }, [reason]);

  const isFormValid = isValidHours && isValidReason;

  // Offline queue sync
  useEffect(() => {
    if (navigator.onLine) {
      offlineQueue.forEach(async (req) => {
        if (req.type === 'log') await logWorkHours(user.uid, req.hours);
        if (req.type === 'request') await requestSickLeave(user.uid, req.hours, req.reason);
      });
      setOfflineQueue([]);
    }
  }, [navigator.onLine, user, offlineQueue]);

  const handleLogHours = async () => {
    if (!isValidHours) {
      setError('Hours must be between 0.25 and 24.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await logWorkHours(user.uid, parseFloat(hours));
      setSuccess('Hours logged successfully!');
      setHours('');
      // Reload balance
      const bal = await getSickBalance(user.uid);
      setBalance(bal);
      localStorage.setItem('sickBalance', bal.toString());
    } catch (err) {
      if (navigator.onLine) {
        setError(err.message || 'Logging failed. Retry?');
      } else {
        setOfflineQueue((prev) => [...prev, { type: 'log', hours: parseFloat(hours) }]);
        setSuccess('Queued offline – will sync when back online.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSickLeave = async () => {
    if (!isFormValid) {
      setError('Invalid form. Check hours and reason.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await requestSickLeave(user.uid, parseFloat(hours), reason);
      setSuccess('Sick leave requested! Approval pending.');
      setHours('');
      setReason('');
    } catch (err) {
      if (navigator.onLine) {
        setError(err.message || 'Request failed. Retry?');
      } else {
        setOfflineQueue((prev) => [...prev, { type: 'request', hours: parseFloat(hours), reason }]);
        setSuccess('Queued offline – will sync when back online.');
      }
    } finally {
      setLoading(false);
    }
  };

  // PDF Report (compliance)
  const SickLeaveReport = () => (
    <PDFDownloadLink document={<LeavePDF balance={balance} />} fileName="sick-time-report.pdf">
      {({ loading }) => (
        <button
          disabled={loading}
          className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
          aria-label="Download sick time report"
        >
          {loading ? 'Generating...' : 'Download Report'}
        </button>
      )}
    </PDFDownloadLink>
  );

  const LeavePDF = ({ balance }) => (
    <Document>
      <Page>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>Sick Time Report</Text>
        <Text>Current Balance: {balance.toFixed(2)} hours</Text>
        <Text>Generated: {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4" ref={focusRef}>
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Employee Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Balance: <span className="font-semibold text-green-600 dark:text-green-400">{balance.toFixed(2)}</span> hours
            </p>
          </div>

          {/* Log Hours */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Log Work Hours
            </h3>
            <input
              type="number"
              step="0.25"
              min={ELITE_VALIDATION.hoursMin}
              max={ELITE_VALIDATION.hoursMax}
              value={hours}
              onChange={(e) => debouncedSetHours(e.target.value)}
              placeholder="Hours (e.g., 8.5)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              aria-label="Hours worked"
            />
            <button
              onClick={handleLogHours}
              disabled={loading || !isValidHours}
              className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Log hours"
            >
              {loading ? 'Logging...' : 'Log Hours'}
            </button>
          </div>

          {/* Request Sick Leave */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Request Sick Leave
            </h3>
            <input
              type="number"
              step="0.25"
              min={ELITE_VALIDATION.hoursMin}
              max={balance}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              aria-label="Sick hours"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (min 10 chars)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none h-20"
              maxLength={ELITE_VALIDATION.reasonMax}
              aria-label="Leave reason"
            />
            <button
              onClick={handleRequestSickLeave}
              disabled={loading || !isFormValid}
              className="w-full py-3 px-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Request sick leave"
            >
              {loading ? 'Requesting...' : 'Request Sick Leave'}
            </button>
          </div>

          {/* Report Export */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Export Report
            </h3>
            <SickLeaveReport />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                {success}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;