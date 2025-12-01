# ADR 009: Hybrid Cloud Architecture

**Status**: RFC (Request for Comments)  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team, Architecture Review Board  
**Extends**: [ADR 008](./008-data-portability.md) (Data Portability Strategy)

## Abstract

This RFC defines the hybrid cloud architecture for ESTA-Logic, enabling:

1. **On-premise deployment** for large employers with strict data requirements
2. **Standardized payroll integration interfaces** for major providers
3. **Event-driven architecture** for real-time sync and extensibility

## Context

### Enterprise Requirements

Large employers (500+ employees) often require:

- **On-premise hosting**: Data must stay within corporate network
- **Private cloud**: AWS/Azure/GCP but in dedicated tenant
- **Air-gapped**: No external network connectivity
- **Payroll integration**: Direct connection to ADP, Paychex, Workday

### Current Limitations

ESTA-Logic's current Firebase-based architecture:

- Requires internet connectivity
- All data in Firebase cloud (US regions)
- Manual data import from payroll systems
- Limited audit trail for compliance

### Strategic Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ESTA-Logic Hybrid Cloud                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────┐   ┌───────────────────────┐                     │
│   │    Cloud Tenants      │   │   On-Premise Tenants  │                     │
│   │  (Multi-tenant SaaS)  │   │  (Single-tenant VMs)  │                     │
│   │                       │   │                       │                     │
│   │  ┌─────────────────┐  │   │  ┌─────────────────┐  │                     │
│   │  │ Firebase/Supabase│ │   │  │ Postgres/SQLite │  │                     │
│   │  └─────────────────┘  │   │  └─────────────────┘  │                     │
│   └───────────────────────┘   └───────────────────────┘                     │
│              │                           │                                   │
│              └─────────────┬─────────────┘                                   │
│                            │                                                 │
│              ┌─────────────▼─────────────┐                                   │
│              │   Standardized API Layer  │                                   │
│              │   (Platform-Agnostic)     │                                   │
│              └─────────────┬─────────────┘                                   │
│                            │                                                 │
│              ┌─────────────▼─────────────┐                                   │
│              │   Payroll Integrations    │                                   │
│              │   ADP │ Paychex │ Workday │                                   │
│              └───────────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Specification

### 1. On-Premise Deployment Architecture

#### 1.1 Deployment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    On-Premise Deployment                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Load Balancer                          ││
│  │              (nginx / HAProxy / F5)                         ││
│  └────────────────────────┬────────────────────────────────────┘│
│                           │                                      │
│     ┌─────────────────────┼─────────────────────┐               │
│     │                     │                     │               │
│     ▼                     ▼                     ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   API Node   │  │   API Node   │  │   API Node   │          │
│  │  (Container) │  │  (Container) │  │  (Container) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│           │                │                │                    │
│           └────────────────┼────────────────┘                    │
│                            │                                     │
│           ┌────────────────┼────────────────┐                    │
│           │                │                │                    │
│           ▼                ▼                ▼                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Postgres   │  │    Redis     │  │   MinIO      │          │
│  │   Primary    │  │   Cluster    │  │   Storage    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────┐                                               │
│  │   Postgres   │                                               │
│  │   Replica    │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2 Container Orchestration

```yaml
# deployment/docker-compose.on-premise.yml

version: '3.8'

services:
  api:
    image: esta-logic/api:${VERSION}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - STORAGE_BACKEND=minio
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
    depends_on:
      - postgres
      - redis
      - minio

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=estalogic
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

#### 1.3 Kubernetes Deployment

```yaml
# deployment/kubernetes/api-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: esta-logic-api
  namespace: esta-logic
spec:
  replicas: 3
  selector:
    matchLabels:
      app: esta-logic-api
  template:
    metadata:
      labels:
        app: esta-logic-api
    spec:
      containers:
        - name: api
          image: esta-logic/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: esta-logic-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: esta-logic-secrets
                  key: redis-url
          resources:
            requests:
              memory: '1Gi'
              cpu: '500m'
            limits:
              memory: '4Gi'
              cpu: '2000m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### 1.4 Air-Gapped Mode

For environments without internet connectivity:

