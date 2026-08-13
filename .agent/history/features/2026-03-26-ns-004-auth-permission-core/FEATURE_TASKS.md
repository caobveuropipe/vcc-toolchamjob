# Feature Tasks: Phase 1 NS-004 Core

## Phase 1.1: Authentication Middleware & Dev Auth Concept
- [x] Task 1.1.1: Bật thủ công provider `Email/Password` trên Local Supabase. Tạo `frontend/src/pages/Login.tsx` bọc form Email DEV Login ẩn dưới cờ `NODE_ENV === 'development'`. **Production Deployment: DevOps tắt hẳn Provider Email trên Supabase Dashboard để chặn cứng ở tầng Cloud.**
- [x] Task 1.1.2: Setup `backend/src/middleware/auth.ts` verify JWT. Bổ sung `fallback supabase.auth.getUser()`.
- [x] Task 1.1.3: Cập nhật `packages/shared` xác nhận `SALARY_FIELDS` đang tồn tại sẵn sàng. Tạm thời sync hằng số `EXPORT_LIMIT = 5000` vào constants.
- [x] Task 1.1.Final: 🧪 Cài đặt Backend Test Harness (Vitest). Viết Integration test script sử dụng **Real Tokens** từ các tài khoản seed để tự động test Auth Middleware chặn/từ chối.

## Phase 1.2: Permission Middleware & Rate Limiting Backend
- [x] Task 1.2.1: Implement logic query DB (Fallback): `superadmins`, `user_permissions`, `employee_reviewers`. BẮT BUỘC có lệnh chuẩn hóa email (`email.trim().toLowerCase()`) để map chính xác ID.
- [x] Task 1.2.2: Implement `permission.ts` middleware - query Redis trước theo định dạng Key `perm:{email.trim().toLowerCase()}`. Mọi "Active Invalidation" bọc trong try-catch, log lỗi Critical nếu Upstash rớt.
- [x] Task 1.2.3: Implement logic chặn truy cập IDOR (lấy role chính xác) và ép ẩn `SALARY_FIELDS` đối với Role VI qua views `employee_info_only`.
- [x] Task 1.2.4: Code `backend/src/middleware/rateLimit.ts` theo chuẩn Master Plan: `100 req/min` chung và `20 req/min` API nhạy cảm. **Thiết lập Fail-open logic (Allow + Log Error) khi Upstash Redis không khả dụng.**
- [x] Task 1.2.Final: 🧪 Viết Test Automation cho Rate Limit (`429 Too Many Requests`) và Fallback DB test. **BẮT BUỘC: Thêm test case giả lập (Mock) đánh sập Redis để verify tính năng "Fail-open" (Request Pass 200 OK + Bắn Critical Log) hoạt động đúng chức năng.**

## Phase 1.3: Giao tiếp FE-BE & UI Stores (Rebase Hardening)
- [x] Task 1.3.1: Dựng endpoint `GET /api/users/me/permissions` ở BE trả data UI Role (kèm cờ `is_reviewer: boolean`). FE cập nhật `MainLayout.tsx` / `App.tsx` theo **Ma trận Route/Menu rạch ròi**: (1) `/employees`: EA/VI/VA/SA hoặc `is_reviewer=true`. (2) `/salaries`: EA/VA/SA. (3) `/snapshots`: EA/VA/SA. (4) `/admin/permissions`: SA.
- [x] Task 1.3.2: Khóa cổng Hydration (FE Gate): Cập nhật `authStore.ts` thêm `isPermissionHydrated`. Code **Route-level Guard** trong `ProtectedRoute.tsx` block mọi deep-link trái phép theo ma trận trên. Tạo trang `frontend/src/pages/errors/403.tsx`. **Terminal State**: Lỗi API -> Logout. Vào route không nạp quyền -> Redirect `/403-access-denied`.
- [x] Task 1.3.3: Code `frontend/src/utils/exportExcel.ts` dummy data + watermark. **Sử dụng hằng số `EXPORT_LIMIT` từ shared package để chặn export nếu vượt giới hạn.** Áp dụng kỹ thuật Lazy Load: `await import('xlsx')` để không phình chunk Vite.
- [x] Task 1.3.Final: 🧪 Đăng nhập giao diện bằng acc Google thật (trên Deploy) hoặc Acc DEV Test (Local), check Payload rớt về từ API `/api/users/me/permissions`, bấm Export load file Excel dummy thành công.

