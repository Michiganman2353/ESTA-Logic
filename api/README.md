# ESTA Tracker Vercel Serverless API

This directory contains Vercel serverless functions that power the ESTA Tracker backend.

## API Endpoints

### Authentication & User Management

#### POST /api/register
Register a new user (employee or employer).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "employee",
  "tenantCode": "ABC123",
  "companyName": "Acme Corp",
  "employeeCount": 25
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "employee",
    "status": "active"
  },
  "needsVerification": true
}
```

#### POST /api/verifyUser
Verify user's email and activate account.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Response:**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "role": "employee",
    "status": "active"
  }
}
```

#### POST /api/approveUser
Admin endpoint to approve or deny pending user registrations.

**Headers:**
- `Authorization: Bearer <admin-firebase-id-token>`

**Request Body:**
```json
{
  "userId": "user-id",
  "approve": true,
  "denialReason": "Optional reason if denying"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User approved successfully",
  "user": {
    "id": "user-id",
    "status": "active"
  }
}
```

### Data Processing

#### POST /api/validateBatch
Validate a batch of employee data before importing.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Request Body:**
```json
{
  "tenantId": "tenant-id",
  "employeeData": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "hoursWorked": 160,
      "sickTimeUsed": 8
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "totalRecords": 1,
  "validRecords": 1,
  "errorCount": 0,
  "errors": [],
  "summary": {
    "duplicatesInBatch": 0,
    "existingInSystem": 0
  },
  "message": "All records are valid and ready for processing"
}
```

#### POST /api/processCsv
Process and import CSV data for employees.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Request Body:**
```json
{
  "tenantId": "tenant-id",
  "createUsers": true,
  "defaultPassword": "TempPassword123",
  "csvData": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "hoursWorked": 160,
      "sickTimeUsed": 8,
      "startDate": "2024-01-01"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 1 rows",
  "results": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "skipped": 0
  },
  "details": {
    "successful": [...],
    "failed": [],
    "skipped": []
  }
}
```

### Audit & Reporting

#### POST /api/generateAuditPack
Generate a comprehensive audit pack for compliance reporting.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Request Body:**
```json
{
  "tenantId": "tenant-id",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "includeDocuments": true
}
```

**Response:**
```json
{
  "success": true,
  "auditPack": {
    "metadata": {...},
    "employees": [...],
    "sickTimeRequests": [...],
    "auditLogs": [...],
    "complianceSummary": {...}
  },
  "message": "Audit pack generated successfully"
}
```

### Document Management

#### POST /api/uploadDoctorNote
Generate a signed upload URL for doctor's notes or medical documentation.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Request Body:**
```json
{
  "requestId": "request-id",
  "fileName": "doctors_note.pdf",
  "contentType": "application/pdf"
}
```

**Response:**
```json
{
  "success": true,
  "uploadUrl": "https://storage.googleapis.com/...",
  "documentId": "document-id",
  "storagePath": "tenants/...",
  "expiresIn": 900,
  "requiresDocumentation": true,
  "message": "Medical documentation is required for this request"
}
```

### Calendar & Scheduling

#### GET /api/getEmployeeCalendar
Retrieve an employee's calendar with sick time requests, work logs, and balances.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Query Parameters:**
- `employeeId` (optional): Employee ID to view (employers/admins only)
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `year` (optional): Year to view
- `month` (optional): Month to view (1-12)

**Response:**
```json
{
  "success": true,
  "employee": {
    "id": "employee-id",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-12-31T23:59:59.999Z"
  },
  "balance": {
    "accruedSickTime": 40,
    "usedSickTime": 16,
    "availableSickTime": 24,
    "totalHoursWorked": 1200,
    "employerSize": "large"
  },
  "limits": {
    "maxAccrual": 72,
    "maxUsage": 72,
    "remainingAccrualCapacity": 32,
    "remainingUsageCapacity": 56
  },
  "events": [...],
  "summary": {...}
}
```

## Environment Variables

The following environment variables must be configured in Vercel:

- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key
- `NODE_ENV`: Environment (production, development)

## Authentication

All endpoints (except `/api/register`) require Firebase ID token authentication via the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

The token contains user claims including:
- `uid`: User ID
- `role`: User role (employee, employer, admin)
- `tenantId`: Organization/company ID
- `emailVerified`: Email verification status

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `405`: Method not allowed
- `500`: Internal server error

## CORS

CORS is configured to allow:
- Credentials: true
- Origins: All (can be restricted per environment)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

## Rate Limiting

Consider implementing rate limiting in production via Vercel's Edge Config or third-party services.

## Deployment

Functions are automatically deployed when pushing to the connected Git repository. Vercel will:

1. Install dependencies
2. Build the functions
3. Deploy them to the Edge network
4. Make them available at `/api/*` endpoints

## Local Development

To test functions locally:

```bash
npm install -g vercel
vercel dev
```

This will start a local development server that simulates the Vercel environment.