```typescript
// libs/platform/src/config/deployment-mode.ts

export type DeploymentMode =
  | { type: 'cloud'; provider: 'firebase' | 'supabase' }
  | { type: 'on-premise'; connectivity: 'connected' | 'air-gapped' };

export interface AirGappedConfig {
  // No external network calls
  externalServicesEnabled: false;

  // Local license validation
  licenseValidation: 'local';

  // All updates must be manual
  autoUpdate: false;

  // Local time source
  timeSource: 'system' | 'ntp-local';

  // Offline WASM modules
  wasmBundled: true;
}

export function getDeploymentConfig(): DeploymentConfig {
  const mode = process.env.DEPLOYMENT_MODE;

  if (mode === 'air-gapped') {
    return {
      type: 'on-premise',
      connectivity: 'air-gapped',
      airGapped: {
        externalServicesEnabled: false,
        licenseValidation: 'local',
        autoUpdate: false,
        timeSource: 'system',
        wasmBundled: true,
      },
    };
  }

  // ... other modes
}
```

### 2. Standardized Payroll Integration Interfaces

#### 2.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Payroll Integration Layer                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  PayrollProvider Interface                   ││
│  │   connect() │ getEmployees() │ getTimeRecords() │ sync()    ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│     ┌────────────────────────┼────────────────────────┬─────────┤
│     │                        │                        │         │
│     ▼                        ▼                        ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     ADP      │    │   Paychex    │    │   Workday    │      │
│  │   Adapter    │    │   Adapter    │    │   Adapter    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│     │                        │                        │         │
│     │  OAuth 2.0            │  API Key               │  OAuth  │
│     │  + SFTP               │  + SFTP                │  + API  │
│     ▼                        ▼                        ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  ADP APIs    │    │Paychex APIs  │    │Workday APIs  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 PayrollProvider Interface

```typescript
// libs/payroll-integration/src/types.ts

/**
 * Standardized interface for payroll system integration
 */
export interface PayrollProvider {
  /**
   * Provider identifier
   */
  readonly providerId: PayrollProviderId;

  /**
   * Initialize connection with credentials
   */
  connect(config: PayrollConnectionConfig): Promise<ConnectionResult>;

  /**
   * Test connection health
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Fetch employee roster
   */
  getEmployees(options?: GetEmployeesOptions): Promise<PayrollEmployee[]>;

  /**
   * Fetch time records for a date range
   */
  getTimeRecords(
    startDate: Date,
    endDate: Date,
    options?: GetTimeRecordsOptions
  ): Promise<TimeRecord[]>;

  /**
   * Fetch pay periods
   */
  getPayPeriods(
    year: number,
    options?: GetPayPeriodsOptions
  ): Promise<PayPeriod[]>;

  /**
   * Subscribe to employee changes (if supported)
   */
  subscribeToChanges?(
    callback: (event: PayrollChangeEvent) => void
  ): Promise<Subscription>;

  /**
   * Push sick time balances back to payroll system (if supported)
   */
  pushBalances?(balances: EmployeeBalance[]): Promise<PushResult>;
}

export type PayrollProviderId =
  | 'adp'
  | 'paychex'
  | 'workday'
  | 'gusto'
  | 'quickbooks'
  | 'paycor'
  | 'custom';
```

#### 2.3 ADP Integration Adapter

