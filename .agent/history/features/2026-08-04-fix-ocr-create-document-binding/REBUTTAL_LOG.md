## Round 1 - 2026-08-04 10:54:15

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `EmployeeForm.tsx:L70-L390`, `DocumentUpload.tsx:L110-L270`, `employeeService.ts:L470-L570`

### EFR Đã Chấp Nhận -> [EFR-01]: Định nghĩa `hasBindableEvidence` đang cho phép false-positive trước khi upload hoàn tất | Sửa: Chỉ tính `hasBindableEvidence = true` từ `ready` docs (đã finalize thành công qua `POST /documents` hoặc `serverDocs` ready). Không dùng `fileList` thô.
### EFR Đã Chấp Nhận -> [EFR-02]: Plan chưa thiết kế một nguồn chân lý duy nhất cho `temp_uuid` | Sửa: Định nghĩa `activeTempUuid` duy nhất trong `EmployeeForm.tsx` (khởi tạo từ pending `_temp_uuid` nếu có, ngược lại mới sinh random UUID). Dùng thống nhất UUID này cho `DocumentUpload` và payload submit.
### EFR Đã Chấp Nhận -> [EFR-03]: Authoritative backend/DB binding chưa enforce `ready` và đúng `document_type` | Sửa: Bổ sung validation trong `employeeService.ts` (`createEmployee` và `createEmployeeWithSalary`) kiểm tra tài liệu thuộc `temp_uuid` phải có `upload_status = 'ready'` và `document_type = 'tuyen_moi'`.
### EFR Đã Chấp Nhận -> [EFR-04]: Task breakdown chưa bao phủ đầy đủ state transitions và Acceptance Criteria xóa file | Sửa: Bổ sung Task 1.3 xử lý full state transitions (upload success/error, remove success/error) và đảm bảo `hasBindableEvidence` reset về `false` khi xóa hết ready file.
### EFR Đã Chấp Nhận -> [EFR-05]: Test strategy chỉ có typecheck và một happy-path manual test | Sửa: Thêm Task 2.2 cho automated/integration tests ở backend và bổ sung Manual Verification Matrix phủ đầy đủ các rủi ro.

### Vùng đã scan khi không có SFR -> [EmployeeForm.tsx:L70-L390], [DocumentUpload.tsx:L110-L270], [employeeService.ts:L470-L570]
- Kiểm tra tính nhất quán UUID, logic finalize presign R2, và permission validation tại backend. Không phát hiện thêm lỗ hổng mới ngoài 5 EFR đã được chấp nhận.

---

## Round 2 - 2026-08-04 11:00:03

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md` (Round 2 from Codex Desktop), `database/migrations/036_add_probation_reviewer_field.sql:L130-L145`, `backend/package.json:scripts`

### EFR Đã Chấp Nhận -> [EFR-06]: Backend enforcement vẫn nằm ngoài transaction onboarding | Sửa: Tạo Migration 047 cập nhật SQL RPC `fn_create_employee_onboarding` để check `upload_status = 'ready'` & `document_type = 'tuyen_moi'` atomic ngay trong SQL transaction trước khi insert employee và bind document.
### EFR Đã Chấp Nhận -> [EFR-07]: Lệnh verify Phase 2 không chạy integration tests vừa được yêu cầu | Sửa: Đổi command trong Task 2.Final thành `pnpm --filter backend test:integration` (bao gồm Vitest integration config + DB setup).
### EFR Đã Chấp Nhận -> [EFR-08]: Frontend unit test được đưa vào scope nhưng không có task hoặc test harness | Sửa: Chuẩn hóa scope Frontend verification là **Manual Verification Matrix** + TypeScript typecheck (`pnpm run typecheck`), loại bỏ tuyên bố frontend unit test ngoài scope.

### Vùng đã scan khi không có SFR -> [database/migrations/036_add_probation_reviewer_field.sql:L130-L145], [backend/package.json:L14-L18]
- Kiểm tra cấu trúc RPC SQL transaction và Vitest config backend integration test.

---

## Round 3 - 2026-08-04 11:07:47

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md` (Round 3 from Codex Desktop), `EmployeeForm.tsx:L70-L85`, `database/migrations/README.md`

