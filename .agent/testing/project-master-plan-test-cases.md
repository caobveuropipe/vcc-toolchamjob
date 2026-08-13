# Test Cases: Security & Monthly Snapshot v2.3.0
> Ngày tạo: 2026-03-13
> Liên quan đến: SEC-01→05, SNAP-01→04 (Schema v2.3.0)

## Phân loại Test

| # | Loại | Use Case | Steps | Kết quả mong đợi | Mức ưu tiên |
|---|------|----------|-------|-------------------|-------------|
| 1 | 🔒 Security | Truy cập anon key trực tiếp | Dùng `anon_key` gọi REST API Supabase vào bảng `audit_log` hoặc `user_permissions`. | Trả về rỗng hoặc 403 (RLS chặn). | 🔴 Cao |
| 2 | ✅ Happy Path | Tạo snapshot tháng | EA gọi `create_monthly_snapshot` cho tháng 03/2026. | Tạo thành công bản ghi `draft`, copy đúng NS. | 🔴 Cao |
| 3 | ⚠️ Edge Case | NS nghỉ việc khác tháng | Có NS nghỉ việc tháng 02/2026. Tạo snapshot tháng 03/2026. | NS đó KHÔNG có trong snapshot tháng 3. | 🟡 Trung bình |
| 4 | ⚠️ Edge Case | NS nghỉ việc đúng tháng | Có NS nghỉ việc tháng 03/2026. Tạo snapshot tháng 03/2026. | NS đó CÓ trong snapshot tháng 3. | 🔴 Cao |
| 5 | ❌ Negative | Chốt lại snapshot đã lock | Gọi API lock cho một snapshot đang có status `locked`. | Trả về lỗi `STATE_ERROR`. | 🟡 Trung bình |
| 6 | 🔄 Workflow | Rechốt (Re-lock) | SA Unlock → EA sửa data → EA bấm Chốt lại. | Backup data cũ gửi Telegram → Xóa data cũ → Copy data mới → Lock. | 🔴 Cao |

## Chi tiết từng Use Case

### UC-1: Chặn truy cập anon key (🔒 Security)
- **Precondition:** Website production có SUPABASE_ANON_KEY công khai.
- **Given:** Attacker dùng tool query thẳng PostgREST API.
- **When:** `GET /employees` hoặc `GET /salaries`.
- **Then:** Supabase trả về empty list `[]` do RLS `USING(false)`.

### UC-4: NS nghỉ việc đúng tháng (⚠️ Edge Case)
- **Precondition:** Nhân sự A có `ngay_nghi_viec` = `2026-03-15`.
- **Given:** EA tạo snapshot cho tháng `2026-03`.
- **When:** Thực hiện chạy function `create_monthly_snapshot`.
- **Then:** Nhân sự A được copy vào `snapshot_employees` với `trang_thai` = `nghi_viec`.

### UC-6: Rechốt (🔄 Workflow)
- **Precondition:** Snapshot tháng 03/2026 đang trạng thái `locked`.
- **Given:** SA đã gõ lệnh Unlock chuyển về `draft`. EA sửa lương NS B.
- **When:** EA bấm "Chốt" lần nữa.
- **Then:** 
  1. System backup data cũ sang Telegram.
  2. Data cũ bị xóa.
  3. Data mới (có lương NS B mới) được copy vào.
  4. Status chuyển sang `locked`.
