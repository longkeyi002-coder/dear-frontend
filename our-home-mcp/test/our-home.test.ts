import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createOurHomeServer } from "../src/server.js";
import { JsonStore } from "../src/store.js";
import { runProactiveCycle } from "../src/worker.js";

async function connectedClient(store: JsonStore) {
  const server = createOurHomeServer(store);
  const client = new Client({ name: "our-home-test-client", version: "0.1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

test("persists structured records without losing source metadata", async () => {
  const directory = await mkdtemp(join(tmpdir(), "our-home-mcp-"));
  const filePath = join(directory, "our-home.json");
  const store = await JsonStore.open(filePath, false);
  const entry = await store.addDiary({
    title: "测试记录",
    body: "这是一条 Agent Life 记录。",
    author: "agent",
    visibility: "shared",
  });

  const persisted = JSON.parse(await readFile(filePath, "utf8")) as { diaries: Array<{ id: string; source: string }> };
  assert.equal(persisted.diaries[0]?.id, entry.id);
  assert.equal(persisted.diaries[0]?.source, "AGENT_LIFE");

  const reopened = await JsonStore.open(filePath, false);
  assert.equal(reopened.snapshot().diaries[0]?.body, "这是一条 Agent Life 记录。");
});

test("exposes focused read and write tools through MCP", async () => {
  const directory = await mkdtemp(join(tmpdir(), "our-home-mcp-"));
  const store = await JsonStore.open(join(directory, "our-home.json"), true);
  const { client, server } = await connectedClient(store);

  const listed = await client.listTools();
  const names = listed.tools.map((tool) => tool.name);
  assert.ok(names.includes("home.get_today"));
  assert.ok(names.includes("home.write_diary"));
  assert.ok(names.includes("home.list_messages"));
  assert.ok(names.includes("home.propose_relationship_event"));

  const written = await client.callTool({
    name: "home.write_diary",
    arguments: {
      title: "MCP 测试",
      body: "通过 MCP 写入。",
      author: "agent",
      visibility: "shared",
    },
  });
  assert.equal(written.isError, undefined);
  assert.equal((written.structuredContent as { dataSource: string }).dataSource, "local-mock");

  const diaries = await client.callTool({ name: "home.list_diary", arguments: { limit: 10 } });
  const entries = (diaries.structuredContent as { entries: Array<{ body: string }> }).entries;
  assert.ok(entries.some((entry) => entry.body === "通过 MCP 写入。"));

  const activity = await client.callTool({ name: "home.list_activity", arguments: { limit: 10 } });
  const activities = (activity.structuredContent as { activities: Array<{ kind: string }> }).activities;
  assert.ok(activities.some((item) => item.kind === "diary_written"));

  await client.close();
  await server.close();
});

test("does not expose private diaries unless explicitly requested", async () => {
  const directory = await mkdtemp(join(tmpdir(), "our-home-mcp-"));
  const store = await JsonStore.open(join(directory, "our-home.json"), false);
  await store.addDiary({ title: "共享", body: "共享内容", author: "agent", visibility: "shared" });
  await store.addDiary({ title: "私密", body: "私密内容", author: "agent", visibility: "private" });
  const { client, server } = await connectedClient(store);

  const shared = await client.callTool({ name: "home.list_diary", arguments: {} });
  const sharedEntries = (shared.structuredContent as { entries: Array<{ visibility: string }> }).entries;
  assert.ok(sharedEntries.every((entry) => entry.visibility === "shared"));

  const privateEntries = await client.callTool({ name: "home.list_diary", arguments: { visibility: "private" } });
  const privateResults = (privateEntries.structuredContent as { entries: Array<{ visibility: string }> }).entries;
  assert.ok(privateResults.length > 0);
  assert.ok(privateResults.every((entry) => entry.visibility === "private"));

  await client.close();
  await server.close();
});

test("major relationship events require both approvals", async () => {
  const directory = await mkdtemp(join(tmpdir(), "our-home-mcp-"));
  const store = await JsonStore.open(join(directory, "our-home.json"), false);
  const { client, server } = await connectedClient(store);

  const proposed = await client.callTool({
    name: "home.propose_relationship_event",
    arguments: {
      title: "重要节点",
      occurredAt: "2026-09-01T00:00:00Z",
      proposedBy: "user",
      importance: "major",
    },
  });
  const event = (proposed.structuredContent as { event: { id: string; approvalStatus: string } }).event;
  assert.equal(event.approvalStatus, "proposed");

  const firstApproval = await client.callTool({
    name: "home.approve_relationship_event",
    arguments: { eventId: event.id, approvedBy: "user" },
  });
  assert.equal((firstApproval.structuredContent as { event: { approvalStatus: string } }).event.approvalStatus, "proposed");

  const secondApproval = await client.callTool({
    name: "home.approve_relationship_event",
    arguments: { eventId: event.id, approvedBy: "agent" },
  });
  assert.equal((secondApproval.structuredContent as { event: { approvalStatus: string } }).event.approvalStatus, "approved");

  await client.close();
  await server.close();
});

test("migrates a v1 data file without losing existing records", async () => {
  const directory = await mkdtemp(join(tmpdir(), "our-home-mcp-"));
  const filePath = join(directory, "our-home.json");
  await writeFile(filePath, JSON.stringify({
    schemaVersion: 1,
    diaries: [],
    relationshipEvents: [],
    actions: [],
    activities: [],
    proactiveMessages: [],
    homeState: { presence: "unknown", updatedAt: "2026-09-01T00:00:00.000Z", source: "HOME_STATE" },
  }), "utf8");

  const store = await JsonStore.open(filePath, false);
  const snapshot = store.snapshot();
  assert.equal(snapshot.schemaVersion, 2);
  assert.deepEqual(snapshot.observations, []);
  assert.deepEqual(snapshot.proactiveQueue, []);
});

test("independent life-loop cycle delivers due candidates without Hermes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "our-home-mcp-"));
  const store = await JsonStore.open(join(directory, "our-home.json"), false);
  const candidate = await store.scheduleProactiveMessage({
    title: "心跳测试",
    message: "这条消息由独立 Life Loop 投递。",
    reason: "测试到期候选消息",
    dueAt: "2026-09-01T00:00:00Z",
  });
  const delivered: string[] = [];
  const result = await runProactiveCycle(store, {
    deliver: async (item) => delivered.push(item.id),
  }, new Date("2026-09-01T00:01:00Z"));

  assert.equal(result.dueCount, 1);
  assert.equal(result.deliveredCount, 1);
  assert.deepEqual(delivered, [candidate.id]);
  assert.equal(store.snapshot().proactiveQueue[0]?.status, "delivered");
  assert.equal(store.snapshot().heartbeats.length, 1);
});

test("failed proactive delivery remains pending for retry", async () => {
  const directory = await mkdtemp(join(tmpdir(), "our-home-mcp-"));
  const store = await JsonStore.open(join(directory, "our-home.json"), false);
  const candidate = await store.scheduleProactiveMessage({
    title: "失败测试",
    message: "这条消息应当保留待重试。",
    reason: "测试通知失败",
    dueAt: "2026-09-01T00:00:00Z",
  });
  const result = await runProactiveCycle(store, {
    deliver: async () => { throw new Error("channel unavailable"); },
  }, new Date("2026-09-01T00:01:00Z"));
  const saved = store.snapshot().proactiveQueue.find((item) => item.id === candidate.id);

  assert.equal(result.failedCount, 1);
  assert.equal(saved?.status, "pending");
  assert.equal(saved?.attempts, 1);
  assert.equal(saved?.lastError, "channel unavailable");
});
