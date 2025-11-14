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
      const interval = setInterval(loadBalance