# Phase 5: Security & Compliance Trust Layer

**Phase:** 5 of 6  
**Status:** 📋 Planning  
**Priority:** Critical  
**Dependencies:** Phases 2, 4 (can run parallel with Phase 3)  
**Estimated Duration:** 3-4 weeks  
**Lead:** TBD

---

## 🎯 Objective

**Harden trust, integrity, and credibility.**

Strengthen the security posture, enhance compliance engine reliability, reinforce permission controls, improve validation workflows, and build explicit security mechanisms that ensure ESTA-Logic is audit-ready and enterprise-grade.

---

## 🔐 Core Philosophy

> **"Security is not a feature. It's a foundation. Every employer trusts us with their legal compliance — we must be absolutely bulletproof."**

### Security Principles

1. **Zero Trust Architecture** — Never trust, always verify
2. **Defense in Depth** — Multiple layers of protection
3. **Least Privilege** — Minimum necessary access
4. **Secure by Default** — Security is the default, not an option
5. **Audit Everything** — Complete visibility into all operations
6. **Fail Secure** — Errors should deny access, not grant it

---

## 📊 Current State Assessment

### Security Audit Baseline

**Tools to Use:**
1. **CodeQL** — Static security analysis
2. **Gitleaks** — Secret scanning
3. **npm audit** — Dependency vulnerability scanning
4. **OWASP ZAP** — Dynamic security testing
5. **Firebase Security Rules Validator**

**Run Security Baseline:**

```bash
# CodeQL analysis (already in CI)
# Check .github/workflows/codeql-analysis.yml

# Secret scanning
npx gitleaks detect --verbose

# Dependency audit
npm audit --audit-level=moderate

# Firebase rules testing
npm run firebase:emulators
firebase emulators:exec "npm run test:security"
```

### Current Security Measures

**Existing Protections:**
- ✅ Firebase Authentication
- ✅ Firestore Security Rules
- ✅ HTTPS enforcement
- ✅ Secret scanning (Gitleaks)
- ✅ CodeQL scanning
- ✅ Content Security Policy headers
- ✅ Capability-based security (microkernel)

**Gaps Identified:**

1. **Input Validation**
   - Inconsistent validation across endpoints
   - Missing sanitization in some areas
   - No centralized validation layer

2. **Authorization**
   - Permission checks scattered
   - No unified authorization framework
   - Unclear permission boundaries

3. **Audit Logging**
   - Incomplete audit trails
   - No tamper-proof logging
   - Missing compliance event tracking

4. **Data Protection**
   - Inconsistent encryption at rest
   - No field-level encryption for sensitive data
   - Missing PII handling policies

5. **Security Headers**
   - Some headers missing
   - CSP could be stricter
   - No security.txt file

---

## 🛡️ Security Hardening Strategy

### Strategy 1: Input Validation & Sanitization

**Objective:** Prevent injection attacks and data corruption

**Implementation:**

```typescript
// shared/security/validation.ts

import { z } from 'zod';

// Define schemas for all inputs
export const EmployeeIdSchema = z.string().uuid();
export const EmailSchema = z.string().email().max(255);
export const HoursWorkedSchema = z.number().min(0).max(80);

// Sanitization functions
export function sanitizeString(input: string): string {
  // Remove dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim()
    .slice(0, 1000); // Prevent DOS with massive strings
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Validation middleware for API
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues,
      });
    }
    
    req.body = result.data; // Use validated data
    next();
  };
}
```

**API Endpoint Example:**

```typescript
// api/v1/employees.ts

import { validateRequest, EmployeeCreateSchema } from '@shared/security/validation';

const EmployeeCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: EmailSchema,
  hireDate: z.string().datetime(),
  employeeCount: z.number().int().positive(),
});

app.post(
  '/api/v1/employees',
  requireAuth, // Authentication middleware
  requirePermission('employee:create'), // Authorization middleware
  validateRequest(EmployeeCreateSchema), // Validation middleware
  async (req, res) => {
    // req.body is now validated and safe
    const employee = await createEmployee(req.body);
    res.json(employee);
  }
);
```

