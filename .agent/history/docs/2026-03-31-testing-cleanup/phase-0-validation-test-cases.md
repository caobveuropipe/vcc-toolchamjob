# Test Cases: Phase 0 Validation & Hardening
> Ngày tạo: 2026-03-16
> Liên quan đến: Phase 0 Foundation Fixes (Build, Security, Monitoring)

## Phân loại Test

| # | Loại | Use Case | Steps | Kết quả mong đợi | Mức ưu tiên |
|---|------|----------|-------|-------------------|-------------|
| 1 | ✅ Happy Path | Verify Health /detail | Gọi `GET /health/detail` với header `X-Health-Key` đúng | Trả về 200 OK, redis: "connected", db: "connected" | 🔴 Cao |
| 2 | 🔒 Security | Nginx CSP Hardening | Mở Browser Console, xem các API kết nối tới Cloud Run | Không bị block (connect-src allowed); Header HSTS hiện diện | 🔴 Cao |
| 3 | ❌ Negative | API client error unwrap | Backend trả về 200 nhưng không có field `data` | Client parse object gốc, không gây crash ứng dụng | 🟡 Trung bình |
| 4 | 🔒 Security | RLS Migration Verification | Chạy script `verify-rls.ts` | Trả về 403 hoặc empty data cho bảng `snapshots` (khi dùng Anon key) | 🔴 Cao |

## Chi tiết từng Use Case

### UC-1: Verify Health /detail (✅ Happy Path)
- **Precondition:** Server đang chạy, Redis và DB đã được config.
- **Given:** URL backend `/health/detail`.
- **When:** Header `X-Health-Key` = `<HEALTH_CHECK_KEY>`.
- **Then:** Status code 200, `checks.redis` === "connected" (ping thực tế).

### UC-2: Nginx CSP Hardening (🔒 Security)
- **Precondition:** Build docker frontend và deploy.
- **Given:** Website frontend.
- **When:** Thực hiện login hoặc gọi API.
- **Then:** `Content-Security-Policy` header chứa `connect-src ... https://*.run.app`. Trình duyệt cho phép kết nối.

### UC-3: Redis degraded state (⚠️ Edge Case)
- **Precondition:** Stop Redis instance hoặc sai Token.
- **Given:** URL backend `/health/detail`.
- **When:** Gọi request.
- **Then:** Status code 200 hoặc 503 tùy mức độ, `checks.redis` báo `error: ...`. Hệ thống chính vẫn hoạt động.
