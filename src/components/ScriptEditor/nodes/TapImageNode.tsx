import { Handle, Position } from '@xyflow/react';
import { NODE_DEFS } from '../nodeDefinitions';
import NodeIcon from '../nodeIcons';

interface TapImageNodeProps {
  data: { nodeType: string; params: Record<string, unknown> };
  selected?: boolean;
}

export default function TapImageNode({ data, selected }: TapImageNodeProps) {
  const def = NODE_DEFS[data.nodeType];
  if (!def) return null;

  const templateName = String(data.params.templateName || '');

  return (
    <div
      className={`rounded-xl border-2 shadow-sm min-w-[170px] max-w-[220px] transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      style={{ borderColor: def.color, backgroundColor: def.bgColor }}
    >
      <div className="px-3 py-2 flex items-center gap-2">
        <NodeIcon name={def.icon} size={18} />
        <span className="text-sm font-semibold" style={{ color: def.color }}>{def.label}</span>
      </div>
      <div className="px-3 pb-2 flex items-center gap-2">
        <div className="w-6 h-6 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 overflow-hidden">
          🖼
        </div>
        <span className="text-xs text-slate-500">{templateName}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" style={{ background: def.color }} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" style={{ background: def.color }} />
    </div>
  );
}
