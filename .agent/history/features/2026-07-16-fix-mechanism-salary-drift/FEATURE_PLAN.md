# Feature Plan: Sửa lệch bộ lương cơ chế (fix-mechanism-salary-drift)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã được rà soát và phê duyệt chính thức qua 5 vòng phản biện bởi Hội đồng chuyên gia và User. Sẵn sàng thực thi.
> **Feature slug**: fix-mechanism-salary-drift
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-28

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bộ lương của nhân sự gồm hai bộ dữ liệu: Bộ Giấy tờ (GT) và Bộ Cơ chế (CC). Các khoản lương chi tiết cơ chế cộng lại phải khớp với Lương Target Cơ chế (`luong_target_cc`). Tuy nhiên, có một số trường hợp đang xảy ra tình trạng tổng chi tiết không bằng target.
- **Vấn đề cần giải quyết:** 
  1. Lập câu lệnh SQL chính xác để quét ra danh sách các nhân sự bị lệch lương cơ chế.
  2. Triển khai đối chiếu xem khoản lệch này có đúng bằng `thuong_doanh_so_gt` hay không, loại bỏ nhân sự nghỉ việc (`trang_thai = 'nghi_viec'`).
  3. Ràng buộc cụ thể điều kiện SQL đối với dữ liệu salary pending: `COALESCE(s.pending_changes, '{}'::jsonb) = '{}'::jsonb AND COALESCE(s.state_pending, false) = false`.
  4. Thực hiện SAO LƯU TOÀN BỘ DATABASE (Full DB Backup) về máy local dưới dạng file SQL bằng pg_dump.
  5. Chốt cấu trúc `audit_log` với `module = 'NS-002'`, `action = 'update'`, `target_ma_nhan_su` và thông tin chi tiết run_id lưu trong `details` JSONB.
  6. Đảm bảo quy trình Rollback **không xóa vết lịch sử**, mặc định dùng Giao dịch bù (Compensating Transaction) dựa trên `change_history.old_value` đã lưu theo `run_id`, full DB dump chỉ dùng cho khôi phục thảm họa (Disaster Restore).
- **Mục tiêu:** Đồng bộ lại các bộ lương bị lệch của Nhóm A về trạng thái cân bằng (lệch = 0) và báo cáo riêng Nhóm B.
- **Kết quả mong đợi:** Danh sách lệch trống đối với các trường hợp được duyệt.

## 2. Phạm vi

### In scope
- Viết và chạy SQL query để kéo danh sách lệch, tính toán chênh lệch chuẩn `missing_amount = luong_target_cc - sum_cc`.
- Sao lưu toàn bộ Database về local thành file `supabase_full_backup_20260528.sql`.
- Viết và chạy SQL query cập nhật (UPDATE) cộng trực tiếp `thuong_doanh_so_gt` vào `luong_cb` đối với 2 nhân sự Nhóm A được duyệt.
- Chạy insert lịch sử thay đổi vào bảng `change_history` (ghi run_id vào `reason`) và nhật ký hệ thống `audit_log` (ghi run_id vào `details`) trong cùng Transaction.
- Rollback an toàn thông qua Giao dịch bù (Compensating Transaction) ghi lý do rollback làm mặc định, và nạp lại DB backup cho trường hợp khôi phục thảm họa.
- Chạy SQL check lại cuối cùng để chứng minh danh sách lệch của 2 nhân sự được duyệt đã sạch hoàn toàn.

### Out of scope
- Cập nhật tự động toàn bộ database mà không qua bước phê duyệt danh sách của User.
- Thay đổi schema database.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - **Salary Isolation & RLS Safety:** Trực tiếp thao tác ở tầng DB hoặc thông qua service_role, tôn trọng tính cách ly dữ liệu lương.
  - **Traceability:** Mọi cập nhật dữ liệu lương sống đều cần được ghi nhận vào `change_history` và `audit_log` với đầy đủ thông tin `field_changed`, `old_value`, `new_value`, `changed_by` để bảo toàn lịch sử.
- **"Cấm kỵ" cần tránh:** 
  - Không chạy trực tiếp lệnh UPDATE làm thay đổi lương mà không ghi nhận history & audit log.
  - Không xóa vết lịch sử khi rollback, bắt buộc ghi giao dịch bù để giữ tính minh bạch tuyệt đối.

