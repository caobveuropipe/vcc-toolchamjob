# Feature Plan: Reconcile Salary Journal Fees (Case 1)

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Bắt buộc review trước khi thực thi SQL Migration trên Supabase.
> **Feature slug**: reconcile-salary-journal-fees
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-16

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Qua rà soát dữ liệu sau feature `consolidate-salary-fields`, phát hiện thấy có sự bất nhất lớn giữa Nhuận bút trên hợp đồng giấy tờ (`nhuan_but_gt`) và Nhuận bút cơ chế nội bộ (`nhuan_but_cc`).
- **Vấn đề cần giải quyết:** Có **439 trường hợp** có `nhuan_but_gt > 0` nhưng `nhuan_but_cc` bằng 0 hoặc null. Ở chiều ngược lại (`nhuan_but_cc > 0` nhưng `nhuan_but_gt == 0`), không có trường hợp nào.
  Phân tích chi tiết 439 trường hợp này, dữ liệu chia làm 2 nhóm:
  1. **364 trường hợp đặc biệt**: Thỏa mãn đồng thời:
     - `luong_hieu_suat_gt` bằng 0 hoặc null.
     - `nhuan_but_gt = thuong_hieu_suat_cham_job_nhuan`.
  2. **75 trường hợp thông thường**: Các trường hợp còn lại.
- **Mục tiêu:** 
  - Với **364 trường hợp đặc biệt**: Chuyển giá trị của `thuong_hieu_suat_cham_job_nhuan` về đúng trường `nhuan_but_cc`, đồng thời đặt `thuong_hieu_suat_cham_job_nhuan = 0` (hoặc NULL).
  - Với **75 trường hợp thông thường**: Tạm thời giữ nguyên (pending) và tách ra xử lý sau khi có hướng nghiệp vụ cụ thể.
- **Kết quả mong đợi:** 100% các ca đặc biệt (364 dòng) được đồng bộ dữ liệu chuẩn xác thông qua SQL chạy trực tiếp trên Supabase SQL Editor.

## 2. Phạm vi

### In scope
- Chuẩn bị block SQL giao dịch chạy trong Transaction để thực hiện cập nhật cho **364 ca đặc biệt**: Cập nhật `nhuan_but_cc = thuong_hieu_suat_cham_job_nhuan` và `thuong_hieu_suat_cham_job_nhuan = 0` cho các bản ghi thỏa mãn:
  ```sql
  nhuan_but_gt > 0 
  AND (nhuan_but_cc IS NULL OR nhuan_but_cc = 0)
  AND (luong_hieu_suat_gt IS NULL OR luong_hieu_suat_gt = 0)
  AND nhuan_but_gt = thuong_hieu_suat_cham_job_nhuan
  AND state_pending IS NOT TRUE -- Bổ sung an toàn loại trừ các dòng pending (FR-03)
  AND (pending_changes IS NULL OR pending_changes = '{}'::jsonb) -- Đề phòng drift pending_changes (EFR-02)
  ```
- Khóa (SELECT ... FOR UPDATE) các dòng dữ liệu mục tiêu ngay đầu transaction trước khi sao lưu để ngăn chặn tranh chấp dữ liệu đồng thời (EFR-01 vòng 7/9).
- Thực hiện ghi nhận chi tiết lịch sử thay đổi `change_history` cho từng nhân sự (với 2 thuộc tính thay đổi) và chèn 1 dòng log tổng hợp vào `audit_log` (FR-01).
- Tạo bảng sao lưu trực tiếp `backup_salaries_reconcile_040` trên database trước khi cập nhật (FR-02).
- Xác thực và assert số dòng bị ảnh hưởng khớp chính xác với kết quả rà soát là **364 dòng**.

### Out of scope
- **75 trường hợp thông thường** còn lại (pending, không thực hiện trong đợt cập nhật này).
- Cập nhật các trường hợp lương khác (như `luong_cb`, `luong_target_cc`), các ca này được tách sang plan riêng.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng cấu trúc cô lập lương và các ràng buộc dữ liệu tại DB-side.
- **"Cấm kỵ" cần tránh:** Tránh chạy các câu lệnh SQL tự do không có transaction bảo vệ hoặc không có assert số lượng dòng cập nhật.

## 4. Giả định và câu hỏi mở

### Giả định
- Với các ca đặc biệt, bản chất `thuong_hieu_suat_cham_job_nhuan` đang được dùng thay cho nhuận bút thực tế, do đó việc chuyển đổi giá trị sang `nhuan_but_cc` và xóa giá trị ở trường cũ là chính xác về mặt nghiệp vụ.

### Câu hỏi mở
- *Không có* (Quy trình đồng bộ thuần túy).

## 5. Acceptance Criteria

