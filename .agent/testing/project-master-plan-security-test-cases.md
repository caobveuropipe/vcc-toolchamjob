# Test Cases: Bảo mật & Logic Snapshot (Hardening)
> Ngày tạo: 2026-03-13
> Liên quan đến: Project Master Plan Security Review

## Phân loại Test

| # | Loại | Use Case | Steps | Kết quả mong đợi | Mức ưu tiên |
|---|------|----------|-------|-------------------|-------------|
| 1 | 🔒 Security | Chống vét dữ liệu (Global Rate Limit) | Dùng script gọi liên tiếp 100 API request trong 10 giây | Hệ thống trả về lỗi 429 sau khi vượt ngưỡng | 🔴 Cao |
| 2 | 🔒 Security | Chống xem trộm lương (IDOR) | Login user VI, thử gọi API chi tiết lương của một UUID nhân sự khác khối | System trả về 403 hoặc 404 (Không tìm thấy/Không có quyền) | 🔴 Cao |
| 3 | ✅ Happy Path | Unlock và Re-lock (Undo) | SA Unlock snapshot -> EA bấm Chốt lại ngay mà không sửa gì | Dữ liệu cũ được giữ nguyên, không cần chạy workflow backup/xóa/copy | 🟡 Trung bình |
| 4 | ✅ Happy Path | Rechốt dữ liệu mới | SA Unlock -> EA sửa dữ liệu bảng chính -> EA bấm "Xác nhận Rechốt" | Bản backup cũ được đẩy lên GCS, bản snapshot hiện tại được cập nhật mới nhất | 🔴 Cao |
| 5 | 🔒 Security | Kiểm tra Security Headers | Inspect browser / Dùng curl -I trên URL FE & BE | Header phải chứa HSTS, X-Frame-Options: DENY, X-Content-Type: nosniff | 🟡 Trung bình |
| 6 | 🔒 Security | Secret Manager Leak Test | Cố tình gây lỗi code BE để throw exception | Error response không được chứa nội dung của AWS_SERVICE_ROLE_KEY hoặc các biến env nhạy cảm | 🔴 Cao |
| 7 | 🔒 Security | VI response không chứa salary | Gọi API với user VI | Response chỉ có employee fields, không có các cột lương/thưởng | 🔴 Cao |
| 8 | 🔒 Security | VI bị chặn snapshot | Truy cập route /api/snapshots với user VI | 403 Forbidden, không lộ metadata snapshot | 🔴 Cao |
| 9 | 🔒 Security | VI Change History ẩn salary | Xem lịch sử thay đổi với user VI | Lịch sử chỉ hiện employee fields, ẩn các record salary | 🔴 Cao |
| 10 | ⚠️ Edge Case | Redis down -> fallback DB | Giả lập Redis lỗi/timeout | Middleware vẫn check quyền đúng từ DB, không bypass | 🔴 Cao |
| 11 | ⚠️ Edge Case | CI bắt cột salary mới | Thêm cột DB mà quên update Shared Constant | Build fail, bắt buộc developer đồng nhất danh sách field | 🟡 Trung bình |
| 12 | ❌ Negative | VI DevTools gọi snapshot | Dùng fetch() gọi thẳng API snapshot | 403 Forbidden, bảo mật ở mức API chứ không chỉ ẩn menu UI | 🔴 Cao |
| 13 | 🔒 Security | View employee_info_only verify | Query trực tiếp view employee_info_only | View không chứa bất kỳ cột join nào từ bảng salaries | 🔴 Cao |

## Chi tiết từng Use Case

### UC-1: Chống vét dữ liệu (🔒 Security)
- **Precondition:** User đã đăng nhập.
- **Given:** Hệ thống đang chạy với Rate Limit 100 req/min.
- **When:** User dùng Postman Runner hoặc Script gọi API `/api/employees` 101 lần liên tiếp.
- **Then:** Request thứ 101 nhận mã 429 Too Many Requests. Ghi log `api_blocked`.