```typescript
// libs/payroll-integration/src/adapters/adp.ts

import { PayrollProvider, PayrollEmployee, TimeRecord } from '../types';

export class ADPProvider implements PayrollProvider {
  readonly providerId = 'adp' as const;
  private accessToken?: string;
  private refreshToken?: string;

  constructor(private config: ADPConfig) {}

  async connect(credentials: ADPCredentials): Promise<ConnectionResult> {
    try {
      // ADP uses OAuth 2.0
      const tokenResponse = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'api',
        }),
      });

      if (!tokenResponse.ok) {
        return { ok: false, error: 'authentication_failed' };
      }

      const tokens = await tokenResponse.json();
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'connection_failed', cause: error };
    }
  }

  async getEmployees(
    options?: GetEmployeesOptions
  ): Promise<PayrollEmployee[]> {
    const response = await this.apiCall('/hr/v2/workers', options);
    return response.workers.map(this.mapWorkerToEmployee);
  }

  async getTimeRecords(
    startDate: Date,
    endDate: Date,
    options?: GetTimeRecordsOptions
  ): Promise<TimeRecord[]> {
    const response = await this.apiCall('/time/v3/time-cards', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...options,
    });
    return response.timeCards.map(this.mapTimeCardToRecord);
  }

  private mapWorkerToEmployee(worker: ADPWorker): PayrollEmployee {
    return {
      externalId: worker.associateOID,
      firstName: worker.person.legalName.givenName,
      lastName: worker.person.legalName.familyName1,
      email: worker.person.communication?.emails?.[0]?.emailUri,
      hireDate: new Date(worker.workerDates.originalHireDate),
      department: worker.businessCommunication?.department?.organizationName,
      status:
        worker.workerStatus.statusCode.codeValue === 'Active'
          ? 'active'
          : 'inactive',
    };
  }

  private async apiCall<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(endpoint, this.config.apiBaseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      await this.refreshAccessToken();
      return this.apiCall(endpoint, params);
    }

    if (!response.ok) {
      throw new PayrollAPIError(response.status, await response.text());
    }

    return response.json();
  }
}
```

#### 2.4 Payroll Sync Service

```typescript
// libs/payroll-integration/src/sync-service.ts

export class PayrollSyncService {
  constructor(
    private provider: PayrollProvider,
    private employeeRepo: EmployeeRepository,
    private timeRecordRepo: TimeRecordRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Synchronize employee roster from payroll system
   */
  async syncEmployees(): Promise<SyncResult> {
    const payrollEmployees = await this.provider.getEmployees();
    const localEmployees = await this.employeeRepo.findAll();

    const changes: EmployeeChange[] = [];

    // Find new employees
    for (const pe of payrollEmployees) {
      const local = localEmployees.find((e) => e.externalId === pe.externalId);
      if (!local) {
        const created = await this.employeeRepo.create(this.mapToLocal(pe));
        changes.push({ type: 'created', employee: created });
        await this.eventBus.publish({
          type: 'employee.created',
          source: 'payroll-sync',
          data: created,
        });
      } else if (this.hasChanges(local, pe)) {
        const updated = await this.employeeRepo.update(
          local.id,
          this.mapToLocal(pe)
        );
        changes.push({ type: 'updated', employee: updated });
        await this.eventBus.publish({
          type: 'employee.updated',
          source: 'payroll-sync',
          data: { before: local, after: updated },
        });
      }
    }

    // Find terminated employees
    for (const local of localEmployees) {
      const pe = payrollEmployees.find(
        (e) => e.externalId === local.externalId
      );
      if (!pe || pe.status === 'inactive') {
        if (local.status === 'active') {
          await this.employeeRepo.update(local.id, { status: 'inactive' });
          changes.push({ type: 'deactivated', employee: local });
          await this.eventBus.publish({
            type: 'employee.deactivated',
            source: 'payroll-sync',
            data: local,
          });
        }
      }
    }

    return { changes, syncedAt: new Date() };
  }

  /**
   * Synchronize time records for accrual calculation
   */
  async syncTimeRecords(startDate: Date, endDate: Date): Promise<SyncResult> {
    const timeRecords = await this.provider.getTimeRecords(startDate, endDate);

    for (const record of timeRecords) {
      await this.timeRecordRepo.upsert({
        externalId: record.externalId,
        employeeExternalId: record.employeeId,
        date: record.date,
        hoursWorked: record.hoursWorked,
        payPeriodId: record.payPeriodId,
      });
    }

    await this.eventBus.publish({
      type: 'time-records.synced',
      source: 'payroll-sync',
      data: { startDate, endDate, count: timeRecords.length },
    });

    return { syncedAt: new Date(), recordCount: timeRecords.length };
  }
}
```

### 3. Event-Driven Architecture

#### 3.1 Event Bus Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event-Driven Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Event Producers                         ││
│  │  PayrollSync │ AccrualEngine │ UserActions │ SystemEvents   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       Event Bus                              ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │  Cloud: Firebase Pub/Sub / Cloud Functions              │││
│  │  │  On-Prem: Redis Streams / RabbitMQ / Kafka              │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│     ┌────────────────────────┼────────────────────────┐         │
│     │                        │                        │         │
│     ▼                        ▼                        ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Notification │    │   Webhook    │    │    Audit     │      │
│  │   Handler    │    │   Handler    │    │   Handler    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 Event Types and Schema