**Areas to Apply:**
- [ ] All API endpoints
- [ ] All form inputs
- [ ] All database queries
- [ ] All file uploads
- [ ] All URL parameters

### Strategy 2: Authorization Framework

**Objective:** Unified, capability-based access control

**Implementation:**

```typescript
// shared/security/authorization.ts

// Define all permissions
export enum Permission {
  // Employee permissions
  EmployeeRead = 'employee:read',
  EmployeeCreate = 'employee:create',
  EmployeeUpdate = 'employee:update',
  EmployeeDelete = 'employee:delete',
  
  // Accrual permissions
  AccrualView = 'accrual:view',
  AccrualCalculate = 'accrual:calculate',
  AccrualAdjust = 'accrual:adjust',
  
  // Compliance permissions
  ComplianceReport = 'compliance:report',
  ComplianceExport = 'compliance:export',
  
  // Admin permissions
  AdminManageUsers = 'admin:manage-users',
  AdminViewAuditLogs = 'admin:view-audit-logs',
}

// Role definitions
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export const Roles: Record<string, Role> = {
  EMPLOYEE: {
    id: 'employee',
    name: 'Employee',
    permissions: [
      Permission.EmployeeRead, // Own data only
      Permission.AccrualView,   // Own accruals only
    ],
  },
  
  MANAGER: {
    id: 'manager',
    name: 'Manager',
    permissions: [
      Permission.EmployeeRead,
      Permission.EmployeeUpdate,
      Permission.AccrualView,
      Permission.AccrualCalculate,
      Permission.ComplianceReport,
    ],
  },
  
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    permissions: Object.values(Permission),
  },
};

// Authorization middleware
export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // From auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userPermissions = await getUserPermissions(user.id);
    const hasPermission = permissions.every(p => 
      userPermissions.includes(p)
    );
    
    if (!hasPermission) {
      await logSecurityEvent({
        type: 'AUTHORIZATION_FAILURE',
        userId: user.id,
        requiredPermissions: permissions,
        resource: req.path,
      });
      
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Resource-level authorization
export async function canAccessEmployee(
  userId: string,
  employeeId: string
): Promise<boolean> {
  const user = await getUser(userId);
  
  // Admins can access all employees
  if (user.role === 'admin') {
    return true;
  }
  
  // Employees can only access their own data
  if (user.role === 'employee') {
    return user.employeeId === employeeId;
  }
  
  // Managers can access employees in their organization
  if (user.role === 'manager') {
    const employee = await getEmployee(employeeId);
    return employee.organizationId === user.organizationId;
  }
  
  return false;
}
```

**Firebase Security Rules Enhancement:**

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isEmployeeOwner(employeeId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.employeeId == employeeId;
    }
    
    function inSameOrganization(orgId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
    }
    
    // Employees collection
    match /employees/{employeeId} {
      // Read: Admin, managers in same org, or the employee themselves
      allow read: if isAdmin() || 
                     inSameOrganization(resource.data.organizationId) ||
                     isEmployeeOwner(employeeId);
      
      // Write: Admin or managers in same org only
      allow write: if isAdmin() || 
                      (inSameOrganization(request.resource.data.organizationId) && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager');
    }
    
    // Accrual records
    match /accruals/{accrualId} {
      allow read: if isAdmin() || 
                     inSameOrganization(resource.data.organizationId) ||
                     isEmployeeOwner(resource.data.employeeId);
      
      // Only system or admin can write
      allow write: if isAdmin();
    }
    
    // Audit logs - read-only for admins
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only server-side writes
    }
  }
}
```

### Strategy 3: Comprehensive Audit Logging

**Objective:** Tamper-proof, complete audit trail for compliance

**Implementation:**

```typescript
// shared/security/audit.ts

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth:login:success',
  LOGIN_FAILURE = 'auth:login:failure',
  LOGOUT = 'auth:logout',
  
  // Authorization events
  PERMISSION_GRANTED = 'authz:granted',
  PERMISSION_DENIED = 'authz:denied',
  
  // Data access events
  EMPLOYEE_VIEWED = 'data:employee:viewed',
  EMPLOYEE_CREATED = 'data:employee:created',
  EMPLOYEE_UPDATED = 'data:employee:updated',
  EMPLOYEE_DELETED = 'data:employee:deleted',
  
  // Accrual events
  ACCRUAL_CALCULATED = 'accrual:calculated',
  ACCRUAL_ADJUSTED = 'accrual:adjusted',
  
  // Compliance events
  REPORT_GENERATED = 'compliance:report:generated',
  REPORT_EXPORTED = 'compliance:report:exported',
  
  // Security events
  INVALID_INPUT = 'security:invalid-input',
  RATE_LIMIT_EXCEEDED = 'security:rate-limit',
  SUSPICIOUS_ACTIVITY = 'security:suspicious',
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
  
  // Tamper detection
  previousEventHash?: string;
  eventHash?: string;
}