## 4. Quyết định Thiết kế & Backup (Chờ Duyệt)

### Giả định & Eligibility Criteria
- Các nhân sự cần kiểm tra và xử lý phải thỏa mãn: `state_phong_cho = FALSE` AND `trang_thai != 'nghi_viec'` AND không có pending_changes về lương:
  ```sql
  COALESCE(s.pending_changes, '{}'::jsonb) = '{}'::jsonb AND COALESCE(s.state_pending, false) = false
  ```
- Người thực hiện thay đổi ghi nhận trong history & audit log sẽ là `loi.admicro@gmail.com`.
- Quy định lưu trữ `run_id` (`drift_20260528`): nhúng vào `change_history.reason` và lưu trong `audit_log.details->>'run_id'`.

### Giải pháp Backup & Rollback
- Backup: Chạy lệnh `pg_dump` tải toàn bộ database dạng file `.sql` về máy local của User.
- Rollback: Mặc định dùng Giao dịch bù (Compensating Transaction) chèn bản ghi mới ghi nhận lý do rollback và khôi phục giá trị cũ từ `change_history.old_value` theo `run_id`. Full DB dump chỉ dùng để khôi phục thảm họa (Disaster Restore).

## 5. Acceptance Criteria

- [ ] File backup toàn bộ DB `supabase_full_backup_20260528.sql` tồn tại tại local, dung lượng file > 0 byte, và lệnh pg_dump kết thúc thành công (exit code 0).
- [ ] Mức lệch lương cơ chế của **Bùi Quỳnh Chi** (`112819`) và **Nguyễn Thu Hà** (`112847`) bằng chính xác **0**.
- [ ] Bảng `change_history` xuất hiện đúng 2 dòng lịch sử thay đổi của 2 nhân sự trên chứa tiền tố `[run_id: drift_20260528]`.
- [ ] Bảng `audit_log` xuất hiện đúng 2 dòng ghi nhận hành động với trường `details->>'run_id' = 'drift_20260528'`, `module = 'NS-002'` và `action = 'update'`.
- [ ] Lập báo cáo chi tiết gửi riêng User về trạng thái của 6 trường hợp không khớp thuộc Nhóm B.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| Scratch Script hoặc SQL Migrations | Tạo mới | Thực thi sửa đổi dữ liệu một lần và lưu vết | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Đang thực hiện formal review vòng 5)
- **Risk hotspots:** Đảm bảo câu lệnh UPDATE không ghi đè nhầm người và số lượng dòng update khớp chính xác.
- **Review focus areas:** Đối chiếu kỹ lượng cột `delta` (mức lệch) với `thuong_doanh_so_gt` trước khi chạy lệnh update.
- **Dependencies / rollout concerns:** Transaction an toàn và đảm bảo khóa hàng (`FOR UPDATE`).

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1: Quét và Triage:** Chạy SQL SELECT để kéo danh sách lệch và phân loại đối chiếu với `thuong_doanh_so_gt` (Đã hoàn thành quét thử nghiệm).
  - **Phase 2: Duyệt danh sách:** Trình bày danh sách cho User chọn và duyệt.
  - **Phase 3: Sao lưu an toàn & Verify:** Chạy lệnh `pg_dump` tải file backup toàn bộ database về local và xác minh dung lượng > 0.
  - **Phase 4: Thực thi cập nhật:** Chạy SQL UPDATE, INSERT HISTORY và INSERT AUDIT LOG trong cùng Transaction an toàn.
  - **Phase 5: Kiểm tra lại (Verify):** Chạy SQL SELECT kiểm tra xem danh sách lệch của Nhóm A đã trống chưa, báo cáo Nhóm B.
- **Thứ tự triển khai:** SELECT -> USER APPROVAL -> FULL DB BACKUP & VERIFY -> UPDATE/HISTORY/AUDIT -> SELECT CHECK.

## 9. Test Strategy

- **Manual verification:**
  - Chạy SELECT kiểm tra trước và sau.
  - Đọc trực tiếp bảng `change_history` và `audit_log` để xác minh dữ liệu audit đã được ghi đúng.

## 10. Rollback Plan

- Mặc định dùng Giao dịch bù (Compensating Transaction) khôi phục từ `change_history.old_value` đã lưu theo `run_id`. Nạp lại file SQL dump toàn bộ database cho kịch bản khôi phục thảm họa (Disaster Restore).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
