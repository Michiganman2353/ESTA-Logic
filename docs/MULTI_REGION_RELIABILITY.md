# Multi-Region Reliability Architecture

## Overview

This document defines the reliability architecture for ESTA Tracker to ensure mission-critical uptime for enterprises with >1,000 tenants.

## Architecture Goals

1. **99.9% Uptime SLA** - Maximum 8.76 hours downtime per year
2. **Sub-100ms P95 Latency** - For all read operations
3. **Data Durability** - Zero data loss through multi-region replication
4. **Graceful Degradation** - Continue serving during partial outages

## Regional Deployment Strategy

### Primary Region: `us-central1` (Iowa)

- Main Firestore instance
- Primary Cloud Functions
- Primary Redis cache (Upstash)
- Primary API endpoints

### Failover Region: `us-east1` (South Carolina)

- Read replica for Firestore
- Standby Cloud Functions
- Replica Redis cache
- Failover API endpoints

### Edge Deployment (via Vercel)

- Edge functions for static API routes
- CDN caching for static assets
- Geographic routing for latency optimization

## Failover Model

### Automatic Failover Triggers

| Condition                        | Action                   | Recovery Time |
| -------------------------------- | ------------------------ | ------------- |
| Primary DB unreachable >30s      | Switch to read replica   | <60 seconds   |
| Primary API 5xx rate >10%        | Route to failover region | <30 seconds   |
| Primary region network partition | DNS failover             | <120 seconds  |

### Health Check Endpoints

```
GET /api/health          - Full system health
GET /api/health/db       - Database connectivity
GET /api/health/cache    - Redis cache status
GET /api/health/compute  - Function execution
```

### Failover Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                     Normal Operation                             │
│  Client → Edge → Primary API → Firestore → Response             │
└─────────────────────────────────────────────────────────────────┘
                            │
                    Health Check Fails
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Circuit Breaker Opens                          │
│  1. Mark primary as degraded                                     │
│  2. Begin routing to failover region                             │
│  3. Log incident for monitoring                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Failover Mode                                 │
│  Client → Edge → Failover API → Read Replica → Response         │
│  (Write operations queued or rejected)                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                  Primary Recovers
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Recovery Phase                                │
│  1. Circuit breaker enters HALF_OPEN                            │
│  2. Gradually route traffic to primary                           │
│  3. Process queued writes                                        │
│  4. Circuit breaker returns to CLOSED                           │
└─────────────────────────────────────────────────────────────────┘
```

## Circuit Breaker Configuration

### Firestore Circuit Breaker

```typescript
{
  name: 'firestore',
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes in HALF_OPEN
  resetTimeout: 30000,      // Wait 30s before HALF_OPEN
  monitorWindow: 60000      // Count failures in 1 minute window
}
```

### External API Circuit Breaker

```typescript
{
  name: 'external-api',
  failureThreshold: 3,
  successThreshold: 2,
  resetTimeout: 60000,      // Longer timeout for external services
  monitorWindow: 120000
}
```

### Background Jobs Circuit Breaker

```typescript
{
  name: 'background-jobs',
  failureThreshold: 10,     // More tolerant for batch jobs
  successThreshold: 3,
  resetTimeout: 120000,     // 2 minutes recovery for batch
  monitorWindow: 300000
}
```

## Caching Strategy

### Cache Hierarchy

```
┌─────────────────────────────────────────┐
│  L1: In-Memory (Edge Workers)           │
│  TTL: 5-30 seconds                      │
│  Use: Hot path data, session tokens     │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  L2: Redis (Upstash)                    │
│  TTL: 1-30 minutes                      │
│  Use: Tenant data, accrual snapshots    │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│  L3: Firestore                          │
│  Persistent                             │
│  Use: Source of truth                   │
└─────────────────────────────────────────┘
```

### Cache Invalidation Patterns

| Event                   | Invalidation Action                   |
| ----------------------- | ------------------------------------- |
| Work log created        | Invalidate employee accrual cache     |
| Sick time approved      | Invalidate employee + dashboard cache |
| Employee added          | Invalidate employer dashboard cache   |
| Tenant settings changed | Invalidate all tenant cache           |

## Load Testing Targets

### Q4-2025 Peak Simulation

Based on projected growth:

| Metric                  | Target | Peak Expectation |
| ----------------------- | ------ | ---------------- |
| Concurrent users        | 10,000 | 15,000           |
| Requests/second         | 1,000  | 2,000            |
| Write operations/second | 100    | 200              |
| Tenant count            | 1,000  | 1,500            |
| Employees/tenant (avg)  | 50     | 75               |

### Latency SLA Guarantees

| Operation Type    | P50   | P95    | P99    |
| ----------------- | ----- | ------ | ------ |
| Read (cached)     | 10ms  | 25ms   | 50ms   |
| Read (DB)         | 50ms  | 100ms  | 200ms  |
| Write             | 100ms | 250ms  | 500ms  |
| Batch operations  | 500ms | 1000ms | 2000ms |
| Report generation | 2s    | 5s     | 10s    |

## Monitoring & Alerting

### Key Metrics

1. **Availability**
   - Uptime percentage per region
   - Circuit breaker state changes
   - Failover event count

2. **Latency**
   - P50, P95, P99 response times
   - Database query latency
   - Cache hit/miss ratio

3. **Error Rate**
   - 4xx/5xx response rates
   - Database error rates
   - Cache connection errors

4. **Throughput**
   - Requests per second
   - Active connections
   - Background job completion rate

### Alert Thresholds

| Metric               | Warning   | Critical    |
| -------------------- | --------- | ----------- |
| Error rate           | >1%       | >5%         |
| P95 latency          | >500ms    | >2000ms     |
| Circuit open         | Any       | >3 circuits |
| Cache miss rate      | >30%      | >50%        |
| Database connections | >80% pool | >95% pool   |

## Disaster Recovery

### Recovery Point Objective (RPO)

- **Target:** 0 seconds (real-time replication)
- **Achievable:** <15 minutes for async backup

### Recovery Time Objective (RTO)

- **Target:** <5 minutes
- **Achievable:** <15 minutes (manual intervention)

### Backup Strategy

| Data Type     | Frequency  | Retention     |
| ------------- | ---------- | ------------- |
| Firestore     | Continuous | 30 days       |
| Redis cache   | On-demand  | N/A (rebuilt) |
| Configuration | Daily      | 90 days       |
| Audit logs    | Continuous | 3 years       |

## Implementation Checklist

- [x] Circuit breaker implementation
- [x] Redis caching layer
- [x] Tenant-scoped cache keys
- [x] Composite Firestore indexes
- [x] Query optimization utilities
- [ ] Health check endpoints
- [ ] Load testing scripts
- [ ] Monitoring dashboard
- [ ] Alerting rules
- [ ] Runbook documentation
- [ ] Failover DNS configuration
- [ ] Read replica setup
