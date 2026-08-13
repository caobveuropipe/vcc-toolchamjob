# Changelog - Database

> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> Hệ quản trị: PostgreSQL (Supabase)

---

## [2026-08-08] v8.0.0 - Migration 052 — Grandfather Inactive FKs, Add 6 UUID FKs to Transfer Pending RPC & Hardened Security

- **Migration 052** (`database/migrations/052_update_org_unit_triggers_and_pending_rpc.sql` & `supabase/migrations/052_update_org_unit_triggers_and_pending_rpc.sql`):
  - **Trigger Function `fn_trg_employees_org_unit_sync()`**:
    - Áp dụng cơ chế **Grandfathering Inactive Check**: Chỉ chặn gán MỚI các FK inactive (`is_active = false`) khi `TG_OP = 'INSERT'` hoặc FK tương ứng có sự thay đổi (`NEW.<fk> IS DISTINCT FROM OLD.<fk>`), không chặn hồ sơ lịch sử giữ nguyên node inactive.
    - Mở rộng kiểm tra validation phân cấp tổ chức cho cả 6 UUID FKs (`khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`).
  - **RPC `submit_employee_pending`**:
    - Bổ sung 6 UUID FKs vào danh sách Whitelist cho phép lưu từ bản nháp `pending_changes` sang thông tin chính thức của nhân sự khi duyệt Điều chuyển.
    - Thắt chặt phân quyền an toàn `REVOKE ALL FROM PUBLIC, anon, authenticated;` và `GRANT EXECUTE TO service_role;`.

---

## [2026-08-05] v7.9.0 - Migration 051 — Fix Cascade Deactivate Ordering, RPC NULL Safety, Atomic Subtree Reparenting & Machine Key Invariants

- **Migration 051** (`database/migrations/051_fix_cascade_array_order.sql`):
  - **RPC Preview & Execute Cascade Deactivate (`rpc_preview_cascade_deactivate`, `rpc_execute_cascade_deactivate`)**:
    - Bổ sung `ORDER BY id` vào `array_agg` trong recursive CTE để đảm bảo mảng ID trả về có thứ tự cố định tuyệt đối, loại bỏ race condition gây ngoại lệ `PREVIEW_STALE` giả tạo.
  - **RPC Update Org Unit (`rpc_update_org_unit`)**:
    - Thay thế `p_actor_role != 'SA'` bằng `p_actor_role IS DISTINCT FROM 'SA'`, khắc phục triệt để lỗ hổng fail-open khi `p_actor_role` bị truyền NULL.
    - Bổ sung luồng cập nhật top-down iterative subtree reparenting: Cập nhật `khoi = v_new_khoi` theo thứ tự cây từ trên xuống dưới khi SA thực hiện reparent cross-Khối.
    - Loại bỏ việc tự động ghi đè `employees.khoi` khi SA đổi tên hiển thị Khối, đảm bảo giữ nguyên `employees.khoi` machine key (`'Admicro'`, `'KND'`) phù hợp với ràng buộc `employees_khoi_check`.
  - **Trigger Invariants (`fn_trg_org_units_invariants`)**:
    - Nâng cấp trigger function bảo vệ tính bất biến của machine key `code` và `khoi` khi `type = 'khoi'` trên cả thao tác INSERT và UPDATE (`NEW.khoi := OLD.khoi; NEW.code := OLD.code;`).

---

## [2026-08-04] v7.8.0 - Migration 047 — Khóa chặt quyền & Atomic claim ready-only status trong onboarding RPC

- **Migration 047** (`database/migrations/047_enforce_ready_status_in_onboarding_rpc.sql`):
  - **RPC `fn_create_employee_onboarding(p_emp_data, p_salary_data, p_temp_uuid)`**:
    - **Security Isolation**: Execute `REVOKE ALL FROM PUBLIC, anon, authenticated;` và `GRANT EXECUTE TO service_role;` (SEC-REV-04 Standard). Direct RPC execution từ client công khai bị từ chối 42501 `permission denied`.
    - **Validate & Atomic Claim**: Sử dụng `SELECT ... FOR UPDATE` chỉ lock và claim các document thỏa mãn `temp_uuid = p_temp_uuid AND upload_status = 'ready' AND document_type = 'tuyen_moi' AND employee_id IS NULL`. Ném ngoại lệ `ERRCODE = 'P0002'` nếu không claim được document hợp lệ.
    - **Consume-once Semantics**: Clear `temp_uuid = NULL` sau khi gán `employee_id` cho document được claim nhằm ngăn ngừa replay attack và concurrent double-submit.
    - **`state_pending` Contract**: Ghi nhận `state_pending = (p_salary_data IS NOT NULL AND p_salary_data != '{}'::JSONB)` để bảo toàn tính toàn vẹn trạng thái lương.

