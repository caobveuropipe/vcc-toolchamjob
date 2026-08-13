# Test Cases - Salary UX Fixes

> Tạo ngày: 2026-05-19
> Liên kết feature: `salary-ux-fixes`
> Phạm vi: Feature / Bug fix / Regression / UI-UX

---

## 1. Mục tiêu kiểm thử

- Đảm bảo cơ chế hiển thị cảnh báo thiếu tài liệu minh chứng và ngày điều chỉnh trùng khớp hoạt động đúng thông qua một dialog xác nhận tổng hợp.
- Đảm bảo cơ chế chống double-submit và try/finally bảo vệ trạng thái nút bấm hoạt động chính xác.
- Đảm bảo `tempUuid` được gửi lên backend an toàn khi có upload file, và KHÔNG gửi lên khi không có file để tránh lỗi 400 Bad Request.
- Kiểm tra tính ổn định, mượt mà của thanh tìm kiếm Quản lý lương khi gõ phím.
- Kiểm tra tính đồng bộ (URL & Input value) của component `EmployeeSearchBar` dùng chung khi back/forward hoặc reload.

## 2. Tiền điều kiện

- Tài khoản HR/Admin có quyền xem và sửa lương của nhân sự (`can_edit = true`).
- Đã cấu hình chạy frontend dev server (`pnpm run dev`).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Lưu lương có thay đổi và tải tài liệu đầy đủ | Thay đổi được lưu vào phòng chờ mà không có cảnh báo nào xuất hiện. |
| HP-02 | Gõ tìm kiếm và ấn Enter/Click kính lúp | Bảng tìm kiếm được filter chính xác, không bị giật lag UI trong quá trình gõ phím. |
| HP-03 | Nhập URL `/salaries?search=P9951` trực tiếp | Ô tìm kiếm tự động hiển thị "P9951" và bảng được lọc chính xác. |
| HP-04 | Click nút clear (X) trong ô tìm kiếm | Ô tìm kiếm trống, bảng hiển thị lại đầy đủ danh sách, URL mất param `search`. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Lưu lương giữ nguyên Ngày điều chỉnh (khi đã có ngày từ trước), không upload file | Hiện 1 dialog xác nhận tổng hợp hiển thị cả 2 cảnh báo: "chưa tải tài liệu" và "ngày điều chỉnh không đổi". |
| RG-02 | Click "Quay lại kiểm tra" ở dialog cảnh báo | Dialog đóng lại, Modal sửa lương giữ nguyên trạng thái, nút Lưu không bị disabled (không bị kẹt). |
| RG-03 | Click "Tôi hiểu, vẫn lưu" tại dialog khi không upload tài liệu | Payload được gửi lên backend KHÔNG bao gồm `tempUuid`. Lưu thành công vào phòng chờ. |
| RG-04 | Thao tác tìm kiếm ở trang Danh sách nhân sự hoặc Phòng chờ, sau đó bấm Back/Forward trình duyệt | Ô tìm kiếm (Shared Component) cập nhật đúng giá trị hiển thị tương ứng với URL param hiện tại. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Nhập công thức Target (GT) sai (validation formula fail) và bấm Save | Hiện message toast cảnh báo sai công thức, form vẫn giữ nguyên, nút Save không bị kẹt disabled. |
| NG-02 | Bấm Save liên tục (Double-click) | State `isConfirming` khóa nút ngay lập tức, chỉ duy nhất 1 request/dialog được kích hoạt. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Sửa lương mà không upload file | Backend chấp nhận lưu draft mà không báo lỗi 400 "Mã file đính kèm không tồn tại" (do frontend đã chủ động cắt `tempUuid`). |

## 7. Ghi chú regression

- Cần kiểm tra kỹ các màn hình cùng sử dụng `EmployeeSearchBar` (`PendingRoomPage`, `EmployeeListPage`) để đảm bảo việc thêm `useEffect` sửa lỗi back/forward không gây ra bất cứ regression hay bug lag nào cho các màn hình này.
