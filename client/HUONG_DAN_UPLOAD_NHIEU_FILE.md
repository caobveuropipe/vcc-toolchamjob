# Hướng Dẫn Sử Dụng Modal Upload Nhiều File

## Tổng Quan
Modal **Upload Nhiều File** cho phép bạn upload nhiều file Excel hiệu suất cùng lúc, mỗi file có thể chọn Kỳ nghiệm thu riêng biệt, không cần xem preview trước khi lưu.

## Các Tính Năng Chính

### 1. Upload Nhiều File Cùng Lúc
- Có thể thêm nhiều dòng upload
- Mỗi dòng chọn một file Excel riêng
- Mỗi file có dropdown riêng để chọn Kỳ nghiệm thu

### 2. Không Cần Preview
- File được đọc và xử lý trực tiếp
- Không hiển thị bảng preview
- Tiết kiệm thời gian khi upload nhiều file

### 3. Validation Đầy Đủ
- Kiểm tra tên file (không chứa ký tự đặc biệt)
- Kiểm tra dữ liệu trong file
- Kiểm tra mã nhân sự
- Kiểm tra ID job từ khung cơ chế

### 4. Báo Cáo Kết Quả
- Hiển thị số file thành công/lỗi
- Chi tiết lỗi cho từng file
- Tự động refresh dữ liệu sau khi upload thành công

## Cách Sử Dụng

### Bước 1: Mở Modal
- Click vào nút **"Upload nhiều file"** trong sidebar
- Modal sẽ hiển thị với form upload

### Bước 2: Chọn Cơ Chế và Khối (Chung cho tất cả file)
- Chọn **Cơ chế** từ dropdown (bắt buộc)
- Chọn **Khối** từ dropdown (bắt buộc)
- Hai thông tin này áp dụng cho tất cả các file

### Bước 3: Thêm Dòng Upload
- Click nút **"Thêm dòng"** để thêm dòng upload mới
- Mỗi dòng bao gồm:
  - **STT**: Số thứ tự tự động
  - **Chọn file Excel**: Input để chọn file .xls hoặc .xlsx
  - **Kỳ nghiệm thu**: Dropdown chọn kỳ nghiệm thu cho file này
  - **Trạng thái**: Badge hiển thị trạng thái file
  - **Nút xóa**: Xóa dòng này

### Bước 4: Chọn File và Kỳ Nghiệm Thu
Cho mỗi dòng:
1. Click vào **"Chọn file Excel"** và chọn file từ máy tính
2. Hệ thống sẽ tự động đọc file và hiển thị trạng thái:
   - 🟡 **"Đang đọc file..."**: Đang xử lý
   - 🟢 **"✓ tên_file.xlsx"**: Đọc thành công
   - 🔴 **"File không hợp lệ"**: Lỗi
3. Chọn **Kỳ nghiệm thu** từ dropdown

### Bước 5: Lưu Tất Cả File
1. Click nút **"Lưu tất cả file"**
2. Hệ thống sẽ kiểm tra:
   - Đã chọn Cơ chế và Khối chưa
   - Có ít nhất một file được chọn
   - Mỗi file đã chọn Kỳ nghiệm thu chưa
3. Hiển thị dialog xác nhận với thông tin:
   - Số lượng file sẽ upload
   - Cơ chế
   - Khối
4. Click **"Xác nhận"** để bắt đầu upload

### Bước 6: Theo Dõi Quá Trình Upload
- Spinner modal sẽ hiển thị trong quá trình upload
- Hệ thống xử lý từng file tuần tự
- Sau khi hoàn thành, hiển thị kết quả:
  - **Thành công**: Số file upload thành công
  - **Lỗi**: Số file bị lỗi và chi tiết lỗi

## Các Trạng Thái File

| Trạng thái | Màu | Ý nghĩa |
|------------|-----|---------|
| Chưa chọn file | Xám | Chưa chọn file nào |
| Đang đọc file... | Vàng | Đang đọc và xử lý file |
| ✓ tên_file.xlsx | Xanh lá | File hợp lệ, sẵn sàng upload |
| File không hợp lệ | Đỏ | Tên file chứa ký tự đặc biệt hoặc lỗi đọc file |

## Lưu Ý Quan Trọng

