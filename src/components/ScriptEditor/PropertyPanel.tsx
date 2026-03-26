import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { NODE_DEFS } from './nodeDefinitions';

interface PropertyPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, params: Record<string, unknown>) => void;
}

export default function PropertyPanel({ selectedNode, onUpdateNode }: PropertyPanelProps) {
  if (!selectedNode) {
    return (
      <div className="w-64 bg-white border-l border-slate-200 flex items-center justify-center p-4">
        <p className="text-sm text-slate-400 text-center">Chọn 1 node để xem thuộc tính</p>
      </div>
    );
  }

  const nodeData = selectedNode.data as { nodeType: string; params: Record<string, unknown> };
  const def = NODE_DEFS[nodeData.nodeType];
  if (!def || def.fields.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{def?.icon}</span>
          <span className="font-semibold text-sm text-slate-800">{def?.label || 'Node'}</span>
        </div>
        <p className="text-xs text-slate-400">Node này không có thuộc tính cần cấu hình.</p>
      </div>
    );
  }

  const handleChange = useCallback((key: string, value: string) => {
    const field = def.fields.find(f => f.key === key);
    const parsed = field?.type === 'number' ? Number(value) || 0 : value;
    onUpdateNode(selectedNode.id, { ...nodeData.params, [key]: parsed });
  }, [selectedNode.id, nodeData.params, def.fields, onUpdateNode]);

  return (
    <div className="w-64 bg-white border-l border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{def.icon}</span>
        <span className="font-semibold text-sm text-slate-800">{def.label}</span>
      </div>

      {def.fields.map(field => (
        <div key={field.key}>
          <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={String(nodeData.params[field.key] ?? '')}
            onChange={e => handleChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      ))}
    </div>
  );
}
