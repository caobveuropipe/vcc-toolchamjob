# Test Cases: Cập nhật hiển thị NNTTV và Tùy chọn xuất Excel nhân sự nghỉ việc (update-nnt-display-and-export-options)

## 1. Happy Path & UI (Bảng nhân sự)
- **TC-001**: Kiểm tra cột **Email** đã biến mất ở cả giao diện Danh sách nhân sự thường và Phòng chờ.
- **TC-002**: Kiểm tra cột **Người nghiệm thu thử việc** hiển thị đúng vị trí (thay thế cột Email cũ), hiển thị email NNTTV dạng text hoặc gạch ngang `—` nếu không có dữ liệu.
- **TC-003**: Kiểm tra thanh cuộn ngang của bảng hoạt động trơn tru ở cả 2 màn hình, không bị lỗi gập chữ hoặc mất layout cột.

## 2. Bộ lọc (Dropdown Filter)
- **TC-004**: Kiểm tra biểu tượng phễu lọc (Filter) xuất hiện bên cạnh tiêu đề cột "Người nghiệm thu thử việc". Click vào phễu lọc hiển thị đúng danh sách unique email NNTTV lấy từ backend.
- **TC-005**: Tick chọn lọc theo 1 hoặc nhiều email NNTTV, xác nhận danh sách nhân sự được cập nhật chính xác và API request được gửi đi có chứa tham số query `nguoi_nghiem_thu_thu_viec`.

## 3. Tùy chọn Xuất Excel Full (Modal Options)
- **TC-006**: Click "Xuất full danh sách", xác nhận modal custom của Ant Design hiện lên hỏi: *"Bạn có muốn bao gồm cả các nhân sự đã nghỉ việc trong file Excel xuất ra không?"*. Modal có độ rộng 580px và 3 nút nằm thẳng hàng: "Hủy", "Chỉ nhân sự đang hoạt động", "Bao gồm cả nhân sự nghỉ việc".
- **TC-007**: Click "Hủy", xác nhận modal đóng lại và không phát sinh bất kỳ network request nào.
- **TC-008**: Click "Chỉ nhân sự đang hoạt động", xác nhận file tải về và API request có tham số `trang_thai=thu_viec,chinh_thuc,nghi_sinh`.
- **TC-009**: Click "Bao gồm cả nhân sự nghỉ việc", xác nhận file tải về và API request có tham số `trang_thai=thu_viec,chinh_thuc,nghi_sinh,nghi_viec`.

## 4. Khắc phục Stale Closures (Filter & Search Sync)
- **TC-010**: Nhập tìm kiếm hoặc thay đổi bộ lọc trên bảng, sau đó bấm Xuất Excel -> Xuất full danh sách -> chọn xuất hoạt động hoặc tất cả. Xác nhận tham số query search/filter được cập nhật mới nhất trong API request xuất file.
