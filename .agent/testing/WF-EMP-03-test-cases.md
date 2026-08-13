# Test Cases: Luồng Điều chỉnh lương & OCR (WF-EMP-03)

## 1. Happy Path: Luồng chuẩn với OCR
- **Mục tiêu**: Đảm bảo admin có thể upload minh chứng và AI điền đúng thông tin lương.
- **Các bước**:
    1. Chọn nhân sự đang hoạt động -> Click "Điều chỉnh lương".
    2. Upload file PDF/Ảnh quyết định lương vào vùng "Giấy tờ minh chứng".
    3. Nhấn nút "Tự điền thông tin".
    4. Kiểm tra: Các trường như "Lương target GT", "LCD HĐLĐ", "Cơ chế khoán"... được điền chính xác từ file.
    5. Nhấn "Lưu": Hồ sơ xuất hiện trong Phòng chờ với icon **$** (Vàng).
- **Kết quả mong đợi**: Dữ liệu lưu đúng, document được bind vào hồ sơ nhân sự qua `temp_uuid`.

## 2. Kiểm thử hiển thị Icon & Tooltips (Pending Room)
- **Mục tiêu**: Xác nhận admin nhận diện đúng loại thay đổi qua icons.
- **Các trường hợp**:
    - **Nhân sự mới**: Hiển thị Tag **[NEW]** đỏ, Tooltip: "Nhân sự mới (Chưa cấp mã chính thức)".
    - **Chỉ sửa hồ sơ**: Hiển thị icon **Info (Xanh)**, Tooltip: "Điều chỉnh thông tin hồ sơ".
    - **Chỉ sửa lương**: Hiển thị icon **$ (Vàng)**, Tooltip: "Điều chỉnh lương & cơ chế".
    - **Sửa cả hai**: Hiển thị cả 2 icons **Info** và **$**.

## 3. Negative & Edge Cases
- **OCR lỗi**: Upload file trắng hoặc file không phải quyết định lương -> AI báo không tìm thấy thông tin -> User vẫn có thể nhập tay.
- **NS Nghỉ việc**: Kiểm tra nút "Điều chỉnh lương" bị ẩn/disabled đối với nhân sự đã nghỉ việc.
- **Quyền hạn**: User role **VI** (View-only) không thấy nút "Điều chỉnh lương" và không xem được chi tiết lương chờ duyệt.

## 4. Regression
- Đảm bảo việc sửa lương trong phòng chờ không làm hỏng dữ liệu lương hiện tại của nhân viên (chỉ được cập nhật sau khi duyệt).
