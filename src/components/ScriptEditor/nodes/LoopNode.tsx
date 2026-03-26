import { Handle, Position } from '@xyflow/react';

interface LoopNodeProps {
  data: { nodeType: string; params: Record<string, unknown> };
  selected?: boolean;
}

export default function LoopNode({ data, selected }: LoopNodeProps) {
  const count = data.params.count || 5;

  return (
    <div
      className={`rounded-xl border-2 border-purple-500 bg-purple-50 shadow-sm min-w-[180px] transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-purple-400' : ''
      }`}
    >
      <div className="px-3 py-2 flex items-center gap-2">
        <span className="text-lg">🔁</span>
        <span className="text-sm font-semibold text-purple-700">Lặp lại</span>
        <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">{String(count)}x</span>
      </div>
      <div className="px-3 pb-2 flex items-center justify-between text-[10px] text-purple-500">
        <span>Body →</span>
        <span>→ Tiếp</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="next" className="!bg-purple-500 !w-3 !h-3" style={{ left: '70%' }} />
      <Handle type="source" position={Position.Right} id="body" className="!bg-purple-400 !w-3 !h-3" />
    </div>
  );
}
