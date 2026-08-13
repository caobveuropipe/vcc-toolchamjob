# Feature Tasks: Nhóm lịch sử thay đổi nhân sự (Grouped Change History)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-26

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: DB & Shared Types

**Mục tiêu:** Xây dựng PostgreSQL RPC function dạng set-returning có đầy đủ logic bảo mật che đậy reason/document, tạo index hỗn hợp tối ưu hiệu năng và cập nhật shared types.

- [x] Task 1.1: Tạo file database migration `database/migrations/033_grouped_change_history.sql` định nghĩa:
  - Hàm `get_grouped_change_history` với chữ ký đầy đủ: `get_grouped_change_history(p_ma_nhan_su VARCHAR(20), p_is_vi BOOLEAN, p_is_doc_allowed BOOLEAN, p_category VARCHAR(20), p_salary_fields TEXT[])`.
  - Hàm trả về dạng bảng: `RETURNS TABLE (group_key TEXT, changed_at TIMESTAMPTZ, changed_by TEXT, reason TEXT, document_id UUID, changes JSONB)`.
  - Logic nội bộ hàm thực hiện lọc và bảo vệ dữ liệu:
    1. Xác định xem mỗi phiên thay đổi gốc (trước khi lọc/mask) có chứa bất kỳ thay đổi lương nhạy cảm nào trong `p_salary_fields` không để gán cờ `has_salary_change`.
    2. Thực hiện lọc dữ liệu thô: lọc theo `p_ma_nhan_su`; nếu `p_is_vi = true` thì loại bỏ các dòng thay đổi có `field_changed` nằm trong `p_salary_fields`; lọc theo `p_category` ('all' / 'salary' / 'personnel') ngay tại tầng dữ liệu thô.
    3. Thực hiện `GROUP BY` để gom nhóm. Trích xuất `group_key` duy nhất cho từng dòng bằng cách băm `md5` các trường định danh gốc của group (gồm `changed_at`, `changed_by`, `reason` gốc và `document_id` gốc) trước khi áp dụng logic che giấu (masking).
    4. Thực hiện `jsonb_agg(jsonb_build_object('field_changed', c.field_changed, 'old_value', c.old_value, 'new_value', c.new_value) ORDER BY c.id)` để gộp các thay đổi thành mảng JSON (`changes`) có thứ tự ổn định theo cột `id`.
    5. Nếu `p_is_vi = true` và `has_salary_change = true`, cưỡng chế gán `reason = NULL` và `document_id = NULL` ở kết quả trả về để ngăn rò rỉ thông tin lương gián tiếp ở các phiên hỗn hợp.
    6. Nếu `p_is_doc_allowed = false`, cưỡng chế gán `document_id = NULL` để bảo vệ tài liệu đính kèm (ngăn chặn leak tài liệu nhạy cảm cho VI/VA).
  - Phân quyền hàm bảo mật:
    ```sql
    REVOKE ALL ON FUNCTION get_grouped_change_history(VARCHAR, BOOLEAN, BOOLEAN, VARCHAR, TEXT[]) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION get_grouped_change_history(VARCHAR, BOOLEAN, BOOLEAN, VARCHAR, TEXT[]) TO service_role;
    ```
  - Tạo index hỗn hợp `idx_change_history_grouping` trên `change_history(ma_nhan_su, changed_at DESC, changed_by, document_id)` để tối ưu hiệu năng GROUP BY.
  - Thêm lệnh `NOTIFY pgrst, 'reload schema';` ở cuối file migration để làm mới cache schema.
- [x] Task 1.2: Định nghĩa các interface `ChangeHistoryDiff`, `GroupedChangeHistoryEntry` (có thêm `group_key`) và cập nhật `ChangeHistoryResponse` trong `packages/shared/src/types/api.ts`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Biên dịch thành công packages/shared (`pnpm run build:shared`).

## Phase 2: Backend API & Tests

**Mục tiêu:** Cập nhật endpoint `/api/change-history/:ma_nhan_su` (validate chặt chẽ, siết bảo mật Reviewer/Doc access, ẩn ngay_dieu_chinh_luong, gọi RPC với select) và hoàn thiện các bài test.

