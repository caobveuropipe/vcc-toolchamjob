# Feature Tasks: Phase 4 — Admin & Migration

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-07

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase A: Admin UI Audit & Polish

**Mục tiêu:** Admin Dashboard production-ready — quản lý quyền, reviewers, mismatch hiển thị đúng, UX mượt mà.

- [x] Task A.1: Rà soát tab **QUYỀN USER** (PermissionManagement) — test CRUD permission (thêm/sửa/xóa), confirm cache Redis invalidate, verify audit log ghi đúng.
- [x] Task A.2: Rà soát tab **SUPER ADMIN** (SuperAdminManagement) — test thêm/xóa SA, check self-delete protection.
- [x] Task A.3: Rà soát tab **NGƯỜI SOÁT XÉT** (ReviewerManagement) — test gán/xóa reviewer, verify `is_mismatch` flag hiển thị tag "Mismatch" đúng. Thêm filter "Chỉ hiện Mismatch" nếu chưa có.
- [x] Task A.4: Rà soát tab **THAO TÁC HÀNG LOẠT** (BulkReviewerOps) — test bulk transfer/copy/remove reviewer ops. Verify preview + execute đúng.
- [x] Task A.5: Rà soát tab **NHẬT KÝ HỆ THỐNG** (AuditLogViewer) — test filter theo actor, action, module, date range. Verify pagination.
- [x] Task A.6: Rà soát tab **PHỤ TRÁCH KHỐI** (KhoiManagersTab) — test CRUD khối managers.
- [x] Task A.7: Polish UX toàn bộ Admin Dashboard — loading states, empty states, error messages, responsiveness. Fix bug nếu phát hiện.
- [x] Task A.Final: 🧪 Test & Verify Phase A — SA thao tác toàn bộ tabs Admin Dashboard: quyền, reviewer, bulk ops, audit log, mismatch OK.

## Phase B: Data Migration Engine

**Mục tiêu:** Script/tool import 4000+ NS từ Excel vào DB, có dry-run, validation, audit log.

- [ ] Task B.1: **DB Migration** — Tạo `database/migrations/016_import_audit_action_and_rpc.sql`.
  - Thêm `'import'` vào CHECK constraint `audit_log.action` bằng syntax: `ALTER TABLE audit_log DROP CONSTRAINT audit_log_action_check; ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check CHECK (...)`.
  - Giữ nguyên các enum đã có như `create`, `delete`, `snapshot_lock` v.v.
  - Tạo một PostgreSQL Function (RPC) `SECURITY DEFINER` (vd: `import_employee_batch(jsonb)`) để insert atomic đa bảng. Hàm phải được config cứng `SET search_path = public` để tránh khai thác RLS bypass từ bên ngoài.
- [ ] Task B.2: **Sync App-Layer Audit Constraints** — Thêm `import` vào: 
  - Backend: type/union của `auditService.ts` 
  - Frontend: Filter dropdown ở `AuditLogViewer.tsx` và shared schemas nếu dùng.
- [ ] Task B.3: **Import Template** — Tạo file Excel template mẫu (`scripts/templates/import-template.xlsx`) với đúng column headers cho employees (26 fields) + salaries (25 fields). Kèm sheet hướng dẫn.
- [ ] Task B.4: **Import Script Core** — Tạo `scripts/import-data.ts`:
  - Parse file .xlsx (dùng `xlsx` / SheetJS)
  - Map column headers → field names (hỗ trợ Vietnamese header + field ID)
  - Validate mỗi row QUYẾT LIỆT thông qua schema Zod TÁCH RIÊNG (`importEmployeeSchema` + `importSalarySchema`) thay vì nguyên bản của API để chối bỏ default sai (`trang_thai='dang_lam'` và `state_phong_cho=false` luôn luôn cho script, xóa conflict trường `tam_ung_hang_thang` về đúng bên table Salaries).
  - Output: Validation report (rows OK / rows lỗi / chi tiết lỗi per row)
  - Dry-run mode (default) — chỉ validate, không ghi DB
- [ ] Task B.5: **Import Script Execute** — Thêm execute mode vào script:
  - Batch pass payload: Chunk 50-100 rows per payload jsonb.
  - Gọi RPC từ Node.js (dùng `supabase.rpc('import_employee_batch')`) với service_role thay vì insert từng bảng riêng lẻ.
  - Handle duplicate `ma_nhan_su` được SKIP mặc định để tránh chèn đè.
  - Đảm bảo `state_phong_cho = false` và `trang_thai = 'dang_lam'`.
  - Cố tình BỎ QUA việc ghi vào bảng `change_history` để tối ưu DB, chỉ ghi `audit_log` với hành động `import` bên trong Function.
  - Progress bar / log output.
