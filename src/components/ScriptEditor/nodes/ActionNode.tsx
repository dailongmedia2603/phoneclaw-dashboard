import { Handle, Position, useReactFlow } from '@xyflow/react';
import { NODE_DEFS } from '../nodeDefinitions';
import NodeIcon from '../nodeIcons';
import { X } from 'lucide-react';

interface ActionNodeProps {
  id: string;
  data: { nodeType: string; params: Record<string, unknown> };
  selected?: boolean;
}

export default function ActionNode({ id, data, selected }: ActionNodeProps) {
  const def = NODE_DEFS[data.nodeType];
  const { deleteElements } = useReactFlow();
  if (!def) return null;

  const summary = getSummary(data.nodeType, data.params);

  return (
    <div
      className={`group relative rounded-xl border-2 shadow-sm min-w-[160px] max-w-[220px] transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      style={{ borderColor: def.color, backgroundColor: def.bgColor }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); deleteElements({ nodes: [{ id }] }); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
      >
        <X size={10} />
      </button>

      <div className="px-3 py-2 flex items-center gap-2">
        <NodeIcon name={def.icon} size={18} />
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