```typescript
// libs/events/src/types.ts

/**
 * Base event structure
 */
export interface DomainEvent<T = unknown> {
  id: string;
  type: EventType;
  source: EventSource;
  tenantId: string;
  timestamp: Date;
  version: number;
  data: T;
  metadata?: EventMetadata;
}

export type EventType =
  // Employee events
  | 'employee.created'
  | 'employee.updated'
  | 'employee.deactivated'
  | 'employee.deleted'
  // Accrual events
  | 'accrual.calculated'
  | 'accrual.adjusted'
  | 'accrual.carryover-applied'
  // Time record events
  | 'time-record.created'
  | 'time-record.updated'
  | 'time-records.synced'
  // Usage events
  | 'sick-time.used'
  | 'sick-time.requested'
  | 'sick-time.approved'
  | 'sick-time.denied'
  // System events
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed'
  | 'backup.created'
  | 'license.validated'
  | 'license.expired';

export type EventSource =
  | 'api'
  | 'payroll-sync'
  | 'accrual-engine'
  | 'user-action'
  | 'system'
  | 'scheduler';

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

#### 3.3 Event Bus Interface

```typescript
// libs/events/src/event-bus.ts

export interface EventBus {
  /**
   * Publish an event
   */
  publish<T>(event: Omit<DomainEvent<T>, 'id' | 'timestamp'>): Promise<void>;

  /**
   * Subscribe to event types
   */
  subscribe<T>(
    eventTypes: EventType[],
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription>;

  /**
   * Get events for replay/debugging
   */
  getEvents(tenantId: string, query: EventQuery): Promise<DomainEvent[]>;
}

export interface EventHandler<T> {
  (event: DomainEvent<T>): Promise<void>;
}

export interface SubscribeOptions {
  // Consumer group for load balancing
  group?: string;

  // Start from specific position
  startFrom?: 'beginning' | 'latest' | Date;

  // Retry configuration
  retry?: RetryConfig;

  // Dead letter queue
  deadLetter?: boolean;
}

export interface Subscription {
  unsubscribe(): Promise<void>;
}
```

#### 3.4 Cloud Event Bus (Firebase)

```typescript
// libs/events/src/adapters/firebase-event-bus.ts

import { getFirestore } from 'firebase-admin/firestore';
import { PubSub } from '@google-cloud/pubsub';

export class FirebaseEventBus implements EventBus {
  private pubsub: PubSub;
  private db: Firestore;

  constructor() {
    this.pubsub = new PubSub();
    this.db = getFirestore();
  }

  async publish<T>(
    event: Omit<DomainEvent<T>, 'id' | 'timestamp'>
  ): Promise<void> {
    const fullEvent: DomainEvent<T> = {
      ...event,
      id: generateEventId(),
      timestamp: new Date(),
    };

    // Store in Firestore for durability and querying
    await this.db
      .collection('tenants')
      .doc(event.tenantId)
      .collection('events')
      .doc(fullEvent.id)
      .set(this.serializeEvent(fullEvent));

    // Publish to Pub/Sub for real-time processing
    const topic = this.pubsub.topic(`esta-events-${event.type.split('.')[0]}`);
    await topic.publishMessage({
      data: Buffer.from(JSON.stringify(fullEvent)),
      attributes: {
        tenantId: event.tenantId,
        eventType: event.type,
      },
    });
  }

  async subscribe<T>(
    eventTypes: EventType[],
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription> {
    const subscriptions: Array<() => Promise<void>> = [];

    for (const eventType of eventTypes) {
      const topicName = `esta-events-${eventType.split('.')[0]}`;
      const subscriptionName = `${topicName}-${options?.group ?? generateId()}`;

      const topic = this.pubsub.topic(topicName);
      const [subscription] = await topic.createSubscription(subscriptionName, {
        filter: `attributes.eventType = "${eventType}"`,
      });

      subscription.on('message', async (message) => {
        const event = JSON.parse(message.data.toString());
        try {
          await handler(event);
          message.ack();
        } catch (error) {
          message.nack();
        }
      });

      subscriptions.push(async () => {
        await subscription.close();
      });
    }

    return {
      unsubscribe: async () => {
        await Promise.all(subscriptions.map((unsub) => unsub()));
      },
    };
  }
}
```

#### 3.5 On-Premise Event Bus (Redis Streams)

```typescript
// libs/events/src/adapters/redis-event-bus.ts

import Redis from 'ioredis';

export class RedisEventBus implements EventBus {
  private redis: Redis;

