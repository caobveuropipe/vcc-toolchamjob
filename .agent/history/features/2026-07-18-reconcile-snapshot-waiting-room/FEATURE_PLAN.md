# Feature Plan: Khắc phục sự vụ chốt Snapshot tháng 6 và chặn Submit phòng chờ khi chưa chốt tháng trước

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: reconcile-snapshot-waiting-room
> **Tạo bởi**: expert-rebuttal (Sửa đổi theo Expert Review Round 7)
> **Ngày tạo**: 2026-07-18

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** HR đang chuẩn bị chốt snapshot kỳ lương tháng 6.26 (từ 26.5.2026 đến 25.6.2026) cho khối Admicro. Tuy nhiên, có 3 nhân sự trong phòng chờ (waiting room) có các thay đổi/ngày phát sinh thuộc kỳ lương tháng 7 (từ 26.6.2026 đến 25.7.2026) đã lỡ được submit (phê duyệt) vào Danh sách nhân sự chính thức ngày 17/7.
- **Vấn đề cần giải quyết:** 
  1. *Sự vụ (Ad-hoc)*: Khi chốt snapshot tháng 6.26, 3 nhân sự này sẽ không được chốt theo "vết cũ" chính xác của họ (Bảo Châu bị áp lương mới của tháng 7, còn Xuân Quỳnh và Hồng Liên bị mất hẳn khỏi snapshot tháng 6 do trang_thai = 'nghi_viec' và ngay_nghi_viec = 26.6.2026 nằm ngoài kỳ tháng 6).
  2. *Lâu dài (Preventive)*: Chưa có cơ chế chặn submit từ phòng chờ nếu kỳ lương của tháng liền trước chưa được chốt snapshot hoàn toàn.
- **Mục tiêu:** 
  - Khôi phục chuẩn trạng thái chờ duyệt (pending state) ban đầu của 3 nhân sự trong phòng chờ. HR sẽ tự thực hiện chốt snapshot tháng 6.26 qua giao diện/API (lúc này snapshot tự động lấy live old values chuẩn xác), sau đó mới duyệt lại (submit) họ ra khỏi phòng chờ.
  - Xây dựng rule chặn cứng ở hàm DB `submit_employee_pending` không cho phép submit từ phòng chờ nếu kỳ lương tháng trước đó chưa ở trạng thái `locked`.

### Thông tin 3 nhân sự cần xử lý:
1. `112470` Nguyễn Ngọc Xuân Quỳnh - Nghỉ việc 26.6.2026 (Đã submit sang `nghi_viec` ngày 17/7).
2. `100230` Hà Thị Hồng Liên - Nghỉ việc 26.6.2026 (Đã submit sang `nghi_viec` ngày 17/7).
3. `107198` Nguyễn Thị Bảo Châu - Có điều chỉnh lương hiệu lực 6.7.2026 (Lương mới: 12,079,000, Lương cũ: 7,370,000. Đã submit ngày 17/7).

---

## 2. Phạm vi

### In scope
- Thực hiện chạy script SQL khôi phục trạng thái chờ duyệt trong phòng chờ (Undo Submit) của 3 nhân sự.
- Thêm rule check prior-period lock trong DB function `submit_employee_pending`.
- Tải lại schema cache PostgREST sau migration.
- Bổ sung integration tests bao phủ.

### Out of scope
- Sửa đổi lại logic tính kỳ lương gốc (26 tháng trước -> 25 tháng này).

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `Snapshot Lifecycle — Tái sử dụng Row, Không Hard-delete`: Giữ nguyên.
  - `Anti-drift Guard Pattern — DB-side Lock Check`: Giữ nguyên check `is_period_locked(v_check_date, v_k)`. Logic mới là kiểm tra bổ sung (prior-period lock check) đặt bên cạnh, không thay thế check cũ.
- **"Cấm kỵ" cần tránh:**
  - Không phá vỡ check `is_period_locked` hiện tại.
  - Không thay đổi thủ công bảng `snapshot_employees` để tránh sai lệch audit trail.
  - Tôn trọng Hybrid Security: 100% bảng phụ trợ/tạm thời lưu dữ liệu lương nhạy cảm phải bật RLS và cấu hình Policy `USING(false)` (chặn truy cập trực tiếp từ client).

---

## 4. Giả định và câu hỏi mở

