import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logWorkHours, getSickBalance, requestSickLeave } from '../services/firebase';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [hours, setHours] = useState('');
  const [balance, setBalance] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user) loadBalance();
  }, [user]);

  const loadBalance = async () => {
    const bal = await getSickBalance(user.uid);
    setBalance(bal);
  };

  const handleLog = async () => {
    await logWorkHours(user.uid, parseInt(hours));
    setHours('');
    loadBalance();
  };

  const handleRequest = async () => {
    try {
      await requestSickLeave(user.uid, parseInt(hours), reason);
      alert('Request sent!');
      setHours(''); setReason('');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: 'auto' }}>
      <h1>Employee Dashboard</h1>
      <p><strong>Balance:</strong> {balance} hours</p>
      <input placeholder="Hours worked" value={hours} onChange={e => setHours(e.target.value)} />
      <button onClick={handleLog}>Log Hours</button>
      <br/><br/>
      <input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} />
      <button onClick={handleRequest}>Request Sick Leave ({hours}h)</button>
    </div>
  );
}
