# Feature Plan: Nhóm lịch sử thay đổi nhân sự (Grouped Change History)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: ✅ Đã duyệt qua feature-review (2026-05-26)
> **Feature slug**: `grouped-change-history`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-26

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, mỗi trường thay đổi của nhân sự được lưu thành một dòng riêng biệt trong bảng `change_history` và hiển thị trên UI thành từng dòng đơn lẻ. Khi người dùng cập nhật nhiều thông tin cùng lúc (như tuyển mới, sửa thông tin hàng loạt, điều chuyển bổ nhiệm...), giao diện Tab "Lịch sử" sẽ hiển thị rất nhiều dòng lặp lại thông tin (ngày giờ, người thực hiện, lý do, tài liệu), gây loãng và rối mắt.
- **Vấn đề cần giải quyết:** Cần nhóm các thay đổi trong cùng một "phiên" (cùng thời điểm `changed_at`, người thực hiện `changed_by`, lý do `reason` và tài liệu đính kèm `document_id`) thành một dòng duy nhất trên giao diện.
- **Mục tiêu:**
  - Tối ưu hóa UI lịch sử thay đổi, gom nhóm dữ liệu một cách khoa học.
  - Giữ nguyên cấu trúc dữ liệu lưu trữ vật lý flat ban đầu ở DB để đảm bảo hiệu năng ghi.
  - Đảm bảo server-side pagination hoạt động chính xác dựa trên số lượng "phiên thay đổi" thay vì số lượng "trường thay đổi".
- **Kết quả mong đợi:** Mỗi phiên thay đổi hiển thị thành 1 dòng duy nhất trên UI. Cột "Nội dung thay đổi" hiển thị danh sách các trường được thay đổi dưới dạng `Tên trường: Cũ ➔ Mới`. Tài liệu đính kèm, lý do, người thực hiện và ngày tháng hiển thị duy nhất 1 lần trên dòng đó.

---

## 2. Phạm vi

### In scope
- Tạo PostgreSQL RPC `get_grouped_change_history` dưới dạng set-returning function (`RETURNS TABLE`) để trả về danh sách các nhóm thay đổi (row-based), hỗ trợ phân trang ở tầng PostgREST.
- Tạo index hỗn hợp tối ưu `idx_change_history_grouping` trên bảng `change_history` để tối ưu hóa hiệu năng câu lệnh `GROUP BY`.
- Sửa lỗ hổng bảo mật: Reviewer chỉ được quyền xem thông tin lương (bao gồm chi tiết lương và lịch sử lương) của **chính nhân viên họ được gán**. Nếu xem nhân viên khác mà họ không được gán (chỉ có quyền `VI` trên khối), thông tin lương bắt buộc phải bị ẩn (`isViOnly = true`).
- Enforce bảo mật cách ly lương triệt để:
  - Ẩn `ngay_dieu_chinh_luong` (thuộc bảng `employees` nhưng là metadata lương) khỏi các đối tượng không có quyền xem lương.
  - Tránh rò rỉ thông tin lương qua `reason` (lý do) và `document_id` (tài liệu) trong các phiên thay đổi hỗn hợp (phiên có cả thay đổi hồ sơ và lương): Nếu `isViOnly = true` và phiên đó có thay đổi trường lương nhạy cảm, RPC/API sẽ tự động gán `reason = NULL` và `document_id = NULL`. Việc này dựa trên thuộc tính `has_salary_change` được tính trên group gốc trước khi thực hiện lọc hoặc mask.
  - Ẩn `document_id` đối với các role không có quyền truy cập tài liệu (`VI` / `VA` không gán reviewer).
- Cập nhật Backend API `/api/change-history/:ma_nhan_su` để:
  - Validate chặt chẽ tham số `category` (phải là một trong `'all'`, `'salary'`, `'personnel'`, trả về 400 nếu sai); Validate `page` và `limit` (đảm bảo >= 1, clamp max limit = 100, phòng ngừa NaN hoặc số âm).
  - Gọi RPC, truyền danh sách `p_salary_fields` động từ `@vcc/shared` (được bổ sung `ngay_dieu_chinh_luong`).
  - Thực hiện kiểm tra quyền `isViOnly` và `isDocAccessAllowed` một cách chính xác (scoped theo từng nhân viên cụ thể).
  - Chặn ngay tại API nếu `isViOnly = true` và `category === 'salary'` (trả về danh sách rỗng, tránh gọi xuống DB).
  - Phân trang và đếm tổng số bản ghi ổn định thông qua `{ count: 'exact' }` kết hợp với `.select('*')`.