### Giả định
- Kỳ lương được tính nhất quán từ 26 tháng trước đến 25 tháng này. Các ngày $\ge 26$ thuộc kỳ lương tháng sau. Các ngày $\le 25$ thuộc kỳ lương tháng hiện tại.
- 3 nhân sự Quỳnh, Liên, Châu đều thuộc khối `Admicro`.

---

## 5. Acceptance Criteria

- [ ] 3 nhân sự (Quỳnh, Liên, Châu) quay trở lại phòng chờ (`state_phong_cho = true`) với đầy đủ payload pending cũ chính xác.
- [ ] Dữ liệu live của 3 nhân sự quay trở về trạng thái cũ hợp lệ trước khi được duyệt ngày 17/7.
- [ ] Có ghi nhận vết `audit_log` chi tiết cho hành động chạy script Undo Submit và dọn dẹp lịch sử (Dùng action `update`, module `NS-003` và `details.type = 'reconcile_undo_submit'`).
- [ ] Snapshot tháng 6.26 (period 2026-05-26 -> 2026-06-25) của khối `Admicro` không bị block bởi 3 nhân sự này, được tạo và **khóa (locked)** thành công với đúng dữ liệu cũ.
- [ ] Sau khi chốt snapshot tháng 6.26, HR thực hiện duyệt lại (submit) 3 nhân sự thành công. Hệ thống tự cập nhật live data và tạo `change_history`/`audit_log` tự nhiên thông qua hàm `submit_employee_pending`.
- [ ] Hàm `submit_employee_pending` chặn thành công việc submit nhân sự có ngày hiệu lực ở kỳ $M$ nếu kỳ $M-1$ của khối đó chưa được lock snapshot.

---

## 6. Runbook chi tiết xử lý sự vụ (Undo Submit về phòng chờ)

### Bước 1: Tạo Backup Tables An Toàn (Đảm bảo Idempotent & Không ghi đè khi Rerun)
Chạy script SQL để khởi tạo các bảng backup (bật RLS đầy đủ và kiểm tra dữ liệu cũ để tránh ghi đè khi chạy lại sau partial failure):

```sql
BEGIN;

-- 1. Tạo bảng backup tạm thời cho thông tin Live nếu chưa có
CREATE TABLE IF NOT EXISTS temp_payroll_backup_626 (
    ma_nhan_su VARCHAR(20) PRIMARY KEY,
    employee_id UUID,
    employee_trang_thai VARCHAR(20),
    employee_ngay_nghi_viec DATE,
    employee_ngay_dieu_chinh_luong DATE,
    salary_id UUID,
    luong_cb NUMERIC(15,0),
    luong_target_cc NUMERIC(15,0),
    luong_target_gt NUMERIC(15,0),
    lcd_gt NUMERIC(15,0),
    luong_hieu_suat_gt NUMERIC(15,0),
    thuong_doanh_so_gt NUMERIC(15,0),
    thuong_kpi_m1 NUMERIC(15,0),
    thuong_doanh_so_m1 NUMERIC(15,0),
    thuong_doanh_so_m2 NUMERIC(15,0),
    thuong_doanh_so_m3 NUMERIC(15,0),
    thuong_hieu_suat_cham_job_nhuan NUMERIC(15,0)
);
ALTER TABLE temp_payroll_backup_626 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block all direct access" ON temp_payroll_backup_626;
CREATE POLICY "Block all direct access" ON temp_payroll_backup_626 USING (false) WITH CHECK (false);

-- 2. Tạo bảng backup tạm thời cho Change History sẽ bị xóa nếu chưa có
CREATE TABLE IF NOT EXISTS temp_history_backup_626 (
    id INT PRIMARY KEY,
    ma_nhan_su VARCHAR(20),
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT,
    changed_at TIMESTAMPTZ,
    reason TEXT,
    document_id UUID
);
ALTER TABLE temp_history_backup_626 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block all direct access" ON temp_history_backup_626;
CREATE POLICY "Block all direct access" ON temp_history_backup_626 USING (false) WITH CHECK (false);

-- 3. Chỉ backup thông tin live nếu bảng backup chưa có dữ liệu (tránh ghi đè dữ liệu cũ khi rerun)
INSERT INTO temp_payroll_backup_626 (
    ma_nhan_su, employee_id, employee_trang_thai, employee_ngay_nghi_viec, employee_ngay_dieu_chinh_luong,
    salary_id, luong_cb, luong_target_cc, luong_target_gt, lcd_gt, luong_hieu_suat_gt,
    thuong_doanh_so_gt, thuong_kpi_m1, thuong_doanh_so_m1, thuong_doanh_so_m2, thuong_doanh_so_m3,
    thuong_hieu_suat_cham_job_nhuan
)
SELECT 
    e.ma_nhan_su, e.id, e.trang_thai, e.ngay_nghi_viec, e.ngay_dieu_chinh_luong,
    s.id, s.luong_cb, s.luong_target_cc, s.luong_target_gt, s.lcd_gt, s.luong_hieu_suat_gt,
    s.thuong_doanh_so_gt, s.thuong_kpi_m1, s.thuong_doanh_so_m1, s.thuong_doanh_so_m2, s.thuong_doanh_so_m3,
    s.thuong_hieu_suat_cham_job_nhuan
FROM employees e
LEFT JOIN salaries s ON e.id = s.employee_id
WHERE e.ma_nhan_su IN ('112470', '100230', '107198')
  AND NOT EXISTS (SELECT 1 FROM temp_payroll_backup_626);

-- 4. Chỉ backup change history nếu bảng history backup chưa có dữ liệu
INSERT INTO temp_history_backup_626 (id, ma_nhan_su, field_changed, old_value, new_value, changed_by, changed_at, reason, document_id)
SELECT id, ma_nhan_su, field_changed, old_value, new_value, changed_by, changed_at, reason, document_id 
FROM change_history 
WHERE ma_nhan_su IN ('112470', '100230', '107198') 
  AND changed_at >= '2026-07-17T07:00:00+00:00'
  AND NOT EXISTS (SELECT 1 FROM temp_history_backup_626);

COMMIT;

-- 5. Verify số lượng dòng backup (Phải ra đúng 3 dòng và history > 0)
SELECT COUNT(*) FROM temp_payroll_backup_626;
SELECT COUNT(*) FROM temp_history_backup_626;
```

