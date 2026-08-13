# Test Cases - Bổ sung Nhuận bút cơ chế và đổi tên HS Chấm/Job/Nhuận

> Tạo ngày: 2026-07-16
> Liên kết feature: `update-salary-modal-fields`
> Phạm vi: Feature

---

## 1. Mục tiêu kiểm thử

- Đảm bảo trường Nhuận bút (CC) (`nhuan_but_cc`) hiển thị và lưu thành công trên UI modal.
- Đảm bảo nhãn hiệu suất cơ chế đổi tên thành "HS chấm job" đồng bộ trên UI.
- Đảm bảo tính toán tổng Target/Tổng thu nhập dự kiến cộng dồn chính xác Nhuận bút (CC) tại trang chi tiết.
- Đảm bảo tính tương thích ngược khi import/restore snapshot với cả header mới và cũ.

## 2. Tiền điều kiện

- Tài khoản có quyền sửa lương (EA) và tài khoản SuperAdmin (SA).
- Có dữ liệu nhân viên để chỉnh sửa và file Excel snapshot để restore.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Mở Modal sửa lương (SalaryEditModal) của nhân sự, nhập Nhuận bút (CC) và Lưu. | Lưu nháp thành công trường `nhuan_but_cc` vào DB. |
| HP-02 | Xem trang chi tiết nhân sự, kiểm tra bảng breakdown cơ cấu lương. | Hiển thị hàng "4. Nhuận bút (CC)" với giá trị chính xác và tổng thu nhập tính đúng. |
| HP-03 | Đổi nhãn trong bảng chi tiết lương và danh sách nhân sự. | Hiển thị `"3. HS chấm job"` ở bảng breakdown và `"Thưởng hiệu suất chấm job"` khi xuất Excel danh sách. |
| HP-04 | Import snapshot chứa header mới `"Thưởng hiệu suất chấm job CC"`. | Import preview thành công, map đúng giá trị vào `thuong_hieu_suat_cham_job_nhuan`. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Import snapshot chứa header cũ `"Thưởng hiệu suất/chấm job/nhuận CC"`. | Hỗ trợ tương thích ngược, map đúng giá trị và không bị ghi đè null khi cột alias khác vắng mặt. |
| RG-02 | Giao diện hiển thị cảnh báo tự động gán lương chưa phân loại. | Hiển thị alert warning chứa tên nhãn mới `"HS chấm job"`. |

## 5. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Tài khoản Viewer (VI) truy cập trang chi tiết nhân sự. | Ẩn toàn bộ giá trị tiền lương ở breakdown cơ cấu lương (masking) để giữ bảo mật. |
