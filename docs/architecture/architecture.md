# ESTA Tracker - Architecture Overview

**Last Updated:** December 19, 2025

> **🎯 Strategic Direction Update:** ESTA-Logic is pivoting to become a TurboTax-style guided compliance experience. This architecture document describes the technical foundation. For our experience-first design philosophy and guided user journey architecture, see:
> - [Experience Vision](../Experience-Vision.md) — Strategic direction
> - [Experience-First Architecture](../Experience-First-Architecture.md) — Architectural principles
> - [GuidedFlowEngine](../GuidedFlowEngine.md) — Journey orchestration concept
> - [Strategic Roadmap](../ROADMAP.md) — Implementation phases

## System Architecture

ESTA Tracker uses a hybrid architecture combining:

- **Frontend:** React + Vite (static site on Vercel)
- **Backend API:** Express (Node.js) for business logic
- **Firebase Cloud Functions:** Serverless functions for Firebase-specific operations
- **Firebase Services:** Authentication, Firestore, Storage

---

## Architecture Decision: Backend Routes vs Cloud Functions

### Design Pattern

ESTA Tracker employs a **dual-implementation pattern** for certain features:

1. **Backend Express Routes** (`packages/backend/src/routes/`)
   - Serve as API documentation
   - Provide interface definitions
   - Return placeholder responses with instructions
   - Can be used for testing/development

2. **Firebase Cloud Functions** (`functions/src/index.ts`)
   - Actual production implementation
   - Direct Firebase integration
   - Enhanced security (Firebase Admin SDK)
   - Automatic scaling and deployment

### When to Use Each

#### Use Backend Express Routes For:

- ✅ Business logic that doesn't require Firebase Admin SDK
- ✅ Data transformation and validation
- ✅ Third-party API integrations
- ✅ Complex calculations
- ✅ CSV imports and data processing

**Examples:**

- `/api/v1/accrual` - Accrual calculations
- `/api/v1/import` - CSV import processing
- `/api/v1/policies` - Policy management

#### Use Firebase Cloud Functions For:

- ✅ Direct Firebase database operations
- ✅ Secure file operations (signed URLs)
- ✅ Authentication triggers
- ✅ Firestore triggers
- ✅ Operations requiring elevated permissions

**Examples:**

- `generateDocumentUploadUrl` - Signed URL generation
- `confirmDocumentUpload` - Document metadata storage
- `getDocumentDownloadUrl` - Secure download links
- `onPtoApproval` - Firestore trigger for immutability
- `approveUserAfterVerification` - User approval flow

---

## Document Upload Architecture

The document upload system illustrates this pattern perfectly:

### Backend Routes (`packages/backend/src/routes/documents.ts`)

Contains **placeholder implementations** with TODO comments:

```typescript
// GET /api/v1/documents/request/:requestId
// POST /api/v1/documents/upload-url
// POST /api/v1/documents/:documentId/confirm
// GET /api/v1/documents/:documentId
// DELETE /api/v1/documents/:documentId
// GET /api/v1/documents/:documentId/access-logs
```

These routes:

- Document the API interface
- Return helpful messages explaining Firebase integration is needed
- Serve as reference for future client implementations

### Cloud Functions (`functions/src/index.ts`)

Contains **actual implementations**:

```typescript
export const generateDocumentUploadUrl = functions.https.onCall(...)
export const confirmDocumentUpload = functions.https.onCall(...)
export const getDocumentDownloadUrl = functions.https.onCall(...)
export const onPtoApproval = functions.firestore.document(...)
```

These functions:

- Generate signed URLs with Firebase Admin SDK
- Enforce security rules
- Create audit logs in Firestore
- Handle Firestore triggers for automatic operations

### Frontend Integration (`packages/frontend/src/lib/documentService.ts`)

The frontend calls **Cloud Functions directly**:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const generateUrl = httpsCallable(functions, 'generateDocumentUploadUrl');
```

---

## Data Flow Examples

### Example 1: Document Upload

```
┌─────────┐     1. Request     ┌──────────────────┐
│ Frontend│─────────────────────>│ Cloud Function   │
│         │                     │ generateUploadUrl│
└─────────┘                     └──────────────────┘
     ↓                                   ↓
     │                          2. Generate signed URL
     │                          3. Create metadata
     │                                   ↓
     │                          ┌──────────────────┐
     │                          │    Firestore     │
     │                          │  (documents)     │
     │                          └──────────────────┘
     │                                   ↓
     ↓                          4. Return signed URL
