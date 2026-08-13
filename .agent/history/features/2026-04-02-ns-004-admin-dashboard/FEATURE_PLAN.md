# Feature Plan: NS-004 Admin Dashboard — Giao diện Quản trị Hệ thống

> **Trạng thái**: ⚠️ CẦN SỬA → Đã patch theo review (2026-04-01)
> **Review gate**: Plan đã được review `feature-review`. Có thể handoff sang `feature-coordinator` sau khi xác nhận patch này đầy đủ.
> **Feature slug**: `ns-004-admin-dashboard`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-01

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Dự án đang ở Phase 4 (Admin & Migration) theo Master Plan. Route `/admin/permissions` hiện là `PlaceholderPage`. SA chưa có giao diện để quản trị quyền truy cập, reviewer, hay xem trạng thái hệ thống.
- **Vấn đề cần giải quyết:** SA không thể thực hiện các tác vụ quản trị qua UI: gán/thu hồi quyền per user per khối, thêm/xóa người nghiệm thu, xem cảnh báo Reviewer Mismatch, hay theo dõi Audit Log. Tất cả đang là placeholder.
- **Mục tiêu:** Xây dựng trang Admin Dashboard hoàn chỉnh cho SA, bao gồm 3 tab chức năng chính:
  1. **Quản lý phân quyền** — Gán/thu hồi EA/VI/VA per user per khối; thêm/xóa SA.
  2. **Quản lý người nghiệm thu** — Gán/xóa reviewer per NS; hiển thị cảnh báo Reviewer Mismatch.
  3. **Audit Log** — Xem lịch sử thao tác toàn hệ thống (filter theo user, action, khối, khoảng thời gian).
- **Kết quả mong đợi:** SA có thể thực hiện toàn bộ tác vụ quản trị qua UI. Page `/admin/permissions` không còn là placeholder. Permission Cache invalidation hoạt động chính xác sau mỗi thay đổi quyền.

---

## 2. Phạm vi

### In scope
- Trang `/admin/permissions` thay thế PlaceholderPage bằng Dashboard thực sự (chỉ SA được truy cập)
- **Tab 1 — Quản lý Phân quyền**:
  - Xem danh sách tất cả user có permission trong hệ thống (từ bảng `user_permissions` + `superadmins`)
  - Thêm/sửa/xóa permission per user per khối (EA/VI/VA)
  - Thêm/xóa SA (bảng `superadmins`)
  - Active Invalidation Redis cache ngay khi thay đổi quyền (theo KB [2026-03-25])
- **Tab 2 — Người nghiệm thu**:
  - Xem danh sách reviewer assignments (bảng `employee_reviewers`)
  - Gán reviewer mới cho một NS (search NS theo `ma_nhan_su` hoặc tên)
  - Xóa reviewer khỏi NS
  - **Quyền Reviewer (Bổ trợ - Additive)**: Một người soát xét được nâng cấp lên level `EA` ĐỐI VỚI nhân sự được gán. Quyền này cộng dồn với quyền trên Khối hiện có của họ. Ví dụ: User có `VI` trên Khối A vẫn thấy toàn bộ NS Khối A (không lương), nhưng nếu là reviewer của NS X (Khối A), họ sẽ thấy NS X với đầy đủ lương (`EA`).
  - Hiển thị cảnh báo "Reviewer Mismatch" theo BR-004-016: NS đã chuyển khối nhưng reviewer cũ vẫn còn gán. Mismatch được xác định nếu reviewer_email không có quyền `EA/VA/VI` trên khối hiện tại của NS. (Lưu ý: Bám sát Matrix v2.5.1, cho phép `VI` là reviewer hợp lệ).
- **Tab 3 — Audit Log**:
  - Xem Audit Log toàn hệ thống (SA xem toàn bộ theo PERMISSION_MATRIX §2e)
  - Filter theo: user email, action type, khối, khoảng thời gian
  - Pagination server-side
