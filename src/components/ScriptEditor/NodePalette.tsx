import { NODE_CATEGORIES, getNodesByCategory } from './nodeDefinitions';
import NodeIcon from './nodeIcons';

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">
        Kéo thả node
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {NODE_CATEGORIES.map(cat => {
          const nodes = getNodesByCategory(cat.id);
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 cursor-grab active:cursor-grabbing transition-colors text-sm"
                  >
                    <NodeIcon name={node.icon} size={18} className="text-slate-500" />
                    <span className="font-medium text-slate-700">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
