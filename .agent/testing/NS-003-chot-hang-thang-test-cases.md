# NS-003 — Chốt dữ liệu nhân sự hàng tháng — Test Cases

> Phạm vi: Backend Integration Tests (108/108 pass) + Manual Smoke Tests Frontend
> Test file: `backend/src/__tests__/integration/snapshots.test.ts` (20 tests), `isPeriodLocked.test.ts` (7 tests)
> Cập nhật: 2026-07-14

---

## Happy Path

### Snapshot Lifecycle
- [ ] EA tạo snapshot mới: chọn đúng Tháng + Khối → API `POST /create` → snapshot ở trạng thái `draft`, `period_start` và `period_end` được tính đúng rule 26-25
- [ ] SA lock snapshot: `PUT /:id/lock` → `snapshot_status = 'locked'`, `locked_at` và `locked_by` = email SA
- [ ] SA unlock snapshot: `PUT /:id/unlock` → `snapshot_status = 'draft'`, `locked_at = NULL`, `locked_by = NULL`
- [ ] EA export trước xóa: `GET /:id/export-before-delete` → tải file Excel watermark về máy, header `X-Snapshot-Updated-At` có giá trị
- [ ] EA xóa snapshot: `DELETE /:id?version_updated_at=...` → `snapshot_status = 'deleted'`, `snapshot_employees` bị xóa sạch, `snapshot_supplemental_pending` bảo toàn nguyên vẹn
- [ ] Active keys API: `GET /active-keys?thang=T6.2024` với `x-api-key` hợp lệ → danh sách key đúng format `T6.2024-XXXXX-KHO`

### Anti-drift Guard (isPeriodLocked)
- [ ] `PUT /api/employees/:id` khi kỳ bị locked → HTTP 423 với message kỳ bị khoá
- [ ] `PUT /api/employees/:id/state` khi kỳ bị locked → HTTP 423
- [ ] `DELETE /api/employees/:id` khi kỳ bị locked → HTTP 423
- [ ] Cùng employee nhưng kỳ KHÔNG locked → cho phép bình thường
- [ ] `is_period_locked` với ngày 25 (trong kỳ) → RETURN TRUE; ngày 26 (kỳ sau) → RETURN FALSE

### Chốt Bổ Sung
- [ ] EA preview Excel bổ sung: `POST /:id/supplemental/preview` → danh sách rows với `validation.status = 'valid'`
- [ ] EA commit: `POST /:id/commit` → upsert vào `snapshot_supplemental_pending`; MA_NS trùng với `approved` trả 409
- [ ] SA approve: `POST /:id/approve` → row vào `snapshot_employees` với `is_supplemental = true`, tất cả SUPPLEMENTAL_ZERO_FIELDS = 0, `supplemental_employees_count` tính lại đúng
- [ ] SA revoke: `POST /:id/revoke` → xóa khỏi `snapshot_employees`, status → pending, count tính lại
- [ ] SA reject: `POST /:id/reject` → status → rejected

### Full Restore
- [ ] Tải template: `GET /template` → file Excel với đúng cấu trúc column
- [ ] Preview restore: `POST /:id/restore/preview` → danh sách rows với validation
- [ ] Restore từ Excel: `POST /:id/restore` → `snapshot_status = 'draft'`, `total_employees = N`, `supplemental_employees_count = 0`, tất cả rows `is_supplemental = false`
- [ ] Restore-live (Live Master): `POST /:id/restore-live` → snapshot khôi phục từ dữ liệu sống; nếu nhân sự chính thức trùng mã với supplemental approved → official ghi đè, supplemental bị `rejected`

### Re-finalization Override
- [ ] Chốt lại Live Master với MA_NS trùng supplemental approved → bản ghi supplemental trong `snapshot_employees` bị xóa, row chính thức được insert, `snapshot_supplemental_pending.status = 'rejected'`, audit log ghi `system-refinalization-override`

---

## Edge Cases

