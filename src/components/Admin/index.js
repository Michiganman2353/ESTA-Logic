import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { getSickBalance, approveSickRequest } from '../../services/firebase';

export default function Admin() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [isSmallEmployer, setIsSmallEmployer] = useState(false); // Toggle for new employees

  useEffect(() => {
    if (user && role === 'employer') {
      loadEmployees();
      loadRequests();
    } else {
      navigate('/login');
    }
  }, [user, role, navigate]);

  const loadEmployees = async () => {
    try {
      const q = query(collection(db, 'users'), where('employerId', '==', user.uid));
      const snapshot = await getDocs(q);
      const employeeList = await Promise.all(snapshot.docs.map(async (d) => ({
        id: d.id,
        email: d.data().email,
        balance: await getSickBalance(d.id)
      })));
      setEmployees(employeeList);
    } catch (err) {
      setError('Error loading employees: ' + err.message);
    }
  };

  const loadRequests = async () => {
    try {
      const q = query(collection(db, 'sickRequests'), where('employerId', '==', user.uid), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      const requestList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setRequests(requestList);
    } catch (err) {
      setError('Error loading requests: ' + err.message);
    }
  };

  const addEmployee = async () => {
    try {
      await addDoc(collection(db, 'users'), {
        email: newEmail,
        employerId: user.uid,
        role: 'employee',
        isSmallEmployer,
        totalHours: 0
      });
      setNewEmail('');
      loadEmployees();
    } catch (err) {
      setError('Add employee error: ' + err.message);
    }
  };

  const handleApprove = async (requestId, status) => {
    try {
      await approveSickRequest(requestId, status, user.uid);
      loadRequests();
      loadEmployees();
    } catch (err) {
      setError('Approval error: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>Employer Admin Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Add Employee</h2>
      <input placeholder="Employee Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
      <label>
        Small Employer (40h cap)?
        <input type="checkbox" checked={isSmallEmployer} onChange={e => setIsSmallEmployer(e.target.checked)} />
      </label>
      <button onClick={addEmployee}>Add</button>
      <h2>Employees</h2>
      <ul>
        {employees.map(emp => (
          <li key={emp.id}>
            {emp.email} — Balance: {emp.balance} hours
          </li>
        ))}
      </ul>
      <h2>Pending Requests</h2
<ul>
  {requests.map(req => (
    <li key={req.id}>
      {req.userId} requests {req.hours}h ({req.reason})
      <button onClick={() => handleApprove(req.id, 'approved')}>Approve</button>
      <button onClick={() => handleApprove(req.id, 'denied')}>Deny</button>
    </li>
  ))}
</ul>
    </div>
  );
}