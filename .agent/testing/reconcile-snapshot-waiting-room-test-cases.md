# Test Cases - Ngăn chặn duyệt phòng chờ khi chưa chốt snapshot kỳ trước

> Tạo ngày: 2026-07-18
> Liên kết feature: `reconcile-snapshot-waiting-room`
> Phạm vi: Feature / Integration / Database rules

---

## 1. Mục tiêu kiểm thử

- Đảm bảo người dùng không thể duyệt (submit) nhân sự từ phòng chờ ra chính thức/nghỉ việc nếu kỳ lương tháng trước đó của khối chưa được chốt snapshot (`locked`).
- Xác minh quy tắc phân chia kỳ lương dựa trên mốc ngày hiệu lực (ngày 25 thuộc kỳ hiện tại, ngày 26 thuộc kỳ lương tháng sau).
- Kiểm tra tính ổn định và tính đúng đắn của logic fallback ngày điều chỉnh lương từ profile khi payload submit lương bị khuyết trường này.

## 2. Tiền điều kiện

- Database Supabase đã chạy migration `043_prevent_submit_without_prior_snapshot.sql` cập nhật hàm `submit_employee_pending`.
- Tài khoản thực hiện thao tác submit có quyền hợp lệ (EA thuộc khối tương ứng hoặc Super Admin).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Thực hiện `submit` nhân sự với ngày hiệu lực trong kỳ lương $M$ khi snapshot kỳ $M-1$ của khối đó đã được chốt (`locked`). | Hệ thống phê duyệt thành công, chuyển nhân sự ra khỏi phòng chờ và áp dụng các thông tin mới vào bảng live. |
| HP-02 | Gửi payload cập nhật lương khuyết `ngay_dieu_chinh_luong` của nhân sự đã có `ngay_dieu_chinh_luong` trên profile chính thức. | Hệ thống fallback và lấy ngày hiệu lực trên profile chính thức để xác định kỳ lương và thực hiện kiểm tra snapshot kỳ trước thành công. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | **Boundary check 25**: Duyệt thay đổi có ngày hiệu lực là ngày 25 (ví dụ `2026-07-25`). Kỳ lương tương ứng là tháng 7, kỳ trước cần check là tháng 6. | Hệ thống kiểm tra snapshot tháng 6 đã chốt và duyệt thành công. |
| RG-02 | **Boundary check 26**: Duyệt thay đổi có ngày hiệu lực là ngày 26 (ví dụ `2026-07-26`). Kỳ lương tương ứng chuyển sang tháng 8, kỳ trước cần check là tháng 7. | Hệ thống kiểm tra snapshot tháng 7 chưa chốt và chặn duyệt (nếu tháng 7 chưa chốt). |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Thực hiện `submit` nhân sự có ngày hiệu lực thuộc kỳ lương tháng $M$ khi snapshot kỳ $M-1$ mới chỉ ở trạng thái nháp (`draft`) hoặc chưa tồn tại. | Giao dịch bị rollback, DB trả về mã lỗi ngoại lệ cảnh báo kỳ lương trước của khối chưa chốt snapshot. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Sử dụng tài khoản EA thuộc khối khác để thực hiện submit nhân sự của khối Admicro. | Yêu cầu bị chặn ngay từ API gateway với lỗi `403` hoặc `404` do chính sách phân quyền phân cấp. |
| SC-02 | Tài khoản Super Admin gọi API submit nhân sự không có người nghiệm thu mà không truyền cờ `khong_co_nnt: true`. | Yêu cầu bị chặn với mã lỗi `400` do vi phạm cấu trúc schema submit bắt buộc. |

## 7. Ghi chú regression

- Cần kiểm tra lại toàn bộ quy trình chốt snapshot hàng tháng (`create_monthly_snapshot`) để đảm bảo không bị ảnh hưởng bởi logic chặn duyệt mới này.
