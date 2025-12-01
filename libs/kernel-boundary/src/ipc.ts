/**
 * IPC Messaging Layer
 *
 * TypeScript port of the Gleam messaging fabric (estalogic_protocol/message.gleam)
 *
 * Key Design Principles:
 * 1. Prefer typed messages over ad-hoc objects for type safety
 * 2. Enforce serialization determinism for cross-boundary consistency
 * 3. All messages are traceable with embedded context
 * 4. Authentication context is always present for security
 *
 * @module ipc
 */

import { z } from 'zod';
import type { TenantId, CapabilityId } from './capability.js';

// ============================================================================
// SECTION 1: MESSAGE IDENTIFIER TYPES
// ============================================================================

/**
 * Universally unique message identifier
 * Uses UUID v7 format for time-ordered, collision-resistant IDs
 */
export interface MessageId {
  /** High 64 bits (timestamp + version + variant) */
  readonly high: number;
  /** Low 64 bits (random component) */
  readonly low: number;
}

/** Zod schema for MessageId validation */
export const MessageIdSchema = z.object({
  high: z.number(),
  low: z.number(),
});

/**
 * Monotonically increasing sequence number within a channel
 */
export interface SequenceNumber {
  readonly value: number;
}

/**
 * Idempotency token for deduplication
 */
export interface IdempotencyToken {
  readonly value: string;
}

// ============================================================================
// SECTION 2: TIMESTAMP TYPES
// ============================================================================

/**
 * Logical timestamp with wall-clock and logical counter
 * Implements Hybrid Logical Clock (HLC) semantics
 */
export interface Timestamp {
  /** Wall clock in nanoseconds since Unix epoch */
  readonly wallNanos: number;
  /** Logical counter for same-millisecond ordering */
  readonly logical: number;
  /** Node ID for tie-breaking across nodes */
  readonly nodeId: number;
}

/** Zod schema for Timestamp */
export const TimestampSchema = z.object({
  wallNanos: z.number(),
  logical: z.number().int().nonnegative(),
  nodeId: z.number().int(),
});

/**
 * Duration for timeout and TTL specifications
 */
export interface Duration {
  readonly nanos: number;
}

// ============================================================================
// SECTION 3: TRACE CONTEXT TYPES (W3C Trace Context compatible)
// ============================================================================

/**
 * Trace identifier - 128-bit ID shared by all spans in a trace
 */
export interface TraceId {
  readonly high: number;
  readonly low: number;
}

/**
 * Span identifier - 64-bit ID unique within a trace
 */
export interface SpanId {
  readonly value: number;
}

/**
 * Trace flags as per W3C specification
 */
export interface TraceFlags {
  /** Whether this trace is sampled for recording */
  readonly sampled: boolean;
  /** Whether the trace ID is randomly generated */
  readonly random: boolean;
}

/**
 * Vendor-specific trace state entry
 */
export interface TraceStateEntry {
  readonly vendor: string;
  readonly value: string;
}

/**
 * W3C Trace Context compliant trace context
 */
export interface TraceContext {
  /** Version of the trace context format */
  readonly version: number;
  /** Trace identifier spanning all related operations */
  readonly traceId: TraceId;
  /** Parent span identifier */
  readonly parentSpanId: SpanId;
  /** Trace flags */
  readonly traceFlags: TraceFlags;
  /** Vendor-specific trace state */
  readonly traceState: readonly TraceStateEntry[];
}

/**
 * Create an empty trace context
 */
export function emptyTraceContext(): TraceContext {
  return {
    version: 0,
    traceId: { high: 0, low: 0 },
    parentSpanId: { value: 0 },
    traceFlags: { sampled: false, random: false },
    traceState: [],
  };
}

/**
 * Check if trace context is valid
 */
export function isValidTraceContext(ctx: TraceContext): boolean {
  return ctx.traceId.high !== 0 || ctx.traceId.low !== 0;
}

// ============================================================================
// SECTION 4: AUTHENTICATION CONTEXT TYPES
// ============================================================================

/**
 * Principal types for multi-entity authentication
 */
export type Principal =
  | { type: 'user'; userId: string }
  | { type: 'service'; serviceName: string }
  | { type: 'machine'; clientId: string }
  | { type: 'anonymous' }
  | { type: 'system' };

/** Zod schema for Principal */
export const PrincipalSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), userId: z.string() }),
  z.object({ type: z.literal('service'), serviceName: z.string() }),
  z.object({ type: z.literal('machine'), clientId: z.string() }),
  z.object({ type: z.literal('anonymous') }),
  z.object({ type: z.literal('system') }),
]);

