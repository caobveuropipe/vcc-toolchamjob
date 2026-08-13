# Feature Tasks: Điều chuyển bổ nhiệm

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-06
> **Ngày cập nhật**: 2026-05-07

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Infrastructure & Merge Logic (DB & Backend)

**Mục tiêu:** Cung cấp API và RPC hỗ trợ lưu thay đổi personnel có tính đến dữ liệu nháp cũ.

- [x] Task 1.1: Tạo migration `025_save_personnel_pending_rpc.sql` định nghĩa RPC `save_personnel_pending` với logic `jsonb_concat` (merge) để bảo toàn bản nháp cũ.
- [x] Task 1.2: Cập nhật `backend/src/services/employeeService.ts` thêm hàm `savePersonnelToPending`.
- [x] Task 1.3: Cập nhật `backend/src/routes/employees.ts` thêm endpoint `PUT /api/employees/:id/personnel-pending`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Giả lập nhân sự có sẵn pending -> Gọi API mới -> Kiểm tra DB xem dữ liệu mới có được merge vào dữ liệu cũ không.

## Phase 2: UI Refactoring & Redirect Logic (Frontend)

**Mục tiêu:** Tái sử dụng `EmployeeForm` cho luồng điều chuyển và xử lý điều hướng an toàn.

- [x] Task 2.1: Cập nhật `frontend/src/services/employeeService.ts` thêm method `savePersonnelPending`.
- [x] Task 2.2: Refactor `frontend/src/components/EmployeeForm.tsx`:
    - Thêm prop `mode="transfer"`.
    - Ở mode `transfer`: Enable các trường Salary, focus/highlight vùng Org & Salary, ẩn/read-only vùng cá nhân.
- [x] Task 2.3: Cập nhật `EmployeeDetailPage.tsx`:
    - Thêm nút "Điều chuyển bổ nhiệm".
    - Thêm logic kiểm tra: Nếu `state_phong_cho = true`, hiển thị Modal cảnh báo trước khi cho phép đi tiếp.
- [x] Task 2.4: Tích hợp logic "Lưu nháp" trong `EmployeeForm` (Transfer mode):
    - Tách payload gửi sang `personnel-pending`.
    - Bind `temp_uuid` cho tài liệu quyết định.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Thực hiện điều chuyển từ UI, kiểm tra tính tiện dụng (highlight card) và tính đúng đắn của dữ liệu nháp.

## Phase 3: Validation & Integration

**Mục tiêu:** Hoàn thiện luồng duyệt và cảnh báo Reviewer.

- [x] Task 3.1: Thêm component cảnh báo "Reviewer Mismatch" trong `ReviewerCard` (EmployeeDetailPage).
- [x] Task 3.2: Kiểm tra logic `submit_employee_pending` RPC đảm bảo nó apply đúng các trường organization và gắn đúng `document_id`.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3: Duyệt hồ sơ điều chuyển và kiểm tra `change_history` + live data + document link.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-05-06 16:15] | [Phase 0] | [Plan] | Khởi tạo Plan & Tasks | done | |
| [2026-05-07 10:28] | [Phase 0] | [Plan] | Cập nhật theo Feedback Review (FR-01, FR-02) | done | Chuyển sang reuse Form |
| [2026-05-07 10:51] | [Phase 1] | [1.1] | Bắt đầu tạo migration RPC save_personnel_pending | done | đổi tên thành 025 |
| [2026-05-07 10:52] | [Phase 1] | [1.2] | Thêm hàm savePersonnelToPending vào employeeService | done | |
| [2026-05-07 10:53] | [Phase 1] | [1.Final] | Self-test logic merge và security | done | |
| [2026-05-07 10:53] | [Phase 2] | [2.1-2.4] | Hoàn thành refactor Form, Detail, Edit và Hook | done | |
| [2026-05-07 11:05] | [Phase 2] | [2.Final] | Self-test logic điều chuyển và bind document | done | |
| [2026-05-07 11:15] | [Phase 3] | [3.1] | Thêm check Reviewer Mismatch dựa trên dữ liệu pending | done | |
| [2026-05-07 11:20] | [Phase 3] | [3.2] | Sửa lỗi bind document cho Personnel và Salary pending | done | |
| [2026-05-07 11:25] | [Phase 3] | [3.Final] | Verify toàn bộ luồng điều chuyển | done | |
