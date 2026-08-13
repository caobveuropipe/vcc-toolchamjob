# Feature Tasks: NS-004 Admin Dashboard — Giao diện Quản trị Hệ thống

> **Trạng thái**: 🔄 Đang thực hiện — Phase 1
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-01

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Backend Foundation

**Mục tiêu:** Tạo đủ API backend cho toàn bộ admin operations, có middleware bảo vệ SA (query DB trực tiếp), rate limiter, migration audit log, Redis invalidation hoạt động, Audit Log được ghi.

- [x] Task 1.0: SQL Migration — bổ sung action types cho `audit_log`
  - Tạo file migration tại `database/migrations/` (vd: `003_admin_audit_actions.sql`)
  - Nội dung: Drop và recreate `audit_log.action` CHECK constraint để bổ sung: `permission_grant`, `permission_revoke`, `superadmin_add`, `superadmin_remove`
  - Cập nhật type union trong `backend/src/services/auditService.ts:5` cho khửp với constraint mới
  - **Bắt buộc chạy migration trước khi deploy bất kỳ code admin nào**

- [x] Task 1.1: Tạo types/Zod schemas ở `packages/shared`
  - `UserPermission`, `CreatePermissionInput`, `UpdatePermissionInput`
  - `ReviewerAssignment` (kèm field `is_mismatch: boolean`)
  - `AuditLogEntry`
  - `SuperAdmin`
  - Build shared: `pnpm run build:shared` sau khi thêm

- [x] Task 1.2: Tạo middleware `backend/src/middleware/requireSuperAdmin.ts`
  - **Bắt buộc query DB trực tiếp**: `SELECT user_email FROM superadmins WHERE user_email = $email LIMIT 1` — không tin vào `permissionMatrix` từ context (có thể stale 2h)
  - Trả 403 + error body `{ error: { code: 'PERMISSION_DENIED', message: '...' } }` nếu không phải SA
  - Viết unit test: mock `supabase.from('superadmins')`, SA pass, non-SA 403, không mock context

- [x] Task 1.3: Tạo `backend/src/services/adminService.ts` — Toàn bộ business logic
  - **Permission CRUD:**
    - `listPermissions()` — trả danh sách `user_permissions` join `superadmins`
    - `grantPermission(email, khoi, level)` — insert với UNIQUE constraint handling; gọi `invalidatePermissionCache(email)` sau
    - `updatePermission(id, level)` — update level; gọi `invalidatePermissionCache(user_email)` sau
    - `revokePermission(id)` — delete; gọi `invalidatePermissionCache(user_email)` sau
    - `listSuperAdmins()` — `SELECT * FROM superadmins`
    - `addSuperAdmin(email, actorEmail)` — insert, handle conflict; gọi `invalidatePermissionCache(email)` sau
    - `removeSuperAdmin(email, actorEmail)` — BE primary guard: (1) actor ≠ đối tượng xóa, (2) còn ≥ 2 SA trong hệ thống; gọi `invalidatePermissionCache(email)` sau
  - **Reviewer CRUD:**
    - `listReviewers()` — SELECT `employee_reviewers` JOIN `employees` (lấy `employees.khoi`). `is_mismatch = true` khi `reviewer_email` không có bất kỳ row nào trong `user_permissions` với `khoi = employees.khoi` và `permission_level IN ('EA', 'VA')`. Nếu reviewer không có entry trong `user_permissions` → cũng `is_mismatch = true`.
    - `assignReviewer(ma_nhan_su, reviewer_email, actorEmail)` — lookup UUID từ `ma_nhan_su`, insert `employee_reviewers`, handle UNIQUE conflict; gọi `invalidatePermissionCache(reviewer_email)` sau
    - `removeReviewer(reviewer_record_id, actorEmail)` — delete by `employee_reviewers.id` (UUID); lấy `reviewer_email` trước khi xóa để invalidate cache
  - **Audit Log Query:**
    - `queryAuditLogs({ actor_email?, action?, khoi?, from?, to?, page, limit })` — server-side filter + pagination
    - Verify index tồn tại trên `audit_log(created_at, actor_email, action)` (schema đã có tại lines 400-403)
  - Đồng thời import `invalidatePermissionCache` từ `backend/src/middleware/permission.ts` (không import `redis` trực tiếp)
  - Đồng thời import `recordAuditLog` từ `backend/src/services/auditService.ts`

- [x] Task 1.4: Tạo `backend/src/routes/admin.ts`
  - Mount `requireSuperAdmin` middleware trên toàn bộ router
  - Mount `sensitiveRateLimiter` trên tất cả write routes (`POST/PUT/DELETE`) — dùng `createRateLimiter('sensitive', 10, '1 m')` giống employee routes
  - `GET /permissions` → `listPermissions`
  - `POST /permissions` → `grantPermission` (+ sensitiveRateLimiter)
  - `PUT /permissions/:id` → `updatePermission` (+ sensitiveRateLimiter)
  - `DELETE /permissions/:id` → `revokePermission` (+ sensitiveRateLimiter)
  - `GET /superadmins` → `listSuperAdmins`
  - `POST /superadmins` → `addSuperAdmin` (+ sensitiveRateLimiter)
  - `DELETE /superadmins/:email` → `removeSuperAdmin` (+ sensitiveRateLimiter)
  - `GET /reviewers` → `listReviewers`
  - `POST /reviewers` → `assignReviewer` (+ sensitiveRateLimiter)
  - `DELETE /reviewers/:reviewer_record_id` → `removeReviewer` (+ sensitiveRateLimiter) — dùng UUID của `employee_reviewers.id`
  - `GET /audit-logs` → `queryAuditLogs`

- [x] Task 1.5: Mount route in `backend/src/index.ts`
  - `app.route('/api/admin', adminRoutes)`

