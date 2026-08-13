# Feature Tasks: Consolidate Salary Fields & Align Formulas

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-15

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database Backup & Clear Data (Bắt buộc User Review & Transaction Guard)

**Mục tiêu:** Backup dữ liệu không null ra file JSON tại folder `database_backups` và clear các cột dư thừa trên DB sử dụng transaction và assert đếm dòng sau khi được User phê duyệt.

- [x] Task 1.1: Tạo script `backend/scratch_backup_mismatch.js` thực hiện quét và backup tất cả các dòng có giá trị không null (`okr_cc IS NOT NULL OR thuong_doanh_so_cc IS NOT NULL`) ra file JSON `database_backups/backup_mismatch_okr_ds_20260715.json`. Cập nhật `.gitignore` hoặc `database_backups/.gitignore` để ignore tệp backup này. <!-- Sửa theo EFR-01: Bảo vệ privacy của backup -->
- [x] Task 1.2: Chạy script backup, verify git status để chắc chắn file backup không bị track, rồi gửi kết quả/file JSON cho User review.
- [x] Task 1.3: Tạo migration `039_clear_redundant_salary.sql` set `NULL` cho `okr_cc` và `thuong_doanh_so_cc` cho các dòng không null (`WHERE okr_cc IS NOT NULL OR thuong_doanh_so_cc IS NOT NULL`). Bọc trong Transaction (`BEGIN ... COMMIT`) kèm preflight check và assert đếm số dòng bị ảnh hưởng khớp với số dòng backup được từ script. Nếu đếm dòng không khớp, thực hiện `ROLLBACK`.
- [x] Task 1.Final: 🧪 **Dừng lại yêu cầu User review & xác nhận** file JSON backup và file migration. Sau khi User xác nhận OK, chạy migration SQL để thực hiện clear trên DB. Chạy regression test cho module snapshot (`vitest` integration) để chứng minh snapshot hoạt động bình thường.

## Phase 2: Core Validation & Onboarding Form & OCR Auto-fill Update

**Mục tiêu:** Cập nhật công thức validate lương core, logic tự điền thông tin từ OCR, chuyển đổi trường nhập liệu cùng logic fallback trong Form Onboarding và logic gán động/Warning Alert tại Modal điều chỉnh lương.

- [x] Task 2.1: Sửa file `packages/shared/src/utils/salary-validation.ts` để đưa `nhuan_but_cc` vào công thức validate CC Target. Đồng thời bổ sung test case trong `packages/shared/src/tests/salary-validation.test.ts` và chạy test thông qua `pnpm --filter @vcc/shared test` (hoặc vitest trực tiếp). <!-- Sửa theo EFR-02: Cập nhật unit test và chạy verify -->
- [x] Task 2.2: Sửa file `DocumentUpload.tsx` để:
  - Ẩn dòng "Thưởng KD" khỏi bảng kết quả AI đọc thông tin (Nội bộ).
  - Cập nhật logic click "Tự điền thông tin" (Auto-fill): map `okr_cc` từ kết quả AI $\rightarrow$ `thuong_okr_m1` truyền xuống Form. Loại bỏ điền `thuong_doanh_so_cc`.
- [x] Task 2.3: Sửa `EmployeeForm.tsx` để:
  - Thay thế các ô nhập liệu `okr_cc` $\rightarrow$ `thuong_okr_m1`. Giữ trường `nhuan_but_cc`.
  - Loại bỏ hoàn toàn việc gán Hiệu suất và Thưởng KD vào DB khi onboarding (để trống/NULL).
  - Cập nhật logic fallback (sao chép giá trị khi phần cơ chế trống): Chỉ sao chép `okr_gt` $\rightarrow$ `thuong_okr_m1` và `nhuan_but_gt` $\rightarrow$ `nhuan_but_cc`. Loại bỏ hoàn toàn `okr_cc`, `thuong_doanh_so_cc` khỏi danh sách phím kiểm tra fallback (`ccFieldsKeys`).
- [x] Task 2.4: Sửa `SalaryEditModal.tsx` để:
  - Khi mở Modal sửa lương cho nhân viên có `state_pending === true`, hệ thống tự tính phần chênh lệch chưa phân loại `unallocated = luong_target_cc - luong_cb - nhuan_but_cc - thuong_okr_m1 - thuong_kpi_m1 - thuong_doanh_so_m1 - thuong_du_an_m1 - (is_target_cc_include_kn_m1 ? thuong_kiem_nhiem_m1 : 0)` và tự động điền vào ô `thuong_hieu_suat_cham_job_nhuan` nếu đang trống. <!-- Sửa theo EFR-02: trừ mọi M1 component đang có -->
  - Hiển thị thông báo Alert cảnh báo màu vàng trên Modal nhắc nhở người nghiệm thu soát xét và chia chi tiết.
- [x] Task 2.Final: 🧪 Kiểm tra thủ công tính năng upload file ở màn hình Onboard, kiểm tra xem nút "Tự điền" và cơ chế copy fallback hoạt động đúng thiết kế (không ghi nhận trường CC cũ). Đồng thời mở thử Modal Cập nhật lương của nhân viên mới để kiểm chứng tính năng tự gán Hiệu suất tạm thời và Warning Alert.

## Phase 3: Frontend UI Formula & Warning Update

**Mục tiêu:** Cập nhật công thức hiển thị tóm tắt lương Cơ chế trên UI và logic cảnh báo lệch Target.

