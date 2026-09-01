export type SourceType =
  | "REALITY"
  | "AGENT_LIFE"
  | "RELATIONSHIP"
  | "HOME_STATE";

export type Capability = "available" | "unavailable" | "placeholder";
export type Actor = "user" | "agent";
export type DiaryVisibility = "private" | "shared";
export type ActionStatus = "todo" | "in_progress" | "done";
export type RelationshipApprovalStatus = "proposed" | "approved" | "rejected";

export interface DiaryEntry {
  id: string;
  title: string;
  body: string;
  author: Actor;
  visibility: DiaryVisibility;
  source: "AGENT_LIFE" | "RELATIONSHIP";
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipEvent {
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  proposedBy: Actor;
  importance: "ordinary" | "major";
  approvalStatus: RelationshipApprovalStatus;
  approvedBy: Actor[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  status: ActionStatus;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  source: "AGENT_LIFE" | "REALITY";
}

export interface AgentActivity {
  id: string;
  kind: string;
  title: string;
  summary?: string;
  occurredAt: string;
  source: SourceType;
}

export interface ProactiveMessage {
  id: string;
  message: string;
  createdAt: string;
  readAt?: string;
  source: "AGENT_LIFE";
}

export interface HomeState {
  presence: "unknown" | "sleeping" | "awake" | "working" | "waiting";
  note?: string;
  updatedAt: string;
  source: "HOME_STATE";
}

export interface OurHomeData {
  schemaVersion: 1;
  diaries: DiaryEntry[];
  relationshipEvents: RelationshipEvent[];
  actions: ActionItem[];
  activities: AgentActivity[];
  proactiveMessages: ProactiveMessage[];
  homeState: HomeState;
}

export interface DataStatus {
  domain: string;
  source: "local-mock" | "home-backend" | "hermes";
  capability: Capability;
  fetchedAt: string;
  note?: string;
}
