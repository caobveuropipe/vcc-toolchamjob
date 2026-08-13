# Test Cases - Tab Lịch sử thay đổi nhân sự

> Tạo ngày: 2026-05-06
> Liên kết feature: `employee-change-history-tab`
> Phạm vi: Feature

---

## 1. Mục tiêu kiểm thử

- Đảm bảo Tab Lịch sử hiển thị đầy đủ các biến động thông tin nhân sự và lương.
- Đảm bảo tính năng lọc (filter) hoạt động chính xác.
- Đảm bảo tính bảo mật (masking) thông tin lương đối với vai trò không có quyền.
- Đảm bảo liên kết giấy tờ minh chứng (document_link) hoạt động đúng.

## 2. Tiền điều kiện

- Có dữ liệu trong bảng `change_history`.
- Tài khoản với các vai trò khác nhau (EA, VI, SuperAdmin).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Truy cập trang chi tiết nhân sự, nhấn vào tab "Lịch sử". | Danh sách lịch sử được tải và hiển thị dạng timeline/bảng. |
| HP-02 | Sử dụng bộ lọc "Chỉ hiện Hồ sơ" hoặc "Chỉ hiện Lương". | Danh sách tự động lọc đúng loại thay đổi. |
| HP-03 | Nhấn vào icon 📄 (nếu có) tại một bản ghi lịch sử. | Mở tab mới xem tài liệu minh chứng (presigned URL). |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Nhân sự không có bất kỳ lịch sử nào. | Hiển thị trạng thái "Trống" (Empty state) mượt mà. |
| RG-02 | Thay đổi mã nhân sự (Mã NS). | Lịch sử cũ vẫn được giữ lại và hiển thị theo Mã NS mới nhờ logic `ON UPDATE CASCADE`. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | API query lịch sử trả về lỗi 500. | UI hiển thị thông báo lỗi hoặc Alert, không bị trắng trang. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Tài khoản VI (không quyền xem lương) xem lịch sử lương. | Các trường tiền lương (lcd, luong_cb...) bị thay thế bằng dấu sao (***) hoặc "Không có quyền". |
| SC-02 | Tài khoản VI xem lịch sử ngày điều chỉnh. | Vẫn thấy giá trị ngày bình thường. |

## 7. Ghi chú regression

- Kiểm tra hiệu suất query khi số lượng bản ghi lịch sử lớn (>100 bản ghi/nhân sự).