### UC-2: Chống xem trộm qua ID (🔒 Security)
- **Precondition:** User A có quyền VI (xem info) khối Admicro. Nhân sự B thuộc khối KND.
- **Given:** User A biết UUID của nhân sự B.
- **When:** User A gọi `GET /api/employees/{uuid_nhan_su_B}`.
- **Then:** Backend kiểm tra quyền khối của B -> Không có quyền -> Trả về 403. Ghi log `access_denied`.

### UC-3: Rechốt với GCS Backup (✅ Happy Path)
- **Precondition:** Snapshot tháng 3 Khối A đã có data cũ.
- **Given:** Trạng thái snapshot là `draft`.
- **When:** EA bấm Chốt lại.
- **Then:** 
    1. Một file backup JSON/XLSX được upload lên GCS bucket.
    2. Data cũ bị xóa khỏi `snapshot_employees`.
    3. Data mới nhất từ `employees` được copy vào.
    4. Trạng thái chuyển sang `locked`.

### UC-7: VI response không chứa salary (🔒 Security)
- **Precondition:** User có quyền VI trên khối Admicro.
- **Given:** Khối Admicro có NS với đầy đủ dữ liệu lương.
- **When:** User VI gọi `GET /api/employees?khoi=Admicro`.
- **Then:** Response chứa thông tin nhân sự nhưng tuyệt đối không có các field `luong_*`, `thuong_*`, `lcd_*`, `nhuan_but_*`, `okr_*`.

### UC-8: VI bị chặn snapshot (🔒 Security)
- **Precondition:** User VI trên khối Admicro. Snapshot tháng 3 Admicro tồn tại.
- **Given:** User VI đã login.
- **When:** Gọi `GET /api/snapshots?khoi=Admicro`.
- **Then:** Trả về 403 Forbidden. Kiểm tra Audit Log thấy action `access_denied`.

### UC-9: VI Change History ẩn salary (🔒 Security)
- **Precondition:** EA vừa sửa lương của một nhân sự.
- **Given:** User VI xem lịch sử thay đổi của nhân sự đó.
- **When:** Gọi API lấy history.
- **Then:** Các record có `field_changed` thuộc danh sách lương (SALARY_FIELDS) phải bị loại bỏ ở Backend trước khi trả về FE.

### UC-10: Redis down -> fallback DB (⚠️ Edge Case)
- **Precondition:** Hệ thống Redis không khả dụng.
- **Given:** User thực hiện một thao tác yêu cầu check quyền.
- **When:** Middleware gặp lỗi kết nối Redis.
- **Then:** Hệ thống tự động query trực tiếp vào DB bảng `user_permissions` / `superadmins`. Thao tác của User vẫn diễn ra đúng quyền.

### UC-11: CI bắt cột salary mới (⚠️ Edge Case)
- **Precondition:** Developer thêm cột mới vào bảng `salaries` nhưng chưa cập nhật `packages/shared/constants/salary-fields.ts`.
- **Given:** Chạy quy trình CI/CD.
- **When:** Chạy Unit Test kiểm tra sự đồng nhất giữa DB và Constant.
- **Then:** Test fail, đưa ra cảnh báo yêu cập cập nhật Shared Constant.

### UC-12: VI DevTools gọi snapshot (❌ Negative)
- **Precondition:** User VI đăng nhập, menu UI đã bị ẩn.
- **Given:** User lấy token từ browser và dùng script gọi API snapshot.
- **When:** `fetch('/api/snapshots/...')`.
- **Then:** API trả về 403 Forbidden. Khẳng định bảo mật đa lớp (lớp API).

### UC-13: View employee_info_only verify (🔒 Security)
- **Precondition:** DB schema v2.4.0.
- **Given:** Người quản trị kiểm tra cấu trúc view.
- **When:** `SELECT * FROM employee_info_only`.
- **Then:** Chỉ thấy 24 trường thông tin cơ bản, không có cột nào join từ bảng salaries.
