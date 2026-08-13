# Test Cases - Kiểm tra Ràng buộc Khu vực (Khu vuc Enum)

> Tạo ngày: 2026-03-31
> Phạm vi: Feature (DB Layer + Frontend Layer)

---

## 1. Mục tiêu kiểm thử

- Đảm bảo trường `khu_vuc` chỉ chấp nhận giá trị 'HN' hoặc 'HCM' theo đúng Migration 004.
- Đảm bảo Frontend hiển thị Dropdown (Select) và validate đúng trước khi gửi lên API.
- Đảm bảo Backend trả về lỗi 500/400 nếu dữ liệu vi phạm database check constraint (safety net).

## 2. Tiền điều kiện

- Database đã chạy migration `004_add_pending_changes.sql` (chứa `check_khu_vuc_enum`).
- Đã build package `@vcc/shared` mới nhất chứa enum `KHU_VUC_VALUES`.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Mở Employee Form (Tạo mới/Sửa) | Trường "Khu vực" hiển thị dưới dạng Select với 2 options: 'HN' và 'HCM'. |
| HP-02 | Chọn 'HN' và lưu | Lưu thành công vào DB, cột `khu_vuc` có giá trị 'HN'. |
| HP-03 | Chọn 'HCM' và lưu | Lưu thành công vào DB, cột `khu_vuc` có giá trị 'HCM'. |

## 4. Negative Cases (Safety Net)

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Dùng Postman gửi POST `/api/employees` với `khu_vuc: "DA NANG"` | Backend trả về lỗi (Database check violation). |
| NG-02 | Dùng Postman gửi POST `/api/employees` với `khu_vuc: "Hà Nội"` (full text) | Backend trả về lỗi (Phải là 'HN'). |

## 5. Security / Consistency

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Kiểm tra snapshot tháng (`snapshot_employees`) | Giá trị 'HN'/'HCM' được copy nguyên vẹn và cũng bị ép kiểm enum tương tự. |
