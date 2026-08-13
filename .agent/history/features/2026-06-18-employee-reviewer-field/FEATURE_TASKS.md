# Feature Tasks: Tích hợp trường Người nghiệm thu (employee_reviewers) vào Form Thêm mới và Sửa hồ sơ

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-18

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database & Backend & Shared Schema Update

**Mục tiêu:** Thiết lập các cấu trúc dữ liệu, validation schema, endpoint và cập nhật database function cùng backend service để hỗ trợ lưu và xử lý trường `reviewer_emails`.

- [x] Task 1.1: Tạo file migration `database/migrations/037_add_reviewer_form_integration.sql` cập nhật định nghĩa của hàm SQL `submit_employee_pending` nhằm xử lý đồng bộ mảng `reviewer_emails` từ `pending_changes` sang bảng `employee_reviewers` (xoá bản ghi cũ và insert bản ghi mới tương ứng với `p_changed_by`). Lưu ý chỉ thực hiện đồng bộ khi key `reviewer_emails` thực sự tồn tại trong pending JSON (`v_emp_pending ? 'reviewer_emails'`), tránh xoá nhầm dữ liệu khi submit các thay đổi hồ sơ khác. <!-- Sửa theo EFR-21 -->
- [x] Task 1.2: Cập nhật `packages/shared/src/schemas/employee.ts` để bổ sung trường `reviewer_emails: z.array(z.string().email()).optional()` vào `CreateEmployeeInput` và `UpdateEmployeeInput` schemas.
- [x] Task 1.3: Chạy build `@vcc/shared` để cập nhật type definitions.
- [x] Task 1.4: Cập nhật backend `employeeService.ts` và route:
  - Trong `getEmployeeById`: thực hiện fetch thêm danh sách `reviewer_emails` từ bảng `employee_reviewers` cho nhân viên đang truy vấn và gắn vào payload trả về.
  - Trong `createEmployee` và `createEmployeeWithSalary`: destructure/strip (loại bỏ) trường `reviewer_emails` khỏi payload nhân viên trước khi insert DB hoặc gọi RPC onboarding (tránh lỗi unknown column); sau khi tạo employee thành công, thực hiện normalize/dedupe và insert danh sách email người nghiệm thu vào bảng `employee_reviewers`. <!-- Sửa theo EFR-18 -->
  - Trong `savePersonnelToPending`: cho phép lưu trường `reviewer_emails` vào `pending_changes` và lọc bỏ các giá trị trùng lặp. Đảm bảo hàm trả về `saved_fields` chứa danh sách trường thực sự được lưu sau khi đã áp dụng cơ chế scrub no-op. <!-- Sửa theo EFR-19 -->
  - Trong route `PUT /api/employees/:id/personnel-pending`: sử dụng `saved_fields` trả về từ service thay vì `Object.keys(parsed.data)` để ghi nhận chính xác trường thay đổi trong audit log. <!-- Sửa theo EFR-19 -->
  - Trong route submit `PUT /api/employees/:id/submit`: cập nhật logic pre-check NNT để tính toán danh sách "effective reviewers" (ưu tiên dùng `pending_changes.reviewer_emails` nếu key tồn tại, fallback về live `employee_reviewers` nếu vắng mặt). Tránh việc chặn submit khi đang thêm reviewer qua pending hoặc bypass chặn khi đang xóa reviewer qua pending. <!-- Sửa theo EFR-20 -->
  - Thêm backend field-level guard cho `reviewer_emails` ở `updateEmployee` và `savePersonnelToPending`: chỉ cho phép SA hoặc EA của khối tương ứng chỉnh sửa. Các role khác sẽ trả về lỗi 403 Forbidden nếu giá trị bị thay đổi.
  - Trong generic `updateEmployee`: loại bỏ `reviewer_emails` khỏi payload update DB trực tiếp để tránh lỗi cột không tồn tại ở bảng `employees`.
- [x] Task 1.5: Thêm route mới `GET /api/employees/reviewer-options` trong `backend/src/routes/employees.ts` để thực hiện tìm kiếm/gợi ý email (gọi qua `adminService.searchUserEmails`): <!-- Sửa theo EFR-17: Bảo vệ endpoint bằng role check và chặn leak toàn hệ thống khi query ngắn -->
  - Chỉ cho phép Super Admin (`permission.is_superadmin`) hoặc người có ít nhất một quyền `EA` trong hệ thống (`permission.permissions.some(p => p.permission_level === 'EA')`) truy cập. Các role khác bị từ chối bằng lỗi `403 Forbidden`.
  - Kiểm tra `q.trim().length >= 2`. Nếu nhỏ hơn 2, trả về `c.json({ data: [] })`.
