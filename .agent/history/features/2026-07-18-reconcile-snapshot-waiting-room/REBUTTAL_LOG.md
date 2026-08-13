## Round 1 - 2026-07-18T11:25:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - `EXPERT_REVIEW.md`
  - `d:/ToolNhanSuVcc/.agent/active/reconcile-snapshot-waiting-room/FEATURE_PLAN.md`
  - `d:/ToolNhanSuVcc/packages/shared/src/utils/date.ts`
  - `d:/ToolNhanSuVcc/database/migrations/042_snapshot_pending_room_refinement.sql`
  - `d:/ToolNhanSuVcc/backend/src/__tests__/integration/snapshots.test.ts`

### EFR Đã Chấp Nhận -> [EFR-01]: Sai boundary kỳ lương 27-26 so với code/docs hiện hành 26-25 | Sửa: Cập nhật plan và giải thuật preventive rule sang 26-25.
### EFR Đã Chấp Nhận -> [EFR-02]: Phase xử lý sự vụ chạm live master data nhưng thiếu runbook an toàn, idempotency và verification chi tiết | Sửa: Bổ sung runbook chi tiết từng bước cho Phase 1 (preflight, backup, revert, trigger, restore, verify, rollback).
### EFR Đã Chấp Nhận -> [EFR-03]: Preventive rule chưa nói rõ cách kết hợp với anti-drift guard hiện có trong `submit_employee_pending` | Sửa: Đã ghi rõ prior-period lock check được đặt cạnh `is_period_locked`, không thay đổi hay ghi đè check cũ.
### EFR Đã Chấp Nhận -> [EFR-04]: Test strategy chưa đủ bao phủ rủi ro data boundary, multi-khoi và salary pending | Sửa: Mở rộng test strategy bao gồm test boundary ngày 25/26, đổi khối, salary pending thiếu ngày điều chỉnh lương.
### EFR Đã Chấp Nhận -> [EFR-05]: Plan chưa đạt cấu trúc template cho feature rủi ro cao | Sửa: Tổ chức lại plan theo đúng template của dự án.

---

## Round 2 - 2026-07-18T11:32:00+07:00
### Tổng kết
- EFR: 0 (accepted: 0, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - User requested keeping only Method A (revert -> snapshot -> restore) and discarding other methods.
  - Corrected interval logic in date boundaries calculation (reversing addition/subtraction mistake for day >= 26 / day <= 25).
- Action: Rewrote `FEATURE_PLAN.md` to remove Method B and enforce Method A only. Corrected SQL syntax for date interval logic inside the preventive check section.

---

## Round 3 - 2026-07-18T11:34:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (Round 3 from Codex Desktop)
  - `d:/ToolNhanSuVcc/database/001_schema.sql`
  - `d:/ToolNhanSuVcc/backend/src/services/snapshotService.ts`
  - `d:/ToolNhanSuVcc/backend/src/routes/snapshots.ts`
- Action:
  - Accepted `EFR-01`: Quỳnh and Liên's revert status changed from `'chinh_thuc'` to `'dang_lam'` to respect check constraints in `employees.trang_thai`.
  - Accepted `EFR-02`: Removed `ngay_dieu_chinh_luong` from `salaries` table queries in runbook, selecting it only from `employees`.
  - Accepted `EFR-03`: Added explicit update snapshot locked status query inside Step 3 of the runbook to transition status from `'draft'` to `'locked'`.
  - Accepted `EFR-04`: Upgraded backup runbook to create and query a durable backup table `temp_payroll_backup_626` instead of hardcoded raw values.

---

## Round 4 - 2026-07-18T11:36:00+07:00
### Tổng kết
- EFR: 0 (accepted: 0, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - User requested switching strategy to "Undo Submit back to waiting room".
- Action:
  - Updated `FEATURE_PLAN.md` and `FEATURE_TASKS.md` to implement the "Undo Submit" strategy, reverting live values back to old values and populating `pending_changes` inside employees and salaries to restore their pending states.
  - Added step to delete the duplicate/incorrect `change_history` entries generated during the mistaken submission on July 17th.

---

## Round 5 - 2026-07-18T11:53:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (Round 5 from Codex Desktop)
- Action:
  - Accepted `EFR-01`: Enabled RLS and set policy `USING (false) WITH CHECK (false)` on all backup tables (`temp_payroll_backup_626`, `temp_history_backup_626`) to adhere to Hybrid Security convention.
  - Accepted `EFR-02`: Added SQL statements inserting audit trails into `audit_log` inside the undo transaction.
  - Accepted `EFR-03`: Created `temp_history_backup_626` to backup target `change_history` ids before deletion, ensuring we delete only the specific ids.
  - Accepted `EFR-04`: Added specific SQL pre-checks in Step 4 to verify the check-block logic will not block June snapshot.

---

## Round 6 - 2026-07-18T12:41:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (Round 6 from Codex Desktop)
- Action:
  - Accepted `EFR-01`: Switched action in `audit_log` insert from `'reconcile_undo_submit'` (which violated constraint) to `'update'`, detailing the incident inside the `details` JSONB field.
  - Accepted `EFR-02`: Wrapped backup table initialization in a clean `DROP TABLE IF EXISTS` logic to guarantee rerun idempotency.
  - Accepted `EFR-03`: Fully detailed the rollback script to restore deleted `change_history` rows using `OVERRIDING SYSTEM VALUE` statement to support generated identity fields.

---

## Round 7 - 2026-07-18T12:46:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (Round 7 from Codex Desktop)
- Action:
  - Accepted `EFR-01`: Fixed backup rerun safety. Wrapped inserts inside `NOT EXISTS (SELECT 1 FROM ...)` blocks, preventing overwriting or polluting the original backup tables if the script is run a second time after partial failure.
  - Accepted `EFR-02`: Fixed rollback pending changes residue. Added `pending_changes = '{}'::jsonb` to `employees` and `salaries` update statements in the rollback block to ensure no orphaned pending payloads are left behind.