/**
 * Authentication methods
 */
export type AuthMethod =
  | 'jwt'
  | 'mtls'
  | 'api_key'
  | 'service_account'
  | 'none';

/**
 * Actions that can be performed on resources
 */
export type Action = 'read' | 'write' | 'delete' | 'execute' | 'admin';

/**
 * Resource types for capability-based security
 */
export type IpcResourceType =
  | 'employee'
  | 'accrual'
  | 'audit_log'
  | 'report'
  | 'config'
  | 'channel'
  | 'module';

/**
 * Claims are key-value pairs for custom assertions
 */
export interface Claim {
  readonly key: string;
  readonly value: string;
}

/**
 * Authentication context embedded in every message
 */
export interface AuthContext {
  /** Principal identifier (user, service, or system) */
  readonly principal: Principal;
  /** Authentication method used */
  readonly authMethod: AuthMethod;
  /** Timestamp when auth was established */
  readonly authenticatedAt: Timestamp;
  /** Expiration time for this auth context */
  readonly expiresAt: Timestamp;
  /** Capabilities granted to this principal */
  readonly capabilities: readonly CapabilityId[];
  /** Tenant identifier for multi-tenant isolation */
  readonly tenantId: TenantId;
  /** Request-scoped claims */
  readonly claims: readonly Claim[];
}

/**
 * Create an anonymous auth context
 */
export function anonymousAuthContext(
  now: Timestamp,
  tenantId: TenantId
): AuthContext {
  return {
    principal: { type: 'anonymous' },
    authMethod: 'none',
    authenticatedAt: now,
    expiresAt: {
      wallNanos: now.wallNanos + 3_600_000_000_000, // 1 hour
      logical: 0,
      nodeId: now.nodeId,
    },
    capabilities: [],
    tenantId,
    claims: [],
  };
}

/**
 * Create a system auth context
 */
export function systemAuthContext(
  now: Timestamp,
  tenantId: TenantId,
  capabilities: readonly CapabilityId[]
): AuthContext {
  return {
    principal: { type: 'system' },
    authMethod: 'service_account',
    authenticatedAt: now,
    expiresAt: {
      wallNanos: now.wallNanos + 86_400_000_000_000, // 24 hours
      logical: 0,
      nodeId: now.nodeId,
    },
    capabilities,
    tenantId,
    claims: [{ key: 'role', value: 'system' }],
  };
}

// ============================================================================
// SECTION 5: PAYLOAD TYPES
// ============================================================================

/**
 * Message payload with explicit encoding
 */
export type Payload =
  | { type: 'binary'; data: Uint8Array }
  | { type: 'json'; json: unknown }
  | { type: 'protobuf'; schemaId: number; data: Uint8Array }
  | { type: 'empty' };

// ============================================================================
// SECTION 6: MESSAGE TYPES
// ============================================================================

/**
 * Response status for response messages
 */
export type ResponseStatus =
  | { type: 'ok' }
  | { type: 'error'; code: number; message: string }
  | { type: 'pending' }
  | { type: 'timeout' };

/**
 * System message kinds
 */
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

/**
 * Message type enumeration for routing
 */
export type MessageType =
  | { type: 'command'; name: string }
  | { type: 'query'; name: string }
  | { type: 'event'; name: string }
  | { type: 'response'; status: ResponseStatus }
  | { type: 'system'; kind: SystemMessageKind };

/**
 * Supported transport protocols
 */
export type Transport = 'local' | 'kafka' | 'redis' | 'wasm' | 'tauri' | 'grpc';

/**
 * Channel address for routing
 */
export interface ChannelAddress {
  /** Transport protocol */
  readonly transport: Transport;
  /** Channel name or topic */
  readonly channel: string;
  /** Optional partition */
  readonly partition?: number;
}

/**
 * Message priority levels
 */
export type MessagePriority =
  | 'background'
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

/**
 * Header for extensibility
 */
export interface Header {
  readonly key: string;
  readonly value: string;
}

// ============================================================================
// SECTION 7: CANONICAL MESSAGE TYPE
// ============================================================================

/**
 * Canonical message format for the ESTA Logic messaging fabric
 */
