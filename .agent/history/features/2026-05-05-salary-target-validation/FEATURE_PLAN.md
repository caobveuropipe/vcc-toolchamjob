# Feature Plan: Salary Target Validation & Formula Enforcement

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` để đảm bảo logic công thức chính xác 100% trước khi enforce.
> **Feature slug**: salary-target-validation
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-04

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống cho phép nhập tự do các trường Target (GT) và Target (CC) mà không kiểm tra tính nhất quán với các thành phần cấu thành.
- **Vấn đề cần giải quyết:** 
  - Sai lệch dữ liệu giữa Target và các khoản cộng lại.
  - Thiếu cơ chế lưu ghi chú/trạng thái việc Target (CC) có bao gồm phụ cấp Kiêm nhiệm (KN M1) hay không.
- **Mục tiêu:** 
  - Enforce công thức tính Target cho cả "Bộ Giấy tờ" và "Bộ Cơ chế".
  - Chặn hành động Lưu (Save to Pending) và Submit (Duyệt) nếu dữ liệu không khớp.
  - Lưu trữ trạng thái checkbox "Bao gồm KN M1" để tái sử dụng.
- **Kết quả mong đợi:** Người dùng không thể lưu hoặc submit nếu tổng các thành phần khác với Target đã nhập, kèm thông báo lỗi chi tiết.

## 2. Phạm vi

### In scope
- Cập nhật database schema để lưu trạng thái checkbox.
- Cập nhật Zod schema chung cho Salary.
- Triển khai logic validation tập trung tại `@vcc/shared`.
- Cập nhật UI `SalaryEditModal` để thêm checkbox và validate khi bấm Lưu.
- Cập nhật logic `checkSubmitReadiness` tại `PendingRoomPage` để chặn Submit.
- Hiển thị cảnh báo (Warning) chi tiết cho người dùng.

### Out of scope
- Tự động tính toán lại Target khi thay đổi các thành phần (User yêu cầu nhập và check, không yêu cầu auto-calc).
- Thay đổi logic tính toán cho các tháng cũ đã chốt.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Sử dụng Zod schema làm single source of truth cho cả FE và BE validation.
  - Duy trì triết lý "Perfect over Speed" trong việc chuẩn hóa dữ liệu.
- **"Cấm kỵ" cần tránh:** 
  - Không được phá vỡ cấu trúc isolation giữa Salary và Employee.
  - Tuyệt đối không dùng Tailwind cho UI (Ant Design v6 rules).
- **Ràng buộc kiến trúc liên quan:** 
  - Mọi thay đổi schema bảng `salaries` phải được phản ánh vào `snapshot_employees`.

## 4. Giả định và câu hỏi mở

### Giả định
- Công thức cho Target (GT) là cố định và không có ngoại lệ checkbox.
- Tên checkbox đề xuất: "Target (CC) bao gồm KN M1".
- Trường lưu checkbox trong DB: `is_target_cc_include_kn_m1` (boolean).

### Câu hỏi mở
- [Non-blocking] Có cần auto-calculate giá trị Target khi người dùng nhập các thành phần không? (Hiện tại plan là chỉ validate khi Save/Submit theo yêu cầu).
- [Non-blocking] Nếu checkbox được tick, liệu nó có ảnh hưởng đến việc hiển thị Target (CC) ở các báo cáo khác không?

## 5. Acceptance Criteria

- [ ] Người dùng tick được checkbox "Bao gồm KN M1" trong modal sửa lương.
- [ ] Khi bấm Lưu trong `SalaryEditModal`, nếu `Target (GT) != sum(các thành phần GT)`, hiện cảnh báo và không đóng modal.
- [ ] Khi bấm Lưu trong `SalaryEditModal`, nếu `Target (CC) != sum(các thành phần CC (+ KN M1 nếu tick))`, hiện cảnh báo và không đóng modal.
- [ ] Trạng thái checkbox được lưu vào DB và hiển thị đúng khi mở lại modal.
- [ ] Nút Submit tại Phòng chờ (Pending Room) bị disable hoặc hiện tooltip cảnh báo lỗi nếu công thức lương không khớp.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/001_schema.sql` | Sửa | Thêm cột `is_target_cc_include_kn_m1` | 🟡 | Có |
| `packages/shared/src/schemas/salary.ts` | Sửa | Thêm field vào Zod schema | 🟢 | Có |
| `packages/shared/src/constants/salary-fields.ts` | Sửa | Thêm field vào danh sách salary fields | 🟢 | Có |
| `packages/shared/src/utils/salary-validation.ts` | Tạo mới | Centralized validation logic | 🟢 | Chưa |
| `frontend/src/pages/Salaries/SalaryEditModal.tsx` | Sửa | Thêm checkbox và logic validation khi Lưu | 🟡 | Có |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Cập nhật `checkSubmitReadiness` | 🟡 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Logic validation cần bao quát trường hợp NULL/undefined (coi như 0).
- **Review focus areas:** 
  - Công thức tính toán có khớp 100% với yêu cầu nghiệp vụ không?
  - Việc chặn Submit có ảnh hưởng đến các nhân sự cũ không có dữ liệu lương không?
- **Known pitfalls / historical issues:** Floating point precision (dùng `Math.round` hoặc `Number` chính xác).
- **Dependencies / rollout concerns:** Cần chạy migration DB trước khi deploy code mới.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: DB & Shared (Foundation).
  - Phase 2: Frontend Implementation (UI & Validation).
  - Phase 3: Integration & Final Test.
- **Thứ tự triển khai:** Shared -> DB -> Frontend.
- **Điểm cần phối hợp:** 
    - Cần đảm bảo backend (SQL RPC `submit_employee` hoặc `SalaryService`) thực hiện map trường `is_target_cc_include_kn_m1` từ `pending_changes` sang bảng `salaries` chính thức khi duyệt. (FR-01)
    - Trình tự triển khai: Shared (Build) -> Migrate DB -> Deploy Backend -> Deploy Frontend. (FR-03)

## 9. Test Strategy

- **Automated tests:** 
  - Unit test cho `validateSalaryTarget` trong `@vcc/shared`.
- **Manual verification:** 
  - Thử nhập sai lệch Target GT/CC và kiểm tra thông báo lỗi.
  - Thử tick/untick checkbox và kiểm tra tính đúng đắn của Target CC.
  - Kiểm tra tính bền vững của dữ liệu checkbox sau khi reload trang.
- **Data / env chuẩn bị trước khi test:** Nhân sự mẫu có dữ liệu lương đầy đủ.

## 10. Rollback Plan

- Xóa cột `is_target_cc_include_kn_m1` trong DB.
- Revert code FE và Shared về version cũ.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
## 12. Review Notes (Review ngày 2026-05-04)

- **FR-01**: Cần bổ sung task cập nhật backend mapping cho field mới. -> **Đã bổ sung vào Task 1.5**.
- **FR-02**: Chấp nhận Hard block để sạch dữ liệu, EA cần được thông báo về việc chuẩn hóa lương cho hồ sơ cũ.
- **FR-03**: Điều chỉnh trình tự triển khai trong task breakdown. -> **Đã cập nhật Phase 1 & 2**.
- **FR-04**: Thông báo lỗi nên hiển thị rõ delta (VD: "Tổng hiện tại (X) khác Target (Y). Chênh lệch: (Z)"). -> **Sẽ thực hiện tại Task 2.2**.
