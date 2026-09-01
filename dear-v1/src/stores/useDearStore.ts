import { useState } from 'react';
import type { ChatMessage, DockId, OverlayId } from '../types/dear';
export function useDearStore() { const [overlay,setOverlay] = useState<OverlayId|null>(null); const [dock,setDock] = useState<DockId>('chat'); const [messages,setMessages] = useState<ChatMessage[]>([{id:'a1',role:'ai',text:'嗨龙龙，我是 DEAR ✨\n聊天是家，常看的功能我钉在底下，偶尔的收进「牌册」。'},{id:'a2',role:'ai',text:'试试点底部 Dock，或者上滑打开牌册。任何时候都可以回到这里。'}]); return {overlay,dock,messages,setDock,setOverlay,setMessages}; }
