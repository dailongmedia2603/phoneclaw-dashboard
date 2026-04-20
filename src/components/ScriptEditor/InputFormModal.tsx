import { useState } from 'react';
import { X } from 'lucide-react';
import type { ScriptInput, ScriptInputType } from '../../types';
import { INPUT_NAME_RE } from '../../lib/placeholders';

const TYPE_OPTIONS: { value: ScriptInputType; label: string; hint: string }[] = [
  { value: 'string', label: 'Chuỗi ngắn', hint: 'Một dòng text' },
  { value: 'text', label: 'Văn bản dài', hint: 'Nhiều dòng (caption, mô tả)' },
  { value: 'number', label: 'Số', hint: 'Có thể giới hạn min/max' },
  { value: 'boolean', label: 'Đúng/Sai', hint: 'Checkbox' },
  { value: 'url', label: 'URL', hint: 'Chỉ http/https' },
  { value: 'video', label: 'Video', hint: 'Chọn từ thư viện của bạn' },
  { value: 'enum', label: 'Danh sách chọn', hint: 'Một trong các options' },
];

interface Props {
  initial?: Partial<ScriptInput>;
  existingNames: string[];
  onSave: (input: ScriptInput) => void;
  onCancel: () => void;
}

export default function InputFormModal({ initial, existingNames, onSave, onCancel }: Props) {
  const isEditing = !!initial?.name;
  const [form, setForm] = useState<Partial<ScriptInput>>({
    type: 'string',
    required: false,
    ...initial,
  });
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.name || !INPUT_NAME_RE.test(form.name)) {
      setError('Name phải là lowercase, chỉ chữ/số/_, bắt đầu bằng chữ hoặc _ (tối đa 64 ký tự)');
      return;
    }
    if (!isEditing && existingNames.includes(form.name)) {
      setError(`Biến "${form.name}" đã tồn tại`);
      return;
    }
    if (!form.label?.trim()) {
      setError('Label bắt buộc');
      return;
    }
    if (!form.type) {
      setError('Type bắt buộc');
      return;
    }
    if (form.type === 'enum' && (!form.options || form.options.length === 0)) {
      setError('Enum type phải có ít nhất 1 option');
      return;
    }
    setError('');
    onSave(form as ScriptInput);
  };

  const typeHint = TYPE_OPTIONS.find((o) => o.value === form.type)?.hint;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold">{isEditing ? 'Sửa biến' : 'Thêm biến mới'}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name (slug) *</label>
            <input
              type="text"
              value={form.name ?? ''}
              disabled={isEditing}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: caption, video_id"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Sẽ dùng trong node: <code className="bg-slate-100 px-1 rounded">{`{{${form.name || 'name'}}}`}</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Label *</label>
            <input
              type="text"
              value={form.label ?? ''}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="VD: Nội dung caption"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ScriptInputType })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {typeHint && <p className="text-xs text-slate-500 mt-1">{typeHint}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
            />
            Bắt buộc nhập khi chạy
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả (tooltip)</label>
            <input
              type="text"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Giải thích cho người chạy script"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị mặc định</label>
            <input
              type="text"
              value={form.default !== undefined ? String(form.default) : ''}
              onChange={(e) =>
                setForm({ ...form, default: e.target.value === '' ? undefined : e.target.value })
              }
              placeholder="Để trống nếu không có"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          {(form.type === 'string' || form.type === 'text') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max length</label>
              <input
                type="number"
                value={form.maxLength ?? ''}
                onChange={(e) =>
                  setForm({ ...form, maxLength: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}

          {form.type === 'number' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min</label>
                <input
                  type="number"
                  value={form.min ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, min: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max</label>
                <input
                  type="number"
                  value={form.max ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, max: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {form.type === 'enum' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Options (mỗi dòng 1 giá trị) *
              </label>
              <textarea
                rows={4}
                value={form.options?.join('\n') ?? ''}
                onChange={(e) =>
                  setForm({ ...form, options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })
                }
                placeholder="option1&#10;option2&#10;option3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          )}

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end p-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
