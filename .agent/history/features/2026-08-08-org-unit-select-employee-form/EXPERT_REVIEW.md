---
source: expert-rebuttal
feature: org-unit-select-employee-form
round: 20
timestamp: 2026-08-07T18:29:00+07:00
verdict: ✅ HỘI TỤ
---

# Expert Review: org-unit-select-employee-form

## Findings

### Các findings đã được chấp nhận và cập nhật vào Plan/Tasks (Round 1 ➔ Round 20):
- **EFR-01**: Thuật toán Sparse Tree Traversal dựa trên anchor node gần nhất ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-02**: Bổ sung prop `initialParentId` cho `QuickAddOrgUnitModal.tsx` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-03**: Bổ sung Unicode normalizer cho tiếng Việt không dấu ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-04**: Mở rộng Test Strategy thành test matrix đủ 3 mode ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-05**: Đồng bộ toàn bộ nội dung EFR accepted vào `FEATURE_PLAN.md` ➔ Đã sửa `FEATURE_PLAN.md`.
- **EFR-06**: Mở rộng Quick Add matrix xử lý HTTP 503 SERVICE_UNAVAILABLE ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-07**: Chuẩn hóa scope Quick Add thành 4 child levels + Line Global ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-08**: Định nghĩa ma trận phân quyền per-button ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-09**: Bổ sung cơ chế Fallback Text-to-ID Resolution ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-10**: Thắt chặt Fallback Text-to-ID Resolution theo thứ tự tuần tự top-down ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-11**: Chuẩn hóa toàn bộ wording số lượng Khối thành `KHOI_VALUES` (10 Khối chuẩn) ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-12**: Đăng ký cả 12 keys bằng `<Form.Item name="..." noStyle>` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-13**: Triển khai Atomic Modal Lifecycle Contract ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-14**: Nạp danh mục active kết hợp các node inactive đang được tham chiếu ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-15**: Đưa vào Pair-Consistency Validation Gate trước submit ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-16**: Chuẩn hóa Anchor Traversal: khi chọn Khối resolve root `khoi_id` và lọc direct children ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-17**: Cập nhật DB function `public.fn_trg_employees_org_unit_sync()` grandfather 6 FKs inactive không đổi khi Update ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-18**: Chỉ định `EmployeeForm.handleSubmit` làm owner thực thi Pair-Consistency Gate ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-19**: Cập nhật RPC `submit_employee_pending` whitelist đủ 6 UUID FKs ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-20**: Khóa Select `type` trong `QuickAddOrgUnitModal.tsx` ở chế độ disabled/read-only ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-21**: Cập nhật đúng trigger function thực tế `public.fn_trg_employees_org_unit_sync()` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-23**: Mở rộng grandfathering & validation logic ở DB function cho đầy đủ cả 6 UUID FK fields ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-24**: Bổ sung Authoritative Ancestry & Alignment Validation Gate ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-25**: Enforce Scope-based Authorization trên edit mode ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-26**: Bổ sung Authoritative Ancestry Validator ở Backend API (`employees.ts` & `employeeService.ts`) và DB Trigger cho 5 endpoints ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-27**: Phân tách Line Nhan Su khỏi chuỗi 5 FKs tổ chức; validate `line_nhan_su_id` theo rule global riêng ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-28**: Sửa đúng path endpoint pending thành `PUT /api/employees/:id/personnel-pending` và phân định rõ authorization ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-29**: Xử lý Catalog GET Failure trong `OrgUnitCascadingSelect.tsx` với Alert thông báo và nút Retry ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-30**: Bắt buộc dùng Supabase Local Docker CLI Harness restore từ `database_backups/dump-postgres-202608071702.backup` trước khi chạy test suite ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-31**: Bổ sung backend ancestry validator & scope check cho cả `POST /api/employees` và `POST /api/employees/onboard` create endpoints ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-32**: Chuẩn hóa path method pending endpoint trong plan & tasks thành `PUT /api/employees/:id/personnel-pending` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.
- **EFR-33**: Phân định rõ Target Scope Authorization Policy: Khởi tạo pending transfer chỉ cần source scope/reviewer; Duyệt/apply pending transfer hoặc sửa trực tiếp tổ chức (direct PUT) cần SA hoặc EA target scope ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2, Task 3.2).
- **EFR-34**: Bổ sung validation 5-FK ancestry & global Line trực tiếp vào DB function `public.fn_trg_employees_org_unit_sync()` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1).
- **EFR-35**: Bổ sung Text-Label Matching Validation trong backend validator verify text labels khớp 100% với `org_units.name` của UUID ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-36**: Bắt buộc quy trình restore DB backup cloud và lệnh `pnpm --filter backend test:integration` trên Supabase Local Docker CLI ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy, Task 3.Final).
- **EFR-37**: Khôi phục Migration forward `052_update_org_unit_triggers_and_pending_rpc.sql` ở cả `database/migrations` và `supabase/migrations` (đồng bộ qua `backend/scripts/sync-migrations.cjs`) để bảo đảm Upgrade Path cho Deployed DBs đã applied 048/049 ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Phase 1, Task 1.1).
- **EFR-38**: Cấu hình chính xác script restore backup cloud `powershell -ExecutionPolicy Bypass -File ./scripts/restore-local-db.ps1 database_backups/dump-postgres-202608071702.backup` trước khi chạy `pnpm --filter backend test:integration` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy, Task 3.4 & Task 3.Final).
- **EFR-39**: Áp dụng Target Scope Authorization Policy cho endpoint duyệt/apply pending thực tế `PUT /api/employees/:id/submit` và `submitFromPending()` trong `employeeService.ts` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-40**: Định nghĩa thuật toán Sparse Tree Ancestry Alignment: mỗi FK non-null chọn lựa phải có `parent_id` bằng ID của node non-null gần nhất trước đó (nearest non-null ancestor), áp dụng đồng nhất ở FE, BE và DB trigger ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2, Task 3.2).
- **EFR-41**: Xây dựng hợp đồng Effective State Merge (`effectiveState = live employee + existing pending_changes + current patch`) trước khi validate pair-consistency, text-matching và target scope cho `PUT /api/employees/:id/personnel-pending` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-42**: Bắt buộc dùng Supabase Local Docker CLI Harness và restore backup dump cloud `database_backups/dump-postgres-202608071702.backup` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy & Task 3.4).
- **EFR-43**: Quy định nạp bổ sung `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test` khi restore cloud dump ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy & Task 3.4).
- **EFR-44**: Xây dựng `submitEffectiveState = live employee + pending_changes` cho `PUT /api/employees/:id/submit` trước khi validate ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2).
- **EFR-45**: Bổ sung validation mapping cố định org-unit type cho từng FK (`khoi_id=khoi`, `bu_id=bu`, `phong_ban_id=phong_ban`, `bo_phan_id=bo_phan`, `nhom_team_id=nhom_team`, `line_nhan_su_id=line_nhan_su`) ở cả FE, BE và DB trigger ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1 & Task 3.2).
- **EFR-46**: Enforce Pair-Consistency hai chiều (`text == null <=> UUID == null`) và canonical name equality cho cả 6 cặp trường tổ chức ở cả FE và BE ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.2 & Task 3.3).
- **EFR-47**: `OrgUnitCascadingSelect.tsx` cung cấp catalog metadata/validation callback `validateOrgUnitValues(values)` cho `EmployeeForm.tsx` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 2.1 & Task 3.3).
- **EFR-48**: Target Scope EA Authorization tại `PUT /submit` chỉ kích hoạt khi `submitEffectiveState` có diff trên 12 org fields ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-49**: Rollback Plan cho deployed DBs dùng compensating forward migration `053_rollback_org_unit_triggers_and_pending_rpc.sql` ➔ Đã sửa `FEATURE_PLAN.md` (Section 10).
- **EFR-50**: Bổ sung Staged Migration Test verification apply 052 trên DB up to 051 ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy & Task 3.Final).
- **EFR-51**: Migration 052 bảo toàn nguyên vẹn function signatures, default arguments, return types, `SECURITY DEFINER`, `SET search_path = public`, owner postgres và grants ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1).
- **EFR-52**: Sửa chính xác signature tham số `submit_employee_pending` thành `(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1).
- **EFR-53**: Chỉ định cụ thể script test staged migration `pnpm --filter backend test:integration:upgrade-052` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.4 & Task 3.Final).
- **EFR-54**: Tách biệt `updateEffectiveState = live + parsed update` cho direct PUT vs `submitEffectiveState = live + pending` cho submit ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-55**: Cho phép grandfathering org fields hiện hữu khi update/pending/submit không có org diff ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-56**: DB trigger `fn_trg_employees_org_unit_sync` chỉ chạy fixed-type mapping và ancestry validations khi `TG_OP = 'INSERT'` HOẶC có ít nhất 1 trong 6 org FKs thay đổi ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1).
- **EFR-57**: Đảm bảo fetch/validate/check target scope và gọi `submit_employee_pending` RPC atomic trong DB transaction để tránh TOCTOU ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-58**: Chuẩn hóa `trim() === ''` thành `null` khi kiểm tra Two-Way Null Parity trên cả FE và BE ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-59**: Đặt tên script test staged migration là `test:integration:upgrade-052` để tránh ghi đè script `test:integration:staged` hiện hữu ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy & Task 3.4).
- **EFR-60**: Bổ sung `line_nhan_su_id` vào quy trình Disambiguated Text-to-ID Fallback Resolution (6 fields) ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 2.1).
- **EFR-61**: Migration 052 thực thi `REVOKE ALL ON FUNCTION public.submit_employee_pending(...) FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role;` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1).
- **EFR-62**: Thực thi row lock `SELECT ... FOR UPDATE` và verification pending state atomic bên trong `submit_employee_pending` RPC transaction body ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-63**: Bổ sung logic kiểm tra SA/EA target scope theo `p_changed_by` trực tiếp bên trong SQL transaction body của `submit_employee_pending` RPC sau `SELECT ... FOR UPDATE` row lock ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-64**: Áp dụng Optimistic Concurrency Control (`updated_at` compare-and-swap) trả về HTTP `409 Conflict` nếu record bị sửa đổi bởi request khác trong quá trình authorization cho direct `PUT /api/employees/:id` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Section 2 & Task 3.2).
- **EFR-65**: RPC `submit_employee_pending` thực thi re-run full validation (two-way null parity, canonical text matching, fixed mapping, DB ancestry) trên locked `submitEffectiveState` sau `FOR UPDATE` row lock và derive target scope từ canonical root `khoi_id` đã validate ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1 & Task 3.2).
- **EFR-66**: Chuẩn hóa Staged Upgrade test harness `051 ➔ 052`: reset DB schema `--version 051` ➔ restore data dump ➔ seed test users ➔ apply `052` để kiểm chứng chính xác upgrade path từ 051 ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy, Task 3.4 & Task 3.Final).
- **EFR-67**: Chuẩn hóa canonical command path seed dev test users thành `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test` ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy, Task 3.4 & Task 3.Final).
- **EFR-68**: Chuẩn hóa path của `EmployeeEditPage.tsx` thành `frontend/src/pages/Employees/EmployeeEditPage.tsx` trong affected files table, Task 3.3, và Section 10 Rollback Plan ➔ Đã sửa `FEATURE_PLAN.md` & `FEATURE_TASKS.md`.

## Rejected Findings
Không có.

## Inconclusive Findings
Không có.

## Secondary Scan Findings (SFR)
Không có.

## Khuyến nghị không chặn rollout
Không có.

## Cần xác thực thêm
Không có.
