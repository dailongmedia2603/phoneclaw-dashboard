# Research Report: Tham số hóa Kịch bản (Scenario Parameterization) cho Phone-Agent

> **Thời gian:** 2026-04-20
> **Phạm vi:** Giải pháp tái sử dụng 1 kịch bản cho nhiều dữ liệu khác nhau (text, file, URL) — đặc biệt khi phần mềm bên ngoài gọi tới API.
> **Trạng thái dự án:** Đã có `{{variable}}` injection ở external API (`server/routes/external-api.ts:274-287`) + `/videos/register` cho file qua URL. **Thiếu**: formal input schema, UI nhập biến, validation, hỗ trợ cho Schedule.

---

## Mục lục

1. [Executive Summary](#1-executive-summary)
2. [Hiện trạng dự án](#2-hiện-trạng-dự-án)
3. [Các pattern phổ biến](#3-các-pattern-phổ-biến)
4. [So sánh 3 phương án](#4-so-sánh-3-phương-án)
5. [Khuyến nghị: Hybrid — Inputs Schema + `{{var}}` Injection](#5-khuyến-nghị-hybrid--inputs-schema--var-injection)
6. [Thiết kế chi tiết](#6-thiết-kế-chi-tiết)
7. [Ví dụ before/after](#7-ví-dụ-beforeafter)
8. [API cho phần mềm bên ngoài](#8-api-cho-phần-mềm-bên-ngoài)
9. [Xử lý file qua API](#9-xử-lý-file-qua-api)
10. [Roadmap triển khai](#10-roadmap-triển-khai)
11. [Rủi ro & Pitfalls](#11-rủi-ro--pitfalls)
12. [Tham khảo](#12-tham-khảo)

---

## 1. Executive Summary

**Vấn đề:** Mỗi kịch bản (VD "Đăng video TikTok") hardcode text/file/URL → muốn đăng video khác phải clone kịch bản mới → không scale.

**Giải pháp đề xuất:** Giữ cú pháp `{{var}}` đã có (đã chạy production, đừng thay), **bổ sung**:

1. **`inputs` schema** ở cấp Script — khai báo biến nào tồn tại, kiểu dữ liệu, bắt buộc/tùy chọn, giá trị mặc định.
2. **Validation runtime** trước khi execute (reject 400 với thông báo rõ ràng nếu thiếu biến).
3. **UI form tự động** render từ `inputs` schema khi user chạy thủ công hoặc tạo Schedule.
4. **File input type** riêng — resolve `videoId` → URL thực (đã có sẵn qua `/videos/register`).

**Tại sao không đổi sang engine expression như n8n (`$json.x`)?** Quá nặng cho use case mobile automation; `{{var}}` string replacement đang hoạt động tốt, chỉ cần schema + validation phía trên.

**Effort ước tính:** ~2-3 ngày code — không đập đi làm lại, chỉ thêm layer trên.

---

## 2. Hiện trạng dự án

### 2.1 Những gì đã có

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| `{{key}}` string replacement | [external-api.ts:274-287](../server/routes/external-api.ts#L274-L287) | Hoạt động, có JSON-escape |
| API `POST /scripts/:id/run` + `variables` | [external-api.ts:203-268](../server/routes/external-api.ts#L203-L268) | Đã production-ready |
| Đăng ký video bằng URL công khai | [external-api.ts:485-561](../server/routes/external-api.ts#L485-L561) | Nhận `url`, trả `videoId` |
| Node `send_file` với `videoId` | [nodeDefinitions.ts:131-139](../src/components/ScriptEditor/nodeDefinitions.ts#L131-L139) | Tham số là `videoId: string` |
| Node `type_text` với `text` | [nodeDefinitions.ts:123-128](../src/components/ScriptEditor/nodeDefinitions.ts#L123-L128) | Tham số là `text: string` |

### 2.2 Những gì còn thiếu

1. **Không có `inputs` schema** ở Script — không ai biết kịch bản cần biến gì cho đến khi đọc hết node.
2. **Không validation** — gọi API thiếu `{{video_id}}` → script chạy với placeholder literal, fail khó hiểu.
3. **UI không hỗ trợ** — chạy từ dashboard hoặc Schedule không có chỗ nhập biến → phải edit node thủ công.
4. **Type hệ thống chưa có** — text/url/file/number trộn lẫn, không biết biến nào cần resolve file.
5. **Không tài liệu hóa** được — user nhìn script không biết input kỳ vọng.

---

## 3. Các pattern phổ biến

### 3.1 Template string (Mustache/Handlebars style) — `{{var}}`
- **Dùng bởi:** GitHub Actions (`${{ inputs.x }}`), Ansible, Terraform, Jinja2, **PhoneAgent hiện tại**.
- **Ưu:** Đơn giản, dễ hiểu với non-dev, dễ escape JSON, parse cực nhanh.
- **Nhược:** Không expression (`a + b`), không reference output của node trước.

### 3.2 Expression engine — `{{ $json.user.name }}`
- **Dùng bởi:** n8n, Zapier (Code/Formatter), Make.com.
- **Ưu:** Cực mạnh, truy cập output node trước, transform data.
- **Nhược:** Complexity cao, cần sandbox (VM2/isolated-vm), attack surface lớn, learning curve.

### 3.3 Typed input schema + context injection
- **Dùng bởi:** GitHub Actions (`workflow_dispatch.inputs`), Apache Airflow (`params`), Temporal (workflow input struct), Appium Desired Capabilities.
- **Ưu:** Validation chặt, UI auto-generate form, self-documenting, API-first.
- **Nhược:** Phải khai báo trước, ít linh hoạt hơn expression.

**Insight:** Hầu hết hệ thống trưởng thành dùng **(1) hoặc (3) chứ hiếm khi dùng (2) nếu không bắt buộc**. n8n phức tạp vì nó là no-code giao tiếp với 400+ SaaS, Phone-Agent không cần vậy.

---

## 4. So sánh 3 phương án

| Tiêu chí | A. `{{var}}` + Schema (Hybrid) ⭐ | B. Expression engine n8n-style | C. Giữ nguyên hardcode, clone script |
|---|---|---|---|
| Effort | ~2-3 ngày | ~2-3 tuần | 0 |
| Phá vỡ API hiện có | Không (backward compat) | Có (breaking) | Không |
| Khó với user | Thấp | Trung bình-cao | Thấp (nhưng vô lý) |
| Validate được | Có | Có | Không |
| Security | Safe (string replace) | Cần sandbox | Safe |
| UI auto form | Có | Có (phức tạp) | Không |
| Dành cho AI/bot gọi API | **Rất hợp** | Overkill | Không scale |
| Reference output node trước | Không | Có | Không |
| Maintain | Dễ | Khó (engine + bugs) | Cực tệ (N script trùng lặp) |

**Kết luận:** Phương án **A** (Hybrid) thắng mọi tiêu chí quan trọng cho use case Phone-Agent.

---

## 5. Khuyến nghị: Hybrid — Inputs Schema + `{{var}}` Injection

### Nguyên tắc

1. **Giữ cú pháp `{{var}}`** — đã chạy, đã document, đừng đổi.
2. **Thêm `Script.inputs`** — array khai báo biến (name, type, label, required, default, description).
3. **Validate khi run** — thiếu required → 400; sai type → coerce hoặc 400.
4. **Types hỗ trợ:** `string`, `text` (multiline), `number`, `boolean`, `url`, `video` (auto-resolve videoId→url), `enum`.
5. **Dashboard auto-render form** từ `inputs` khi bấm "Chạy" hoặc tạo Schedule.
6. **Schedule lưu `variables` tĩnh** — schedule chạy với set biến đã chốt từ lúc tạo.
7. **API trả `inputs` schema** để phần mềm bên ngoài biết cách gọi.

### Kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│ Script (DB)                                                     │
│   name, description, steps[], graphData,                        │
│   inputs: [ { name, type, label, required, default, ... } ]  ◄──┼── MỚI
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────────┐  ┌──────────────┐
    │ UI Run   │    │ External API │  │ Schedule     │
    │ (form)   │    │ (body.vars)  │  │ (saved vars) │
    └────┬─────┘    └──────┬───────┘  └──────┬───────┘
         │                 │                 │
         └────────┬────────┴─────────────────┘
                  ▼
         ┌──────────────────┐
         │ validateInputs() │  ◄── MỚI: check required/type/coerce
         └────────┬─────────┘
                  ▼
         ┌──────────────────┐
         │ resolveInputs()  │  ◄── MỚI: video→url, enum normalize
         └────────┬─────────┘
                  ▼
         ┌──────────────────┐
         │ injectVariables()│  ◄── ĐÃ CÓ
         └────────┬─────────┘
                  ▼
              executeScript
```

---

## 6. Thiết kế chi tiết

### 6.1 TypeScript type cho `inputs`

Thêm vào [src/types/index.ts](../src/types/index.ts):

```ts
export type ScriptInputType =
  | 'string'   // 1 dòng
  | 'text'     // nhiều dòng (caption, mô tả)
  | 'number'
  | 'boolean'
  | 'url'      // validate bằng URL parser
  | 'video'    // value = videoId → server resolve sang URL thực
  | 'enum';    // chọn từ options

export interface ScriptInput {
  name: string;              // key dùng trong {{name}}, VD "caption"
  label: string;             // hiển thị UI, VD "Nội dung caption"
  type: ScriptInputType;
  required?: boolean;        // default false
  default?: string | number | boolean;
  description?: string;      // tooltip / doc
  options?: string[];        // chỉ cho type='enum'
  maxLength?: number;        // chỉ cho string/text
  min?: number; max?: number;// chỉ cho number
  placeholder?: string;
}

export interface Script {
  // ... fields hiện tại
  inputs?: ScriptInput[];    // MỚI — optional, backward compat
}
```

### 6.2 Validator + Resolver

File mới: `server/services/script-inputs.ts`

```ts
import type { Script, ScriptInput } from '../../src/types';
import { readUserCollection } from '../store';

export type RawVariables = Record<string, unknown>;
export type ResolvedVariables = Record<string, string>;

export class InputValidationError extends Error {
  constructor(public field: string, public reason: string) {
    super(`Input "${field}": ${reason}`);
  }
}

/**
 * Validate + coerce + resolve variables against script.inputs schema.
 * - Trả về Record<string,string> sẵn sàng cho injectVariables()
 * - Ném InputValidationError nếu sai
 */
export async function resolveScriptInputs(
  script: Script,
  raw: RawVariables | undefined,
  userId: string,
): Promise<ResolvedVariables> {
  const inputs = script.inputs ?? [];
  const out: ResolvedVariables = {};
  raw = raw ?? {};

  for (const spec of inputs) {
    const provided = raw[spec.name];
    const value = provided ?? spec.default;

    // 1. Required check
    if (spec.required && (value === undefined || value === null || value === '')) {
      throw new InputValidationError(spec.name, 'bắt buộc nhưng không có giá trị');
    }
    if (value === undefined || value === null) {
      continue; // optional, skip
    }

    // 2. Type-specific validation + coercion
    switch (spec.type) {
      case 'string':
      case 'text': {
        const s = String(value);
        if (spec.maxLength && s.length > spec.maxLength) {
          throw new InputValidationError(spec.name, `vượt quá ${spec.maxLength} ký tự`);
        }
        out[spec.name] = s;
        break;
      }
      case 'number': {
        const n = Number(value);
        if (Number.isNaN(n)) throw new InputValidationError(spec.name, 'không phải số');
        if (spec.min !== undefined && n < spec.min) throw new InputValidationError(spec.name, `< ${spec.min}`);
        if (spec.max !== undefined && n > spec.max) throw new InputValidationError(spec.name, `> ${spec.max}`);
        out[spec.name] = String(n);
        break;
      }
      case 'boolean':
        out[spec.name] = value ? 'true' : 'false';
        break;
      case 'url': {
        const s = String(value);
        try { new URL(s); } catch { throw new InputValidationError(spec.name, 'URL không hợp lệ'); }
        out[spec.name] = s;
        break;
      }
      case 'enum': {
        const s = String(value);
        if (!spec.options?.includes(s)) {
          throw new InputValidationError(spec.name, `phải thuộc [${spec.options?.join(', ')}]`);
        }
        out[spec.name] = s;
        break;
      }
      case 'video': {
        // value = videoId → lookup → trả videoId (engine nhận videoId trong send_file.params.videoId)
        const videoId = String(value);
        const videos = await readUserCollection<{ id: string }>(userId, 'videos');
        if (!videos.find(v => v.id === videoId)) {
          throw new InputValidationError(spec.name, `videoId "${videoId}" không tồn tại hoặc không thuộc sở hữu`);
        }
        out[spec.name] = videoId;
        break;
      }
    }
  }

  // 3. Cảnh báo biến thừa (không fail — chỉ log, cho phép forward-compat)
  for (const key of Object.keys(raw)) {
    if (!inputs.find(i => i.name === key)) {
      console.warn(`[script-inputs] Biến "${key}" không có trong schema, bỏ qua`);
    }
  }

  return out;
}
```

### 6.3 Sửa route `/scripts/:id/run`

Trong [external-api.ts:203](../server/routes/external-api.ts#L203):

```ts
import { resolveScriptInputs, InputValidationError } from '../services/script-inputs';

// ...
try {
  // ... tìm script như cũ

  let resolved: Record<string, string> = {};
  try {
    resolved = await resolveScriptInputs(script, variables, userId);
  } catch (err) {
    if (err instanceof InputValidationError) {
      return res.status(400).json({
        success: false,
        error: err.message,
        field: err.field,
      });
    }
    throw err;
  }

  const hasVars = Object.keys(resolved).length > 0;
  const modifiedScript = hasVars
    ? { ...script, steps: injectVariables(script.steps, resolved) }
    : script;

  if (hasVars) {
    executeScriptDirect(modifiedScript, deviceId, scheduleName, undefined, userId, 0).catch(...);
  } else {
    executeScript(req.params.id, deviceId, scheduleName, undefined, userId, 0).catch(...);
  }
  // ...
}
```

### 6.4 UI form (PropertyPanel hoặc Modal "Chạy kịch bản")

Tự render từ `script.inputs`:

```tsx
{script.inputs?.map(inp => (
  <FormField key={inp.name} required={inp.required}>
    <label>{inp.label}{inp.required && ' *'}</label>
    {inp.type === 'text' && <textarea defaultValue={String(inp.default ?? '')} />}
    {inp.type === 'string' && <input type="text" defaultValue={String(inp.default ?? '')} />}
    {inp.type === 'number' && <input type="number" min={inp.min} max={inp.max} />}
    {inp.type === 'boolean' && <input type="checkbox" defaultChecked={!!inp.default} />}
    {inp.type === 'url' && <input type="url" placeholder={inp.placeholder} />}
    {inp.type === 'video' && <VideoPicker userVideos={videos} />}
    {inp.type === 'enum' && (
      <select>{inp.options!.map(o => <option key={o}>{o}</option>)}</select>
    )}
    {inp.description && <small>{inp.description}</small>}
  </FormField>
))}
```

### 6.5 Endpoint mới: lấy schema input

```
GET /api/v1/external/scripts/:id/inputs
→ { success: true, data: { inputs: ScriptInput[] } }
```

Phần mềm bên ngoài có thể **discover** schema trước khi gọi run:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://phoneagent.io.vn/api/v1/external/scripts/scr_123/inputs
```

---

## 7. Ví dụ before/after

### 7.1 Trước (hardcode)

```json
{
  "id": "scr_tiktok_upload",
  "name": "Đăng TikTok - Video A",
  "steps": [
    { "id": "n1", "type": "launch", "params": { "bundleId": "com.zhiliaoapp.musically" } },
    { "id": "n2", "type": "wait", "params": { "seconds": 3 } },
    { "id": "n3", "type": "send_file", "params": { "videoId": "vid_abc123" } },
    { "id": "n4", "type": "type", "params": { "text": "Video nóng hổi #fyp" } }
  ]
}
```

→ Muốn đăng video B: **phải clone + edit** thành `scr_tiktok_upload_B`. Dùng lâu dài = rác.

### 7.2 Sau (parameterized)

```json
{
  "id": "scr_tiktok_upload",
  "name": "Đăng TikTok (tái sử dụng)",
  "description": "Đăng 1 video lên TikTok, tham số hóa đầu vào.",
  "inputs": [
    {
      "name": "video_id",
      "label": "Video cần đăng",
      "type": "video",
      "required": true,
      "description": "ID video từ /videos/register hoặc upload dashboard"
    },
    {
      "name": "caption",
      "label": "Caption",
      "type": "text",
      "required": true,
      "maxLength": 2200,
      "placeholder": "Video hot nhất hôm nay..."
    },
    {
      "name": "hashtags",
      "label": "Hashtags",
      "type": "string",
      "required": false,
      "default": "#fyp #viral"
    }
  ],
  "steps": [
    { "id": "n1", "type": "launch", "params": { "bundleId": "com.zhiliaoapp.musically" } },
    { "id": "n2", "type": "wait", "params": { "seconds": 3 } },
    { "id": "n3", "type": "send_file", "params": { "videoId": "{{video_id}}" } },
    { "id": "n4", "type": "type", "params": { "text": "{{caption}} {{hashtags}}" } }
  ]
}
```

**1 kịch bản — N lần chạy — N video/caption khác nhau.**

---

## 8. API cho phần mềm bên ngoài

### 8.1 Flow chuẩn cho AI/Bot đăng video

```
┌─ AI Bot ──────────────────────────────────────────────────────────┐
│ 1. GET /scripts/scr_tiktok_upload/inputs                          │
│    → biết cần video_id + caption + hashtags                       │
│                                                                   │
│ 2. POST /videos/register { url: "https://cdn.me/abc.mp4" }        │
│    → nhận { id: "vid_xyz789" }                                    │
│                                                                   │
│ 3. POST /scripts/scr_tiktok_upload/run                            │
│    {                                                              │
│      "deviceId": "dev_001",                                       │
│      "variables": {                                               │
│        "video_id": "vid_xyz789",                                  │
│        "caption": "Video siêu hot hôm nay",                       │
│        "hashtags": "#fyp #viral #trending"                        │
│      }                                                            │
│    }                                                              │
│    → server validate → inject {{...}} → chạy                      │
│                                                                   │
│ 4. Poll GET /executions?status=success&limit=10                   │
└───────────────────────────────────────────────────────────────────┘
```

### 8.2 cURL đầy đủ

```bash
#!/bin/bash
TOKEN="pa_live_xxxxxxxxxxxx"
BASE="https://phoneagent.io.vn/api/v1/external"

# 1. Khám phá schema
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/scripts/scr_tiktok_upload/inputs" | jq

# 2. Đăng ký video
VIDEO_ID=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://cdn.me/video_nong.mp4","name":"Video nóng"}' \
  "$BASE/videos/register" | jq -r '.data.id')

# 3. Chạy script với biến
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"deviceId\": \"dev_001\",
    \"variables\": {
      \"video_id\": \"$VIDEO_ID\",
      \"caption\": \"Video siêu hot hôm nay\",
      \"hashtags\": \"#fyp #viral\"
    }
  }" "$BASE/scripts/scr_tiktok_upload/run" | jq
```

### 8.3 Response khi validation fail

```json
{
  "success": false,
  "error": "Input \"caption\": bắt buộc nhưng không có giá trị",
  "field": "caption"
}
```

→ Bot biết chính xác field nào sai để hiển thị/retry.

---

## 9. Xử lý file qua API

Đã có nền tảng. Chỉ cần thống nhất **chỉ dùng URL** — không support multipart/base64 vì:

- **Multipart upload** → phải lưu R2 → tốn quota → thêm complexity. Chỉ để hợp user thao tác dashboard.
- **Base64 inline** → phình body request (video 50MB → 67MB JSON) → timeout → tệ.
- **URL reference** → AI/bot upload lên CDN/S3 của họ → đăng ký URL với PhoneAgent → iPhone fetch trực tiếp → lightweight, không dup storage.

**Quy tắc:**

| Nguồn | Method | Result |
|---|---|---|
| User kéo thả dashboard | `POST /videos` (multipart → R2) | `videoId` + URL R2 |
| Bot đăng video | `POST /videos/register` với URL public | `videoId` + URL ngoài |
| Cả 2 | Truyền `videoId` vào `variables.video_id` | Engine resolve |

Type `video` trong schema chỉ validate `videoId` tồn tại — engine `send_file` đã biết cách lấy URL từ `videoId`.

---

## 10. Roadmap triển khai

| Phase | Công việc | Effort | Phụ thuộc |
|---|---|---|---|
| 1 | Thêm `ScriptInput` type + field `inputs` vào `Script` | 0.5h | - |
| 2 | Tạo `server/services/script-inputs.ts` (validator + resolver) | 3h | 1 |
| 3 | Sửa `/scripts/:id/run` gọi resolver trước inject | 1h | 2 |
| 4 | Thêm endpoint `GET /scripts/:id/inputs` | 0.5h | 1 |
| 5 | UI: form `inputs` trong ScriptEditor (tab "Biến đầu vào") | 4h | 1 |
| 6 | UI: modal "Chạy script" auto-render form từ `inputs` | 3h | 5 |
| 7 | UI: Schedule form nhúng form biến → lưu `variables` tĩnh | 2h | 6 |
| 8 | Migration: quét script hiện có, phát hiện `{{xxx}}` → đề xuất `inputs` | 2h | 2 |
| 9 | Cập nhật `docs/API.md` + ví dụ SDK Python/Node | 2h | 3,4 |
| 10 | Unit test cho validator (edge cases: null/type mismatch/video không tồn tại) | 2h | 2 |

**Tổng:** ~20h = 2.5 ngày. Đi tuần tự 1→10, mỗi bước deploy được ngay (backward compat).

---

## 11. Rủi ro & Pitfalls

1. **JSON escape sai → inject break JSON.** Đã có `injectVariables` escape (`external-api.ts:278-283`) — đừng đụng.
2. **Regex `{{key}}` matching nhầm chuỗi trong user content.** Nếu caption có chuỗi `{{foo}}`, replacement chỉ chạy 1 lần trước khi `JSON.parse` → không loop vô hạn, nhưng user caption chứa `{{caption}}` sẽ gây confusion. Khuyến cáo: regex chỉ match `{{[a-z_][a-z0-9_]*}}`, còn user content ngoài placeholder giữ nguyên.
3. **Biến dư thừa.** Client gửi `foo: "bar"` nhưng schema không có → hiện tại `injectVariables` vẫn cố replace `{{foo}}` trong steps. Giải pháp: resolver chỉ trả biến hợp lệ → chỉ inject biến đó. Biến thừa → warn log.
4. **`type: 'video'` race condition.** Video bị xóa giữa lúc validate và lúc execute → engine báo lỗi. Chấp nhận được — fail fast.
5. **Backward compat.** Script cũ không có `inputs` → `inputs = []` → logic hiện tại giữ nguyên, vẫn nhận `variables` flat như cũ. Không break.
6. **Enum lộ thông tin nhạy cảm** nếu options là list account/device. Khuyến cáo: UI filter theo ownerId, server double-check.
7. **Maxlength text caption.** TikTok limit ~2200, server nên cảnh báo sớm thay vì để iPhone gõ hết rồi app reject.

---

## 12. Tham khảo

### Pattern tham số hóa
- [GitHub Actions: Input types for workflow_dispatch](https://github.blog/changelog/2021-11-10-github-actions-input-types-for-manual-workflows/) — mô hình `inputs` schema với type, required, default.
- [GitHub workflow_dispatch inputs spec](https://docs.github.com/en/enterprise-cloud@latest/actions/using-workflows/workflow-syntax-for-github-actions) — `boolean | choice | number | environment | string`.
- [n8n expressions `{{$json}}`](https://docs.n8n.io/code/expressions/) — xem qua để biết tại sao KHÔNG cần phức tạp vậy.
- [n8n custom variables](https://docs.n8n.io/code/variables/) — project-scoped override global, tham khảo nếu sau này làm multi-tenant variables.
- [Temporal workflow versioning](https://docs.temporal.io/workflow-definition) — input schema changes là breaking, cần versioning. Áp dụng: thêm field `inputs[].version` nếu sau này schema thay đổi.

### Code hiện tại dự án
- [external-api.ts: injectVariables](../server/routes/external-api.ts#L274-L287)
- [external-api.ts: /scripts/:id/run](../server/routes/external-api.ts#L203-L268)
- [external-api.ts: /videos/register](../server/routes/external-api.ts#L485-L561)
- [types/index.ts: Script interface](../src/types/index.ts#L96-L109)
- [nodeDefinitions.ts: send_file, type_text](../src/components/ScriptEditor/nodeDefinitions.ts#L123-L139)
- [docs/API.md: Variables injection §17](./API.md)

---

## Next Steps

1. **Chốt schema `ScriptInput`** với user (xem §6.1) — có đồng ý 7 type không?
2. **Triển khai phase 1-4** trước (backend + API) — có thể test bằng curl ngay.
3. **Phase 5-7** (UI) sau — dashboard đẹp nhưng không block AI/bot.
4. **Migration tool** (phase 8) tự scan `{{xxx}}` trong script cũ → đề xuất `inputs` entries, user confirm.

## Câu hỏi chưa rõ

- Có cần **compound variables** (VD `{{user.name}}` thay vì flat `{{user_name}}`)? Hiện tại đề xuất flat cho đơn giản.
- Có cần **expression** (VD `{{count + 1}}`, `{{now | date:'HH:mm'}}`)? Nếu có, gợi ý dùng thư viện nhẹ như Mustache.js thay vì tự parse.
- **Secret variables** (API key, token) — cần mask trong log không? Đề xuất thêm `type: 'secret'` ở phase 2.
