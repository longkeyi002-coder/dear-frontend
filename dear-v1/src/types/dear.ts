export type DockId = 'chat' | 'diary' | 'calendar' | 'memory';
export type OverlayId = 'album' | 'chat' | 'diary' | 'calendar' | 'memory' | 'soul' | 'skills' | 'mcp' | 'system' | 'kanban' | 'agents' | 'cron' | 'connectors' | 'toolbox' | 'period' | 'data';
export type CardCategory = 'home' | 'record' | 'tool' | 'automation' | 'connect' | 'security' | 'system' | 'dear';
export type FeatureCard = { id: number; name: string; emoji: string; category: CardCategory; overlay: OverlayId; description: string; };
export type ChatMessage = { id: string; role: 'ai' | 'user'; text: string };