  constructor(private config: RedisConfig) {
    this.redis = new Redis(config.url);
  }

  async publish<T>(
    event: Omit<DomainEvent<T>, 'id' | 'timestamp'>
  ): Promise<void> {
    const fullEvent: DomainEvent<T> = {
      ...event,
      id: generateEventId(),
      timestamp: new Date(),
    };

    const streamKey = `events:${event.tenantId}:${event.type.split('.')[0]}`;

    await this.redis.xadd(streamKey, '*', 'event', JSON.stringify(fullEvent));
  }

  async subscribe<T>(
    eventTypes: EventType[],
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription> {
    const consumerGroup = options?.group ?? `group-${generateId()}`;
    const consumerId = `consumer-${generateId()}`;

    let running = true;

    const processStream = async (streamKey: string) => {
      // Create consumer group if not exists
      try {
        await this.redis.xgroup(
          'CREATE',
          streamKey,
          consumerGroup,
          '0',
          'MKSTREAM'
        );
      } catch {
        // Group already exists
      }

      while (running) {
        const results = await this.redis.xreadgroup(
          'GROUP',
          consumerGroup,
          consumerId,
          'BLOCK',
          5000,
          'COUNT',
          10,
          'STREAMS',
          streamKey,
          '>'
        );

        if (!results) continue;

        for (const [, messages] of results) {
          for (const [id, fields] of messages) {
            const event = JSON.parse(fields[1]);
            try {
              await handler(event);
              await this.redis.xack(streamKey, consumerGroup, id);
            } catch (error) {
              // Message will be reprocessed
              console.error('Event handler error:', error);
            }
          }
        }
      }
    };

    // Start processing all relevant streams
    const streams = eventTypes.map((et) => `events:*:${et.split('.')[0]}`);
    const processes = streams.map((s) => processStream(s));

    return {
      unsubscribe: async () => {
        running = false;
        await Promise.all(processes);
      },
    };
  }
}
```

#### 3.6 Event Handlers

```typescript
// libs/events/src/handlers/notification-handler.ts

export class NotificationEventHandler {
  constructor(
    private notificationService: NotificationService,
    private templateService: TemplateService
  ) {}

  @EventHandler(['sick-time.approved', 'sick-time.denied'])
  async handleSickTimeDecision(
    event: DomainEvent<SickTimeDecisionData>
  ): Promise<void> {
    const { employeeId, decision, hours, requestDate } = event.data;

    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee?.email) return;

    const template =
      decision === 'approved' ? 'sick-time-approved' : 'sick-time-denied';

    await this.notificationService.send({
      to: employee.email,
      template,
      data: {
        employeeName: employee.firstName,
        hours,
        date: requestDate,
      },
    });
  }

