## Round 1 - 2026-06-17T12:50:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`, `backend/src/__tests__/integration/probationReviewer.test.ts`

### EFR Đã Chấp Nhận -> [FR-01]: Generic endpoints can bypass field-level SA/EA-khoi permission | Sửa: Thêm task kiểm tra field-level permission ở backend service `updateEmployee` và `savePersonnelToPending`. Nếu payload có `nguoi_nghiem_thu_thu_viec`, chỉ cho phép SA hoặc EA của khối tương ứng của nhân viên đó.
### EFR Đã Chấp Nhận -> [FR-02]: Plan chưa chốt canonical update path giữa endpoint chuyên biệt và generic form flow | Sửa: Chốt giữ cả hai đường dẫn cập nhật. Endpoint chuyên biệt dùng cho cập nhật trực tiếp tại Detail Page (ReviewerCard), còn generic endpoints dùng cho form flows (Create/Edit/Transfer).
### EFR Đã Chấp Nhận -> [FR-03]: UI permission task chưa đủ cụ thể, current form chưa disable field | Sửa: Thêm task cụ thể để disable trường `nguoi_nghiem_thu_thu_viec` trên UI nếu user không phải SA và không có quyền EA của khối nhân viên.
### EFR Đã Chấp Nhận -> [FR-04]: Test strategy thiếu negative/security và pending submit verification | Sửa: Bổ sung các test cases kiểm tra quyền âm (reviewer, VI, EA khác khối bị reject) và kiểm tra lưu nháp/submit thành công trường này qua generic endpoints.
### EFR Đã Chấp Nhận -> [FR-05]: Review gate/status mâu thuẫn với yêu cầu review | Sửa: Cập nhật trạng thái `FEATURE_PLAN.md` về `⚠️ CẦN SỬA` để phản ánh đúng hiện trạng đang trong quá trình review/rebuttal.

### Vùng đã scan khi không có SFR -> [backend/src/services/employeeService.ts:430-520] [Đã kiểm tra logic update và save personnel pending]

## Round 3 - 2026-06-17T17:03:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `frontend/src/components/EmployeeForm.tsx`, `backend/src/services/employeeService.ts`

### EFR Đã Chấp Nhận -> [EFR-06]: Disable field chưa đủ vì `EmployeeForm` vẫn submit full form payload | Sửa: Cập nhật backend guard chỉ block khi giá trị mới thực sự khác giá trị cũ (`data.nguoi_nghiem_thu_thu_viec !== oldRow.nguoi_nghiem_thu_thu_viec`).
### EFR Đã Chấp Nhận -> [EFR-07]: Generic form flow không thể gỡ/clear `nguoi_nghiem_thu_thu_viec` hiện có | Sửa: Khi gỡ/clear trường này ở UI, submit explicit `null` thay vì `undefined`. Cập nhật backend/schema để xử lý gỡ bỏ bằng giá trị `null`.

## Round 5 - 2026-06-17T17:24:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/services/employeeService.ts`, `database/migrations/026_save_personnel_pending_rpc.sql`

### EFR Đã Chấp Nhận -> [EFR-08]: Guard so với live DB có thể ghi đè pending NNT hiện có | Sửa: Trong `savePersonnelToPending`, nếu actor không có quyền sửa NNT và gửi lên giá trị giống với live DB, ta sẽ loại bỏ (scrub/delete) trường này khỏi payload `cleanData` trước khi gọi RPC merge. Nếu giá trị truyền lên khác với giá trị hiện tại có hiệu lực (live DB hoặc pending cũ), trả về 403 Forbidden.

## Round 7 - 2026-06-17T17:33:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/services/employeeService.ts`, `d:\ToolNhanSuVcc\.agent\active\employee-reviewer-field\FEATURE_PLAN.md`