### Bước 2: Thực hiện Undo Submit (Đưa về phòng chờ và khôi phục vết cũ)
Chạy script SQL để khôi phục live data cũ của 3 nhân sự, chuyển họ về trạng thái chờ duyệt, nạp lại payload thay đổi gốc vào `pending_changes`, và ghi nhận vết Audit Log hợp lệ (sử dụng action `'update'` để tránh vi phạm CHECK constraint):

```sql
BEGIN;

-- 1. Undo cho Quỳnh (112470) và Liên (100230):
-- Revert live về 'dang_lam' (hợp lệ check constraint), xóa ngay_nghi_viec, bật state_phong_cho
-- Nạp pending_changes để báo nghỉ việc
UPDATE employees 
SET trang_thai = 'dang_lam', 
    ngay_nghi_viec = NULL, 
    state_phong_cho = true, 
    pending_changes = '{"trang_thai": "nghi_viec", "ngay_nghi_viec": "2026-06-26"}'::JSONB
WHERE ma_nhan_su IN ('112470', '100230');

-- 2. Undo cho Bảo Châu (107198):
-- Revert employees live ngay_dieu_chinh_luong về cũ, bật state_phong_cho, nạp employee pending_changes
UPDATE employees 
SET ngay_dieu_chinh_luong = '2021-12-26', 
    state_phong_cho = true, 
    pending_changes = '{"ngay_dieu_chinh_luong": "2026-07-06"}'::JSONB
WHERE ma_nhan_su = '107198';

-- Revert salaries live về lương cũ, nạp salaries pending_changes với các giá trị điều chỉnh mới
UPDATE salaries 
SET luong_cb = 6700000, 
    luong_target_cc = 7370000, 
    luong_target_gt = 7370000, 
    lcd_gt = 6000000, 
    luong_hieu_suat_gt = 670000, 
    thuong_doanh_so_gt = 700000, 
    thuong_kpi_m1 = 670000, 
    thuong_doanh_so_m1 = NULL, 
    thuong_doanh_so_m2 = NULL, 
    thuong_doanh_so_m3 = NULL, 
    thuong_hieu_suat_cham_job_nhuan = NULL,
    state_pending = true,
    pending_changes = '{
      "luong_cb": 8455300,
      "luong_target_cc": 12079000,
      "luong_target_gt": 12079000,
      "lcd_gt": 7000000,
      "luong_hieu_suat_gt": 3623700,
      "thuong_doanh_so_gt": 1455300,
      "thuong_doanh_so_m1": 2415800,
      "thuong_doanh_so_m2": 3623700,
      "thuong_doanh_so_m3": 4831600,
      "thuong_hieu_suat_cham_job_nhuan": 1207900,
      "ngay_dieu_chinh_luong": "2026-07-06"
    }'::JSONB
WHERE employee_id = (SELECT id FROM employees WHERE ma_nhan_su = '107198');

-- 3. Ghi audit log hợp lệ (dùng action = 'update' và chi tiết details.type = 'reconcile_undo_submit')
INSERT INTO audit_log (actor_email, module, action, target_ma_nhan_su, details)
VALUES 
(
    'admin-workaround@vcc.internal', 'NS-003', 'update', '112470',
    '{"type": "reconcile_undo_submit", "incident": "Undo submit back to waiting room", "backup_table": "temp_payroll_backup_626"}'::JSONB
),
(
    'admin-workaround@vcc.internal', 'NS-003', 'update', '100230',
    '{"type": "reconcile_undo_submit", "incident": "Undo submit back to waiting room", "backup_table": "temp_payroll_backup_626"}'::JSONB
),
(
    'admin-workaround@vcc.internal', 'NS-003', 'update', '107198',
    '{"type": "reconcile_undo_submit", "incident": "Undo submit back to waiting room", "backup_table": "temp_payroll_backup_626"}'::JSONB
);

COMMIT;
```

