// BullMQ-Worker fuer Video- und Mail-Jobs.
// Start lokal: npm run worker
// Produktion: als eigener Container/Prozess (siehe deploy/docker-compose.yml)

import { Worker } from "bullmq";
import { redisConnection, QUEUE_NAMES } from "../lib/queue";
import { processVideoJob } from "./video";
import { processVideoPollJob } from "./video-poll";
import { processMailJob } from "./mail";
import { processPdfJob } from "./pdf";

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 5);

console.log(`[worker] starte mit concurrency=${concurrency}`);

const videoWorker = new Worker(
  QUEUE_NAMES.video,
  async (job) => processVideoJob(job.data as { campaignContactId: string }),
  { connection: redisConnection, concurrency },
);

const videoPollWorker = new Worker(
  QUEUE_NAMES.videoPoll,
  async (job) => processVideoPollJob(job.data as { campaignContactId: string }),
  { connection: redisConnection, concurrency },
);

const mailWorker = new Worker(
  QUEUE_NAMES.mail,
  async (job) => processMailJob(job.data as { campaignContactId: string }),
  { connection: redisConnection, concurrency: 2 },
);

const pdfWorker = new Worker(
  QUEUE_NAMES.pdf,
  async (job) => processPdfJob(job.data as { campaignContactId: string }),
  { connection: redisConnection, concurrency: 2 },
);

const workers = [videoWorker, videoPollWorker, mailWorker, pdfWorker];

for (const w of workers) {
  w.on("failed", (job, err) => {
    console.error(`[worker:${w.name}] Job ${job?.id} fehlgeschlagen:`, err.message);
  });
  w.on("completed", (job) => {
    console.log(`[worker:${w.name}] Job ${job.id} fertig`);
  });
}

async function shutdown() {
  console.log("[worker] shutdown...");
  await Promise.all(workers.map((w) => w.close()));
  await redisConnection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[worker] bereit.");
