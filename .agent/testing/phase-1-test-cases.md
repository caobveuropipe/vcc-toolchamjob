# Test Cases: NS-004 Core (Auth & Permission Engine)
> Ngày tạo: 2026-03-20
> Liên quan đến: Phase 1

## Phân loại Test

| # | Loại | Use Case | Steps | Kết quả mong đợi | Mức ưu tiên |
|---|------|----------|-------|-------------------|-------------|
| 1 | ✅ Happy Path | Đăng nhập Email DEV | Gõ email `loi.admicro@gmail.com` + Pass `Vcc123!_` | Đăng nhập thành công, vào Dashboard, Role EA hiện ở Header | 🔴 Cao |
| 2 | ✅ Happy Path | EA truy cập Employees | Đăng nhập EA -> Click menu Nhân sự | Xem được danh sách nhân sự (EA có quyền) | 🔴 Cao |
| 3 | 🔒 Security | Unauthorized Route | Đăng nhập EA -> Truy cập thẳng /admin/permissions | Bị redirect sang trang 403 Access Denied | 🔴 Cao |
| 4 | ❌ Negative | Sai thông tin Login | Gõ sai password | Báo lỗi credentials, không cho vào | 🟡 Trung bình |
| 5 | ⚠️ Edge Case | Redis Down (Fail-open) | Giả lập Redis tạch (Cache Busting v2) | Hệ thống vẫn cho login, nạp quyền từ DB chậm hơn chút nhưng không crash | 🔴 Cao |
| 6 | 🔒 Security | Logout từ trang 403 | Ở trang 403 -> Bấm Logout | Xóa sạch session, về màn hình Login | 🔴 Cao |
| 7 | 🔒 Security | Rate Limit IP Trust | Dùng proxy gán X-Forwarded-For giả | Hệ thống lấy đúng IP thật ở hop đầu tiên, chặn spoofing thành công | 🔴 Cao |
| 8 | 🔒 Security | Webhook Invalidation Auth | Gọi webhook không có secret | Trả về 401 Unauthorized, không cho invalidate cache vô tội vạ | 🔴 Cao |
| 9 | ✅ Happy Path | Schema Sync (25 cột) | Chạy pnpm test shared | Pass kiểm tra 25 trường lương bao gồm `tam_ung_hang_thang` | 🟡 Trung bình |
| 10| ✅ Happy Path | CI Integration Test | Chạy pnpm test backend | Pass integration test bằng `app.request` mà không cần bật server cổng 8080 | 🔴 Cao |
| 11| ✅ Happy Path | Mixed-Permission Nạp Quyền | Đăng nhập `mixed.dev@vccorp.vn` | Pass: nạp đúng 2 dòng permission (EA Admicro + VI KND) | 🔴 Cao |

## Chi tiết từng Use Case

### UC-1: Đăng nhập Email DEV (✅ Happy Path)
- **Precondition:** Đã chạy script `seed_dev_users.ts` thành công.
- **Given:** Người dùng chưa đăng nhập.
- **When:** Nhập đúng Email và Password của tài khoản Seed.
- **Then:** Chuyển vào trang chủ, console không báo lỗi 401/404.

### UC-3: Unauthorized Route (🔒 Security)
- **Precondition:** Đăng nhập với role EA (Human Resources).
- **Given:** Đang ở Dashboard.
- **When:** Gõ tay URL `http://localhost:5173/admin/permissions`.
- **Then:** Component `ProtectedRoute` chặn và đẩy về `/403-access-denied`.

### UC-11: Mixed-Permission Nạp Quyền (✅ Happy Path)
- **Precondition:** Đã chạy `pnpm seed` có account mixed.
- **Given:** User có nhiều quyền trên nhiều khối (EA khối A, VI khối B).
- **When:** Đăng nhập và gọi API `/api/users/me/permissions`.
- **Then:** Payload trả về mảng `permissions` chứa đủ 2 dòng với level và khối tương ứng.
