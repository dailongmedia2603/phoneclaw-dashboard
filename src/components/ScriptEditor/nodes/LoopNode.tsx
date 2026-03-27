import { Handle, Position, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';

interface LoopNodeProps {
  id: string;
  data: { nodeType: string; params: Record<string, unknown> };
  selected?: boolean;
}

export default function LoopNode({ id, data, selected }: LoopNodeProps) {
  const count = data.params.count || 5;
  const { deleteElements } = useReactFlow();

  return (
    <div
      className={`group relative rounded-xl border-2 border-purple-500 bg-purple-50 shadow-sm min-w-[180px] transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-purple-400' : ''
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); deleteElements({ nodes: [{ id }] }); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
      >
        <X size={10} />
      </button>

      <div className="px-3 py-2 flex items-center gap-2">
        <span className="text-lg">🔁</span>
        <span className="text-sm font-semibold text-purple-700">Lặp lại</span>
        <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">{String(count)}x</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="next" className="!bg-purple-500 !w-3 !h-3" style={{ left: '70%' }} />
      <Handle type="source" position={Position.Right} id="body" className="!bg-purple-400 !w-3 !h-3" />
    </div>
  );
}
