import type { DockId } from '../types/dear';
const items:[DockId,string,string][]=[['chat','⌂','聊天'],['diary','▤','日记'],['calendar','▦','日历'],['memory','♢','记忆']];
export function Dock({active,onChange}:{active:DockId;onChange:(id:DockId)=>void}) { return <nav className="dock">{items.map(([id,icon,label])=><button key={id} className={active===id?'active':''} onClick={()=>onChange(id)}><span>{icon}</span>{label}</button>)}</nav>; }