### EFR Đã Chấp Nhận -> [EFR-09]: `activeTempUuid` của transfer vẫn bỏ sót UUID nằm trong salary pending | Sửa: Cập nhật `EmployeeForm.tsx` để khởi tạo `activeTempUuid` từ cả `pending_changes._temp_uuid` (employees) và `salary_pending_changes._temp_uuid` (salaries).
### EFR Đã Chấp Nhận -> [EFR-10]: Plan chưa có đường triển khai Migration 047 lên Dev/Prod | Sửa: Bổ sung Task 2.4 quy trình Rollout Cloud DB (chạy Migration 047 trên SQL Editor Supabase Dashboard + `NOTIFY pgrst, 'reload schema'` trước khi deploy backend Cloud Run).
### EFR Đã Chấp Nhận -> [EFR-11]: Atomic path cho `createEmployee` chưa khóa contract salary state | Sửa: Cập nhật Migration 047 bảo toàn contract `state_pending` (chỉ set `true` khi có dữ liệu lương `p_salary_data` gửi kèm).

### Vùng đã scan khi không có SFR -> [EmployeeForm.tsx:L70-L85], [database/migrations/README.md:L25-L35]
- Kiểm tra logic đọc UUID từ salary pending và quy trình deploy DB Cloud.

---

## Round 4 - 2026-08-04 11:25:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md` (Round 4 from Codex Desktop), `EmployeeEditPage.tsx:L50-L85`, `database/migrations/README.md`

### EFR Đã Chấp Nhận -> [EFR-12]: Plan đọc một salary pending field không tồn tại trong luồng dữ liệu của `EmployeeForm` | Sửa: Đọc `activeTempUuid` từ canonical field `pending_changes._temp_uuid` hoặc `pending_salary._temp_uuid` trong `EmployeeForm.tsx`.
### EFR Đã Chấp Nhận -> [EFR-13]: Cloud migration vẫn là “hướng dẫn”, chưa thành deployment gate có xác nhận | Sửa: Khóa cứng Task 2.4 thành Cloud Deployment Gate Checklist (chạy Migration 047, chạy `NOTIFY`, verify smoke query, ghi nhận xác nhận người/thời gian trước CD deploy backend).
### EFR Đã Chấp Nhận -> [EFR-14]: Integration task chưa chứng minh transaction rollback không để lại dữ liệu một phần | Sửa: Bổ sung assertions trong Task 2.3 xác minh hậu trạng thái DB sau khi reject (assert không có employee row, không có salary row, và document vẫn `employee_id IS NULL`).

### Vùng đã scan khi không có SFR -> [EmployeeEditPage.tsx:L50-L85], [database/migrations/README.md:L27-L31]
- Kiểm tra canonical field name cho pending_salary và quy trình xác nhận Deployment Gate.

---

## Round 5 - 2026-08-04 11:21:56

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md` (Round 5 from Codex Desktop), `EmployeeEditPage.tsx:L1-L150`, `046_update_workflow_binding_rpcs.sql:L50-L185`

### EFR Đã Chấp Nhận -> [EFR-15]: Bản sửa EFR-12 vẫn chưa đưa `pending_salary` vào `EmployeeForm.initialValues` | Sửa: Bổ sung Task 1.1 wire dữ liệu end-to-end trong `EmployeeEditPage.tsx`: fetch và merge `pending_salary` vào `initialValues` truyền sang `EmployeeForm`.
### EFR Đã Chấp Nhận -> [EFR-16]: Validation “có một file hợp lệ” chưa khóa phạm vi các row thực sự được bind | Sửa: Cập nhật Migration 047 lọc chính xác `temp_uuid`, `upload_status = 'ready'`, `document_type = 'tuyen_moi'`, `employee_id IS NULL` cho cả phần validation và câu `UPDATE` statement.
### EFR Đã Chấp Nhận -> [EFR-17]: `temp_uuid` chưa có consume-once semantics, cho phép replay hoặc double-submit đồng thời | Sửa: Thực thi consume-once trong Migration 047 bằng cách clear `temp_uuid = NULL` sau khi bind và lọc `employee_id IS NULL` để triệt tiêu replay attack.
### EFR Đã Chấp Nhận -> [EFR-18]: `SECURITY DEFINER` onboarding RPC chưa bị giới hạn về `service_role` | Sửa: Thêm lệnh `REVOKE ALL ON FUNCTION fn_create_employee_onboarding ... FROM PUBLIC, anon, authenticated;` và `GRANT EXECUTE TO service_role;` trong Migration 047.

### Vùng đã scan khi không có SFR -> [EmployeeEditPage.tsx:L1-L150], [046_update_workflow_binding_rpcs.sql:L50-L185]
- Kiểm tra luồng wire dữ liệu `pending_salary` ở frontend và mẫu khóa quyền RPC Security trong Migration 046.

---

## Round 6 - 2026-08-04 11:30:19

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md` (Round 6 from Codex Desktop), `036_add_probation_reviewer_field.sql:L84-L158`, `backend/src/__tests__/integration/employee.test.ts`

