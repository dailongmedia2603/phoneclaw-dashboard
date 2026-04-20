import { useEffect, useState } from 'react';
import type { ScriptInput, Video } from '../types';
import { videos as videosApi } from '../services/api';

interface Props {
  spec: ScriptInput;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}

export default function VariableField({ spec, value, onChange, error }: Props) {
  const requiredMark = spec.required ? <span className="text-red-500 ml-1">*</span> : null;
  const hint = spec.description ? (
    <p className="text-xs text-slate-500 mt-1">{spec.description}</p>
  ) : null;
  const errView = error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null;

  const labelRow = (
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {spec.label}
      {requiredMark}
    </label>
  );

  const baseInputClass =
    'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (spec.type === 'text') {
    const text = value !== undefined && value !== null ? String(value) : String(spec.default ?? '');
    return (
      <div>
        {labelRow}
        <textarea
          value={text}
          rows={8}
          placeholder={spec.placeholder ?? 'Mỗi dòng một nội dung — script sẽ dùng toàn bộ chuỗi (kể cả xuống dòng).'}
          maxLength={spec.maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} font-mono resize-y min-h-[140px]`}
        />
        {spec.maxLength !== undefined && (
          <p className="text-xs text-slate-400 text-right">
            {text.length}/{spec.maxLength}
          </p>
        )}
        {hint}
        {errView}
      </div>
    );
  }

  if (spec.type === 'string') {
    // Multi-line textarea so user can paste many items (1 per line) or long single-line.
    const text = value !== undefined && value !== null ? String(value) : String(spec.default ?? '');
    return (
      <div>
        {labelRow}
        <textarea
          value={text}
          rows={4}
          placeholder={spec.placeholder ?? 'Nội dung — có thể nhiều dòng'}
          maxLength={spec.maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} resize-y min-h-[80px]`}
        />
        {spec.maxLength !== undefined && (
          <p className="text-xs text-slate-400 text-right">
            {text.length}/{spec.maxLength}
          </p>
        )}
        {hint}
        {errView}
      </div>
    );
  }

  if (spec.type === 'url') {
    return (
      <div>
        {labelRow}
        <input
          type="url"
          value={value !== undefined && value !== null ? String(value) : String(spec.default ?? '')}
          placeholder={spec.placeholder}
          maxLength={spec.maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
        {hint}
        {errView}
      </div>
    );
  }

  if (spec.type === 'number') {
    return (
      <div>
        {labelRow}
        <input
          type="number"
          min={spec.min}
          max={spec.max}
          value={value !== undefined && value !== null ? String(value) : String(spec.default ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={baseInputClass}
        />
        {hint}
        {errView}
      </div>
    );
  }

  if (spec.type === 'boolean') {
    const checked =
      value === true ||
      value === 'true' ||
      (value === undefined && spec.default === true);
    return (
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            {spec.label}
            {requiredMark}
          </span>
        </label>
        {hint}
        {errView}
      </div>
    );
  }

  if (spec.type === 'enum') {
    return (
      <div>
        {labelRow}
        <select
          value={value !== undefined && value !== null ? String(value) : String(spec.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">-- Chọn --</option>
          {spec.options!.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {hint}
        {errView}
      </div>
    );
  }

  if (spec.type === 'video') {
    return (
      <div>
        {labelRow}
        <VideoPickerInline value={value as string | undefined} onChange={onChange} />
        {hint}
        {errView}
      </div>
    );
  }

  return null;
}

function VideoPickerInline({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    videosApi.getAll().then((res) => {
      if (res.success && res.data) setVideos(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-xs text-slate-400">Đang tải danh sách video...</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
        Chưa có video nào. Vào trang "Video" để upload hoặc gọi API{' '}
        <code>POST /videos/register</code> để đăng ký qua URL.
      </div>
    );
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
    >
      <option value="">-- Chọn video --</option>
      {videos.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
          {v.size ? ` (${(v.size / 1024 / 1024).toFixed(1)}MB)` : ''}
        </option>
      ))}
    </select>
  );
}
