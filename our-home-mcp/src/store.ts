import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type {
  ActionItem,
  ActionStatus,
  Actor,
  HeartbeatRecord,
  LifeObservation,
  ObservationConfidence,
  ObservationKind,
  ObservationSource,
  DiaryEntry,
  DiaryVisibility,
  OurHomeData,
  ProactiveCandidate,
  ProactiveCandidateStatus,
  ProactiveMessage,
  RelationshipEvent,
  RoutineWindow,
} from "./types.js";

const now = () => new Date().toISOString();

function appendActivity(
  data: OurHomeData,
  input: {
    kind: string;
    title: string;
    summary?: string;
    source: "AGENT_LIFE" | "RELATIONSHIP" | "HOME_STATE";
  },
): void {
  data.activities.unshift({
    id: randomUUID(),
    ...input,
    occurredAt: now(),
  });
}

function emptyData(): OurHomeData {
  const timestamp = now();
  return {
    schemaVersion: 2,
    diaries: [],
    relationshipEvents: [],
    actions: [],
    activities: [],
    proactiveMessages: [],
    homeState: {
      presence: "unknown",
      updatedAt: timestamp,
      source: "HOME_STATE",
    },
    observations: [],
    routines: [],
    heartbeats: [],
    proactiveQueue: [],
  };
}

