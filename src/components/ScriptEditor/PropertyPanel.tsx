import type { Node } from '@xyflow/react';
import { NODE_DEFS } from './nodeDefinitions';
import NodeIcon from './nodeIcons';
import { Trash2, Crosshair } from 'lucide-react';

interface PropertyPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, params: Record<string, unknown>) => void;
  onDeleteNode?: (nodeId: string) => void;
  onPickCoordinate?: (fieldPrefix: string) => void;
}

/** Check if the node has pickable coordinate fields */
function getPickableFields(nodeType: string): { prefix: string; label: string }[] {
  const def = NODE_DEFS[nodeType];
  if (!def) return [];

  const keys = def.fields.map(f => f.key);
  const result: { prefix: string; label: string }[] = [];

  // Tap-style: x, y
  if (keys.includes('x') && keys.includes('y')) {
    result.push({ prefix: 'xy', label: 'Chọn vị trí tap' });
  }

  // Swipe-style: fromX/fromY + toX/toY
  if (keys.includes('fromX') && keys.includes('fromY')) {
    result.push({ prefix: 'from', label: 'Chọn điểm bắt đầu' });
  }
  if (keys.includes('toX') && keys.includes('toY')) {
    result.push({ prefix: 'to', label: 'Chọn điểm kết thúc' });
  }

  // tap_image fallback: fallbackX, fallbackY
  if (keys.includes('fallbackX') && keys.includes('fallbackY')) {
    result.push({ prefix: 'fallback', label: 'Chọn vị trí fallback' });
  }

  return result;
}

export default function PropertyPanel({ selectedNode, onUpdateNode, onDeleteNode, onPickCoordinate }: PropertyPanelProps) {
  if (!selectedNode) {
    return (
      <div className="w-64 bg-white border-l border-slate-200 flex items-center justify-center p-4">
        <p className="text-sm text-slate-400 text-center">Chọn 1 node để xem thuộc tính</p>
      </div>
    );
  }

  const nodeData = selectedNode.data as { nodeType: string; params: Record<string, unknown> };
  const def = NODE_DEFS[nodeData?.nodeType];
  const isStart = selectedNode.type === 'start';
  const pickableFields = nodeData?.nodeType ? getPickableFields(nodeData.nodeType) : [];

  const handleChange = (key: string, value: string) => {
    const field = def?.fields.find(f => f.key === key);
    const parsed = field?.type === 'number' ? Number(value) || 0 : value;
    onUpdateNode(selectedNode.id, { ...nodeData.params, [key]: parsed });
  };

  return (
    <div className="w-64 bg-white border-l border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <NodeIcon name={def?.icon || 'play'} size={18} />
        <span className="font-semibold text-sm text-slate-800">{def?.label || 'Node'}</span>
      </div>

      {def && def.fields.length > 0 && def.fields.map(field => (
        <div key={field.key}>
          <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            key={`${selectedNode.id}-${field.key}`}
            defaultValue={String(nodeData.params?.[field.key] ?? '')}
            onBlur={e => handleChange(field.key, e.target.value)}
            onChange={e => handleChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      ))}

      {/* Coordinate Picker buttons */}
      {pickableFields.length > 0 && onPickCoordinate && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500">Chọn toạ độ từ màn hình</p>
          {pickableFields.map(pf => (
            <button
              key={pf.prefix}
              onClick={() => onPickCoordinate(pf.prefix)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Crosshair size={14} /> {pf.label}
            </button>
          ))}
        </div>
      )}

      {def && def.fields.length === 0 && !isStart && pickableFields.length === 0 && (
        <p className="text-xs text-slate-400">Không có thuộc tính cần cấu hình.</p>
      )}

      {!isStart && onDeleteNode && (
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> Xoá node
          </button>
        </div>
      )}
    </div>
  );
}
