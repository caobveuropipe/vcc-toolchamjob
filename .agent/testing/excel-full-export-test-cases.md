# Test Cases: Xuất Excel full danh sách nhân sự (excel-full-export)

## 1. Happy Path & UI
- **TC-001**: Kiểm tra dropdown "Xuất Excel" hiển thị đầy đủ 3 tùy chọn: Xuất danh sách nhân sự (mặc định), Xuất full danh sách, Xuất DS làm thưởng KD.
- **TC-002**: Người dùng có quyền (SA/EA) chọn "Xuất full danh sách", tải xuống file Excel chứa 56 cột, thông tin lương hiển thị chính xác.
- **TC-003**: Dữ liệu tải về không bao gồm nhân sự có trạng thái `nghi_viec` (Đã nghỉ việc).

## 2. Bảo mật & Phân quyền (Security Isolation)
- **TC-004**: Tài khoản có vai trò `VI` (Viewer) chọn "Xuất full danh sách", tải xuống file Excel có cấu trúc 56 cột nhưng 31 cột lương hoàn toàn rỗng/trống (giá trị là `-`).
- **TC-005**: Kiểm tra payload API của vai trò `VI` không chứa bất kỳ thông tin lương nhạy cảm nào.

## 3. Hiệu năng & Edge Cases
- **TC-006**: Số lượng nhân sự vượt quá 5000 dòng. Khi xuất file, dữ liệu tự động bị cắt ở dòng thứ 5000, API trả về `truncated: true` và Frontend hiển thị thông báo cảnh báo dòng dữ liệu bị giới hạn.

## 4. Rate Limiting & Audit Log
- **TC-007**: Thực hiện request API `include_salaries=true` liên tục. Request thứ 6 trở đi trong vòng 1 phút phải trả về mã `429 Too Many Requests`.
- **TC-008**: Mỗi lượt xuất full danh sách thành công phải ghi nhận một bản ghi vào bảng `audit_log` với hành động `export` và chi tiết `export_type: "employee_full_with_salary"`.
