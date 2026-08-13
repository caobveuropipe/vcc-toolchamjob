# Feature Tasks: Tinh chỉnh cơ chế check prior-period snapshot khi submit phòng chờ

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-29

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Tạo Migration và Cập nhật Database Function

**Mục tiêu:** Áp dụng logic lọc ngày đối với hồ sơ tuyển mới trong hàm `submit_employee_pending` ở local DB.

- [x] Task 1.1: Tạo file migration `supabase/migrations/044_refine_prior_snapshot_check.sql` định nghĩa lại hàm `submit_employee_pending` với logic dynamic new hire check kết hợp `temp_uuid IS NOT NULL` và `change_history` (EFR-01), lọc chỉ check `ngay_vao_cong_ty` cho new hire, truy xuất `v_new_hire_document_id` để ghi history chuẩn xác, và finalize toàn bộ pending documents.
- [x] Task 1.2: Tạo file migration `database/migrations/044_refine_prior_snapshot_check.sql` đồng bộ với thư mục database chính (đảm bảo byte-equivalent).
- [x] Task 1.3: Tạo file rollback `database/rollbacks/044_refine_prior_snapshot_check.rollback.sql` chứa định nghĩa gốc Migration 043 của hàm `submit_employee_pending` (đảm bảo nằm ngoài thư mục auto-run).
- [x] Task 1.4: Áp dụng migration 044 vào local PostgreSQL container và reload schema cache PostgREST.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Verify hàm DB biên dịch thành công và có thể chạy được trên local DB).

## Phase 2: Viết Integration Tests & Kiểm chứng nghiệp vụ

**Mục tiêu:** Đảm bảo code chạy đúng thông qua các kịch bản test tự động và thủ công.

- [x] Task 2.1: Thêm ma trận integration test cases trong `backend/src/__tests__/integration/snapshots.test.ts` bao gồm:
  - (1) Anti-drift check: Chuyển ngày hiệu lực vào kỳ đã khóa vẫn bị chặn bởi `is_period_locked`.
  - (2) Prior-period check với new-hire: Chặn nếu `ngay_vao_cong_ty` có kỳ trước chưa locked; cho phép nếu kỳ trước đã locked và `ngay_ky_hd` ở tương lai.
  - (3) Test new hire có đồng thời document `tuyen_moi` hoạt động và document lương `dieu_chinh_luong` mới (RPC nhận temp UUID của document lương).
  - (4) Kiểm chứng tài liệu tuyển mới sau submit:
    - Assert: Lịch sử `change_history` của thông tin nhân sự tuyển mới liên kết đúng khóa ngoại với document `tuyen_moi` (thay vì document lương).
    - Assert: Sau submit thành công, tài liệu tuyển mới không còn active (`temp_uuid` bị clear về `NULL`).
    - Assert: Lần cập nhật lương/hồ sơ tiếp theo (điều chỉnh định kỳ) được hệ thống coi là existing employee một cách chính xác.
  - (5) Regression check cho existing employees:
    - Nhân viên đã từng onboarding và có document `tuyen_moi` cũ (nhưng `temp_uuid` đã null) thực hiện điều chỉnh lương/hồ sơ: Phải đi nhánh existing employee (bị check toàn bộ ngày hiệu lực thay đổi và chặn nếu kỳ trước chưa lock).
    - Nhân viên bulk-imported không có lịch sử (`change_history` trống) thực hiện điều chỉnh lương/hồ sơ: Phải đi nhánh existing employee.
  - (6) Prior-period check với existing employee: Chặn khi sửa lương nếu ngày hiệu lực có kỳ trước chưa locked (kể cả khi ngày đó ở tương lai).
  - (7) Test các trường hợp `p_temp_uuid` null, document override, và document null.
- [x] Task 2.2: Chạy bộ test suite `snapshots.test.ts` trên local Docker DB để xác nhận hoạt động chuẩn xác.
- [x] Task 2.3: Thực hiện test thủ công việc submit nhân sự `112933` (đã restore trên local DB) để đảm bảo không bị báo lỗi.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Báo cáo kết quả test thành công).

## Phase 3: Kiểm chứng Rollback

**Mục tiêu:** Đảm bảo quy trình phục hồi (rollback) hoạt động xác định và an toàn khi xảy ra sự cố.

- [x] Task 3.1: Thực hiện apply rollback thủ công bằng file `database/rollbacks/044_refine_prior_snapshot_check.rollback.sql` (đảm bảo đúng owner `postgres`, `SECURITY DEFINER`, `search_path = public`).
- [x] Task 3.2: Reload schema cache và chạy smoke test submit để verify rollback thành công.
- [x] Task 3.3: Re-apply lại Migration 044 trên local DB và reload schema cache để phục hồi trạng thái sẵn sàng cho release.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Đảm bảo quy trình rollback khả thi và đã được kiểm chứng thành công).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-29T10:30:00+07:00 | Phase 1 | Task 1.1 | Bắt đầu tạo file migration 044 trên Supabase | start | |
| 2026-07-29T10:30:30+07:00 | Phase 1 | Task 1.1, 1.2, 1.3 | Hoàn tất tạo các file SQL migration & rollback | done | |
| 2026-07-29T10:30:45+07:00 | Phase 1 | Task 1.4 | Bắt đầu sync và reset database local | start | |
| 2026-07-29T10:33:50+07:00 | Phase 1 | Task 1.Final | Reset database local thành công, apply migration 044 không lỗi | done | |
| 2026-07-29T10:38:00+07:00 | Phase 2 | Task 2.1 | Bắt đầu viết integration tests mới trong snapshots.test.ts | start | |
| 2026-07-29T10:38:40+07:00 | Phase 2 | Task 2.1 | Hoàn thành viết các test cases mới | done | |
| 2026-07-29T10:38:45+07:00 | Phase 2 | Task 2.2 | Chạy các integration test của snapshot | start | |
| 2026-07-29T10:46:50+07:00 | Phase 2 | Task 2.2 | Toàn bộ 43 test cases trong snapshots.test.ts đã pass 100% | done | |
| 2026-07-29T10:47:00+07:00 | Phase 2 | Task 2.3 | Tiến hành kiểm chứng thủ công submit nhân sự `112933` | start | |
| 2026-07-29T10:55:40+07:00 | Phase 2 | Task 2.3 | Submit thành công nhân sự 112933 bằng RPC, bỏ qua lỗi check kỳ lương tương lai | done | |
| 2026-07-29T10:56:00+07:00 | Phase 3 | Task 3.1 | Copy file rollback vào docker container và thực thi pg_restore/psql | start | |
| 2026-07-29T10:56:10+07:00 | Phase 3 | Task 3.1 | Khôi phục thành công hàm submit_employee_pending về phiên bản Migration 043 | done | |
| 2026-07-29T10:56:20+07:00 | Phase 3 | Task 3.2 | Chạy bộ test suite snapshots.test.ts | start | |
| 2026-07-29T10:56:25+07:00 | Phase 3 | Task 3.2 | Bộ test thất bại ở các trường hợp check mới (Chứng minh rollback hoạt động) | done | |
| 2026-07-29T10:56:30+07:00 | Phase 3 | Task 3.3 | Re-apply Migration 044 trên container local | start | |
| 2026-07-29T10:56:33+07:00 | Phase 3 | Task 3.3 | Re-apply Migration 044 thành công và re-seed dev users | done | |
| 2026-07-29T10:56:40+07:00 | Phase 3 | Task 3.Final | Chạy lại integration tests, 43 cases pass 100% | done | |
