# Feature Plan: Tích hợp trường Người nghiệm thu (employee_reviewers) vào Form Thêm mới và Sửa hồ sơ

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã qua review và đạt hội tụ kỹ thuật (Expert Review Round 23)
> **Feature slug**: employee-reviewer-field
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-18

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, trường "Người nghiệm thu" (Soát xét) được quản lý trong bảng độc lập `employee_reviewers` (1 nhân sự có thể có nhiều người nghiệm thu) và chỉ được thiết lập thông qua Tab quản trị của Super Admin (SA). Nhân viên EA/SA khi thêm mới hoặc sửa hồ sơ nhân sự chưa thể gán trực tiếp Người nghiệm thu từ Form.
- **Vấn đề cần giải quyết:** 
  - Phân biệt rõ ràng giữa **Người nghiệm thu** (employee_reviewers - cấp quyền xem/sửa hồ sơ) và **Người nghiệm thu thử việc** (`nguoi_nghiem_thu_thu_viec` - trường text lưu thông tin đánh giá thử việc).
  - Đưa trường "Người nghiệm thu" (dưới dạng danh sách các email) ra Form Thêm mới nhân sự và Form Sửa hồ sơ.
  - Lưu và cập nhật trường này đồng bộ thông qua cả hai luồng: Cập nhật trực tiếp (Thêm mới) và Phòng chờ duyệt (Pending changes khi Sửa hồ sơ).
- **Mục tiêu:** Cho phép EA/SA chỉ định/cập nhật danh sách email Người nghiệm thu ngay tại màn hình Thêm mới và Sửa hồ sơ.
- **Kết quả mong đợi:** 
  - Giao diện Form Thêm mới và Sửa hồ sơ có thêm trường "Người nghiệm thu" (cho phép chọn nhiều email).
  - Thêm mới nhân sự thành công và tự động gán các bản ghi tương ứng vào bảng `employee_reviewers`.
  - Sửa hồ sơ (Edit profile) đưa thay đổi danh sách email này vào `pending_changes.reviewer_emails`. Khi phê duyệt (submit), RPC database sẽ tự động cập nhật bảng `employee_reviewers`.
  - Kiểm tra phân quyền: Chỉ SA và EA của khối tương ứng mới có quyền chỉnh sửa trường này.

## 2. Phạm vi

### In scope
- Cập nhật validation schema `@vcc/shared` để hỗ trợ trường `reviewer_emails` (mảng các chuỗi email) trong payload tạo mới/sửa hồ sơ.
- Cập nhật backend routes & services (`employeeService.ts`):
  - Khi lấy chi tiết hồ sơ (`getEmployeeById`), fetch danh sách `reviewer_emails` hiện tại của nhân sự từ bảng `employee_reviewers` và trả về cho UI.
  - Khi thêm mới nhân sự (`createEmployee`, `createEmployeeWithSalary`): destructure/strip (loại bỏ) trường `reviewer_emails` khỏi payload nhân sự trước khi insert vào bảng `employees` hoặc gọi RPC onboarding để tránh lỗi cột không tồn tại; sau đó normalize/dedupe và insert các bản ghi tương ứng vào bảng `employee_reviewers`. <!-- Sửa theo EFR-18 -->
  - Khi sửa hồ sơ (`savePersonnelToPending`): lưu danh sách `reviewer_emails` mới vào `pending_changes`. Trả về `saved_fields` chứa danh sách các trường thực sự được thay đổi sau khi đã normalize và áp dụng cơ chế scrub/bỏ qua (đảm bảo không bị audit sai khi bị scrub no-op). <!-- Sửa theo EFR-19 -->
  - Tạo backend field-level guard cho `reviewer_emails` ở cả `updateEmployee` và `savePersonnelToPending`: Chỉ SA hoặc EA cùng khối mới được chỉnh sửa trường này (nếu role khác gửi lên và giá trị bị thay đổi so với live DB thì trả về lỗi 403 Forbidden; nếu giá trị trùng khớp thì thực hiện scrub để bỏ qua).
  - Cập nhật generic `updateEmployee` để lọc bỏ (strip) trường `reviewer_emails` trước khi cập nhật trực tiếp vào bảng `employees` để tránh lỗi cột không tồn tại, đồng thời ngăn chặn việc bypass cơ chế phòng chờ.
  - Cập nhật route `PUT /api/employees/:id/personnel-pending` thực hiện ghi nhận audit log trường `changed_fields` dựa trên danh sách `saved_fields` được trả về từ service thay vì `Object.keys(parsed.data)` để tránh ghi nhận sai thông tin khi `reviewer_emails` bị scrub. <!-- Sửa theo EFR-19 -->
  - Cập nhật route submit `PUT /api/employees/:id/submit`: sửa logic pre-check NNT để tính toán danh sách "effective reviewers". Nếu `pending_changes` có chứa key `reviewer_emails`, sử dụng mảng email này để kiểm tra; nếu không có key này, mới fallback về dữ liệu live từ `employee_reviewers`. Tránh việc chặn submit khi đang thêm reviewer qua pending hoặc bypass chặn khi đang xóa reviewer qua pending. <!-- Sửa theo EFR-20 -->
