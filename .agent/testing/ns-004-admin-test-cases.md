# Test Cases: Admin Dashboard Regression

> Phạm vi: Các lỗi bảo mật và lỗi nghiệp vụ nghiêm trọng vừa được khắc phục sau merge.
> Ngày cập nhật: 2026-04-02

---

## 1. Bảo mật (Security & Route Guard)

### TC-ADM-001: Chặn truy cập Dashboard cho Non-SA
- **Mục tiêu**: Đảm bảo user không phải Super Admin không thể vào Admin Shell.
- **Tiền điều kiện**: 
    - User A có quyền EA (Expert Admicro).
    - User A không nằm trong bảng `superadmins`.
- **Các bước thực hiện**:
    1. Đăng nhập với User A.
    2. Gõ trực tiếp URL `/admin/dashboard` vào trình duyệt.
- **Kết quả mong đợi**: 
    - Hệ thống redirect về trang `/403-access-denied`.
    - Không hiển thị Sidebar menu "Phân quyền hệ thống".

---

## 2. Nghiệp vụ (Bulk Operations)

### TC-ADM-002: Thao tác Gỡ bỏ người soát xét (Bulk Remove)
- **Mục tiêu**: Đảm bảo thao tác gỡ quyền hàng loạt không yêu cầu Reviewer đích.
- **Tiền điều kiện**: 
    - User đã được gán ít nhất một người soát xét.
- **Các bước thực hiện**:
    1. Vào Admin Dashboard -> Thao tác hàng loạt.
    2. Chọn Hành động: **Gỡ bỏ (Remove)**.
    3. Chọn Reviewer nguồn.
    4. Chọn các nhân sự muốn gỡ.
    5. Nhấn **Kiểm tra (Preview)**.
    6. Nhấn **Thực thi**.
- **Kết quả mong đợi**: 
    - Nút Preview không bị disable khi không nhập target.
    - API Preview trả về danh sách hợp lệ.
    - Thao tác Thực thi thành công (HTTP 200).

---

## 3. Nhật ký (Audit Log)

### TC-ADM-003: Tìm kiếm Actor Email theo chuỗi một phần
- **Mục tiêu**: Đảm bảo filter không bắt buộc format email đầy đủ.
- **Mô tả**: UI cho phép nhập "admin" thay vì "admin@vcc.vn".
- **Các bước thực hiện**:
    1. Vào Admin Dashboard -> Nhật ký hệ thống.
    2. Nhập "admin" vào ô lọc Actor Email.
    3. Nhấn Lọc.
- **Kết quả mong đợi**: 
    - Danh sách log hiển thị các hành động của admin@vcc.vn.
    - Không có lỗi validation schema (400 Bad Request).

---

## 4. Kiểm soát lỗi (Error Handling)

### TC-ADM-004: Bộ lọc Mismatch tại tab Người soát xét
- **Mục tiêu**: Verify tính năng lọc chỉ hiện nhân sự bị lệch quyền.
- **Các bước thực hiện**:
    1. Vào Admin Dashboard -> Người soát xét.
    2. Check vào ô **"Chỉ hiện Mismatch"**.
- **Kết quả mong đợi**: 
    - Danh sách chỉ giữ lại các dòng có tag "Mismatch" đỏ.
    - Bỏ check -> danh sách quay lại đầy đủ.

### TC-ADM-005: Hiển thị Toast lỗi khi gán trùng (Conflict)
- **Mục tiêu**: Verify UI không crash và hiện Toast đỏ khi có lỗi logic.
- **Các bước thực hiện**:
    1. Tìm một cặp NS + Reviewer đã được gán (dòng có sẵn trong bảng).
    2. Nhấn "Gán người soát xét", nhập lại đúng mã NS và Email đó.
    3. Nhấn "Gán Reviewer".
- **Kết quả mong đợi**: 
    - Modal không đóng ngay lập tức.
    - Xuất hiện Toast thông báo màu đỏ (Lỗi: CONFLICT - ...) ở góc màn hình.
    - Không có lỗi đỏ "Internal Server Error" (500) trong DevTools Console.