- Backend API routes mới tại `/api/admin/`:
  - `GET /api/admin/permissions` — Danh sách user permissions
  - `POST /api/admin/permissions` — Gán quyền mới
  - `PUT /api/admin/permissions/:id` — Sửa quyền
  - `DELETE /api/admin/permissions/:id` — Xóa quyền
  - `GET /api/admin/superadmins` — Danh sách SA
  - `POST /api/admin/superadmins` — Thêm SA
  - `DELETE /api/admin/superadmins/:email` — Xóa SA
  - `GET /api/admin/reviewers` — Danh sách reviewer assignments (kèm mismatch flag)
  - `POST /api/admin/reviewers` — Gán reviewer
  - `DELETE /api/admin/reviewers/:reviewer_record_id` — Xóa reviewer (dùng UUID của `employee_reviewers.id`, không đặt email trong path để tránh URL encoding issues)
  - `GET /api/admin/audit-logs` — Audit log với filter + pagination
  - Mọi list endpoint trả envelope `{ data: T[] }`. Riêng `GET /audit-logs` trả `{ data: T[], meta: { total, page, limit, totalPages } }`.
- Middleware bảo vệ: tất cả `/api/admin/*` phải kiểm tra `is_superadmin === true` bằng cách **query trực tiếp bảng `superadmins` từ DB** (không dùng permissionMatrix từ context — lý do: context có thể stale lên đến 2h do Redis TTL)
- Rate limiting: tất cả admin write endpoints (`POST/PUT/DELETE`) áp dụng `sensitiveRateLimiter` (pattern như employee routes)
- Ghi Audit Log cho mọi thao tác write (gán/xóa quyền, gán/xóa reviewer, thêm/xóa SA) — dùng action types: `permission_grant`, `permission_revoke`, `superadmin_add`, `superadmin_remove`, `reviewer_assign`, `reviewer_remove`
- **Yêu cầu SQL migration:** Bổ sung action types mới (`permission_grant`, `permission_revoke`, `superadmin_add`, `superadmin_remove`) vào CHECK constraint của `audit_log.action` và type union trong `auditService.ts`
- Route guard FE: `/admin/permissions` redirect 403 nếu không phải SA

### Out of scope
- Import dữ liệu hàng loạt (route `/admin/import` — Phase 4 riêng)
- Quản lý User Account (tài khoản Supabase Auth) — ngoài email-based permission
- Dashboard metrics/analytics (số NS per khối, biểu đồ,...) — Phase 5 polish
- Gán quyền tạm thời có expiry (Open Question NS-004 §8 — chưa có spec)
- Notification system khi thay đổi quyền — Phase 5/6
- Mobile-optimized layout

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - [2026-03-13] UI dùng **Ant Design v6 + theme tokens**. Tuyệt đối không dùng Tailwind.
  - [2026-03-13] Hybrid Security: Permission check phải ở **cả API middleware VÀ FE route guard**. FE route guard chỉ là UX, BE là bức tường thật.
  - [2026-03-19] Redis Key Strategy: **Key thực tế là `v4:perm:{email.trim().toLowerCase()}`** (có prefix `v4:` — verify tại `permission.ts:23`). TTL thực tế là **2 giờ** (không phải 5 phút). Invalidation phải dùng hàm đã export `invalidatePermissionCache(email)` từ `backend/src/middleware/permission.ts` — không tự implement lại.
  - [2026-03-25] Active Invalidation (xóa key ngay, không đợi TTL) khi SA thay đổi quyền.
  - [2026-03-16] Envelope-Based API Strategy: Response phải theo format `{ data: T }` hoặc `{ data: T, meta: {...} }`.
  - [2026-03-13] Audit Log bắt buộc cho mọi thao tác write (BR-PERM-006).
  - [2026-03-13] IDOR Protection: BE không tin vào params, phải resolve từ DB.
  - [2026-04-01] Debugging Visibility: Middleware error phải log đủ payload (đã redact).

- **"Cấm kỵ" cần tránh:**
  - **KHÔNG** cho FE gọi `supabase.from()` để đọc/ghi `user_permissions`, `superadmins`, `employee_reviewers`. Mọi thứ phải qua Hono API.
  - **KHÔNG** dùng Tailwind CSS.
  - **KHÔNG** skip permission check khi Redis down (phải fallback DB).
  - **KHÔNG** cho phép user tự gán quyền SA cho mình (SA-only operation).
  - **KHÔNG** xóa SA cuối cùng trong hệ thống (nguy cơ lock-out).