### Bước 3: Dọn dẹp change_history của đợt duyệt sai ngày 17/7
Xóa các bản ghi thay đổi sinh ra vào ngày 17/7 theo danh sách ID chính xác đã được backup ở Bước 1:
```sql
DELETE FROM change_history 
WHERE id IN (SELECT id FROM temp_history_backup_626);
```

### Bước 4: Kiểm tra và Verify trước khi bàn giao
Chạy SQL sau đây để verify xem 3 nhân sự đã nằm trong phòng chờ nhưng **KHÔNG** vướng ngày hiệu lực trong kỳ lương tháng 6.26 (nghĩa là check-block sẽ không chặn chốt snapshot tháng 6):
```sql
-- 1. Check xem có nhân sự nào trong 3 nhân sự vướng ngày hiệu lực của kỳ chốt tháng 6 (2026-05-26 -> 2026-06-25) không
SELECT ma_nhan_su, ho_va_ten 
FROM employees 
WHERE ma_nhan_su IN ('112470', '100230', '107198')
  AND state_phong_cho = true
  AND (
      (pending_changes->>'ngay_vao_cong_ty')::DATE BETWEEN '2026-05-26' AND '2026-06-25'
      OR (pending_changes->>'ngay_nghi_viec')::DATE BETWEEN '2026-05-26' AND '2026-06-25'
      OR (pending_changes->>'ngay_nghi_sinh')::DATE BETWEEN '2026-05-26' AND '2026-06-25'
      OR (pending_changes->>'ngay_ky_hd')::DATE BETWEEN '2026-05-26' AND '2026-06-25'
  );
-- Kết quả mong đợi: 0 dòng trả về (nghĩa là không vướng kỳ tháng 6).

-- 2. Tương tự kiểm tra lương pending của Bảo Châu
SELECT e.ma_nhan_su 
FROM employees e
JOIN salaries s ON e.id = s.employee_id
WHERE e.ma_nhan_su = '107198'
  AND e.state_phong_cho = true
  AND (s.pending_changes->>'ngay_dieu_chinh_luong')::DATE BETWEEN '2026-05-26' AND '2026-06-25';
-- Kết quả mong đợi: 0 dòng trả về.
```

### Bước 5: Bàn giao HR chốt Snapshot & Duyệt lại
1. HR thực hiện chốt và khóa (lock) snapshot tháng 6.26 cho khối `Admicro` qua giao diện.
2. HR thực hiện phê duyệt (submit) 3 nhân sự ra khỏi phòng chờ qua giao diện.
3. Sau khi xác nhận mọi thứ hoàn tất, dọn dẹp các bảng tạm:
```sql
DROP TABLE IF EXISTS temp_payroll_backup_626;
DROP TABLE IF EXISTS temp_history_backup_626;
```

