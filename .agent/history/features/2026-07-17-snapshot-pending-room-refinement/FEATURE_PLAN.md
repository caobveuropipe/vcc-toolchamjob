# Feature Plan: Tinh chỉnh cơ chế chốt snapshot phòng chờ

> **Trạng thái**: ✅ ĐỒNG Ý (Approved after EFR Round 5)
> **Review gate**: ✅ ĐỒNG Ý (Approved)
> **Feature slug**: snapshot-pending-room-refinement
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-17

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống ngăn chặn và lọc bỏ hoàn toàn các nhân sự đang nằm trong phòng chờ (`state_phong_cho = true`) khỏi snapshot chốt dữ liệu hàng tháng. Kỳ lương chốt hiện tại đang được tính từ ngày 27 tháng trước đến ngày 26 tháng hiện tại.
- **Vấn đề cần giải quyết:**
  1. Nếu nhân sự đã làm việc lâu năm đang có thay đổi chờ duyệt cho tương lai (hoặc kỳ lương khác) không vướng ngày hiệu lực trong kỳ lương đang chốt, họ vẫn đang hoạt động bình thường trong kỳ lương này và cần phải được đưa vào snapshot chính thức để tính lương.
  2. Nhân sự mới (New Hire) đang ở trạng thái tạm thời chưa được duyệt chính thức thì **không được phép** đưa vào snapshot. Nếu họ có ngày vào công ty thuộc hoặc trước kỳ lương đang chốt, hệ thống cần chặn và đưa ra cảnh báo chặn chốt snapshot, yêu cầu người dùng phê duyệt/xử lý dứt điểm trước.
  3. **Yêu cầu mới về kỳ lương chốt:** Điều chỉnh khoảng ngày chốt dữ liệu tháng (kỳ lương) từ 27 - 26 sang **26 tháng trước đến 25 tháng hiện tại**.
- **Mục tiêu:**
  - Cập nhật hàm RPC `create_monthly_snapshot` và route `/api/snapshots/check-block` để cho phép đưa nhân sự phòng chờ (không phải nhân sự mới) vào snapshot nếu không vướng ngày hiệu lực.
  - Phân loại New Hire Draft một cách chính xác và an toàn nhất dựa trên đề xuất của User: **Nhân sự đang ở phòng chờ (`state_phong_cho = true`) + Có chứng từ tuyển dụng (`document_type = 'tuyen_moi'`) đang ở trạng thái chờ duyệt (chưa bị xóa `temp_uuid`)**.
  - Cập nhật hàm `getPeriodDates` trong `packages/shared/src/utils/date.ts` để thay đổi chu kỳ tính lương thành **26 tháng trước đến 25 tháng hiện tại**.
- **Kết quả mong đợi:**
  - Chốt snapshot thành công bao gồm cả nhân sự phòng chờ (đang hoạt động).
  - Chặn chốt snapshot kèm cảnh báo nếu có nhân sự mới chưa duyệt vướng ngày bắt đầu trong hoặc trước kỳ lương.
  - Kỳ lương mới áp dụng đúng khoảng ngày 26 - 25 đồng bộ ở cả DB và API cho các snapshot mới tạo.

## 2. Phạm vi