export interface Message<T = unknown> {
  /** Unique message identifier */
  readonly id: MessageId;
  /** Hybrid Logical Clock timestamp */
  readonly timestamp: Timestamp;
  /** Message payload */
  readonly payload: T;
  /** W3C Trace Context for distributed tracing */
  readonly traceContext: TraceContext;
  /** Authentication and authorization context */
  readonly authContext: AuthContext;
  /** Message type for routing and handling */
  readonly messageType: MessageType;
  /** Correlation ID for request-response patterns */
  readonly correlationId?: MessageId;
  /** Reply-to address for responses */
  readonly replyTo?: ChannelAddress;
  /** Idempotency token for deduplication */
  readonly idempotencyToken?: IdempotencyToken;
  /** Time-to-live before message expires */
  readonly ttl?: Duration;
  /** Priority for scheduling */
  readonly priority: MessagePriority;
  /** Headers for extensibility */
  readonly headers: readonly Header[];
}

// ============================================================================
// SECTION 8: MESSAGE CONSTRUCTION HELPERS
// ============================================================================

/**
 * Create a new message with minimal required fields
 */
export function createMessage<T>(
  id: MessageId,
  timestamp: Timestamp,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext,
  messageType: MessageType
): Message<T> {
  return {
    id,
    timestamp,
    payload,
    traceContext,
    authContext,
    messageType,
    priority: 'normal',
    headers: [],
  };
}

/**
 * Create a command message
 */
export function createCommand<T>(
  id: MessageId,
  timestamp: Timestamp,
  name: string,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext
): Message<T> {
  return createMessage(id, timestamp, payload, traceContext, authContext, {
    type: 'command',
    name,
  });
}

/**
 * Create a query message
 */
export function createQuery<T>(
  id: MessageId,
  timestamp: Timestamp,
  name: string,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext
): Message<T> {
  return createMessage(id, timestamp, payload, traceContext, authContext, {
    type: 'query',
    name,
  });
}

/**
 * Create an event message
 */
export function createEvent<T>(
  id: MessageId,
  timestamp: Timestamp,
  name: string,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext
): Message<T> {
  return createMessage(id, timestamp, payload, traceContext, authContext, {
    type: 'event',
    name,
  });
}

/**
 * Create a success response
 */
