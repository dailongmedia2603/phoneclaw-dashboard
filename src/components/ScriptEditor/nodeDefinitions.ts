import type { ScriptStepType } from '../../types';

export interface NodeDef {
  nodeType: string;
  label: string;
  category: string;
  color: string;
  bgColor: string;
  icon: string; // Lucide icon name from nodeIcons.tsx
  stepType: ScriptStepType | 'start';
  defaultParams: Record<string, unknown>;
  fields: { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[];
}

export const NODE_DEFS: Record<string, NodeDef> = {
  // --- Common ---
  start: {
    nodeType: 'start', label: 'Bắt đầu', category: 'common',
    color: '#10b981', bgColor: '#ecfdf5', icon: 'play',
    stepType: 'start', defaultParams: {}, fields: [],
  },
  wait: {
    nodeType: 'wait', label: 'Chờ', category: 'common',
    color: '#f59e0b', bgColor: '#fffbeb', icon: 'clock',
    stepType: 'wait', defaultParams: { seconds: 5 },
    fields: [{ key: 'seconds', label: 'Giây', type: 'number' }],
  },
  wait_random: {
    nodeType: 'wait_random', label: 'Chờ ngẫu nhiên', category: 'common',
    color: '#f59e0b', bgColor: '#fffbeb', icon: 'shuffle',
    stepType: 'wait_random', defaultParams: { min: 3, max: 8 },
    fields: [
      { key: 'min', label: 'Min (s)', type: 'number' },
      { key: 'max', label: 'Max (s)', type: 'number' },
    ],
  },
  repeat: {
    nodeType: 'repeat', label: 'Lặp lại', category: 'common',
    color: '#8b5cf6', bgColor: '#f5f3ff', icon: 'repeat',
    stepType: 'repeat', defaultParams: { count: 5 },
    fields: [{ key: 'count', label: 'Số lần', type: 'number' }],
  },
  screenshot: {
    nodeType: 'screenshot', label: 'Chụp ảnh', category: 'common',
    color: '#06b6d4', bgColor: '#ecfeff', icon: 'camera',
    stepType: 'screenshot', defaultParams: {}, fields: [],
  },

  // --- Device Control ---
  home: {
    nodeType: 'home', label: 'Nút Home', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'home',
    stepType: 'key', defaultParams: { key: 'home' }, fields: [],
  },
  swipe_up: {
    nodeType: 'swipe_up', label: 'Lướt lên', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'arrow_up',
    stepType: 'swipe',
    defaultParams: { fromX: 0.5, fromY: 0.8, toX: 0.5, toY: 0.2, duration: 0.3 },
    fields: [],
  },
  swipe_down: {
    nodeType: 'swipe_down', label: 'Lướt xuống', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'arrow_down',
    stepType: 'swipe',
    defaultParams: { fromX: 0.5, fromY: 0.35, toX: 0.5, toY: 0.85, duration: 0.4 },
    fields: [],
  },
  swipe_left: {
    nodeType: 'swipe_left', label: 'Lướt trái', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'arrow_left',
    stepType: 'swipe',
    defaultParams: { fromX: 0.95, fromY: 0.5, toX: 0.05, toY: 0.5, duration: 0.3 },
    fields: [],
  },
  swipe_right: {
    nodeType: 'swipe_right', label: 'Lướt phải', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'arrow_right',
    stepType: 'swipe',
    defaultParams: { fromX: 0.05, fromY: 0.5, toX: 0.95, toY: 0.5, duration: 0.3 },
    fields: [],
  },
  tap_custom: {
    nodeType: 'tap_custom', label: 'Tap toạ độ', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'crosshair',
    stepType: 'tap', defaultParams: { x: 0.5, y: 0.5 },
    fields: [
      { key: 'x', label: 'X (0-1)', type: 'number' },
      { key: 'y', label: 'Y (0-1)', type: 'number' },
    ],
  },
  swipe_custom: {
    nodeType: 'swipe_custom', label: 'Vuốt toạ độ', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'move',
    stepType: 'swipe',
    defaultParams: { fromX: 0.5, fromY: 0.7, toX: 0.5, toY: 0.3, duration: 0.3 },
    fields: [
      { key: 'fromX', label: 'Từ X', type: 'number' },
      { key: 'fromY', label: 'Từ Y', type: 'number' },
      { key: 'toX', label: 'Đến X', type: 'number' },
      { key: 'toY', label: 'Đến Y', type: 'number' },
      { key: 'duration', label: 'Thời gian (s)', type: 'number' },
    ],
  },
  type_text: {
    nodeType: 'type_text', label: 'Gõ text', category: 'device',
    color: '#6366f1', bgColor: '#eef2ff', icon: 'keyboard',
    stepType: 'type', defaultParams: { text: '' },
    fields: [{ key: 'text', label: 'Nội dung', type: 'text' }],
  },

  // --- Ứng dụng (App Launchers) ---
  tiktok_vn_open: {
    nodeType: 'tiktok_vn_open', label: 'Mở TikTok VN', category: 'apps',
    color: '#000000', bgColor: '#f8fafc', icon: 'music',
    stepType: 'launch', defaultParams: { bundleId: 'com.ss.iphone.ugc.Ame' }, fields: [],
  },
  tiktok_us_open: {
    nodeType: 'tiktok_us_open', label: 'Mở TikTok US', category: 'apps',
    color: '#2563eb', bgColor: '#eff6ff', icon: 'globe',
    stepType: 'launch', defaultParams: { bundleId: 'com.zhiliaoapp.musically' }, fields: [],
  },
  fb_open: {
    nodeType: 'fb_open', label: 'Mở Facebook', category: 'apps',
    color: '#1877f2', bgColor: '#eff6ff', icon: 'facebook',
    stepType: 'launch', defaultParams: { bundleId: 'com.facebook.Facebook' }, fields: [],
  },
};

export const NODE_CATEGORIES = [
  { id: 'common', label: 'Cơ bản', color: '#10b981' },
  { id: 'device', label: 'Điều khiển', color: '#6366f1' },
  { id: 'apps', label: 'Ứng dụng', color: '#8b5cf6' },
  { id: 'custom', label: 'Tuỳ chỉnh', color: '#f97316' },
];

/** Create a NodeDef for a custom node (same behavior as tap nodes) */
export function makeCustomNodeDef(id: string, name: string): NodeDef {
  return {
    nodeType: `custom_${id}`,
    label: name,
    category: 'custom',
    color: '#f97316',
    bgColor: '#fff7ed',
    icon: 'target',
    stepType: 'tap',
    defaultParams: { x: 0.5, y: 0.5 },
    fields: [
      { key: 'x', label: 'X (0-1)', type: 'number' },
      { key: 'y', label: 'Y (0-1)', type: 'number' },
    ],
  };
}

export function getNodesByCategory(categoryId: string, extraDefs?: Record<string, NodeDef>): NodeDef[] {
  const allDefs = extraDefs ? { ...NODE_DEFS, ...extraDefs } : NODE_DEFS;
  return Object.values(allDefs).filter(d => d.category === categoryId);
}