### In scope
- Sửa đổi Database Function `create_monthly_snapshot` trong migration mới.
- Cập nhật API route `/api/snapshots/check-block` trong backend để đồng bộ logic cảnh báo ở giao diện chốt.
- Viết integration test để kiểm chứng luồng chặn và luồng đưa nhân sự phòng chờ hoạt động vào snapshot.
- Cập nhật tài liệu nghiệp vụ [09-chot-danh-sach-thang.md](file:///d:/ToolNhanSuVcc/docs/business-flows/09-chot-danh-sach-thang.md) và [.agent/business/data/STATE_MACHINES.md](file:///d:/ToolNhanSuVcc/.agent/business/data/STATE_MACHINES.md).
- Cập nhật logic tính ngày kỳ lương trong [date.ts](file:///d:/ToolNhanSuVcc/packages/shared/src/utils/date.ts).

### Out of scope
- Không sửa đổi luồng duyệt hay hủy yêu cầu của phòng chờ.
- Không tự động chạy migration để cập nhật hồi tố `period_start/period_end` của các snapshot cũ trong database (User sẽ tự chốt lại các snapshot bị ảnh hưởng). <!-- Sửa theo yêu cầu của User: Bỏ qua hồi tố snapshots cũ -->

## 3. Đối chiếu Knowledge Base
- Tôn trọng cơ chế lock kỳ lương (anti-drift).

## 4. Giả định và câu hỏi mở

### Giả định
- Định danh nhân sự mới chưa duyệt (New Hire Draft) được xác định bằng: `state_phong_cho = true` AND `EXISTS (SELECT 1 FROM employee_documents ed WHERE ed.employee_id = e.id AND ed.document_type = 'tuyen_moi' AND ed.temp_uuid IS NOT NULL)`. Khi duyệt hồ sơ thành công, `submit_employee_pending` sẽ tự động clear `temp_uuid = NULL`, do đó nhân sự đã duyệt sẽ không bị nhận diện nhầm.
- Người dùng chịu trách nhiệm chốt lại các snapshot cũ bị ảnh hưởng, hệ thống không chạy cập nhật tự động cho các bản ghi đã chốt trước đó. <!-- Sửa theo yêu cầu của User: Người dùng tự chốt lại -->

---

## 5. Acceptance Criteria

- [ ] Khi chốt snapshot, nếu có nhân sự mới chưa duyệt (có file `tuyen_moi` pending) vướng ngày bắt đầu (đọc từ `ngay_vao_cong_ty` live hoặc `pending_changes->>'ngay_vao_cong_ty'`) $\le$ `p_end_date`, hệ thống báo lỗi chặn chốt.
- [ ] Khi chốt snapshot, nếu có nhân sự cũ có `state_phong_cho = true` nhưng không vướng ngày hiệu lực trong kỳ lương, họ vẫn được copy vào `snapshot_employees` với dữ liệu hiện tại của họ.
- [ ] API `/api/snapshots/check-block` trả về danh sách nhân sự chặn chốt đúng theo quy tắc trên.
- [ ] Kỳ lương được xác định từ ngày 26 tháng trước đến 25 tháng hiện tại.
- [ ] Toàn bộ 100+ integration test cũ của snapshot vẫn hoạt động ổn định và thêm các test case mới cho tính năng này.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/042_snapshot_pending_room_refinement.sql` | Tạo mới | Cập nhật hàm SQL `create_monthly_snapshot` | 🟢 Thấp | Có |
| `backend/src/routes/snapshots.ts` | Sửa | Đồng bộ logic kiểm tra chặn chốt `/check-block` | 🟢 Thấp | Có |
| `backend/src/__tests__/integration/snapshots.test.ts` | Sửa | Thêm integration tests cho logic mới, sửa date boundaries | 🟢 Thấp | Không |
| `backend/src/__tests__/integration/isPeriodLocked.test.ts` | Sửa | Cập nhật date boundaries từ 27-26 sang 26-25 | 🟢 Thấp | Không |
| `docs/business-flows/09-chot-danh-sach-thang.md` | Sửa | Cập nhật rule nghiệp vụ chốt snapshot và chu kỳ lương | 🟢 Thấp | Không |
| `.agent/business/data/STATE_MACHINES.md` | Sửa | Cập nhật rule chuyển trạng thái phòng chờ | 🟢 Thấp | Không |
| `packages/shared/src/utils/date.ts` | Sửa | Đổi chu kỳ lương sang ngày 26 đến 25 | 🟢 Thấp | Có |

### SQL Contract Chi tiết:
1. **Kiểm tra chặn chốt do Nhân sự mới (New Hire chưa duyệt)**:
   Tìm kiếm nhân sự thỏa mãn:
   - `state_phong_cho = true`
   - `EXISTS (SELECT 1 FROM employee_documents ed WHERE ed.employee_id = e.id AND ed.document_type = 'tuyen_moi' AND ed.temp_uuid IS NOT NULL)`
   - `COALESCE((pending_changes->>'ngay_vao_cong_ty')::DATE, ngay_vao_cong_ty) <= p_end_date`
   Nếu tồn tại -> BLOCK và thông báo lỗi.
2. **Kiểm tra chặn chốt do vướng ngày hiệu lực (Nhân sự cũ)**:
   Tìm kiếm nhân sự thỏa mãn:
   - `state_phong_cho = true`
   - `NOT EXISTS (SELECT 1 FROM employee_documents ed WHERE ed.employee_id = e.id AND ed.document_type = 'tuyen_moi' AND ed.temp_uuid IS NOT NULL)`
   - Có ít nhất một ngày hiệu lực trong `pending_changes` rơi vào khoảng `[p_start_date, p_end_date]`. Các ngày cần kiểm tra: `ngay_vao_cong_ty`, `ngay_nghi_viec`, `ngay_nghi_sinh`, `ngay_ky_hd` trong `employees` và `ngay_dieu_chinh_luong` trong `salaries`.
   Nếu tồn tại -> BLOCK và thông báo lỗi.
3. **Điều kiện sao chép nhân sự vào Snapshot**:
   Chỉ sao chép nhân sự thuộc khối đang chốt thỏa mãn:
   - `(e.state_phong_cho = false OR (e.state_phong_cho = true AND NOT EXISTS (SELECT 1 FROM employee_documents ed WHERE ed.employee_id = e.id AND ed.document_type = 'tuyen_moi' AND ed.temp_uuid IS NOT NULL)))`
   - Đạt điều kiện về ngày vào công ty / ngày nghỉ việc (nếu nghỉ việc thì ngày nghỉ việc phải nằm trong kỳ đang chốt).

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  - Logic xác định ngày bắt đầu của nhân viên mới cần đồng bộ giữa backend (TypeScript) và database (SQL).
  - Tránh reload schema PostgREST bị chậm hoặc lỗi cache làm lệch API `/check-block`.
- **Review focus areas:**
  - Predicate của SQL function `create_monthly_snapshot` cần được kiểm tra kỹ qua integration tests.
- **Known pitfalls / historical issues:**
  - Tải đè snapshot cũ khi đã có dữ liệu chốt bổ sung được phê duyệt (`snapshot_supplemental_pending`). Cần đảm bảo hàm RPC khôi phục đúng dữ liệu bổ sung đã được phê duyệt.
- **Dependencies / rollout concerns:**
  - Chạy script migration cập nhật RPC function trước khi deploy code API backend.

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1**: Viết migration SQL cập nhật hàm RPC, cập nhật route backend `/check-block` và logic ngày trong `packages/shared/src/utils/date.ts`.
  - **Phase 2**: Cập nhật tài liệu nghiệp vụ và viết thêm các integration tests bao phủ toàn bộ các trường hợp biên.
- **Thứ tự triển khai**: DB & API Backend -> Docs -> Tests.
- **Yêu cầu migration / config / deploy**: Cần chạy migration 042 trên Supabase.

## 9. Test Strategy

### Automated tests
Viết thêm các kịch bản kiểm thử trong `snapshots.test.ts` và sửa các test liên quan:
- **Case 1**: Nhân sự mới chưa duyệt (có file `tuyen_moi` pending) vướng ngày bắt đầu trong hoặc trước kỳ chốt (`<= p_end_date`) $\rightarrow$ verify `/check-block` và RPC đều chặn chốt.
- **Case 2**: Nhân sự mới chưa duyệt (có file `tuyen_moi` pending) có ngày bắt đầu ở kỳ sau (`> p_end_date`) $\rightarrow$ verify không chặn chốt và không được copy vào snapshot.
- **Case 3**: Nhân sự cũ đang trong phòng chờ vướng ngày hiệu lực trong kỳ $\rightarrow$ verify bị chặn chốt.
- **Case 4**: Nhân sự cũ đang trong phòng chờ có thay đổi cho tương lai (ngoài kỳ chốt) $\rightarrow$ verify không chặn chốt và được copy vào snapshot bằng dữ liệu live hiện tại.
- **Case 5 (Regression)**: Nhân sự chính thức legacy chưa từng có history nhưng đang ở trạng thái `state_phong_cho=true` (pending thay đổi ngoài kỳ) $\rightarrow$ verify không block chốt và được copy thành công vào snapshot bằng dữ liệu live.
- **Case 6**: Luồng `/restore-live` phải hoạt động đồng bộ với logic trên.
- **Case 7**: Cập nhật lại các mock/fixture test trong `snapshots.test.ts` và `isPeriodLocked.test.ts` theo đúng kỳ lương mới 26 - 25.

### Manual verification
- Chạy `pnpm --filter backend test:integration` để chạy toàn bộ suite test.

## 10. Rollback Plan

- Trong trường hợp xảy ra sự cố nghiêm trọng, chạy script rollback định nghĩa lại hàm `create_monthly_snapshot` và revert code backend về commit trước đó.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
