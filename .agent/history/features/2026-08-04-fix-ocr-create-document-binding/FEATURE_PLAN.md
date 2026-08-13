# Feature Plan: Sửa lỗi chặn submit khi tạo mới nhân sự bằng AI OCR

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: ✅ Đã hội tụ (Round 8 - 25 EFRs accepted)
> **Feature slug**: fix-ocr-create-document-binding
> **Tạo bởi**: feature-plan (Đã cập nhật theo EFR-01 -> EFR-25)
> **Ngày tạo**: 2026-08-04

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi mở giao diện Tạo mới nhân sự (`mode = 'create'`), `maNhanSu` chưa được định danh (`undefined`). Khi người dùng chụp ảnh/tải lên giấy tờ tuyển dụng và chạy AI OCR fill thông tin thành công, hợp phần `DocumentUpload` không cập nhật lại trạng thái `serverDocs` (do `fetchServerDocs` bị thoát sớm khi `maNhanSu` thiếu).
- **Vấn đề cần giải quyết:** Form `EmployeeForm` tính toán `hasBindableEvidence = false` khi người dùng bấm nút **Tạo mới**, làm xuất hiện thông báo lỗi toast: `"Vui lòng tải lên tài liệu tuyển dụng trước khi tạo mới"` và chặn ngắt toàn bộ luồng Submit.
- **Mục tiêu:** Đồng bộ duy nhất một `activeTempUuid` giữa `EmployeeForm` và `DocumentUpload` (qua `EmployeeEditPage` merge `pending_salary` hoặc read canonical `_temp_uuid`). Đảm bảo `hasBindableEvidence = true` CHỈ KHI tài liệu đã finalize `upload_status === 'ready'`. Nâng cấp RPC Migration `047_enforce_ready_status_in_onboarding_rpc.sql` với: atomic claim `FOR UPDATE` / `UPDATE ... RETURNING` (EFR-19), lock row & clear `temp_uuid` chống replay/concurrent double-submit, map RPC domain error sang HTTP 400/409 (EFR-24), khóa RPC chỉ cho `service_role` (EFR-18), bảo toàn `state_pending` contract dựa trên non-empty salary data (EFR-11, EFR-21, EFR-23), Cloud Deployment Gate chuẩn (EFR-13), và integration tests chứng minh rollback sạch + security isolation cho cả `anon` & `authenticated` với distinct payloads cho concurrent test (winner trả HTTP 201 Created) (EFR-20, EFR-22, EFR-25).
- **Kết quả mong đợi:** Người dùng chụp ảnh/tải file -> Upload & finalize sang `ready` -> AI đọc điền thông tin -> Bấm "Tạo mới" thành công mà không bị báo thiếu tài liệu.

## 2. Phạm vi

### In scope
- <!-- Sửa theo EFR-02, EFR-09, EFR-12, EFR-15: Single Source of Truth activeTempUuid end-to-end -->
  Đồng bộ một `activeTempUuid` duy nhất end-to-end: Cập nhật `EmployeeEditPage.tsx` fetch và merge `pending_salary._temp_uuid` hoặc `active_pending_temp_uuid` từ server vào `initialValues`, giúp `EmployeeForm.tsx` nhận đúng UUID nháp sẵn có.
- <!-- Sửa theo EFR-01: Chỉ tính bindable evidence từ ready docs -->
  Cập nhật logic `hasBindableEvidence` trong `DocumentUpload.tsx` chỉ công nhận các file đã finalize thành công (`upload_status === 'ready'`), không công nhận file đang upload hoặc chưa finalize.
