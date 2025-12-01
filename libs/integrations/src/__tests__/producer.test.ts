/**
 * Tests for ESTA Kafka Producer
 *
 * Vitest mocks for KafkaJS produce/send operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Kafka, Producer } from 'kafkajs';
import { ESTAKafkaProducer, type ESTAProducerConfig } from '../kafka/producer';

// Mock KafkaJS types
const mockSend = vi.fn().mockResolvedValue([
  {
    topicName: 'esta-events',
    partition: 0,
    errorCode: 0,
  },
]);

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);

const mockProducer: Partial<Producer> = {
  connect: mockConnect,
  disconnect: mockDisconnect,
  send: mockSend,
};

const mockKafka: Partial<Kafka> = {
  producer: vi.fn().mockReturnValue(mockProducer),
};

const testConfig: ESTAProducerConfig = {
  clientId: 'esta-tracker',
  brokers: ['localhost:9092'],
  topic: 'esta-events',
};

describe('ESTAKafkaProducer', () => {
  let producer: ESTAKafkaProducer;

  beforeEach(() => {
    vi.clearAllMocks();
    producer = new ESTAKafkaProducer(mockKafka as Kafka, testConfig);
  });

  afterEach(async () => {
    if (producer.isConnected()) {
      await producer.disconnect();
    }
  });

  describe('connection', () => {
    it('should connect to Kafka broker', async () => {
      await producer.connect();

      expect(mockKafka.producer).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalled();
      expect(producer.isConnected()).toBe(true);
    });

    it('should disconnect from Kafka broker', async () => {
      await producer.connect();
      await producer.disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(producer.isConnected()).toBe(false);
    });

    it('should handle disconnect when not connected', async () => {
      await producer.disconnect();

      expect(mockDisconnect).not.toHaveBeenCalled();
      expect(producer.isConnected()).toBe(false);
    });
  });

  describe('send', () => {
    it('should send messages to Kafka topic', async () => {
      await producer.connect();

      const messages = [
        { key: 'accrual-calc-1', value: JSON.stringify({ hours: 160 }) },
        { key: 'accrual-calc-2', value: JSON.stringify({ hours: 200 }) },
      ];

      await producer.send(messages);

      expect(mockSend).toHaveBeenCalledWith({
        topic: 'esta-events',
        messages: [
          {
            key: 'accrual-calc-1',
            value: JSON.stringify({ hours: 160 }),
            timestamp: undefined,
          },
          {
            key: 'accrual-calc-2',
            value: JSON.stringify({ hours: 200 }),
            timestamp: undefined,
          },
        ],
      });
    });

    it('should send messages with timestamps', async () => {
      await producer.connect();

      const timestamp = Date.now().toString();
      const messages = [{ key: 'event-1', value: 'test', timestamp }];

      await producer.send(messages);

      expect(mockSend).toHaveBeenCalledWith({
        topic: 'esta-events',
        messages: [{ key: 'event-1', value: 'test', timestamp }],
      });
    });

    it('should throw error when not connected', async () => {
      const messages = [{ key: 'test', value: 'test' }];

      await expect(producer.send(messages)).rejects.toThrow(
        'Producer not connected'
      );
    });
  });

  describe('produce', () => {
    it('should produce a single message', async () => {
      await producer.connect();

      await producer.produce(
        'compliance-event',
        JSON.stringify({ type: 'audit' })
      );

      expect(mockSend).toHaveBeenCalledWith({
        topic: 'esta-events',
        messages: [
          {
            key: 'compliance-event',
            value: JSON.stringify({ type: 'audit' }),
            timestamp: undefined,
          },
        ],
      });
    });

    it('should throw error when not connected', async () => {
      await expect(producer.produce('key', 'value')).rejects.toThrow(
        'Producer not connected'
      );
    });
  });
});
