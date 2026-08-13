# Test Cases: Phase 0 Foundation Verification
> Ngày tạo: 2026-03-14
> Liên quan đến: Phase 0 Foundation Plan (Phản biện v2)

## Phân loại Test

| # | Loại | Use Case | Steps | Kết quả mong đợi | Mức ưu tiên |
|---|------|----------|-------|-------------------|-------------|
| 1 | ✅ Happy Path | Local Setup | Chạy `pnpm install` từ root | Thành công, nhận diện 3 workspaces, build được @vcc/shared | 🔴 Cao |
| 2 | ✅ Happy Path | Cloud Run Deploy | Deploy image lên Cloud Run | API trả về 200 tại endpoint /health | 🔴 Cao |
| 3 | 🔒 Security | RLS Safety Check | Dùng anon key query `employees` qua REST API | Trả về mảng rỗng [] (Access Denied bởi chính sách USING false) | 🔴 Cao |
| 4 | 🔒 Security | Health Detail Auth | Gọi `/health/detail` không có header `X-Health-Key` | Trả về 401 Unauthorized | 🔴 Cao |
| 5 | ⚠️ Edge Case | Redis Failure | Shut down Redis và startup app | App vẫn khởi động được (graceful), /health/detail báo Redis `unavailable` | 🟡 Trung bình |
| 6 | ❌ Negative | Schema Sync Fail | Xóa 1 cột trong database/001_schema.sql và chạy CI | CI Test Task 0.4.13 phải báo lỗi không khớp Schema giữa Zod và DB | 🔴 Cao |

## Chi tiết từng Use Case

### UC-1: Local Setup (✅ Happy Path)
- **Precondition:** Đã cài đặt pnpm và Node.js 20+.
- **Given:** Codebase vừa clone về.
- **When:** Chạy `pnpm install`.
- **Then:** Thư mục node_modules được tạo, `pnpm-lock.yaml` được tạo/cập nhật, lệnh build `packages/shared` thành công.

### UC-4: Health Detail Auth (🔒 Security)
- **Precondition:** App đã deploy.
- **Given:** Endpoint `/health/detail` đã được bảo vệ.
- **When:** Gởi request GET mà không kèm header `X-Health-Key`.
- **Then:** Server trả về HTTP 401. Khi gởi đúng key (từ Secret Manager), trả về 200 kèm chi tiết hệ thống.