## [2026-07-29] v6.6.0 - Migration 044 — Tinh chỉnh cơ chế check prior-period snapshot khi submit phòng chờ

- **Migration 044** (`database/migrations/044_refine_prior_snapshot_check.sql`):
  - **RPC `submit_employee_pending(p_ma_nhan_su, p_changed_by, p_temp_uuid)`**: Cập nhật logic hàm SQL:
    - Định nghĩa lại biến `v_is_new_hire`: Xác định một nhân sự là tuyển mới nếu họ ở phòng chờ (`state_phong_cho = true`), có tài liệu tuyển mới (`document_type = 'tuyen_moi'`), và chưa từng có snapshot được chốt (`NOT EXISTS` trong `snapshot_employees`). Điều này giúp xử lý đúng cả trường hợp nhân sự mới bị trả về phòng chờ (đã có history) hoặc có đính kèm thêm chứng từ điều chỉnh lương khác.
    - Đối với nhân sự tuyển mới, hệ thống chỉ kiểm tra khóa kỳ cho ngày vào công ty `ngay_vao_cong_ty`, bỏ qua ngày ký hợp đồng `ngay_ky_hd` ở tương lai.
    - Thiết lập cơ chế fallback tự động cho `v_check_dates` về live `ngay_vao_cong_ty` của nhân sự mới khi `pending_changes` trống để check block anti-drift chính xác.
    - Tự động clear `temp_uuid` cho toàn bộ tài liệu pending của nhân sự sau khi submit thành công.

## [2026-07-18] v6.5.0 - Migration 043 — Ngăn chặn duyệt nhân sự khi kỳ trước chưa chốt

- **Migration 043** (`database/migrations/043_prevent_submit_without_prior_snapshot.sql`):
  - **RPC `submit_employee_pending(p_ma_nhan_su, p_changed_by, p_khong_co_nnt)`**: Cập nhật logic hàm SQL:
    - Bổ sung luật check prior-period lock: Khi duyệt nhân sự ra khỏi phòng chờ, xác định kỳ lương tương ứng của các ngày hiệu lực thay đổi. Nếu kỳ liền trước đó $\ge$ `'2026-06'`, kiểm tra xem snapshot của khối tương ứng trong kỳ đó đã được chốt (`locked`) hay chưa.
    - Nếu chưa chốt, ném ngoại lệ DB chặn phê duyệt nhằm đảm bảo không gây lệch dữ liệu (drift) giữa kỳ trước và kỳ sau.

## [2026-07-17] v6.4.0 - Migration 042 — Tinh chỉnh cơ chế chốt snapshot phòng chờ

- **Migration 042** (`database/migrations/042_snapshot_pending_room_refinement.sql`):
  - **RPC `create_monthly_snapshot(p_month, p_khoi, p_created_by, p_start_date, p_end_date)`**: Cập nhật logic hàm SQL:
    - Chặn chốt snapshot đối với nhân sự mới chưa duyệt (đang ở phòng chờ và có chứng từ `tuyen_moi` pending) vướng ngày bắt đầu trước hoặc bằng ngày kết thúc kỳ lương.
    - Chặn chốt snapshot đối với nhân sự cũ đang ở phòng chờ có các thay đổi vướng ngày hiệu lực trong kỳ lương.
    - Cho phép copy các nhân sự phòng chờ khác vào snapshot bằng dữ liệu live (dữ liệu hiện tại, chưa áp dụng các pending changes của tương lai).

## [2026-07-17] v6.3.0 - Migration 041 — Cập nhật nghỉ việc hàng loạt qua Excel

- **Migration 041** (`database/migrations/041_bulk_resign_employees.sql`):
  - **RPC `bulk_resign_employees(p_records JSONB, p_actor_email TEXT, p_commit BOOLEAN)`**: Thực thi cập nhật nghỉ việc hàng loạt cho tối đa 200 nhân viên cùng lúc, hỗ trợ kiểm soát quyền EA theo khối, khóa kỳ (`is_period_locked`) và trạng thái terminal. Tự động ghi chép `change_history` và `audit_log`. Sử dụng `TRUNCATE` thay vì `DELETE` trên bảng tạm để vượt qua cấu hình `safeupdate` của Supabase.
  - **RPC `fn_rollback_bulk_resignation(p_audit_log_id BIGINT, p_actor_email TEXT)`**: Hỗ trợ hoàn tác (rollback) toàn bộ các thay đổi của một đợt import dựa trên ID Audit Log cho tài khoản Super Admin.

