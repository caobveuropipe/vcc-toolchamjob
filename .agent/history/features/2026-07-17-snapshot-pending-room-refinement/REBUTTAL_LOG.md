## Round 1 - 2026-07-17T15:49:00+07:00

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - `docs/business-flows/09-chot-danh-sach-thang.md`
  - `.agent/business/data/STATE_MACHINES.md`

### EFR Đã Chấp Nhận -> [FR-01]: Plan chưa cập nhật nguồn chân lý nghiệp vụ đang mâu thuẫn với rule mới | Sửa: Bổ sung 2 tài liệu nghiệp vụ vào phạm vi sửa đổi và thêm nhiệm vụ cập nhật trong Tasks.
### EFR Đã Chấp Nhận -> [FR-02]: Contract SQL cho `TMP%` chưa đủ rõ để tránh dùng sai nguồn ngày vào công ty | Sửa: Xác định chi tiết SQL Contract cho việc chặn chốt nhân viên mới và cơ chế sao chép nhân viên phòng chờ.
### EFR Đã Chấp Nhận -> [FR-03]: Plan thiếu các mục bắt buộc của template cho migration/RPC có rủi ro | Sửa: Bổ sung các phần Risk Triage, Deployment, Rollback và Task reference theo template chuẩn.
### EFR Đã Chấp Nhận -> [FR-04]: Test plan chưa bao phủ các nhánh regression quan trọng của rule mới | Sửa: Bổ sung 5 trường hợp kiểm thử tích hợp biên và kiểm thử đồng bộ `/restore-live`.

### Vùng đã scan khi không có SFR ->
- `.agent/active/snapshot-pending-room-refinement/FEATURE_PLAN.md` (kiểm tra cấu trúc và tính tương thích template)
- `database/migrations/038_update_snapshot_logic.sql` (quét logic `create_monthly_snapshot`)

---

## Round 2 - 2026-07-17T16:11:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - `database/migrations/038_update_snapshot_logic.sql`
  - `backend/src/services/employeeService.ts`

### EFR Đã Chấp Nhận -> [EFR-01]: New hire không luôn được định danh bằng `TMP%`, nên rule snapshot mới có thể copy nhầm nhân sự mới chưa submit | Sửa: Thay đổi định dạng xác thực nhân sự mới trong SQL Contract & Giả định. Chuyển sang sử dụng kiểm tra sự tồn tại trong bảng `change_history` (`NOT EXISTS (SELECT 1 FROM change_history WHERE ma_nhan_su = e.ma_nhan_su)`) thay cho việc so sánh tiền tố mã `TMP%`. Điều này đảm bảo tính chính xác và an toàn tuyệt đối ngay cả khi nhân sự mới nháp được gán mã nhân sự thật.

### Vùng đã scan khi không có SFR ->
- `.agent/active/snapshot-pending-room-refinement/FEATURE_PLAN.md` (xác thực phần sửa đổi SQL Contract và Giả định).

---

## Round 3 - 2026-07-17T16:14:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - `database/migrations/026_save_personnel_pending_rpc.sql`
  - `database/migrations/037_add_reviewer_form_integration.sql`
  - `backend/src/services/changeHistoryService.ts`

### EFR Đã Chấp Nhận -> [EFR-01 (Round 3)]: Dùng `change_history` làm dấu hiệu “nhân sự cũ” vẫn phân loại nhầm nhân sự chính thức chưa từng có history | Sửa: Bổ sung cơ chế **backfill/baseline** ghi nhận dòng lịch sử đầu tiên cho các nhân sự chính thức legacy chưa từng phát sinh `change_history` trực tiếp trong migration SQL. Cập nhật `FEATURE_TASKS.md` để dọn sạch wording `TMP%` cũ và thêm regression test case (Case 5) kiểm chứng tính đúng đắn cho nhân sự chính thức legacy không có history.

### Vùng đã scan khi không có SFR ->
- `.agent/active/snapshot-pending-room-refinement/FEATURE_PLAN.md` (xác thực phần sửa đổi SQL Contract và Giả định).

---

## Round 4 - 2026-07-17T16:21:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - `database/migrations/038_update_snapshot_logic.sql`
  - `backend/src/utils/lockCheck.ts`
  - `backend/src/__tests__/integration/snapshots.test.ts`
  - `backend/src/__tests__/integration/isPeriodLocked.test.ts`

