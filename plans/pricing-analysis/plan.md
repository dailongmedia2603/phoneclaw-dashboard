# Báo cáo phân tích chi phí & Đề xuất gói giá PhoneAgent SaaS

---

## 1. PHÂN TÍCH TÀI NGUYÊN VPS

### VPS hiện tại: GOLD RAM 2
| Thông số | Giá trị |
|----------|---------|
| CPU | 2 vCPU (Intel Xeon Gold-6148) |
| RAM | 8 GB |
| SSD | 40 GB NVMe |
| Bandwidth | Không giới hạn, 200Mbps |
| Giá | **180.000đ/tháng** |

---

## 2. CHI PHÍ TÀI NGUYÊN TRÊN MỖI PHONE

### 2.1 RAM — Tài nguyên giới hạn chính

| Thành phần | RAM tiêu thụ | Ghi chú |
|------------|-------------|---------|
| **Hệ điều hành** | ~500 MB | Ubuntu/Debian minimal |
| **Node.js process** (base) | ~150 MB | Express + modules loaded |
| **PostgreSQL** | ~200 MB | Connection pool, buffers |
| **Nginx** | ~30 MB | Reverse proxy |
| **PM2** | ~50 MB | Process manager |
| **Tổng cố định** | **~930 MB** | Không phụ thuộc số user/phone |

**RAM khả dụng cho users: 8 GB - 930 MB ≈ 7 GB**

| Thành phần per-phone | RAM | Ghi chú |
|----------------------|-----|---------|
| Device data in-memory (ipDeviceMap) | ~50 bytes | HashMap entry |
| HTTP Keep-Alive agent | ~20-30 KB | Max 10 connections/phone |
| Heartbeat processing | ~1 KB | Mỗi 30 giây |
| Script execution (khi chạy) | ~2-5 KB | activeExecutions map + steps |
| **VNC proxy (khi mở remote)** | **30-50 MB** | websockify subprocess |
| WebSocket per browser tab | ~10 KB | Mỗi user mở 1 tab dashboard |

**Kết luận RAM:**
- **Phone ở trạng thái idle** (heartbeat only): **~50 KB/phone** → gần như không đáng kể
- **Phone đang chạy script**: **~5 KB thêm** → vẫn không đáng kể  
- **Phone đang xem VNC remote**: **30-50 MB/phone** → **đây là bottleneck chính**

### 2.2 CPU — Tải theo hoạt động

| Hoạt động | CPU load | Tần suất |
|-----------|----------|----------|
| Heartbeat handler | ~0.1% | Mỗi 30s/phone |
| Staleness check (tất cả phones) | ~0.5% | Mỗi 30s |
| Scheduler check (tất cả schedules) | ~1% | Mỗi 60s |
| Script execution (per step) | ~0.5% burst | HTTP call → device |
| VNC streaming | ~2-5% | Liên tục khi mở |
| REST API request | ~0.1% | Per request |

**Kết luận CPU (2 vCPU):**
- 50 phones idle: ~5% CPU tổng (heartbeat + staleness)
- 10 phones chạy script đồng thời: ~10% thêm
- 5 VNC sessions đồng thời: ~15-25% thêm
- **Bottleneck CPU: khoảng 50-80 phones trước khi CPU bão hòa**

### 2.3 Disk — SSD 40GB

| Dữ liệu | Kích thước/user (10 phones) |
|----------|---------------------------|
| Tenant data (devices, scripts, schedules) | ~1-2 MB |
| Execution history (500 entries) | ~500 KB - 1 MB |
| Notifications, logs | ~200 KB |
| **Tổng per user** | **~2-3 MB** |

**SSD 40 GB:** Hệ thống + dependencies ~5 GB → 35 GB khả dụng  
→ **Đủ cho 10.000+ users** (chỉ tính data, không tính video R2)

### 2.4 Network — 200Mbps

