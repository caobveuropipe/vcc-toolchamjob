# Test Cases: Chuẩn hóa "Người bị thay thế" Autocomplete & OCR

## 1. Happy Path
- **Thêm/Sửa bằng UI (Gõ Mã)**: Vào form tạo/sửa -> Gõ mã `VCC` -> dropdown hiện danh sách gợi ý -> Chọn 1 người -> Label hiện `MÃ - Họ Tên` -> Submit thành công.
- **Thêm/Sửa bằng UI (Gõ Tên)**: Gõ tên `Nguyễn` -> Dropdown hiện -> Chọn -> Submit thành công.
- **OCR Tự động điền 1 Match**: Upload ảnh giấy báo thay thế có tên "Hải Linh" -> Bấm "Tự điền" -> Form hiển thị thông báo "Đã điền thành công mã NS cho Hải Linh" và gắn auto value.
- **Hiển thị View Detail lazy**: Ở list -> Click vào thông tin chi tiết -> Label `Người bị thay thế` hiện timeout khoảng 1s sau đó hiển thị dạng `<MÃ> - <Tên>`.

## 2. Edge / Negative Cases
- **OCR Trùng lắp Tên**: AI đọc tên "Nguyễn Văn A" -> Bấm tự fill -> Backend báo có nhiều hơn 1 người tên Nguyễn Văn A -> Message UI vàng "Vui lòng chọn thủ công" -> Field giữ trống.
- **OCR Tên ảo không có trong DB**: AI đọc "Abcxyz" -> "Không tìm thấy NS phù hợp".
- **Gõ sai định dạng API/Import**: Trạng thái Max 20 ký tự, chặn alphanumeric. Tool Excel Preview báo lỗi đỏ trực tiếp.
- **API API/Mạng sập (Offline lazy-load)**: Disconnect mạng -> Vào View Detail -> Nhãn người bị thay thế phải giữ nguyên Mã thô (VCC001), UI không crash.

## 3. Security & Permission (RBAC/IDOR)
- **SuperAdmin**: Truy xuất `/api/employees/autocomplete?q=vcc` -> Trả về kết quả toàn hệ thống.
- **EA / VI / VA**: Đăng nhập tài khoản nội khối `Khối Nội Dung` -> Gõ `q=vcc` -> Chỉ thả ra người thuộc khối này, kết quả của khối khác bị tàng hình trong mảng.
- **Reviewer**: Đăng nhập tài khoản Reviewer -> Bypass gọi API `/autocomplete` qua Browser -> Trả về **HTTP 403 Forbidden** "Reviewer không có quyền gọi Autocomplete tìm kiếm".

## 4. Quy trình Regression Test (Cập nhật 2026-05-25)
- **Kiểm thử phân quyền cấp Khối (EA/VA/VI)**: Đăng nhập tài khoản EA thuộc một khối cụ thể (ví dụ: Khối Nội dung). Mở modal Sửa hồ sơ -> gõ tìm kiếm "Người bị thay thế" -> Dropdown hiển thị đúng danh sách nhân sự thuộc khối đó -> Chọn được nhân sự và lưu thành công.
- **Kiểm thử tài khoản SuperAdmin (SA)**: Đăng nhập tài khoản SA -> Tìm kiếm autocomplete hoạt động bình thường trên phạm vi toàn công ty.
- **Kiểm thử Console & Mạng**: Bật DevTools Network & Console -> Thực hiện tìm kiếm -> Không xuất hiện cảnh báo lỗi hoặc lỗi im lặng. API autocomplete trả về mảng trực tiếp và frontend mapping đúng.

