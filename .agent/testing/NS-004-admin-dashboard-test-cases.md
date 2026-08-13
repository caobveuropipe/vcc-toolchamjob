# Test Cases: NS-004 Admin Dashboard Enhancements
> Module: Quản trị hệ thống
> Trạng thái: Draft
> Phiên bản: 1.0.0

## 1. Tính năng Email Autocomplete (Select Searchable)

| ID | Test Case | Bước thực hiện | Kết quả mong đợi | Độ ưu tiên |
|:---|:---|:---|:---|:---|
| TC-01 | Tải danh sách mặc định | Mở Modal "Gán quyền mới" hoặc "Bổ sung SA", click vào ô Email | Hiện danh sách 10-20 gợi ý đầu tiên ngay lập tức (không delay) | High |
| TC-02 | Tìm kiếm theo Email | Gõ "@vcc" vào ô nhập Email | Danh sách lọc tức thì các email chứa chuỗi "@vcc" | High |
| TC-03 | Tìm kiếm theo Tên | Gõ "Nhân viên test" vào ô Email | Hiện các email của nhân sự có tên "Nhân viên test" | Medium |
| TC-04 | Local Filter Performance | Gõ nhanh nhiều ký tự liên tục | Giao diện phản hồi mượt mà, không có biểu tượng loading liên tục (do dùng dữ liệu pre-fetched) | High |
| TC-05 | Email không tồn tại | Nhập 1 email hoàn toàn mới không có trong danh sách | Chọn email vừa nhập (hỗ trợ case thủ công) hoặc hiện "Không tìm thấy" tùy cấu hình mode | Medium |

## 2. Tính năng Table Search Box (Lọc bảng)

| ID | Test Case | Bước thực hiện | Kết quả mong đợi | Độ ưu tiên |
|:---|:---|:---|:---|:---|
| TC-06 | Lọc theo Email (Permissions) | Nhập 1 email vào ô Search của bảng quyền | Bảng chỉ hiện các dòng có email khớp | High |
| TC-02 | Lọc theo Khối | Nhập "Admicro" vào ô Search bảng quyền | Hiện danh sách quyền thuộc khối Admicro | Medium |
| TC-07 | Lọc theo Mã nhân sự (Reviewers) | Nhập "VCC001" vào bảng Soát xét | Hiện dòng soát xét tương ứng với nhân sự đó | High |
| TC-08 | Xóa bộ lọc (Clear) | Click icon X hoặc xóa text trong ô Search | Bảng quay lại hiển thị đầy đủ dữ liệu ban đầu | High |

## 3. Form Lifecycle & Stability

| ID | Test Case | Bước thực hiện | Kết quả mong đợi | Độ ưu tiên |
|:---|:---|:---|:---|:---|
| TC-09 | Sửa quyền (Edit) | Click "Sửa" 1 dòng bất kỳ | Form điền đúng data của dòng đó mà không báo lỗi console `useForm` | High |
| TC-10 | Reset Form khi chuyển | Mở Modal Sửa -> Đóng -> Mở Modal Thêm mới | Form sạch dữ liệu cũ của dòng trước | High |

## 4. Bulk Reviewer Operations

| ID | Test Case | Bước thực hiện | Kết quả mong đợi | Độ ưu tiên |
|:---|:---|:---|:---|:---|
| TC-11 | Bulk Transfer (Hợp lệ) | Chọn Reviewer A -> B -> Transfer -> Preview -> Xác nhận | Toàn bộ (hoặc subset) nhân sự chuyển sang B, A bị gỡ | High |
| TC-12 | Partial Selection | Trong bảng Preview, bỏ tích 1 số NS rồi Execute | Chỉ những NS được tích chọn mới bị thay đổi Reviewer | High |
| TC-13 | Blocker: Thiếu quyền | Chọn Reviewer B chưa có quyền EA/VA trên khối X | Preview hiện cảnh báo Đỏ, nút "Thực thi" bị Disable | High |
| TC-14 | Bulk Remove | Chọn Operation: Remove -> Preview -> Thực thi | Toàn bộ NS đã chọn bị gỡ Reviewer nguồn, không cần Reviewer đích | Medium |

---
*Cập nhật tự động bởi update-docs*