export async function logAuditEvent(
  event: Omit<AuditEvent, 'id' | 'timestamp' | 'previousEventHash' | 'eventHash'>
): Promise<void> {
  const timestamp = new Date();
  const id = generateEventId();
  
  // Get previous event for chaining
  const previousEvent = await getLatestAuditEvent();
  const previousEventHash = previousEvent?.eventHash;
  
  // Create tamper-proof hash
  const eventData = {
    id,
    timestamp,
    ...event,
    previousEventHash,
  };
  
  const eventHash = await hashEvent(eventData);
  
  const auditEvent: AuditEvent = {
    ...eventData,
    eventHash,
  };
  
  // Write to multiple locations for redundancy
  await Promise.all([
    writeToFirestore(auditEvent),
    writeToCloudLogging(auditEvent),
    writeToBackupStorage(auditEvent),
  ]);
}

// Verify audit log integrity
export async function verifyAuditLogIntegrity(): Promise<boolean> {
  const events = await getAllAuditEvents();
  
  for (let i = 1; i < events.length; i++) {
    const current = events[i];
    const previous = events[i - 1];
    
    // Verify chain
    if (current.previousEventHash !== previous.eventHash) {
      return false;
    }
    
    // Verify hash
    const expectedHash = await hashEvent({
      ...current,
      eventHash: undefined,
    });
    
    if (current.eventHash !== expectedHash) {
      return false;
    }
  }
  
  return true;
}
```

**Usage Example:**

```typescript
// api/v1/employees.ts

app.put(
  '/api/v1/employees/:id',
  requireAuth,
  requirePermission(Permission.EmployeeUpdate),
  async (req, res) => {
    try {
      const employee = await updateEmployee(req.params.id, req.body);
      
      // Log successful update
      await logAuditEvent({
        type: AuditEventType.EMPLOYEE_UPDATED,
        userId: req.user.id,
        sessionId: req.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resource: `employee:${req.params.id}`,
        action: 'update',
        outcome: 'success',
        details: {
          changes: req.body,
        },
      });
      
      res.json(employee);
    } catch (error) {
      // Log failure
      await logAuditEvent({
        type: AuditEventType.EMPLOYEE_UPDATED,
        userId: req.user.id,
        sessionId: req.sessionId,
        ipAddress: req.ip,
        resource: `employee:${req.params.id}`,
        action: 'update',
        outcome: 'failure',
        details: {
          error: error.message,
        },
      });
      
      throw error;
    }
  }
);
```

### Strategy 4: Data Protection & Encryption

**Objective:** Protect sensitive data at rest and in transit

**Implementation:**

```typescript
// shared/security/encryption.ts

import { KMS } from '@google-cloud/kms';

const kms = new KMS();

// Encrypt sensitive fields
export async function encryptPII(data: string): Promise<string> {
  const keyName = process.env.KMS_KEY_NAME;
  
  const [encrypted] = await kms.encrypt({
    name: keyName,
    plaintext: Buffer.from(data),
  });
  
  return encrypted.ciphertext.toString('base64');
}

// Decrypt sensitive fields
export async function decryptPII(encryptedData: string): Promise<string> {
  const keyName = process.env.KMS_KEY_NAME;
  
  const [decrypted] = await kms.decrypt({
    name: keyName,
    ciphertext: Buffer.from(encryptedData, 'base64'),
  });
  
  return decrypted.plaintext.toString();
}

