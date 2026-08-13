# Feature Tasks: Pending Room Logic Alignment & Refactor

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-04

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Centralized Logic & Utilities

**Mục tiêu:** Di chuyển các logic tính toán phân loại ra khỏi UI components.

- [x] Task 1.1: **Tạo `frontend/src/utils/employeeUtils.ts`**
  - Khai báo hàm `isNewHire(record: EmployeeListItem): boolean`
  - Khai báo hàm `hasPendingInfo(record: EmployeeListItem): boolean`
  - Khai báo hàm `hasPendingSalary(record: EmployeeListItem): boolean`
  - (Tùy chọn) Khai báo hàm `getEmployeeFlowType(record: EmployeeListItem): 'new_hire' | 'adjustment' | 'all'`
- [x] Task 1.2: **Tích hợp Utils vào `PendingRoomPage.tsx`**
  - Import Utils mới.
  - Thay thế các đoạn code check logic bằng hàm từ Utils.
- [x] Task 1.3: **Tích hợp Utils vào `EmployeeTable.tsx`**
  - Tương tự Task 1.2.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - [x] Kiểm tra xem các components có bị lỗi compile không.
  - [x] Kiểm tra logic nhận diện còn đúng như trước không.

## Phase 2: UI Icons & Tooltips Update

**Mục tiêu:** Cập nhật bộ icon và tooltip theo yêu cầu mới của User.

- [x] Task 2.1: **Cập nhật Icon "Nhân sự mới"**
  - Chuyển sang Tag màu đỏ chữ "NEW" (như đã làm ở phiên trước nhưng chuẩn hóa lại margin/padding).
- [x] Task 2.2: **Cập nhật Icon "Sửa hồ sơ"**
  - Chuyển từ `FileTextOutlined` sang `InfoCircleOutlined` (màu xanh dương).
- [x] Task 2.3: **Thêm/Cập nhật Tooltips rõ nghĩa**
  - NEW -> "Nhân sự mới (Chưa cấp mã chính thức)"
  - Info -> "Điều chỉnh thông tin hồ sơ"
  - $ -> "Điều chỉnh lương & cơ chế"
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - [x] Hover vào từng icon xem tooltip có đúng không.
  - [x] Kiểm tra màu sắc và kích thước icon đồng nhất.

## Phase 3: Cleanup & Refinement

**Mục tiêu:** Loại bỏ code thừa, trùng lặp và rườm rà.

- [x] Task 3.1: **Dọn dẹp `EmployeeTable.tsx`**
  - Loại bỏ các biến cục bộ lặp lại logic check.
  - Tối ưu hóa render phần icons.
- [x] Task 3.2: **Dọn dẹp `PendingRoomPage.tsx`**
  - Tương tự Task 3.1.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)
  - [x] Kiểm tra toàn bộ màn hình Phòng chờ và Danh sách nhân sự.
  - [x] Đảm bảo không còn log warning liên quan đến render.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-04 17:35 | | | Lập kế hoạch hoàn tất | done | |
| 2026-05-04 17:40 | 1 | 1.1-1.3 | Hoàn thành refactor logic sang Utilities | done | |
| 2026-05-04 17:42 | 2 | 2.1-2.3 | Cập nhật Icons và Tooltips | done | |
| 2026-05-04 17:45 | 3 | 3.1-3.2 | Dọn dẹp code rườm rà và tối ưu render | done | |
| 2026-05-04 17:50 | | | Hoàn thành toàn bộ feature | done | |
