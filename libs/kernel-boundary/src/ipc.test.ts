import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLocalMessageBus,
  createMessage,
  createCommand,
  createQuery,
  createEvent,
  createOkResponse,
  createErrorResponse,
  withCorrelationId,
  withReplyTo,
  withPriority,
  withHeader,
  generateMessageId,
  messageIdEquals,
  messageIdToString,
  emptyTraceContext,
  anonymousAuthContext,
  nowTimestamp,
  compareTimestamps,
  priorityToNumber,
  type MessageBus,
  type Message,
  type Timestamp,
} from './ipc.js';

describe('IPC', () => {
  describe('MessageId', () => {
    it('should generate unique message IDs', () => {
      const id1 = generateMessageId(Date.now());
      const id2 = generateMessageId(Date.now());

      expect(messageIdEquals(id1, id2)).toBe(false);
    });

    it('should compare message IDs for equality', () => {
      const id1 = { high: 123, low: 456 };
      const id2 = { high: 123, low: 456 };
      const id3 = { high: 123, low: 789 };

      expect(messageIdEquals(id1, id2)).toBe(true);
      expect(messageIdEquals(id1, id3)).toBe(false);
    });

    it('should convert message ID to string', () => {
      const id = { high: 123, low: 456 };
      const str = messageIdToString(id);

      expect(str).toBeDefined();
      expect(str.length).toBe(32);
    });
  });

  describe('Timestamp', () => {
    it('should create timestamp from current time', () => {
      const ts = nowTimestamp(1);

      expect(ts.wallNanos).toBeGreaterThan(0);
      expect(ts.logical).toBe(0);
      expect(ts.nodeId).toBe(1);
    });

    it('should compare timestamps', () => {
      const ts1: Timestamp = { wallNanos: 1000, logical: 0, nodeId: 0 };
      const ts2: Timestamp = { wallNanos: 2000, logical: 0, nodeId: 0 };
      const ts3: Timestamp = { wallNanos: 1000, logical: 1, nodeId: 0 };

      expect(compareTimestamps(ts1, ts2)).toBe(-1);
      expect(compareTimestamps(ts2, ts1)).toBe(1);
      expect(compareTimestamps(ts1, ts1)).toBe(0);
      expect(compareTimestamps(ts1, ts3)).toBe(-1);
    });
  });

  describe('TraceContext', () => {
    it('should create empty trace context', () => {
      const ctx = emptyTraceContext();

      expect(ctx.version).toBe(0);
      expect(ctx.traceId.high).toBe(0);
      expect(ctx.traceId.low).toBe(0);
      expect(ctx.traceFlags.sampled).toBe(false);
    });
  });

  describe('AuthContext', () => {
    it('should create anonymous auth context', () => {
      const now = nowTimestamp();
      const tenantId = { value: 'test-tenant' };
      const ctx = anonymousAuthContext(now, tenantId);

      expect(ctx.principal.type).toBe('anonymous');
      expect(ctx.authMethod).toBe('none');
      expect(ctx.tenantId.value).toBe('test-tenant');
      expect(ctx.capabilities).toEqual([]);
    });
  });

  describe('Message Construction', () => {
    const now = nowTimestamp();
    const traceContext = emptyTraceContext();
    const authContext = anonymousAuthContext(now, { value: 'test' });

    it('should create a basic message', () => {
      const id = generateMessageId(Date.now());
      const msg = createMessage(
        id,
        now,
        { data: 'test' },
        traceContext,
        authContext,
        { type: 'command', name: 'test' }
      );

      expect(msg.id).toBe(id);
      expect(msg.payload).toEqual({ data: 'test' });
      expect(msg.priority).toBe('normal');
      expect(msg.headers).toEqual([]);
    });

    it('should create a command message', () => {
      const id = generateMessageId(Date.now());
      const msg = createCommand(
        id,
        now,
        'doSomething',
        { arg: 1 },
        traceContext,
        authContext
      );

      expect(msg.messageType.type).toBe('command');
      if (msg.messageType.type === 'command') {
        expect(msg.messageType.name).toBe('doSomething');
      }
    });

    it('should create a query message', () => {
      const id = generateMessageId(Date.now());
      const msg = createQuery(
        id,
        now,
        'getData',
        { id: '123' },
        traceContext,
        authContext
      );

      expect(msg.messageType.type).toBe('query');
      if (msg.messageType.type === 'query') {
        expect(msg.messageType.name).toBe('getData');
      }
    });

    it('should create an event message', () => {
      const id = generateMessageId(Date.now());
      const msg = createEvent(
        id,
        now,
        'dataCreated',
        { id: '123' },
        traceContext,
        authContext
      );

      expect(msg.messageType.type).toBe('event');
      if (msg.messageType.type === 'event') {
        expect(msg.messageType.name).toBe('dataCreated');
      }
    });

    it('should create an OK response', () => {
      const id = generateMessageId(Date.now());
      const correlationId = generateMessageId(Date.now());
      const msg = createOkResponse(
        id,
        now,
        { result: 'success' },
        traceContext,
        authContext,
        correlationId
      );

      expect(msg.messageType.type).toBe('response');
      if (msg.messageType.type === 'response') {
        expect(msg.messageType.status.type).toBe('ok');
      }
      expect(msg.correlationId).toBe(correlationId);
    });

    it('should create an error response', () => {
      const id = generateMessageId(Date.now());
      const correlationId = generateMessageId(Date.now());
      const msg = createErrorResponse(
        id,
        now,
        404,
        'Not found',
        traceContext,
        authContext,
        correlationId
      );

      expect(msg.messageType.type).toBe('response');
      if (
        msg.messageType.type === 'response' &&
        msg.messageType.status.type === 'error'
      ) {
        expect(msg.messageType.status.code).toBe(404);
        expect(msg.messageType.status.message).toBe('Not found');
      }
    });
  });

  describe('Message Modifiers', () => {
    const now = nowTimestamp();
    const traceContext = emptyTraceContext();
    const authContext = anonymousAuthContext(now, { value: 'test' });

    it('should add correlation ID', () => {
      const id = generateMessageId(Date.now());
      const correlationId = generateMessageId(Date.now());
      const msg = createCommand(id, now, 'test', {}, traceContext, authContext);
      const modified = withCorrelationId(msg, correlationId);

      expect(modified.correlationId).toBe(correlationId);
      expect(msg.correlationId).toBeUndefined(); // Original unchanged
    });

    it('should add reply-to address', () => {
      const id = generateMessageId(Date.now());
      const msg = createCommand(id, now, 'test', {}, traceContext, authContext);
      const modified = withReplyTo(msg, {
        transport: 'local',
        channel: 'responses',
      });

      expect(modified.replyTo?.transport).toBe('local');
      expect(modified.replyTo?.channel).toBe('responses');
    });

    it('should set priority', () => {
      const id = generateMessageId(Date.now());
      const msg = createCommand(id, now, 'test', {}, traceContext, authContext);
      const modified = withPriority(msg, 'high');

      expect(modified.priority).toBe('high');
      expect(msg.priority).toBe('normal'); // Original unchanged
    });

    it('should add headers', () => {
      const id = generateMessageId(Date.now());
      const msg = createCommand(id, now, 'test', {}, traceContext, authContext);
      const modified = withHeader(msg, 'X-Custom', 'value');

      expect(modified.headers).toHaveLength(1);
      expect(modified.headers[0]).toEqual({ key: 'X-Custom', value: 'value' });
    });
  });

  describe('Priority', () => {
    it('should convert priority to number', () => {
      expect(priorityToNumber('background')).toBe(0);
      expect(priorityToNumber('low')).toBe(1);
      expect(priorityToNumber('normal')).toBe(2);
      expect(priorityToNumber('high')).toBe(3);
      expect(priorityToNumber('critical')).toBe(4);
    });
  });

  describe('LocalMessageBus', () => {
    let bus: MessageBus;

    beforeEach(() => {
      bus = createLocalMessageBus();
    });

    it('should publish and subscribe to messages', async () => {
      const channel = { transport: 'local' as const, channel: 'test' };
      const received: Message<{ data: string }>[] = [];

      await bus.subscribe<{ data: string }>(channel, async (msg) => {
        received.push(msg);
      });

      const now = nowTimestamp();
      const traceContext = emptyTraceContext();
      const authContext = anonymousAuthContext(now, { value: 'test' });
      const id = generateMessageId(Date.now());
      const msg = createEvent(
        id,
        now,
        'test',
        { data: 'hello' },
        traceContext,
        authContext
      );

      await bus.publish(channel, msg);

      expect(received).toHaveLength(1);
      expect(received[0]?.payload.data).toBe('hello');
    });

    it('should unsubscribe from messages', async () => {
      const channel = { transport: 'local' as const, channel: 'test' };
      const received: Message<unknown>[] = [];

      const { unsubscribe } = await bus.subscribe(channel, async (msg) => {
        received.push(msg);
      });

      const now = nowTimestamp();
      const traceContext = emptyTraceContext();
      const authContext = anonymousAuthContext(now, { value: 'test' });
      const id1 = generateMessageId(Date.now());
      const msg1 = createEvent(
        id1,
        now,
        'test',
        { n: 1 },
        traceContext,
        authContext
      );

      await bus.publish(channel, msg1);
      expect(received).toHaveLength(1);

      unsubscribe();

      const id2 = generateMessageId(Date.now());
      const msg2 = createEvent(
        id2,
        now,
        'test',
        { n: 2 },
        traceContext,
        authContext
      );
      await bus.publish(channel, msg2);

      expect(received).toHaveLength(1); // Still 1, not 2
    });
  });
});