- [x] Task 2.1: Sửa file `backend/src/routes/changeHistory.ts`:
  - Cập nhật File Contract comment ở đầu file phản ánh đúng logic phân quyền và xử lý grouped mới.
  - Validate chặt chẽ tham số `category` (phải là một trong `'all'`, `'salary'`, `'personnel'`, trả về 400 nếu sai); Validate `page` và `limit` (đảm bảo >= 1, clamp max limit = 100, phòng ngừa giá trị âm/NaN).
  - Cập nhật logic `isViOnly`: Nếu người dùng không có quyền `EA`/`VA` đối với khối của nhân sự, và **đồng thời không phải là Người nghiệm thu được gán trực tiếp cho nhân sự đó** (sử dụng `getReviewerEmployeeIds(userEmail)`), họ sẽ bị coi là `isViOnly = true` cho nhân sự này.
  - Tính toán `isDocAccessAllowed`: Chỉ cho phép `true` nếu user có quyền `EA` trên khối, là SA, hoặc là Reviewer được gán trực tiếp cho nhân sự đó (phù hợp với quy định ma trận phân quyền 2f).
  - Xây dựng mảng trường lương mở rộng dùng để che giấu lịch sử: `SALARY_HISTORY_FIELDS = [...SALARY_FIELDS, 'ngay_dieu_chinh_luong']`.
  - Chặn sớm: Nếu `isViOnly = true` và `category === 'salary'`, trả về ngay lập tức dữ liệu rỗng và total = 0.
  - Gọi RPC `get_grouped_change_history` với đầy đủ tham số qua Supabase client kết hợp `.select('*')`:
    ```typescript
    let query = supabase
      .rpc('get_grouped_change_history', {
        p_ma_nhan_su: maNhanSu,
        p_is_vi: isViOnly,
        p_is_doc_allowed: isDocAccessAllowed,
        p_category: category,
        p_salary_fields: SALARY_HISTORY_FIELDS
      }, { count: 'exact' })
      .select('*')
    ```
  - Thực hiện `.order('changed_at', { ascending: false })` và `.range()` để PostgREST phân trang & đếm tổng số trang ổn định kể cả khi trang yêu cầu bị rỗng.
- [x] Task 2.2: Sửa file `backend/src/__tests__/integration/salary.test.ts` ở phần kiểm tra lịch sử thay đổi để tương thích với cấu trúc response mới (sử dụng `flatMap` mảng `changes` của từng nhóm trước khi filter).
- [x] Task 2.3: Viết bổ sung các integration tests trong `backend/src/__tests__/integration/salary.test.ts` (hoặc test file liên quan) để kiểm chứng bảo mật:
  - Người dùng có vai trò `VI` trên khối, hoặc Reviewer có thêm quyền `VI` trên khối nhưng không được gán trực tiếp cho nhân sự đó, khi gọi API với `category=all` sẽ không thấy các trường lương nhạy cảm và trường `ngay_dieu_chinh_luong` trong mảng `changes`.
  - Với một phiên thay đổi hỗn hợp (sửa cả chức danh và lương), các đối tượng trên sẽ thấy record thay đổi chức danh nhưng lý do (`reason`) và tài liệu (`document_id`) phải bị ẩn (trả về null).
  - Các đối tượng trên gọi API với `category=salary` bị chặn và nhận về total = 0.
  - Reviewer được gán trực tiếp cho nhân sự đó gọi API xem nhân sự của mình có thể thấy salary changes, lý do và tài liệu bình thường.
  - Người dùng có vai trò `VA` gọi API xem nhân sự có thể thấy salary changes, nhưng `document_id` phải bị ẩn (`null`) do VA không có quyền truy cập tài liệu.
  - Một pure reviewer (không được gán cho nhân sự đó và không có quyền khối) gọi API lịch sử của nhân sự đó phải bị từ chối 403.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Chạy bộ kiểm thử integration `pnpm --filter backend test:integration` đạt kết quả xanh 100%.

## Phase 3: Frontend Integration & UI Refactor

**Mục tiêu:** Cập nhật hook query (bổ sung category vào query key), truyền prop kiểm tra quyền xem lương, và viết lại giao diện component `ChangeHistoryTab` hiển thị theo dạng grouped.