### Định Dạng File Excel
- File phải có định dạng `.xls` hoặc `.xlsx`
- Tên file không được chứa ký tự đặc biệt: `() "" * # ! @`
- Cấu trúc file phải giống với template upload hiệu suất

### Cấu Trúc Dữ Liệu
File Excel phải có các cột theo thứ tự:
1. Mã nhân sự
2. Họ và tên
3. Team
4. Tên cơ chế
5. Loại cơ chế
6. Nhóm công việc
7. Tên job
8. Độ khó
9. Diễn giải công việc
10. Kết quả thực hiện
11. Link kết quả
12. Số lượng
13. Khối lượng công việc
14. Tỷ lệ tham gia
15. Chất lượng hoàn thành
16. Tỷ lệ hưởng hiệu suất
17. Ghi chú
18. Win-Fail
19. Nội bộ - Khách hàng
20. Dự án
21. (Các cột mở rộng - tùy chọn)

### Validation
- **Tên cơ chế** trong file phải khớp với Cơ chế đã chọn
- **Mã nhân sự** phải tồn tại trong hệ thống
- **ID Job** phải tìm thấy trong khung cơ chế
- Các trường bắt buộc: Mã nhân sự, Team, Tên cơ chế, Loại cơ chế, Nhóm công việc, Tên job

## Xử Lý Lỗi

### Lỗi Thường Gặp

1. **"Vui lòng chọn Cơ chế"**
   - Nguyên nhân: Chưa chọn Cơ chế
   - Giải pháp: Chọn Cơ chế từ dropdown

2. **"Vui lòng chọn Khối"**
   - Nguyên nhân: Chưa chọn Khối
   - Giải pháp: Chọn Khối từ dropdown

3. **"Vui lòng chọn ít nhất một file"**
   - Nguyên nhân: Chưa chọn file nào
   - Giải pháp: Thêm dòng và chọn file

4. **"Vui lòng chọn Kỳ nghiệm thu cho file: xxx"**
   - Nguyên nhân: File đã chọn nhưng chưa chọn Kỳ nghiệm thu
   - Giải pháp: Chọn Kỳ nghiệm thu cho file đó

5. **"File Excel không có dữ liệu"**
   - Nguyên nhân: File rỗng hoặc chỉ có header
   - Giải pháp: Kiểm tra lại file Excel

6. **"Dòng X không khớp Tên cơ chế"**
   - Nguyên nhân: Tên cơ chế trong file khác với Cơ chế đã chọn
   - Giải pháp: Sửa lại Tên cơ chế trong file hoặc chọn đúng Cơ chế

7. **"Mã nhân sự XXX không tồn tại"**
   - Nguyên nhân: Mã nhân sự không có trong hệ thống
   - Giải pháp: Kiểm tra lại mã nhân sự hoặc thêm nhân sự vào hệ thống

8. **"Không tìm thấy ID Job ở các dòng: X, Y, Z"**
   - Nguyên nhân: Thông tin Nhóm công việc, Tên job, Độ khó hoặc Chất lượng không khớp với Khung
   - Giải pháp: Kiểm tra lại thông tin trong file so với Khung cơ chế

## So Sánh Với Upload Đơn File

| Tính năng | Upload Đơn File | Upload Nhiều File |
|-----------|-----------------|-------------------|
| Số file cùng lúc | 1 | Nhiều |
| Preview trước khi lưu | Có | Không |
| Chọn Kỳ nghiệm thu | Chung | Riêng cho từng file |
| Tốc độ | Chậm hơn (do preview) | Nhanh hơn |
| Phù hợp khi | Upload và kiểm tra kỹ | Upload hàng loạt |

## Tips & Tricks

1. **Upload Nhanh**: Chuẩn bị sẵn tất cả file trước khi mở modal
2. **Kiểm Tra Trước**: Đảm bảo tất cả file đã đúng format để tránh lỗi
3. **Đặt Tên File**: Đặt tên file rõ ràng để dễ nhận biết khi có lỗi
4. **Upload Theo Batch**: Nếu có nhiều file, chia thành nhiều lần upload (10-15 file/lần)
5. **Backup**: Luôn giữ bản backup của file gốc trước khi upload

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra lại format file Excel
2. Kiểm tra console log (F12) để xem chi tiết lỗi
3. Liên hệ admin nếu vấn đề vẫn tiếp diễn
