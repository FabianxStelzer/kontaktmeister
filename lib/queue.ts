import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Einzelne Redis-Verbindungen mit BullMQ-empfohlenen Optionen
export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  video: "km:video",
  videoPoll: "km:video-poll",
  mail: "km:mail",
  pdf: "km:pdf",
} as const;

// Queues (Producer) - wir cachen sie global, damit sie beim Hot-Reload nicht doppelt entstehen
type Queues = {
  video: Queue;
  videoPoll: Queue;
  mail: Queue;
  pdf: Queue;
};

const g = globalThis as unknown as { __km_queues?: Queues };

export function getQueues(): Queues {
  if (g.__km_queues) return g.__km_queues;
  const opts = { connection: redisConnection };
  g.__km_queues = {
    video: new Queue(QUEUE_NAMES.video, opts),
    videoPoll: new Queue(QUEUE_NAMES.videoPoll, opts),
    mail: new Queue(QUEUE_NAMES.mail, opts),
    pdf: new Queue(QUEUE_NAMES.pdf, opts),
  };
  return g.__km_queues;
}

export function queueEvents(name: keyof typeof QUEUE_NAMES) {
  return new QueueEvents(QUEUE_NAMES[name], { connection: redisConnection });
}

// Job-Definitionen
export type VideoJob = {
  campaignContactId: string;
};

export type VideoPollJob = {
  campaignContactId: string;
};

export type MailJob = {
  campaignContactId: string;
};

export type PdfJob = {
  campaignContactId: string;
};
