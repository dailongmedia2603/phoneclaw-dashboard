import { Handle, Position } from '@xyflow/react';
import { NODE_DEFS } from '../nodeDefinitions';

interface ActionNodeProps {
  data: { nodeType: string; params: Record<string, unknown> };
  selected?: boolean;
}

export default function ActionNode({ data, selected }: ActionNodeProps) {
  const def = NODE_DEFS[data.nodeType];
  if (!def) return null;

  const summary = getSummary(data.nodeType, data.params);

  return (
    <div
      className={`rounded-xl border-2 shadow-sm min-w-[160px] max-w-[220px] transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      style={{ borderColor: def.color, backgroundColor: def.bgColor }}
    >
      <div className="px-3 py-2 flex items-center gap-2">
        <span className="text-lg">{def.icon}</span>
        <span className="text-sm font-semibold" style={{ color: def.color }}>{def.label}</span>
      </div>
      {summary && (
        <div className="px-3 pb-2 text-xs text-slate-500 truncate">{summary}</div>
      )}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" style={{ background: def.color }} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" style={{ background: def.color }} />
    </div>
  );
}

function getSummary(nodeType: string, params: Record<string, unknown>): string {
  switch (nodeType) {
    case 'wait': return `${params.seconds}s`;
    case 'wait_random': return `${params.min}-${params.max}s`;
    case 'repeat': return `${params.count} lần`;
    case 'type_text': return String(params.text || '').slice(0, 20);
    default: return '';
  }
}