- [ ] Tạo bảng backup thành công `backup_salaries_reconcile_040` chứa đúng 364 dòng.
- [ ] Thực thi thành công block SQL cập nhật trên Supabase SQL Editor.
- [ ] Số lượng dòng bị ảnh hưởng thực tế phải đúng bằng 364 dòng cho mỗi hành động update/insert.
- [ ] Rà soát hậu kiểm (post-check) thành công: verify 364 ca đặc biệt chuyển đổi đúng giá trị, giữ nguyên các cột lương khác, và 75 ca thông thường còn lại không bị tác động (FR-04).
- [ ] Rà soát lại dữ liệu sau khi chạy, số lượng ca đặc biệt chưa được reconcile giảm về 0.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `salaries` | Cập nhật dữ liệu | Đồng bộ `nhuan_but_cc` cho 364 ca | 🟡 Yellow | Không |
| `change_history` | Thêm mới | Ghi nhận chi tiết lịch sử thay đổi của 364 ca | 🟡 Yellow | Không |
| `audit_log` | Thêm mới | Ghi nhận log tổng hợp thao tác đồng bộ hệ thống | 🟡 Yellow | Không |
| `backup_salaries_reconcile_040` | Tạo mới | Bảng tạm lưu trữ dữ liệu gốc phục vụ rollback/hậu kiểm | 🟢 Green | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (User duyệt block SQL trước khi chạy trên DB).
- **Risk hotspots:** Đảm bảo điều kiện `WHERE` chính xác để không ghi đè lên các bản ghi đã có `nhuan_but_cc` khác 0 hoặc các ca thông thường/pending.
- **Review focus areas:** Điều kiện chia tách chính xác 364 ca đặc biệt (`state_pending IS NOT TRUE` và `pending_changes` trống) và khóa dòng chống tranh chấp.

## 8. Chiến luyện triển khai

- **Phase strategy:** Chạy trực tiếp SQL block dưới dạng Transaction thông qua Supabase Dashboard/SQL Editor.
- **Yêu cầu migration / config / deploy:** Không cần deploy file migration, chỉ cần chạy thủ công đoạn script SQL ở mục 11.

## 9. Test Strategy

- **Automated tests:** Không áp dụng.
- **Manual verification:**
  - Chạy thử query `SELECT count(*)` trước khi thực hiện update để xác định số dòng (cần khớp 364 dòng).
  - Chạy thử cập nhật với mệnh đề transaction `BEGIN ... ROLLBACK` để verify số lượng row bị ảnh hưởng mà không commit thực tế.

## 10. Rollback Plan

- **Chiến lược sao lưu và vòng đời dữ liệu (Retention Window):**
  - Để đảm bảo an toàn tuyệt đối, bảng backup phụ `backup_salaries_reconcile_040` trên database **sẽ KHÔNG bị xóa ngay lập tức** sau khi thực thi. 
  - Bảng backup này sẽ được lưu giữ trên database trong vòng **30 ngày** (qua chu kỳ tính lương tháng tiếp theo) để phục vụ tra cứu và khôi phục khẩn cấp. (EFR-01)
  - Sau thời gian 30 ngày, bảng tạm này mới được drop khỏi database. Từ thời điểm đó, nếu cần rollback thì file backup JSON offline (`D:\ToolNhanSuVcc\database_backups\backup_case1_nhuan_but_20260716.json`) sẽ là nguồn khôi phục duy nhất.
- **Mã SQL khôi phục trực tiếp qua bảng backup phụ (trong vòng 30 ngày):**
  ```sql
  BEGIN;
  
  -- Khôi phục cột lương của bảng salaries về trạng thái ban đầu
  UPDATE salaries s
  SET 
    nhuan_but_cc = b.nhuan_but_cc,
    thuong_hieu_suat_cham_job_nhuan = b.thuong_hieu_suat_cham_job_nhuan
  FROM backup_salaries_reconcile_040 b
  WHERE s.id = b.id;
  
  -- Dọn dẹp change history & audit log đã chèn của batch
  DELETE FROM change_history WHERE changed_by = 'system-reconcile-040';
  DELETE FROM audit_log WHERE actor_email = 'system-reconcile-040@vccorp.vn';
  
  COMMIT;
  ```

## 11. Tham chiếu thực thi và Mã SQL chạy trực tiếp

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
- **Cách lấy danh sách 364 ca đặc biệt để đối chứng:**
  ```sql
  SELECT e.ma_nhan_su, e.ho_va_ten, s.nhuan_but_gt, s.thuong_hieu_suat_cham_job_nhuan 
  FROM employees e
  JOIN salaries s ON e.id = s.employee_id
  WHERE s.nhuan_but_gt > 0 
    AND (s.nhuan_but_cc IS NULL OR s.nhuan_but_cc = 0)
    AND (s.luong_hieu_suat_gt IS NULL OR s.luong_hieu_suat_gt = 0)
    AND s.nhuan_but_gt = s.thuong_hieu_suat_cham_job_nhuan
    AND s.state_pending IS NOT TRUE
    AND (s.pending_changes IS NULL OR s.pending_changes = '{}'::jsonb);
  ```