// Field-level encryption for sensitive data
export interface ProtectedEmployee {
  id: string;
  name: string;
  email: string; // Encrypted
  ssn?: string; // Encrypted
  hireDate: Date;
  // ... other fields
}

export async function encryptEmployeeData(
  employee: Employee
): Promise<ProtectedEmployee> {
  return {
    ...employee,
    email: await encryptPII(employee.email),
    ssn: employee.ssn ? await encryptPII(employee.ssn) : undefined,
  };
}
```

**PII Handling Policy:**

```typescript
// shared/security/pii.ts

export enum PIIClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

export const FieldClassifications = {
  // Public data
  employeeId: PIIClassification.PUBLIC,
  organizationId: PIIClassification.PUBLIC,
  
  // Internal data
  name: PIIClassification.INTERNAL,
  hireDate: PIIClassification.INTERNAL,
  
  // Confidential data
  email: PIIClassification.CONFIDENTIAL,
  phone: PIIClassification.CONFIDENTIAL,
  address: PIIClassification.CONFIDENTIAL,
  
  // Restricted data (requires encryption)
  ssn: PIIClassification.RESTRICTED,
  dateOfBirth: PIIClassification.RESTRICTED,
};

// Redact PII based on user permissions
export function redactPII(
  data: any,
  userPermissions: Permission[]
): any {
  const canViewConfidential = userPermissions.includes(
    Permission.ViewConfidentialData
  );
  
  const canViewRestricted = userPermissions.includes(
    Permission.ViewRestrictedData
  );
  
  const redacted = { ...data };
  
  for (const [field, classification] of Object.entries(FieldClassifications)) {
    if (classification === PIIClassification.RESTRICTED && !canViewRestricted) {
      redacted[field] = '[REDACTED]';
    } else if (classification === PIIClassification.CONFIDENTIAL && !canViewConfidential) {
      redacted[field] = '[REDACTED]';
    }
  }
  
  return redacted;
}
```

### Strategy 5: Security Headers & Policies

**Objective:** Harden web application against common attacks

**Implementation:**

```typescript
// platform/vercel/middleware.ts

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://firebase.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://firebase.googleapis.com https://firestore.googleapis.com wss://*.firebaseio.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  
  // Other security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  next();
}
```

**Add security.txt:**

```
# public/.well-known/security.txt

Contact: security@esta-tracker.com
Expires: 2026-12-31T23:59:59.000Z
Encryption: https://esta-tracker.com/pgp-key.txt
Preferred-Languages: en
Canonical: https://esta-tracker.com/.well-known/security.txt
Policy: https://esta-tracker.com/security-policy
```

---

## 📋 Implementation Roadmap

### Week 1: Security Foundation
- [ ] Run complete security audit
- [ ] Document current vulnerabilities
- [ ] Create security policies
- [ ] Set up security monitoring

### Week 2: Input Validation & Authorization
- [ ] Implement validation framework
- [ ] Create authorization middleware
- [ ] Update all API endpoints
- [ ] Enhance Firebase rules

### Week 3: Audit Logging & Data Protection
- [ ] Implement audit logging
- [ ] Add field-level encryption
- [ ] Create PII handling policies
- [ ] Set up log monitoring

### Week 4: Hardening & Testing
- [ ] Add security headers
- [ ] Create security.txt
- [ ] Run penetration tests
- [ ] Fix identified issues

---

## ✅ Acceptance Criteria

- [ ] Zero high-severity vulnerabilities
- [ ] 100% input validation coverage
- [ ] Authorization on all endpoints
- [ ] Complete audit trail
- [ ] PII properly encrypted
- [ ] Security headers configured
- [ ] Penetration test passed
- [ ] Security documentation complete

---

## 🎯 Definition of Done

Phase 5 is complete when:

1. ✅ Security audit shows zero high-severity issues
2. ✅ All acceptance criteria met
3. ✅ Penetration test passed
4. ✅ Team trained on security practices
5. ✅ Deployed to production
6. ✅ Retrospective completed

---

**Related Documents:**
- [Modernization Charter](./MODERNIZATION_CHARTER.md)
- [Phase 6: Deployment](./PHASE_6_DEPLOYMENT.md)
- [Security Guide](../SECURITY.md)