- **Ràng buộc kiến trúc liên quan:**
  - `UNIQUE(user_email, khoi)` trong `user_permissions` → FE/BE phải handle conflict khi cố gán trùng.
  - `UNIQUE(employee_id, reviewer_email)` trong `employee_reviewers` → tương tự.
  - Identifier Mapping (BR-004-025): UI tìm reviewer theo `ma_nhan_su`, BE phải query UUID trước khi ghi `employee_reviewers`.
  - Conflict resolution (PERMISSION_MATRIX §3): Nếu user vừa có VI/VA vừa là reviewer → EA cho NS đó. Logic này cần được giữ nguyên và đảm bảo không ghi đè quyền của họ trên các NS khác trong khối.
  - **Phân biệt VI vs VA**: Tuyệt đối không gộp chung thành "read-only". `VA` (View All) được xem lương; `VI` (View Info) bị chặn lương.
  - **Change History Masking**: `VI` được xem history nhân sự thuộc khối nhưng hệ thống PHẢI ẩn các bản ghi thay đổi trường lương (`salary fields`) và lý do thay đổi tương ứng (BR-PERM-005).

---

## 4. Giả định và câu hỏi mở

### Giả định
- SA sẽ tìm kiếm user theo email (không cần autocomplete từ Google Directory). Search = client-side filter trên danh sách đã tải.
- Danh sách khối (`khoi`) là static list được lấy từ constant/config (tương tự dữ liệu seed hiện tại). Không cần API riêng cho danh sách khối.
- Reviewer Mismatch detection: BE khi trả về `/api/admin/reviewers` sẽ kèm flag `is_mismatch: boolean` (reviewer.email thuộc khối X, nhưng NS đã chuyển sang khối Y). FE chỉ hiển thị cảnh báo.
- Page Audit Log chỉ cần xem (read-only) — không cần export ở vòng này.
- Xóa SA: Phải có kiểm tra không được xóa nếu chỉ còn 1 SA.

### Câu hỏi mở
- [Non-blocking] Danh sách khối (`khoi`) hiện đang được hardcode ở đâu? Cần xác nhận để dùng đúng source khi render dropdown gán quyền.
- [Non-blocking] Audit Log hiển thị bao nhiêu dòng mặc định mỗi page? (Giả định 50, giống NS-001)
- [Non-blocking] SA có muốn xem Reviewer Mismatch dưới dạng banner cảnh báo hay một section riêng trong Tab 2?

---

## 5. Acceptance Criteria

### Tab 1 — Quản lý Phân quyền
- [ ] SA thấy danh sách tất cả user permissions (user_email, khoi, level)
- [ ] SA có thể gán permission mới (email + khoi + level EA/VI/VA) → ghi Audit Log → xóa Redis cache của user đó ngay lập tức
- [ ] SA có thể sửa level của permission hiện có → ghi Audit Log → xóa Redis cache
- [ ] SA có thể xóa permission → ghi Audit Log → xóa Redis cache
- [ ] SA thấy danh sách SA hiện tại
- [ ] SA có thể thêm SA mới (theo email) → ghi Audit Log → xóa Redis cache của user đó
- [ ] SA có thể xóa SA khác (không được tự xóa mình, không được xóa SA duy nhất) → ghi Audit Log → xóa Redis cache
- [ ] Non-SA user truy cập `/admin/permissions` → bị redirect 403

### Tab 2 — Người nghiệm thu
- [ ] SA thấy danh sách tất cả reviewer assignments (employee MA, tên NS, reviewer_email, khối NS hiện tại)
- [ ] Rows có Reviewer Mismatch được highlight với cảnh báo rõ ràng trên UI
- [ ] SA có thể gán reviewer mới (search NS theo ma_nhan_su/tên, nhập reviewer email) → ghi Audit Log → xóa Redis cache của reviewer_email đó
- [ ] SA có thể xóa reviewer → ghi Audit Log → xóa Redis cache
- [ ] API tra cứu NS để gán reviewer dùng `ma_nhan_su` (string), BE resolve ra UUID trước khi ghi (BR-004-025)

### Tab 3 — Audit Log
- [ ] SA xem được toàn bộ audit log với pagination server-side
- [ ] Filter hoạt động đúng: theo user email, action, khối, khoảng ngày
- [ ] Mỗi row log hiển thị: timestamp, actor_email, action, target (NS MA hoặc email), khối, old_value, new_value (nếu có)

