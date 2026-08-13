# Test Cases - API Backend Lấy Snapshot Chi Tiết Nhân Sự và Lương Target

> Tạo ngày: 2026-07-25
> Liên kết feature: `api-thongtin-snapshot-chitiet`
> Phạm vi: Endpoint GET `/api/snapshots/employees-detail`

---

## 1. Mục tiêu kiểm thử

- Đảm bảo API trả về danh sách nhân sự của tháng snapshot mong muốn với đúng cấu trúc payload (12 trường dữ liệu).
- Đảm bảo chỉ những đợt chốt hợp lệ (`snapshot_status != 'deleted'`) mới được hiển thị thông tin nhân sự.
- Kiểm tra tính xác thực API thông qua `x-api-key`.

## 2. Tiền điều kiện

- Môi trường database đã seed dữ liệu snapshot và nhân sự của kỳ tương ứng (ví dụ: `2026-06`).
- Giá trị API key khớp với `INTERNAL_API_KEY` (hoặc fallback `testkey12345678` ở development).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Gọi `GET /api/snapshots/employees-detail?thang=T6.2026` kèm header `x-api-key: testkey12345678` | Trả về mã HTTP 200 và danh sách nhân sự có đủ 12 trường: `thang`, `ma_nhan_su`, `ho_va_ten`, `email`, `khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su`, `luong_target_gt`, `luong_target_cc`. |
| HP-02 | Truyền query param dạng zero-padding (`thang=T06.2026`) | Trả về mã HTTP 200 và danh sách nhân sự đã được chuẩn hóa trường `thang` trong payload thành dạng `T6.2026`. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Gọi API cho tháng không tồn tại trong hệ thống (`thang=T11.2026`) | Trả về mã HTTP 200 kèm `{ data: [] }` (không trả về lỗi 404). |
| RG-02 | Gọi API cho tháng có snapshot ở trạng thái `deleted` | Trả về mã HTTP 200 kèm `{ data: [] }`. Dữ liệu nhân sự của snapshot đã xóa không xuất hiện trong payload. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Gọi API thiếu query parameter `thang` | Trả về mã HTTP 400 Bad Request kèm thông báo thiếu tham số `thang`. |
| NG-02 | Gọi API truyền sai định dạng tháng (ví dụ: `thang=2026-06` hoặc `thang=T13.2026`) | Trả về mã HTTP 400 Bad Request kèm thông báo định dạng tháng không hợp lệ. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Gọi API không truyền header `x-api-key` hoặc truyền sai key | Trả về mã HTTP 401 Unauthorized. |