---

## 7. Thiết kế giải pháp ngăn ngừa lâu dài (Preventive Rule)

Chúng ta sẽ tích hợp rule chặn ở tầng Database bên trong PostgreSQL function `submit_employee_pending`.

### Thuật toán xác định và kiểm tra kỳ lương trước:
1. Khi submit nhân sự, tìm tất cả các ngày hiệu lực phát sinh trong payload pending (`ngay_vao_cong_ty`, `ngay_nghi_viec`, `ngay_nghi_sinh`, `ngay_ky_hd`, `ngay_dieu_chinh_luong`).
2. Với mỗi ngày hiệu lực $D$:
   - Xác định kỳ lương tháng $M$ chứa ngày $D$:
     - Nếu ngày của $D \ge 26$, kỳ lương là tháng sau (Format: `YYYY-MM`).
     - Nếu ngày của $D \le 25$, kỳ lương là tháng hiện tại.
   - Tìm kỳ lương liền trước $M_{prev}$ bằng cách lấy mốc đầu tháng của $M$ trừ đi 1 tháng.
   - Kiểm tra xem đã tồn tại snapshot ở trạng thái `locked` cho khối (`khoi`) tương ứng của kỳ $M_{prev}$ chưa.
   - Nếu chưa tồn tại hoặc chưa `locked`, bắn Exception chặn không cho duyệt:
     `Không thể duyệt hồ sơ do kỳ lương tháng trước (M_prev) của khối (khoi) chưa được chốt snapshot!`

### Code SQL minh họa (tích hợp vào `submit_employee_pending`):
```sql
-- Kiểm tra kỳ lương tháng liền trước đã được chốt snapshot chưa
IF v_check_dates IS NOT NULL AND array_length(v_check_dates, 1) > 0 THEN
    FOREACH v_check_date IN ARRAY v_check_dates
    LOOP
        FOREACH v_k IN ARRAY v_check_khoi
        LOOP
            DECLARE
                v_target_month VARCHAR(7);
                v_prev_month VARCHAR(7);
                v_prev_locked BOOLEAN;
            BEGIN
                -- 1. Xác định kỳ lương hiện tại từ ngày hiệu lực (ngày >= 26 -> tháng sau, ngược lại -> tháng hiện tại)
                IF EXTRACT(DAY FROM v_check_date) >= 26 THEN
                    v_target_month := TO_CHAR(v_check_date + INTERVAL '1 month', 'YYYY-MM');
                ELSE
                    v_target_month := TO_CHAR(v_check_date, 'YYYY-MM');
                END IF;

                -- 2. Xác định kỳ lương liền trước của v_target_month
                v_prev_month := TO_CHAR((v_target_month || '-01')::DATE - INTERVAL '1 month', 'YYYY-MM');

                -- 3. Kiểm tra trạng thái snapshot kỳ liền trước (nếu là kỳ cũ và chưa lock)
                -- LƯU Ý: Chỉ check các kỳ từ tháng 6/2026 trở đi để tránh chặn các dữ liệu lịch sử cũ chưa từng có snapshot
                IF v_prev_month >= '2026-05' THEN
                    SELECT EXISTS (
                        SELECT 1 
                        FROM snapshots 
                        WHERE month = v_prev_month 
                          AND khoi = v_k
                          AND snapshot_status = 'locked'
                    ) INTO v_prev_locked;

                    IF NOT v_prev_locked THEN
                        RAISE EXCEPTION 'Không thể duyệt do kỳ lương tháng trước % của khối % chưa được chốt snapshot (locked)!', v_prev_month, v_k;
                    END IF;
                END IF;
            END;
        END LOOP;
    END LOOP;
END IF;
```

---

## 8. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/043_prevent_submit_without_prior_snapshot.sql` | Tạo mới | Di chuyển logic chặn submit vào database migration | 🟢 Thấp | Có |
| `submit_employee_pending` (DB function) | Sửa đổi | Thêm rule check snapshot kỳ trước | 🟡 Trung bình | Có |

---

## 9. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Tác động của `submit_employee_pending` đối với các luồng khác như chuyển khối (cần check snapshot của cả 2 khối nếu có thay đổi khối), hoặc submit không có thay đổi hiệu lực ngày (fallback về ngày live hiện tại).
- **Review focus areas:** Đảm bảo điều kiện check `v_prev_month >= '2026-05'` để tránh chặn các thay đổi trước khi hệ thống bắt đầu chốt snapshot.

