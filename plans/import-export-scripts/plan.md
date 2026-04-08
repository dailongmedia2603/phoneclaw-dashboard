# Plan: Import/Export Kich ban

## Tong quan
Bo sung tinh nang Import/Export cho menu Kich ban. Export: popup chon nhieu kich ban → xuat file JSON. Import: upload file JSON → tao kich ban moi chay duoc ngay.

## Phan tich

### Script structure can export:
```typescript
interface Script {
  id: string;            // → tao moi khi import
  name: string;          // ✅ giu nguyen
  description: string;   // ✅ giu nguyen
  channel?: string;      // ✅ giu nguyen
  graphData?: { nodes: unknown[]; edges: unknown[] }; // ✅ giu nguyen (visual layout)
  steps: ScriptStep[];   // ✅ giu nguyen (execution data)
  status: 'active' | 'idle' | 'draft'; // → reset 'idle' khi import
  lastRun?: string;      // → xoa khi import
  runCount: number;      // → reset 0 khi import
  createdAt: string;     // → tao moi khi import
  updatedAt: string;     // → tao moi khi import
  ownerId?: string;      // → gan userId khi import
}
```

### Export file format:
```json
{
  "version": 1,
  "exportedAt": "2026-04-02T...",
  "scripts": [
    {
      "name": "...",
      "description": "...",
      "channel": "tiktok_vn",
      "graphData": { "nodes": [...], "edges": [...] },
      "steps": [...]
    }
  ]
}
```
- Loai bo: id, ownerId, status, lastRun, runCount, createdAt, updatedAt
- Giu: name, description, channel, graphData, steps
- File extension: `.phoneclaw-scripts.json`

### Approach: Frontend-only (khong can backend API moi)
- **Export**: Frontend da co danh sach scripts → loc → tao JSON → download file
- **Import**: Frontend doc file → parse JSON → validate → goi `scriptsApi.create()` cho tung script
- Ly do: Don gian, it code, tan dung API create da co, khong can endpoint moi

---

## Phase 1: Export — Frontend (1 file)

**File:** `src/components/Scripts.tsx`

### 1.1 State moi:
```typescript
const [showExportModal, setShowExportModal] = useState(false);
const [exportSelected, setExportSelected] = useState<string[]>([]); // script IDs
```

### 1.2 Export Modal UI:
- Popup overlay dong bo giao dien voi app (rounded-2xl, border-slate-200, shadow-xl)
- Title: "Export Kich ban"
- Checkbox list: tat ca scripts (grouped theo channel hien tai hoac tat ca)
- Checkbox "Chon tat ca" o header
- Moi row: checkbox + ten kich ban + channel badge + so buoc
- Nut "Huy" + "Export (N kich ban)"
- Disabled nut Export khi chua chon

### 1.3 Export logic:
```typescript
function handleExport() {
  const selected = scriptsData.filter(s => exportSelected.includes(s.id));
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    scripts: selected.map(s => ({
      name: s.name,
      description: s.description,
      channel: s.channel,
      graphData: s.graphData,
      steps: s.steps,
    })),
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `phoneclaw-scripts-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setShowExportModal(false);
  setExportSelected([]);
  showToast('success', `Da export ${selected.length} kich ban`);
}
```

---

## Phase 2: Import — Frontend (1 file)

**File:** `src/components/Scripts.tsx`

### 2.1 State moi:
```typescript
const [importLoading, setImportLoading] = useState(false);
```

### 2.2 Import logic:
```typescript
async function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    setImportLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate format
      if (!data.version || !Array.isArray(data.scripts)) {
        showToast('error', 'File khong dung dinh dang PhoneClaw');
        return;
      }
      
      // Validate each script
      for (const s of data.scripts) {
        if (!s.name || !Array.isArray(s.steps)) {
          showToast('error', `Kich ban "${s.name || 'unknown'}" khong hop le`);
          return;
        }
      }
      
      // Create scripts via API
      let created = 0;
      for (const s of data.scripts) {
        await scriptsApi.create({
          name: s.name,
          description: s.description || '',
          channel: s.channel || 'tiktok_vn',
          graphData: s.graphData,
          steps: s.steps,
        });
        created++;
      }
      
      showToast('success', `Da import ${created} kich ban`);
      refreshScripts(); // reload danh sach
    } catch (err) {
      showToast('error', 'Loi doc file: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setImportLoading(false);
    }
  };
  input.click();
}
```

### 2.3 Wire buttons:
```tsx
// Import button
<button onClick={handleImport} disabled={importLoading}>
  <Upload size={18} />
  {importLoading ? 'Dang import...' : 'Import'}
</button>

// Export button
<button onClick={() => setShowExportModal(true)}>
  <Download size={18} />
  Export
</button>
```

---

## Phase 3: Export Modal Component (trong Scripts.tsx)

### UI chi tiet:
```tsx
{showExportModal && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3>Export Kich ban</h3>
        <button onClick={close}><X /></button>
      </div>
      
      {/* Select All */}
      <div className="px-6 py-3 border-b bg-slate-50">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={all} onChange={toggleAll} />
          Chon tat ca ({scriptsData.length})
        </label>
      </div>
      
      {/* Script list - scrollable */}
      <div className="max-h-80 overflow-y-auto">
        {scriptsData.map(script => (
          <label className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={...} onChange={...} />
            <div>
              <p className="font-medium">{script.name}</p>
              <p className="text-xs text-slate-500">
                {channelLabel} · {script.steps.length} buoc
              </p>
            </div>
          </label>
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t flex justify-end gap-3">
        <button onClick={close}>Huy</button>
        <button onClick={handleExport} disabled={exportSelected.length === 0}>
          Export ({exportSelected.length})
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Tong ket

### Files can sua: 1 file
- `src/components/Scripts.tsx` — them state, handlers, modal, wire buttons

### Khong can backend moi
- Export: doc tu state frontend, tao file client-side
- Import: doc file client-side, goi `POST /api/scripts` (da co)

### Bao mat
- Import tao script voi `ownerId` cua user hien tai (backend tu gan qua `getAuthUserId`)
- Khong co XSS risk vi data la JSON structure, khong render HTML
- File validation truoc khi tao scripts

### Khong anh huong
- Backend routes — khong thay doi
- Script editor — khong thay doi
- Shared scripts — khong thay doi
- Schedules — khong thay doi
- Toan bo tinh nang hien tai — khong thay doi (chi them code moi)