- Tạo database migration mới để cập nhật hàm SQL `submit_employee_pending`, cho phép khi duyệt thay đổi từ phòng chờ thì tự động đồng bộ từ `pending_changes.reviewer_emails` vào bảng `employee_reviewers` (xoá các reviewer cũ và insert các reviewer mới). Hàm SQL phải kiểm tra sự tồn tại của key `reviewer_emails` trong pending JSON (`v_emp_pending ? 'reviewer_emails'`), chỉ đồng bộ khi key này thực sự tồn tại, tránh xóa nhầm dữ liệu người nghiệm thu khi submit các thay đổi không liên quan. <!-- Sửa theo EFR-21 -->
- Tạo endpoint mới `GET /api/employees/reviewer-options` hỗ trợ autocomplete email cho SA/EA: <!-- Sửa theo EFR-17: Bảo vệ endpoint bằng role check và chặn leak toàn hệ thống khi query ngắn -->
  - Chỉ cho phép Super Admin (`permission.is_superadmin`) hoặc người có ít nhất một quyền `EA` trong hệ thống (`permission.permissions.some(p => p.permission_level === 'EA')`) truy cập. Các role khác (VI/VA/reviewer/nhân viên) bị chặn bằng lỗi `403 Forbidden`.
  - Yêu cầu query string `q.trim().length >= 2` để tránh dump toàn bộ danh sách khi `q` trống hoặc quá ngắn. Trả về mảng rỗng `[]` khi `q` không hợp lệ.
- Cập nhật Frontend UI `EmployeeForm.tsx`:
  - Thêm trường "Người nghiệm thu" sử dụng Select mode "multiple", hiển thị gợi ý email từ endpoint `/api/employees/reviewer-options`.
  - Phân quyền chỉ cho phép SA/EA cùng khối chỉnh sửa trường này (disable đối với các role khác).
- Cập nhật Frontend UI `EmployeeEditPage.tsx` và hook submit:
  - Tách trường `reviewer_emails` khỏi luồng live update thông thường để gửi qua endpoint pending (`personnel-pending`) khi sửa hồ sơ (đối với chế độ không điều chuyển - non-transfer).

### Out of scope
- Sửa đổi trực tiếp bảng `employee_reviewers` qua các route ngoài tầm kiểm soát của hồ sơ nhân sự (Tab quản trị ReviewerManagement giữ nguyên).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Khớp nối dữ liệu qua email dạng lowercase và trim() trước khi lưu.
  - Đảm bảo tính Atomic trong giao dịch DB (sử dụng migration cập nhật RPC `submit_employee_pending`).
- **"Cấm kỵ" cần tránh:**
  - Không nhầm lẫn với trường `nguoi_nghiem_thu_thu_viec` (trường text trên bảng `employees`).

## 4. Giả định và câu hỏi mở

### Giả định
- Quyền gán Người nghiệm thu tại Form sẽ được mở rộng cho EA của Khối tương ứng (hiện tại admin dashboard chỉ cho SA). Điều này là hợp lý vì EA cần gán người nghiệm thu khi onboard nhân sự mới thuộc khối của mình.
- Định dạng danh sách email truyền lên từ UI là một mảng `string[]`. Nếu trống, tức là xoá tất cả người nghiệm thu hiện có của nhân sự đó.

## 5. Quyết định đã chốt
- Tên trường trên UI: **Người nghiệm thu** (gợi ý email từ danh sách user hệ thống qua endpoint reviewer-options).
- Key truyền trong payload API: `reviewer_emails`.
- Cơ chế Phòng chờ: Khi sửa đổi trường này qua màn hình Sửa hồ sơ, thông tin sẽ được lưu nháp dưới dạng mảng JSONB trong `pending_changes.reviewer_emails` của bảng `employees`.
- Khi Duyệt (Submit): Database function `submit_employee_pending` chịu trách nhiệm đồng bộ thay đổi vào bảng `employee_reviewers` trong cùng một transaction.