- **Mã SQL chạy trực tiếp trên Supabase SQL Editor (Transaction kèm Row-Locking, Idempotent, Assert, History và Audit Log):**
  ```sql
  BEGIN;

  -- 1. Fail-fast nếu bảng backup đã tồn tại trước đó để chống rerun trùng lặp (EFR-01)
  DO $$
  BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'backup_salaries_reconcile_040') THEN
      RAISE EXCEPTION 'Bảng backup_salaries_reconcile_040 đã tồn tại. Vui lòng DROP TABLE nếu muốn chạy lại.';
    END IF;
  END $$;

  -- 2. Thực hiện Khóa hàng (Row-Locking) bằng lệnh SELECT FOR UPDATE hợp lệ ở top-level (EFR-01 vòng 9)
  -- Lệnh này sẽ giữ các hàng salaries mục tiêu bị lock trong transaction cho đến khi COMMIT hoặc ROLLBACK.
  SELECT 1 
  FROM salaries
  WHERE nhuan_but_gt > 0 
    AND (nhuan_but_cc IS NULL OR nhuan_but_cc = 0)
    AND (luong_hieu_suat_gt IS NULL OR luong_hieu_suat_gt = 0)
    AND nhuan_but_gt = thuong_hieu_suat_cham_job_nhuan
    AND state_pending IS NOT TRUE
    AND (pending_changes IS NULL OR pending_changes = '{}'::jsonb)
  FOR UPDATE;

  -- 3. Tạo bảng backup phụ trong DB (Lưu toàn bộ data trạng thái gốc)
  CREATE TABLE backup_salaries_reconcile_040 AS
  SELECT s.*, e.ma_nhan_su
  FROM salaries s
  JOIN employees e ON e.id = s.employee_id
  WHERE s.nhuan_but_gt > 0 
    AND (s.nhuan_but_cc IS NULL OR s.nhuan_but_cc = 0)
    AND (s.luong_hieu_suat_gt IS NULL OR s.luong_hieu_suat_gt = 0)
    AND s.nhuan_but_gt = s.thuong_hieu_suat_cham_job_nhuan
    AND s.state_pending IS NOT TRUE
    AND (s.pending_changes IS NULL OR s.pending_changes = '{}'::jsonb);

  DO $$
  DECLARE
    v_backup_count INTEGER;
    v_updated_rows INTEGER;
    v_history_rows_1 INTEGER;
    v_history_rows_2 INTEGER;
    v_expected_rows INTEGER := 364;
  BEGIN
    -- Kiểm tra số lượng bản ghi được sao lưu
    SELECT count(*) INTO v_backup_count FROM backup_salaries_reconcile_040;
    IF v_backup_count <> v_expected_rows THEN
      RAISE EXCEPTION 'Assertion failed: expected % backup rows, but got %. Rolling back.', v_expected_rows, v_backup_count;
    END IF;

    -- 4. Ghi nhận change_history cho việc đổi nhuan_but_cc
    INSERT INTO change_history (ma_nhan_su, field_changed, old_value, new_value, changed_by, reason)
    SELECT 
      ma_nhan_su,
      'nhuan_but_cc',
      COALESCE(nhuan_but_cc::text, '0'),
      thuong_hieu_suat_cham_job_nhuan::text,
      'system-reconcile-040',
      'Reconcile: Move thuong_hieu_suat_cham_job_nhuan to nhuan_but_cc (Case 1 special)'
    FROM backup_salaries_reconcile_040;
    
    GET DIAGNOSTICS v_history_rows_1 = ROW_COUNT;
    IF v_history_rows_1 <> v_expected_rows THEN
      RAISE EXCEPTION 'Assertion failed: expected % history rows for nhuan_but_cc, but got %. Rolling back.', v_expected_rows, v_history_rows_1;
    END IF;

    -- 5. Ghi nhận change_history cho việc đổi thuong_hieu_suat_cham_job_nhuan
    INSERT INTO change_history (ma_nhan_su, field_changed, old_value, new_value, changed_by, reason)
    SELECT 
      ma_nhan_su,
      'thuong_hieu_suat_cham_job_nhuan',
      thuong_hieu_suat_cham_job_nhuan::text,
      '0',
      'system-reconcile-040',
      'Reconcile: Move thuong_hieu_suat_cham_job_nhuan to nhuan_but_cc (Case 1 special)'
    FROM backup_salaries_reconcile_040;

    GET DIAGNOSTICS v_history_rows_2 = ROW_COUNT;
    IF v_history_rows_2 <> v_expected_rows THEN
      RAISE EXCEPTION 'Assertion failed: expected % history rows for job_nhuan, but got %. Rolling back.', v_expected_rows, v_history_rows_2;
    END IF;

    -- 6. Thực hiện UPDATE chính thức bảng salaries
    -- Sử dụng lại toàn bộ predicate kiểm tra dòng dữ liệu để đảm bảo an toàn tuyệt đối và tính idempotent (EFR-01 vòng 7)
    UPDATE salaries s
    SET 
      nhuan_but_cc = b.thuong_hieu_suat_cham_job_nhuan,
      thuong_hieu_suat_cham_job_nhuan = 0
    FROM backup_salaries_reconcile_040 b
    WHERE s.id = b.id
      -- Lặp lại predicate kiểm định live data tại thời điểm update
      AND s.nhuan_but_gt > 0 
      AND (s.nhuan_but_cc IS NULL OR s.nhuan_but_cc = 0)
      AND (s.luong_hieu_suat_gt IS NULL OR s.luong_hieu_suat_gt = 0)
      AND s.nhuan_but_gt = s.thuong_hieu_suat_cham_job_nhuan
      AND s.state_pending IS NOT TRUE
      AND (s.pending_changes IS NULL OR s.pending_changes = '{}'::jsonb);

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    IF v_updated_rows <> v_expected_rows THEN
      RAISE EXCEPTION 'Assertion failed: expected % rows to be updated, but got % rows. Rolling back.', v_expected_rows, v_updated_rows;
    END IF;

    -- 7. Ghi nhận audit_log tổng hợp
    INSERT INTO audit_log (actor_email, module, action, target_ma_nhan_su, details)
    VALUES (
      'system-reconcile-040@vccorp.vn',
      'NS-002',
      'update',
      NULL,
      '{"description": "Reconcile nhuan_but_cc for 364 special case records by moving thuong_hieu_suat_cham_job_nhuan to nhuan_but_cc", "backup_table": "backup_salaries_reconcile_040", "affected_rows": 364}'::jsonb
    );

    RAISE NOTICE 'Success: % rows reconciled and logged correctly.', v_updated_rows;
  END $$;

  COMMIT;
  ```

