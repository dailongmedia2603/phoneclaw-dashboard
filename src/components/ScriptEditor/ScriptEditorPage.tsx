import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Connection, type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { NODE_DEFS } from './nodeDefinitions';
import NodePalette from './NodePalette';
import PropertyPanel from './PropertyPanel';
import { graphToScriptSteps, scriptStepsToGraph } from './graphConverter';
import { scripts as scriptsApi } from '../../services/api';
import { showToast } from '../Toast';
import { ArrowLeft, Save, Loader2, ChevronDown, Music, Globe, Facebook } from 'lucide-react';
import type { Script } from '../../types';

interface ScriptEditorPageProps {
  scriptId?: string;
  appTab?: string;
  onBack: () => void;
}

const DEFAULT_START_NODE: Node = {
  id: 'start-node',
  type: 'start',
  position: { x: 300, y: 50 },
  data: {},
  deletable: false,
};

export default function ScriptEditorPage({ scriptId, appTab, onBack }: ScriptEditorPageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([DEFAULT_START_NODE]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [scriptName, setScriptName] = useState('');
  const [scriptDesc, setScriptDesc] = useState('');
  const [scriptChannel, setScriptChannel] = useState(appTab || 'tiktok_vn');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Load existing script
  useEffect(() => {
    if (scriptId && !loaded) {
      scriptsApi.getOne(scriptId).then(res => {
        if (res.success && res.data) {
          const script = res.data;
          setScriptName(script.name);
          setScriptDesc(script.description);
          if (script.channel) setScriptChannel(script.channel);
          // Prefer saved graphData (preserves positions + edges)
          if (script.graphData?.nodes?.length) {
            setNodes(script.graphData.nodes as Node[]);
            setEdges((script.graphData.edges || []) as any[]);
          } else if (script.steps?.length > 0) {
            const { nodes: gNodes, edges: gEdges } = scriptStepsToGraph(script.steps);
            setNodes(gNodes);
            setEdges(gEdges);
          }
        }
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
  }, [scriptId]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge(connection, eds));
  }, [setEdges]);

  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    setSelectedNode(sel.length === 1 ? sel[0] : null);
  }, []);

  const onUpdateNodeParams = useCallback((nodeId: string, params: Record<string, unknown>) => {
    setNodes(nds =>
      nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, params } } : n)
    );
  }, [setNodes]);

  // Drag & Drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType || !NODE_DEFS[nodeType]) return;

    const def = NODE_DEFS[nodeType];
    const position = reactFlowInstance?.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    }) || { x: 300, y: 200 };

    let rfType = 'action';
    if (nodeType === 'repeat') rfType = 'loop';
    else if (def.stepType === 'tap_image') rfType = 'tapImage';

    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: rfType,
      position,
      data: { nodeType, params: { ...def.defaultParams } },
    };

    setNodes(nds => [...nds, newNode]);
  }, [reactFlowInstance, setNodes]);

  // Save
  const handleSave = useCallback(async () => {
    if (!scriptName.trim()) {
      showToast('error', 'Vui lòng nhập tên kịch bản');
      return;
    }
    setSaving(true);
    const steps = graphToScriptSteps(nodes, edges);

    try {
      const graphData = { nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })) };

      if (scriptId) {
        await scriptsApi.update(scriptId, {
          name: scriptName,
          description: scriptDesc,
          channel: scriptChannel,
          steps,
          graphData,
        });
        showToast('success', 'Đã lưu kịch bản');
      } else {
        await scriptsApi.create({
          name: scriptName,
          description: scriptDesc,
          channel: scriptChannel,
          steps,
          graphData,
        });
        showToast('success', 'Đã tạo kịch bản');
        onBack();
      }
    } catch {
      showToast('error', 'Lưu thất bại');
    }
    setSaving(false);
  }, [scriptId, scriptName, scriptDesc, nodes, edges, onBack]);

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 shrink-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <input
            type="text"
            value={scriptName}
            onChange={e => setScriptName(e.target.value)}
            placeholder="Tên kịch bản..."
            className="text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 w-64"
          />
          <div className="relative">
            <button
              onClick={() => setShowChannelDropdown(!showChannelDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {scriptChannel === 'tiktok_vn' && <><Music size={14} className="text-slate-900" /> TikTok Việt</>}
              {scriptChannel === 'tiktok_us' && <><Globe size={14} className="text-blue-600" /> TikTok US</>}
              {scriptChannel === 'facebook' && <><Facebook size={14} className="text-blue-500" /> Facebook</>}
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showChannelDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 w-44">
                {[
                  { id: 'tiktok_vn', label: 'TikTok Việt', icon: Music, iconColor: 'text-slate-900' },
                  { id: 'tiktok_us', label: 'TikTok US', icon: Globe, iconColor: 'text-blue-600' },
                  { id: 'facebook', label: 'Facebook', icon: Facebook, iconColor: 'text-blue-500' },
                ].map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => { setScriptChannel(ch.id); setShowChannelDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                      scriptChannel === ch.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <ch.icon size={16} className={ch.iconColor} />
                    {ch.label}
                    {scriptChannel === ch.id && <span className="ml-auto text-blue-600 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={scriptDesc}
            onChange={e => setScriptDesc(e.target.value)}
            placeholder="Mô tả..."
            className="text-sm text-slate-500 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette />

        {/* Center: Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            className="bg-slate-50"
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls className="!bg-white !border-slate-200 !shadow-md" />
            <MiniMap
              className="!bg-white !border-slate-200 !shadow-md"
              nodeColor={(n) => {
                const d = n.data as any;
                return NODE_DEFS[d?.nodeType]?.color || '#94a3b8';
              }}
            />
          </ReactFlow>
        </div>

        {/* Right: Property Panel */}
        <PropertyPanel selectedNode={selectedNode} onUpdateNode={onUpdateNodeParams} />
      </div>
    </div>
  );
}
