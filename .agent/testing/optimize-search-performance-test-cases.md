# Test Cases: Optimize Search Performance

## 1. Happy Path & Performance
- **Kịch bản**: Gõ phím liên tục vào ô tìm kiếm ở màn hình "Danh sách nhân sự" và "Phòng chờ".
- **Hành động**: Nhập chuỗi dài (ví dụ: `nguyenvana@gmail.com`).
- **Kết quả mong đợi**:
  - UI phản hồi tức thì với từng ký tự, KHÔNG bị giật cục hay treo trình duyệt.
  - Sau khoảng debounce (500ms), API mới được gọi và bảng mới cập nhật (re-render) đúng 1 lần.
  - Các modal liên quan (Sửa NNT, Xác nhận xóa) vẫn hoạt động đúng do reference hàm đã được bind ổn định.

## 2. Edge / Security / Negative
- **Kịch bản**: Nhập ký tự đặc biệt có thể phá vỡ cú pháp `.ilike()` hoặc PostgREST parser.
- **Hành động**: Thử gõ các chuỗi như `Nguyễn, Lê`, `admin()`, `100%`, `test_` vào thanh tìm kiếm nhân sự hoặc phần tìm kiếm Autocomplete.
- **Kết quả mong đợi**:
  - Backend tự động escape/loại bỏ ký tự đặc biệt.
  - API trả về status 200 kèm data danh sách (hoặc mảng rỗng nếu không khớp), tuyệt đối KHÔNG trả về lỗi `HTTP 400 Bad Request` hay thông báo lỗi parser.
  - Hệ thống an toàn trước nguy cơ SQL Wildcard Injection (truyền `%` để lôi hết bảng).