- [ ] Task B.6: **Service Role Auth** — Script dùng Supabase `service_role` key (đọc từ `.env.local`). Verify RLS bypass OK cho lời gọi RPC.
- [ ] Task B.Final: 🧪 Test & Verify Phase B — Import 100+ NS mẫu qua script (dry-run OK → execute OK → verify DB data: employees + salaries join đúng, audit log ghi đúng).

## Phase C: End-to-End Verify

**Mục tiêu:** Xác nhận toàn bộ Phase 4 hoạt động đúng theo acceptance criteria.

- [ ] Task C.1: Test SA quản lý quyền → thêm user mới với EA trên khối A → user đó truy cập API OK → xóa quyền → user bị chặn. Verify Redis cache invalidated.
- [ ] Task C.2: Test SA gán reviewer → reviewer có EA trên NS cụ thể → verify mismatch khi reviewer không có quyền khối. Dashboard hiển thị warning.
- [ ] Task C.3: Test import 100 NS mẫu → verify:
  - Employees list hiển thị đúng (pagination, search, filter)
  - Salary data join đúng
  - `state_phong_cho = false` cho tất cả imported NS
  - Audit log có action `import`
- [ ] Task C.4: Test bulk reviewer ops → transfer reviewer từ user A sang user B → verify all NS-reviewer mappings đúng.
- [ ] Task C.Final: 🧪 Test & Verify Phase C — Full regression: Admin Dashboard + Import + Permissions + Reviewers + Mismatch + Audit Log. Xác nhận Phase 4 hoàn thành.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------| 
| 2026-04-07 17:03 | — | — | Review phê duyệt, sử dụng RPC cho import | ✅ | User noted: DB is test data |
| 2026-04-07 17:28 | — | — | Phản biện Vòng 2, loại bỏ Web Import và Harden schema | ✅ | Chốt scope chặn lỗi Data Integration |
| 2026-04-07 17:44 | Phase A | Task A.1 | Chuyển task sang in progress, chuẩn bị rà soát UI QUYỀN USER | start | |
| 2026-04-07 17:48 | Phase A | Task A.1 | Hoàn thành test backend API (CRUD, Invalidation, Audit Log) | done |  |
| 2026-04-07 17:48 | Phase A | Task A.2 | Start Task A.2, chuẩn bị test SuperAdmin protection | start |  |
| 2026-04-07 17:49 | Phase A | Task A.2 | Hoàn thành test SA CRUD và self-delete protection | done |  |
| 2026-04-07 17:49 | Phase A | Task A.3 | Start Task A.3, chuẩn bị test ReviewerManagement và rà soát filter Mismatch | start |  |
| 2026-04-07 17:50 | Phase A | Task A.3 | Thêm checkbox "Chỉ hiện Mismatch" vào UI và verify API test pass | done |  |
| 2026-04-07 17:50 | Phase A | Task A.4 | Start Task A.4, chuẩn bị test BulkReviewerOps | start |  |
| 2026-04-07 17:51 | Phase A | Task A.4 | Hoàn thành test API cho BulkReviewerOps (Preview & Execute) | done |  |
| 2026-04-07 17:51 | Phase A | Task A.5 | Start Task A.5, rà soát AuditLogViewer tabs và pagination | start |  |
| 2026-04-07 17:52 | Phase A | Task A.5 | Hoàn thành test AuditLog Viewer pagination và filtering | done |  |
| 2026-04-07 17:52 | Phase A | Task A.6 | Start Task A.6, chuẩn bị test CRUD KhoiManagers | start |  |
| 2026-04-07 17:53 | Phase A | Task A.6 | Hoàn thành test KhoiManager CRUD | done |  |
| 2026-04-07 17:53 | Phase A | Task A.7 | Rà soát UX, đã áp dụng isLoading và antd components chuẩn | done |  |
| 2026-04-07 17:53 | Phase A | Task A.Final | AI self-test xong Phase A. Chờ User confirm. | done |  |
| 2026-04-07 18:03 | Phase A | Task A.Final | User confirm pass hệ thống toàn bộ Phase A | done |  |
| 2026-04-07 18:03 | Phase B | — | Tạm dừng trước khi sang Phase B theo yêu cầu của User | pause | Để lần sau resume nhanh |
