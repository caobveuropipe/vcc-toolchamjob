# Test Cases - Admin Excel Import

> Tạo ngày: 2026-04-22
> Liên kết feature: `admin-excel-import`
> Phạm vi: Feature / Migration / Admin Ops

---

## 1. Mục tiêu kiểm thử

- Đảm bảo việc import hàng loạt dữ liệu từ file Excel vào hệ thống hoạt động ổn định và đúng đắn.
- Xác thực tính atomic của quá trình commit (thành công toàn bộ các dòng hợp lệ hoặc không có kết quả dơ bẩn).
- Kiểm tra tính chính xác của các quy tắc validation: Email Regex, Phone format, và Enum mapping.
- Đảm bảo chính sách "Insert Only" (không ghi đè dữ liệu cũ dựa trên mã nhân sự).

## 2. Tiền điều kiện

- Tài khoản có quyền Super Admin (để truy cập tab Import).
- Có file dữ liệu mẫu đúng cấu trúc (3 sheets: NhanSu, Luong, ReviewerEmployee).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Tải file mẫu từ hệ thống và điền 10 dòng dữ liệu nhân sự + lương hợp lệ | File mẫu tải được, dữ liệu đúng cấu trúc. |
| HP-02 | Kéo thả file Excel vào vùng upload | Màn hình Preview hiển thị ngay bảng dữ liệu, tất cả 10 dòng báo trạng thái "Hợp lệ" (màu xanh). |
| HP-03 | Nhấn "Xác nhận Import" | Hệ thống báo "Thành công: 10, Bỏ qua: 0, Lỗi: 0". Dữ liệu xuất hiện trong danh sách nhân sự và bảng lương. |
| HP-04 | Đưa SĐT phụ vào cột "Ghi chú" và SĐT chính vào cột "Số điện thoại" | Import thành công. SĐT phụ được lưu vào trường `thong_tin_lien_he_phu`. |
| HP-05 | Sử dụng tính năng Filter trên cột "Trạng thái" tại bảng Preview | Bảng chỉ hiển thị các dòng tương ứng (chỉ dòng Lỗi hoặc chỉ dòng Hợp lệ) theo lựa chọn. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Import một file có chứa 5 dòng mới và 5 mã nhân sự đã tồn tại trong DB | Preview báo 5 dòng xanh (Hợp lệ) và 5 dòng vàng (Sẽ bị bỏ qua). |
| RG-02 | Nhấn Import cho file HP-01 | Thống kê trả về: "Thành công: 5, Bỏ qua: 5". Không có bản ghi nào bị ghi đè. |
| RG-03 | Dữ liệu lương chứa định dạng tiền tệ Việt Nam (VD: 5.000.000 hoặc 5,000,000) | Backend tự động sanitize thành số thuần túy (5000000) và lưu đúng. |
| RG-04 | Cột "Không có NNT" trong Excel điền: "Có", "1", "True" hoặc "Yes" | Backend tự động convert về `true` boolean trong Database. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Upload file không đúng định dạng (VD: file .txt hoặc .pdf) | Hệ thống báo lỗi "File không hợp lệ hoặc không thể đọc". |
| NG-02 | Import dòng nhân sự có Email sai định dạng (VD: name@company) | Preview đánh dấu dòng màu đỏ, báo lỗi "email không hợp lệ". |
| NG-03 | Import Reviewer cho một mã nhân sự không tồn tại trong hệ thống | Preview đánh dấu đỏ ở bảng Reviewer, báo lỗi không thể gán. |
| NG-04 | Nhấn Import khi bảng Preview có cả dòng Xanh và dòng Đỏ | Chỉ các dòng Xanh được đưa vào DB. Các dòng Đỏ bị skip mà không gây sập hệ thống (500). |
| NG-05 | Import mã nhân sự có chứa dấu cách hoặc gạch ngang (VD: "NS-001") | Preview báo đỏ: "ma_nhan_su chỉ được chứa chữ và số". |
| NG-06 | Import khối không tồn tại hoặc sai chính tả (VD: "Admicro ") | Preview báo đỏ và liệt kê danh sách Khối hợp lệ. |
| NG-07 | Để trống cột "Kỳ nghiệm thu" hoặc nhập sai (VD: "tháng") | Preview báo đỏ hoặc hệ thống tự sanitize về null nếu để trống (tùy config). |
| NG-08 | Nhập số lương âm (VD: -5000000) | Preview báo đỏ: "Trường lương ... không được là số âm". |


## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Truy cập trực tiếp endpoint `/api/admin/migrate-bulk/preview` bằng token user thường | Trả về 403 Forbidden. |
| SC-02 | Thử bypass RLS bằng cách gọi API RPC trực tiếp từ client anon key | Bị chặn bởi PostgREST/Supabase config. |

## 7. Ghi chú regression

- Cần kiểm tra lại trang "Phòng chờ" (Pending Room) để đảm bảo dữ liệu import (set cờ `state_phong_cho = false`) không vô tình rơi vào phòng chờ.
- Kiểm tra hiển thị tiền tệ trên bảng "Quản lý Lương" sau khi import để xác nhận bước sanitization hoạt động tốt.