### EFR Đã Chấp Nhận -> [EFR-19]: `employee_id IS NULL` và clear UUID chưa ngăn được double-submit đồng thời | Sửa: Bổ sung atomic claim `SELECT ... FOR UPDATE` / `UPDATE ... RETURNING` trong Migration 047, kiểm tra row count > 0 và `RAISE EXCEPTION` nếu claim thất bại; thêm test concurrent onboarding calls.
### EFR Đã Chấp Nhận -> [EFR-20]: AC khóa `authenticated` RPC chưa có test tương ứng | Sửa: Cập nhật Task 2.3 integration tests kiểm thử direct RPC call từ CẢ `anon` VÀ `authenticated` clients, khẳng định đều nhận `permission denied`.
### EFR Đã Chấp Nhận -> [EFR-21]: Test contract `state_pending` không lương/có lương đã bị rơi khỏi plan | Sửa: Khôi phục AC và integration test assertions cho `POST /api/employees` (không lương -> `state_pending = false`) và `POST /api/employees/onboard` (có lương -> `state_pending = true`).

### Vùng đã scan khi không có SFR -> [036_add_probation_reviewer_field.sql:L84-L158], [backend/src/__tests__/integration/employee.test.ts]
- Kiểm tra concurrency locks và role authorization assertions trong integration tests.

---

## Round 7 - 2026-08-04 11:39:55

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md` (Round 7 from Codex Desktop), `backend/src/middleware/errorHandler.ts`, `backend/src/services/employeeService.ts`

### EFR Đã Chấp Nhận -> [EFR-22]: Concurrent test có thể pass vì unique employee ID thay vì document claim lock | Sửa: Yêu cầu concurrent integration test phải dùng 2 `ma_nhan_su` & email khác nhau cùng 1 `temp_uuid`; assert loser fail cụ thể do document claim lock.
### EFR Đã Chấp Nhận -> [EFR-23]: `/onboard` chấp nhận `salary: {}` nhưng plan định nghĩa `state_pending` theo endpoint | Sửa: Xác định contract `state_pending = true` CHỈ KHI `p_salary_data` chứa dữ liệu lương non-empty.
### EFR Đã Chấp Nhận -> [EFR-24]: RPC business rejections vẫn bị backend biến thành HTTP 500 | Sửa: Map các SQLSTATE/domain errors của RPC sang HTTP 400 hoặc 409 trong `employeeService.ts` thay vì ném generic HTTP 500.

### Vùng đã scan khi không có SFR -> [backend/src/middleware/errorHandler.ts], [backend/src/services/employeeService.ts]
- Kiểm tra HTTP Status Code mapping và error handling middleware.

---

## Round 8 - 2026-08-04 11:45:53

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md` (Round 8 from Codex Desktop), `backend/src/routes/employees.ts:L319,L344`

### EFR Đã Chấp Nhận -> [EFR-25]: Concurrent API test kỳ vọng HTTP 200 nhưng create endpoints trả HTTP 201 | Sửa: Đổi expected winner HTTP status code trong concurrent integration test từ HTTP 200 sang HTTP 201 Created (theo đúng contract REST API của `POST /api/employees` và `POST /api/employees/onboard`).

### Vùng đã scan khi không có SFR -> [backend/src/routes/employees.ts:L319,L344]
- Kiểm tra HTTP Status Code contract của create employee endpoints (trả 201 Created).
