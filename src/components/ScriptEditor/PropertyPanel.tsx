import { useState, useEffect, useRef } from 'react';
import type { Node } from '@xyflow/react';
import { NODE_DEFS, type NodeDef } from './nodeDefinitions';
import NodeIcon from './nodeIcons';
import { Trash2, Crosshair, Clock, ChevronDown, Check, X } from 'lucide-react';
import { videos as videosApi, socialAccounts as socialAccountsApi } from '../../services/api';
import CustomSelect from '../CustomSelect';
import type { Video, SocialAccount } from '../../types';

interface PropertyPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, params: Record<string, unknown>) => void;
  onDeleteNode?: (nodeId: string) => void;
  onPickCoordinate?: (fieldPrefix: string) => void;
  extraDefs?: Record<string, NodeDef>;
}

/** Check if the node has pickable coordinate fields */
function getPickableFields(nodeType: string, extraDefs?: Record<string, NodeDef>): { prefix: string; label: string }[] {
  const allDefs = extraDefs ? { ...NODE_DEFS, ...extraDefs } : NODE_DEFS;
  const def = allDefs[nodeType];
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

  // Clear photos: deleteX/deleteY + trashDeleteX/trashDeleteY
  if (keys.includes('deleteX') && keys.includes('deleteY')) {
    result.push({ prefix: 'delete', label: 'Chọn vị trí nút Delete' });
  }
  if (keys.includes('trashDeleteX') && keys.includes('trashDeleteY')) {
    result.push({ prefix: 'trashDelete', label: 'Chọn vị trí nút Delete thùng rác' });
  }

  // TapX/TapY pattern
  if (keys.includes('tapX') && keys.includes('tapY')) {
    result.push({ prefix: 'tap', label: 'Chọn vị trí tap' });
  }

  // Login account: usernameX/usernameY + passwordX/passwordY
  if (keys.includes('usernameX') && keys.includes('usernameY')) {
    result.push({ prefix: 'username', label: 'Chọn vị trí nhập Tài khoản' });
  }
  if (keys.includes('passwordX') && keys.includes('passwordY')) {
    result.push({ prefix: 'password', label: 'Chọn vị trí nhập Mật khẩu' });
  }

  // Login mail: emailX/emailY + emailPassX/emailPassY
  if (keys.includes('emailX') && keys.includes('emailY')) {
    result.push({ prefix: 'email', label: 'Chọn vị trí nhập Email' });
  }
  if (keys.includes('emailPassX') && keys.includes('emailPassY')) {
    result.push({ prefix: 'emailPass', label: 'Chọn vị trí nhập Pass Mail' });
  }

  return result;
}

