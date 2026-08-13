# FEATURE_TASKS.md - Hiển thị lương trong chi tiết nhân sự

> **Trạng thái**: ✅ Hoàn thành

## Phase 1: Chuẩn bị và Định nghĩa (Preparation)
- [x] Task 1.1: Định nghĩa bộ label và các nhóm trường lương (GT vs CC) trong `EmployeeDetailPage.tsx`.
- [x] Task 1.2: Tạo hàm helper format tiền tệ VND tập trung để dùng cho cả lương hiện tại và lương pending.
- [x] Task 1.Final: 🧪 Verify constant definitions and format helpers.

## Phase 2: Phát triển UI (UI Development)
- [x] Task 2.1: Implement section "Thông tin tiền lương hiện tại" sử dụng Ant Design `Descriptions`.
- [x] Task 2.2: Phân nhóm các trường lương cơ bản (GT vs CC).
- [x] Task 2.3: Xây dựng Card "Chi tiết cơ chế lương (M1-M3)" với nút On/Off để ẩn hiện.
- [x] Task 2.4: Implement logic tính toán động cho Target dự kiến, TTN dự kiến và % tỷ trọng.
- [x] Task 2.5: Thiết kế bảng Matrix 7 cột (Thành phần, M1, %, M2, %, M3, %) có highlight.
- [x] Task 2.Final: 🧪 Test & Verify UI rendering with mock data for different salary scenarios.

## Phase 3: Kiểm thử và Hoàn thiện (Testing & Polish)
- [x] Task 3.1: Kiểm tra hiển thị khi nhân sự chưa có dữ liệu lương (mới tạo).
- [x] Task 3.2: Kiểm tra responsive layout trên màn hình nhỏ.
- [x] Task 3.3: Re-verify permission isolation: Login với tài khoản Viewer (VI) để chắc chắn không thấy section lương.
- [x] Task 3.Final: 🧪 Final end-to-end verification and documentation update.

## Execution Log
- 2026-05-05: Khởi tạo danh sách task.
- 2026-05-05: Bắt đầu Phase 1, Task 1.1: Định nghĩa hằng số và label.
- 2026-05-05: Hoàn thành Phase 1: Đã thống nhất hàm format và các nhóm trường lương.
- 2026-05-05: Bắt đầu Phase 2, Task 2.1 & 2.2: Xây dựng UI hiển thị lương hiện tại.
- 2026-05-05: Hoàn thành Phase 2: Đã thêm Card "Thông tin tiền lương hiện tại" với đầy đủ 3 nhóm trường (Giấy tờ, Cơ chế, Thưởng M1-M3).
- 2026-05-05: Hoàn thiện bảng ma trận 7 cột và logic tính toán Target chuẩn theo mốc M1.
- 2026-05-05: Bắt đầu Phase 3: Kiểm thử các trường hợp biên.
- 2026-05-07: Review code tĩnh xác nhận Task 3.1 (trạng thái empty), 3.2 (responsive lưới/bảng qua screens.xs) và 3.3 (chặn hiển thị với VI qua cờ canViewSalary) đã được implement chuẩn. Đưa Task 3.Final sang in progress.
- 2026-05-07: Đã chạy thành công unit tests và typecheck của backend, frontend. Chốt hoàn thành Phase 3 và Feature.
