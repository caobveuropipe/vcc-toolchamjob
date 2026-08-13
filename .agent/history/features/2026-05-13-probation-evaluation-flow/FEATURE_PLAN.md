# Feature Plan: Luồng đánh giá thử việc (WF-EMP-08)

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: [Khuyến nghị gọi `feature-review` do chạm vào logic tiền lương và atomic transaction]
> **Feature slug**: probation-evaluation-flow
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-08

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống chưa có luồng chính thức để chuyển nhân sự từ trạng thái "Thử việc" sang "Đang làm" (Chính thức) kèm theo việc cập nhật bộ lương mới và đính kèm biên bản đánh giá.
- **Vấn đề cần giải quyết:** Nhân sự thử việc khi đạt yêu cầu cần được chuyển trạng thái và cập nhật lương chính thức trong một thao tác duy nhất, đồng thời phải đi qua "Phòng chờ" để đảm bảo tính kiểm soát (audit trail).
- **Mục tiêu:** Cung cấp giao diện và API cho phép EA/SA thực hiện đánh giá thử việc, nhập lương mới, upload file và đẩy vào trạng thái chờ duyệt.
- **Kết quả mong đợi:** 
    - Nút "Đánh giá thử việc" xuất hiện cho nhân sự `thu_viec`.
    - Form nhập liệu cho phép: Nhận xét, Upload file, Nhập lương mới (tất cả các trường lương).
    - Dữ liệu được lưu vào `pending_changes` của cả Employee và Salary.
    - Trạng thái `state_phong_cho` chuyển thành `true`.
    - Sau khi "Duyệt hồ sơ" (Submit), nhân sự chuyển sang `dang_lam`, lương được cập nhật, và `state_phong_cho` về `false`.

## 2. Phạm vi

### In scope
- Xây dựng Zod schema cho input đánh giá thử việc.
- API endpoint `PUT /api/employees/:id/evaluate-probation` để lưu dữ liệu vào phòng chờ.
- UI Modal `ProbationEvaluationModal` tích hợp form thông tin nhân sự và form lương (reusable components).
- Logic bind tài liệu đánh giá vào `employee_documents` với type `danh_gia_thu_viec`.
- Đảm bảo tính Atomic khi Submit (thừa kế RPC `submit_employee_pending`).

### Out of scope
- Tự động nhắc nhở khi hết hạn thử việc (sẽ làm ở feature sau).
- OCR cho biên bản đánh giá (không bắt buộc theo business flow).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
    - [2026-04-01] Salary Data Isolation: Lương không được sửa qua luồng hồ sơ thông thường, nhưng ở đây là luồng đánh giá thử việc (đặc thù) nên sẽ dùng cơ chế `pending_changes` riêng biệt cho lương.
    - [2026-04-07] Atomic Submit RPC: Sử dụng `submit_employee_pending` để chốt dữ liệu.
    - [2026-05-04] TMP-based identification: Giữ nguyên logic cho nhân sự mới nếu vẫn đang ở `TMP`.
- **"Cấm kỵ" cần tránh:**
    - Không được cập nhật trực tiếp `salaries` mà không qua `pending_changes` khi đang trong luồng đánh giá.
    - Không được bypass RLS.
- **Ràng buộc kiến trúc liên quan:** 
    - Phải sử dụng `employee_info_only` view cho các role không phải SA/EA.

## 4. Giả định và câu hỏi mở

### Giả định
- User thực hiện đánh giá thử việc sẽ nhập đầy đủ bộ lương chính thức (nếu có thay đổi). Nếu không nhập, lương cũ (thử việc) sẽ được giữ nguyên hoặc để trống tùy user.
- File đánh giá là tùy chọn (optional) nhưng khuyến nghị.

### Câu hỏi mở
- [Non-blocking] Có cần khóa các trường thông tin cá nhân khác trong lúc đánh giá thử việc không? (Tạm thời cho phép sửa cả thông tin khác nếu cần).

## 5. Acceptance Criteria

- [ ] Nút "Đánh giá thử việc" chỉ hiển thị cho nhân sự có `trang_thai = 'thu_viec'`.
- [ ] Form hiển thị đầy đủ các trường lương (Giấy tờ & Cơ chế).
- [ ] Cho phép upload file và lưu với `document_type = 'danh_gia_thu_viec'`.
- [ ] Khi bấm "Lưu đánh giá", nhân sự chuyển sang `state_phong_cho = true`.
- [ ] Dữ liệu lương mới nằm trong `salaries.pending_changes`.
- [ ] Trạng thái mới (`dang_lam`) nằm trong `employees.pending_changes` (hoặc xử lý đặc biệt tại API).
- [ ] Sau khi Submit thành công: `trang_thai` cập nhật thành `dang_lam`, lương thực tế được cập nhật, file được bind vào nhân sự.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `packages/shared/src/schemas/employee.ts` | Sửa | Thêm `probationEvaluationSchema` | 🟢 | Có |
| `backend/src/routes/employees.ts` | Sửa | Thêm route `/evaluate-probation` | 🟡 | Có |
| `backend/src/services/employeeService.ts` | Sửa | Thêm logic lưu evaluation vào pending | 🟡 | Có |
| `frontend/src/pages/Employees/components/ProbationEvaluationModal.tsx` | Tạo mới | UI cho việc đánh giá | 🟢 | Chưa |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Sửa | Thêm nút mở Modal | 🟢 | Có |
| `frontend/src/components/EmployeeTable.tsx` | Sửa | Thêm action evaluation | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
    - Đảm bảo tính nhất quán giữa `employees.pending_changes` và `salaries.pending_changes`.
    - Logic Submit RPC (`submit_employee_pending`) có cần điều chỉnh để handle việc chuyển trạng thái từ `pending_changes` hay không.
- **Review focus areas:**
    - API security: EA/SA access check.
    - Data integrity: Đảm bảo không mất dữ liệu lương cũ nếu evaluation bị hủy/reject.
- **Known pitfalls:** Việc lưu `trang_thai` mới vào `pending_changes` cần được API Submit xử lý đúng (vì hiện tại Submit thường chỉ apply field-by-field).

## 8. Chiến lược triển khai

- **Phase strategy:** 
    - Phase 1: Shared schema & Backend API (Lưu vào pending).
    - Phase 2: Frontend UI (Modal & Integration).
    - Phase 3: Submit logic verification & Bug fix.
- **Thứ tự triển khai:** Backend -> Frontend.
- **Yêu cầu migration:** Không (Schema hiện tại đã đủ).

## 9. Test Strategy

- **Automated tests:** Integration test cho API `/evaluate-probation` (check pending data).
- **Manual verification:** 
    - Tạo NS thử việc -> Đánh giá -> Kiểm tra phòng chờ -> Submit -> Kiểm tra trạng thái & lương.
- **Data chuẩn bị:** Cần 1 account EA và 1 NS đang `thu_viec`.

## 10. Rollback Plan

- Xóa các pending changes trong DB và revert code FE/BE.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