### Bảo mật
- [ ] Tất cả `/api/admin/*` endpoint trả về 403 nếu không phải SA
- [ ] Mọi thao tác write ghi Audit Log đầy đủ
- [ ] Redis cache được invalidate ngay sau mỗi thay đổi quyền/reviewer
- [ ] Không thể xóa SA cuối cùng (BE trả về lỗi rõ)

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `frontend/src/App.tsx` | Sửa | Thay PlaceholderPage bằng import AdminPermissionsPage | 🟢 | Không |
| `frontend/src/pages/Admin/AdminPermissionsPage.tsx` | **Tạo mới** | Page chính với 3 tabs (Permission, Reviewer, Audit Log) | 🟡 | Chưa |
| `frontend/src/pages/Admin/tabs/PermissionsTab.tsx` | **Tạo mới** | Tab quản lý user_permissions + superadmins | 🟡 | Chưa |
| `frontend/src/pages/Admin/tabs/ReviewersTab.tsx` | **Tạo mới** | Tab gán/xóa reviewer, hiển thị mismatch | 🟡 | Chưa |
| `frontend/src/pages/Admin/tabs/AuditLogTab.tsx` | **Tạo mới** | Tab xem audit log toàn hệ thống | 🟡 | Chưa |
| `frontend/src/services/adminService.ts` | **Tạo mới** | API client layer cho `/api/admin/*` | 🟡 | Chưa |
| `frontend/src/hooks/useAdmin.ts` | **Tạo mới** | TanStack Query hooks cho admin operations | 🟢 | Chưa |
| `frontend/src/components/ProtectedRoute.tsx` | Có thể sửa | Kiểm tra và redirect SA guard | 🟡 | Có |
| `backend/src/routes/admin.ts` | **Tạo mới** | Route group `/api/admin/*` | 🔴 | Chưa |
| `backend/src/services/adminService.ts` | **Tạo mới** | Business logic: gán/xóa quyền, reviewer, audit log query | 🔴 | Chưa |
| `backend/src/middleware/requireSuperAdmin.ts` | **Tạo mới** | Middleware check `is_superadmin` cứng cho admin routes | 🔴 | Chưa |
| `backend/src/index.ts` | Sửa | Mount route `/api/admin` | 🟡 | Có |
| `backend/src/middleware/permission.ts` | Import hàm | Dùng `invalidatePermissionCache(email)` đã export — xóa key `v4:perm:{email}` | 🔴 | Có |
| `database/migrations/` | **Tạo mới** | Migration SQL: bổ sung action types vào `audit_log.action` CHECK constraint | 🔴 | Không |
| `backend/src/services/auditService.ts` | Sửa | Bổ sung action types mới vào TypeScript union | 🟡 | Có |
| `packages/shared/src/types/` | Có thể tạo | Types: `UserPermission`, `SuperAdmin`, `ReviewerAssignment`, `AuditLogEntry` | 🟡 | Chưa |
| `packages/shared/src/schemas/` | Có thể tạo | Zod schemas cho admin API request/response | 🟡 | Chưa |

---

## 7. Risk Triage và Review Focus

- **Review required:** **YES — Khuyến nghị mạnh**

- **Risk hotspots:**
  - 🔴 **`requireSuperAdmin` middleware** — Bắt buộc query DB trực tiếp (`SELECT` từ `superadmins` table), không đọc từ context `permissionMatrix`. Lý do: permissionMatrix cache trên Redis TTL 2h — nếu SA bị revoke quyền, họ vẫn pass middleware trong 2h nếu chỉ tin vào context.
  - 🔴 **Redis Cache Invalidation** — Dùng hàm `invalidatePermissionCache(email)` từ `backend/src/middleware/permission.ts`. Key thực tế: `v4:perm:{email}`, TTL: 2h. Nếu dùng sai key, cache không bị xóa và user giữ quyền cũ tối đa 2h.
  - 🔴 **SA Self-Delete & Last SA Protection** — BE là primary guard (enforce). FE chỉ ẩn nút (UX convenience). Không được để FE là bức tường duy nhất.
  - 🟡 **Reviewer Mismatch Detection** — Logic so sánh `reviewer.khoi` với `nhan_su.khoi` hiện_tại cần query join, cần kiểm tra performance với nhiều NS.
  - 🟡 **Identifier Mapping (BR-004-025)** — FE gửi `ma_nhan_su` (string), BE phải resolve UUID. Nếu `ma_nhan_su` không unique hoặc lookup sai, reviewer sẽ bị gán nhầm NS.
  - 🟡 **Audit Log Volume** — Audit log toàn hệ thống có thể lớn. Cần index phù hợp trên `created_at`, `actor_email`, `action`.

