import type { Node, Edge } from '@xyflow/react';

const NODE_HEIGHT = 60;
const GAP_Y = 30;

// === Helper: BFS từ start node → trả về nodes theo thứ tự thực thi ===
function getNodeOrder(nodes: Node[], edges: Edge[]): Node[] {
  const startNode = nodes.find(n => n.type === 'start' || n.id === 'start-node');
  if (!startNode) return nodes;

  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }

  const ordered: Node[] = [];
  const visited = new Set<string>();
  const queue = [startNode.id];
  visited.add(startNode.id);

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodes.find(n => n.id === id);
    if (node) ordered.push(node);
    for (const next of adj.get(id) || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  // Orphan nodes (không kết nối)
  for (const n of nodes) {
    if (!visited.has(n.id)) ordered.push(n);
  }

  return ordered;
}

// === PROFESSIONAL: top-to-bottom, centered ===
export function layoutProfessional(nodes: Node[], edges: Edge[]): Node[] {
  const ordered = getNodeOrder(nodes, edges);
  return ordered.map((node, i) => ({
    ...node,
    position: { x: 300, y: 50 + i * (NODE_HEIGHT + GAP_Y) },
  }));
}

// === CREATIVE PATTERNS ===

// Zigzag: xen kẽ trái-phải
function layoutZigzag(ordered: Node[]): Node[] {
  return ordered.map((node, i) => ({
    ...node,
    position: {
      x: 280 + (i % 2 === 0 ? -120 : 120),
      y: 50 + i * (NODE_HEIGHT + GAP_Y),
    },
  }));
}

// Wave: sóng sin mượt
function layoutWave(ordered: Node[]): Node[] {
  return ordered.map((node, i) => ({
    ...node,
    position: {
      x: 300 + Math.sin(i * 0.9) * 140,
      y: 50 + i * (NODE_HEIGHT + GAP_Y),
    },
  }));
}

// Spiral: xoắn ốc ra ngoài
function layoutSpiral(ordered: Node[]): Node[] {
  const cx = 350, cy = 300;
  return ordered.map((node, i) => {
    const angle = i * 0.8;
    const radius = 50 + i * 42;
    return {
      ...node,
      position: {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      },
    };
  });
}

// Staircase: bậc thang xiên xuống
function layoutStaircase(ordered: Node[]): Node[] {
  return ordered.map((node, i) => ({
    ...node,
    position: {
      x: 80 + i * 70,
      y: 50 + i * (NODE_HEIGHT + GAP_Y * 0.8),
    },
  }));
}

// Circle: vòng tròn
function layoutCircle(ordered: Node[]): Node[] {
  const n = ordered.length;
  const radius = Math.max(130, n * 30);
  const cx = 350, cy = radius + 60;
  return ordered.map((node, i) => ({
    ...node,
    position: {
      x: cx + Math.cos((2 * Math.PI * i) / n - Math.PI / 2) * radius,
      y: cy + Math.sin((2 * Math.PI * i) / n - Math.PI / 2) * radius,
    },
  }));
}

const CREATIVE_LAYOUTS = [layoutZigzag, layoutWave, layoutSpiral, layoutStaircase, layoutCircle];
const CREATIVE_NAMES = ['Zigzag ⚡', 'Sóng 🌊', 'Xoắn ốc 🌀', 'Bậc thang 📐', 'Vòng tròn ⭕'];

// Random 1 trong 5 pattern mỗi lần bấm
export function layoutCreative(nodes: Node[], edges: Edge[]): { nodes: Node[]; patternName: string } {
  const ordered = getNodeOrder(nodes, edges);
  const idx = Math.floor(Math.random() * CREATIVE_LAYOUTS.length);
  return {
    nodes: CREATIVE_LAYOUTS[idx](ordered),
    patternName: CREATIVE_NAMES[idx],
  };
}
