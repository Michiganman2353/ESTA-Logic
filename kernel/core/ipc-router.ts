/**
 * ESTA-Logic Microkernel IPC Router
 *
 * Implements kernel-mediated message passing for all inter-process communication.
 * All messages must flow through this router - no direct service-to-service imports.
 *
 * @module kernel/core/ipc-router
 */

import type { ProcessId, Priority } from './scheduler';

// ============================================================================
// SECTION 1: MESSAGE TYPES
// ============================================================================

/** Message identifier */
export interface MessageId {
  readonly high: number;
  readonly low: number;
}

/** Hybrid Logical Clock timestamp for deterministic ordering */
export interface Timestamp {
  readonly wallNanos: number;
  readonly logical: number;
  readonly nodeId: number;
}

/** Message priority for routing */
export type MessagePriority =
  | 'background'
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

/** Core message type classification */
export type MessageType =
  | { type: 'command'; name: string }
  | { type: 'query'; name: string }
  | { type: 'event'; name: string }
  | { type: 'response'; status: ResponseStatus }
  | { type: 'system'; kind: SystemMessageKind };

/** Response status */
export type ResponseStatus =
  | { type: 'ok' }
  | { type: 'error'; code: number; message: string }
  | { type: 'pending' }
  | { type: 'timeout' };

/** System message kinds */
export type SystemMessageKind =
  | 'ping'
  | 'pong'
  | 'shutdown'
  | 'subscribe'
  | 'unsubscribe'
  | 'ack'
  | 'nack'
  | 'flow_pause'
  | 'flow_resume';

/** Channel address for routing */
export interface ChannelAddress {
  readonly transport: Transport;
  readonly channel: string;
  readonly partition?: number;
}

/** Supported transport protocols */
export type Transport = 'local' | 'kafka' | 'redis' | 'wasm' | 'tauri' | 'grpc';

/** Trace context for distributed tracing */
export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly sampled: boolean;
}

/** Authentication context */
export interface AuthContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly roles: readonly string[];
  readonly expiresAt: number;
}

/** Message envelope - the canonical IPC schema */
export interface Message<T = unknown> {
  readonly id: MessageId;
  readonly timestamp: Timestamp;
  readonly source: ProcessId;
  readonly target: ProcessId | 'kernel' | 'broadcast';
  readonly opcode: string;
  readonly messageType: MessageType;
  readonly payload: T;
  readonly traceContext: TraceContext;
  readonly authContext: AuthContext;
  readonly correlationId?: MessageId;
  readonly replyTo?: ChannelAddress;
  readonly ttl?: number;
  readonly priority: MessagePriority;
}

// ============================================================================
// SECTION 2: ROUTER TYPES
// ============================================================================

/** Router configuration */
export interface RouterConfig {
  /** Maximum pending messages per process */
  readonly maxPendingPerProcess: number;
  /** Maximum total pending messages */
  readonly maxTotalPending: number;
  /** Message TTL default (ms) */
  readonly defaultTtlMs: number;
  /** Enable message deduplication */
  readonly deduplicationEnabled: boolean;
  /** Deduplication window (ms) */
  readonly deduplicationWindowMs: number;
}

/** Routing table entry */
export interface RouteEntry {
  readonly pattern: string;
  readonly target: ProcessId | 'kernel';
  readonly priority: Priority;
  readonly capabilities: readonly string[];
}

/** Router statistics */
export interface RouterStats {
  readonly totalRouted: number;
  readonly totalDropped: number;
  readonly totalDelivered: number;
  readonly pendingMessages: number;
  readonly duplicatesFiltered: number;
  readonly avgLatencyMs: number;
}

/** Router state */
export interface RouterState {
  readonly config: RouterConfig;
  readonly routes: ReadonlyMap<string, RouteEntry>;
  readonly pendingQueues: ReadonlyMap<number, Message[]>;
  readonly recentMessageIds: ReadonlySet<string>;
  readonly stats: RouterStats;
}

/** Routing result */
export type RouteResult =
  | { type: 'delivered'; target: ProcessId }
  | { type: 'queued'; queueDepth: number }
  | { type: 'dropped'; reason: DropReason }
  | { type: 'broadcast'; deliveredTo: number };

/** Reason for dropping a message */
export type DropReason =
  | 'no_route'
  | 'queue_full'
  | 'ttl_expired'
  | 'duplicate'
  | 'permission_denied'
  | 'target_terminated';