- **Review focus areas:**
  - Có phải `requireSuperAdmin` middleware query DB trực tiếp để verify `is_superadmin`, hay tin vào JWT claim hoặc Redis cache?
  - Redis invalidation flow: sau `DELETE /api/admin/permissions/:id`, key nào bị xóa? Có invalidate đúng user bị ảnh hưởng không?
  - Flow xóa SA: có kiểm tra "không được xóa SA duy nhất" ở BE hay chỉ ở FE?
  - Audit Log filter query: có dùng parameterized query không? Có index trên các cột filter không?
  - Reviewer Mismatch: join logic như thế nào? Có thể bị N+1 query không?

- **Known pitfalls / historical issues:**
  - Cache key đã qua nhiều lần đổi prefix (v1→v4). Key hiện tại là `v4:perm:{email}` (xem `permission.ts:23`). Không tự hardcode `perm:` hay `v3:perm:` — dùng hàm `invalidatePermissionCache()` đã abstract key này.
  - Cache Busting: Nếu permission structure thay đổi (vd: thêm level mới), cần đổi tiền tố key lên `v5:` [2026-03-19].
  - `audit_log.action` có CHECK constraint cứng trong DB (schema line 390-395) — ghi sai action type sẽ throw `check_violation` ở runtime, không phải lúc compile. **Bắt buộc có migration trước khi implement audit log cho admin actions.**
  - RAM-First Permission Strategy [2026-03-31]: FE authStore giữ permission trên RAM và ưu tiên không reset. Sau khi SA thay đổi quyền của chính mình, FE vẫn hiển thị quyền cũ cho đến lần reload. Cần document behavior này rõ cho SA.

- **Dependencies / rollout concerns:**
  - Phase 4 (Admin & Migration) — feature này là prerequisite cho data import flow (SA cần có quyền trước khi import).
  - **Cần SQL migration** để thêm action types (`permission_grant`, `permission_revoke`, `superadmin_add`, `superadmin_remove`) vào `audit_log.action` CHECK constraint — migration này phải được chạy trước khi deploy BE.
  - Cần seed data test với đủ các loại user (SA, EA, VI, VA, reviewer) để verify UI render đúng.
  - Deploy order: Migration SQL → BE → FE.

---

## 8. Chiến lược triển khai

- **Phase strategy:** 4 phase độc lập, có thể test sau từng phase.

- **Thứ tự triển khai:**
  1. **Phase 1 — Backend Foundation**: Tạo middleware `requireSuperAdmin`, routes `/api/admin/*`, service layer, Redis invalidation
  2. **Phase 2 — Tab Phân quyền (FE + Integration)**: Page AdminPermissionsPage + Tab 1 (user_permissions + superadmins CRUD)
  3. **Phase 3 — Tab Người nghiệm thu (FE + Integration)**: Tab 2 (reviewer CRUD + mismatch detection)
  4. **Phase 4 — Tab Audit Log + Polish**: Tab 3 (audit log read-only + filter) + route guard + UX polish

- **Điểm cần phối hợp:**
  - BE phải hoàn thành Phase 1 trước khi FE integrate (Phase 2+)
  - Shared types/schemas cho admin API cần được build (`pnpm run build:shared`) trước khi FE/BE dùng

- **Yêu cầu migration / config / deploy:**
  - **SQL migration bắt buộc** (Phase 1, trước khi deploy): Thêm `permission_grant`, `permission_revoke`, `superadmin_add`, `superadmin_remove` vào `audit_log.action` CHECK constraint. Đồng thời cập nhật type union trong `auditService.ts`.
  - Không cần migration cấu trúc bảng — các bảng đã có đủ.
  - Import `invalidatePermissionCache` từ `backend/src/middleware/permission.ts` — không import `redis` trực tiếp để tự xây invalidation.
  - Deploy order: Migration SQL → BE → FE.

---

## 9. Test Strategy