| Hoạt động | Bandwidth |
|-----------|-----------|
| Heartbeat (per phone) | ~1 KB/30s = 0.3 KB/s |
| VNC stream (per session) | ~500 KB/s - 2 MB/s |
| Script API calls | ~1-5 KB/call |
| Dashboard API | ~10-50 KB/load |

**Bottleneck network: VNC streaming**  
- 200 Mbps ÷ 1 MB/s per VNC ≈ **25 VNC sessions đồng thời max**

---

## 3. XÁC ĐỊNH DUNG LƯỢNG TỐI ĐA

### Kịch bản thực tế (không tính VNC đồng thời)

Phần lớn thời gian, phones chạy script tự động — user không mở VNC. VNC chỉ dùng khi cần debug/giám sát.

| Tài nguyên | Giới hạn | Phones tối đa |
|------------|----------|---------------|
| **RAM** (7 GB khả dụng) | 50 KB/phone idle | **~140.000 phones** (idle) |
| **RAM** với 5 VNC đồng thời | 250 MB + overhead | **~120 phones** + 5 VNC |
| **CPU** (2 vCPU) | Heartbeat + scheduler | **~80 phones** |
| **Disk** (35 GB) | 3 MB/user | **~10.000 users** |
| **Network** | VNC bottleneck | **25 VNC đồng thời** |

### → Dung lượng thực tế VPS GOLD RAM 2: **60-80 phones** (ổn định)

Lý do giới hạn ở 60-80:
- CPU cho heartbeat (30s interval × 80 phones) + scheduler + occasional script execution
- Để dư headroom cho burst (nhiều phones chạy script cùng lúc)
- VNC occasional use (5-10 sessions đồng thời)

---

## 4. TÍNH CHI PHÍ TRÊN MỖI PHONE

### VPS GOLD RAM 2: 180.000đ/tháng ÷ 70 phones (trung bình) = **~2.570đ/phone/tháng**

Làm tròn và thêm biến phí:

| Khoản chi | Chi phí/phone/tháng | Ghi chú |
|-----------|--------------------:|---------|
| VPS (phần cứng) | 2.570đ | 180K ÷ 70 |
| R2 Storage (video) | ~500đ | ~50MB video/phone/tháng |
| Domain + SSL | ~200đ | ~150K/năm ÷ 70 phones ÷ 12 |
| Dự phòng/bảo trì | ~730đ | ~20% chi phí VPS |
| **Tổng chi phí/phone/tháng** | **~4.000đ** | |

---

## 5. ĐỀ XUẤT CÁC GÓI BÁN

### Nguyên tắc định giá
- **Giai đoạn đầu:** Giá thấp để thu hút người dùng, tạo cộng đồng
- **Mua nhiều → giá tốt hơn:** Khuyến khích user scale up
- **Biên lợi nhuận mục tiêu:** 50-70% (phù hợp SaaS giai đoạn đầu)
- **Tâm lý giá:** Dưới 50K/phone dễ quyết định, trên 100K cần suy nghĩ

### Bảng giá đề xuất

| Gói | Số phone | Giá/tháng | Giá/phone | Giảm so với Basic | Biên LN |
|-----|----------|----------:|----------:|-------------------:|--------:|
| **Starter** | 1 phone | **49.000đ** | 49.000đ | — | 92% |
| **Basic** | 3 phones | **99.000đ** | 33.000đ | -33% | 75% |
| **Pro** | 10 phones | **249.000đ** | 24.900đ | -49% | 60% |
| **Business** | 30 phones | **499.000đ** | 16.633đ | -66% | 58% |

### Chi tiết tính toán lợi nhuận

**Giả sử bán được 70 phones (đầy VPS):**