### EFR Đã Chấp Nhận -> [EFR-01 (Round 4)]: Backfill chỉ nhắm `state_phong_cho=false`, nên vẫn bỏ sót legacy employee đang pending tại thời điểm deploy | Sửa: Loại bỏ việc phụ thuộc vào `change_history`. Thay vào đó, thêm cột `is_new_hire` trực tiếp vào bảng `employees` để định danh. Tiến hành backfill phân loại dữ liệu hiện tại bằng cách cập nhật `is_new_hire = false` cho bất kỳ ai không bắt đầu bằng `TMP%` (nhân sự cũ legacy) hoặc `state_phong_cho = false`. RPC `submit_employee_pending` sẽ cập nhật `is_new_hire = false` khi submit thành công.
### EFR Đã Chấp Nhận -> [EFR-02 (Round 4)]: Đổi kỳ 26-25 chưa có migration cập nhật `snapshots.period_start/period_end` hiện hữu nên anti-drift guard sẽ lệch | Sửa: Thêm lệnh SQL migration cập nhật cột `period_start/period_end` cho tất cả snapshots cũ về chu kỳ 26-25. Thêm task cập nhật lại các mock/fixture test bị lỗi do lệch boundaries trong `snapshots.test.ts` và `isPeriodLocked.test.ts`.

### Vùng đã scan khi không có SFR ->
- `.agent/active/snapshot-pending-room-refinement/FEATURE_PLAN.md` (xác thực phần sửa đổi cột `is_new_hire` và snapshots update SQL).

---

## Round 5 - 2026-07-17T16:25:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - Ý kiến đóng góp trực tiếp của User về độ phức tạp khi thêm cột `is_new_hire`.

### EFR Đã Chấp Nhận -> [Ý kiến User]: Đơn giản hóa cơ chế định danh New Hire bằng `TMP%` | Sửa: Loại bỏ hoàn toàn giải pháp thêm cột `is_new_hire` (và các logic backfill `change_history` phức tạp ở các round trước). Quay lại giải pháp sử dụng thuần túy quy tắc tiền tố `ma_nhan_su LIKE 'TMP%'` kết hợp `state_phong_cho = true` để định danh New Hire Draft. Điều này đảm bảo hệ thống cực kỳ gọn nhẹ, dễ kiểm soát mà vẫn xử lý đúng nghiệp vụ theo mong muốn của User.

---

## Round 6 - 2026-07-17T16:49:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - `database/001_schema.sql` (bảng `employee_documents` và check constraint của `document_type`)
  - `backend/src/services/documentService.ts`

### EFR Đã Chấp Nhận -> [EFR-01 (Round 6)]: Rule `TMP%` chỉ an toàn nếu plan enforce new-hire draft luôn là TMP | Sửa: Giải quyết triệt để vấn đề định danh nhân sự mới nháp bằng cách phối hợp kiểm tra tệp đính kèm tuyển dụng theo gợi ý của User. 
Định danh **Nhân sự mới chưa duyệt (New Hire Draft)** bằng điều kiện:
*   Đang ở phòng chờ (`state_phong_cho = true`).
*   Có chứng từ loại tuyển mới chưa duyệt liên kết với nhân sự đó (`EXISTS (SELECT 1 FROM employee_documents ed WHERE ed.employee_id = e.id AND ed.document_type = 'tuyen_moi' AND ed.temp_uuid IS NOT NULL)`).

Giải pháp này hoàn toàn loại bỏ việc phụ thuộc vào tiền tố `TMP%` hay thay đổi cột/backfill dữ liệu cũ, đồng thời ngăn chặn tuyệt đối lỗi nhận diện nhầm khi người dùng gán mã nhân sự thật cho nhân sự mới nháp.

### Vùng đã scan khi không có SFR ->
- `.agent/active/snapshot-pending-room-refinement/FEATURE_PLAN.md` (xác thực phần sửa đổi SQL Contract và Giả định).

---

## Round 7 - 2026-07-17T16:58:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - Ý kiến trực tiếp của User về việc bỏ qua migration hồi tố snapshots cũ.

### EFR Đã Chấp Nhận -> [Ý kiến User]: Bỏ qua việc chạy migration hồi tố các snapshot cũ | Sửa: Lược bỏ phần SQL update hồi tố `period_start/period_end` cho các snapshot lịch sử cũ khỏi SQL Contract & Tasks trong [FEATURE_PLAN.md](file:///d:/ToolNhanSuVcc/.agent/active/snapshot-pending-room-refinement/FEATURE_PLAN.md). Quy định rõ trong Out of scope là người dùng chịu trách nhiệm chốt lại các snapshot cũ bị ảnh hưởng nếu cần.

### Vùng đã scan khi không có SFR ->
- `.agent/active/snapshot-pending-room-refinement/FEATURE_PLAN.md` (kiểm tra cập nhật phần Out of scope và SQL Contract).
