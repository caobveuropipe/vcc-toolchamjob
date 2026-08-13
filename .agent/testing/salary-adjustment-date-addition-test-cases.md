# Test Cases - Ngày điều chỉnh lương

> Tạo ngày: 2026-05-06
> Liên kết feature: `salary-adjustment-date-addition`
> Phạm vi: Feature

---

## 1. Mục tiêu kiểm thử

- Đảm bảo "Ngày điều chỉnh" được nhập đúng định dạng từ UI.
- Đảm bảo ngày được lưu nháp (pending) và duyệt (submit) thành công vào bảng nhân sự.
- Đảm bảo hiển thị đồng bộ tại trang chi tiết nhân sự.

## 2. Tiền điều kiện

- Tài khoản EA (để nhập lương) và Reviewer/SuperAdmin (để duyệt).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Mở Modal sửa lương, chọn Ngày điều chỉnh bằng DatePicker và nhấn Lưu nháp. | Dữ liệu được lưu vào `salaries.pending_changes` với key `ngay_dieu_chinh_luong`. |
| HP-02 | EA/SuperAdmin duyệt hồ sơ từ Phòng chờ. | `ngay_dieu_chinh_luong` được cập nhật vào bảng `employees`. |
| HP-03 | Xem trang chi tiết nhân sự mục Quản lý & Ngày tháng. | Hiển thị đúng "Ngày điều chỉnh lương" đã duyệt. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Nhập ngày điều chỉnh nhưng không thay đổi số tiền lương. | Hệ thống vẫn cho phép lưu và duyệt ngày mới. |
| RG-02 | Kiểm tra hiển thị khi `ngay_dieu_chinh_luong` trong DB là null. | Hiển thị dấu gạch ngang (-) hoặc trống, không gây crash UI. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Xóa ngày điều chỉnh (để trống) và nhấn Lưu. | Nếu schema cho phép null thì lưu thành công, nếu bắt buộc thì báo lỗi validation. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Tài khoản VI truy cập trang chi tiết nhân sự. | Vẫn thấy nhãn "Ngày điều chỉnh lương" và giá trị ngày (không bị che như tiền lương). |

## 7. Ghi chú regression

- Kiểm tra luồng `submit_employee_pending` đảm bảo không làm mất tính cách ly dữ liệu lương (Salary Isolation).