- <!-- Sửa theo EFR-06, EFR-11, EFR-14, EFR-16, EFR-17, EFR-18, EFR-19, EFR-21, EFR-23, EFR-24: Atomic SQL RPC Hardening, Concurrency Lock & Domain Error Mapping -->
  Tạo migration `047_enforce_ready_status_in_onboarding_rpc.sql`:
  - Lọc chính xác `upload_status = 'ready'`, `document_type = 'tuyen_moi'`, `employee_id IS NULL` cho cả validation và statement `UPDATE`.
  - Atomically claim document bằng `SELECT ... FOR UPDATE` / `UPDATE ... RETURNING`, kiểm tra row count > 0 và `RAISE` để rollback nếu claim thất bại (chống replay & concurrent double-submit).
  - Map các lỗi domain của RPC sang HTTP 400/409 phù hợp tại `employeeService.ts` thay vì ném generic HTTP 500.
  - Khóa quyền Security: `REVOKE ALL ON FUNCTION fn_create_employee_onboarding ... FROM PUBLIC, anon, authenticated;` và `GRANT EXECUTE TO service_role;`.
  - Bảo toàn contract `state_pending`: chỉ set `true` khi `p_salary_data` thực sự chứa dữ liệu lương non-empty.
- <!-- Sửa theo EFR-04: Xử lý đúng state transitions và file deletion -->
  Kích hoạt callback `onDocumentsChange` với tập `ready` docs chính xác sau các bước upload thành công, upload lỗi, xóa file thành công/thất bại.
- <!-- Sửa theo EFR-10, EFR-13: Cloud Deployment Gate Bắt Buộc -->
  Khóa cứng quy trình Cloud Deployment Gate: Chạy Migration 047 qua Supabase Dashboard SQL Editor -> `NOTIFY pgrst, 'reload schema'` -> Chạy Verification Smoke Query và xác nhận người/thời gian thực thi TRƯỚC KHI deploy backend Cloud Run.
- <!-- Cập nhật theo chuẩn Supabase Local Docker CLI Harness & EFR-07, EFR-14, EFR-19, EFR-20, EFR-21, EFR-22, EFR-25 -->
  Thực thi 100% backend integration tests trên môi trường **Supabase Local Docker CLI Harness** (`127.0.0.1:54321`) bằng lệnh `pnpm --filter backend test:integration:fresh` với distinct payloads cho concurrent test (winner trả HTTP 201 Created), assertions cho anon/authenticated direct RPC rejection, `state_pending` contract, và clean rollback assertions.
- <!-- Sửa theo EFR-08: Chuẩn hóa phạm vi test Frontend -->
  Xác định Frontend verification được thực hiện qua **Manual Verification Matrix** + TypeScript typecheck (`pnpm run typecheck`).

### Out of scope
- Thay đổi AI Vision OCR prompt.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `Draft Upload Permission Exception`: Cho phép upload tài liệu nháp loại `tuyen_moi` bằng `temp_uuid` trước khi tạo nhân sự.
  - `Atomic Onboarding Flow`: Bind tài liệu từ `temp_uuid` trong 1 SQL transaction duy nhất thông qua PostgreSQL RPC `SECURITY DEFINER`.
  - `SEC-REV-04 Scoped RPC Standard`: Khóa quyền RPC chỉ dành riêng cho `service_role` (`REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT TO service_role`).
  - `PostgREST Schema Cache Reload`: Sau khi tạo/sửa SQL function trên Supabase Cloud Editor, bắt buộc chạy `NOTIFY pgrst, 'reload schema';`.
  - `Supabase Local Docker CLI Harness Standard`: Mọi bài test backend integration thực thi 100% trên Supabase Local Docker CLI (`npx supabase start` trỏ `127.0.0.1:54321`), không bao giờ tác động đến DB Cloud Dev/Prod.
  - `Single Source of Truth`: Không thay đổi Zod schema validation.
- **"Cấm kỵ" cần tránh:**
  - Không unmount thẻ `<Upload>` khi đang tải file.
  - Không công nhận `fileList` (chưa finalize) làm `hasBindableEvidence = true`.
  - Không mở quyền EXECUTE RPC `fn_create_employee_onboarding` cho public/anon/authenticated.
  - Không bind các file status `reserved` hoặc sai `document_type`.
  - Không cho phép replay `temp_uuid` hoặc concurrent double-submit cùng UUID.
  - Không ném HTTP 500 cho các lỗi domain validation dự kiến của RPC.

## 4. Giả định và câu hỏi mở

### Giả định
- `activeTempUuid` đại diện cho một phiên làm việc upload nháp duy nhất cho tới khi nhân sự được tạo.
- Supabase Local Docker CLI đang sẵn sàng hoạt động tại máy local (`127.0.0.1:54321`).

