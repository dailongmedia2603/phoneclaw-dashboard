import { Handle, Position, useReactFlow } from '@xyflow/react';
import { NODE_DEFS } from '../nodeDefinitions';
import NodeIcon from '../nodeIcons';
import { X, Clock } from 'lucide-react';

/** Fallback def for custom nodes not in static NODE_DEFS */
const CUSTOM_NODE_FALLBACK = {
  color: '#f97316',
  bgColor: '#fff7ed',
  icon: 'target',
  label: 'Custom',
};

/** Node types bản thân là chờ → không có auto pre-delay. */
const NO_PREDELAY_NODE_TYPES = new Set<string>(['wait', 'wait_random', 'wait_for_pixel']);

interface ActionNodeProps {
  id: string;
  data: { nodeType: string; params: Record<string, unknown>; label?: string };
  selected?: boolean;
}

export default function ActionNode({ id, data, selected }: ActionNodeProps) {
  const staticDef = NODE_DEFS[data.nodeType];
  const { deleteElements } = useReactFlow();

  // Use static def, or fallback for custom nodes
  const def = staticDef || {
    ...CUSTOM_NODE_FALLBACK,
    label: data.label || data.nodeType.replace('custom_', ''),
  };

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
      {!NO_PREDELAY_NODE_TYPES.has(data.nodeType) && (
        <div className="px-3 pb-1 flex items-center gap-1 text-[10px] text-slate-400/80">
          <Clock size={10} />
          <span>Chờ 5s trước</span>
        </div>
      )}
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
    case 'wait_for_pixel': return `${String(params.expectedColor || '')} ≤${params.maxWait}s`;
    case 'repeat': return `${params.count} lần`;
    case 'type_text': return String(params.text || '').slice(0, 20);
    case 'send_file':
    case 'select_video': return params.videoName ? String(params.videoName).slice(0, 20) : '';
    default: return '';
  }
}
