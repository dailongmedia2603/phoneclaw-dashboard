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

  // --- TikTok Việt ---
  tiktok_vn_open: {
    nodeType: 'tiktok_vn_open', label: 'Mở TikTok VN', category: 'tiktok_vn',
    color: '#000000', bgColor: '#f8fafc', icon: 'music',
    stepType: 'launch', defaultParams: { bundleId: 'com.ss.iphone.ugc.Ame' }, fields: [],
  },
  tiktok_vn_heart: {
    nodeType: 'tiktok_vn_heart', label: 'Thả tim', category: 'tiktok_vn',
    color: '#ef4444', bgColor: '#fef2f2', icon: 'heart',
    stepType: 'double_tap',
    defaultParams: { x: 0.5, y: 0.4, delay: 0.1 },
    fields: [],
  },
  tiktok_vn_comment: {
    nodeType: 'tiktok_vn_comment', label: 'Bình luận', category: 'tiktok_vn',
    color: '#3b82f6', bgColor: '#eff6ff', icon: 'message',
    stepType: 'tap',
    defaultParams: { x: 0.923, y: 0.607 },
    fields: [],
  },
  tiktok_vn_share: {
    nodeType: 'tiktok_vn_share', label: 'Chia sẻ', category: 'tiktok_vn',
    color: '#3b82f6', bgColor: '#eff6ff', icon: 'share',
    stepType: 'tap_image',
    defaultParams: { templateName: 'tiktok_share', threshold: 0.6, retries: 2, retryDelay: 2, fallbackX: 0.93, fallbackY: 0.65 },
    fields: [{ key: 'threshold', label: 'Ngưỡng', type: 'number' }],
  },
  tiktok_vn_follow: {
    nodeType: 'tiktok_vn_follow', label: 'Theo dõi', category: 'tiktok_vn',
    color: '#ef4444', bgColor: '#fef2f2', icon: 'user_plus',
    stepType: 'tap_image',
    defaultParams: { templateName: 'tiktok_follow', threshold: 0.6, retries: 2, retryDelay: 2, fallbackX: 0.93, fallbackY: 0.35 },
    fields: [{ key: 'threshold', label: 'Ngưỡng', type: 'number' }],
  },
  tiktok_vn_bookmark: {
    nodeType: 'tiktok_vn_bookmark', label: 'Lưu video', category: 'tiktok_vn',
    color: '#f59e0b', bgColor: '#fffbeb', icon: 'bookmark',
    stepType: 'tap_image',
    defaultParams: { templateName: 'tiktok_bookmark', threshold: 0.6, retries: 2, retryDelay: 2, fallbackX: 0.93, fallbackY: 0.6 },
    fields: [{ key: 'threshold', label: 'Ngưỡng', type: 'number' }],
  },
  tiktok_vn_foryou: {
    nodeType: 'tiktok_vn_foryou', label: 'Tab For You', category: 'tiktok_vn',
    color: '#000000', bgColor: '#f8fafc', icon: 'home',
    stepType: 'tap_image',
    defaultParams: { templateName: 'tiktok_foryou', threshold: 0.5, retries: 2, retryDelay: 2, fallbackX: 0.5, fallbackY: 0.04 },
    fields: [],
  },
  tiktok_vn_search: {
    nodeType: 'tiktok_vn_search', label: 'Tìm kiếm', category: 'tiktok_vn',
    color: '#000000', bgColor: '#f8fafc', icon: 'search',
    stepType: 'tap_image',
    defaultParams: { templateName: 'tiktok_search', threshold: 0.5, retries: 2, retryDelay: 2, fallbackX: 0.93, fallbackY: 0.04 },
    fields: [],
  },

  // --- TikTok US ---
  tiktok_us_open: {
    nodeType: 'tiktok_us_open', label: 'Mở TikTok US', category: 'tiktok_us',
    color: '#2563eb', bgColor: '#eff6ff', icon: 'globe',
    stepType: 'launch', defaultParams: { bundleId: 'com.zhiliaoapp.musically' }, fields: [],
  },
  tiktok_us_heart: {
    nodeType: 'tiktok_us_heart', label: 'Thả tim (US)', category: 'tiktok_us',
    color: '#ef4444', bgColor: '#fef2f2', icon: 'heart',
    stepType: 'double_tap',
    defaultParams: { x: 0.5, y: 0.4, delay: 0.1 },
    fields: [],
  },

  // --- Facebook ---
  fb_open: {
    nodeType: 'fb_open', label: 'Mở Facebook', category: 'facebook',
    color: '#1877f2', bgColor: '#eff6ff', icon: 'facebook',
    stepType: 'launch', defaultParams: { bundleId: 'com.facebook.Facebook' }, fields: [],
  },
  fb_like: {
    nodeType: 'fb_like', label: 'Like (FB)', category: 'facebook',
    color: '#1877f2', bgColor: '#eff6ff', icon: 'thumbs_up',
    stepType: 'tap_image',
    defaultParams: { templateName: 'fb_like', threshold: 0.6, retries: 2, retryDelay: 2 },
    fields: [{ key: 'threshold', label: 'Ngưỡng', type: 'number' }],
  },
  fb_comment: {
    nodeType: 'fb_comment', label: 'Comment (FB)', category: 'facebook',
    color: '#1877f2', bgColor: '#eff6ff', icon: 'message',
    stepType: 'tap_image',
    defaultParams: { templateName: 'fb_comment', threshold: 0.6, retries: 2, retryDelay: 2 },
    fields: [{ key: 'threshold', label: 'Ngưỡng', type: 'number' }],
  },
  fb_share: {
    nodeType: 'fb_share', label: 'Share (FB)', category: 'facebook',
    color: '#1877f2', bgColor: '#eff6ff', icon: 'share',
    stepType: 'tap_image',
    defaultParams: { templateName: 'fb_share', threshold: 0.6, retries: 2, retryDelay: 2 },
    fields: [{ key: 'threshold', label: 'Ngưỡng', type: 'number' }],
  },
};

export const NODE_CATEGORIES = [
  { id: 'common', label: 'Cơ bản', color: '#10b981' },
  { id: 'device', label: 'Điều khiển', color: '#6366f1' },
  { id: 'tiktok_vn', label: 'TikTok Việt', color: '#000000' },
  { id: 'tiktok_us', label: 'TikTok US', color: '#2563eb' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2' },
];

export function getNodesByCategory(categoryId: string): NodeDef[] {
  return Object.values(NODE_DEFS).filter(d => d.category === categoryId);
}