/** Dropdown multi-select for social accounts */
function AccountMultiSelect({ accounts, selectedIds, onChange }: {
  accounts: SocialAccount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  const removeTag = (id: string) => {
    onChange(selectedIds.filter(x => x !== id));
  };

  const selectedAccounts = selectedIds
    .map(id => accounts.find(a => a.id === id))
    .filter(Boolean) as SocialAccount[];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-600">
        Chọn tài khoản ({selectedIds.length} đã chọn)
      </label>

      <div ref={ref} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        >
          <span className={selectedIds.length > 0 ? 'text-slate-900 text-xs' : 'text-slate-400 text-xs'}>
            {selectedIds.length > 0 ? `${selectedIds.length} tài khoản` : 'Chọn tài khoản...'}
          </span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto py-1 scrollbar-thin">
            {accounts.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center">Chưa có tài khoản. Thêm ở menu Tài khoản.</p>
            ) : accounts.map(acc => {
              const checked = selectedIds.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => toggle(acc.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    checked ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                  }`}>
                    {checked && <Check size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-700 truncate block">{acc.username}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{acc.channel} · {acc.email || 'Không email'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected tags */}
      {selectedAccounts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedAccounts.map(acc => (
            <span key={acc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium">
              {acc.username}
              <button onClick={() => removeTag(acc.id)} className="hover:text-blue-900">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-400">
        Khi chạy nhiều thiết bị, hệ thống tự phân phối mỗi thiết bị 1 tài khoản (round-robin).
      </p>
    </div>
  );
}

export default function PropertyPanel({ selectedNode, onUpdateNode, onDeleteNode, onPickCoordinate, extraDefs }: PropertyPanelProps) {
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [accountList, setAccountList] = useState<SocialAccount[]>([]);

  // Load videos for send_file node
  useEffect(() => {
    const nodeData = selectedNode?.data as any;
    if (nodeData?.nodeType === 'send_file') {
      videosApi.getAll().then(res => {
        if (res.success && res.data) setVideoList(res.data);
      });
    }
  }, [selectedNode?.id]);

  // Load social accounts for login_account / login_mail nodes
  useEffect(() => {
    const nodeData = selectedNode?.data as any;
    if (nodeData?.nodeType === 'login_account' || nodeData?.nodeType === 'login_mail') {
      socialAccountsApi.getAll().then(res => {
        if (res.success && res.data) setAccountList(res.data);
      });
    }
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <div className="w-64 bg-white border-l border-slate-200 flex items-center justify-center p-4">
        <p className="text-sm text-slate-400 text-center">Chọn 1 node để xem thuộc tính</p>
      </div>
    );
  }

  const nodeData = selectedNode.data as { nodeType: string; params: Record<string, unknown> };
  const allDefs = extraDefs ? { ...NODE_DEFS, ...extraDefs } : NODE_DEFS;
  const def = allDefs[nodeData?.nodeType];
  const isStart = selectedNode.type === 'start';
  const pickableFields = nodeData?.nodeType ? getPickableFields(nodeData.nodeType, extraDefs) : [];

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
          {/* Special: videoId field → show video picker dropdown */}
          {field.key === 'videoId' && (nodeData.nodeType === 'send_file' || nodeData.nodeType === 'select_video') ? (
            <>
              <label className="block text-xs font-medium text-slate-600 mb-1">Chọn Video</label>
              <CustomSelect
                value={String(nodeData.params?.videoId || '')}
                onChange={v => {
                  const video = videoList.find(vid => vid.id === v);
                  onUpdateNode(selectedNode.id, { ...nodeData.params, videoId: v, videoName: video?.name || '' });
                }}
                options={videoList.map(v => ({ value: v.id, label: v.name }))}
                placeholder="Chọn video từ thư viện..."
              />
            </>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={String(nodeData.params?.[field.key] ?? '')}
                onChange={e => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </>
          )}
        </div>
      ))}

      {/* send_file: timeout info */}
      {nodeData.nodeType === 'send_file' && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Clock size={12} /> Timeout: 20 phút
          </div>
          <p className="text-[10px] text-slate-400">Nếu iPhone tải xong sẽ vẫn tiếp tục mà không phải chờ 20 phút xong mới tiếp tục.</p>
        </div>
      )}

      {/* select_video: info */}
      {nodeData.nodeType === 'select_video' && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">Tap vào video mới nhất trong Photos picker. Đặt node này ngay sau &quot;Truyền File&quot; để chọn đúng video vừa truyền.</p>
          <p className="text-[10px] text-slate-400 mt-1">Tap X/Y là tọa độ thumbnail đầu tiên trong picker (có thể chỉnh nếu cần).</p>
        </div>
      )}

      {/* Login account / Login mail: dropdown multi-select accounts */}
      {(nodeData.nodeType === 'login_account' || nodeData.nodeType === 'login_mail') && (
        <AccountMultiSelect
          accounts={accountList}
          selectedIds={(nodeData.params?.accountIds as string[]) || []}
          onChange={(ids) => onUpdateNode(selectedNode.id, { ...nodeData.params, accountIds: ids })}
        />
      )}

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