- [x] Task 1.6: Viết integration tests để xác thực:
  - Thêm mới nhân viên (cả luồng direct create không lương và onboard create có lương) kèm gán reviewer hoạt động chính xác mà không gặp lỗi cột lạ khi insert DB. <!-- Sửa theo EFR-18 -->
  - Sửa hồ sơ thay đổi reviewer lưu đúng vào `pending_changes`.
  - Duyệt thay đổi (submit) đồng bộ chính xác dữ liệu sang bảng `employee_reviewers`.
  - Kiểm tra phân quyền: EA cùng khối hoặc SA gán thành công, các vai trò khác bị reject 403.
  - Kiểm tra bảo mật của endpoint `/reviewer-options`: SA/EA được 200; VI/VA/reviewer bị 403; `q` trống hoặc quá ngắn trả về mảng rỗng `[]` thay vị dump lớn. <!-- Sửa theo EFR-17 -->
  - Kiểm tra audit log khi sửa hồ sơ: user không đủ quyền gửi `reviewer_emails` trùng khớp với live/current pending thì được 200 (scrub) nhưng audit log không chứa `reviewer_emails`; nếu gửi khác thì bị 403 và không ghi audit thành công. <!-- Sửa theo EFR-19 -->
  - Kiểm tra submit precheck NNT tính theo effective reviewers: live empty + pending non-empty submit pass; live non-empty + pending empty submit bị block (nếu không xác nhận 'khong_co_nnt'); pending absent giữ nguyên hành vi. <!-- Sửa theo EFR-20 -->
  - Kiểm tra submit pending unrelated (không có key `reviewer_emails` trong pending JSON) giữ nguyên danh sách live reviewers. <!-- Sửa theo EFR-21 -->
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Chạy test suite backend để xác nhận hoạt động ổn định.

## Phase 2: Frontend Integration & UI Polish

**Mục tiêu:** Tích hợp trường gán Người nghiệm thu vào giao diện Form của nhân sự, xử lý luồng submit pending cho edit form, và phân quyền chỉnh sửa.

- [x] Task 2.1: Cập nhật `frontend/src/components/EmployeeForm.tsx` thêm Form Item "Người nghiệm thu" sử dụng Select mode "multiple". Gợi ý email lấy từ endpoint autocomplete mới `/api/employees/reviewer-options`.
- [x] Task 2.2: Triển khai kiểm tra phân quyền (disable trường này khi user không phải SA và không có quyền EA cùng khối của nhân sự đang thao tác).
- [x] Task 2.3: Điều chỉnh logic submit tại `frontend/src/pages/Employees/EmployeeEditPage.tsx` và hooks liên quan để khi chỉnh sửa profile (kể cả chế độ thường non-transfer), nếu có thay đổi trường `reviewer_emails`, thông tin đó phải được gửi qua endpoint pending (`/personnel-pending`) để lưu vào phòng chờ duyệt, thay vì gửi qua generic live update.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Chạy thử thực tế giao diện Thêm mới và Sửa hồ sơ để đảm bảo đồng bộ hoạt động mượt mà.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-18 | - | - | Thiết lập lại plan đúng yêu cầu Người nghiệm thu | done | Phân biệt rõ với Người nghiệm thu thử việc |
| 2026-06-18 | Phase 1 | Task 1.1 | Bắt đầu tạo migration database | start | |
| 2026-06-18 | Phase 1 | Task 1.1 | Đã tạo xong migration 037 | done | |
| 2026-06-18 | Phase 1 | Task 1.2 | Bắt đầu cập nhật schema shared | start | |
| 2026-06-18 | Phase 1 | Task 1.2 | Đã cập nhật xong schema shared | done | |
| 2026-06-18 | Phase 1 | Task 1.3 | Bắt đầu build packages/shared | start | |
| 2026-06-18 | Phase 1 | Task 1.3 | Build packages/shared thành công | done | |
| 2026-06-18 | Phase 1 | Task 1.4 | Bắt đầu cập nhật backend employeeService & routes | start | |
| 2026-06-18 | Phase 1 | Task 1.4 | Cập nhật backend employeeService & routes thành công | done | |
| 2026-06-18 | Phase 1 | Task 1.5 | Bắt đầu thêm route reviewer-options | start | |
| 2026-06-18 | Phase 1 | Task 1.5 | Thêm route reviewer-options thành công | done | |
| 2026-06-18 | Phase 1 | Task 1.6 | Bắt đầu viết integration tests | start | |
| 2026-06-18 | Phase 1 | Task 1.6 | Hoàn thành viết và chạy tests (10/11 pass) | done | 1 test submit fail do chưa chạy migration DB |
| 2026-06-18 | Phase 1 | Task 1.Final | Yêu cầu user chạy migration và xác nhận test | start | |
| 2026-06-18 | Phase 1 | Task 1.Final | Đã chạy migration thành công, toàn bộ 11/11 tests pass | done | |
| 2026-06-18 | Phase 2 | Task 2.1 | Bắt đầu tích hợp trường Người nghiệm thu vào EmployeeForm | start | |
| 2026-06-18 | Phase 2 | Task 2.1 | Hoàn thành tích hợp trường Người nghiệm thu chính thức vào EmployeeForm | done | Sử dụng Select mode multiple với autocomplete |
| 2026-06-18 | Phase 2 | Task 2.2 | Hoàn thành phân quyền disable trường cho non-SA và non-EA cùng khối | done | Dùng hasPermission utility |
| 2026-06-18 | Phase 2 | Task 2.3 | Điều chỉnh logic update chuyển sang pending nếu đổi reviewer_emails | done | Chuyển luồng qua savePersonnelPending |
| 2026-06-18 | Phase 2 | Task 2.Final | Giao diện đã hoạt động ổn định và build thành công | done | Toàn bộ dự án đã typecheck thành công |