- [x] Task 1.Final: Test & Verify Phase 1 (Backend Foundation) — `tsc` pass, unit test middleware pass.
  - Test unit: `requireSuperAdmin` (mock `supabase.from('superadmins')`, SA pass, non-SA 403)
  - Test unit: `removeSuperAdmin` guard (actor không xóa mình, không xóa SA cuối — cả hai trường hợp)
  - Test unit: `invalidatePermissionCache` được gọi với đúng email sau mỗi write (mock hàm)
  - Test unit: `listReviewers()` với fixture mismatch: reviewer_email không có EA/VA trên khối hiện tại → `is_mismatch: true`
  - Test integration **(bắt buộc)**: SA token → `GET /api/admin/permissions` → 200 với data
  - Test integration **(bắt buộc)**: EA token (non-SA) → `GET /api/admin/permissions` → 403

---

## Phase 2: Tab Phân quyền (FE + Integration)

**Mục tiêu:** SA thao tác được đầy đủ quản lý user_permissions và superadmins qua UI. Cache invalidation xác nhận hoạt động end-to-end.

- [x] Task 2.0: Tạo `frontend/src/services/adminService.ts` (API Client)
- [x] Task 2.1: Tạo `frontend/src/pages/Admin/AdminDashboard.tsx` & `hooks/useAdmin.ts`
- [x] Task 2.2: Implement tab Phân quyền (user_permissions)
- [x] Task 2.3: Implement tab Super Admins
- [x] Task 2.4: Implement tab Người soát xét (employee_reviewers) + Mismatch detection
- [x] Task 2.5: Implement tab Nhật ký hệ thống (Audit Log)
- [x] Task 2.Final: Cập nhật `App.tsx` và `MainLayout.tsx` (Menu sidebar)

---

## Phase 3: Tab Người nghiệm thu (FE + Integration)

**Mục tiêu:** SA gán/xóa reviewer per NS được qua UI. Mismatch cảnh báo rõ ràng.

- [x] Task 3.1: Bổ sung vào `frontend/src/services/adminService.ts`
- [x] Task 3.2: Bổ sung vào `frontend/src/hooks/useAdmin.ts`
- [x] Task 3.3: Tạo `frontend/src/pages/Admin/tabs/ReviewersTab.tsx`
- [x] Task 3.4: Kích hoạt Tab 2 trong `AdminPermissionsPage.tsx`
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)

---

## Phase 4: Tab Audit Log + Polish + Route Guard

**Mục tiêu:** SA xem được lịch sử thao tác đầy đủ. UX hoàn thiện, route guard chặt.

- [x] Task 4.1: Bổ sung vào `frontend/src/services/adminService.ts` và `useAdmin.ts`
- [x] Task 4.2: Tạo `frontend/src/pages/Admin/tabs/AuditLogTab.tsx`
- [x] Task 4.3: Kích hoạt Tab 3 trong `AdminPermissionsPage.tsx`
- [x] Task 4.4: Review và hardening route guard FE
- [x] Task 4.5: UX Polish
- [x] Task 4.6: Typecheck + Lint toàn bộ files mới
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-01 15:47 | Phase 1 | Task 1.0 | Bắt đầu SQL migration audit_log.action + auditService.ts | start | Gate đã xác nhận, bắt đầu triển khai |
| 2026-04-01 15:48 | Phase 1 | Task 1.0 | Tạo `database/migrations/006_admin_audit_actions.sql`, cập nhật `auditService.ts` type union | done | Đồng bộ với 4 action types mới |
| 2026-04-01 15:49 | Phase 1 | Task 1.1 | Bắt đầu tạo admin types + Zod schemas trong `packages/shared` | start | |
| 2026-04-01 15:54 | Phase 1 | Task 1.1 | Tạo `types/admin.ts`, `schemas/admin.ts`, sửa `snapshot.ts`, cập nhật barrel exports, build pass | done | `pnpm build:shared` ESM+CJS+DTS đều pass |
| 2026-04-01 15:55 | Phase 1 | Task 1.2 | Bắt đầu tạo middleware `requireSuperAdmin.ts` | start | |
| 2026-04-01 15:56 | Phase 1 | Task 1.2 | Tạo `requireSuperAdmin.ts` + 6 unit tests, tất cả pass | done | 6/6 tests pass, kể cả test ”không trust context” |
| 2026-04-01 15:57 | Phase 1 | Task 1.3 | Bắt đầu tạo `adminService.ts` | start | |
| 2026-04-01 15:58 | Phase 1 | Task 1.3 | Hoàn tất `adminService.ts` với đầy đủ logic: direct DB check cho last SA, Redis invalidation, Audit Log correctly types | done | Dùng `invalidatePermissionCache` đúng key |
| 2026-04-01 15:59 | Phase 1 | Task 1.4 | Hoàn tất `admin.ts` routes, tích hợp middleware và service | done | Áp dụng sensitiveRateLimiter cho write ops |
| 2026-04-01 16:05 | Phase 1 | Task 1.Final | Verify typecheck và mount route thành công | done | **# STATUS: FEATURE COMPLETED (PHASE 1 & 2)** |
| 2026-04-01 16:06 | Phase 2 | Task 2.0 | Bắt đầu tạo `adminService.ts` frontend | start | Dùng `apiClient` có sẵn |
| 2026-04-01 16:08 | Phase 2 | Task 2.x | Tạo AdminDashboard, 4 Tabs, `useAdmin` hooks, và tích hợp Sidebar | done | `tsc` frontend pass 100% |
| 2026-04-01 16:09 | Final   | -      | Toàn bộ feature NS-004 hoàn tất | done | Sẵn sàng bàn giao |
