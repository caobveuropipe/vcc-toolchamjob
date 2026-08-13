# Kịch bản kiểm thử (Test Cases) — Bulk Resignation Import
> Feature: bulk-resignation-import  |  Ngày cập nhật: 2026-07-17

Tài liệu này định nghĩa các kịch bản kiểm thử tích hợp (integration tests) và kiểm thử thủ công (manual tests) cho chức năng Cập nhật trạng thái nghỉ việc hàng loạt qua file Excel.

---

## 1. Automated Integration Tests (Vitest)
Bộ kiểm thử tự động được triển khai tại [bulkResign.test.ts](file:///d:/ToolNhanSuVcc/backend/src/__tests__/integration/bulkResign.test.ts) kiểm tra 6 tình huống chính:

### TC-AUTO-01: Giới hạn kích thước payload (> 100KB)
* **Mục tiêu:** Đảm bảo hệ thống chặn các file gửi lên có dung lượng body vượt quá 100KB để tránh nghẹt mạng hoặc tấn công DOS.
* **Kịch bản:** Gửi request `POST /api/employees/bulk-resign` có chứa 150 bản ghi nhưng kèm theo một trường phụ không sử dụng dài 1000 ký tự (kích thước chuỗi JSON vượt quá 150KB).
* **Kết quả kỳ vọng:** API trả về mã lỗi `413 Payload Too Large`.

### TC-AUTO-02: Kiểm tra validate cấu trúc (Zod Validation)
* **Mục tiêu:** Phát hiện định dạng dữ liệu đầu vào không hợp lệ từ client trước khi gọi logic nghiệp vụ.
* **Kịch bản:** Gửi request có chứa mã nhân sự quá ngắn (1 ký tự) hoặc ngày nghỉ việc sai định dạng (`invalid-date`).
* **Kết quả kỳ vọng:** API trả về mã lỗi `400 Bad Request` kèm theo chi tiết lỗi cấu trúc từ Zod (`VALIDATION_ERROR`).

### TC-AUTO-03: Kiểm tra giới hạn số lượng dòng (> 200 dòng)
* **Mục tiêu:** Giới hạn kích thước danh sách trong mỗi lần import để giảm tải xử lý.
* **Kịch bản:** Gửi request có chứa 201 bản ghi nhân sự.
* **Kết quả kỳ vọng:** API trả về mã lỗi `400 Bad Request` với thông tin chi tiết: "Chỉ được import tối đa 200 dòng mỗi lần".

### TC-AUTO-04: Kiểm tra nhân sự không tồn tại
* **Mục tiêu:** Trả về danh sách lỗi cụ thể cho dòng nhân sự không có mã trong hệ thống.
* **Kịch bản:** Gửi request có chứa mã nhân sự `"NONEXISTENT"`.
* **Kết quả kỳ vọng:** API trả về `200 OK` nhưng trường `errors` trong response có chứa mã `"NONEXISTENT"` với lỗi: "Nhân viên không tồn tại trong hệ thống".

### TC-AUTO-05: Kiểm tra kiểm soát phân quyền EA theo Khối
* **Mục tiêu:** Đảm bảo tài khoản EA không thể cho nghỉ việc nhân viên thuộc Khối khác.
* **Kịch bản:** Tài khoản EA của khối `Admicro` gửi request chứa nhân viên thuộc khối `KND`.
* **Kết quả kỳ vọng:** API trả về `200 OK` và ghi nhận dòng đó có lỗi: "Tài khoản không có quyền EA đối với khối của nhân viên này".

### TC-AUTO-06: Phát hiện mã nhân sự trùng lặp trong file import
* **Mục tiêu:** Ngăn chặn cập nhật xung đột thông tin của cùng một nhân viên trong một đợt import.
* **Kịch bản:** Gửi danh sách chứa 2 dòng cùng có mã nhân sự `BRES01` nhưng ngày nghỉ việc khác nhau.
* **Kết quả kỳ vọng:** API trả về lỗi trùng lặp mã nhân sự tại danh sách validate.

---

## 2. Manual Verification (Kiểm thử thủ công)

### TC-MAN-01: Tải file Excel mẫu và kiểm tra cấu trúc
1. Đăng nhập tài khoản EA/SA.
2. Mở modal **Import nghỉ việc** → Click **"Tải file mẫu Excel"**.
3. Mở file Excel vừa tải xuống và xác nhận có đầy đủ 3 cột: `Mã nhân sự`, `Ngày nghỉ việc (DD/MM/YYYY hoặc YYYY-MM-DD)`, `Lý do nghỉ việc (tùy chọn)`.

### TC-MAN-02: Kiểm tra an toàn kỳ lương bị khóa (Lock Period Guard)
1. Xác định một khối (ví dụ: `Admicro`) đã được chốt và khóa Snapshot tháng lương hiện tại.
2. Tạo file Excel nhập nghỉ việc cho nhân viên thuộc khối đó với ngày nghỉ việc nằm trong chu kỳ lương đã khóa.
3. Tải file Excel lên.
4. **Kết quả kỳ vọng:** Dòng nhân viên đó hiển thị Tag đỏ cảnh báo lỗi: "Kỳ lương chứa ngày nghỉ việc đã bị khóa, không thể chỉnh sửa dữ liệu". Nút **"Xác nhận"** bị disabled.

### TC-MAN-03: Hoàn tác hoàn toàn dữ liệu (Rollback Compensation)
1. Thực hiện import nghỉ việc thành công cho danh sách 3 nhân sự.
2. Kiểm tra danh sách nhân sự: xác nhận 3 nhân sự này đã chuyển trạng thái sang `Nghỉ việc`.
3. Kiểm tra **Audit Log** để lấy ID của audit log có hành động `bulk_resign` tương ứng.
4. Truy cập **Supabase Dashboard SQL Editor** và chạy lệnh khôi phục:
   ```sql
   SELECT fn_rollback_bulk_resignation(<AUDIT_LOG_ID>, 'admin@vccorp.vn');
   ```
5. Quay lại ứng dụng và tải lại trang:
   - Kết quả kỳ vọng: Toàn bộ 3 nhân sự được tự động chuyển về trạng thái làm việc cũ (thử việc/chính thức), ngày nghỉ việc của họ được xóa/khôi phục về giá trị cũ.
   - Các bản ghi `change_history` rác tạo ra trong đợt import bị xóa sạch.

### TC-MAN-04: Hiển thị rà soát lỗi logic dữ liệu
1. Đăng nhập tài khoản EA/SA.
2. Mở modal **Import nghỉ việc** → Chọn file Excel nhập dữ liệu chứa cả dòng hợp lệ và dòng không hợp lệ (ví dụ: dòng có mã nhân viên đã nghỉ việc, dòng có mã nhân viên không tồn tại).
3. **Kết quả kỳ vọng:**
   - Modal hiển thị thông báo lỗi màu đỏ: *"Phát hiện lỗi logic dữ liệu"*.
   - Bảng xem trước ở phía dưới **chỉ hiển thị các dòng bị lỗi** (được đánh dấu Tag đỏ *"Nhân sự đã ở trạng thái nghỉ việc"* hoặc *"Nhân viên không tồn tại trong hệ thống"*...). Các dòng hợp lệ được ẩn đi để người dùng tiện rà soát lỗi.
   - Nút **"Xác nhận"** bị disabled.
4. Chọn file Excel nhập dữ liệu chứa toàn bộ các dòng hợp lệ.
5. **Kết quả kỳ vọng:**
   - Modal hiển thị thông báo màu xanh: *"Kiểm tra dữ liệu thành công"*.
   - Bảng xem trước hiển thị đầy đủ tất cả các dòng với Tag xanh *"Hợp lệ"*.
   - Nút **"Xác nhận"** hoạt động bình thường, hiển thị đúng số lượng dòng cần import.
