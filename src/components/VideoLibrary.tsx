import { useState, useRef } from 'react';
import { Film, Upload, Trash2, Send, Loader2, FileVideo, X } from 'lucide-react';
import { videos as videosApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { showToast } from './Toast';
import CustomSelect from './CustomSelect';
import type { Video, Device } from '../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function VideoLibrary() {
  const { data: videoList, loading, refresh } = useApi<Video[]>(() => videosApi.getAll(), []);
  const { data: deviceList } = useApi<Device[]>(() => devicesApi.getAll(), []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [sendModal, setSendModal] = useState<Video | null>(null);
  const [sendDeviceId, setSendDeviceId] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const videos = videoList ?? [];
  const onlineDevices = (deviceList ?? []).filter(d => d.status !== 'offline');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('error', 'Chỉ hỗ trợ file video');
      return;
    }

    setUploading(true);
    setUploadProgress(`Đang upload ${file.name}...`);
    const res = await videosApi.upload(file);
    setUploading(false);
    setUploadProgress('');

    if (res.success) {
      showToast('success', 'Upload thành công!');
      refresh();
    } else {
      showToast('error', res.error || 'Upload thất bại');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await videosApi.remove(deleteConfirm);
    setDeleteConfirm(null);
    refresh();
    showToast('success', 'Đã xoá video');
  };

  const handleSend = async () => {
    if (!sendModal || !sendDeviceId) return;
    setSending(true);
    const res = await videosApi.sendToDevice(sendModal.id, sendDeviceId);
    setSending(false);
    if (res.success) {
      const data = res.data as any;
      showToast('success', data?.message || 'Đã gửi video tới thiết bị');
      setSendModal(null);
    } else {
      showToast('error', res.error || 'Gửi thất bại');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Thư viện Video</h1>
          <p className="text-sm text-slate-500">Upload và quản lý video, gửi tới thiết bị để đăng</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? uploadProgress : 'Upload video'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Film size={48} className="mb-3 text-slate-300" />
            <p className="text-sm">Chưa có video nào. Bấm "Upload video" để bắt đầu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map(video => (
              <div key={video.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Thumbnail / Icon */}
                <div className="aspect-video bg-slate-900 flex items-center justify-center">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-sm text-slate-900 truncate" title={video.name}>{video.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><FileVideo size={12} /> {formatSize(video.size)}</span>
                    <span>{formatDate(video.uploadedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setSendModal(video); setSendDeviceId(onlineDevices[0]?.id ?? ''); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Send size={12} /> Gửi tới thiết bị
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(video.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xoá"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send to Device Modal */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-blue-600" /> Gửi video tới thiết bị
              </h2>
              <button onClick={() => setSendModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">Video: <span className="font-medium text-slate-900">{sendModal.name}</span></p>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chọn thiết bị</label>
                <CustomSelect
                  value={sendDeviceId}
                  onChange={setSendDeviceId}
                  options={onlineDevices.map(d => ({ value: d.id, label: d.name }))}
                  placeholder="Chọn thiết bị..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setSendModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl">
                Huỷ
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !sendDeviceId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : 'Gửi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Xoá video?</h3>
              <p className="text-sm text-slate-500">Video sẽ bị xoá khỏi R2 và không thể hoàn tác.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                Huỷ
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl">
                Xác nhận xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