// ============================================================================
// SECTION 3: CONFIGURATION
// ============================================================================

/** Default router configuration */
export function defaultRouterConfig(): RouterConfig {
  return {
    maxPendingPerProcess: 1000,
    maxTotalPending: 10000,
    defaultTtlMs: 30000,
    deduplicationEnabled: true,
    deduplicationWindowMs: 5000,
  };
}

/** Create initial router state */
export function createRouter(
  config: RouterConfig = defaultRouterConfig()
): RouterState {
  return {
    config,
    routes: new Map(),
    pendingQueues: new Map(),
    recentMessageIds: new Set(),
    stats: {
      totalRouted: 0,
      totalDropped: 0,
      totalDelivered: 0,
      pendingMessages: 0,
      duplicatesFiltered: 0,
      avgLatencyMs: 0,
    },
  };
}

// ============================================================================
// SECTION 4: ROUTING OPERATIONS
// ============================================================================

/** Register a route */
export function registerRoute(
  state: RouterState,
  pattern: string,
  target: ProcessId | 'kernel',
  priority: Priority,
  capabilities: readonly string[] = []
): RouterState {
  const newRoutes = new Map(state.routes);
  newRoutes.set(pattern, { pattern, target, priority, capabilities });

  return {
    ...state,
    routes: newRoutes,
  };
}

/** Unregister a route */
export function unregisterRoute(
  state: RouterState,
  pattern: string
): RouterState {
  const newRoutes = new Map(state.routes);
  newRoutes.delete(pattern);

  return {
    ...state,
    routes: newRoutes,
  };
}

/** Route a message */
export function routeMessage<T>(
  state: RouterState,
  message: Message<T>,
  now: number
): [RouterState, RouteResult] {
  // Check for duplicate
  if (state.config.deduplicationEnabled) {
    const msgIdStr = messageIdToString(message.id);
    if (state.recentMessageIds.has(msgIdStr)) {
      return [
        {
          ...state,
          stats: {
            ...state.stats,
            totalDropped: state.stats.totalDropped + 1,
            duplicatesFiltered: state.stats.duplicatesFiltered + 1,
          },
        },
        { type: 'dropped', reason: 'duplicate' },
      ];
    }
  }

  // Check TTL
  const ttl = message.ttl ?? state.config.defaultTtlMs;
  const messageAgeMs =
    (now * 1_000_000 - message.timestamp.wallNanos) / 1_000_000;
  if (messageAgeMs > ttl) {
    return [
      {
        ...state,
        stats: {
          ...state.stats,
          totalDropped: state.stats.totalDropped + 1,
        },
      },
      { type: 'dropped', reason: 'ttl_expired' },
    ];
  }

  // Handle broadcast
  if (message.target === 'broadcast') {
    return routeBroadcast(state, message);
  }

  // Handle kernel-targeted messages
  if (message.target === 'kernel') {
    return [
      {
        ...state,
        stats: {
          ...state.stats,
          totalRouted: state.stats.totalRouted + 1,
          totalDelivered: state.stats.totalDelivered + 1,
        },
      },
      { type: 'delivered', target: { value: 0 } }, // Kernel PID is 0
    ];
  }

  // Find route for opcode
  const route = findRoute(state.routes, message.opcode);

  // Direct delivery to target process
  const targetPid = message.target as ProcessId;
  return queueForDelivery(state, message, targetPid, route);
}

/** Route a broadcast message */
function routeBroadcast<T>(
  state: RouterState,
  message: Message<T>
): [RouterState, RouteResult] {
  const matchingRoutes = findMatchingRoutes(state.routes, message.opcode);
  let deliveredCount = 0;
  let newState = state;

  for (const route of matchingRoutes) {
    if (route.target !== 'kernel') {
      const [updatedState] = queueForDelivery(
        newState,
        { ...message, target: route.target },
        route.target,
        route
      );
      newState = updatedState;
      deliveredCount++;
    }
  }

  return [
    {
      ...newState,
      stats: {
        ...newState.stats,
        totalRouted: newState.stats.totalRouted + 1,
      },
    },
    { type: 'broadcast', deliveredTo: deliveredCount },
  ];
}

