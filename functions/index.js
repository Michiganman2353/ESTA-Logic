const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// ADP OAuth2 Setup (Store secrets in Functions config)
const ADP_CLIENT_ID = functions.config().adp.client_id;
const ADP_CLIENT_SECRET = functions.config().adp.client_secret;
let adpToken = '';

// Token Refresh Function (Call on init or 401)
const refreshADPToken = async () => {
  const response = await axios.post('https://accounts.adp.com/auth/o auth/v2/token', new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: ADP_CLIENT_ID,
    client_secret: ADP_CLIENT_SECRET
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  adpToken = response.data.access_token;
};

// Cron: ADP Timesheet Pull (Daily)
exports.pullADPPayroll = functions.pubsub.schedule('0 2 * * *').onRun(async () => {
  try {
    if (!adpToken) await refreshADPToken();
    const response = await axios.get('https://api.adp.com/hr/v2/timesheets', {
      headers: { 'Authorization': `Bearer ${adpToken}` },
      params: { start_date: new Date(Date.now() - 86400000).toISOString().split('T')[0] } // Last 24h
    });
    const timesheets = response.data.timesheets; // Parse ADP response
    for (const sheet of timesheets) {
      const userId = sheet.employeeId; // Map ADP ID to ESTA userId
      const hours = parseFloat(sheet.hours);
      await logWorkHours(userId, hours); // Trigger accrual
    }
  } catch (err) {
    if (err.response?.status === 401) await refreshADPToken(); // Retry on expired
    console.error('ADP Pull Error: ' + err.message);
  }
  return null;
});

// Gusto OAuth2 Setup (Similar)
const GUSTO_CLIENT_ID = functions.config().gusto.client_id;
const GUSTO_CLIENT_SECRET = functions.config().gusto.client_secret;
let gustoToken = '';

const refreshGustoToken = async () => {
  const response = await axios.post('https://api.gusto.com/oauth/token', new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: GUSTO_CLIENT_ID,
    client_secret: GUSTO_CLIENT_SECRET
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  gustoToken = response.data.access_token;
};

// Cron: Gusto Timesheet Pull (Daily)
exports.pullGustoPayroll = functions.pubsub.schedule('0 2 * * *').onRun(async () => {
  try {
    if (!gustoToken) await refreshGustoToken();
    const response = await axios.get('https://api.gusto.com/v1/timesheets', {
      headers: { 'Authorization': `Bearer ${gustoToken}` },
      params: { start_date: new Date(Date.now() - 86400000).toISOString().split('T')[0] } // Last 24h
    });
    const timesheets = response.data; // Parse Gusto response
    for (const sheet of timesheets) {
      const userId = sheet.employee_uuid; // Map Gusto UUID to ESTA userId
      const hours = parseFloat(sheet.hours_worked);
      await logWorkHours(userId, hours); // Trigger accrual
    }
  } catch (err) {
    if (err.response?.status === 401) await refreshGustoToken(); // Retry on expired
    console.error('Gusto Pull Error: ' + err.message);
  }
  return null;
});