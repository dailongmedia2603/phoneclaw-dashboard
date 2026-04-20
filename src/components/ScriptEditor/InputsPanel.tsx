import { useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Wand2 } from 'lucide-react';
import type { ScriptInput } from '../../types';
import InputFormModal from './InputFormModal';
import { scripts as scriptsApi } from '../../services/api';

const TYPE_ICONS: Record<string, string> = {
  string: '📝',
  text: '📄',
  number: '#️⃣',
  boolean: '☑️',
  url: '🔗',
  video: '🎬',
  enum: '📋',
};

interface Props {
  inputs: ScriptInput[];
  placeholdersInSteps: string[];
  onChange: (inputs: ScriptInput[]) => void;
  /** If provided, enables "auto-create" button that queries /suggested-inputs. */
  scriptId?: string;
}

export default function InputsPanel({ inputs, placeholdersInSteps, onChange, scriptId }: Props) {
  const [editing, setEditing] = useState<Partial<ScriptInput> | null>(null);
  const [adding, setAdding] = useState(false);

  const declaredNames = new Set(inputs.map((i) => i.name));
  const missing = placeholdersInSteps.filter((p) => !declaredNames.has(p));
  const unused = inputs.filter((i) => !placeholdersInSteps.includes(i.name));

  const save = (updated: ScriptInput) => {
    const idx = inputs.findIndex((i) => i.name === updated.name);
    if (idx >= 0) {
      const clone = [...inputs];
      clone[idx] = updated;
      onChange(clone);
    } else {
      onChange([...inputs, updated]);
    }
    setEditing(null);
    setAdding(false);
  };

  const remove = (name: string) => {
    if (!confirm(`Xoá biến "${name}"?`)) return;
    onChange(inputs.filter((i) => i.name !== name));
  };

  const createFromMissing = (name: string) => {
    // Infer type from name heuristic
    const lower = name.toLowerCase();
    let type: ScriptInput['type'] = 'string';
    if (lower.includes('video') || lower.endsWith('_file')) type = 'video';
    else if (lower.endsWith('_url') || lower === 'url') type = 'url';
    else if (lower === 'caption' || lower.includes('content') || lower.includes('desc') || lower.includes('text')) type = 'text';

    setEditing({
      name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type,
      required: true,
    });
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Biến đầu vào</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tái sử dụng kịch bản cho nhiều dữ liệu</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
        >
          <Plus size={14} /> Thêm biến
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {inputs.length === 0 && missing.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Chưa khai báo biến nào.</p>
            <p className="text-xs mt-1">
              Sử dụng <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code> trong các node
              để tạo biến tự động.
            </p>
          </div>
        )}

        {inputs.map((inp) => {
          const isUnused = unused.some((u) => u.name === inp.name);
          return (
            <div
              key={inp.name}
              className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 group"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">{TYPE_ICONS[inp.type] ?? '❓'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-medium text-slate-800">{`{{${inp.name}}}`}</code>
                    {inp.required && (
                      <span className="text-xs text-red-500 font-medium">*bắt buộc</span>
                    )}
                    {isUnused && (
                      <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                        chưa dùng
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-700 mt-0.5">{inp.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {inp.type}
                    {inp.default !== undefined && ` · default: ${JSON.stringify(inp.default)}`}
                    {inp.maxLength !== undefined && ` · max ${inp.maxLength} ký tự`}
                    {inp.min !== undefined && ` · min ${inp.min}`}
                    {inp.max !== undefined && ` · max ${inp.max}`}
                    {inp.options && ` · [${inp.options.join(', ')}]`}
                  </div>
                  {inp.description && (
                    <div className="text-xs text-slate-500 mt-1 italic">{inp.description}</div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(inp)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(inp.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Xoá"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {missing.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900">
                  Biến dùng trong steps nhưng chưa khai báo:
                </div>
                <ul className="mt-2 space-y-1">
                  {missing.map((m) => (
                    <li key={m} className="flex items-center gap-2">
                      <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-yellow-300">{`{{${m}}}`}</code>
                      <button
                        onClick={() => createFromMissing(m)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Tạo entry
                      </button>
                    </li>
                  ))}
                </ul>
                {scriptId && missing.length > 1 && (
                  <button
                    onClick={async () => {
                      const res = await scriptsApi.getSuggestedInputs(scriptId);
                      if (res.success && res.data) {
                        const added = [...inputs, ...res.data.suggestions];
                        onChange(added);
                      }
                    }}
                    className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                  >
                    <Wand2 size={12} /> Tạo tự động {missing.length} biến
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {(adding || editing) && (
        <InputFormModal
          initial={editing ?? undefined}
          existingNames={inputs.map((i) => i.name)}
          onSave={save}
          onCancel={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