export function createOkResponse<T>(
  id: MessageId,
  timestamp: Timestamp,
  payload: T,
  traceContext: TraceContext,
  authContext: AuthContext,
  correlationId: MessageId
): Message<T> {
  return {
    ...createMessage(id, timestamp, payload, traceContext, authContext, {
      type: 'response',
      status: { type: 'ok' },
    }),
    correlationId,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  id: MessageId,
  timestamp: Timestamp,
  errorCode: number,
  errorMessage: string,
  traceContext: TraceContext,
  authContext: AuthContext,
  correlationId: MessageId
): Message<null> {
  return {
    ...createMessage(id, timestamp, null, traceContext, authContext, {
      type: 'response',
      status: { type: 'error', code: errorCode, message: errorMessage },
    }),
    correlationId,
  };
}

// ============================================================================
// SECTION 9: MESSAGE HELPER FUNCTIONS
// ============================================================================

/**
 * Set correlation ID on a message
 */
export function withCorrelationId<T>(
  msg: Message<T>,
  correlationId: MessageId
): Message<T> {
  return { ...msg, correlationId };
}

/**
 * Set reply-to address on a message
 */
export function withReplyTo<T>(
  msg: Message<T>,
  replyTo: ChannelAddress
): Message<T> {
  return { ...msg, replyTo };
}

/**
 * Set idempotency token on a message
 */
export function withIdempotencyToken<T>(
  msg: Message<T>,
  token: IdempotencyToken
): Message<T> {
  return { ...msg, idempotencyToken: token };
}

/**
 * Set TTL on a message
 */
export function withTTL<T>(msg: Message<T>, ttl: Duration): Message<T> {
  return { ...msg, ttl };
}

/**
 * Set priority on a message
 */
export function withPriority<T>(
  msg: Message<T>,
  priority: MessagePriority
): Message<T> {
  return { ...msg, priority };
}

/**
 * Add a header to a message
 */
export function withHeader<T>(
  msg: Message<T>,
  key: string,
  value: string
): Message<T> {
  return { ...msg, headers: [{ key, value }, ...msg.headers] };
}

// ============================================================================
// SECTION 10: MESSAGE ID HELPERS
// ============================================================================

/**
 * Generate a message ID
 */
export function generateMessageId(timestamp: number): MessageId {
  return {
    high: timestamp,
    low: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
  };
}

/**
 * Compare two message IDs for equality
 */
export function messageIdEquals(a: MessageId, b: MessageId): boolean {
  return a.high === b.high && a.low === b.low;
}

/**
 * Convert message ID to string
 */
export function messageIdToString(id: MessageId): string {
  return `${id.high.toString(16).padStart(16, '0')}${id.low.toString(16).padStart(16, '0')}`;
}

// ============================================================================
// SECTION 11: MESSAGE BUS INTERFACE
// ============================================================================

/**
 * Message handler function type
 */
export type MessageHandler<T, R> = (message: Message<T>) => Promise<R>;

/**
 * Message bus interface for IPC
 */
export interface MessageBus {
  /**
   * Publish a message to a channel
   */
  publish<T>(channel: ChannelAddress, message: Message<T>): Promise<void>;

  /**
   * Subscribe to a channel
   */
  subscribe<T>(
    channel: ChannelAddress,
    handler: MessageHandler<T, void>
  ): Promise<{ unsubscribe: () => void }>;

  /**
   * Send a request and wait for response
   */
  request<T, R>(
    channel: ChannelAddress,
    message: Message<T>,
    timeoutMs: number
  ): Promise<Message<R>>;

  /**
   * Reply to a message
   */
  reply<T, R>(originalMessage: Message<T>, response: Message<R>): Promise<void>;
}

/**
 * Create a local (in-memory) message bus for testing
 */
export function createLocalMessageBus(): MessageBus {
  const handlers = new Map<string, Set<MessageHandler<unknown, void>>>();
  const pendingRequests = new Map<
    string,
    { resolve: (msg: Message<unknown>) => void; reject: (err: Error) => void }
  >();

  const channelKey = (addr: ChannelAddress): string =>
    `${addr.transport}:${addr.channel}${addr.partition !== undefined ? `:${addr.partition}` : ''}`;

  return {
    async publish<T>(
      channel: ChannelAddress,
      message: Message<T>
    ): Promise<void> {
      const key = channelKey(channel);
      const channelHandlers = handlers.get(key);
      if (channelHandlers) {
        for (const handler of channelHandlers) {
          await handler(message as Message<unknown>);
        }
      }
    },

    async subscribe<T>(
      channel: ChannelAddress,
      handler: MessageHandler<T, void>
    ): Promise<{ unsubscribe: () => void }> {
      const key = channelKey(channel);
      if (!handlers.has(key)) {
        handlers.set(key, new Set());
      }
      handlers.get(key)!.add(handler as MessageHandler<unknown, void>);

      return {
        unsubscribe: () => {
          handlers.get(key)?.delete(handler as MessageHandler<unknown, void>);
        },
      };
    },

    async request<T, R>(
      channel: ChannelAddress,
      message: Message<T>,
      timeoutMs: number
    ): Promise<Message<R>> {
      const requestId = messageIdToString(message.id);

      return new Promise<Message<R>>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.delete(requestId);
          reject(new Error(`Request timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        pendingRequests.set(requestId, {
          resolve: (msg) => {
            clearTimeout(timeout);
            pendingRequests.delete(requestId);
            resolve(msg as Message<R>);
          },
          reject: (err) => {
            clearTimeout(timeout);
            pendingRequests.delete(requestId);
            reject(err);
          },
        });

        this.publish(channel, message).catch(reject);
      });
    },

    async reply<T, R>(
      _originalMessage: Message<T>,
      response: Message<R>
    ): Promise<void> {
      const correlationId = response.correlationId;
      if (!correlationId) {
        throw new Error('Response message must have correlationId');
      }

      const requestId = messageIdToString(correlationId);
      const pending = pendingRequests.get(requestId);
      if (pending) {
        pending.resolve(response as Message<unknown>);
      }
    },
  };
}

// ============================================================================
// SECTION 12: TIMESTAMP HELPERS
// ============================================================================

/**
 * Create a timestamp from current time
 */
export function nowTimestamp(nodeId: number = 0): Timestamp {
  return {
    wallNanos: Date.now() * 1_000_000,
    logical: 0,
    nodeId,
  };
}

/**
 * Compare two timestamps for ordering
 */
export function compareTimestamps(a: Timestamp, b: Timestamp): -1 | 0 | 1 {
  if (a.wallNanos < b.wallNanos) return -1;
  if (a.wallNanos > b.wallNanos) return 1;
  if (a.logical < b.logical) return -1;
  if (a.logical > b.logical) return 1;
  return 0;
}

/**
 * Convert priority to number for comparison
 */
export function priorityToNumber(priority: MessagePriority): number {
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