## 6. Acceptance Criteria

- [ ] Schema `CreateEmployeeInput` và `UpdateEmployeeInput` chấp nhận trường `reviewer_emails` dạng `z.array(z.string().email()).optional()`.
- [ ] API `GET /api/employees/:id` trả về thêm trường `reviewer_emails` chứa danh sách email người nghiệm thu hiện tại.
- [ ] Màn hình Thêm mới nhân sự lưu thành công danh sách Người nghiệm thu vào bảng `employee_reviewers`.
- [ ] Màn hình Sửa hồ sơ (chế độ thường) lưu nháp thay đổi Người nghiệm thu vào `pending_changes.reviewer_emails`, không ghi trực tiếp (live update) vào database.
- [ ] Khi duyệt hồ sơ (Submit), danh sách người nghiệm thu trong bảng `employee_reviewers` được cập nhật chính xác theo giá trị pending mới. Tiến trình kiểm tra trước khi submit (pre-check) phải tính toán theo mảng người nghiệm thu "effective" (ưu tiên pending trước, rồi mới tới live) để tránh việc block không đáng có hoặc bypass không hợp lệ. Đồng thời việc submit các thay đổi không liên quan sẽ giữ nguyên danh sách người nghiệm thu cũ. <!-- Sửa theo EFR-20 & EFR-21 -->
- [ ] Trường "Người nghiệm thu" trên Form chỉ cho phép SA và EA cùng khối của nhân sự chỉnh sửa (các role khác bị disable).
- [ ] Route `GET /api/employees/reviewer-options` hoạt động cho SA/EA mà không bị chặn bởi quyền Super Admin, từ chối các role khác (VI/VA/reviewer) bằng lỗi `403 Forbidden`, và trả về mảng rỗng `[]` khi query string `q` có độ dài nhỏ hơn 2 ký tự. <!-- Sửa theo EFR-17 -->

## 7. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `packages/shared/src/schemas/employee.ts` | Sửa | Định nghĩa trường `reviewer_emails` trong schemas | 🟢 Thấp | Có |
| `backend/src/routes/employees.ts` | Sửa | Thêm endpoint `/reviewer-options` và xử lý filter payload | 🟢 Thấp | Có |
| `backend/src/services/employeeService.ts` | Sửa | Load `reviewer_emails` khi fetch detail; Gán reviewers khi create; Cho phép qua pending; Áp dụng field-level guard | 🟢 Thấp | Không |
| `database/migrations/[next_num]_add_reviewer_form_integration.sql` | Tạo mới | Cập nhật DB RPC `submit_employee_pending` để xử lý reviewers từ pending_changes | 🟡 Trung bình | Có |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Thêm Select Input hiển thị danh sách email cho trường Người nghiệm thu | 🟢 Thấp | Có |
| `frontend/src/pages/Employees/EmployeeEditPage.tsx` | Sửa | Điều chỉnh submit flow để đưa `reviewer_emails` qua luồng pending thay vì live update | 🟢 Thấp | Không |

## 8. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo hàm migration cập nhật SQL `submit_employee_pending` chạy trơn tru, xử lý an toàn kiểu dữ liệu JSONB sang mảng text trong Postgres (`jsonb_array_elements_text`).

## 9. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1: Database & Backend & Shared Schema Update**
    - Tạo database migration cập nhật RPC `submit_employee_pending`.
    - Cập nhật `@vcc/shared` schema và rebuild.
    - Sửa backend `employeeService.ts` để load/save/pending trường `reviewer_emails`.
  - **Phase 2: Frontend Integration**
    - Tích hợp trường `reviewer_emails` vào `EmployeeForm.tsx` sử dụng endpoint autocomplete mới.
    - Điều chỉnh submit flow trên `EmployeeEditPage.tsx` để lưu pending chính xác.

## 10. Test Strategy

- **Automated tests:** Bổ sung unit/integration test trong backend để test luồng thêm/sửa reviewer thông qua form/pending.
- **Manual verification:** Kiểm tra trên giao diện dev.

## 11. Rollback Plan

- Revert file thay đổi và chạy script sql để khôi phục định nghĩa cũ của hàm `submit_employee_pending`.

## 12. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