- [x] Task 3.1: Sửa file `frontend/src/hooks/useEmployees.ts` để cập nhật hook `useChangeHistory` chấp nhận thêm tham số `category`, đồng thời cập nhật `queryKey` chứa `category` để tránh tái sử dụng cache sai.
- [x] Task 3.2: Sửa file `frontend/src/pages/Employees/EmployeeDetailPage.tsx` để truyền prop `canViewSalary={canViewSalary}` vào component `ChangeHistoryTab` (sử dụng biến `canViewSalary` đã có sẵn tại dòng 171).
- [x] Task 3.3: Sửa file `frontend/src/pages/Employees/components/ChangeHistoryTab.tsx`:
  - Khai báo prop `canViewSalary: boolean` và sử dụng nó để ẩn tab "Lịch sử Lương" (hoặc ẩn hoàn toàn `Segmented` component nếu `canViewSalary` là false).
  - Xây dựng helper `isSalaryHistoryField(field: string): boolean` trả về true nếu field là salary field hoặc là `ngay_dieu_chinh_luong`.
  - Sử dụng helper `isSalaryHistoryField` cho việc tô màu Tag, nhãn phân loại category, và render danh sách thay đổi grouped.
  - Thêm guard logic: Nếu prop `canViewSalary` thay đổi từ true sang false hoặc component render lại với canViewSalary = false, tự động ép category về `'personnel'`.
  - Thay đổi cấu trúc các cột hiển thị trong bảng: cột "Nội dung thay đổi" chứa danh sách chi tiết các trường thay đổi dạng `Tên trường: Cũ ➔ Mới`.
  - Cập nhật thuộc tính `rowKey` của Table sử dụng `group_key` trả về từ API: `rowKey="group_key"`.
  - Gọi `setCurrentPage(1)` khi thay đổi bộ lọc ở segmented control.
  - Loại bỏ logic lọc client-side cũ.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3: Build frontend thành công và kiểm tra trực quan hoạt động hoàn hảo trên UI đối với cả các vai trò Admin, VI, VA và Reviewer-only (Đảm bảo tab, lý do và tài liệu nhạy cảm hoàn toàn biến mất/bị ẩn khi xem nhân sự không được gán, kiểm tra kỹ kịch bản phiên mixed).
  - Xác nhận:
    * EA/Admin: "Tất cả" hiển thị cả hồ sơ+lương, "Hồ sơ" chỉ hiển thị hồ sơ, "Lương" chỉ hiển thị lương.
    * VI: "Tất cả"/"Hồ sơ" chỉ thấy hồ sơ, lý do và tài liệu của phiên mixed bị ẩn về null, "Lương" bảng trống và total = 0.
    * VA: Thấy cả hồ sơ+lương, nhưng tài liệu bị ẩn.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-05-26 10:20] | - | - | Khởi tạo kế hoạch | pending | Đợi review và phê duyệt plan từ User |
| [2026-05-26 10:30] | - | - | Cập nhật kế hoạch dựa trên phản biện chuyên gia | pending | Đã cập nhật xong plan & tasks |
| [2026-05-26 10:35] | - | - | Tinh chỉnh bảo mật Reviewer cục bộ, RPC contract và bổ sung tests | pending | Đã cập nhật xong bản tinh chỉnh hoàn thiện |
| [2026-05-26 10:40] | - | - | Thêm chi tiết tham số RPC, rowKey và pgrst schema reload | pending | Đã đồng hóa toàn bộ góp ý của chuyên gia |
| [2026-05-26 10:43] | - | - | Bổ sung triệt để các lỗ hổng rò rỉ metadata lương (ngay_dieu_chinh_luong, reason, document_id) và validate API | pending | Hoàn thành bản nâng cấp bảo mật tối đa cho kế hoạch |
| [2026-05-26 10:55] | - | - | Tinh chỉnh logic rành mạch quyền reviewer không được gán | pending | Phê duyệt kế hoạch duyệt qua review gate |
| [2026-05-26 10:58] | Phase 1 | Task 1.1 | Bắt đầu triển khai thiết lập DB & Shared Types | start | Trạng thái tasks chuyển sang Đang thực hiện |
| [2026-05-26 11:00] | Phase 1 | Task 1.2 | Định nghĩa các shared types và biên dịch | done | Biên dịch thành công packages/shared |
| [2026-05-26 13:42] | Phase 2 | Task 2.1-2.3 | Cập nhật API route changeHistory và viết tests | done | Endpoint sử dụng RPC get_grouped_change_history và thêm integration tests |
| [2026-05-26 13:46] | Phase 3 | Task 3.1-3.3 | Cập nhật hook, detail page và component ChangeHistoryTab | done | Frontend được cập nhật cấu trúc grouped |
| [2026-05-26 13:47] | - | - | Khởi động môi trường dev local | start | Đã chạy dev server local trên port 5173 và 8080 |
| [2026-05-26 14:02] | Phase 3 | Task 3.Final | Build dự án thành công và sửa bug test payload | done | Dự án hoàn thành biên dịch và sẵn sàng chạy UAT |

