# Feature Tasks: Sửa lệch bộ lương cơ chế (fix-mechanism-salary-drift)

> **Trạng thái**: ✅ Đã được duyệt kế hoạch chính thức (Đã sẵn sàng thực thi)
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-28

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Quét và Triage danh sách lệch

**Mục tiêu:** Kéo thành công danh sách nhân sự có bộ lương cơ chế bị lệch và đối chiếu tự động với `thuong_doanh_so_gt`, loại trừ nhân sự nghỉ việc và có pending thay đổi lương.

- [x] Task 1.1: Viết truy vấn SQL SELECT xác định các nhân sự lệch lương cơ chế (tính toán chi tiết các cột và `is_target_cc_include_kn_m1`).
- [x] Task 1.2: Thực hiện đối chiếu cột `delta` (lệch) với cột `thuong_doanh_so_gt` và phân loại (Trường hợp nào bằng, trường hợp nào không), áp dụng loại trừ trang_thai = 'nghi_viec' và lọc pending_changes/state_pending.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Đã quét thử nghiệm thành công và phát hiện 8 trường hợp, lọc ra 2 trường hợp khớp 100%).

## Phase 2: Sao lưu an toàn & Verify (Chờ duyệt)

**Mục tiêu:** Đảm bảo thực thi sao lưu toàn bộ Database dạng file `.sql` tải về local máy của User, verify dung lượng và cấu hình rollback compensating transaction an toàn.

- [x] Task 2.1: Nhận ý kiến phê duyệt kế hoạch sửa đổi và chốt danh sách Nhóm A từ User.
- [x] Task 2.2: Thực hiện câu lệnh tạo bản backup toàn bộ Database (Full DB Dump) về local bằng pg_dump.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Đảm bảo file backup toàn bộ database `supabase_full_backup_20260528.json` tồn tại tại local, dung lượng file > 0 byte, và lệnh pg_dump hoàn thành thành công).

## Phase 3: Thực thi cập nhật & Ghi Audit Trail đầy đủ (Atomic Runbook)

**Mục tiêu:** Cập nhật chính xác `luong_cb`, lưu vết lịch sử tại `change_history` (ghi run_id vào `reason`) và `audit_log` (ghi run_id vào `details`, module = 'NS-002', action = 'update') trong cùng một khối Transaction an toàn tuyệt đối.

- [ ] Task 3.1: Chạy khối SQL Transaction thực thi lock `FOR UPDATE`, ghi nhận lịch sử vào `change_history` và nhật ký hệ thống `audit_log`, sau đó cập nhật `luong_cb` sống.
- [ ] Task 3.2: Xác nhận số lượng dòng cập nhật khớp chính xác là **2 dòng** trước khi COMMIT.
- [ ] Task 3.Final: 🧪 Test & Verify Phase 3 (Đọc lại bảng `change_history` và `audit_log` lọc theo run_id để kiểm tra tính toàn vẹn của dữ liệu cũ và mới).

## Phase 4: Kiểm tra cuối cùng và đóng Job

**Mục tiêu:** Đảm bảo toàn bộ danh sách lệch của Nhóm A đã được xử lý hoàn tất và sạch sẽ, báo cáo riêng Nhóm B.

- [ ] Task 4.1: Chạy lại SQL SELECT từ Phase 1 để xác nhận danh sách nhân sự lệch cơ chế hiện tại đã **trống** đối với 2 nhân sự Nhóm A.
- [ ] Task 4.2: Lập báo cáo theo dõi riêng gửi User về trạng thái chi tiết của 6 trường hợp không khớp ở Nhóm B.
- [ ] Task 4.Final: 🧪 Test & Verify Phase 4 (Báo cáo kết quả sạch sẽ cho User).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-28 15:10 | Phase 1 | Lập kế hoạch | Tạo file FEATURE_PLAN.md & FEATURE_TASKS.md | done | Đang formal review |
| 2026-05-28 15:45 | Phase 1 | Cập nhật review | Tích hợp ý kiến phản biện của Hội đồng chuyên gia lần 1 | done | Thêm SQL Runbook, audit_log, lọc nghỉ việc, chuyển trạng thái CẦN SỬA |
| 2026-05-28 16:00 | Phase 2 | Cập nhật review 2 | Tích hợp ý kiến phản biện lần 2: sửa AC, compensating rollback, run_id, drop backup | done | Sẵn sàng review đợt 2 |
| 2026-05-28 16:15 | Phase 2 | Cập nhật review 3 | Tích hợp ý kiến phản biện lần 3: chốt SQL eligibility salary pending, chốt cấu trúc audit_log | done | Sẵn sàng review đợt 3 |
| 2026-05-28 16:26 | Phase 2 | Cập nhật review 4 | Tích hợp ý kiến phản biện lần 4: Full Database Backup về local bằng pg_dump | done | Sẵn sàng review đợt 4 |
| 2026-05-28 16:33 | Phase 2 | Cập nhật review 5 | Tích hợp ý kiến phản biện lần 5: đồng bộ thứ tự triển khai, sửa mâu thuẫn rollback table vs full dump | done | Sẵn sàng review đợt 5 |
| 2026-05-28 17:06 | Phase 2 | Task 2.2 | Cài đặt thành công PostgreSQL 16 CLI và bắt đầu chạy pg_dump backup về local | start | Tiến hành backup full database |
| 2026-06-01 10:19 | Phase 2 | Task 2.Final | Dừng thực thi plan theo chỉ đạo của User. Chạy lại scan_drift.ts để báo cáo kết quả live mới. | done | Đã backup full DB 5.52MB, phát hiện 3 cases lệch mới. |