- **Automated tests:**
  - Unit test `requireSuperAdmin` middleware: verify non-SA bị 403, SA được pass (mock DB `superadmins` table trực tiếp — không mock context)
  - Unit test Redis invalidation: mock `invalidatePermissionCache`, verify được gọi với đúng email sau mỗi write
  - Unit test "Last SA protection": verify `removeSuperAdmin` throw/return lỗi khi chỉ còn 1 SA
  - Unit test `listReviewers()` với fixture mismatch: reviewer_email không có EA/VA trên khối hiện tại của NS → `is_mismatch: true`
  - Integration test **(bắt buộc)**: SA token → `GET /api/admin/permissions` → 200 với data
  - Integration test **(bắt buộc)**: EA token (non-SA) → `GET /api/admin/permissions` → 403

- **Manual verification:**
  - SA đăng nhập → thấy menu "Phân quyền hệ thống"
  - Non-SA đăng nhập → không thấy menu, gõ thẳng URL → 403
  - Gán quyền EA cho user X trên khối Y → user X reload trang → thấy quyền mới (cache đã clear)
  - Gán reviewer cho NS A → reviewer đó reload → thấy NS A trong danh sách có thể edit
  - Reviewer Mismatch: NS A chuyển khối → reviewer cũ vẫn assign → cảnh báo mismatch hiển thị trong Tab 2

- **Data / env chuẩn bị trước khi test:**
  - Seed accounts: 1 SA, 1 EA (khối Admicro), 1 VI, 1 VA, 1 reviewer account
  - Ít nhất 3 NS: 1 NS thuộc Admicro, 1 NS vừa chuyển khối có reviewer mismatch
  - Redis đang chạy (dev env with Upstash Redis hoặc local Redis)

---

## 10. Rollback Plan

- Feature này chỉ thêm mới (routes mới, page mới, middleware mới) — không sửa đổi route hiện tại.
- Rollback FE: Revert `App.tsx` để trả `PlaceholderPage` cho `/admin/permissions`. Các Tab components là file mới, có thể xóa.
- Rollback BE: Xóa mount `app.route('/api/admin', adminRoutes)` trong `index.ts`. Các file route/service mới là file mới, có thể xóa.
- Rollback migration: Nếu đã chạy migration bổ sung action types, rollback bằng cách remove các values khỏi CHECK constraint (hoặc drop & recreate constraint). Không ảnh hưởng data hiện có vì không có rows dùng các action types mới.
- Redis keys không bị ảnh hưởng vì chỉ là invalidation (xóa key) — không phải thay đổi structure.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
- Permission logic: `.agent/business/data/PERMISSION_MATRIX.md`
- NS-004 spec: `.agent/business/modules/NS-004_permissions.md`
- Schema tables: `database/001_schema.sql` → bảng `user_permissions`, `superadmins`, `employee_reviewers`, `audit_log`
- Redis invalidation: hàm `invalidatePermissionCache(email)` tại `backend/src/middleware/permission.ts:20-29` — key format `v4:perm:{email}`, TTL 2h
- Audit log action types: `auditService.ts:5` — phải có migration trước khi dùng action types admin mới
- Auth flow: `backend/src/middleware/` (pattern hiện có)

## Review Notes

> Review lần 1 — 2026-04-01
> Verdict: ⚠️ CẦN SỬA → Đã patch
> Các blocker đã xử lý:
> - **FR-01**: Redis key prefix sửa thành `v4:perm:`, TTL sửa thành 2h, chỉ rõ dùng `invalidatePermissionCache()`
> - **FR-02**: Thêm SQL migration requirement cho `audit_log.action` CHECK constraint
> - **FR-03**: `requireSuperAdmin` bắt buộc query DB trực tiếp, không dùng context
> - **FR-04**: Thêm `sensitiveRateLimiter` cho admin write endpoints
> Các khuyến nghị đã xử lý:
> - **FR-06**: Làm rõ BE là primary guard cho self-delete SA
> - **FR-07**: Tasks merged/clarified trong FEATURE_TASKS.md
> - **FR-08**: Thêm unit test mismatch, bỏ "(optional)" integration test
> - **FR-10**: Định nghĩa rõ Reviewer Mismatch business rule
> - **FR-11**: Đổi DELETE reviewer sang dùng `reviewer_record_id` (UUID)
> - **FR-12**: Thêm note response format cho list endpoints