┌─────────┐                     ┌──────────────────┐
│ Frontend│<─────────────────────│ Cloud Function   │
└─────────┘                     └──────────────────┘
     │
     │ 5. Direct upload
     ↓
┌──────────────────┐
│ Cloud Storage    │
│  (documents/)    │
└──────────────────┘
     │
     │ 6. Confirm upload
     ↓
┌──────────────────┐
│ Cloud Function   │
│ confirmUpload    │
└──────────────────┘
```

### Example 2: CSV Import

```
┌─────────┐     1. Upload CSV   ┌──────────────────┐
│ Frontend│─────────────────────>│ Backend Express  │
│         │                     │  /api/v1/import  │
└─────────┘                     └──────────────────┘
                                         ↓
                               2. Parse & validate
                               3. Process rows
                                         ↓
                                ┌──────────────────┐
                                │ Firebase Admin   │
                                │ (batch writes)   │
                                └──────────────────┘
                                         ↓
                                ┌──────────────────┐
                                │    Firestore     │
                                └──────────────────┘
```

---

## Security Considerations

### Why Cloud Functions for Documents?

1. **Signed URLs require Firebase Admin SDK**
   - Regular backend cannot generate Firebase signed URLs
   - Admin SDK has elevated permissions
   - Proper credential isolation

2. **Direct Firebase integration**
   - No intermediate server bottleneck
   - Faster upload/download
   - Better scalability

3. **Firestore triggers**
   - Automatic operations (e.g., immutability on PTO approval)
   - Guaranteed execution
   - No polling or scheduled jobs needed

### Security Flow

```
Frontend Request
    ↓
Firebase Authentication (ID token)
    ↓
Cloud Function (verifies token)
    ↓
Custom Claims Check (role, tenantId)
    ↓
Resource Ownership Validation
    ↓
Generate Signed URL (time-limited)
    ↓
Audit Log Entry
    ↓
