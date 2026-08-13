# Test Cases: Điều chuyển bổ nhiệm (WF-EMP-05)

## 1. Happy Path: Điều chuyển hồ sơ & lương
- **Mục tiêu**: Kiểm tra luồng điều chuyển tiêu chuẩn có đầy đủ chứng từ.
- **Các bước**:
    1. Vào trang Chi tiết nhân sự -> Bấm "Điều chuyển bổ nhiệm".
    2. Tại Form, thay đổi Khối/Phòng ban và cập nhật cơ chế Lương.
    3. Tải lên file Quyết định điều chuyển (PDF/Image).
    4. Bấm "Lưu yêu cầu điều chuyển".
    5. Kiểm tra tại Phòng chờ: Xuất hiện record với icon `Info` và `Dollar`.
- **Kết quả mong đợi**: Dữ liệu hồ sơ và lương được lưu nháp thành công. File đính kèm được bind vào nhân sự.

## 2. Reviewer Mismatch: Cảnh báo sai NNT
- **Mục tiêu**: Đảm bảo HR được cảnh báo nếu NNT hiện tại không phù hợp với đơn vị mới.
- **Các bước**:
    1. Thực hiện Điều chuyển nhân sự từ Khối A sang Khối B.
    2. Quay lại trang Chi tiết nhân sự đó.
    3. Quan sát Card "Người Nghiệm Thu".
- **Kết quả mong đợi**:
    - Hiển thị Alert: "NNT hiện tại có thể không còn phù hợp với tổ chức mới trong bản nháp."
    - Có nút "Cập nhật theo gợi ý". Bấm nút -> NNT được cập nhật đúng theo Khối B.

## 3. Atomic Submission & History Linking
- **Mục tiêu**: Kiểm tra dữ liệu được áp dụng chính thức và gắn đúng link tài liệu.
- **Các bước**:
    1. Tại Phòng chờ, bấm "Submit" hồ sơ điều chuyển ở Case 1.
    2. Chọn NNT và xác nhận duyệt.
    3. Vào trang Chi tiết nhân sự -> Tab "Lịch sử".
- **Kết quả mong đợi**:
    - Toàn bộ các thay đổi (Khối, Phòng ban, Lương...) hiển thị trong lịch sử.
    - Cột "Chứng từ" hiển thị link tới file Quyết định đã upload ở bước 1.3 cho TRẤT CẢ các dòng thay đổi liên quan.
    - Nhân sự mất trạng thái `state_phong_cho`.

## 4. Security & Isolation
- **Mục tiêu**: Đảm bảo tính cô lập của dữ liệu lương trong luồng điều chuyển.
- **Các bước**:
    1. Dùng tài khoản role VI (không xem được lương) thực hiện điều chuyển.
    2. Kiểm tra xem có thấy vùng Lương trong Form không.
- **Kết quả mong đợi**: Role VI không thấy vùng lương, chỉ sửa được thông tin tổ chức. Khi submit, dữ liệu lương cũ của nhân viên phải được giữ nguyên (không bị ghi đè null).