- [ ] Snapshot `deleted` → khôi phục lại Live Master → bản ghi `approved` trong bảng tạm tự động được phục hồi vào `snapshot_employees`, `supplemental_employees_count = N`
- [ ] Approve idempotent: approve lại row đã `approved` → RPC trả mảng rỗng, không lỗi trùng
- [ ] `version_updated_at` không khớp khi DELETE → HTTP 409 yêu cầu export lại
- [ ] Khôi phục Excel có cột `is_supplemental = true` → backend bỏ qua, gán cứng `false`
- [ ] Tháng format `T06.2024` vs `T6.2024` → active-keys chuẩn hoá về `2024-06`, trả kết quả giống nhau
- [ ] is_period_locked với `p_date = NULL` → RETURN FALSE (null-safe)
- [ ] Snapshot bị `deleted` không xuất hiện trong kết quả active-keys

---

## Negative Cases

- [ ] `GET /active-keys` không có header `x-api-key` → HTTP 401
- [ ] `GET /active-keys` với key sai → HTTP 401
- [ ] `GET /active-keys` với `thang` sai format → HTTP 400
- [ ] `POST /:id/commit` khi snapshot `locked` → HTTP 409
- [ ] `POST /:id/commit` khi snapshot `deleted` → HTTP 409
- [ ] `DELETE /:id` khi snapshot `locked` → HTTP 409 `SNAPSHOT_LOCKED`
- [ ] `PUT /:id/lock` khi snapshot `deleted` → HTTP 409 hoặc 404
- [ ] Excel bổ sung có MA_NS trùng nhau trong cùng file → HTTP 400 (duplicate in-memory check)
- [ ] Excel khôi phục có MA_NS trùng nhau → HTTP 400
- [ ] File Excel vượt MAX_ROWS 5000 → HTTP 413
- [ ] Approve batch có 1 `pending_id` không tồn tại → toàn bộ batch rollback, HTTP 400
- [ ] Approve row đang `rejected` (chưa re-upload) → HTTP 400

---

## Security

- [ ] VA gọi `POST /create` → HTTP 403 (chỉ SA/EA mới được tạo)
- [ ] VA gọi `PUT /:id/lock` → HTTP 403 (SA-only)
- [ ] EA thuộc khối "Admicro" không được xem snapshot của khối "KNS" qua `GET /`
- [ ] Thử inject SQL qua `thang` param → bị Zod reject trước khi vào DB
- [ ] Upload file > 5MB → HTTP 413 do `bodyLimit`
- [ ] RLS trực tiếp (anon key) trên `snapshot_supplemental_pending` → bị chặn hoàn toàn bởi `USING(false)`

---

## Regression Notes

- Sau mỗi lần chạy migration mới trên Supabase, bắt buộc chạy `NOTIFY pgrst, 'reload schema'` để PostgREST nhận biết các function mới — thiếu bước này sẽ gây lỗi 500 "function not found in schema cache".
- `create_monthly_snapshot` 3-param cũ đã bị DROP trong migration 038; mọi caller phải dùng 5-param mới (`p_month, p_khoi, p_actor_email, p_start_date, p_end_date`).
- `audit_log.action` có CHECK constraint chặt — chỉ dùng các action được liệt kê trong `001_schema.sql` (như `snapshot_create`, `snapshot_lock`, `snapshot_unlock`, `delete`, `export`, `update`). Không tự thêm action mới.

---

## Pending Room & New Hire Refined Rules (2026-07-17)

- [ ] **Case 1: Nhân sự mới chưa duyệt (New Hire Draft) vướng ngày vào công ty <= ngày 25 tháng này** -> Màn hình Chốt danh sách hiển thị chặn chốt (Block = true) và ghi nhận lỗi.
- [ ] **Case 2: Nhân sự mới chưa duyệt có ngày vào công ty >= ngày 26 tháng này (kỳ sau)** -> Màn hình Chốt danh sách KHÔNG bị chặn chốt và khi tạo snapshot, nhân sự này không có trong snapshot.
- [ ] **Case 3: Nhân sự cũ trong phòng chờ có thay đổi vướng ngày hiệu lực trong kỳ [26 tháng trước, 25 tháng này]** -> Màn hình Chốt danh sách hiển thị chặn chốt.
- [ ] **Case 4: Nhân sự cũ trong phòng chờ có thay đổi hiệu lực ở tương lai (kỳ sau)** -> Màn hình Chốt danh sách KHÔNG bị chặn chốt. Khi chốt thành công, thông tin trong snapshot sử dụng dữ liệu live hiện tại (chưa áp dụng thay đổi kỳ sau).
