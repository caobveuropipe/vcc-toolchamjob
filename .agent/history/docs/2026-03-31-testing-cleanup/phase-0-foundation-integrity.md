# Test Cases: Phase 0 Foundation Integrity
> Ngày tạo: 2026-03-14
> Liên quan đến: Phase 0 Foundation / Senior Architect Review

## Phân loại Test

| # | Loại | Use Case | Steps | Kết quả mong đợi | Mức ưu tiên |
|---|------|----------|-------|-------------------|-------------|
| 1 | ✅ Happy Path | Build order verification | Chạy pipeline CI hoặc Docker build | `@vcc/shared` build xong trước khi các package khác bắt đầu | 🔴 Cao |
| 2 | 🔒 Security | Secret Manager Injection | Deploy lên Cloud Run | App lấy được keys từ Secret Manager, không leak ra log console | 🔴 Cao |
| 3 | 📉 Performance| Stress test RAM Export | Gọi API export giả lập 4000 NS | Tiêu tốn RAM của Backend ổn định dưới ngưỡng 512Mi | 🔴 Cao |
| 4 | 🔒 Security | Health Check Auth | Gọi `/health/detail` không có header `X-Health-Key` | Trả về lỗi 401 Unauthorized | 🔴 Cao |

## Chi tiết từng Use Case

### UC-1: Build order verification (✅ Happy Path)
- **Precondition:** Monorepo đã khởi tạo, `@vcc/shared` có tsup config.
- **Given:** Mã nguồn có thay đổi ở cả shared và backend.
- **When:** Trigger GitHub Actions hoặc Docker build.
- **Then:** Bước build `@vcc/shared` phải thành công đầu tiên. Các bước sau (FE/BE build) mới được thực thi.

### UC-2: Secret Manager Injection (🔒 Security)
- **Precondition:** Đã tạo secret trên GCloud Secret Manager.
- **Given:** Cloud Run được cấu hình sử dụng secrets.
- **When:** Backend khởi động.
- **Then:** `config/env.ts` validate thành công các biến `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_TOKEN`. Pipeline build không in giá trị secret ra log.

### UC-3: Stress test RAM Export (📉 Performance)
- **Precondition:** DB có dữ liệu mẫu 4000 dòng NS.
- **Given:** Backend chạy với limit 512Mi RAM.
- **When:** Thực hiện request lấy toàn bộ dữ liệu NS kèm join lương.
- **Then:** Pod không bị OOM (Out of Memory) killed. RAM peak không vượt quá 512Mi.

### UC-4: Health Check Auth (🔒 Security)
- **Precondition:** App đã start và có `HEALTH_CHECK_KEY`.
- **Given:** Endpoint `/health/detail` đã được exposure.
- **When:** Request tới `/health/detail` không mang theo header `X-Health-Key`.
- **Then:** Server trả về status code 401. Không rò rỉ thông tin tình trạng DB/Redis.
