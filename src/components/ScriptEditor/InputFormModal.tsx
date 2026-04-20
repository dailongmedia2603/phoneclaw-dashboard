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
              placeholder="VD: caption, video_id, post_url"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
            />
            <div className="text-xs text-slate-500 mt-1 space-y-0.5">
              <p>
                ID kỹ thuật của biến — dùng trong node:{' '}
                <code className="bg-slate-100 px-1 rounded">{`{{${form.name || 'name'}}}`}</code>
              </p>
              <p className="text-slate-400">
                Quy tắc: chữ thường, số, dấu <code>_</code>; không dấu/khoảng trắng. Đặt sẵn khi tạo,
                <strong> không sửa được sau này</strong>.
              </p>
            </div>
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
            <p className="text-xs text-slate-500 mt-1">
              Tên hiển thị cho người chạy script. Có thể dùng dấu/hoa thường/khoảng trắng.
            </p>
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
            <p className="text-xs text-slate-500 mt-1">
              Kiểu dữ liệu — quyết định ô nhập + cách kiểm tra.{typeHint && ` ${typeHint}.`}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={!!form.required}
                onChange={(e) => setForm({ ...form, required: e.target.checked })}
              />
              Bắt buộc nhập khi chạy
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Tick: thiếu giá trị → script không chạy. Bỏ tick: có thể bỏ trống (sẽ dùng giá trị mặc định nếu có).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả (tooltip)</label>
            <input
              type="text"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="VD: Tối đa 2200 ký tự cho TikTok"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Hướng dẫn ngắn — hiển thị dưới ô nhập khi người dùng/bot chạy script.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị mặc định</label>
            <input
              type="text"
              value={form.default !== undefined ? String(form.default) : ''}
              onChange={(e) =>
                setForm({ ...form, default: e.target.value === '' ? undefined : e.target.value })
              }
              placeholder={
                form.type === 'boolean'
                  ? 'true / false'
                  : form.type === 'number'
                  ? 'VD: 5'
                  : 'VD: #fyp #viral'
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Tự động dùng khi người chạy bỏ trống ô này. Để trống nếu không cần default.
            </p>
          </div>

          {(form.type === 'string' || form.type === 'text') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max length (số ký tự tối đa)
              </label>
              <input
                type="number"
                value={form.maxLength ?? ''}
                onChange={(e) =>
                  setForm({ ...form, maxLength: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="VD: 2200 (TikTok caption)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Vượt quá → báo đỏ, không gửi được. Để trống nếu không giới hạn.
              </p>
            </div>
          )}

          {form.type === 'number' && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Khoảng giá trị cho phép</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Min (nhỏ nhất)</label>
                  <input
                    type="number"
                    value={form.min ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, min: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="VD: 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Max (lớn nhất)</label>
                  <input
                    type="number"
                    value={form.max ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, max: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="VD: 50"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Để trống cả 2 nếu không giới hạn. Nhập sai khoảng → báo đỏ.
              </p>
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
                placeholder="vn&#10;us&#10;eu"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Người chạy chỉ chọn được 1 trong các giá trị này. Nhập khác → báo lỗi.
              </p>
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