## Phase 1.4: Automation Seed & E2E Validation
- [x] Task 1.4.1: Code script seeder `scripts/seed_dev_users.ts`. BẮT BUỘC: Tạo account Mixed-Permission và Reviewer Override. Set **Password tĩnh (vd: `Vcc123!_`)**. **Tích hợp Allowlist Fail-fast: Bắt buộc check cờ `ALLOW_DEV_SEED="true"` trong file môi trường; nếu vắng mặt -> Throw Error crash script ngay lập tức để phòng hờ thảm hoạ nhầm lẫn.**
- [x] Task 1.4.2: Cài đặt Integration Test (Unit/Integration tách biệt). Test Automation (Harness) sẽ auto login các mock roles bằng Token thật. Acceptance Criteria: **Phải catch/pass được 2 scenario phức tạp (Mixed + Reviewer)**.
- [x] Task 1.4.Final: 🧪 Reviewer xác nhận Acceptance Criteria: Coverage Test hoàn chỉnh. Middleware Auth chặn đúng, Gate UI hoạt động, Rate Limit Fallback ngậm lỗi (Fail-open) đúng yêu cầu. Plan Phase 1 chốt.

---

## Execution Log
| Thời gian | Phase | Hành động | Trạng thái |
|-----------|-------|-----------|-----------|
| 17:03 | 1.1 | Khởi tạo auth middleware, AuthStore, Export Limit và Vitest Harness | ✅ |
| 17:09 | 1.2 | Permission Cache DB Fallback, Route Guard, Fail-open Rate Limit và Tests | ✅ |
| 17:15 | 1.3 | `/me/permissions` API, FE Hydration Gate, Route Guard, Menu Pruning và Excel Export | ✅ |
| 22:34 | 1.4 | Tạo Seeder cấp Mock Users (ALLOW_DEV_SEED fail-fast protection) | ✅ |
| 23:25 | 1.F | Đang Debug lỗi 403 (mặc dù đã seed tài khoản) | 🚧 |
| 13:42 | 1.F | Fix Root Cause (Backend DB Column Mismatch + FE Safe API Parsing) | ✅ |
| 13:45 | 1.F | Fix lỗi script Seed bị skip và Bump Cache v3 để Refresh Redis | ✅ |
| 13:47 | 1.3 | Hoàn thành Task 1.3.Final (Kiểm thử thực tế pass) | ✅ |
| 13:48 | 1.4 | Viết và run pass Integration Test Harness cho 2 scenario Mixed + Reviewer | ✅ |
| 13:58 | 1.4 | Chuyển sang Task 1.4.Final để chốt hạ toàn bộ Phase 1 | 🔄 |
| 14:14 | 1.4 | Hoàn thành Phase 1. Trạng thái tổng: Hoàn Thành | ✅ |

---
### 📝 Troubleshooting Notes (Active Session)
- **Problem**: Đăng nhập bằng `loi.admicro@gmail.com` bị đẩy về 403 / 502 do bug.
- **Root Cause (Verified)**: 
  1. Lỗi DB Mismatch cột `user_email` và `permission_level` làm mảng quyền rỗng.
  2. Lỗi `seed_dev_users.ts` báo string check `already been registered` sai làm skip seed permission.
  3. Frontend `lib/api.ts` dùng lệnh `res.json()` văng ngoại lệ `Unexpected input` che lấp lỗi 502.
- **Resolution**: 
  1. Đã sửa `permission.ts` dùng đúng cột DB và bump cache `v3` lên để ép nạp quyền mới từ DB.
  2. sửa `seed_dev_users.ts` bắt đúng message Supabase và đã run seed thành công.
  3. Đã thay `authStore.ts` sang gọi API Client an toàn từ `services/api.ts`.
- **Status**: Chờ test manual ở Phase 1.3.Final.
