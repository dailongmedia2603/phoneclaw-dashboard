import type { Node, Edge } from '@xyflow/react';
import type { ScriptStep } from '../../types';
import { NODE_DEFS } from './nodeDefinitions';

// ============================================================
// Graph → ScriptStep[] (for execution)
// ============================================================
export function graphToScriptSteps(nodes: Node[], edges: Edge[]): ScriptStep[] {
  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) return [];

  const adj = new Map<string, { target: string; handle?: string }[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push({ target: e.target, handle: e.sourceHandle || undefined });
  }

  return collectChain(startNode.id, nodes, adj);
}

function collectChain(
  startId: string,
  nodes: Node[],
  adj: Map<string, { target: string; handle?: string }[]>
): ScriptStep[] {
  const steps: ScriptStep[] = [];
  let currentId: string | null = startId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const node = nodes.find(n => n.id === currentId);
    if (!node || node.type === 'start') {
      // Follow next edge from start
      const nextEdge = (adj.get(currentId!) || []).find(e => !e.handle || e.handle === 'next');
      currentId = nextEdge?.target || null;
      continue;
    }

    const data = node.data as { nodeType: string; params: Record<string, unknown> };
    const def = NODE_DEFS[data.nodeType];
    if (!def) { currentId = null; break; }

    const step: ScriptStep = {
      id: node.id,
      type: def.stepType === 'start' ? 'wait' : def.stepType,
      params: { ...data.params },
    };

    // Handle loop children
    if (data.nodeType === 'repeat') {
      const bodyEdge = (adj.get(node.id) || []).find(e => e.handle === 'body');
      if (bodyEdge) {
        step.children = collectChain(bodyEdge.target, nodes, adj);
      }
    }

    steps.push(step);

    // Follow "next" edge
    const nextEdge = (adj.get(node.id) || []).find(e => !e.handle || e.handle === 'next');
    currentId = nextEdge?.target || null;
  }

  return steps;
}

// ============================================================
// ScriptStep[] → Graph (for editor display)
// ============================================================
export function scriptStepsToGraph(steps: ScriptStep[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let y = 50;
  const x = 300;

  // Start node
  const startId = 'start-node';
  nodes.push({ id: startId, type: 'start', position: { x, y }, data: {} });
  y += 100;

  let prevId = startId;

  for (const step of steps) {
    const nodeType = findNodeType(step);
    const rfType = getReactFlowType(nodeType);
    const nodeId = step.id || `node-${nodes.length}`;

    nodes.push({
      id: nodeId,
      type: rfType,
      position: { x, y },
      data: { nodeType, params: { ...step.params } },
    });

    edges.push({
      id: `e-${prevId}-${nodeId}`,
      source: prevId,
      target: nodeId,
      sourceHandle: prevId === startId ? undefined : 'next',
    });

    // Handle loop children
    if (step.type === 'repeat' && step.children?.length) {
      let childY = y;
      let childPrevId = nodeId;
      const childX = x + 280;

      for (const child of step.children) {
        childY += 100;
        const childNodeType = findNodeType(child);
        const childRfType = getReactFlowType(childNodeType);
        const childId = child.id || `child-${nodes.length}`;

        nodes.push({
          id: childId,
          type: childRfType,
          position: { x: childX, y: childY },
          data: { nodeType: childNodeType, params: { ...child.params } },
        });

        edges.push({
          id: `e-${childPrevId}-${childId}`,
          source: childPrevId,
          target: childId,
          sourceHandle: childPrevId === nodeId ? 'body' : undefined,
        });
        childPrevId = childId;
      }
      y = Math.max(y, childY);
    }

    y += 120;
    prevId = nodeId;
  }

  return { nodes, edges };
}

function findNodeType(step: ScriptStep): string {
  // Try exact match first
  for (const [key, def] of Object.entries(NODE_DEFS)) {
    if (def.stepType === step.type) {
      // Check params match
      if (step.type === 'launch' && step.params.bundleId === def.defaultParams.bundleId) return key;
      if (step.type === 'key' && step.params.key === def.defaultParams.key) return key;
      if (step.type === 'tap_image' && step.params.templateName === def.defaultParams.templateName) return key;
      if (step.type === 'swipe') {
        if (JSON.stringify(step.params) === JSON.stringify(def.defaultParams)) return key;
      }
    }
  }
  // Fallback to generic type
  if (step.type === 'wait') return 'wait';
  if (step.type === 'wait_random') return 'wait_random';
  if (step.type === 'repeat') return 'repeat';
  if (step.type === 'screenshot') return 'screenshot';
  if (step.type === 'type') return 'type_text';
  if (step.type === 'swipe') return 'swipe_up';
  if (step.type === 'tap_image') return 'tiktok_vn_heart';
  if (step.type === 'launch') return 'tiktok_vn_open';
  return 'wait';
}

function getReactFlowType(nodeType: string): string {
  const def = NODE_DEFS[nodeType];
  if (!def) return 'action';
  if (nodeType === 'start') return 'start';
  if (nodeType === 'repeat') return 'loop';
  if (def.stepType === 'tap_image') return 'tapImage';
  return 'action';
}
