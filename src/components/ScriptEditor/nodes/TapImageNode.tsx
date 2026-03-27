import { Handle, Position, useReactFlow } from '@xyflow/react';
import { NODE_DEFS } from '../nodeDefinitions';
import NodeIcon from '../nodeIcons';
import { X } from 'lucide-react';

interface TapImageNodeProps {
  id: string;
  data: { nodeType: string; params: Record<string, unknown> };
  selected?: boolean;
}

export default function TapImageNode({ id, data, selected }: TapImageNodeProps) {
  const def = NODE_DEFS[data.nodeType];
  const { deleteElements } = useReactFlow();
  if (!def) return null;

  const templateName = String(data.params.templateName || '');

  return (
    <div
      className={`group relative rounded-xl border-2 shadow-sm min-w-[170px] max-w-[220px] transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      style={{ borderColor: def.color, backgroundColor: def.bgColor }}
    >
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
      <div className="px-3 pb-2 flex items-center gap-2">
        <div className="w-5 h-5 bg-slate-200 rounded border border-slate-300 flex items-center justify-center">
          <NodeIcon name={def.icon} size={10} className="text-slate-400" />
        </div>
        <span className="text-xs text-slate-500">{templateName}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" style={{ background: def.color }} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" style={{ background: def.color }} />
    </div>
  );
}