## [2026-07-17] v6.2.0 - Migration 040 — Đồng bộ Nhuận bút cơ chế (Case 1)

- **Migration 040** (`database/migrations/040_reconcile_salary_journal_fees.sql`):
  - Đồng bộ hóa dữ liệu nhuận bút cơ chế nội bộ (`nhuan_but_cc`) cho **364 ca đặc biệt** (những ca có `nhuan_but_gt > 0`, `nhuan_but_cc = 0`, `luong_hieu_suat_gt = 0` và `nhuan_but_gt = thuong_hieu_suat_cham_job_nhuan`).
  - Cập nhật chuyển toàn bộ giá trị từ `thuong_hieu_suat_cham_job_nhuan` sang `nhuan_but_cc` và xóa giá trị cũ (`thuong_hieu_suat_cham_job_nhuan = 0`).
  - Thực thi trong transaction an toàn, tự động tạo bảng sao lưu `backup_salaries_reconcile_040` (lưu trữ trong 30 ngày), đồng thời ghi nhận chi tiết 728 bản ghi lịch sử thay đổi (`change_history`) và 1 log tổng hợp vào `audit_log` phục vụ hậu kiểm.

## [2026-07-16] v6.1.0 - Migration 039 — Dọn dẹp trường lương trùng lặp

- **Migration 039** (`database/migrations/039_clear_redundant_salary.sql`):
  - Thực hiện cập nhật đặt giá trị của các cột dư thừa `okr_cc` và `thuong_doanh_so_cc` về `NULL` đối với tất cả các nhân sự đã hoạt động (`state_phong_cho = false`).
  - Ràng buộc và assert chính xác số bản ghi bị ảnh hưởng (61 bản ghi mismatch được phát hiện trước đó) trong một transaction duy nhất để đảm bảo an toàn dữ liệu.

## [2026-07-14] v6.0.0 - NS-003: Migration 038 — Chốt dữ liệu hàng tháng

