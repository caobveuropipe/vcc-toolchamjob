# Test Cases: Thêm Cột Bộ Phận và Tối Ưu Hiển Thị Phòng Chờ

## 1. Happy Path: Hiển thị thông tin cột Bộ phận
* **Mô tả:** Đảm bảo cột Bộ phận hiển thị chính xác giá trị thực tế của nhân viên.
* **Các bước thực hiện:**
    1. Đăng nhập với tài quyền EA/SA.
    2. Truy cập màn hình **Phòng chờ** (`/pending-room`).
    3. Quan sát cột **Bộ phận** của các nhân sự.
* **Kết quả mong đợi:**
    - Nhân sự không có thay đổi bộ phận: Hiển thị bộ phận hiện tại của nhân sự (ví dụ: "Tech", "Product"). Nếu trống hiển thị "—".
    - Nhân sự có thay đổi bộ phận chờ duyệt: Hiển thị tên bộ phận mới kèm theo đường gạch đứt màu vàng dưới chân. Rê chuột vào sẽ hiển thị Tooltip: `Chờ duyệt (Hiện tại: [Tên bộ phận cũ])`.

## 2. Happy Path: Giao diện compact & Tối giản cột Hành động
* **Mô tả:** Đảm bảo giao diện bảng phòng chờ hiển thị nhỏ gọn, đầy đủ thông tin, không bị cuộn ngang quá mức hay đè chữ.
* **Các bước thực hiện:**
    1. Quan sát cột **Họ và tên**: Các tag trạng thái (`NEW`, `ĐGTV`) và các icon (`PDF`, `Info`, `Dollar`) phải nằm ngay bên cạnh tên nhân viên (dạng inline flex).
    2. Quan sát cột **Hành động**: Chỉ chứa nút `submit` và nút ba chấm (More), nút `submit` không viết hoa, không có icon dấu tích, cỡ chữ nhỏ gọn.
    3. Thay đổi kích thước trình duyệt (Mobile, Tablet, Desktop) để kiểm tra tính năng co giãn cột và cuộn ngang.
* **Kết quả mong đợi:**
    - Cột Hành động không bị tràn layout, nút submit hiển thị rõ ràng, không bị che mất hoặc bắt buộc phải cuộn thêm.
    - Các cột dài tự động hiển thị dạng dấu ba chấm (`...`) khi không đủ chiều ngang thay vì xuống dòng làm vỡ chiều cao dòng của bảng.
    - Cột Khối, Bộ bộ hiển thị gọn gàng, không bị giãn quá rộng.

## 3. Regression: Trang live danh sách nhân sự chính không đổi
* **Mô tả:** Đảm bảo các tối ưu hóa font size và padding cục bộ của phòng chờ không gây ảnh hưởng đến trang live `/employees`.
* **Các bước thực hiện:**
    1. Truy cập màn hình **Danh sách nhân sự** (`/employees`).
    2. Quan sát cỡ chữ và padding của bảng, cột Bộ phận và vị trí các tag.
* **Kết quả mong đợi:**
    - Không xuất hiện cột "Bộ phận" trên bảng live.
    - Cỡ chữ và khoảng cách padding của bảng live giữ nguyên như thiết kế ban đầu (tiêu chuẩn), không bị thu gọn compact như ở phòng chờ.
