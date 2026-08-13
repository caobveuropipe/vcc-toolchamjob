# Rebuttal Log: reconcile-salary-journal-fees

## Round 1 - 2026-07-17T09:10:00Z
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: read `.agent/active/reconcile-salary-journal-fees/EXPERT_REVIEW.md` and database schema.

### EFR Đã Chấp Nhận -> [FR-01]: Direct SQL bypasses salary audit and change history | Sửa: Cập nhật SQL giao dịch để ghi thêm `change_history` cho từng nhân sự bị cập nhật và chèn 1 dòng log tổng hợp vào `audit_log`.
### EFR Đã Chấp Nhận -> [FR-02]: Rollback is not executable enough for a committed salary data change | Sửa: Tạo bảng backup phụ `backup_salaries_reconcile_040` ngay trong database trước khi thực hiện cập nhật để có thể rollback trực tiếp bằng SQL nhanh chóng nếu xảy ra sự cố.
### EFR Đã Chấp Nhận -> [FR-03]: Preflight does not exclude or surface pending salary rows | Sửa: Chạy thử script preflight xác định thực tế số ca pending = 0, đồng thời bổ sung điều kiện `AND s.state_pending IS NOT TRUE` vào query để đảm bảo an toàn tuyệt đối.
### EFR Đã Chấp Nhận -> [FR-04]: Verification proves disappearance of the predicate, not correctness of the migrated rows | Sửa: Bổ sung câu lệnh SQL hậu kiểm so sánh chéo bảng tạm backup với bảng salaries để chứng minh tính toàn vẹn của dữ liệu sau cập nhật.
### EFR Đã Chấp Nhận -> [FR-05]: Affected-surface classification is understated | Sửa: Nâng mức độ rủi ro lên Yellow và cập nhật đầy đủ các thực thể database bị tác động trong bảng phạm vi.

## Round 3 - 2026-07-17T10:02:39+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: read `.agent/active/reconcile-salary-journal-fees/EXPERT_REVIEW.md` and database schema.

### EFR Đã Chấp Nhận -> [EFR-01]: SQL block is not idempotent and can zero out nhuan_but_cc on rerun | Sửa: Đã nâng cấp block SQL để lấy giá trị nhuận bút gốc từ bảng backup tạm thay vì s.thuong_hieu_suat_cham_job_nhuan, bổ sung kiểm tra s.thuong_hieu_suat_cham_job_nhuan > 0 khi update để chống rerun trùng lặp, và thêm lệnh bảo vệ ngăn chặn ghi đè bảng backup nếu bảng đã tồn tại trước đó.
### EFR Đã Chấp Nhận -> [EFR-02]: Pending salary guard still ignores non-empty pending_changes | Sửa: Thêm kiểm tra `(s.pending_changes IS NULL OR s.pending_changes = '{}'::jsonb)` vào toàn bộ các câu lệnh select backup, update và hậu kiểm để tránh drift dữ liệu pending.
### EFR Đã Chấp Nhận -> [EFR-03]: FEATURE_TASKS.md is stale and does not execute the accepted fixes | Sửa: Cập nhật toàn bộ các phase và tasks chi tiết trong FEATURE_TASKS.md để khớp hoàn toàn với phương án thực thi và hậu kiểm SQL an toàn mới.

## Round 5 - 2026-07-17T10:08:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: read `.agent/active/reconcile-salary-journal-fees/EXPERT_REVIEW.md` and database schema.

### EFR Đã Chấp Nhận -> [EFR-01]: Cleanup task drops the only rollback artifact | Sửa: Đã chuyển đổi nhiệm vụ dọn dẹp (drop table) trong FEATURE_TASKS.md từ việc drop ngay sau khi chạy sang lưu giữ bảng backup phụ `backup_salaries_reconcile_040` trên Database trong vòng 30 ngày (Retention Window). Cập nhật Rollback Plan mô tả rõ vòng đời của backup table và chỉ ra nguồn khôi phục thay thế là file backup JSON offline sau khi hết hạn 30 ngày.

## Round 7 - 2026-07-17T10:12:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: read `.agent/active/reconcile-salary-journal-fees/EXPERT_REVIEW.md` and database schema.

### EFR Đã Chấp Nhận -> [EFR-01]: Backup snapshot and update are not protected against concurrent salary changes | Sửa: Đã nâng cấp block SQL giao dịch để bổ sung khóa hàng `FOR UPDATE` cho toàn bộ các dòng lương mục tiêu ngay ở đầu transaction trước khi tiến hành sao lưu/cập nhật. Đồng thời lặp lại đầy đủ predicate kiểm tra live data trong mệnh đề UPDATE để loại trừ hoàn toàn rủi ro bị ghi đè dữ liệu stale do có thay đổi đồng thời.

## Round 9 - 2026-07-17T10:15:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: read `.agent/active/reconcile-salary-journal-fees/EXPERT_REVIEW.md` and database schema.

### EFR Đã Chấp Nhận -> [EFR-01]: Top-level PERFORM ... FOR UPDATE makes the direct SQL block invalid | Sửa: Đã thay thế câu lệnh PL/pgSQL `PERFORM ... FOR UPDATE;` thành lệnh SQL thuần `SELECT 1 ... FOR UPDATE;` hợp lệ ở cấp độ top-level của Supabase SQL Editor.