---

## 10. Chiến lược triển khai

- **Phase 1: Xử lý sự vụ (Undo Submit)**: Thực hiện khôi phục trạng thái phòng chờ cho 3 nhân sự, sau đó bàn giao cho HR tự thực hiện chốt snapshot và duyệt lại qua giao diện.
- **Phase 2: Triển khai luật ngăn chặn (Preventive Rule)**:
  - Tạo migration `043_prevent_submit_without_prior_snapshot.sql` và chạy schema cache reload.
  - Chạy integration test kiểm thử logic chặn.

---

## 11. Test Strategy

### Automated tests:
- Viết integration test trong `backend/src/__tests__/integration/snapshots.test.ts` hoặc test suite riêng bao phủ:
  - Boundary: Submit pending ngày 25 (thuộc kỳ $M-1$) và 26 (thuộc kỳ $M$).
  - Lock check: Chặn submit vào kỳ $M$ nếu kỳ $M-1$ chưa `locked`.
  - Check multi-khoi: Khi đổi `khoi`, check cả 2 khối xem kỳ trước đã lock chưa.
  - Salary pending không có `ngay_dieu_chinh_luong` (lấy `ngay_dieu_chinh_luong` của employees live làm gốc để check lock).

---

## 12. Rollback Plan

### Rollback Live Data, Pending Changes và Change History
Trong trường hợp có lỗi xảy ra sau khi đã khôi phục phòng chờ nhưng cần khôi phục lại trạng thái đã được duyệt (sai) trước ngày 17/7 (đảm bảo hoàn trả nguyên vẹn, dọn dẹp sạch sẽ pending changes đã sinh ra):

```sql
BEGIN;

-- 1. Khôi phục Live Data & Xóa pending_changes của Quỳnh & Liên từ temp_payroll_backup_626
UPDATE employees e
SET trang_thai = b.employee_trang_thai,
    ngay_nghi_viec = b.employee_ngay_nghi_viec,
    state_phong_cho = false,
    pending_changes = '{}'::jsonb
FROM temp_payroll_backup_626 b
WHERE e.id = b.employee_id AND b.ma_nhan_su IN ('112470', '100230');

-- 2. Khôi phục Live Data & Xóa pending_changes của Bảo Châu từ temp_payroll_backup_626
UPDATE employees e
SET ngay_dieu_chinh_luong = b.employee_ngay_dieu_chinh_luong,
    state_phong_cho = false,
    pending_changes = '{}'::jsonb
FROM temp_payroll_backup_626 b
WHERE e.id = b.employee_id AND b.ma_nhan_su = '107198';

UPDATE salaries s
SET luong_cb = b.luong_cb,
    luong_target_cc = b.luong_target_cc,
    luong_target_gt = b.luong_target_gt,
    lcd_gt = b.lcd_gt,
    luong_hieu_suat_gt = b.luong_hieu_suat_gt,
    thuong_doanh_so_gt = b.thuong_doanh_so_gt,
    thuong_kpi_m1 = b.thuong_kpi_m1,
    thuong_doanh_so_m1 = b.thuong_doanh_so_m1,
    thuong_doanh_so_m2 = b.thuong_doanh_so_m2,
    thuong_doanh_so_m3 = b.thuong_doanh_so_m3,
    thuong_hieu_suat_cham_job_nhuan = b.thuong_hieu_suat_cham_job_nhuan,
    state_pending = false,
    pending_changes = '{}'::jsonb
FROM temp_payroll_backup_626 b
WHERE s.employee_id = b.employee_id AND b.ma_nhan_su = '107198';

-- 3. Khôi phục lại Change History đã xóa
INSERT INTO change_history (id, ma_nhan_su, field_changed, old_value, new_value, changed_by, changed_at, reason, document_id)
OVERRIDING SYSTEM VALUE
SELECT id, ma_nhan_su, field_changed, old_value, new_value, changed_by, changed_at, reason, document_id
FROM temp_history_backup_626
ON CONFLICT (id) DO NOTHING;

-- 4. Dọn dẹp tables backup
DROP TABLE IF EXISTS temp_payroll_backup_626;
DROP TABLE IF EXISTS temp_history_backup_626;

COMMIT;
```
