# Test Cases: Lọc ẩn nhân sự phòng chờ chưa duyệt khỏi Danh sách nhân sự chính thức

> **Feature slug**: `filter-waiting-room-employees-list`
> **Ngày tạo**: 2026-07-24
> **Trạng thái**: ✅ Passed

---

## 1. Scope & Objective

- **Mục tiêu**: Đảm bảo nhân sự mới nháp (`ma_nhan_su` bắt đầu bằng `TMP` và `state_phong_cho = true`) bị loại bỏ hoàn toàn khỏi Danh sách nhân sự chính thức (`/employees`), Export Excel chính thức, và Autocomplete (`/api/employees/autocomplete`).
- **Ràng buộc**: Nhân sự cũ đang hoạt động có đề xuất điều chỉnh nháp (`state_phong_cho = true`, mã không phải `TMP`) VẪN HIỂN THỊ đầy đủ trên màn chính thức kèm các icon chỉ báo nháp.

---

## 2. Test Cases

### TC-01: Danh sách nhân sự chính thức (Main List)
- **Mô tả**: Khi truy cập `/employees` (mặc định không có parameter hoặc `exclude_pending_new_hires=true`).
- **Kỳ vọng**: 
  - 100% nhân sự có mã `TMP...` và `state_phong_cho = true` bị ẩn khỏi danh sách.
  - Không bị mất nhân sự chính thức.

### TC-02: Phòng chờ (Pending Room)
- **Mô tả**: Khi truy cập `/pending-room` (`state_phong_cho=true`).
- **Kỳ vọng**: 
  - Trả về 100% nhân sự phòng chờ chưa duyệt (bao gồm cả `TMP...` tuyển mới và nhân sự cũ điều chỉnh).

### TC-03: Khả năng hiển thị của Nhân sự cũ đang hoạt động có đợt điều chỉnh nháp
- **Mô tả**: Nhân sự cũ đã có mã chính thức (ví dụ `VCC001`) đang có đề xuất sửa thông tin/lương chưa duyệt (`state_phong_cho = true`).
- **Kỳ vọng**: 
  - Vẫn hiển thị bình thường trên màn Danh sách chính thức `/employees` và file Excel xuất ra.
  - Duy trì hiển thị các icon chỉ báo nháp (PDF đính kèm, $ điều chỉnh lương, Info sửa hồ sơ).

### TC-04: Autocomplete Nhân sự Selector Form
- **Mô tả**: Gọi API `/api/employees/autocomplete?q=...`.
- **Kỳ vọng**: 
  - Kết quả trả về tự động lọc bỏ các nhân sự mới nháp `TMP...`.

---

## 3. Automated Test Verification

- Integration Test File: `backend/src/__tests__/integration/employee.test.ts`
- Lệnh chạy: `npx vitest run --config vitest.integration.config.ts src/__tests__/integration/employee.test.ts`
- Kết quả: **19/19 tests passed**.