### EFR Đã Chấp Nhận -> [EFR-09]: EFR-08 fix còn mâu thuẫn giữa "effective pending" và "echo live value" | Sửa: Làm rõ thuật toán kiểm tra quyền của `nguoi_nghiem_thu_thu_viec` ở `savePersonnelToPending`. Nếu actor không có quyền sửa NNT: (1) Nếu giá trị truyền lên bằng với live DB OR bằng với pending value hiện tại thì ta scrub key khỏi payload để giữ nguyên trạng thái cũ; (2) Chỉ trả về 403 Forbidden khi giá trị truyền lên khác cả hai giá trị này.

## Round 9 - 2026-06-17T17:47:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/services/employeeService.ts`, `d:\ToolNhanSuVcc\.agent\active\employee-reviewer-field\FEATURE_PLAN.md`

### EFR Đã Chấp Nhận -> [EFR-10]: Generic path chưa canonicalize NNT trước khi compare/save | Sửa: Trước khi so sánh hoặc lưu trong `updateEmployee` và `savePersonnelToPending`, thực hiện chuẩn hóa `nguoi_nghiem_thu_thu_viec` bằng `.trim().toLowerCase()` (nếu có giá trị) để đảm bảo tính nhất quán dữ liệu và tính chính xác khi so khớp.

## Round 11 - 2026-06-17T18:00:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/services/employeeService.ts`, `frontend/src/components/ReviewerCard.tsx`

### EFR Đã Chấp Nhận -> [EFR-11]: Endpoint live `probation-reviewer` có thể bị pending NNT ghi đè sau submit | Sửa: Trong backend service `updateProbationReviewer` (phục vụ cho endpoint chuyên biệt live-update), nếu phát hiện trong `pending_changes` đã tồn tại sẵn key `nguoi_nghiem_thu_thu_viec`, trả về lỗi `400 Bad Request` hoặc `409 Conflict` để yêu cầu xử lý pending trước, tránh việc live update bị ghi đè âm thầm sau khi submit.

## Round 13 - 2026-06-17T21:16:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/services/employeeService.ts`

### EFR Đã Chấp Nhận -> [EFR-12]: Generic Edit Form live update vẫn có thể bị pending NNT cũ ghi đè sau submit | Sửa: Áp dụng cùng cơ chế bảo vệ của EFR-11 vào generic `updateEmployee` service. Nếu payload gửi lên generic update có chứa `nguoi_nghiem_thu_thu_viec` (và khác với live DB) trong khi nhân sự đang có pending NNT trong `pending_changes`, trả về lỗi `400 Bad Request` hoặc `409 Conflict` để yêu cầu xử lý pending trước.

## Round 15 - 2026-06-18T08:15:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`

### EFR Đã Chấp Nhận -> [EFR-13]: Audit `changed_fields` của personnel-pending sẽ log sai khi service scrub NNT no-op | Sửa: Cập nhật service `savePersonnelToPending` để trả về thêm danh sách các field thực sự được lưu nháp (ví dụ `saved_fields`). Thay đổi route Hono `PUT /api/employees/:id/personnel-pending` sử dụng danh sách `saved_fields` trả về từ service thay vì `Object.keys(parsed.data)` để ghi nhận chính xác vào `changed_fields` của audit log.

## Round 18 - 2026-06-18T09:47:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/routes/employees.ts`, `backend/src/routes/admin.ts`, `backend/src/services/employeeService.ts`
### EFR Đã Chấp Nhận -> [EFR-14]: Edit form hiện đi live-update, không đi `pending_changes.reviewer_emails` | Sửa: Cập nhật plan và tasks để sửa `EmployeeEditPage.tsx` tách trường `reviewer_emails` gửi qua endpoint pending thay vì live update. Generic `updateEmployee` sẽ strip `reviewer_emails` để tránh bypass.
### EFR Đã Chấp Nhận -> [EFR-15]: Thiếu backend field-level guard cho `reviewer_emails`; UI disable không đủ | Sửa: Bổ sung logic check permission ở backend service `updateEmployee` và `savePersonnelToPending` chỉ cho phép SA hoặc EA cùng khối cập nhật trường này.
### EFR Đã Chấp Nhận -> [EFR-16]: `useAllUsers` lấy từ admin endpoint SA-only, mâu thuẫn với việc EA được chỉnh field | Sửa: Thêm endpoint `/api/employees/reviewer-options` ở router employee dành cho autocomplete email.

