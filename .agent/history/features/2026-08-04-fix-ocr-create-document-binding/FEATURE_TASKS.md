# Feature Tasks: Sửa lỗi chặn submit khi tạo mới nhân sự bằng AI OCR

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-08-04 (Cập nhật theo EFR-01 -> EFR-25)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Đồng bộ Frontend Single `activeTempUuid` & Ready-Only Evidence State

**Mục tiêu:** Đảm bảo `EmployeeEditPage`, `EmployeeForm` và `DocumentUpload` dùng chung một `activeTempUuid` duy nhất end-to-end (đọc từ cả `pending_changes` và `pending_salary` canonical fields) và `hasBindableEvidence` chỉ bằng `true` khi file đã finalize sang `upload_status === 'ready'`.

- [x] Task 1.1: <!-- Sửa theo EFR-15 --> Cập nhật [EmployeeEditPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeEditPage.tsx) để fetch và merge `pending_salary` (hoặc `active_pending_temp_uuid`) vào `initialValues` truyền xuống `EmployeeForm`.
- [x] Task 1.2: <!-- Sửa theo EFR-02, EFR-09, EFR-12 --> Cập nhật [EmployeeForm.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/EmployeeForm.tsx) để đọc `activeTempUuid` từ `initialValues.pending_changes._temp_uuid` hoặc `initialValues.pending_salary._temp_uuid`, nếu không có mới tạo UUID mới.
- [x] Task 1.3: <!-- Sửa theo EFR-01, EFR-04 --> Cập nhật [DocumentUpload.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/DocumentUpload.tsx) chỉ công nhận `hasBindableEvidence = true` khi file đã finalize sang `ready` (từ `serverDocs` ready hoặc `savedDoc` vừa finalize từ `POST /documents`).
- [x] Task 1.4: <!-- Sửa theo EFR-04 --> Xử lý đầy đủ state transitions trong [DocumentUpload.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/DocumentUpload.tsx): gọi `notifyChange` cập nhật `hasBindableEvidence` khi upload thành công, upload thất bại, xóa file thành công, xóa file thất bại.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc): Kiểm tra typecheck `pnpm run typecheck` và manual verification matrix cho luồng upload/delete local và draft transfer.

## Phase 2: DB Migration 047 (Hardened RPC, Concurrency Lock & REVOKE/GRANT), Backend Atomic RPC Enforcement, HTTP Error Mapping, Security/Rollback Integration Tests & Cloud Deployment Gate

**Mục tiêu:** Khóa chặt quyền EXECUTE chỉ cho `service_role`, thực thi strict ready-only binding, atomic claim `FOR UPDATE` chống concurrent double-submit & consume-once semantics tại tầng DB Transaction (RPC), map đúng HTTP 400/409 error codes, chứng minh atomic rollback, concurrency lock và security isolation 100% bằng Integration Tests trên Supabase Local Docker CLI Harness (winner trả HTTP 201 Created), và hoàn tất Cloud Deployment Gate.

- [x] Task 2.1: <!-- Sửa theo EFR-06, EFR-11, EFR-16, EFR-17, EFR-18, EFR-19, EFR-21, EFR-23 --> Tạo migration `047_enforce_ready_status_in_onboarding_rpc.sql` nâng cấp RPC `fn_create_employee_onboarding`:
  - Khóa quyền Security: `REVOKE ALL ON FUNCTION fn_create_employee_onboarding(JSONB, JSONB, UUID) FROM PUBLIC, anon, authenticated;` và `GRANT EXECUTE TO service_role;`.
  - Validate & Atomic Claim: Lọc và lock row với `SELECT ... FOR UPDATE` (hoặc `UPDATE ... RETURNING`) chỉ các record thỏa mãn `temp_uuid = p_temp_uuid AND upload_status = 'ready' AND document_type = 'tuyen_moi' AND employee_id IS NULL`. Nếu row count = 0, `RAISE EXCEPTION` với SQLSTATE/message rõ ràng và rollback.
  - Consume-once: Clear `temp_uuid = NULL` cho các document đã bind để phòng ngừa replay attack và concurrent double-submit.
  - Bảo toàn contract `state_pending`: set `true` CHỈ KHI `p_salary_data` thực sự chứa dữ liệu lương non-empty.
- [x] Task 2.2: <!-- Sửa theo EFR-06, EFR-11, EFR-24 --> Cập nhật [employeeService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/employeeService.ts) để luồng `createEmployee` và `createEmployeeWithSalary` đồng bộ gọi RPC atomic tương ứng bằng service-role client, đồng thời map các lỗi domain của RPC sang HTTP 400 hoặc 409 (thay vì 500).
- [x] Task 2.3: <!-- Sửa theo EFR-05, EFR-11, EFR-14, EFR-16, EFR-17, EFR-18, EFR-19, EFR-20, EFR-21, EFR-22, EFR-23, EFR-24, EFR-25 --> Bổ sung integration tests trong `backend/src/__tests__/integration/employee.test.ts`:
  - Direct RPC call từ CẢ `anon` VÀ `authenticated` clients -> Đều bị từ chối `permission denied`.
  - Case `reserved` file / sai `document_type` -> Reject HTTP 400/409 & assert rollback 100% sạch (không có employee/salary, doc giữ nguyên).
  - Case mixed-session (1 file `ready` + 1 file `reserved`) -> Chỉ bind duy nhất file `ready`.
  - Case Concurrent double-submit (2 calls cạnh tranh cùng `temp_uuid` với distinct `ma_nhan_su` & email) -> 1 call success (HTTP 201 Created), 1 call reject (HTTP 409 claim lock) & rollback clean.
  - Case Replay attack (dùng lại `temp_uuid` đã consume) -> Reject HTTP 400/409.
  - Case `POST /api/employees` (không lương) vs `POST /api/employees/onboard` (có lương / `salary: {}`) -> Assert `state_pending = false` vs `true` phù hợp với dữ liệu lương non-empty.
  - Case Service-role atomic onboarding -> Success (HTTP 201 Created).
- [x] Task 2.4: <!-- Sửa theo EFR-10, EFR-13 --> Thực hiện Cloud Deployment Gate Checklist:
  - [x] Migration 047 đã được tạo và kiểm thử 100% trên Local Supabase CLI. Sẵn sàng execute qua SQL Editor trên Supabase Dashboard (Dev/Prod).
  - [x] Script chốt re-cache schema: `NOTIFY pgrst, 'reload schema';`.
  - [x] Smoke Query kiểm tra RPC signature và SECURITY DEFINER isolation sẵn sàng.
- [x] Task 2.Final: <!-- Cập nhật chuẩn Supabase Local Docker CLI Harness & EFR-07, EFR-14 --> 🧪 Test & Verify Phase 2 (Bắt buộc): Thực thi lệnh `pnpm --filter backend test:integration:fresh` chạy 100% trên **Supabase Local Docker CLI Harness** (`127.0.0.1:54321`) để sync migration, reset local DB sạch, seed data test và pass 100% Backend Integration Test Suite với clean rollback, HTTP error status & security assertions.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-04 | Phase 1 | Task 1.Final | User confirm OK Phase 1 | done | Chốt Phase 1 hoàn tất |
| 2026-08-04 | Phase 2 | Task 2.1 - 2.4 | Hoàn thành Migration 047, service-role RPC hardening, error mapping & test suite | done | Đã tạo migration 047 & bổ sung integration test cases |
| 2026-08-04 | Phase 2 | Task 2.Final | Self-test `test:integration:fresh` pass 100% (18 test files, 169 tests) | done | Hoàn tất Phase 2 và chốt feature |


