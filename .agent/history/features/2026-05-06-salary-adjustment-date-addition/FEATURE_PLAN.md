# Feature Plan: Bổ sung Ngày điều chỉnh vào Form Lương

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: Bắt buộc review trước khi thực thi (liên quan đến SQL Function và atomic transaction)
> **Feature slug**: salary-adjustment-date-addition
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, khi điều chỉnh lương cho nhân sự, người dùng không thể nhập "Ngày điều chỉnh" (adjustment date) trực tiếp trong form lương.
- **Vấn đề cần giải quyết:** Trường `ngay_dieu_chinh_luong` nằm ở bảng `employees` nhưng bị chặn cập nhật qua luồng Hồ sơ. Luồng Lương (Phase 3) hiện chỉ xử lý dữ liệu trong bảng `salaries`.
- **Mục tiêu:** Cho phép người dùng nhập Ngày điều chỉnh lương ngay trong Form Lương, lưu nháp vào `pending_changes` và tự động áp dụng vào hồ sơ gốc khi Duyệt.
- **Kết quả mong đợi:** 
    - UI Form Lương có thêm ô chọn Ngày điều chỉnh.
    - Dữ liệu ngày này được lưu vào `salaries.pending_changes`.
    - Khi bấm Duyệt (Submit), `ngay_dieu_chinh_luong` được cập nhật vào bảng `employees`.

## 2. Phạm vi

### In scope
- Cập nhật UI `SalaryEditModal.tsx` để hiển thị `DatePicker` tại vị trí trực quan (cạnh phần Upload minh chứng).
- Cập nhật SQL Function `submit_employee_pending` để bóc tách `ngay_dieu_chinh_luong` khỏi payload lương và cập nhật vào bảng `employees` với kiểu dữ liệu `DATE`.
- Đảm bảo `ngay_dieu_chinh_luong` được xử lý riêng biệt, không nằm trong các vòng lặp xử lý số (numeric loops) tại Frontend và Backend.

### Out of scope
- Cập nhật các trường ngày khác không liên quan đến lương.
- Thay đổi cấu trúc bảng vật lý.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
    - [2026-04-07] Salary Pending Isolation: Dữ liệu nháp lương tách khỏi hồ sơ.
    - [2026-04-01] Salary Data Isolation: Chặn cập nhật lương qua luồng hồ sơ.
- **"Cấm kỵ" cần tránh:** Tuyệt đối không cho phép cập nhật `ngay_dieu_chinh_luong` qua luồng `updateEmployee` thông thường để tránh bypass audit trail của lương.
- **Ràng buộc kiến trúc liên quan:** Phải đảm bảo tính Atomic trong SQL Function `submit_employee_pending`.

## 4. Giả định và câu hỏi mở

### Giả định
- `ngay_dieu_chinh_luong` sẽ được lưu tạm trong JSON `salaries.pending_changes` cùng với các trường lương khác.

### Câu hỏi mở
- [Non-blocking] Có cần hiển thị lịch sử thay đổi của ngày này trong tab Lịch sử không? (Giả định: Có, vì nó nằm trong luồng `submit_employee_pending` đã có ghi history).

## 5. Acceptance Criteria

- [ ] Form "Cập nhật lương" hiển thị trường "Ngày điều chỉnh" dưới dạng DatePicker.
- [ ] Khi lưu nháp, trường `ngay_dieu_chinh_luong` xuất hiện trong `salaries.pending_changes` (DB).
- [ ] Khi Duyệt (Submit), giá trị ngày này được cập nhật vào cột `ngay_dieu_chinh_luong` của bảng `employees`.
- [ ] Logic tính toán Target (GT/CC) không bị ảnh hưởng bởi trường mới này.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `packages/shared/src/constants/salary-fields.ts` | Không sửa | **KHÔNG** thêm vào `SALARY_FIELDS` để tránh hỏng các loop render số. | 🟢 Thấp | Có |
| `packages/shared/src/schemas/salary.ts` | Sửa | Thêm `ngay_dieu_chinh_luong` vào Zod schema (salarySchema). | 🟢 Thấp | Có |
| `frontend/src/pages/Salaries/SalaryEditModal.tsx` | Sửa | Thêm UI label và DatePicker field (xử lý thủ công, không dùng loop). | 🟢 Thấp | Có |
| `database/migrations/xxx_update_submit_pending_for_adj_date.sql` | Tạo | Cập nhật SQL Function xử lý atomic submit (bóc tách JSON & ép kiểu DATE). | 🔴 Cao | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Bắt buộc)
- **Risk hotspots:** SQL Function `submit_employee_pending`. Cần xử lý bóc tách JSON key và tránh ép kiểu `NUMERIC` cho trường ngày tháng.
- **Review focus areas:** 
    - Cách SQL Function bóc tách `ngay_dieu_chinh_luong` từ JSON lương để map sang bảng nhân sự.
    - Đảm bảo loop render số tại FE không bị ảnh hưởng (FR-01).
    - Vị trí hiển thị UX (cạnh phần Upload) để tránh nhầm lẫn (FR-03).
- **Known pitfalls / historical issues:** Trùng lặp logic cập nhật ngày nếu người dùng vừa sửa hồ sơ vừa sửa lương (Isolation giúp tránh việc này).
- **Dependencies / rollout concerns:** Cần chạy migration SQL trước khi deploy code FE/BE.

## 8. Chiến lược triển khai

- **Phase strategy:** 3 Phase
    - Phase 1: Chuẩn bị Shared & Backend contract.
    - Phase 2: Triển khai Database layer (SQL Migration).
    - Phase 3: Hoàn thiện UI Frontend.
- **Thứ tự triển khai:** Shared -> DB -> BE -> FE.
- **Yêu cầu migration / config / deploy:** Cần migration SQL function.

## 9. Test Strategy

- **Automated tests:** Kiểm tra Zod schema validation với trường ngày mới.
- **Manual verification:**
    - Lưu nháp ngày điều chỉnh -> Reload -> Kiểm tra dữ liệu cũ vẫn còn.
    - Duyệt lương -> Kiểm tra bảng `employees` đã cập nhật ngày mới.
    - Kiểm tra `change_history` có ghi nhận thay đổi của ngày này.

## 10. Rollback Plan

- Rollback SQL function về version cũ (Migration 021).
- Revert code FE/BE/Shared.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
