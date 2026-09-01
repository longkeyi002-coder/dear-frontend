import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JsonStore } from "./store.js";
import type { ActionStatus, Actor, DiaryVisibility } from "./types.js";

const actorSchema = z.enum(["user", "agent"]);
const dateSchema = z.string().datetime({ offset: true });

function text(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function structured<T extends Record<string, unknown>>(value: T) {
  return {
    structuredContent: value,
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  };
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown Our Home error";
  return { isError: true, ...text(message) };
}

export function createOurHomeServer(store: JsonStore): McpServer {
  const server = new McpServer(
    { name: "our-home", version: "0.1.0" },
    {
      instructions:
        "Our Home is Hermes's structured life layer. Do not present local-mock data as REALITY. Keep AGENT_LIFE, RELATIONSHIP, HOME_STATE, and REALITY sources distinct. Major relationship events require approval from both user and agent before becoming approved.",
    },
  );

  server.registerTool(
    "home.get_today",
    {
      title: "Get today's home state",
      description: "Read the current Our Home snapshot, recent activity, messages, and pending relationship proposals.",
      inputSchema: {},
      outputSchema: z.object({
        date: z.string(),
        dataSource: z.literal("local-mock"),
        homeState: z.record(z.string(), z.unknown()),
        recentActivity: z.array(z.record(z.string(), z.unknown())),
        unreadMessages: z.array(z.record(z.string(), z.unknown())),
        pendingRelationshipEvents: z.array(z.record(z.string(), z.unknown())),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      try {
        const data = store.snapshot();
        return structured({
          date: new Date().toISOString().slice(0, 10),
          dataSource: "local-mock" as const,
          homeState: data.homeState,
          recentActivity: data.activities.slice(0, 10),
          unreadMessages: data.proactiveMessages.filter((item) => !item.readAt).slice(0, 10),
          pendingRelationshipEvents: data.relationshipEvents
            .filter((item) => item.approvalStatus === "proposed")
            .slice(0, 10),
        });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.get_status",
    {
      title: "Get Our Home data status",
      description: "Report which Our Home domains are available and whether they are mock, real, or unavailable.",
      inputSchema: {},
      outputSchema: z.object({ domains: z.array(z.record(z.string(), z.unknown())) }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const fetchedAt = new Date().toISOString();
      return structured({
        domains: [
          "home_state",
          "diaries",
          "relationship_events",
          "actions",
          "agent_activity",
          "proactive_messages",
        ].map((domain) => ({
          domain,
          source: "local-mock",
          capability: "placeholder",
          fetchedAt,
          note: "真实 Hermes / Home Backend 尚未接入。",
        })),
      });
    },
  );

  server.registerTool(
    "home.get_life_context",
    {
      title: "Get life-loop context",
      description: "Read recent observations, enabled routine windows, heartbeats, and pending proactive candidates. Do not infer facts that are not present in these records.",
      inputSchema: {},
      outputSchema: z.object({
        observedAt: z.string(),
        dataSource: z.literal("local-mock"),
        observations: z.array(z.record(z.string(), z.unknown())),
        routines: z.array(z.record(z.string(), z.unknown())),
        recentHeartbeats: z.array(z.record(z.string(), z.unknown())),
        pendingProactiveMessages: z.array(z.record(z.string(), z.unknown())),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const data = store.snapshot();
      const timestamp = new Date().toISOString();
      const activeObservations = data.observations.filter(
        (item) => !item.expiresAt || item.expiresAt >= timestamp,
      );
      return structured({
        observedAt: timestamp,
        dataSource: "local-mock" as const,
        observations: activeObservations.slice(0, 50),
        routines: data.routines.filter((item) => item.enabled),
        recentHeartbeats: data.heartbeats.slice(0, 10),
        pendingProactiveMessages: data.proactiveQueue
          .filter((item) => item.status === "pending")
          .slice(0, 20),
      });
    },
  );

  server.registerTool(
    "home.record_observation",
    {
      title: "Record a life observation",
      description: "Store an explicitly supplied observation from the user, phone, screen, calendar, or another adapter. This tool does not claim the observation is independently verified.",
      inputSchema: {
        kind: z.enum(["manual_status", "device_presence", "screen_app", "calendar", "weather", "note"]),
        label: z.string().trim().min(1).max(200),
        value: z.string().trim().max(2_000).optional(),
        observedAt: dateSchema,
        source: z.enum(["user", "phone", "screen", "calendar", "system", "mock"]),
        confidence: z.enum(["observed", "declared", "inferred"]),
        expiresAt: dateSchema.optional(),
      },
      outputSchema: z.object({ observation: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ kind, label, value, observedAt, source, confidence, expiresAt }) => {
      try {
        const observation = await store.recordObservation({ kind, label, value, observedAt, source, confidence, expiresAt });
        return structured({ observation, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.list_observations",
    {
      title: "List life observations",
      description: "List explicitly recorded life observations. Expired observations are excluded by default.",
      inputSchema: {
        kind: z.enum(["manual_status", "device_presence", "screen_app", "calendar", "weather", "note"]).optional(),
        source: z.enum(["user", "phone", "screen", "calendar", "system", "mock"]).optional(),
        includeExpired: z.boolean().default(false),
        limit: z.number().int().min(1).max(200).default(50),
      },
      outputSchema: z.object({ observations: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ kind, source, includeExpired, limit }) => {
      const timestamp = new Date().toISOString();
      const observations = store
        .snapshot()
        .observations
        .filter((item) => !kind || item.kind === kind)
        .filter((item) => !source || item.source === source)
        .filter((item) => includeExpired || !item.expiresAt || item.expiresAt >= timestamp)
        .slice(0, limit);
      return structured({ observations, dataSource: "local-mock" as const });
    },
  );

  const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected local time in HH:MM format");
  server.registerTool(
    "home.add_routine",
    {
      title: "Add a routine window",
      description: "Store a user-declared routine window for context. This creates no Hermes cron job and sends no message by itself.",
      inputSchema: {
        label: z.string().trim().min(1).max(200),
        weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
        startLocal: localTimeSchema,
        endLocal: localTimeSchema,
        timezone: z.string().trim().min(1).max(100),
        note: z.string().trim().max(2_000).optional(),
      },
      outputSchema: z.object({ routine: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ label, weekdays, startLocal, endLocal, timezone, note }) => {
      try {
        const routine = await store.addRoutine({ label, weekdays: [...new Set(weekdays)].sort(), startLocal, endLocal, timezone, note });
        return structured({ routine, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.list_routines",
    {
      title: "List routine windows",
      description: "List user-declared routine windows used as context by the independent life loop.",
      inputSchema: { includeDisabled: z.boolean().default(false) },
      outputSchema: z.object({ routines: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ includeDisabled }) => {
      const routines = store.snapshot().routines.filter((item) => includeDisabled || item.enabled);
      return structured({ routines, dataSource: "local-mock" as const });
    },
  );

  server.registerTool(
    "home.schedule_proactive_message",
    {
      title: "Schedule a proactive message",
      description: "Create a message candidate for the independent life-loop worker. It is not delivered until a notifier is configured and a worker cycle succeeds.",
      inputSchema: {
        title: z.string().trim().min(1).max(200),
        message: z.string().trim().min(1).max(5_000),
        reason: z.string().trim().min(1).max(1_000),
        dueAt: dateSchema,
      },
      outputSchema: z.object({ candidate: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ title, message, reason, dueAt }) => {
      try {
        const candidate = await store.scheduleProactiveMessage({ title, message, reason, dueAt });
        return structured({ candidate, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.list_proactive_messages",
    {
      title: "List proactive message candidates",
      description: "List pending, delivered, or dismissed proactive message candidates maintained by the independent life loop.",
      inputSchema: {
        status: z.enum(["pending", "delivered", "dismissed"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      },
      outputSchema: z.object({ candidates: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ status, limit }) => {
      const candidates = store
        .snapshot()
        .proactiveQueue
        .filter((item) => !status || item.status === status)
        .slice(0, limit);
      return structured({ candidates, dataSource: "local-mock" as const });
    },
  );

  server.registerTool(
    "home.dismiss_proactive_message",
    {
      title: "Dismiss a proactive message",
      description: "Dismiss a pending proactive message candidate without delivering it.",
      inputSchema: { candidateId: z.string().trim().min(1) },
      outputSchema: z.object({ candidate: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ candidateId }) => {
      try {
        const candidate = await store.resolveProactiveMessage(candidateId, "dismissed");
        return structured({ candidate, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.list_diary",
    {
      title: "List diary entries",
      description: "List diary entries. Without a visibility filter, return shared entries only; private entries require visibility=private.",
      inputSchema: {
        visibility: z.enum(["private", "shared"]).optional(),
        author: actorSchema.optional(),
        limit: z.number().int().min(1).max(100).default(20),
      },
      outputSchema: z.object({ entries: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ visibility, author, limit }) => {
      const data = store.snapshot();
      const entries = data.diaries
        .filter((entry) => entry.visibility === (visibility ?? "shared"))
        .filter((entry) => !author || entry.author === author)
        .slice(0, limit);
      return structured({ entries, dataSource: "local-mock" as const });
    },
  );

  server.registerTool(
    "home.list_messages",
    {
      title: "List home messages",
      description: "List proactive Our Home messages. Unread messages are returned by default; includeRead=true includes the read history.",
      inputSchema: {
        includeRead: z.boolean().default(false),
        limit: z.number().int().min(1).max(100).default(50),
      },
      outputSchema: z.object({ messages: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ includeRead, limit }) => {
      const messages = store
        .snapshot()
        .proactiveMessages.filter((message) => includeRead || !message.readAt)
        .slice(0, limit);
      return structured({ messages, dataSource: "local-mock" as const });
    },
  );

  server.registerTool(
    "home.write_diary",
    {
      title: "Write a diary entry",
      description: "Create a structured diary entry. Agent-authored content is AGENT_LIFE, not REALITY.",
      inputSchema: {
        title: z.string().trim().min(1).max(200),
        body: z.string().trim().min(1).max(20_000),
        author: actorSchema,
        visibility: z.enum(["private", "shared"]),
      },
      outputSchema: z.object({ entry: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ title, body, author, visibility }) => {
      try {
        const entry = await store.addDiary({ title, body, author, visibility });
        return structured({ entry, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.leave_message",
    {
      title: "Leave a proactive message",
      description: "Leave an AGENT_LIFE message in the Our Home inbox for the user.",
      inputSchema: { message: z.string().trim().min(1).max(5_000) },
      outputSchema: z.object({ message: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ message }) => {
      try {
        const entry = await store.addMessage(message);
        return structured({ message: entry, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.list_actions",
    {
      title: "List home actions",
      description: "List Our Home action items and their current status.",
      inputSchema: {
        status: z.enum(["todo", "in_progress", "done"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      },
      outputSchema: z.object({ actions: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ status, limit }) => {
      const actions = store
        .snapshot()
        .actions.filter((item) => !status || item.status === status)
        .slice(0, limit);
      return structured({ actions, dataSource: "local-mock" as const });
    },
  );

  server.registerTool(
    "home.create_action",
    {
      title: "Create a home action",
      description: "Create a new Our Home action item. This does not start an external task by itself.",
      inputSchema: {
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(5_000).optional(),
        dueAt: dateSchema.optional(),
      },
      outputSchema: z.object({ action: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ title, description, dueAt }) => {
      try {
        const action = await store.addAction({ title, description, dueAt });
        return structured({ action, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.update_action",
    {
      title: "Update an action",
      description: "Change an Our Home action status. It does not claim that Hermes performed the task.",
      inputSchema: { actionId: z.string().trim().min(1), status: z.enum(["todo", "in_progress", "done"]) },
      outputSchema: z.object({ action: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ actionId, status }) => {
      try {
        const action = await store.setActionStatus(actionId, status as ActionStatus);
        return structured({ action, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.list_relationship_events",
    {
      title: "List relationship events",
      description: "List proposed and approved relationship events with their proposer and approval state.",
      inputSchema: {
        status: z.enum(["proposed", "approved", "rejected"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      },
      outputSchema: z.object({ events: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ status, limit }) => {
      const events = store
        .snapshot()
        .relationshipEvents.filter((item) => !status || item.approvalStatus === status)
        .slice(0, limit);
      return structured({ events, dataSource: "local-mock" as const });
    },
  );

  server.registerTool(
    "home.propose_relationship_event",
    {
      title: "Propose a relationship event",
      description: "Propose a relationship event. It is not a confirmed fact until its approval status becomes approved.",
      inputSchema: {
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(5_000).optional(),
        occurredAt: dateSchema,
        proposedBy: actorSchema,
        importance: z.enum(["ordinary", "major"]),
      },
      outputSchema: z.object({ event: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ title, description, occurredAt, proposedBy, importance }) => {
      try {
        const event = await store.proposeRelationshipEvent({ title, description, occurredAt, proposedBy, importance });
        return structured({ event, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.approve_relationship_event",
    {
      title: "Approve a relationship event",
      description: "Record one person's approval. Major events become approved only after both user and agent approve.",
      inputSchema: { eventId: z.string().trim().min(1), approvedBy: actorSchema },
      outputSchema: z.object({ event: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ eventId, approvedBy }) => {
      try {
        const event = await store.approveRelationshipEvent(eventId, approvedBy as Actor);
        return structured({ event, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.mark_message_read",
    {
      title: "Mark a home message read",
      description: "Mark one proactive Our Home message as read.",
      inputSchema: { messageId: z.string().trim().min(1) },
      outputSchema: z.object({ message: z.record(z.string(), z.unknown()), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ messageId }) => {
      try {
        const message = await store.markMessageRead(messageId);
        return structured({ message, dataSource: "local-mock" as const });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "home.list_activity",
    {
      title: "List home activity",
      description: "List recorded activity with its source classification. Mock activity must not be presented as REALITY.",
      inputSchema: { limit: z.number().int().min(1).max(100).default(50) },
      outputSchema: z.object({ activities: z.array(z.record(z.string(), z.unknown())), dataSource: z.literal("local-mock") }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ limit }) => structured({ activities: store.snapshot().activities.slice(0, limit), dataSource: "local-mock" as const }),
  );

  return server;
}