/** Queue message for delivery */
function queueForDelivery<T>(
  state: RouterState,
  message: Message<T>,
  target: ProcessId,
  _route: RouteEntry | undefined
): [RouterState, RouteResult] {
  const currentQueue = state.pendingQueues.get(target.value) ?? [];

  // Check queue limits
  if (currentQueue.length >= state.config.maxPendingPerProcess) {
    return [
      {
        ...state,
        stats: {
          ...state.stats,
          totalDropped: state.stats.totalDropped + 1,
        },
      },
      { type: 'dropped', reason: 'queue_full' },
    ];
  }

  // Add to queue (priority-ordered)
  const newQueue = insertByPriority(currentQueue, message as Message);
  const newPendingQueues = new Map(state.pendingQueues);
  newPendingQueues.set(target.value, newQueue);

  // Track message ID for deduplication
  const newRecentIds = new Set(state.recentMessageIds);
  if (state.config.deduplicationEnabled) {
    newRecentIds.add(messageIdToString(message.id));
  }

  return [
    {
      ...state,
      pendingQueues: newPendingQueues,
      recentMessageIds: newRecentIds,
      stats: {
        ...state.stats,
        totalRouted: state.stats.totalRouted + 1,
        pendingMessages: state.stats.pendingMessages + 1,
      },
    },
    { type: 'queued', queueDepth: newQueue.length },
  ];
}

/** Deliver pending messages to a process */
export function deliverPending(
  state: RouterState,
  pid: ProcessId,
  maxMessages: number = 10
): [RouterState, Message[]] {
  const queue = state.pendingQueues.get(pid.value) ?? [];
  const toDeliver = queue.slice(0, maxMessages);
  const remaining = queue.slice(maxMessages);

  const newPendingQueues = new Map(state.pendingQueues);
  if (remaining.length === 0) {
    newPendingQueues.delete(pid.value);
  } else {
    newPendingQueues.set(pid.value, remaining);
  }

  return [
    {
      ...state,
      pendingQueues: newPendingQueues,
      stats: {
        ...state.stats,
        totalDelivered: state.stats.totalDelivered + toDeliver.length,
        pendingMessages: state.stats.pendingMessages - toDeliver.length,
      },
    },
    toDeliver,
  ];
}

/** Clear expired messages and old deduplication entries */
export function cleanupRouter(state: RouterState, now: number): RouterState {
  // Clean up expired messages from queues
  const newPendingQueues = new Map<number, Message[]>();
  let droppedCount = 0;

  for (const [pid, queue] of state.pendingQueues) {
    const validMessages = queue.filter((msg) => {
      const ttl = msg.ttl ?? state.config.defaultTtlMs;
      const messageAgeMs =
        (now * 1_000_000 - msg.timestamp.wallNanos) / 1_000_000;
      if (messageAgeMs > ttl) {
        droppedCount++;
        return false;
      }
      return true;
    });

    if (validMessages.length > 0) {
      newPendingQueues.set(pid, validMessages);
    }
  }

  return {
    ...state,
    pendingQueues: newPendingQueues,
    // Note: In production, we'd also clean up old recentMessageIds based on timestamp
    stats: {
      ...state.stats,
      totalDropped: state.stats.totalDropped + droppedCount,
      pendingMessages:
        state.stats.pendingMessages -
        droppedCount -
        (Array.from(state.pendingQueues.values()).reduce(
          (sum, q) => sum + q.length,
          0
        ) -
          Array.from(newPendingQueues.values()).reduce(
            (sum, q) => sum + q.length,
            0
          )),
    },
  };
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

/** Convert message ID to string */
export function messageIdToString(id: MessageId): string {
  return `${id.high.toString(16).padStart(16, '0')}${id.low.toString(16).padStart(16, '0')}`;
}

/** Generate a new message ID */
export function generateMessageId(timestamp: number): MessageId {
  return {
    high: timestamp,
    low: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
  };
}

/** Create current timestamp */
export function nowTimestamp(nodeId: number = 0): Timestamp {
  return {
    wallNanos: Date.now() * 1_000_000,
    logical: 0,
    nodeId,
  };
}

/** Find route matching opcode pattern */
function findRoute(
  routes: ReadonlyMap<string, RouteEntry>,
  opcode: string
): RouteEntry | undefined {
  // Exact match first
  const exact = routes.get(opcode);
  if (exact) return exact;

  // Prefix match (e.g., "accrual.*" matches "accrual.calculate")
  for (const [pattern, entry] of routes) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (opcode.startsWith(prefix)) {
        return entry;
      }
    }
  }

  return undefined;
}