  @EventHandler(['accrual.calculated'])
  async handleAccrualCalculated(
    event: DomainEvent<AccrualCalculatedData>
  ): Promise<void> {
    const { employeeId, newBalance, periodEnd } = event.data;

    // Check if balance is low
    if (newBalance < 8) {
      const employee = await this.employeeRepo.findById(employeeId);
      if (!employee) return;

      await this.notificationService.send({
        to: employee.email,
        template: 'low-balance-alert',
        data: {
          employeeName: employee.firstName,
          balance: newBalance,
          asOf: periodEnd,
        },
      });
    }
  }
}
```

### 4. Deployment Configurations

#### 4.1 Environment Detection

```typescript
// libs/platform/src/environment.ts

export type Environment =
  | {
      type: 'cloud';
      subtype: 'firebase' | 'supabase' | 'aws' | 'azure' | 'gcp';
    }
  | {
      type: 'on-premise';
      subtype: 'kubernetes' | 'docker-compose' | 'bare-metal';
    };

export function detectEnvironment(): Environment {
  // Check for Firebase
  if (process.env.FIREBASE_PROJECT_ID) {
    return { type: 'cloud', subtype: 'firebase' };
  }

  // Check for Kubernetes
  if (process.env.KUBERNETES_SERVICE_HOST) {
    return { type: 'on-premise', subtype: 'kubernetes' };
  }

  // Check for Docker
  if (fs.existsSync('/.dockerenv')) {
    return { type: 'on-premise', subtype: 'docker-compose' };
  }

  // Default to bare-metal on-premise
  return { type: 'on-premise', subtype: 'bare-metal' };
}

export function createPlatformServices(env: Environment): PlatformServices {
  switch (env.type) {
    case 'cloud':
      return createCloudServices(env.subtype);
    case 'on-premise':
      return createOnPremiseServices(env.subtype);
  }
}
```

#### 4.2 Service Factory

```typescript
// libs/platform/src/factory.ts

export interface PlatformServices {
  database: DataAdapter;
  eventBus: EventBus;
  storage: StorageProvider;
  auth: AuthProvider;
  cache: CacheProvider;
}

function createCloudServices(subtype: string): PlatformServices {
  switch (subtype) {
    case 'firebase':
      return {
        database: new FirestoreAdapter(),
        eventBus: new FirebaseEventBus(),
        storage: new FirebaseStorageProvider(),
        auth: new FirebaseAuthProvider(),
        cache: new FirestoreCacheProvider(),
      };
    case 'supabase':
      return {
        database: new PostgresAdapter(supabasePool),
        eventBus: new SupabaseRealtimeEventBus(),
        storage: new SupabaseStorageProvider(),
        auth: new SupabaseAuthProvider(),
        cache: new RedisCacheProvider(),
      };
    default:
      throw new Error(`Unsupported cloud subtype: ${subtype}`);
  }
}

function createOnPremiseServices(subtype: string): PlatformServices {
  return {
    database: new PostgresAdapter(localPool),
    eventBus: new RedisEventBus(),
    storage: new MinioStorageProvider(),
    auth: new LocalAuthProvider(),
    cache: new RedisCacheProvider(),
  };
}
```

## Consequences

### Positive

- **Enterprise readiness** on-premise deployment option
- **Vendor independence** pluggable infrastructure components
- **Integration flexibility** standardized payroll interfaces
- **Real-time sync** event-driven architecture
- **Scalability** horizontal scaling via events

### Negative

- **Operational complexity** multiple deployment modes to support
- **Testing burden** must test all configurations
- **Documentation** extensive deployment guides required
- **Support cost** on-premise deployments need dedicated support

### Mitigations

- **Infrastructure as Code** consistent deployments via Terraform/Pulumi
- **Automated testing** CI/CD tests all deployment configurations
- **Runbooks** detailed operational documentation
- **Tiered support** enterprise tier includes deployment support

## Implementation Phases

### Phase 1: Platform Abstraction (Q1 2026)

- [ ] Define platform service interfaces
- [ ] Implement environment detection
- [ ] Create service factory

### Phase 2: Event Bus (Q2 2026)

- [ ] Define event types and schema
- [ ] Implement Firebase event bus
- [ ] Implement Redis event bus
- [ ] Create event handlers

### Phase 3: Payroll Integration (Q3 2026)

- [ ] Define PayrollProvider interface
- [ ] Implement ADP adapter
- [ ] Implement Paychex adapter
- [ ] Create sync service

### Phase 4: On-Premise Deployment (Q4 2026)

- [ ] Create Docker Compose configuration
- [ ] Create Kubernetes manifests
- [ ] Build deployment automation
- [ ] Create operations documentation

## References

- [ADR 008: Data Portability Strategy](./008-data-portability.md)
- [ADR 006: Adapter Pattern](./006-adapter-pattern.md)
- [ADP API Documentation](https://developers.adp.com/)
- [Paychex API Documentation](https://developer.paychex.com/)
- [Redis Streams Documentation](https://redis.io/docs/data-types/streams/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## Revision History

| Version | Date       | Author    | Changes           |
| ------- | ---------- | --------- | ----------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial RFC draft |