- Cập nhật types dùng chung (`packages/shared/src/types/api.ts`) để mô tả cấu trúc dữ liệu grouped mới (bao gồm `group_key`).
- Cập nhật frontend hook `useChangeHistory` (đảm bảo query key chứa category) và component [ChangeHistoryTab.tsx](file:///d:/Project_VCC/Module_NhanSu_moi/frontend/src/pages/Employees/components/ChangeHistoryTab.tsx) để hiển thị danh sách grouped, sử dụng `group_key` làm row key, reset trang về 1 khi đổi danh mục, và ẩn tab/segmented "Lịch sử Lương" đối với role không có quyền xem lương của nhân sự đó.
- Điều chỉnh integration test `salary.test.ts` để tương thích với response format mới và viết bổ sung các test cases kiểm tra quyền truy cập lịch sử thay đổi của `VI` và `Reviewer-only` (cả trường hợp được gán và không được gán) và phân quyền tài liệu của role `VA`.

### Out of scope
- Thay đổi cấu trúc bảng vật lý `change_history`.
- Thay đổi logic ghi lịch sử thay đổi (diffing/inserting) ở các services hiện tại của Hono.

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - **Salary Isolation (2026-03-14 & 2026-04-01):** Dữ liệu lương nhạy cảm phải được ẩn hoàn toàn đối với vai trò VI. Quy tắc này được làm rõ và thống nhất: **Reviewer chỉ có quyền xem lương đối với nhân sự họ được gán trực tiếp (theo PERMISSION_MATRIX.md line 92 - gán quyền EA cục bộ)**. Đối với nhân sự khác trong khối mà họ không được gán, họ chỉ có quyền `VI` nên lịch sử lương phải bị ẩn hoàn toàn.
  - **Atomic Submit RPC (2026-04-07):** Các thay đổi trong cùng một phiên submit được ghi nhận trong một PostgreSQL Transaction nên giá trị `changed_at` sẽ trùng khớp hoàn toàn đến từng mili-giây, cho phép gom nhóm chính xác bằng câu lệnh `GROUP BY`.

---

## 4. Giả định và câu hỏi mở

### Giả định
- Các thay đổi thuộc cùng một phiên thao tác của người dùng sẽ chia sẻ chung các giá trị: `changed_at` (cùng transaction `now()`), `changed_by`, `reason` và `document_id`.

### Câu hỏi mở
- *Không có.*

---

## 5. Acceptance Criteria

- [ ] RPC `get_grouped_change_history` được khai báo dạng `RETURNS TABLE (...)`, trả về từng group thành từng row chứa cột `changes JSONB` (được sắp xếp ổn định bằng `jsonb_agg(... ORDER BY id)`) để PostgREST count/range hoạt động đúng.
- [ ] Phân quyền RPC được khóa chặt, chỉ cho phép `service_role` thực thi để bảo vệ an toàn dữ liệu.
- [ ] Lọc bảo mật hoạt động đúng:
  - Role VI hoặc Reviewer có thêm quyền VI trên khối (đối với nhân sự không được gán trực tiếp) không thể nhìn thấy bất kỳ thông tin lương nào (kể cả trường `ngay_dieu_chinh_luong`) trong danh sách nhóm trả về.
  - Với group thay đổi hỗn hợp (có chứa trường lương), các đối tượng trên bị che lý do (`reason = null`) và che tài liệu (`document_id = null`) dựa trên `has_salary_change` gốc của group để tránh leak thông tin gián tiếp.
  - Reviewer được gán trực tiếp cho nhân sự đó xem được lịch sử lương bình thường (nhất quán với quyền xem detail và pending salary).
  - Quyền xem tài liệu: Role VA xem được lịch sử lương nhưng tài liệu đính kèm phải bị ẩn (`document_id = null`) do VA không có quyền truy cập tài liệu.
- [ ] Nếu `isViOnly = true` và gọi endpoint với `category=salary`, API chặn ngay lập tức và trả về `data: [], total: 0`.
- [ ] Giao diện Tab Lịch sử hiển thị mỗi phiên thay đổi là một dòng duy nhất.
- [ ] Trong cột "Nội dung thay đổi", hiển thị danh sách dạng list các trường thay đổi: `Tên trường: Cũ ➔ Mới` với style rõ ràng (gạch ngang giá trị cũ, tô đậm/xanh lá giá trị mới).
- [ ] Khi chuyển đổi các tab bộ lọc ("Lịch sử Hồ sơ", "Lịch sử Lương", "Tất cả") ở Frontend:
  - Trang hiện tại được reset về 1.
  - Phân trang server-side hoạt động chính xác và ổn định kể cả khi trang được yêu cầu không có dữ liệu (trả về meta total_count chuẩn).
- [ ] Tab "Lịch sử Lương" và bộ lọc Lương bị ẩn hoàn toàn đối với người dùng không có quyền xem chi tiết lương của nhân sự đó (`canViewSalary = false`).
- [ ] Nút tải tài liệu đính kèm hoạt động bình thường cho toàn bộ phiên thay đổi (và bị ẩn hoàn toàn nếu user không có quyền truy cập tài liệu).
- [ ] Toàn bộ test suite vượt qua thành công, bao gồm cả integration tests cũ và các test cases bảo mật mới thêm vào.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/033_grouped_change_history.sql` | Tạo mới | Định nghĩa database function `get_grouped_change_history` dạng `RETURNS TABLE` và tạo index hỗn hợp `idx_change_history_grouping`. | 🟢 Thấp | Có (SQL schema) |
| `packages/shared/src/types/api.ts` | Sửa | Cập nhật định nghĩa type response cho grouped history (thêm `group_key`). | 🟢 Thấp | Có (Shared Types) |
| `backend/src/routes/changeHistory.ts` | Sửa | Chuyển sang gọi database RPC; sửa logic `isViOnly` để kiểm tra scoped reviewer; chặn request category `salary` từ VI; truyền danh sách cột lương mở rộng (kèm `ngay_dieu_chinh_luong`). | 🟡 Trung bình (Cần bảo đảm lọc salary chính xác) | Có (API Contract) |
| `frontend/src/hooks/useEmployees.ts` | Sửa | Cập nhật hook `useChangeHistory` để truyền tham số `category` xuống API và đưa `category` vào query key. | 🟢 Thấp | Có |
| `frontend/src/pages/Employees/components/ChangeHistoryTab.tsx` | Sửa | Thay đổi giao diện hiển thị bảng để tương thích với cấu trúc grouped; reset trang về 1 khi chọn segmented; ẩn phân loại Lương nếu `canViewSalary` là false; sử dụng helper `isSalaryHistoryField` và `group_key` làm rowKey. | 🟢 Thấp | Có |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Sửa | Truyền prop `canViewSalary={canViewSalary}` vào component `ChangeHistoryTab`. | 🟢 Thấp | Có |
| `backend/src/__tests__/integration/salary.test.ts` | Sửa | Điều chỉnh cách kiểm tra kết quả trả về trong test case lịch sử thay đổi lương (flatMap mảng `changes`) và bổ sung test cases kiểm soát phân quyền (VI/Reviewer-only/VA). | 🟢 Thấp | Có |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
  - Lọc thông tin lương cho role VI và Reviewer. Phải đảm bảo logic `isViOnly` ở backend Hono hoạt động đúng (Reviewer không có EA/VA trên khối đó và không được gán cho nhân sự đó thì coi như VI).
  - Phân quyền thực thi RPC: Bắt buộc `REVOKE` khỏi vai trò `public/anon/authenticated` và chỉ `GRANT` cho `service_role`.
- **Review focus areas:**
  1. Câu lệnh `GROUP BY` trong RPC có hoạt động chính xác trên trường `changed_at` (kiểu TIMESTAMPTZ) không?
  2. Index hỗn hợp `idx_change_history_grouping` có giúp PostgreSQL tối ưu hóa thời gian thực thi gom nhóm không?

---

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1: DB & Shared Types:** Viết và chạy database migration tạo RPC và index; Cập nhật type định nghĩa grouped response ở `@vcc/shared`.
  - **Phase 2: Backend API & Tests:** Sửa route `changeHistory.ts` để gọi RPC, truyền danh sách trường lương từ file config dùng chung; Sửa Integration Test `salary.test.ts` để chạy pass và bổ sung các test cases phân quyền.
  - **Phase 3: Frontend Integration & UI Refactor:** Cập nhật query hook, truyền prop kiểm tra quyền xem lương và viết lại giao diện hiển thị trong `ChangeHistoryTab.tsx`.

---

## 9. Test Strategy

- **Automated tests:**
  - Chạy `pnpm --filter backend test:integration` để xác minh API và test case hoạt động chính xác.
- **Manual verification:**
  - **EA/Admin:** Lọc "Tất cả" thấy cả hồ sơ+lương, "Hồ sơ" chỉ thấy hồ sơ, "Lương" chỉ thấy lương.
  - **VI / Reviewer có quyền VI trên khối nhưng không được gán:** Lọc "Tất cả"/"Hồ sơ" chỉ thấy hồ sơ, đối với phiên mixed thì `reason = null` và không hiển thị icon tài liệu (`document_id = null`), lọc "Lương" hiển thị bảng trống với `total = 0`.
  - **VA:** Lọc "Tất cả" thấy cả hồ sơ+lương, nhưng tài liệu đính kèm bị ẩn hoàn toàn (`document_id = null`).
  - Kiểm tra giao diện Tab Lịch sử đối với nhân sự có nhiều thay đổi.
  - Xác nhận bộ lọc Category hoạt động và phân trang hoạt động tốt (reset trang về 1 khi chuyển tab).

---

## 10. Rollback Plan

- Khôi phục file cũ của route backend, frontend hook/components và chạy SQL rollback:
  ```sql
  DROP FUNCTION IF EXISTS get_grouped_change_history(VARCHAR, BOOLEAN, BOOLEAN, VARCHAR, TEXT[]);
  DROP INDEX IF EXISTS idx_change_history_grouping;
  ```

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