- [x] Task 3.1: Sửa logic render trong `EmployeeDetailPage.tsx` của Bộ Cơ chế (Nội bộ):
  - Lương cố định = `luong_cb`
  - Hiệu suất = sum các component (`thuong_hieu_suat_cham_job_nhuan` + `thuong_kpi_m1` + `thuong_doanh_so_m1` + `thuong_du_an_m1` + (`thuong_kiem_nhiem_m1` chỉ cộng khi `is_target_cc_include_kn_m1` được tích)). <!-- Sửa theo EFR-02: đồng nhất công thức Hiệu suất UI -->
  - Nhuận bút = `nhuan_but_cc`
  - OKR = `thuong_okr_m1`
  - Thưởng KD = trống (không hiển thị giá trị hoặc để `-`)
  - Tổng thu nhập = tổng các thành phần trên cộng lại (không tự cộng thêm `thuong_kiem_nhiem_m1` khi checkbox tắt, để khớp đúng với targetCc)
  - Cảnh báo lệch = So sánh Tổng thu nhập đối chiếu ở trên với `luong_target_cc`. Nếu khác nhau, render icon warning màu vàng ngay cạnh.
- [x] Task 3.2: Đồng bộ cấu trúc hiển thị này tại component `DocumentUpload.tsx`.
- [x] Task 3.Final: 🧪 Kiểm tra thủ công giao diện chi tiết của các nhân sự (như Nguyễn Hoài Nam - 112260, Huỳnh Quốc Lộc - 112831, Lê Trọng Minh - 112822, Lại Mai Anh - 112803) để đảm bảo tổng chi tiết cộng lại bằng đúng Tổng thu nhập hiển thị và không còn bị lệch hay double-count, kiểm tra xem Warning màu vàng có xuất hiện khi có sự lệch target.

## Execution Log

- 2026-07-16 14:39 - Phase 1 - Task 1.1 - start - Bắt đầu triển khai script backup mismatch data.
- 2026-07-16 14:41 - Phase 1 - Task 1.1 - done - Hoàn thành script backup và ignore config.
- 2026-07-16 14:41 - Phase 1 - Task 1.2 - start - Chạy script backup, xác nhận git status và chuẩn bị gửi file JSON cho User review.
- 2026-07-16 14:42 - Phase 1 - Task 1.2 - done - Verify git status OK (backup file ignored).
- 2026-07-16 14:42 - Phase 1 - Task 1.3 - start - Tạo migration SQL với transaction và assert đếm dòng.
- 2026-07-16 14:43 - Phase 1 - Task 1.3 - done - Đã tạo xong migration SQL 039.
- 2026-07-16 14:43 - Phase 1 - Task 1.Final - start - Bắt đầu yêu cầu User review và confirm để chạy migration.
- 2026-07-16 15:47 - Phase 1 - Task 1.Final - done - Chạy xong migration trên Supabase Dashboard, xác nhận 0 record mismatch còn lại. Chạy integration test hoàn thành.
- 2026-07-16 15:47 - Phase 2 - Task 2.1 - start - Bắt đầu cập nhật công thức validate lương core (nhuan_but_cc) và bổ sung unit test.
- 2026-07-16 15:52 - Phase 2 - Task 2.1 - done - Unit test packages/shared hoàn tất 100%.
- 2026-07-16 15:52 - Phase 2 - Task 2.2 - done - Sửa DocumentUpload.tsx (ẩn Thưởng KD nội bộ, map okr_cc -> thuong_okr_m1 khi click Tự điền).
- 2026-07-16 15:52 - Phase 2 - Task 2.3 - done - Sửa EmployeeForm.tsx (bỏ các ô nhập cơ chế cũ, cập nhật fallback mapping).
- 2026-07-16 15:52 - Phase 2 - Task 2.4 - done - Sửa SalaryEditModal.tsx (tự gán unallocated cho HS Chấm/Job/Nhuận, thêm Warning Alert).
- 2026-07-16 15:53 - Phase 2 - Task 2.Final - start - Bắt đầu tự test Phase 2 và chuẩn bị bàn giao cho User confirm.
- 2026-07-16 16:30 - Phase 2 - Task 2.Final - done - User đã kiểm thử thủ công và duyệt hoàn thành Phase 2 sau khi bổ sung điều chỉnh UI.
- 2026-07-16 16:30 - Phase 3 - Task 3.1 - start - Bắt đầu sửa công thức hiển thị lương Nội bộ ở EmployeeDetailPage.tsx.
- 2026-07-16 16:31 - Phase 3 - Task 3.1 - done - Cập nhật xong hiển thị và cảnh báo lệch Target trong EmployeeDetailPage.tsx.
- 2026-07-16 16:31 - Phase 3 - Task 3.2 - start - Đồng bộ hiển thị và cảnh báo lệch target tại DocumentUpload.tsx.
- 2026-07-16 16:32 - Phase 3 - Task 3.2 - done - Đồng bộ xong panel kết quả AI đọc thông tin tại DocumentUpload.tsx.
- 2026-07-16 16:32 - Phase 3 - Task 3.Final - start - Bắt đầu quá trình tự kiểm thử và bàn giao Phase 3 cho User.
- 2026-07-16 16:42 - Phase 3 - Task 3.Final - done - Đã cập nhật mặc định bật bảng chi tiết cơ chế lương, hoàn tất kiểm thử và được User duyệt thông qua Phase 3.