Return to Frontend
```

---

## Deployment Architecture

### Vercel (Frontend + Backend API)

```
Vercel Edge Network
├── Static Frontend (React)
└── Serverless Functions (/api/*)
```

### Firebase (Cloud Functions + Services)

```
Firebase Platform
├── Cloud Functions (Node.js)
├── Authentication
├── Firestore Database
├── Cloud Storage
└── Firebase Hosting (optional)
```

### Google Cloud (KMS)

```
Google Cloud Platform
└── Cloud KMS
    └── Key Ring: esta-tracker-keys
        └── Crypto Key: document-encryption-key
```

---

## API Endpoints Summary

### Backend Express API (`/api/v1/*`)

| Endpoint         | Status         | Implementation      |
| ---------------- | -------------- | ------------------- |
| `/auth/*`        | ✅ Production  | Express Routes      |
| `/accrual/*`     | ✅ Production  | Express Routes      |
| `/requests/*`    | ✅ Production  | Express Routes      |
| `/audit/*`       | ✅ Production  | Express Routes      |
| `/retaliation/*` | ✅ Production  | Express Routes      |
| `/employer/*`    | ✅ Production  | Express Routes      |
| `/documents/*`   | ℹ️ Placeholder | See Cloud Functions |
| `/policies/*`    | ✅ Production  | Express Routes      |
| `/import/*`      | ✅ Production  | Express Routes      |

### Firebase Cloud Functions

| Function                       | Type              | Purpose               |
| ------------------------------ | ----------------- | --------------------- |
| `onEmailVerified`              | Auth Trigger      | User creation logging |
| `approveUserAfterVerification` | Callable          | User approval         |
| `generateDocumentUploadUrl`    | Callable          | Signed upload URL     |
| `confirmDocumentUpload`        | Callable          | Upload confirmation   |
| `getDocumentDownloadUrl`       | Callable          | Signed download URL   |
| `onPtoApproval`                | Firestore Trigger | Document immutability |

---

## Development Workflow

### Adding a New Feature

#### If Feature Requires Firebase Admin SDK:

1. Implement in `functions/src/index.ts`
2. Add callable function or trigger
3. Update frontend to call Cloud Function
4. Add placeholder route in backend (optional, for documentation)

#### If Feature is Pure Business Logic:

1. Implement in `packages/backend/src/routes/`
2. Add Express route
3. Update frontend to call backend API
4. No Cloud Function needed

### Testing

- **Backend Routes:** Use Vitest with supertest
- **Cloud Functions:** Use Firebase emulator suite
- **Frontend:** Use Vitest + React Testing Library
- **E2E:** Use Playwright with Firebase emulator

---

## Monitoring & Observability

### Backend Express API

- Server logs via console
- Error handling middleware
- Health check endpoint: `/health`

### Cloud Functions

- Firebase Console logs
- Function execution metrics
- Error reporting
- Performance monitoring

### Frontend

- Browser console (development)
- Error boundaries
- Sentry (planned)
- Vercel Analytics

---

## Future Considerations

### Potential Consolidation

As the application matures, consider:

1. **Move more to Cloud Functions**
   - Better scaling
   - Pay-per-use pricing
   - Tight Firebase integration

2. **Or move to Backend API**
   - More control
   - Easier debugging
   - Custom infrastructure

3. **Hybrid Approach (Current)**
   - Best of both worlds
   - Use right tool for each job
   - Maintain flexibility

### Migration Path

If consolidating to Cloud Functions:

1. Remove placeholder backend routes
2. Implement all logic in Cloud Functions
3. Update frontend to use only Firebase SDK
4. Simplify deployment (Vercel frontend + Firebase)

If consolidating to Backend API:

1. Implement Firebase Admin SDK in backend
2. Remove Cloud Functions (except triggers)
3. Frontend calls backend API for everything
4. More traditional architecture

---

## Conclusion

The current architecture leverages the strengths of both approaches:

- **Backend API:** Business logic, data processing, integrations
- **Cloud Functions:** Firebase operations, triggers, secure file handling

This provides:

- ✅ Flexibility
- ✅ Scalability
- ✅ Security
- ✅ Clear separation of concerns

The "placeholder" backend routes with TODOs are **intentional** and serve as API documentation while the actual implementation lives in Cloud Functions where it can leverage Firebase Admin SDK capabilities.

---

## Symphony Layers

### Gleam Helix Core (`packages/helix/`)

Pure functional programming layer for immutable, provably correct accrual calculations.

**Purpose:**

- Elevates TypeScript accrual logic to pure FP for expo demos
- Provides immutable proofs of compliance
- Compiles to WASM for Tauri pivot potential
- Returns complete accrual data with regular hours, bonus, and cap

**Integration:**

```typescript
// In libs/accrual-engine/index.ts
import { calculate } from '@esta-logic/helix';
```

**Key Files:**

- `packages/helix/gleam.toml` - Gleam project configuration
- `packages/helix/src/accrual.gleam` - Pure functional accrual calculations

**Accrual Type:**

```gleam
pub type Accrual {
  Accrual(regular: Float, bonus: Float, cap: Float)
}
```

**Build:**

```bash
cd packages/helix && gleam build
```

### XState Legion (`packages/legion/`)

Visual finite state machine layer for deadlock-free workflow orchestration.

**Purpose:**

- Makes n8n workflows visual and provably deadlock-free
- Syncs with CSV processor and other integrations
- Zero-entry expo sync as visual art for demonstrations

**State Flow:**

```
┌──────┐  START_SYNC  ┌─────────┐  onDone  ┌────────────┐  onDone  ┌───────┐
│ idle │─────────────>│ pulling │─────────>│ predicting │─────────>│ ready │
└──────┘              └─────────┘          └────────────┘          └───────┘
                           │                     │
                           v                     v
                  csvProcessor.pullHours    helixCalculate
```

**Key Files:**

- `packages/legion/machines/sync.ts` - Zero-entry expo sync state machine

**Visualization:**

```bash
npx @xstate/viz > sync.svg
```

---

**Questions or Need Help?**

Refer to:

- [Deployment Guide](../deployment/deployment.md) - Deployment instructions
- [Firebase Setup](../setup/FIREBASE_SETUP.md) - Firebase configuration
- [Testing Guide](./testing.md) - Testing guidelines
- [Audit Findings](../archive/audit-findings.md) - Full audit report