- **Mã SQL Hậu kiểm (Post-check Verification):**
  ```sql
  -- 1. Assert: không còn ca lệch đặc biệt nào tồn tại trong database (Phải trả về 0)
  SELECT count(*) FROM salaries s
  WHERE s.nhuan_but_gt > 0 
    AND (s.nhuan_but_cc IS NULL OR s.nhuan_but_cc = 0)
    AND (s.luong_hieu_suat_gt IS NULL OR s.luong_hieu_suat_gt = 0)
    AND s.nhuan_but_gt = s.thuong_hieu_suat_cham_job_nhuan
    AND s.state_pending IS NOT TRUE
    AND (s.pending_changes IS NULL OR s.pending_changes = '{}'::jsonb);

  -- 2. Assert: tất cả 364 dòng trong bảng backup đã được cập nhật đúng giá trị và giữ nguyên cột lương khác
  SELECT count(*) 
  FROM salaries s
  JOIN backup_salaries_reconcile_040 b ON s.id = b.id
  WHERE s.nhuan_but_cc = b.thuong_hieu_suat_cham_job_nhuan
    AND s.thuong_hieu_suat_cham_job_nhuan = 0
    AND s.luong_target_gt IS NOT DISTINCT FROM b.luong_target_gt
    AND s.lcd_gt IS NOT DISTINCT FROM b.lcd_gt
    AND s.luong_hieu_suat_gt IS NOT DISTINCT FROM b.luong_hieu_suat_gt
    AND s.nhuan_but_gt IS NOT DISTINCT FROM b.nhuan_but_gt
    AND s.okr_gt IS NOT DISTINCT FROM b.okr_gt
    AND s.thuong_doanh_so_gt IS NOT DISTINCT FROM b.thuong_doanh_so_gt;
  -- (Kết quả phải trả về đúng 364)

  -- 3. Assert: 75 dòng thông thường (Out of scope) hoàn toàn không bị chạm vào
  SELECT count(*) FROM salaries s
  WHERE s.nhuan_but_gt > 0 
    AND (s.nhuan_but_cc IS NULL OR s.nhuan_but_cc = 0)
    AND NOT (
      (s.luong_hieu_suat_gt IS NULL OR s.luong_hieu_suat_gt = 0)
      AND s.nhuan_but_gt = s.thuong_hieu_suat_cham_job_nhuan
      AND s.state_pending IS NOT TRUE
      AND (s.pending_changes IS NULL OR s.pending_changes = '{}'::jsonb)
    );
  -- (Kết quả phải trả về đúng 75)
  ```