/** Find all matching routes for broadcast */
function findMatchingRoutes(
  routes: ReadonlyMap<string, RouteEntry>,
  opcode: string
): RouteEntry[] {
  const matches: RouteEntry[] = [];

  for (const [pattern, entry] of routes) {
    if (pattern === opcode) {
      matches.push(entry);
    } else if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (opcode.startsWith(prefix)) {
        matches.push(entry);
      }
    }
  }

  return matches;
}

/** Convert message priority to number */
function messagePriorityToNumber(priority: MessagePriority): number {
  switch (priority) {
    case 'background':
      return 0;
    case 'low':
      return 1;
    case 'normal':
      return 2;
    case 'high':
      return 3;
    case 'critical':
      return 4;
  }
}

/** Insert message into queue by priority */
function insertByPriority(queue: Message[], message: Message): Message[] {
  const newQueue = [...queue];
  const msgPriority = messagePriorityToNumber(message.priority);

  let insertIndex = newQueue.length;
  for (let i = 0; i < newQueue.length; i++) {
    const currentMsg = newQueue[i];
    if (
      currentMsg &&
      messagePriorityToNumber(currentMsg.priority) < msgPriority
    ) {
      insertIndex = i;
      break;
    }
  }

  newQueue.splice(insertIndex, 0, message);
  return newQueue;
}

/** Get pending queue depth for a process */
export function getQueueDepth(state: RouterState, pid: ProcessId): number {
  return state.pendingQueues.get(pid.value)?.length ?? 0;
}

/** Get total pending messages */
export function getTotalPending(state: RouterState): number {
  return Array.from(state.pendingQueues.values()).reduce(
    (sum, q) => sum + q.length,
    0
  );
}

// ============================================================================
// SECTION 6: MESSAGE CONSTRUCTION HELPERS
// ============================================================================

/** Create a command message */
export function createCommand<T>(
  source: ProcessId,
  target: ProcessId | 'kernel',
  opcode: string,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext
): Message<T> {
  const timestamp = nowTimestamp();
  return {
    id: generateMessageId(Date.now()),
    timestamp,
    source,
    target,
    opcode,
    messageType: { type: 'command', name: opcode },
    payload,
    traceContext,
    authContext,
    priority: 'normal',
  };
}

/** Create a query message */
export function createQuery<T>(
  source: ProcessId,
  target: ProcessId | 'kernel',
  opcode: string,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext
): Message<T> {
  const timestamp = nowTimestamp();
  return {
    id: generateMessageId(Date.now()),
    timestamp,
    source,
    target,
    opcode,
    messageType: { type: 'query', name: opcode },
    payload,
    traceContext,
    authContext,
    priority: 'normal',
  };
}

/** Create an event message */
export function createEvent<T>(
  source: ProcessId,
  target: ProcessId | 'kernel' | 'broadcast',
  opcode: string,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext
): Message<T> {
  const timestamp = nowTimestamp();
  return {
    id: generateMessageId(Date.now()),
    timestamp,
    source,
    target,
    opcode,
    messageType: { type: 'event', name: opcode },
    payload,
    traceContext,
    authContext,
    priority: 'normal',
  };
}

/** Create a response message */
export function createResponse<T>(
  source: ProcessId,
  target: ProcessId,
  opcode: string,
  payload: T,
  correlationId: MessageId,
  traceContext: TraceContext,
  authContext: AuthContext,
  status: ResponseStatus = { type: 'ok' }
): Message<T> {
  const timestamp = nowTimestamp();
  return {
    id: generateMessageId(Date.now()),
    timestamp,
    source,
    target,
    opcode,
    messageType: { type: 'response', status },
    payload,
    traceContext,
    authContext,
    correlationId,
    priority: 'high', // Responses are high priority
  };
}

/** Create a system message */
export function createSystemMessage(
  source: ProcessId,
  target: ProcessId | 'kernel',
  kind: SystemMessageKind,
  traceContext: TraceContext,
  authContext: AuthContext
): Message<null> {
  const timestamp = nowTimestamp();
  return {
    id: generateMessageId(Date.now()),
    timestamp,
    source,
    target,
    opcode: `sys.${kind}`,
    messageType: { type: 'system', kind },
    payload: null,
    traceContext,
    authContext,
    priority: 'critical', // System messages are critical
  };
}
