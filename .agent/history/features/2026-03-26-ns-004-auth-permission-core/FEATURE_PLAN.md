# Feature Plan: Phase 1 NS-004 Core (Auth & Permission Engine)

> **Trạng thái**: ✅ Đã duyệt sau vòng The Reviewer
> **Tạo bởi**: skill-feature-plan
> **Ngày tạo**: 2026-03-17 (Update: 2026-03-19)

---

## 1. Mô tả

Xây dựng "trái tim" của hệ thống — Bộ lọc quyền.
Mục tiêu: Đảm bảo API middleware check quyền EA/VI/VA/SA hoạt động đúng, cache permission logic ổn định thông qua Upstash Redis và FE xử lý login/logout/bảo vệ routes. Thêm IDOR protection, Rate Limit (bị rớt từ Phase 0 sang), và Ẩn salary fields cho VI. Export utils bảo vệ dữ liệu ở mặt FE.

## 2. Đối chiếu Knowledge Base & Review Gaps

- **Auth Mode**: Chốt kiến trúc Google Login. Để test local với seed accounts, thiết lập song song Provider `Email/Password` (khóa sau UI bằng cờ `NODE_ENV` và **tắt cứng Provider Email trên Supabase Production** để chặn dứt điểm từ Cloud).
- **Cache Definition**: Redis cache map thiết kế dưới dạng 1 key/user: `perm:{email.trim().toLowerCase()}` => JSON string ma trận quyền đầy đủ (EA/VI/VA/Reviewer). Việc force trim() + toLowerCase() giúp triệt tiêu triệt để lỗi Cache Miss do sai lệch case-sensitive.
- **Contract Boundary (`/me/permissions`)**: Ranh giới kiến trúc: API `GET /api/users/me/permissions` CHỈ trả về UI-level Roles và bổ sung cờ `is_reviewer: boolean`. Toàn bộ logic quyền "Reviewer" là Backend-only (Phase 2 mảng List API sẽ trả cờ `can_edit`). Bổ sung `is_reviewer` giúp tránh đá oan account "Reviewer-only" ra khỏi App.
- **FE Hydration Gate & Route Guard**: Component `ProtectedRoute` bắt buộc đợi `isPermissionHydrated`. Tích hợp **Route-level Guard** để block triệt để Deep-link theo quyền. Terminal State: Nếu API lỗi -> Logout. Nếu mảng quyền rỗng VÀ `is_reviewer=false` -> Redirect `/403-access-denied`.
- **Rate Limiting & Risk Acceptance**: Áp dụng chiến lược **Fail-open (Allow + Critical Log)** nếu Redis sập. (Quyết định Risk Acceptance: Chấp nhận nới lỏng rào scraping ở Phase 1 để đổi lấy 100% Availability cho tool tính lương nội bộ).
- **Export Policy**: Enforce giới hạn cứng **5000 dòng** (hard limit độc lập hoàn toàn khỏi Middleware Redis) để dựng lá chắn thứ 2 chống scraping.
- **Test Automation Strategy**: Rạch ròi cấu trúc Test: Unit test sẽ dùng Mock Verifier. Riêng Integration Test Harness bắt buộc dùng **Real Tokens** từ bộ tài khoản được Seed.

## 3. Files bị ảnh hưởng (Cập nhật sau Rebase)

| File | Hành động | Rủi ro | Contract |
|------|-----------|--------|----------|
| `backend/src/middleware/auth.ts` | Tạo mới | 🔴 Cao | Check JWT (Supabase JWKS) |
| `backend/src/middleware/permission.ts` | Tạo mới | 🔴 Cao | Logic ma trận quyền, xử lý Redis |
| `backend/src/middleware/rateLimit.ts` | Tạo mới | 🟡 T.Bình | Config `100 req` & `20 req` via Upstash |
| `backend/src/routes/users.ts` | Tạo mới | 🟡 T.Bình | Cung cấp `/api/users/me/permissions` cho FE |
| `backend/src/lib/redis.ts` | Cập nhật | 🟢 Thấp | TTL, Active Invalidation bọc `try-catch` |
| `backend/package.json` | Cập nhật | 🟢 Thấp | Thêm script `test:integration` |
| `packages/shared/src/types/permission.ts` | Cập nhật | 🟢 Thấp | Cập nhật Model thêm cờ `is_reviewer: boolean` để đồng bộ Contract. |
| `frontend/src/stores/authStore.ts` | Hardening | 🟡 T.Bình | Integrate API `/me/permissions`, nghe `onAuthStateChange` |
| `frontend/src/components/ProtectedRoute.tsx` | Hardening | 🟡 T.Bình | Route Guard dựa vào ma trận quyền |
| `frontend/src/components/MainLayout.tsx` | Cập nhật | 🟢 Thấp | Menu Pruning |
| `frontend/src/App.tsx` | Cập nhật | 🟢 Thấp | Cấu hình Route + Redirect 403 / employees |
| `frontend/src/pages/Login.tsx` | Cập nhật | 🟡 T.Bình | Giao diện đăng nhập phụ form ẩn (`NODE_ENV=dev`) |
| `frontend/src/pages/errors/403.tsx`| Tạo mới | 🟢 Thấp | Màn hình lỗi Access Denied độc lập |
| `frontend/src/utils/exportExcel.ts` | Tạo mới | 🟢 Thấp | Xử lý export với Lazy Load SheetJS (`await import()`) kèm Dummy Data |
| `scripts/seed_dev_users.ts` | Tạo mới | 🟢 Thấp | Script độc lập seed Data qua `SERVICE_ROLE_KEY` |

## 4. Phân tích rủi ro & Giải pháp Re-config

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| Hỏng kết nối Redis làm sập permission | 🔴 | Implement fallback query thẳng tới 3 bảng PostgreSQL. Invalidation lỗi -> Bật try-catch Critical Logging. |
| Rò rỉ Seed Script vào Production | 🔴 | Tách bạch `scripts/` ra khỏi cơ chế bundle của tsup. |
| API `/api/users/me/permissions` sai | 🟡 | E2E test harness check API này trả data matching DB seed ngay khi launch. |
| Ứng dụng FE tải chậm do SheetJS | 🟢 | Xử lý file này lazy-loaded (Deferred evaluation chunking Vite). |

## 5. Kế hoạch Rollback
Tắt các route sử dụng permission (fallback chế độ bảo trì), dọn dẹp các key Upstash `perm:*`. Rollback code backend về commit trước RLS vì schema độc lập không bị dính chùm. FE revert nhánh state auth.

## 6. Điểm neo kết nối (Integration Points)
- `backend/src/index.ts`: Import inject `auth`, `permission`, `rateLimit` middleware. Đăng ký route `/api/users`.
- `frontend/src/App.tsx`: Bọc các route nhạy cảm với component `ProtectedRoute` kết hợp với State Hydration.
- `package.json` (Root): Chứa `run seed`.
