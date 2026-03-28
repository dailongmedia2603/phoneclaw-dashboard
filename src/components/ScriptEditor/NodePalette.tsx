import { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { NODE_CATEGORIES, getNodesByCategory, makeCustomNodeDef, type NodeDef } from './nodeDefinitions';
import NodeIcon from './nodeIcons';
import { customNodes as customNodesApi } from '../../services/api';

interface NodePaletteProps {
  onCustomNodesLoaded?: (defs: Record<string, NodeDef>) => void;
}

export default function NodePalette({ onCustomNodesLoaded }: NodePaletteProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [saving, setSaving] = useState(false);
  const [customNodesList, setCustomNodesList] = useState<{ id: string; name: string }[]>([]);
  const [customDefs, setCustomDefs] = useState<Record<string, NodeDef>>({});

  // Load custom nodes on mount
  useEffect(() => {
    customNodesApi.getAll().then(res => {
      if (res.success && res.data) {
        setCustomNodesList(res.data);
        const defs: Record<string, NodeDef> = {};
        for (const n of res.data) {
          const def = makeCustomNodeDef(n.id, n.name);
          defs[def.nodeType] = def;
        }
        setCustomDefs(defs);
        onCustomNodesLoaded?.(defs);
      }
    });
  }, []);

  const handleAdd = async () => {
    if (!newNodeName.trim()) return;
    setSaving(true);
    const res = await customNodesApi.create(newNodeName.trim());
    if (res.success && res.data) {
      const node = res.data;
      const def = makeCustomNodeDef(node.id, node.name);
      setCustomNodesList(prev => [...prev, node]);
      setCustomDefs(prev => {
        const updated = { ...prev, [def.nodeType]: def };
        onCustomNodesLoaded?.(updated);
        return updated;
      });
      setNewNodeName('');
      setShowAddModal(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await customNodesApi.remove(id);
    setCustomNodesList(prev => prev.filter(n => n.id !== id));
    setCustomDefs(prev => {
      const updated = { ...prev };
      delete updated[`custom_${id}`];
      onCustomNodesLoaded?.(updated);
      return updated;
    });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* Header with Add button */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="font-semibold text-sm text-slate-800">Kéo thả node</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          title="Thêm node tuỳ chỉnh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Thêm
        </button>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {NODE_CATEGORIES.map(cat => {
          const nodes = getNodesByCategory(cat.id, customDefs);
          if (nodes.length === 0) return null;
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: cat.color }}></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat.label}</span>
              </div>
              <div className="space-y-1">
                {nodes.map(node => (
                  <div
                    key={node.nodeType}
                    draggable
                    onDragStart={e => onDragStart(e, node.nodeType)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 cursor-grab active:cursor-grabbing transition-colors text-sm group"
                  >
                    <NodeIcon name={node.icon} size={18} className="text-slate-500" />
                    <span className="font-medium text-slate-700 flex-1">{node.label}</span>
                    {cat.id === 'custom' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(node.nodeType.replace('custom_', '')); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-all"
                        title="Xoá node"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-orange-500" /> Thêm node tuỳ chỉnh
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên node</label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={e => setNewNodeName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="VD: Nút chia sẻ, Like bài viết..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1.5">Node sẽ dùng cơ chế tap toạ độ, bạn có thể chọn vị trí tap sau khi kéo vào kịch bản.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl">
                Huỷ
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newNodeName.trim()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {saving ? 'Đang lưu...' : 'Tạo node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