## Round 19 - 2026-06-18T10:33:25+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/routes/employees.ts`, `backend/src/services/adminService.ts`, `.agent/active/employee-reviewer-field/FEATURE_PLAN.md`, `.agent/active/employee-reviewer-field/FEATURE_TASKS.md`
### EFR Đã Chấp Nhận -> [EFR-17]: Endpoint `/reviewer-options` thiếu boundary role/search, có thể enumerate email toàn hệ thống | Sửa: Cập nhật plan và tasks yêu cầu endpoint `/api/employees/reviewer-options` giới hạn quyền gọi (chỉ SA hoặc user có ít nhất một quyền EA mới được phép gọi) và yêu cầu `q.trim().length >= 2` để trả về mảng rỗng nếu query quá ngắn, kèm theo các unit/integration test tương ứng để verify.

## Round 20 - 2026-06-18T10:41:57+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`, `frontend/src/pages/Employees/EmployeeCreatePage.tsx`, `.agent/active/employee-reviewer-field/FEATURE_PLAN.md`, `.agent/active/employee-reviewer-field/FEATURE_TASKS.md`
### EFR Đã Chấp Nhận -> [EFR-18]: Create path chưa yêu cầu strip `reviewer_emails` trước khi insert `employees` | Sửa: Cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` yêu cầu cả `createEmployee` và `createEmployeeWithSalary` loại bỏ trường `reviewer_emails` khỏi payload trước khi ghi vào bảng `employees` (hoặc gọi RPC onboarding), tránh lỗi DB. Sau đó insert danh sách người nghiệm thu vào bảng `employee_reviewers`. Bổ sung integration tests tương ứng.
### EFR Đã Chấp Nhận -> [EFR-19]: Scrub `reviewer_emails` no-op sẽ làm audit `changed_fields` sai nếu không mở rộng `saved_fields` | Sửa: Cập nhật plan và tasks yêu cầu `savePersonnelToPending` trả về danh sách `saved_fields` đã qua scrub. Tuyến Hono route `PUT /api/employees/:id/personnel-pending` sẽ sử dụng `saved_fields` này thay vì `Object.keys(parsed.data)` cho audit log, tránh ghi nhận sai thông tin thay đổi. Bổ sung integration test để kiểm chứng.

## Round 21 - 2026-06-18T10:53:54+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`, `backend/src/services/nntService.ts`, `.agent/active/employee-reviewer-field/FEATURE_PLAN.md`, `.agent/active/employee-reviewer-field/FEATURE_TASKS.md`
### EFR Đã Chấp Nhận -> [EFR-20]: Submit pre-check NNT chỉ nhìn live `employee_reviewers`, bỏ qua `pending_changes.reviewer_emails` | Sửa: Cập nhật route submit `/submit` để tính toán danh sách "effective reviewers" (ưu tiên lấy từ `pending_changes` nếu tồn tại key `reviewer_emails`, ngược lại mới fallback về live `employee_reviewers`), tránh việc block submit nhầm hoặc bypass block.
### EFR Đã Chấp Nhận -> [EFR-21]: Migration submit chưa chốt phân biệt key vắng mặt với mảng rỗng | Sửa: Cập nhật database migration để hàm SQL `submit_employee_pending` chỉ đồng bộ sang `employee_reviewers` khi key `reviewer_emails` thực sự tồn tại trong JSON `pending_changes` (`v_emp_pending ? 'reviewer_emails'`), bảo vệ reviewers cũ trên unrelated submits.

## Round 22 - 2026-06-18T16:06:04+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `.agent/active/employee-reviewer-field/FEATURE_TASKS.md`
### EFR Đã Chấp Nhận -> [EFR-22]: `FEATURE_TASKS.md` làm hỏng checklist Task 1.1 migration | Sửa: Định dạng lại `FEATURE_TASKS.md` để tách biệt phần mô tả mục tiêu của phase 1 và checkbox của Task 1.1, đảm bảo Task 1.1 được hiển thị đúng cấu trúc và dễ dàng theo dõi tiến độ.