function seedData(): OurHomeData {
  const timestamp = now();
  return {
    schemaVersion: 2,
    diaries: [
      {
        id: "diary_seed_welcome",
        title: "第一份记录",
        body: "这是 Our Home 的本地示例数据。它不是 Hermes 的真实活动，也不是关系事实。",
        author: "agent",
        visibility: "shared",
        source: "AGENT_LIFE",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    relationshipEvents: [],
    actions: [
      {
        id: "action_seed_review",
        title: "确认 Our Home 的第一版边界",
        description: "确认哪些数据属于 Hermes，哪些数据属于 Our Home。",
        status: "in_progress",
        createdAt: timestamp,
        updatedAt: timestamp,
        source: "AGENT_LIFE",
      },
    ],
    activities: [
      {
        id: "activity_seed_started",
        kind: "system",
        title: "Our Home MCP 已初始化",
        summary: "当前使用本地 Mock 数据层。",
        occurredAt: timestamp,
        source: "HOME_STATE",
      },
    ],
    proactiveMessages: [],
    homeState: {
      presence: "waiting",
      note: "等待 Hermes 接入。",
      updatedAt: timestamp,
      source: "HOME_STATE",
    },
    observations: [],
    routines: [],
    heartbeats: [],
    proactiveQueue: [],
  };
}

function migrateData(value: unknown): OurHomeData {
  if (!value || typeof value !== "object") {
    throw new Error("Our Home data file must contain a JSON object");
  }
  const candidate = value as {
    schemaVersion?: unknown;
    diaries?: OurHomeData["diaries"];
    relationshipEvents?: OurHomeData["relationshipEvents"];
    actions?: OurHomeData["actions"];
    activities?: OurHomeData["activities"];
    proactiveMessages?: OurHomeData["proactiveMessages"];
    homeState?: OurHomeData["homeState"];
    observations?: OurHomeData["observations"];
    routines?: OurHomeData["routines"];
    heartbeats?: OurHomeData["heartbeats"];
    proactiveQueue?: OurHomeData["proactiveQueue"];
  };
  const hasBaseShape =
    Array.isArray(candidate.diaries) &&
    Array.isArray(candidate.relationshipEvents) &&
    Array.isArray(candidate.actions) &&
    Array.isArray(candidate.activities) &&
    Array.isArray(candidate.proactiveMessages) &&
    Boolean(candidate.homeState);
  if (!hasBaseShape) {
    throw new Error("Unsupported or corrupt Our Home data file");
  }
  if (candidate.schemaVersion === 1) {
    return {
      ...(candidate as Omit<OurHomeData, "schemaVersion" | "observations" | "routines" | "heartbeats" | "proactiveQueue">),
      schemaVersion: 2,
      observations: [],
      routines: [],
      heartbeats: [],
      proactiveQueue: [],
    };
  }
  if (
    candidate.schemaVersion !== 2 ||
    !Array.isArray(candidate.observations) ||
    !Array.isArray(candidate.routines) ||
    !Array.isArray(candidate.heartbeats) ||
    !Array.isArray(candidate.proactiveQueue)
  ) {
    throw new Error("Unsupported or corrupt Our Home data file");
  }
  return candidate as OurHomeData;
}

export class JsonStore {
  private data: OurHomeData;
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor(private readonly filePath: string, data: OurHomeData) {
    this.data = data;
  }

  static async open(filePath: string, seed = true): Promise<JsonStore> {
    const resolvedPath = resolve(filePath);
    try {
      const raw = await readFile(resolvedPath, "utf8");
      return new JsonStore(resolvedPath, migrateData(JSON.parse(raw)));
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const store = new JsonStore(resolvedPath, seed ? seedData() : emptyData());
      await store.persist();
      return store;
    }
  }

  snapshot(): OurHomeData {
    return structuredClone(this.data);
  }

  async update(mutator: (data: OurHomeData) => void): Promise<OurHomeData> {
    mutator(this.data);
    await this.persist();
    return this.snapshot();
  }

  async addDiary(input: {
    title: string;
    body: string;
    author: Actor;
    visibility: DiaryVisibility;
  }): Promise<DiaryEntry> {
    const timestamp = now();
    const entry: DiaryEntry = {
      id: randomUUID(),
      ...input,
      source: input.author === "agent" ? "AGENT_LIFE" : "RELATIONSHIP",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.update((data) => {
      data.diaries.unshift(entry);
      appendActivity(data, {
        kind: "diary_written",
        title: "写入一篇日记",
        summary: entry.title,
        source: entry.source,
      });
    });
    return entry;
  }

  async addMessage(message: string): Promise<ProactiveMessage> {
    const entry: ProactiveMessage = {
      id: randomUUID(),
      message,
      createdAt: now(),
      source: "AGENT_LIFE",
    };
    await this.update((data) => {
      data.proactiveMessages.unshift(entry);
      appendActivity(data, {
        kind: "proactive_message_left",
        title: "留下主动留言",
        summary: "一条新的 AGENT_LIFE 留言已进入 Our Home。",
        source: "AGENT_LIFE",
      });
    });
    return entry;
  }

  async recordObservation(input: {
    kind: ObservationKind;
    label: string;
    value?: string;
    observedAt: string;
    source: ObservationSource;
    confidence: ObservationConfidence;
    expiresAt?: string;
  }): Promise<LifeObservation> {
    const observation: LifeObservation = { id: randomUUID(), ...input };
    await this.update((data) => {
      data.observations.unshift(observation);
      appendActivity(data, {
        kind: "observation_recorded",
        title: "记录一条生活观察",
        summary: observation.label,
        source: "HOME_STATE",
      });
    });
    return observation;
  }

  async addRoutine(input: {
    label: string;
    weekdays: number[];
    startLocal: string;
    endLocal: string;
    timezone: string;
    note?: string;
  }): Promise<RoutineWindow> {
    const timestamp = now();
    const routine: RoutineWindow = {
      id: randomUUID(),
      ...input,
      enabled: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.update((data) => {
      data.routines.unshift(routine);
      appendActivity(data, {
        kind: "routine_created",
        title: "建立一段生活时间表",
        summary: routine.label,
        source: "HOME_STATE",
      });
    });
    return routine;
  }

  async recordHeartbeat(summary: string): Promise<HeartbeatRecord> {
    const heartbeat: HeartbeatRecord = {
      id: randomUUID(),
      occurredAt: now(),
      summary,
      source: "system",
    };
    await this.update((data) => {
      data.heartbeats.unshift(heartbeat);
      data.heartbeats = data.heartbeats.slice(0, 200);
    });
    return heartbeat;
  }

  async scheduleProactiveMessage(input: {
    title: string;
    message: string;
    reason: string;
    dueAt: string;
  }): Promise<ProactiveCandidate> {
    const candidate: ProactiveCandidate = {
      id: randomUUID(),
      ...input,
      status: "pending",
      createdAt: now(),
      attempts: 0,
      source: "AGENT_LIFE",
    };
    await this.update((data) => {
      data.proactiveQueue.unshift(candidate);
      appendActivity(data, {
        kind: "proactive_candidate_scheduled",
        title: "安排一条主动消息",
        summary: candidate.title,
        source: "AGENT_LIFE",
      });
    });
    return candidate;
  }

  listDueProactiveMessages(asOf = new Date().toISOString()): ProactiveCandidate[] {
    return this.snapshot().proactiveQueue
      .filter((item) => item.status === "pending" && item.dueAt <= asOf)
      .sort((left, right) => left.dueAt.localeCompare(right.dueAt));
  }

  async recordProactiveAttempt(id: string, error?: string): Promise<ProactiveCandidate> {
    let result: ProactiveCandidate | undefined;
    await this.update((data) => {
      result = data.proactiveQueue.find((item) => item.id === id);
      if (!result) throw new Error(`Proactive candidate not found: ${id}`);
      result.attempts += 1;
      result.lastAttemptAt = now();
      result.lastError = error;
    });
    if (!result) throw new Error(`Proactive candidate not found: ${id}`);
    return result;
  }

  async resolveProactiveMessage(id: string, status: Exclude<ProactiveCandidateStatus, "pending">): Promise<ProactiveCandidate> {
    let result: ProactiveCandidate | undefined;
    await this.update((data) => {
      result = data.proactiveQueue.find((item) => item.id === id);
      if (!result) throw new Error(`Proactive candidate not found: ${id}`);
      result.status = status;
      if (status === "delivered") result.deliveredAt = now();
      if (status === "dismissed") result.dismissedAt = now();
    });
    if (!result) throw new Error(`Proactive candidate not found: ${id}`);
    return result;
  }

  async addAction(input: {
    title: string;
    description?: string;
    dueAt?: string;
  }): Promise<ActionItem> {
    const action: ActionItem = {
      id: randomUUID(),
      ...input,
      status: "todo",
      createdAt: now(),
      updatedAt: now(),
      source: "AGENT_LIFE",
    };
    await this.update((data) => {
      data.actions.unshift(action);
      appendActivity(data, {
        kind: "action_created",
        title: "创建一项行动",
        summary: action.title,
        source: "AGENT_LIFE",
      });
    });
    return action;
  }

  async setActionStatus(id: string, status: ActionStatus): Promise<ActionItem> {
    let result: ActionItem | undefined;
    await this.update((data) => {
      result = data.actions.find((item) => item.id === id);
      if (!result) throw new Error(`Action not found: ${id}`);
      result.status = status;
      result.updatedAt = now();
      appendActivity(data, {
        kind: "action_updated",
        title: "更新行动状态",
        summary: `${result.title} → ${status}`,
        source: "AGENT_LIFE",
      });
    });
    if (!result) throw new Error(`Action not found: ${id}`);
    return result;
  }

  async proposeRelationshipEvent(input: {
    title: string;
    description?: string;
    occurredAt: string;
    proposedBy: Actor;
    importance: "ordinary" | "major";
  }): Promise<RelationshipEvent> {
    const timestamp = now();
    const event: RelationshipEvent = {
      id: randomUUID(),
      ...input,
      approvalStatus: "proposed",
      approvedBy: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.update((data) => {
      data.relationshipEvents.unshift(event);
      appendActivity(data, {
        kind: "relationship_event_proposed",
        title: "提出一项关系事件提案",
        summary: event.title,
        source: "RELATIONSHIP",
      });
    });
    return event;
  }

  async approveRelationshipEvent(id: string, approvedBy: Actor): Promise<RelationshipEvent> {
    let result: RelationshipEvent | undefined;
    await this.update((data) => {
      result = data.relationshipEvents.find((item) => item.id === id);
      if (!result) throw new Error(`Relationship event not found: ${id}`);
      if (result.approvalStatus === "rejected") {
        throw new Error("A rejected relationship event cannot be approved");
      }
      if (!result.approvedBy.includes(approvedBy)) result.approvedBy.push(approvedBy);
      const fullyApproved =
        result.importance === "ordinary" ||
        (result.approvedBy.includes("user") && result.approvedBy.includes("agent"));
      result.approvalStatus = fullyApproved ? "approved" : "proposed";
      result.updatedAt = now();
      appendActivity(data, {
        kind: "relationship_event_approval",
        title: fullyApproved ? "关系事件已批准" : "记录关系事件批准",
        summary: result.title,
        source: "RELATIONSHIP",
      });
    });
    if (!result) throw new Error(`Relationship event not found: ${id}`);
    return result;
  }

  async markMessageRead(id: string): Promise<ProactiveMessage> {
    let result: ProactiveMessage | undefined;
    await this.update((data) => {
      result = data.proactiveMessages.find((item) => item.id === id);
      if (!result) throw new Error(`Proactive message not found: ${id}`);
      result.readAt ??= now();
    });
    if (!result) throw new Error(`Proactive message not found: ${id}`);
    return result;
  }

  private async persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const temporaryPath = `${this.filePath}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(this.data, null, 2)}\n`, "utf8");
      await rename(temporaryPath, this.filePath);
    });
    return this.writeQueue;
  }
}

export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() !== "false";
}
