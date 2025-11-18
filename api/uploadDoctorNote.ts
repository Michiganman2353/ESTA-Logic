import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

interface UploadDoctorNoteRequest {
  requestId: string;
  fileName: string;
  contentType: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const tenantId = decodedToken.tenantId;

    const { requestId, fileName, contentType } = req.body as UploadDoctorNoteRequest;

    // Validate input
    if (!requestId || !fileName || !contentType) {
      return res.status(400).json({ error: 'Request ID, file name, and content type are required.' });
    }

    // Validate content type - only allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only images (JPEG, PNG) and PDFs are allowed.' 
      });
    }

    // Verify the sick time request exists and belongs to the user
    const requestDoc = await db.collection('sickTimeRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Sick time request not found.' });
    }

    const requestData = requestDoc.data();
    
    // Verify ownership
    if (requestData?.userId !== userId) {
      return res.status(403).json({ 
        error: 'Permission denied. You can only upload documents for your own requests.' 
      });
    }

    // Check if request is already approved (immutability check)
    if (requestData?.status === 'approved') {
      return res.status(400).json({ 
        error: 'Cannot upload documents to an approved request. Documents are immutable after approval.' 
      });
    }

    // Check if the request requires medical documentation
    // According to Michigan ESTA, medical documentation may be required for absences of 3+ consecutive days
    const requiresDocumentation = requestData?.hours >= 24; // 3 days * 8 hours

    // Generate the storage path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `tenants/${tenantId}/employees/${userId}/documents/${requestId}/${timestamp}_${sanitizedFileName}`;

    // Get a reference to the file
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);

    // Generate a signed URL for upload (valid for 15 minutes)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    });

    // Create a document metadata record in Firestore
    const documentMetadata = {
      requestId,
      userId,
      tenantId,
      fileName: sanitizedFileName,
      originalFileName: fileName,
      storagePath,
      contentType,
      documentType: 'doctor_note',
      status: 'pending', // Will be 'uploaded' once confirmed
      uploadedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      immutable: false, // Will become true when request is approved
    };

    const docRef = await db.collection('documents').add(documentMetadata);

    // Log the upload URL generation
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'doctor_note_upload_url_generated',
      details: {
        documentId: docRef.id,
        requestId,
        fileName: sanitizedFileName,
        storagePath,
        requiresDocumentation,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Generated doctor note upload URL for user ${userId}, request ${requestId}`);

    return res.status(200).json({
      success: true,
      uploadUrl: signedUrl,
      documentId: docRef.id,
      storagePath,
      expiresIn: 900, // seconds (15 minutes)
      requiresDocumentation,
      message: requiresDocumentation 
        ? 'Medical documentation is required for this request (3+ consecutive days)'
        : 'Medical documentation is optional but recommended',
    });
  } catch (error: any) {
    console.error('Doctor note upload URL generation error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    return res.status(500).json({ 
      error: 'Failed to generate upload URL for doctor note',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
