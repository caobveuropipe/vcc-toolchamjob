# Feature Plan: Điều chuyển bổ nhiệm

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: Đã qua `feature-review` lần 1, đang cập nhật theo feedback (FR-01, FR-02). Khuyến nghị review lại phần logic gộp bản nháp.
> **Feature slug**: feature-05-dieu-chuyen-bo-nhiem
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-06
> **Ngày cập nhật**: 2026-05-07

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Theo tài liệu nghiệp vụ [WF-EMP-05](../../../docs/business-flows/05-dieu-chuyen-bo-nhiem.md), hệ thống cần hỗ trợ luồng thay đổi chức danh và tổ chức (Khối, BU, Phòng ban...) cho nhân sự.
- **Vấn đề cần giải quyết:** Hiện tại luồng sửa hồ sơ đang cập nhật trực tiếp. Nghiệp vụ mới yêu cầu mọi thay đổi liên quan đến tổ chức/chức danh (có kèm giấy tờ) phải đi qua **Phòng chờ** (`state_phong_cho = true`) và cho phép điều chỉnh lương đồng thời.
- **Mục tiêu:** Cung cấp giao diện "Điều chuyển bổ nhiệm" dựa trên việc tái sử dụng `EmployeeForm`, cho phép sửa thông tin tổ chức + lương, lưu vào `pending_changes` và submit atomic qua SQL RPC.
- **Kết quả mong đợi:** 
    - Nút "Điều chuyển bổ nhiệm" hoạt động trên UI.
    - Dữ liệu thay đổi được bảo lưu trong phòng chờ, không gây xung đột với bản nháp cũ.
    - Submit thành công cập nhật live data + ghi lịch sử + audit log + liên kết tài liệu.

## 2. Phạm vi

### In scope
- API: Endpoint lưu personnel pending cho existing employees.
- DB: SQL RPC `save_personnel_pending` (Cần hỗ trợ logic merge JSONB nếu đã có pending).
- UI: Refactor `EmployeeForm.tsx` thêm `mode="transfer"` để hiển thị các trường Tổ chức + Lương và ẩn bớt các trường không liên quan.
- Logic: Kiểm tra và cảnh báo nếu nhân sự đã có bản nháp trong phòng chờ (FR-01).
- UI: Cảnh báo Reviewer mismatch.

### Out of scope
- Sửa Reviewer tự động (Vẫn do SA làm tay theo BR-004-009).
- AI OCR tự động bóc tách (Người dùng nhập tay theo tài liệu 05).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
    - [2026-04-07] `Atomic Submit RPC`: Dùng `submit_employee_pending` để apply mọi thay đổi.
    - [2026-04-17] `Salary Pending Isolation`: Salary pending lưu tại `salaries.pending_changes`.
    - [2026-03-31] `Service-Layer Data Splitting`: Flatten dữ liệu Personnel và Salary trên UI Form.
- **"Cấm kỵ" cần tránh:** 
    - Không tạo file page mới nếu có thể tái sử dụng component hiện có để tránh nợ kỹ thuật (FR-02).
    - Không ghi đè mù quáng `pending_changes` nếu đang có dữ liệu nháp quan trọng.

## 4. Giả định và câu hỏi mở

### Giả định
- Việc điều chuyển luôn cần giấy tờ quyết định (Strongly Recommended).
- Khi ở mode điều chuyển, các trường thông tin cá nhân (Họ tên, ngày sinh...) sẽ ở chế độ Read-only hoặc ẩn đi để tối ưu UX.

### Câu hỏi mở
- [Non-blocking] Nếu user sửa lương ở luồng Điều chuyển, nó có ghi đè luồng "Điều chỉnh lương" (WF-03) đang chờ duyệt không? (Hiện tại: Cả hai đều ghi vào `salaries.pending_changes`, nên bản ghi sau sẽ ghi đè bản trước).

## 5. Acceptance Criteria

- [ ] [API] `PUT /api/employees/:id/personnel-pending` hỗ trợ merge logic: giữ lại các trường không trùng lặp trong `pending_changes`.
- [ ] [UI] Nút "Điều chuyển bổ nhiệm" xuất hiện ở trang chi tiết nhân sự.
- [ ] [UI] `EmployeeForm` hiển thị đúng các trường Tổ chức + Lương khi ở mode `transfer`, tự động scroll đến vùng Org.
- [ ] [Logic] Cảnh báo người dùng nếu nhân sự đang có bản nháp chưa duyệt trước khi bắt đầu điều chuyển.
- [ ] [Logic] Upload tài liệu quyết định thành công và bind được vào bản ghi trong phòng chờ.
- [ ] [Logic] Bấm "Duyệt" từ phòng chờ: Cập nhật live data thành công, ghi lịch sử thay đổi kèm liên kết `document_id`.
- [ ] [UI] Hiển thị cảnh báo "Reviewer Mismatch" nếu nhân sự chuyển sang khối khác.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/024_save_personnel_pending_rpc.sql` | Tạo | Thêm RPC lưu personnel pending với merge logic | 🟢 | Có |
| `backend/src/services/employeeService.ts` | Sửa | Thêm hàm `savePersonnelToPending` | 🟡 | Có |
| `backend/src/routes/employees.ts` | Sửa | Thêm route `/api/employees/:id/personnel-pending` | 🟡 | Có |
| `frontend/src/services/employeeService.ts` | Sửa | Thêm API call method | 🟢 | Có |
| `frontend/src/components/EmployeeForm.tsx` | Refactor | Thêm `mode="transfer"`, enable Salary fields, tối ưu hiển thị | 🔴 | Có |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Sửa | Thêm nút và logic kiểm tra Pending trước khi redirect | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Cần review kỹ việc refactor `EmployeeForm` để không làm hỏng mode `create/edit`).
- **Risk hotspots:**
    - `EmployeeForm` regression: Đảm bảo luồng Onboarding (WF-01) vẫn hoạt động bình thường sau khi refactor.
    - JSONB Merge logic: Đảm bảo không làm hỏng cấu trúc `{ "salary": { ... } }` bên trong `pending_changes`.
- **Review focus areas:**
    - Tính nguyên tử (Atomicity) khi lưu đồng thời Org và Salary pending qua 2 call API riêng.

## 8. Chiến lược triển khai

- **Phase strategy:** 
    - Phase 1: Infrastructure & Merge Logic (DB + Backend).
    - Phase 2: UI Refactoring & Redirect logic (Refactor EmployeeForm).
    - Phase 3: Validation & Integration (Pending room integration + Document binding).
- **Thứ tự triển khai:** DB -> Backend -> Frontend Refactor.

## 9. Test Strategy

- **Manual verification:**
    - Case 1: Đang có nháp sửa Email -> Bấm Điều chuyển -> Kiểm tra cảnh báo.
    - Case 2: Điều chuyển khối + Chỉnh lương -> Lưu nháp -> Kiểm tra DB xem có đủ cả 2 thay đổi không.
    - Case 3: Duyệt điều chuyển -> Kiểm tra History có gắn đúng Document ID không.

## 10. Rollback Plan

- Revert backend & frontend code.
- Xóa RPC `save_personnel_pending`.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