| Kịch bản mix | Doanh thu/tháng | Chi phí VPS | Biên LN |
|-------------|----------------:|------------:|--------:|
| 70× Starter (49K) | 3.430.000đ | 180.000đ | **95%** |
| 10× Basic (99K) + 4× Pro (249K) | 1.986.000đ | 180.000đ | **91%** |
| 2× Business (499K) + 1× Pro (249K) | 1.247.000đ | 180.000đ | **86%** |
| **Mix thực tế:** 5 Starter + 5 Basic + 3 Pro + 1 Business | 1.991.000đ | 180.000đ | **91%** |

### Tại sao biên lợi nhuận cao?

Vì **chi phí VPS rất thấp** (180K/tháng). Đây là lợi thế lớn của model self-hosted VPS:
- Không có chi phí per-API-call (như AWS Lambda)
- Không có chi phí per-GB-transfer (bandwidth unlimited)
- Chi phí cố định — càng nhiều user càng hời

Tuy nhiên cần tính thêm:
- **Thời gian phát triển/bảo trì** của bạn (chưa tính)
- **Chi phí hỗ trợ khách hàng** (chưa tính)
- **Chi phí marketing** (chưa tính)

→ Biên LN 50-70% sau khi trừ chi phí vận hành con người là hợp lý.

---

## 6. TÍNH NĂNG MỖI GÓI

| Tính năng | Starter | Basic | Pro | Business |
|-----------|:-------:|:-----:|:---:|:--------:|
| Số phone tối đa | 1 | 3 | 10 | 30 |
| Kịch bản tự tạo | 5 | 15 | Không giới hạn | Không giới hạn |
| Kho kịch bản (shared) | ✅ | ✅ | ✅ | ✅ |
| Lịch trình (schedules) | 2 | 5 | 20 | Không giới hạn |
| Thư viện video | 500 MB | 2 GB | 10 GB | 50 GB |
| VNC Remote | ✅ | ✅ | ✅ | ✅ |
| Proxy management | ❌ | ✅ | ✅ | ✅ |
| Hỗ trợ | Community | Email | Email ưu tiên | Chat trực tiếp |

---

## 7. KẾ HOẠCH SCALE KHI TĂNG TRƯỞNG

| Mốc | VPS cần | Chi phí/tháng | Phones max |
|------|---------|-------------:|----------:|
| 0-70 phones | GOLD RAM 2 (2C-8G) | 180.000đ | 70 |
| 70-200 phones | GOLD RAM 3 (6C-16G) | 400.000đ | 200 |
| 200-500 phones | GOLD RAM 4 (8C-32G) | 750.000đ | 500 |
| 500+ phones | 2× GOLD RAM 4 + Load Balancer | ~1.800.000đ | 1000+ |

**Chi phí/phone giảm khi scale:**
- 70 phones: 2.570đ/phone
- 200 phones: 2.000đ/phone  
- 500 phones: 1.500đ/phone

→ **Biên lợi nhuận tăng theo quy mô**

---

## 8. TÓM TẮT

### Con số quan trọng:
- **Chi phí thực/phone/tháng:** ~4.000đ (bao gồm dự phòng)
- **Giá bán thấp nhất nên là:** 16.000đ/phone/tháng (gói Business 30 phones)
- **Giá bán cao nhất:** 49.000đ/phone/tháng (gói Starter 1 phone)
- **VPS hiện tại chứa tối đa:** ~70 phones ổn định
- **Doanh thu tiềm năng (đầy VPS):** 1.2M - 3.4M đ/tháng
- **Biên lợi nhuận (trước chi phí con người):** 86-95%

### Khuyến nghị:
1. **Bắt đầu với 4 gói** như đề xuất — đủ linh hoạt, không quá phức tạp
2. **Giá Starter 49K** là mức tâm lý dễ chấp nhận cho người mới thử
3. **Push gói Pro (249K/10 phones)** là sweet spot — giá hợp lý, đủ doanh thu
4. **Offer trial 7 ngày miễn phí** gói Starter để giảm rào cản entry
5. **Nâng VPS lên GOLD RAM 3** khi đạt 50+ phones (đừng chờ đến 70)
