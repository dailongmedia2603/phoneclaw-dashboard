import { Handle, Position } from '@xyflow/react';

export default function StartNode() {
  return (
    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl px-6 py-3 shadow-md min-w-[120px] text-center">
      <div className="text-lg font-bold text-emerald-700 flex items-center justify-center gap-2">
        <span>▶</span> Bắt đầu
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
    </div>
  );
}