- **Migration 038** (`database/migrations/038_update_snapshot_logic.sql`):
  - **Alter `snapshots`**: mở rộng CHECK `snapshot_status` → `('draft','locked','deleted')`; thêm cột `supplemental_employees_count INT DEFAULT 0`, `locked_by TEXT`, `period_start DATE NOT NULL`, `period_end DATE NOT NULL` (backfill 3-bước từ cột `month` theo rule 27-26 trước khi NOT NULL).
  - **Alter `snapshot_employees`**: thêm cột `is_supplemental BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `updated_by TEXT`.
  - **Bảng mới `snapshot_supplemental_pending`**: phòng chờ bổ sung; `snapshot_id REFERENCES snapshots ON DELETE RESTRICT`, `ma_nhan_su VARCHAR`, `employee_data JSONB NOT NULL`, `status CHECK('pending','approved','rejected')`, UNIQUE `(snapshot_id, ma_nhan_su)`. RLS `USING(false) WITH CHECK(false)` chặn mọi truy cập trực tiếp.
  - **DB Helper `is_period_locked(p_date DATE, p_khoi TEXT) RETURNS BOOLEAN`**: kiểm tra `p_date BETWEEN period_start AND period_end` trên snapshot `locked`, bỏ qua `deleted`; null-safe (`IF p_date IS NULL THEN RETURN FALSE`).
  - **RPC `create_monthly_snapshot` (5 params — thay thế 3 params cũ)**: kéo nhân sự theo `[p_start_date, p_end_date]` (rule 27-26); tái sử dụng row `draft`/`deleted` thay vì hard-delete; auto-restore bản ghi `approved` từ `snapshot_supplemental_pending` khi khôi phục Live Master; xử lý Re-finalization Override (official ghi đè supplemental → reject + audit `system-refinalization-override`).
  - **RPC `approve_supplemental_snapshot(pending_ids[], p_actor_email)`**: Bulk approve All-or-Nothing với SELECT FOR UPDATE; ép zero SUPPLEMENTAL_ZERO_FIELDS; tính lại `supplemental_employees_count` bằng COUNT thực tế.
  - **RPC `revoke_supplemental_snapshot(pending_id, p_actor_email)`**: xóa khỏi `snapshot_employees`, đổi status → pending, tính lại count.
  - **RPC `restore_snapshot_from_excel(p_snapshot_id UUID, p_rows JSONB, p_actor_email TEXT)`**: khôi phục atomic từ Excel; update snapshot → draft, DELETE toàn bộ snapshot_employees, INSERT từng row mới với `is_supplemental = false` và whitelist column, update `total_employees` và `supplemental_employees_count = 0`.
  - **Lưu ý triển khai**: Sau khi chạy migration, bắt buộc chạy `NOTIFY pgrst, 'reload schema'` trên Supabase để PostgREST nhận biết các function mới.

## [2026-06-18] v5.9.0 - Tích hợp Người nghiệm thu chính thức vào Form & Sửa hồ sơ
- **Migration 037**:
  - Cập nhật định nghĩa của hàm SQL `submit_employee_pending` nhằm xử lý đồng bộ mảng `reviewer_emails` từ `pending_changes` sang bảng `employee_reviewers` (xoá bản ghi cũ và insert bản ghi mới tương ứng với `p_changed_by`).
  - Kiểm tra sự tồn tại của key `reviewer_emails` trong JSON pending (`v_emp_pending ? 'reviewer_emails'`), chỉ đồng bộ khi thực sự có thay đổi từ trường này để tránh xóa nhầm dữ liệu người nghiệm thu.

## [2026-06-17] v5.8.0 - Bổ sung Người nghiệm thu thử việc
- **Migration 036**: 
  - Thêm cột `nguoi_nghiem_thu_thu_viec` (TEXT) vào bảng `employees` kèm ràng buộc CHECK format email (`chk_nguoi_nghiem_thu_thu_viec_email`).
  - Cập nhật định nghĩa view `employee_full` và `employee_info_only` chứa cột mới.
  - Cập nhật RPC `fn_create_employee_onboarding` để hỗ trợ insert trường mới.
  - Cập nhật RPC `submit_employee_pending` hỗ trợ mapping, so sánh và áp dụng trường mới từ JSON `pending_changes`.

## [2026-05-28] v5.7.0 - Gộp lịch sử thay đổi thông tin và lương thành một (merge-grouped-change-history)
- **Migration 034**: Tạo RPC `get_grouped_change_history` để gom nhóm các bản ghi lịch sử theo thời gian, người thực hiện, lý do và tài liệu. Tính toán sẵn phân quyền hiển thị lương (Salary Isolation) trực tiếp dưới Database giúp tối ưu hiệu năng và bảo mật.
- **Migration 035**: Cập nhật hàm `fn_create_employee_onboarding` và `submit_employee_pending` để giữ lại ID giấy tờ tạm (`_temp_uuid`) và gắn mã nhân sự chính xác vào `change_history` khi tạo mới nhân sự. Thực hiện truy vấn Data Backfill tự động để nối các giấy tờ cũ bị mất liên kết vào bản ghi lịch sử tương ứng.

## [2026-05-26] v5.5.0 - Xuất danh sách làm thưởng KD (kèm lương)
- **Migration 033**: Tạo RPC `export_probation_employees` hỗ trợ xuất danh sách nhân sự kèm lương để tính thưởng kinh doanh:
    - Loại bỏ lọc trạng thái thử việc (`trang_thai = 'thu_viec'`), xuất toàn bộ nhân viên đang làm việc (`state_phong_cho = false`).
    - Hỗ trợ tham số `p_unrestricted` (SA xuất full) và mảng `p_khoi_list` (EA chỉ xuất khối quản lý).
    - Bảo mật RPC bằng `SECURITY DEFINER` và `SET search_path = public`, thu hồi quyền thực thi từ `PUBLIC, anon, authenticated` và chỉ `GRANT EXECUTE` cho `service_role`.

## [2026-05-25] v5.4.0 - Gợi ý Người nghiệm thu (NNT) v2 & Fix lỗi UI phòng chờ
- **Migration 031**: Tạo RPC `fn_suggest_reviewers(p_ma_nhan_su text, p_use_pending boolean DEFAULT false)`:
    - Thực hiện fallback chain tìm NNT theo mức độ ưu tiên giảm dần: `line_nhan_su` -> `nhom_team` -> `bo_phan` -> `phong_ban` -> `khoi`.
    - Bảo mật RPC bằng `SECURITY DEFINER` và `SET search_path = public`, thu hồi quyền thực thi từ `PUBLIC, anon, authenticated` và chỉ `GRANT EXECUTE` cho `service_role`.
- **Migration 032**: Nâng cấp RPC `fn_suggest_reviewers` lên V2:
    - Enforce điều kiện bắt buộc `khoi` và `line_nhan_su` là điều kiện tiên quyết, sau đó kết hợp `AND` với các cấp tổ chức khác.
    - Giới hạn lấy tối đa Top 2 người nghiệm thu dựa trên tần suất xuất hiện và ngày gán mới nhất (`ORDER BY COUNT(*) DESC, MAX(created_at) DESC LIMIT 2`).

## [2026-05-18] v5.2.0 - Scoped RPC for NNT Filter (Bypass 414 URL-too-long)
- **Migration 030**: Tạo RPC `get_employee_info_scoped(p_unrestricted, p_khoi, p_ma_nhan_su, p_emp_ids)`:
    - Trả về `SETOF employee_info_only` giúp nén logic truy vấn scope-aware nhân sự xuống DB level.
    - Nhận các mảng điều kiện qua body (POST) giúp giải quyết dứt điểm lỗi `414 URI Too Long` cho cả phân quyền Reviewer và bộ lọc NNT lớn.
    - Thực thi chính sách bảo mật: `REVOKE EXECUTE FROM PUBLIC`, chỉ `GRANT EXECUTE TO service_role`.

## [2026-05-13]
- **Migration 029**: Bổ sung khối **'Support'** vào ràng buộc `CHECK` của bảng `employees` và `user_permissions`.

## [2026-05-13] v5.1.0 - Admin Bulk Cleanup (Hard Delete)
- **Migration 028**: Tạo RPC `fn_bulk_hard_delete_employees(p_ma_nhan_sus, p_actor_email)`:
    - Thực hiện xóa vĩnh viễn (Hard Delete) mảng nhân sự kèm theo logic cascading delete (salaries, reviewers, change_history).
    - Tự động thu thập danh sách `object_key` từ bảng `employee_documents` để service thực hiện dọn dẹp R2.
    - Ghi Audit Log hành động `bulk_hard_delete_baseline` chứa danh sách mã nhân sự và file R2 bị xóa.
    - Sử dụng `SECURITY DEFINER` để bypass RLS, dành riêng cho Super Admin.

## [2026-05-13] v5.0.0 - Atomic Evaluation & Personnel Save Refactor
- **Migration 027**: Tạo RPC `fn_evaluate_probation(p_ma_nhan_su, p_payload, p_temp_uuid, p_actor_email)`:
    - Thực hiện chuyển trạng thái (Thử việc -> Chính thức/Nghỉ việc) và cập nhật lương chờ duyệt trong một transaction nguyên tử.
    - Tự động liên kết tài liệu từ `temp_uuid` và ghi Audit Log chi tiết.
- **Migration 026**: Cập nhật RPC `save_personnel_pending`:
    - Cho phép lưu trữ cờ `is_probation_eval` vào JSON `pending_changes` của nhân sự.
    - Refactor renumbering (trước đó là 025) để tránh xung đột với các migration tồn tại.
- **Migration 025**: Thêm RPC `fn_reject_employee_pending` (Renumbering):
    - Đảm bảo tính nhất quán về thứ tự migration khi merge nhánh.

## [2026-05-07]
### perf(search): tạo GIN Index tối ưu tìm kiếm nhân sự
- **Migration**: Chạy `024_search_gin_index.sql` để bật extension `pg_trgm` (nếu chưa có).
- **Index**: Tạo index kiểu GIN với toán tử `gin_trgm_ops` cho 2 cột `email` và `ma_nhan_su` trên bảng `employees`.
- **Query Plan**: Tối ưu hóa API tìm kiếm bằng cách thay thế toán tử `Seq Scan` nặng nề bằng các `Bitmap Index Scan` kết hợp `BitmapOr` siêu nhẹ, giảm tải latency đáng kể.

## [2026-05-07] v4.7.0 - Personnel Pending Merge & Transfer
- **Migration 025**: Thêm RPC `save_personnel_pending` hỗ trợ `jsonb_concat` (merge) để bảo toàn dữ liệu nháp cũ khi lưu thay đổi hồ sơ.
- **Support**: Bổ sung logic bind tài liệu minh chứng qua `p_temp_uuid` trong RPC lưu nháp.

## [2026-05-07] v4.6.0 - Reject Pending Changes
- **Migration**: Chạy `024_add_reject_pending_function.sql`:
    - Mở rộng CHECK constraint cho `audit_log.action` để hỗ trợ hành động `'reject'`.
    - Tạo RPC `fn_reject_employee_pending(ma_nhan_su, changed_by)`:
        - Atomic reset `pending_changes` và `state_phong_cho` của cả `employees` và `salaries`.
        - Tự động ghi nhật ký vào `audit_log` kèm bản lưu các thay đổi bị hủy.
        - Sử dụng `SECURITY DEFINER` để đảm bảo quyền dọn dẹp dữ liệu rác.


## [2026-05-06]
### feat: liên kết giấy tờ vào lịch sử thay đổi
- **Migration**: Chạy `023_add_document_link_to_history.sql`:
    - Thêm cột `document_id` (UUID, FK referencing `employee_documents`) vào bảng `change_history`.
- **Migration**: Chạy `022_add_adj_date_to_submit_pending.sql`:
    - Cập nhật logic `submit_employee_pending` để bóc tách ngày điều chỉnh từ JSON payload và phục hồi Salary Isolation.
- **RPC**: Cập nhật `submit_employee_pending` (Migration 023):
    - Tự động tìm kiếm và gán `document_id` vào các bản ghi `change_history` mới tạo trong transaction dựa trên `p_temp_uuid`.
    - **Fix**: Khôi phục logic trích xuất `ngay_dieu_chinh_luong` từ salary pending sang employee pending.
    - **Fix**: Hỗ trợ persist `is_target_cc_include_kn_m1` kèm ép kiểu BOOLEAN.
    - **Maintenance**: Thêm `DROP FUNCTION` vào đầu migration để dọn dẹp signature cũ (fix lỗi PGRST203).

## [2026-05-04] - Salary Target Validation & RPC Update
### feat: enforce validation công thức lương và thêm checkbox KN M1
- **Migration**: Chạy `020_add_salary_target_include_kn_checkbox.sql`:
    - Thêm cột `is_target_cc_include_kn_m1` (BOOLEAN, default FALSE) vào bảng `salaries` và `snapshot_employees`.
- **RPC**: Cập nhật `submit_employee_pending` (Migration `021_update_submit_pending_for_checkbox.sql`):
    - Mở rộng logic mapping để hỗ trợ trường kiểu BOOLEAN từ JSON `pending_changes`.
    - Cập nhật danh sách `v_salary_fields` để đồng bộ với `SALARY_FIELDS` (28 fields).

## [2026-04-23]
### feat: bổ sung trường thông tin liên hệ phụ cho nhân sự
- **Migration**: Chạy `019_add_secondary_contact_info.sql`:
    - Thêm cột `thong_tin_lien_he_phu` (TEXT) vào bảng `employees`.
    - Cập nhật function `bulk_import_block_1(p_data JSONB)` để map trường `ghi_chu` từ Excel sang cột mới này.
- **Script**: Cập nhật `create_employee_import_template.mjs` để bổ sung cột "Ghi chú" vào template mẫu.

## [2026-04-22]
### feat: RPC hỗ trợ bulk import nhân sự và lương (bypass RLS)
- **Migration**: Chạy `018_bulk_import_rpc_and_audit.sql`:
    - Tạo RPC `bulk_import_block_1(p_data)` — hỗ trợ insert hàng loạt mảng JSONB chứa cả Employee và Salary.
    - Áp dụng chính sách `ON CONFLICT (ma_nhan_su) DO NOTHING` để thực thi rule **Insert Only**.
    - RPC được định nghĩa với `SECURITY DEFINER` để bypass triệt để RLS trong quá trình di cư dữ liệu Admin.
    - Tự động ghi chép `audit_log` cho hành động `bulk_import` kèm thống kê số lượng bản ghi.

## [2026-04-17]
### feat: bổ sung cột lương mới và RPC Atomic Onboarding (ea-personnel-salary-integration)
- **Migration**: Chạy `017_ea_personnel_salary_integration.sql`:
    - Thêm 5 cột vào bảng `salaries`: `bac_luong` (TEXT), `ty_le_luong_tv` (NUMERIC), `nhuan_but_cc` (NUMERIC), `okr_cc` (NUMERIC), `thuong_doanh_so_cc` (NUMERIC).
    - Thêm 5 cột tương ứng vào bảng `snapshot_employees`.
- **RPC**: Tạo `fn_create_employee_onboarding(p_emp_data, p_salary_data, p_temp_uuid)` — Atomic INSERT Employee + Salary + Bind Documents trong một transaction duy nhất (`SECURITY DEFINER`).
- **RPC**: Cập nhật `submit_employee_pending` — mở rộng `v_salary_fields` từ 25 → 30, thêm logic rẽ nhánh TEXT cho `bac_luong`.
- **View**: Cập nhật `employee_full` bổ sung 5 cột mới vào SELECT.
- **Function**: Cập nhật `create_monthly_snapshot` bổ sung 5 cột mới vào INSERT...SELECT.

## [Phase 5] Production Polish, Demo & Go-live (2026-04-08)
### feat: Optimization và Monitoring Setup
- **Migrations**: Chạy `016_production_indexes.sql` bổ sung 3 index chiến lược (B-Tree trên `created_at` và `id`, GIN trên `audit_log.details`). Giải quyết triệt để bài toán query chậm dữ liệu JSONB và lọc theo khoảng thời gian xuất file báo cáo dài hạn.
- **Seeders**: Khởi tạo Script `seed-mock-data.ts` đẩy 4000 bản ghi nhân sự giả định vào DB phục vụ kịch bản Load Testing Export Excel 4000+ nhân viên.

## [2026-04-07]
### feat: isolate Salary Pending và Atomic Submit (salary-pending-isolation)
- **Migration**: Chạy `013_backfill_salary_rows.sql` đảm bảo 100% nhân sự có bản ghi lương tương ứng.
- **Migration**: Chạy `014_submit_employee_pending_function.sql` cập nhật logic submit atomic.
- **Migration**: Chạy `015_salary_pending_isolation.sql` thêm cột `pending_changes` và `state_pending` vào bảng `salaries`, đồng thời migrate dữ liệu lương chờ duyệt từ bảng `employees` sang `salaries`.
- **RPC**: Triển khai `save_salary_pending` hỗ trợ lưu lương chờ duyệt an toàn với cơ chế transaction và lock bản ghi nhân sự.

## Migrations NS-002 (2026-04-07)
### Added
- `013_backfill_salary_rows.sql`: Tạo và điền dữ liệu lương mặc định cho nhân sự hiện có.
- `014_submit_employee_pending_function.sql`: SQL Function `submit_employee_pending` xử lý duyệt hồ sơ atomic.
- `015_salary_pending_isolation.sql`:
    - Thêm cột `pending_changes` và `state_pending` vào bảng `salaries`.
    - Data migration: Chuyển dữ liệu nháp lương từ `employees` sang `salaries`.
    - Tạo RPC `save_salary_pending` với cơ chế Row-level Lock an toàn.

## [2026-04-05]
### feat: Dual Enum Migration và bổ sung Cột Cờ Bypass NNT (pending-room-audit-fixes)
- **Migration**: Chạy `010_dual_enum_migration.sql` đổi value `dang_lam` sang `chinh_thuc` (trạng thái), và `chinh_thuc` sang `nhan_vien` (loại hợp đồng).
- **Table**: Cấu trúc mới `011_khoi_managers.sql` lưu map quản lý Khối.
- **Table**: Cấu trúc mới `012_employee_khong_co_nnt.sql` thêm cờ boolean `khong_co_nnt` vào bảng `employees`.
- **View**: Đồng bộ các cột mới vào view ảo database để API có thể query trực tiếp.

## [2026-04-01]

### feat: kiến trúc lưu trữ hồ sơ nhân sự và AI Cache (Phase E)
- **Infrastructure**: Khởi tạo bảng `employee_documents` lưu trữ metadata file (Migration 006).
- **Schema**: Bổ sung cột `ocr_result` vào bảng `employee_documents` (Migration 007).
- **Audit**: Mở rộng action types cho `audit_log` (Migration 008).
- **RPC**: Thêm `bulk_update_reviewers` cho thao tác hàng loạt (Migration 009).

## [2026-03-31]
### feat: đồng bộ hóa Code Layer với schema v2.5.1 (Migrations 002-005)
- **Sync**: Đã hoàn thiện đồng bộ hóa toàn bộ Frontend, Backend và Shared package để khớp với các thay đổi trong Database từ migration 002 đến 005.
- **Constraints**: Cập nhật logic Form và Backend service để tôn trọng các ràng buộc mới (`khu_vuc`, `tam_ung_hang_thang`).

### feat: hỗ trợ thay đổi Mã nhân sự (Immutable-to-Mutable transition)
### Fixed
- **History**: Sửa lỗi phân trang cho vai trò VI (chỉ xem hồ sơ) trong API `/api/change-history/:ma_nhan_su`. Chuyển logic lọc `SALARY_FIELDS_SET` trực tiếp vào query Supabase thay vì lọc tại ứng dụng, đảm bảo `total` count và kết quả trả về chính xác theo trang.
- **Salary**: Khôi phục 3 trường lương (`nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`) bị thiếu trong `SALARY_FIELDS`, bảo vệ Salary Isolation cho role VI.
- **Integration**: Bổ sung integration test `salary.test.ts` verify trọn vẹn luồng submit với các trường mới của migration 023.
- **Constraint**: Cập nhật Foreign Key `fk_change_history_employee` của bảng `change_history` thêm `ON UPDATE CASCADE`. 
- **Rationale**: Cho phép chuyển đổi Mã nhân sự từ dạng tạm thời (TMP) sang mã chính thức (100xxx) mà không làm mất hoặc vi phạm tính vẹn toàn của lịch sử thay đổi trước đó.
- **Migration**: Tạo file migration `005_fk_cascade_update.sql`.
- Files: `database/001_schema.sql`, `database/migrations/005_fk_cascade_update.sql`.

## [2026-03-25] - Schema v2.5.0
### feat: thêm trường tạm ứng hàng tháng vào bảng salaries
- **Schema**: Thêm cột `tam_ung_hang_thang` vào bảng `salaries` và `snapshot_employees` (NUMERIC, nullable).
- **View**: Cập nhật view `employee_full` (chứa cột mới) và `employee_info_only` (không chứa cột này để bảo mật).
- **Snapshot**: Cập nhật function `create_monthly_snapshot` tự động copy giá trị cột mới sang snapshot.
- **Task**: Mã hóa và verify tính idempotent cho file migration `003_add_tam_ung_hang_thang.sql`.

## [2026-03-16]
### fix: sửa lỗi migration và verify bảo mật
- **RLS**: Sửa lỗi sai tên bảng trong migration `002_lock_authenticated_rls.sql` (từ `monthly_snapshots` thành `snapshots`).
- **Verify**: Bổ sung `VITE_SUPABASE_ANON_KEY` phục vụ script `verify-rls.ts` giúp kiểm tra thực tế chính sách bảo mật.

## [2026-03-14] - Schema v2.4.0
### security: hardening database & Phase 0 schema deployment
- **SEC-REV-02**: Thêm view `employee_info_only` (chỉ chứa employee fields, an toàn cho VI).
- **SEC-01->05**: Enforce RLS `USING(false)` trên **TẤT CẢ 9 bảng** chặn truy cập trực tiếp qua anon key.
- **DB-06**: Thêm action `'export'`, `'api_blocked'`, `'access_denied'` vào `audit_log.action`.
- **PERF-01**: Mở rộng GIN index (Trigram) cho `ho_va_ten` hỗ trợ search tiếng Việt không dấu.
- **SNAP-02**: Rename `snapshot_date` -> `locked_at` trong bảng snapshots.
- **Workflow**: Chốt quy ước Migration file (002_xxx.sql) với thuộc tính idempotent (IF NOT EXISTS).

---

## [2026-03-13] - Schema v2.3.0
### feat: hoàn thiện logic snapshots & security refinements
- **SNAP-04**: Thêm logic rechốt snapshot (unlock giữ data cũ, re-copy data mới).
- **DB-02**: Function `create_monthly_snapshot` tự động filter nhân sự nghỉ việc theo tháng snapshot.
- **SEC-02**: Kích hoạt RLS cho 3 bảng cốt lõi: `employees`, `salaries`, `employee_reviewers`.

---

## [2026-03-13] - Schema v2.1.0
### fix!: tách bảng người nghiệm thu (normalize data)
- **Schema**: Xóa cột `nguoi_nghiem_thu` trong `salaries` -> tách thành bảng `employee_reviewers` (1-N).
- **Constraints**: Thêm ràng buộc `ma_nhan_su` alphanumeric và min 3 ký tự.
- **Indexes**: Thêm index reporting (bu, phong_ban) trên `snapshot_employees`.

---

## [2026-03-12] - Schema v2.0.0
### feat!: Breaking changes & Schema redesign
- **Auth**: Bỏ bảng `user_roles` -> dùng `user_permissions` (per khối) và `superadmins`.
- **Renames**: Chuẩn hóa tên cột dự án (`lcd` -> `lcd_gt`, `phong_cho` -> `state_phong_cho`).
- **New fields**: Thêm `ky_nghiem_thu` (thang/quy).

---

*Cập nhật bởi skill-project-init*
