# Feature Tasks: Hiển thị Tab Lịch sử thay đổi nhân sự

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-06

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Shared & Hooks Preparation

**Mục tiêu:** Chuẩn bị các kiểu dữ liệu và hook cần thiết để fetch dữ liệu từ backend.

- [x] Task 1.1: Định nghĩa interface `ChangeHistoryEntry` và `ChangeHistoryResponse` trong `packages/shared/src/types/api.ts`.
- [x] Task 1.2: Build lại package `@vcc/shared` để frontend nhận type mới.
- [x] Task 1.3: Thêm hook `useChangeHistory` vào `frontend/src/hooks/useEmployees.ts`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra hook gọi API thành công với mã NS có sẵn).

## Phase 2: UI Components Development

**Mục tiêu:** Xây dựng component hiển thị lịch sử và tích hợp vào trang chi tiết.

- [x] Task 2.1: Tạo component `ChangeHistoryTab.tsx` sử dụng Ant Design `Table`.
- [x] Task 2.2: Phân tách giao diện lịch sử thành 2 phần: Lịch sử Lương và Lịch sử Hồ sơ (sử dụng lọc theo `isSalaryField`).
- [x] Task 2.3: Implement logic mapping labels cho các trường dữ liệu và format dữ liệu (Ngày tháng, Tiền tệ).
- [x] Task 2.4: Cập nhật `EmployeeDetailPage.tsx` để hỗ trợ `Tabs` thay vì render trực tiếp nội dung.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra UI hiển thị đúng dữ liệu mock và layout responsive).

## Phase 2.B: Document Linking Implementation

**Mục tiêu:** Liên kết giấy tờ đính kèm vào từng dòng lịch sử thay đổi.

- [x] Task 2.5: Chạy migration `023_add_document_link_to_history.sql` để thêm cột `document_id` và cập nhật RPC.
- [x] Task 2.6: Cập nhật Backend Service (`employeeService`, `salaryService`) để truyền `temp_uuid` khi submit.
- [x] Task 2.7: Cập nhật UI `ChangeHistoryTab.tsx` thêm cột "Giấy tờ" và logic tải file.

## Phase 3: Integration & Security Verification

**Mục tiêu:** Kiểm tra tích hợp cuối cùng và đảm bảo phân quyền hoạt động đúng.

- [x] Task 3.1: Kiểm tra phân trang (Pagination) và loading state.
- [x] Task 3.2: Kiểm tra bảo mật: Đăng nhập tài khoản Viewer (VI) để đảm bảo KHÔNG thấy lịch sử chi tiết lương (số tiền, bậc lương) nhưng VẪN THẤY lịch sử thay đổi của "Ngày điều chỉnh lương".
- [x] Task 3.3: Kiểm tra hiển thị khi nhân sự không có lịch sử thay đổi (Empty state).
- [x] Task 3.Final: 🧪 Final End-to-End Verification.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-06 | - | - | Khởi tạo danh sách task | done | |
| 2026-05-06 10:28 | Phase 1 | Task 1.1 | Bắt đầu định nghĩa types | start | |
| 2026-05-06 10:33 | Phase 1 | Task 1.Final | Hoàn thành Phase 1, API trả về 200 | done | |
| 2026-05-06 10:34 | Phase 2 | Task 2.1 | Bắt đầu tạo component ChangeHistoryTab | start | |
| 2026-05-06 10:36 | Phase 2 | Task 2.Final | Hoàn thành Phase 2, UI đã chuyển sang Tabs | done | |
| 2026-05-06 10:37 | Phase 3 | Task 3.1 | Bắt đầu kiểm tra tích hợp & bảo mật | start | |

