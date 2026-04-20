# PhoneAgent External API v1 — Tài liệu tích hợp đầy đủ

> Tài liệu này mô tả toàn bộ REST API v1 của PhoneAgent dành cho phần mềm bên thứ ba (bot, AI agent, hệ thống nội bộ) tích hợp để **điều khiển iPhone từ xa** và **đăng video tự động** lên TikTok / Facebook / mạng xã hội.
>
> **Phiên bản tài liệu:** 1.0  
> **Phiên bản API:** v1  
> **Cập nhật:** 2026-04-20

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Base URL & môi trường](#2-base-url--môi-trường)
3. [Xác thực (Authentication)](#3-xác-thực-authentication)
4. [Định dạng response chuẩn](#4-định-dạng-response-chuẩn)
5. [Mã lỗi & HTTP status codes](#5-mã-lỗi--http-status-codes)
6. [Rate limiting](#6-rate-limiting)
7. [Kiểm tra kết nối (Health check)](#7-kiểm-tra-kết-nối-health-check)
8. [Endpoint: Tài khoản (`/me`)](#8-endpoint-tài-khoản-me)
9. [Endpoint: Thiết bị (`/devices`)](#9-endpoint-thiết-bị-devices)
10. [Endpoint: Điều khiển thiết bị (tap/swipe/type/key/launch)](#10-endpoint-điều-khiển-thiết-bị)
11. [Endpoint: Nhóm thiết bị (`/device-groups`)](#11-endpoint-nhóm-thiết-bị-device-groups)
12. [Endpoint: Kịch bản (`/scripts`)](#12-endpoint-kịch-bản-scripts)
13. [Endpoint: Lịch trình (`/schedules`)](#13-endpoint-lịch-trình-schedules)
14. [Endpoint: Lịch sử thực thi (`/executions`)](#14-endpoint-lịch-sử-thực-thi-executions)
15. [Endpoint: Video (`/videos`)](#15-endpoint-video-videos)
16. [⭐ LUỒNG ĐĂNG VIDEO TỰ ĐỘNG (quan trọng nhất)](#16--luồng-đăng-video-tự-động)
17. [Variables injection — placeholder `{{...}}`](#17-variables-injection)
18. [SDK ví dụ (Python, Node.js, cURL)](#18-sdk-ví-dụ)
19. [Câu hỏi thường gặp & xử lý lỗi](#19-câu-hỏi-thường-gặp--xử-lý-lỗi)
20. [Phụ lục — Bảng tham chiếu nhanh](#20-phụ-lục--bảng-tham-chiếu-nhanh)

---

## 1. Tổng quan kiến trúc

```
┌─────────────────┐    HTTPS + API Token     ┌──────────────────┐    Tailscale    ┌─────────────┐
│  Phần mềm khác  │ ───────────────────────► │  PhoneAgent      │ ──────────────► │   iPhone    │
│  (AI / Bot)     │                          │  Dashboard       │                 │  (TrollVNC) │
│                 │ ◄─────────────────────── │  (VPS)           │ ◄────────────── │             │
└─────────────────┘   JSON success/error     └──────────────────┘   HTTP control  └─────────────┘
```

**Quy trình điển hình** cho bài toán đăng video:

1. AI **đăng ký video** bằng URL công khai (CDN, R2, S3…) → nhận `videoId`.
2. AI **gọi chạy kịch bản đăng video** trên một thiết bị, truyền `videoId` qua biến.
3. Server tự động: chèn `videoId` vào node `send_file` → iPhone tải video về Photos → script tiếp tục mở app TikTok / Facebook → upload → nhập caption → đăng.
4. AI **poll lịch sử thực thi** để lấy kết quả (success / error + screenshot từng bước).

---

## 2. Base URL & môi trường

| Môi trường | Base URL |
|------------|----------|
| Production (mặc định) | `https://phoneagent.io.vn/api/v1/external` |
| Self-hosted | `https://{your-domain}/api/v1/external` |
| Dev local | `http://localhost:3000/api/v1/external` |

Mọi endpoint dưới đây đều **nối tiếp Base URL**. Ví dụ `/me` → `https://phoneagent.io.vn/api/v1/external/me`.

**Yêu cầu giao thức:**
- Production **bắt buộc HTTPS**.
- Body request: `Content-Type: application/json` (trừ khi nói rõ khác).
- Response body: luôn là JSON (trừ `/devices/:id/screenshot` trả `image/png` binary).

---

## 3. Xác thực (Authentication)

### 3.1 Lấy API Token

API Token do **người dùng PhoneAgent** tạo trên dashboard:

1. Đăng nhập dashboard → **Cài đặt → Profile → API Token**.
2. Hệ thống tự sinh 1 token mặc định khi user được tạo (gói phải bật `apiTokensEnabled`).
3. Bấm **"Đổi token mới"** để regenerate. **Sao chép ngay** — token đầy đủ chỉ hiện 1 lần.
4. Mỗi user tối đa **5 token đang hoạt động**.

Token có dạng: `pa_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (luôn bắt đầu bằng `pa_live_`).

> ⚠️ **Bảo mật:** Token cấp quyền **toàn bộ** trên tài nguyên user. Lưu trong biến môi trường (`PHONEAGENT_API_TOKEN`), KHÔNG commit vào Git, KHÔNG hard-code.

### 3.2 Gửi token trong request

Hai cách (chọn 1):

**Cách 1 — Header `X-API-Token` (khuyến nghị):**
```http
X-API-Token: pa_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cách 2 — Header `Authorization: Bearer`:**
```http
Authorization: Bearer pa_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Nếu cả hai header cùng có, `X-API-Token` được ưu tiên.

### 3.3 Phản hồi khi xác thực thất bại

| Tình huống | HTTP | Body |
|------------|------|------|
| Không có token | `401` | `{"success": false, "error": "API token required. Use header: X-API-Token: pa_live_xxx"}` |
| Token sai format | `401` | `{"success": false, "error": "Invalid token format. Token must start with pa_live_"}` |
| Token bị thu hồi / không hợp lệ | `401` | `{"success": false, "error": "Invalid or revoked API token"}` |
| Lỗi hệ thống xác thực | `500` | `{"success": false, "error": "Authentication service error"}` |

---

## 4. Định dạng response chuẩn

**Mọi** endpoint trả về JSON theo cấu trúc sau (trừ screenshot binary):

### 4.1 Thành công

```json
{
  "success": true,
  "data": { /* payload phụ thuộc endpoint */ }
}
```

- HTTP status: `200`.
- `data` có thể là object, array, hoặc primitive tùy endpoint.

### 4.2 Thất bại

```json
{
  "success": false,
  "error": "Mô tả lỗi (tiếng Anh hoặc Việt)"
}
```

- HTTP status: `400` / `401` / `403` / `404` / `429` / `500` (xem mục [5](#5-mã-lỗi--http-status-codes)).
- `error` luôn là string mô tả ngắn để hiển thị / log.

---

## 5. Mã lỗi & HTTP status codes

| HTTP | Ý nghĩa | Khi nào |
|------|---------|---------|
| `200` | OK | Request thành công (`success: true`) |
| `400` | Bad Request | Thiếu field bắt buộc, sai format, device offline khi yêu cầu chạy script |
| `401` | Unauthorized | Token không có / sai format / bị revoke |
| `403` | Forbidden | Token hợp lệ nhưng không sở hữu resource (vd: deviceId của user khác); hoặc hết quota |
| `404` | Not Found | Resource không tồn tại (deviceId, scriptId, executionId, videoId sai) |
| `429` | Too Many Requests | Vượt rate limit (xem mục [6](#6-rate-limiting)) — kèm header `Retry-After` |
| `500` | Server Error | Lỗi hệ thống (storage, device không phản hồi, lỗi không xác định) |

**Quy tắc retry khuyến nghị:**

| HTTP | Retry? |
|------|--------|
| `400`, `401`, `403`, `404` | ❌ Không retry — sửa request trước |
| `429` | ✅ Retry sau `Retry-After` giây (exponential backoff) |
| `500` | ✅ Retry tối đa 3 lần với backoff 1s/2s/4s |

---

## 6. Rate limiting

External API có **3 lớp giới hạn**:

| Lớp | Giới hạn | Phạm vi | Mục đích |
|-----|----------|---------|----------|
| Tier 1 — IP | **300 req / 15 phút** | Theo IP nguồn | Chống DDoS |
| Tier 2 — User | **60 req / 1 phút** | Theo token (user) | Chống abuse |
| Tier 3 — Auth fail | **15 lỗi auth / 15 phút** | Theo IP | Chống brute-force token |

**Header trả về trong mọi response:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1745164800        # Unix timestamp khi window reset
```

**Khi vượt giới hạn (HTTP 429):**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42                      # Đợi 42 giây
```
```json
{ "success": false, "error": "Rate limit exceeded for this token" }
```

---

## 7. Kiểm tra kết nối (Health check)

Cách đơn giản nhất để verify token + connectivity:

### Request

```bash
curl -i https://phoneagent.io.vn/api/v1/external/me \
  -H "X-API-Token: pa_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Response (success)

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
```
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "user",
    "stats": {
      "totalDevices": 5,
      "onlineDevices": 3,
      "totalScripts": 12,
      "totalSchedules": 4
    }
  }
}
```

Nếu trả `200` + `success: true` → token hợp lệ, sẵn sàng tích hợp.

---

## 8. Endpoint: Tài khoản (`/me`)

### `GET /me`

Lấy thông tin user và thống kê tổng quan.

**Request:** không body, không query.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "user",                 // "user" | "admin"
    "stats": {
      "totalDevices": 5,
      "onlineDevices": 3,
      "totalScripts": 12,
      "totalSchedules": 4
    }
  }
}
```

**Lỗi có thể gặp:** `401`, `404` (user bị xóa), `500`.

---

## 9. Endpoint: Thiết bị (`/devices`)

### 9.1 `GET /devices` — Danh sách thiết bị

Lấy toàn bộ iPhone trong tài khoản.

**Query params:**
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `status` | string | ❌ | Lọc theo trạng thái: `online` / `offline` / `running` / `connecting` |

**Ví dụ:** `GET /devices?status=online`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dev_001",
      "name": "iPhone 12 Pro - Slot A",
      "tailscaleIp": "100.76.133.10",
      "status": "online",          // "online" | "offline" | "running" | "connecting"
      "model": "iPhone 12 Pro",
      "iosVersion": "16.5",
      "battery": 87,                // 0-100
      "uptime": 432000,             // giây
      "lastSeen": "2026-04-20T08:15:42.000Z",
      "currentScript": null         // hoặc tên script đang chạy
    }
  ]
}
```

### 9.2 `GET /devices/:id` — Chi tiết thiết bị

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "dev_001",
    "name": "iPhone 12 Pro - Slot A",
    "tailscaleIp": "100.76.133.10",
    "vncPort": 5901,
    "httpPort": 8080,
    "iosVersion": "16.5",
    "model": "iPhone 12 Pro",
    "status": "online",
    "battery": 87,
    "uptime": 432000,
    "group": "TikTok-VN",
    "account": "tiktok_acc_001",
    "currentScript": null,
    "lastSeen": "2026-04-20T08:15:42.000Z",
    "createdAt": "2026-01-10T00:00:00.000Z"
  }
}
```

**Lỗi:** `404` nếu device không tồn tại / không thuộc user.

### 9.3 `GET /devices/:id/screenshot` — Ảnh màn hình hiện tại

Trả về **PNG binary** (không phải JSON).

**Response 200:**
```http
HTTP/1.1 200 OK
Content-Type: image/png

<binary PNG data>
```

**Lỗi:** `404` (device không tồn tại) hoặc `500` (`Screenshot failed: <reason>`).

**Ví dụ lưu file:**
```bash
curl https://phoneagent.io.vn/api/v1/external/devices/dev_001/screenshot \
  -H "X-API-Token: pa_live_xxx" \
  -o screenshot.png
```

---

## 10. Endpoint: Điều khiển thiết bị

Tất cả endpoints dưới đây yêu cầu device ở trạng thái `online` hoặc `running`. Nếu `offline` → trả `400`.

Tọa độ `x, y` luôn là **tỷ lệ 0.0–1.0** (0,0 = góc trên trái; 1,1 = góc dưới phải).

### 10.1 `POST /devices/:id/tap` — Chạm

**Body:**
```json
{ "x": 0.5, "y": 0.7 }
```

**Response 200:**
```json
{ "success": true, "data": { "ok": true } }
```

### 10.2 `POST /devices/:id/swipe` — Vuốt

**Body:**
```json
{
  "fromX": 0.5,
  "fromY": 0.8,
  "toX": 0.5,
  "toY": 0.2,
  "duration": 0.3        // giây
}
```

### 10.3 `POST /devices/:id/type` — Gõ text

**Body:**
```json
{ "text": "Xin chào TikTok 👋" }
```

> Hỗ trợ Unicode đầy đủ (emoji, tiếng Việt có dấu).

### 10.4 `POST /devices/:id/key` — Bấm phím hệ thống

**Body:**
```json
{ "key": "home" }
```

| Giá trị `key` | Hành động |
|---------------|-----------|
| `home` | Nút Home (về màn hình chính) |
| `back` | Nút quay lại |
| `enter` | Phím Enter |
| `space` | Khoảng trắng |
| `delete` | Xóa lùi |

### 10.5 `POST /devices/:id/launch` — Mở ứng dụng

**Body:**
```json
{ "bundleId": "com.zhiliaoapp.musically" }
```

| Bundle ID | App |
|-----------|-----|
| `com.ss.iphone.ugc.Ame` | TikTok Việt Nam |
| `com.zhiliaoapp.musically` | TikTok Quốc tế |
| `com.facebook.Facebook` | Facebook |
| `com.apple.mobilemail` | Mail |
| `com.apple.Preferences` | Cài đặt |

### Lỗi chung cho tất cả endpoint điều khiển

| HTTP | Lỗi |
|------|-----|
| `400` | `"Device is offline"` |
| `404` | `"Device not found"` |
| `500` | `"Control failed: <reason>"` (mất kết nối Tailscale, app crash…) |

---

## 11. Endpoint: Nhóm thiết bị (`/device-groups`)

### `GET /device-groups`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "grp_001",
      "name": "TikTok-VN",
      "color": "#FF0050",
      "deviceIds": ["dev_001", "dev_002", "dev_005"]
    }
  ]
}
```

---

## 12. Endpoint: Kịch bản (`/scripts`)

### 12.1 `GET /scripts` — Danh sách kịch bản

**Response 200:**
```json
{
  "success": true,
  "data": {
    "own": [
      {
        "id": "scr_001",
        "name": "Đăng video TikTok VN",
        "description": "Mở TikTok → upload → đăng",
        "channel": "tiktok_vn",
        "status": "active",          // "active" | "idle" | "draft"
        "runCount": 142,
        "lastRun": "2026-04-19T22:30:00.000Z",
        "createdAt": "2026-03-01T00:00:00.000Z",
        "updatedAt": "2026-04-15T10:00:00.000Z",
        "steps": [ /* mảng node — xem mục 17 */ ]
      }
    ],
    "shared": [
      {
        "id": "shr_001",
        "name": "Nuôi kênh TikTok cơ bản",
        "description": "Lướt + like 10 phút",
        "channel": "tiktok_vn",
        "status": "active",
        "isShared": true,
        "steps": [ /* ... */ ]
      }
    ]
  }
}
```

`shared` là kịch bản dùng chung do admin tạo — tất cả user đều dùng được.

### 12.2 `GET /scripts/:id` — Chi tiết kịch bản

Tìm trong `own` trước, fallback sang `shared`. Nếu là shared, response có `isShared: true`.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "scr_001",
    "name": "Đăng video TikTok VN",
    "description": "...",
    "channel": "tiktok_vn",
    "status": "active",
    "runCount": 142,
    "lastRun": "2026-04-19T22:30:00.000Z",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-04-15T10:00:00.000Z",
    "steps": [
      { "id": "n1", "type": "launch", "params": { "bundleId": "com.ss.iphone.ugc.Ame" } },
      { "id": "n2", "type": "wait", "params": { "seconds": 5 } },
      { "id": "n3", "type": "send_file", "params": { "videoId": "{{video_id}}" } },
      { "id": "n4", "type": "type", "params": { "text": "{{caption}}" } }
    ]
  }
}
```

### 12.3 ⭐ `POST /scripts/:id/run` — Chạy kịch bản

**Đây là endpoint quan trọng nhất cho tích hợp.**

**Body:**
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `deviceId` | string | ✅ | ID thiết bị (phải `online`, thuộc user) |
| `variables` | object | ❌ | Map `{key: value}` để chèn vào placeholder `{{key}}` trong script |

**Ví dụ — chạy script đăng video:**
```json
{
  "deviceId": "dev_001",
  "variables": {
    "video_id": "vid_abc123",
    "caption": "Video mới hôm nay 🔥 #fyp #viral"
  }
}
```

**Response 200 (script đã được khởi chạy bất đồng bộ):**
```json
{
  "success": true,
  "data": {
    "message": "Script \"Đăng video TikTok VN\" started on device \"iPhone 12 Pro - Slot A\"",
    "scriptId": "scr_001",
    "deviceId": "dev_001",
    "hasVariables": true
  }
}
```

> ⚡ Endpoint này **trả về ngay sau khi khởi chạy**, không chờ script chạy xong.  
> Để biết kết quả, **poll** `GET /executions?limit=10` và tìm execution mới nhất theo `scriptName`. Xem mục [14](#14-endpoint-lịch-sử-thực-thi-executions).

**Các lỗi cụ thể:**

| HTTP | Trường hợp |
|------|------------|
| `400` | Thiếu `deviceId`; device không online (`"Device is <status>, must be online"`) |
| `403` | `deviceId` không thuộc user (`"Device not found or not owned by you"`) |
| `404` | `scriptId` không tồn tại (`"Script not found"`) |
| `500` | Lỗi storage / engine (`"Execution failed: <reason>"`) |

---

## 13. Endpoint: Lịch trình (`/schedules`)

### 13.1 `GET /schedules`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sch_001",
      "name": "Đăng video TikTok 8h sáng",
      "scriptId": "scr_001",
      "scriptName": "Đăng video TikTok VN",
      "targetType": "device",         // "device" | "group"
      "targetId": "dev_001",
      "targetName": "iPhone 12 Pro - Slot A",
      "cron": "0 8 * * *",
      "enabled": true,
      "nextRun": "2026-04-21T01:00:00.000Z",
      "lastRun": "2026-04-20T01:00:00.000Z",
      "createdAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

### 13.2 `GET /schedules/:id` — Chi tiết

Cấu trúc giống item trong list.

### 13.3 `PUT /schedules/:id/toggle` — Bật/tắt lịch

**Request:** không body.

**Response 200:**
```json
{ "success": true, "data": { /* schedule sau khi toggle */ } }
```

---

## 14. Endpoint: Lịch sử thực thi (`/executions`)

### 14.1 `GET /executions` — Danh sách execution

**Query params:**
| Tên | Kiểu | Mô tả |
|-----|------|-------|
| `status` | string | `running` / `success` / `error` |
| `limit` | number | Số bản ghi (mặc định 50, mới nhất trước) |

**Ví dụ:** `GET /executions?status=success&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exec_xyz789",
      "scheduleId": "",                    // rỗng nếu chạy thủ công qua API
      "scheduleName": "API: Đăng video TikTok VN",
      "scriptName": "Đăng video TikTok VN",
      "targetName": "iPhone 12 Pro - Slot A",
      "startedAt": "2026-04-20T10:15:00.000Z",
      "finishedAt": "2026-04-20T10:18:42.000Z",
      "status": "success",                 // "running" | "success" | "error"
      "error": null,
      "steps": [ /* xem 14.2 */ ]
    }
  ]
}
```

> 💡 Khi gọi `POST /scripts/:id/run`, server tạo execution có `scheduleName` bắt đầu bằng `"API: "` để bạn dễ filter.

### 14.2 `GET /executions/:id` — Chi tiết execution

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "exec_xyz789",
    "scriptName": "Đăng video TikTok VN",
    "targetName": "iPhone 12 Pro - Slot A",
    "startedAt": "2026-04-20T10:15:00.000Z",
    "finishedAt": "2026-04-20T10:18:42.000Z",
    "status": "success",
    "error": null,
    "steps": [
      {
        "index": 0,
        "type": "launch",
        "description": "Mở TikTok VN",
        "status": "success",
        "startedAt": "2026-04-20T10:15:00.000Z",
        "finishedAt": "2026-04-20T10:15:03.000Z"
      },
      {
        "index": 1,
        "type": "send_file",
        "description": "Truyền file video",
        "status": "success",
        "startedAt": "2026-04-20T10:15:08.000Z",
        "finishedAt": "2026-04-20T10:16:42.000Z"
      },
      {
        "index": 2,
        "type": "screenshot",
        "description": "Chụp ảnh màn hình",
        "status": "success",
        "startedAt": "2026-04-20T10:18:00.000Z",
        "finishedAt": "2026-04-20T10:18:01.000Z",
        "screenshotUrl": "data:image/jpeg;base64,/9j/4AAQ..."
      }
    ]
  }
}
```

**Polling pattern khuyến nghị:**

```
1. POST /scripts/:id/run         → nhận response success
2. Đợi 2 giây
3. GET /executions?limit=5       → tìm execution mới nhất có scheduleName "API: ..."
4. Lưu executionId
5. Loop mỗi 5 giây: GET /executions/:executionId
   - status === "running" → tiếp tục poll (max ~10 phút cho đăng video)
   - status === "success" → DONE
   - status === "error"  → lấy execution.error + steps[].error để chẩn đoán
```

---

## 15. Endpoint: Video (`/videos`)

> **Lưu ý quan trọng:** Endpoint này **mới được bổ sung** cho external API. Cho phép AI/bot **đăng ký video bằng URL** mà không cần upload file. Phù hợp khi video đã có sẵn trên CDN/R2/S3 của bạn.

### 15.1 `GET /videos` — Danh sách video của user

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "vid_abc123",
      "name": "Video TikTok 20/04",
      "filename": "viral_clip_001.mp4",
      "url": "https://cdn.example.com/videos/clip001.mp4",
      "size": 8421760,                  // bytes
      "mimeType": "video/mp4",
      "uploadedAt": "2026-04-20T09:00:00.000Z",
      "source": "url"                   // "upload" (qua dashboard) | "url" (đăng ký qua API)
    }
  ]
}
```

### 15.2 `GET /videos/:id` — Chi tiết 1 video

Cấu trúc giống item trong list. `404` nếu không tồn tại.

### 15.3 ⭐ `POST /videos/register` — Đăng ký video bằng URL

**Đây là endpoint then chốt cho AI tự động đăng video.**

**Body:**
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `url` | string | ✅ | URL video PUBLIC, **iPhone phải tải được** (HTTP/HTTPS, không yêu cầu auth) |
| `name` | string | ❌ | Tên hiển thị (mặc định = filename trong URL) |
| `mimeType` | string | ❌ | VD: `video/mp4`. Nếu bỏ trống, server tự lấy từ HEAD response |
| `size` | number | ❌ | Bytes. Nếu bỏ trống, server tự lấy từ Content-Length |

**Ví dụ:**
```json
{
  "url": "https://cdn.example.com/videos/clip001.mp4",
  "name": "Video TikTok 20/04",
  "mimeType": "video/mp4"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "vid_abc123",                 // ⬅ DÙNG ID NÀY làm video_id khi chạy script
    "name": "Video TikTok 20/04",
    "url": "https://cdn.example.com/videos/clip001.mp4",
    "size": 8421760,
    "mimeType": "video/mp4",
    "uploadedAt": "2026-04-20T09:00:00.000Z",
    "source": "url",
    "urlReachable": true                // server đã HEAD check thành công
  }
}
```

**Lỗi:**
| HTTP | Trường hợp |
|------|------------|
| `400` | Thiếu `url`; URL không phải `http://` hoặc `https://` |
| `403` | Vượt quota dung lượng video (gói có `maxVideoStorageMb`) |
| `500` | Lỗi storage |

> ⚠️ **Yêu cầu URL:**
> - Phải **public** (không cần auth header).
> - iPhone tải qua mạng Tailscale → URL phải accessible từ Internet.
> - Nếu host trên S3/R2: phải bật **public read** hoặc dùng presigned URL còn hiệu lực.
> - `urlReachable: false` không chặn việc đăng ký, nhưng cảnh báo URL có thể bị từ chối khi chạy.

### 15.4 `DELETE /videos/:id` — Xóa video đã đăng ký

Chỉ xóa video có `source: "url"`. Video upload qua dashboard (`source: "upload"`) phải xóa qua dashboard để giải phóng R2 quota.

**Response 200:**
```json
{ "success": true }
```

**Lỗi:**
| HTTP | Trường hợp |
|------|------------|
| `400` | Video upload qua dashboard, không xóa qua API được |
| `404` | Video không tồn tại |

---

## 16. ⭐ LUỒNG ĐĂNG VIDEO TỰ ĐỘNG

### 16.1 Tổng quan luồng

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AI / BOT                          PhoneAgent Server         iPhone      │
├──────────────────────────────────────────────────────────────────────────┤
│  1. POST /videos/register      →   Tạo metadata             │            │
│     {url, name}                ←   {id: "vid_abc"}           │            │
│                                                                          │
│  2. GET  /devices?status=online →  Tìm máy rảnh             │            │
│                                ←   [{id: "dev_001", ...}]    │            │
│                                                                          │
│  3. POST /scripts/:id/run      →   Inject {{video_id}}      │            │
│     {deviceId, variables: {                                             │
│       video_id: "vid_abc",                                              │
│       caption: "..."                                                    │
│     }}                         ←   {message: "started"}                  │
│                                    Thực thi async:                       │
│                                    - Mở app TikTok          → launch     │
│                                    - send_file              → tải video  │
│                                                                ↓ về Photos│
│                                    - Chọn video             → tap        │
│                                    - Type caption           → type       │
│                                    - Bấm Đăng               → tap        │
│                                                                          │
│  4. GET  /executions?limit=5   →   Tìm exec mới nhất                    │
│  5. Loop GET /executions/:id   →   status: running → success            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 16.2 Yêu cầu kịch bản (do người vận hành PhoneAgent thiết kế)

Để AI có thể "truyền đúng URL video vào đúng node", **kịch bản đăng video** phải được thiết kế theo template sau:

**Cấu trúc node bắt buộc:**

| Thứ tự | Node type | Tham số quan trọng | Ghi chú |
|--------|-----------|---------------------|---------|
| 1 | `launch` | `bundleId: "com.ss.iphone.ugc.Ame"` (TikTok VN) hoặc `"com.zhiliaoapp.musically"` (TikTok US) | Mở app trước khi tải video |
| 2 | `wait` | `seconds: 3` | Chờ app load |
| 3 | **`send_file`** | **`videoId: "{{video_id}}"`** | ⭐ Placeholder PHẢI là `{{video_id}}` để AI inject |
| 4 | `wait` | `seconds: 8` | Chờ video tải vào Photos |
| 5 | `tap` | `x, y` (toạ độ nút "+") | Mở giao diện upload |
| 6 | `select_video` | `tapX, tapY` | Chọn video vừa tải |
| 7 | `tap` | `x, y` (nút Tiếp theo) | |
| 8 | `tap` | `x, y` (ô caption) | |
| 9 | `type` | **`text: "{{caption}}"`** | ⭐ Placeholder cho caption |
| 10 | `tap` | `x, y` (nút Đăng) | |

**Quy ước placeholder bắt buộc:**

| Placeholder | Ý nghĩa | Ví dụ giá trị |
|-------------|---------|---------------|
| `{{video_id}}` | ID video đã đăng ký qua `/videos/register` | `"vid_abc123"` |
| `{{caption}}` | Nội dung caption | `"Video mới #fyp"` |
| `{{hashtags}}` | (tùy chọn) Hashtag riêng | `"#viral #trending"` |

**Người vận hành PhoneAgent** tạo kịch bản này 1 lần qua dashboard (kéo-thả node), sau đó AI chỉ cần biết `scriptId` để chạy.

### 16.3 Luồng end-to-end mẫu (Python)

```python
import os
import time
import requests

BASE_URL = "https://phoneagent.io.vn/api/v1/external"
TOKEN = os.environ["PHONEAGENT_API_TOKEN"]
HEADERS = {"X-API-Token": TOKEN, "Content-Type": "application/json"}

def post_video(video_url: str, caption: str, script_id: str) -> dict:
    """Đăng video lên TikTok thông qua PhoneAgent. Trả về kết quả execution."""

    # Bước 1: Đăng ký video bằng URL
    r = requests.post(f"{BASE_URL}/videos/register", headers=HEADERS, json={
        "url": video_url,
        "name": f"Auto post {time.strftime('%Y-%m-%d %H:%M')}",
    })
    r.raise_for_status()
    body = r.json()
    if not body["success"]:
        raise RuntimeError(f"Register video failed: {body['error']}")
    video_id = body["data"]["id"]
    if not body["data"].get("urlReachable"):
        print("⚠ Warning: URL không HEAD được, có thể fail khi tải")

    # Bước 2: Tìm device online
    r = requests.get(f"{BASE_URL}/devices?status=online", headers=HEADERS)
    devices = r.json()["data"]
    if not devices:
        raise RuntimeError("Không có device online")
    device_id = devices[0]["id"]
    device_name = devices[0]["name"]
    print(f"→ Dùng device: {device_name}")

    # Bước 3: Chạy kịch bản đăng video
    r = requests.post(f"{BASE_URL}/scripts/{script_id}/run", headers=HEADERS, json={
        "deviceId": device_id,
        "variables": {
            "video_id": video_id,
            "caption": caption,
        },
    })
    body = r.json()
    if not body["success"]:
        raise RuntimeError(f"Run script failed: {body['error']}")
    print(f"→ Đã khởi chạy: {body['data']['message']}")

    # Bước 4: Chờ 2s rồi tìm executionId mới nhất
    time.sleep(2)
    r = requests.get(f"{BASE_URL}/executions?limit=5", headers=HEADERS)
    execs = r.json()["data"]
    target = next((e for e in execs if e["targetName"] == device_name
                   and e["scheduleName"].startswith("API:")), None)
    if not target:
        raise RuntimeError("Không tìm được execution vừa tạo")
    exec_id = target["id"]
    print(f"→ Execution ID: {exec_id}")

    # Bước 5: Poll đến khi xong (timeout 10 phút)
    deadline = time.time() + 600
    while time.time() < deadline:
        r = requests.get(f"{BASE_URL}/executions/{exec_id}", headers=HEADERS)
        ex = r.json()["data"]
        status = ex["status"]
        done_steps = sum(1 for s in ex["steps"] if s["status"] == "success")
        print(f"   [{status}] {done_steps}/{len(ex['steps'])} steps")
        if status == "success":
            return {"ok": True, "executionId": exec_id, "execution": ex}
        if status == "error":
            return {"ok": False, "executionId": exec_id, "error": ex["error"], "execution": ex}
        time.sleep(5)

    return {"ok": False, "error": "Timeout sau 10 phút", "executionId": exec_id}


if __name__ == "__main__":
    result = post_video(
        video_url="https://cdn.example.com/clip001.mp4",
        caption="Video mới hôm nay 🔥 #fyp #viral",
        script_id="scr_001",
    )
    print("KẾT QUẢ:", result)
```

### 16.4 Cảnh báo & best practices cho luồng video

1. **URL phải public** — iPhone không thể dùng presigned URL hết hạn giữa chừng. Chọn URL hiệu lực ≥ 1 giờ.
2. **Format video** — TikTok khuyến nghị MP4 H.264 + AAC, dọc 9:16, dưới 4 phút, dưới 287 MB.
3. **Quota dung lượng** — Mỗi gói có `maxVideoStorageMb`. Sau khi đăng xong, gọi `DELETE /videos/:id` để dọn metadata (chỉ với video `source: "url"`).
4. **Timeout `send_file`** — 20 phút (đã set sẵn trong engine). Video lớn cần CDN tốc độ cao.
5. **Auto pre-delay** — Engine tự thêm 5 giây chờ trước mỗi node (trừ `wait`, `repeat`, `set`…) để app kịp render. Đừng chèn `wait` thừa.
6. **Account lock** — Khi script đang chạy trên một device, không gọi tap/swipe trực tiếp lên device đó (sẽ xung đột). Đợi execution xong.
7. **Nhiều video song song** — Mỗi device chạy 1 script tại 1 thời điểm. Để đăng nhiều video cùng lúc → dùng nhiều device khác nhau.

---

## 17. Variables injection

### 17.1 Cách hoạt động

Khi gọi `POST /scripts/:id/run` với `variables`, server thực hiện:

1. Lấy script gốc.
2. `JSON.stringify(steps)` → string.
3. Với mỗi `(key, value)` trong `variables`:
   - Escape `value`: `\` → `\\`, `"` → `\"`, newline → `\n`, tab → `\t`, CR → `\r`.
   - Replace **toàn bộ** `{{key}}` bằng `value` đã escape.
4. `JSON.parse` lại → script mới với giá trị đã chèn.
5. Chạy script mới (không lưu, không ảnh hưởng kịch bản gốc).

### 17.2 Quy tắc đặt placeholder

- Cú pháp: **`{{tên_biến}}`** (2 ngoặc nhọn, KHÔNG có dấu cách).
- `tên_biến` chỉ nên dùng `[a-zA-Z0-9_]`.
- Có thể dùng ở **bất kỳ trường string nào** trong `params` của step:
  ```json
  { "type": "type", "params": { "text": "Xin chào {{name}}" } }
  { "type": "send_file", "params": { "videoId": "{{video_id}}" } }
  { "type": "launch", "params": { "bundleId": "{{app_bundle}}" } }
  ```
- Không hỗ trợ biểu thức (`{{a + b}}`), điều kiện, hay nested.

### 17.3 Ví dụ với ký tự đặc biệt

```json
{
  "deviceId": "dev_001",
  "variables": {
    "caption": "Dòng 1\nDòng 2 với \"trích dẫn\" và emoji 🔥"
  }
}
```

Script step `{ "text": "{{caption}}" }` sau injection sẽ thành `{ "text": "Dòng 1\nDòng 2 với \"trích dẫn\" và emoji 🔥" }` — engine xử lý chính xác.

### 17.4 Inputs schema (mới — v1.1+)

Kịch bản có thể khai báo `inputs` schema để server validate `variables` trước khi chạy. Bot nên gọi `GET /scripts/:id/inputs` để discover schema trước khi gọi `/run`.

**Endpoint mới:** `GET /api/v1/external/scripts/:id/inputs`

Response:
```json
{
  "success": true,
  "data": {
    "scriptId": "scr_abc",
    "name": "Đăng TikTok (tái sử dụng)",
    "inputs": [
      { "name": "video_id", "label": "Video", "type": "video", "required": true },
      { "name": "caption", "label": "Caption", "type": "text", "required": true, "maxLength": 2200 },
      { "name": "hashtags", "label": "Hashtags", "type": "string", "default": "#fyp #viral" }
    ]
  }
}
```

**Types hỗ trợ:** `string`, `text`, `number`, `boolean`, `url`, `video`, `enum`.

**Validation rules khi gọi `/run`:**
- `required: true` mà không có giá trị → 400 kèm `field` name.
- `type: 'number'` + min/max → validate range.
- `type: 'url'` → chỉ http/https; block javascript:, file:, data:.
- `type: 'video'` → server check videoId tồn tại **và thuộc user gọi API** (cross-user → 400).
- `type: 'enum'` → phải thuộc options.
- `maxLength` (string/text) → reject nếu vượt.
- Payload `variables` tối đa 100KB.

**Response khi validation fail:**
```json
{ "success": false, "error": "Input \"caption\": bắt buộc nhưng không có giá trị", "field": "caption" }
```

**Backward compat:** Script không khai báo `inputs` vẫn hoạt động y như trước — `variables` được inject trực tiếp không qua validation (flow v1.0).

---

## 18. SDK ví dụ

### 18.1 cURL — kiểm tra nhanh

```bash
# Kiểm tra token
curl https://phoneagent.io.vn/api/v1/external/me \
  -H "X-API-Token: pa_live_xxx"

# Đăng ký video
curl -X POST https://phoneagent.io.vn/api/v1/external/videos/register \
  -H "X-API-Token: pa_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://cdn.example.com/clip.mp4","name":"Test"}'

# Chạy script
curl -X POST https://phoneagent.io.vn/api/v1/external/scripts/scr_001/run \
  -H "X-API-Token: pa_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev_001","variables":{"video_id":"vid_abc","caption":"Hi"}}'

# Lấy chi tiết execution
curl https://phoneagent.io.vn/api/v1/external/executions/exec_xyz \
  -H "X-API-Token: pa_live_xxx"
```

### 18.2 Node.js (axios)

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://phoneagent.io.vn/api/v1/external',
  headers: { 'X-API-Token': process.env.PHONEAGENT_API_TOKEN },
  timeout: 30000,
});

async function postVideo({ videoUrl, caption, scriptId }) {
  // 1. Register video
  const reg = await api.post('/videos/register', { url: videoUrl, name: 'Auto post' });
  const videoId = reg.data.data.id;

  // 2. Find online device
  const devs = await api.get('/devices', { params: { status: 'online' } });
  if (!devs.data.data.length) throw new Error('No online device');
  const device = devs.data.data[0];

  // 3. Run script
  const run = await api.post(`/scripts/${scriptId}/run`, {
    deviceId: device.id,
    variables: { video_id: videoId, caption },
  });
  console.log('Started:', run.data.data.message);

  // 4. Poll execution
  await new Promise(r => setTimeout(r, 2000));
  const list = await api.get('/executions', { params: { limit: 5 } });
  const exec = list.data.data.find(
    e => e.targetName === device.name && e.scheduleName.startsWith('API:')
  );
  if (!exec) throw new Error('Execution not found');

  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const r = await api.get(`/executions/${exec.id}`);
    const ex = r.data.data;
    console.log(`[${ex.status}] step ${ex.steps.length}`);
    if (ex.status === 'success') return { ok: true, execution: ex };
    if (ex.status === 'error') return { ok: false, error: ex.error, execution: ex };
    await new Promise(r => setTimeout(r, 5000));
  }
  return { ok: false, error: 'Timeout' };
}

postVideo({
  videoUrl: 'https://cdn.example.com/clip.mp4',
  caption: 'Video mới 🔥',
  scriptId: 'scr_001',
}).then(console.log).catch(console.error);
```

### 18.3 Python — xem mục [16.3](#163-luồng-end-to-end-mẫu-python)

---

## 19. Câu hỏi thường gặp & xử lý lỗi

### Q1: Token đúng nhưng vẫn nhận `401 Invalid or revoked API token`?
Token đã bị **revoke** trên dashboard, hoặc đã được regenerate (token cũ mất hiệu lực ngay). Tạo token mới ở **Settings → API Token**.

### Q2: `POST /scripts/:id/run` trả `400 Device is offline`?
Device không online. Kiểm tra:
1. iPhone có bật, mở Tailscale chưa.
2. `GET /devices/:id` xem `lastSeen` có gần đây không (< 60 giây).
3. Đợi heartbeat tự động (~15 giây) rồi thử lại.

### Q3: Script chạy nhưng node `send_file` báo `Video not found: vid_xxx`?
- `videoId` truyền sai, hoặc video đã bị xóa.
- Gọi `GET /videos/:id` để verify trước khi `run`.

### Q4: `send_file` báo `Timeout tải file` hoặc `Gửi file thất bại`?
- URL video không truy cập được từ iPhone (kiểm tra public access).
- Video quá lớn / mạng yếu — thử CDN gần Việt Nam.
- Server PhoneAgent set timeout 20 phút cho `send_file`.

### Q5: Làm sao biết script đang chạy đến node nào?
`GET /executions/:id` trả về `steps[]` với `status` từng step. Step đang chạy có `status: "running"`. Giao diện dashboard cũng hiển thị real-time.

### Q6: Có thể hủy execution đang chạy không?
**Hiện tại external API CHƯA có endpoint stop.** Phải vào dashboard → **Lịch sử → Đang chạy → Dừng**. Sẽ bổ sung trong v1.1.

### Q7: Tôi muốn đăng video song song trên 10 device, có cần gọi 10 lần `/scripts/:id/run`?
Có. Mỗi device chạy độc lập, gọi loop:
```python
for device_id in online_device_ids:
    api.post(f'/scripts/{script_id}/run', json={
        'deviceId': device_id,
        'variables': {'video_id': video_id, 'caption': caption}
    })
```
Lưu ý: 60 req/phút/token là quá đủ cho usecase này.

### Q8: Làm sao xử lý khi gặp `429`?
Đọc header `Retry-After`, đợi đúng số giây đó, rồi retry. Code mẫu:
```python
if r.status_code == 429:
    wait = int(r.headers.get('Retry-After', '60'))
    time.sleep(wait)
    # retry...
```

### Q9: Endpoint `/screenshot` trả binary, không phải JSON — không gặp `success/error` field?
Đúng. Chỉ duy nhất `GET /devices/:id/screenshot` trả `Content-Type: image/png` binary. Mọi endpoint khác đều JSON.

### Q10: Có webhook để nhận thông báo khi execution xong không?
**Chưa có** (v1.0). Hiện tại phải polling `GET /executions/:id`. Webhook sẽ ra ở v1.2.

---

## 20. Phụ lục — Bảng tham chiếu nhanh

### 20.1 Bảng endpoints

| Method | Path | Mô tả ngắn | Auth |
|--------|------|------------|------|
| GET | `/me` | User info + stats | ✅ |
| GET | `/devices` | List devices (filter `?status=`) | ✅ |
| GET | `/devices/:id` | Device detail | ✅ |
| GET | `/devices/:id/screenshot` | PNG binary | ✅ |
| POST | `/devices/:id/tap` | `{x, y}` | ✅ |
| POST | `/devices/:id/swipe` | `{fromX, fromY, toX, toY, duration}` | ✅ |
| POST | `/devices/:id/type` | `{text}` | ✅ |
| POST | `/devices/:id/key` | `{key}` | ✅ |
| POST | `/devices/:id/launch` | `{bundleId}` | ✅ |
| GET | `/device-groups` | List groups | ✅ |
| GET | `/scripts` | `{own, shared}` | ✅ |
| GET | `/scripts/:id` | Script detail | ✅ |
| POST | `/scripts/:id/run` | `{deviceId, variables?}` | ✅ |
| GET | `/schedules` | List schedules | ✅ |
| GET | `/schedules/:id` | Schedule detail | ✅ |
| PUT | `/schedules/:id/toggle` | Enable/disable | ✅ |
| GET | `/executions` | List (`?status=`, `?limit=`) | ✅ |
| GET | `/executions/:id` | Execution detail (steps + screenshots) | ✅ |
| GET | `/videos` | List videos | ✅ |
| GET | `/videos/:id` | Video detail | ✅ |
| POST | `/videos/register` | `{url, name?, mimeType?, size?}` | ✅ |
| DELETE | `/videos/:id` | Delete (chỉ video `source:url`) | ✅ |

### 20.2 Bảng node script (cho người thiết kế kịch bản)

| Type | Tham số chính | Mô tả |
|------|---------------|-------|
| `tap` | `x, y` | Chạm tỷ lệ 0-1 |
| `double_tap` | `x, y` | Chạm 2 lần |
| `swipe` | `fromX, fromY, toX, toY, duration` | Vuốt |
| `type` | `text` | Gõ text (hỗ trợ `{{var}}`) |
| `key` | `key: "home"\|"back"...` | Phím hệ thống |
| `launch` | `bundleId` | Mở app |
| `screenshot` | — | Chụp màn hình (lưu vào execution) |
| `clipboard` | `text?` | Đọc/ghi clipboard |
| **`send_file`** | **`videoId`** | **⭐ Truyền video về Photos. Phải dùng `{{video_id}}`** |
| `select_video` | `tapX, tapY` | Tap để chọn video trong picker |
| `clear_photos` | `deleteX, deleteY, ...` | Xóa album Photos |
| `wait` | `seconds` | Chờ |
| `wait_random` | `min, max` | Chờ ngẫu nhiên |
| `wait_for_pixel` | `pixelX, pixelY, expectedColor, tolerance, maxWait` | Chờ điểm ảnh chuyển màu |
| `repeat` | `count` + `children[]` | Lặp |
| `repeat_forever` | `children[]` | Lặp vô hạn |
| `login_account` | `accountIds[], usernameX, usernameY, passwordX, passwordY` | Auto login |
| `login_mail` | `accountIds[], emailX, emailY, emailPassX, emailPassY` | Login mail |
| `input_username` / `input_password` / `input_email` / `input_email_pass` | `accountIds[], tapX, tapY` | Nhập 1 trường từ tài khoản đã chọn |
| `get_otp_mail` | `accountIds[], waitTimeout, tapX, tapY` | Lấy OTP từ Gmail rồi tự nhập |

### 20.3 Bundle ID phổ biến

| App | Bundle ID |
|-----|-----------|
| TikTok Việt Nam | `com.ss.iphone.ugc.Ame` |
| TikTok Quốc tế | `com.zhiliaoapp.musically` |
| Facebook | `com.facebook.Facebook` |
| Mail | `com.apple.mobilemail` |
| Cài đặt | `com.apple.Preferences` |

### 20.4 Status values

| Resource | Trường | Giá trị |
|----------|--------|---------|
| Device | `status` | `online`, `offline`, `running`, `connecting` |
| Script | `status` | `active`, `idle`, `draft` |
| Execution | `status` | `running`, `success`, `error` |
| ExecutionStep | `status` | `pending`, `running`, `success`, `error` |

---

## Changelog

| Phiên bản | Ngày | Thay đổi |
|-----------|------|----------|
| 1.0 | 2026-04-20 | Bản đầy đủ đầu tiên. Bổ sung 4 endpoint `/videos`, `/videos/:id`, `/videos/register`, `/videos/:id` (DELETE) cho luồng đăng video tự động. |

---

**Liên hệ hỗ trợ:** wpresstore@gmail.com  
**Repo:** Phone-Agent / phoneagent-dashboard