### Câu hỏi mở
- [Non-blocking] Nếu người dùng xóa file nháp vừa upload thành công và không còn file nào khác, `hasBindableEvidence` phải lập tức reset về `false` -> AC này bắt buộc được kiểm thử và đáp ứng.

## 5. Acceptance Criteria

- [ ] Khi upload và finalize file thành công (`upload_status === 'ready'`), `hasBindableEvidence` chuyển thành `true`.
- [ ] Trong lúc file đang upload (`uploading`), `hasBindableEvidence` vẫn là `false` và nút Submit bị chặn hợp lệ.
- [ ] AI OCR đọc giấy tờ và fill form thành công.
- [ ] Bấm nút **Tạo mới** tiến hành submit thành công với đúng `activeTempUuid`, không báo lỗi toast.
- [ ] Trường hợp xóa file nháp duy nhất, `hasBindableEvidence` reset về `false` chính xác.
- [ ] Direct call RPC `fn_create_employee_onboarding` từ CẢ `anon` VÀ `authenticated` client đều bị từ chối `permission denied` (chỉ `service_role` được gọi).
- [ ] RPC chỉ bind file `upload_status = 'ready'`, `document_type = 'tuyen_moi'`, `employee_id IS NULL`; file `reserved` trong cùng session không bị bind nhầm.
- [ ] Hai request onboarding đồng thời cạnh tranh cùng `temp_uuid` (sử dụng 2 `ma_nhan_su` và email khác nhau) chỉ có duy nhất 1 request thành công (HTTP 201 Created), 1 request bị reject HTTP 409/400 (chữ ký lỗi do document claim lock, không phải lỗi unique ma_nhan_su) và rollback sạch 100%.
- [ ] Các lỗi domain của RPC (chưa ready, đã bind, claim fail) được map chính xác sang HTTP 400 hoặc 409 thay vì HTTP 500.
- [ ] Sau khi bind, RPC clear `temp_uuid = NULL` (consume-once) chống replay attack.
- [ ] Assertion sau khi reject chứng minh DB rollback 100% sạch: Không có employee row, không có salary row, document giữ nguyên trạng thái cũ.
- [ ] Luồng `POST /api/employees` không có lương tạo salary row `state_pending = false`; luồng `POST /api/employees/onboard` có dữ liệu lương non-empty tạo salary row `state_pending = true`.
- [ ] Chạy thành công toàn bộ backend integration tests trên **Supabase Local Docker CLI Harness** (`pnpm --filter backend test:integration:fresh`).
- [ ] Hoàn thành Cloud Deployment Gate (chạy Migration 047 + `NOTIFY pgrst, 'reload schema'` + verify smoke query) trên Supabase Dev/Prod Dashboard trước khi deploy backend.
- [ ] Không phát sinh lỗi TypeCheck (`pnpm run typecheck`).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [EmployeeEditPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeEditPage.tsx) | Sửa | Fetch và merge `pending_salary` / `active_pending_temp_uuid` vào `initialValues` | 🟢 Thấp | Frontend Page Flow |
| [EmployeeForm.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/EmployeeForm.tsx) | Sửa | Truyền và gửi thống nhất `activeTempUuid` (đọc từ `pending_changes` hoặc `pending_salary`) xuống `DocumentUpload` | 🟢 Thấp | Giữ nguyên |
| [DocumentUpload.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/DocumentUpload.tsx) | Sửa | Cập nhật `hasBindableEvidence` chỉ dựa trên ready docs, bổ sung notify trên mọi state transition | 🟡 Trung bình | Tuân thủ File Contract |
| [047_enforce_ready_status_in_onboarding_rpc.sql](file:///d:/ToolNhanSuVcc/database/migrations/047_enforce_ready_status_in_onboarding_rpc.sql) | Tạo mới | Cập nhật `fn_create_employee_onboarding`: validate & atomic claim `FOR UPDATE` ready/tuyen_moi/unbound rows, consume-once clear temp_uuid, REVOKE FROM PUBLIC/anon/authenticated & GRANT TO service_role | 🔴 Cao | SECURITY DEFINER RPC |
| [employeeService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/employeeService.ts) | Sửa | Chuyển luồng `createEmployee` và `createEmployeeWithSalary` sang gọi RPC atomic bằng service-role client, map SQLSTATE/domain error sang HTTP 400/409 | 🟡 Trung bình | Backend Defense-in-depth |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** SQL RPC `fn_create_employee_onboarding` concurrency locks, permissions & consume-once logic, hàm `notifyChange`, logic finalize file trong `DocumentUpload.tsx`, thứ tự Cloud Deployment Gate, HTTP Error Code mapping.
- **Review focus areas:**
  1. RPC migration 047 có REVOKE thành công khỏi PUBLIC/anon/authenticated và chỉ GRANT cho service_role không?
  2. Claim document trong RPC có atomic `FOR UPDATE` / `RETURNING` để chặn concurrent double-submit không?
  3. Backend service có map đúng lỗi RPC sang HTTP 400/409 thay vì 500 không?
- **Known pitfalls / historical issues:** Chú ý không unmount thẻ Upload trong React render tree; đảm bảo không lọt file status `reserved`.
- **Dependencies / rollout concerns:** Tạo migration 047, chạy SQL Editor trên Supabase Dashboard + `NOTIFY pgrst, 'reload schema'`, xác nhận Cloud Deployment Gate, sau đó mới deploy backend.

## 8. Chiến lược triển khai

- **Phase strategy:** 2 Phase.
  - Phase 1: Fix Frontend (Wire `pending_salary` trong `EmployeeEditPage.tsx` + Single `activeTempUuid` + Ready-only evidence tracking + Transitions notify).
  - Phase 2: DB Migration 047 (Hardened RPC, Concurrency Lock & REVOKE/GRANT) + Backend Atomic RPC Enforcement & HTTP Error Mapping + Integration Tests on Supabase Local Docker CLI + Cloud Deployment Gate Checklist.
- **Thứ tự triển khai:**
  1. Phase 1: Cập nhật `EmployeeEditPage.tsx`, `EmployeeForm.tsx` & `DocumentUpload.tsx`.
  2. Phase 2: Tạo Migration 047, cập nhật `employeeService.ts` & chạy `test:integration:fresh` trên Supabase Local Docker CLI.
  3. Cloud Gate: Chạy Migration 047 trên Cloud DB -> `NOTIFY pgrst, 'reload schema'` -> Verify smoke query -> Xác nhận Gate -> Deploy Backend.

## 9. Test Strategy

- **Automated tests:**
  - `pnpm run typecheck`
  - Backend integration test (`pnpm --filter backend test:integration:fresh`) thực thi 100% trên **Supabase Local Docker CLI Harness** (`127.0.0.1:54321`) với các cases:
    - Case `reserved` file / sai `document_type`: Reject HTTP 400/409 & assert clean rollback.
    - Case mixed-session (1 file `ready` + 1 file `reserved`): Chỉ bind duy nhất file `ready`.
    - Case Concurrent double-submit (2 calls cạnh tranh cùng `temp_uuid` với distinct `ma_nhan_su` & email): 1 call success (HTTP 201 Created), 1 call reject (HTTP 409 claim lock) & rollback clean.
    - Case Replay attack (dùng lại `temp_uuid` đã consume): Reject HTTP 400/409.
    - Case Direct RPC call từ `anon` VÀ `authenticated` clients: Đều bị Denied.
    - Case `POST /api/employees` (không lương) vs `POST /api/employees/onboard` (có lương / `salary: {}`): Assert `state_pending = false` vs `true` phù hợp với dữ liệu lương non-empty.
    - Case Service-role atomic onboarding: Success (HTTP 201 Created).
- **Manual verification matrix:**
  - Create upload-ready-submit: Thành công.
  - Submit khi đang upload: Chặn hợp lệ.
  - Upload lỗi / Cancel: Chặn hợp lệ.
  - Delete file duy nhất: Reset `hasBindableEvidence = false`.
  - Transfer draft cũ (cả emp pending và pending_salary): Giữ nguyên continuity của `_temp_uuid`.

## 10. Rollback Plan

- Revert commit backend/frontend.
- Revert Migration 047 trên SQL Editor bằng script khôi phục RPC 036 ban đầu kèm `NOTIFY pgrst, 'reload schema'`.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
