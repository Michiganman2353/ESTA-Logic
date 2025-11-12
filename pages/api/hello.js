export default function handler(req, res) {
  res.json({ 
    status: 'API working', 
    time: new Date().toISOString(),
    firebase: !!process.env.FIREBASE_PROJECT_ID
  });
}