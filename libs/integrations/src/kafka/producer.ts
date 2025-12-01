/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Kafka, Producer, Message, ProducerRecord } from 'kafkajs';

/**
 * ESTA Kafka Producer
 *
 * Handles message production for ESTA event streaming.
 * Used for publishing accrual calculations, compliance events, and sync notifications.
 */

export interface ESTAProducerConfig {
  clientId: string;
  brokers: string[];
  topic: string;
}

export interface ESTAMessage {
  key: string;
  value: string;
  timestamp?: string;
}

export class ESTAKafkaProducer {
  private producer: Producer | null = null;
  private connected = false;

  constructor(
    private kafka: Kafka,
    private config: ESTAProducerConfig
  ) {}

  async connect(): Promise<void> {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.connected = false;
      this.producer = null;
    }
  }

  async send(messages: ESTAMessage[]): Promise<void> {
    if (!this.producer || !this.connected) {
      throw new Error('Producer not connected');
    }

    const kafkaMessages: Message[] = messages.map((msg) => ({
      key: msg.key,
      value: msg.value,
      timestamp: msg.timestamp,
    }));

    const record: ProducerRecord = {
      topic: this.config.topic,
      messages: kafkaMessages,
    };

    await this.producer.send(record);
  }

  async produce(key: string, value: string): Promise<void> {
    await this.send([{ key, value }]);
  }

  isConnected(): boolean {
    return this.connected;
  }
}
