import { JsonStore, parseBoolean } from "./store.js";
import type { ProactiveCandidate } from "./types.js";

export interface ProactiveNotifier {
  deliver(candidate: ProactiveCandidate): Promise<void>;
}

export class NoopNotifier implements ProactiveNotifier {
  async deliver(candidate: ProactiveCandidate): Promise<void> {
    throw new Error(`No notifier configured for proactive candidate ${candidate.id}`);
  }
}

export class WebhookNotifier implements ProactiveNotifier {
  constructor(
    private readonly url: string,
    private readonly token?: string,
  ) {}

  async deliver(candidate: ProactiveCandidate): Promise<void> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "our_home.proactive_message",
        id: candidate.id,
        title: candidate.title,
        message: candidate.message,
        reason: candidate.reason,
        createdAt: candidate.createdAt,
        dueAt: candidate.dueAt,
        source: candidate.source,
      }),
    });
    if (!response.ok) throw new Error(`Notifier returned HTTP ${response.status}`);
  }
}

export async function runProactiveCycle(
  store: JsonStore,
  notifier: ProactiveNotifier,
  asOf = new Date(),
): Promise<{ heartbeatId: string; dueCount: number; deliveredCount: number; failedCount: number }> {
  const heartbeat = await store.recordHeartbeat("独立 Life Loop 心跳：检查主动消息队列。");
  const due = store.listDueProactiveMessages(asOf.toISOString());
  let deliveredCount = 0;
  let failedCount = 0;

  for (const candidate of due) {
    try {
      await notifier.deliver(candidate);
      await store.recordProactiveAttempt(candidate.id);
      await store.resolveProactiveMessage(candidate.id, "delivered");
      deliveredCount += 1;
    } catch (error) {
      failedCount += 1;
      const message = error instanceof Error ? error.message : "Unknown notifier error";
      await store.recordProactiveAttempt(candidate.id, message);
      process.stderr.write(`[our-home] proactive delivery failed: ${candidate.id}: ${message}\n`);
    }
  }

  return { heartbeatId: heartbeat.id, dueCount: due.length, deliveredCount, failedCount };
}

const dataFile = process.env.OUR_HOME_DATA_FILE ?? "./data/our-home.json";
const seed = parseBoolean(process.env.OUR_HOME_SEED, true);
const intervalMs = Number(process.env.OUR_HOME_WORKER_INTERVAL_MS ?? "60000");
const webhookUrl = process.env.OUR_HOME_NOTIFY_WEBHOOK_URL;
const webhookToken = process.env.OUR_HOME_NOTIFY_WEBHOOK_TOKEN;

if (process.env.OUR_HOME_RUN_WORKER === "true") {
  if (!Number.isInteger(intervalMs) || intervalMs < 5_000) {
    throw new Error("OUR_HOME_WORKER_INTERVAL_MS must be an integer of at least 5000ms");
  }

  const store = await JsonStore.open(dataFile, seed);
  const notifier: ProactiveNotifier = webhookUrl
    ? new WebhookNotifier(webhookUrl, webhookToken)
    : new NoopNotifier();

  const cycle = async () => {
    const result = await runProactiveCycle(store, notifier);
    process.stderr.write(
      `[our-home] heartbeat=${result.heartbeatId} due=${result.dueCount} delivered=${result.deliveredCount} failed=${result.failedCount}\n`,
    );
  };

  await cycle();
  setInterval(() => void cycle().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    process.stderr.write(`[our-home] worker cycle failed: ${message}\n`);
  }), intervalMs);
}
