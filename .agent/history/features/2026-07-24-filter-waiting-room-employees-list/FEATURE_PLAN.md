# Feature Plan: Lọc ẩn nhân sự phòng chờ chưa duyệt khỏi Danh sách nhân sự chính thức

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: ✅ ĐỒNG Ý (Phê duyệt sau 9 vòng review & rebuttal)
> **Feature slug**: filter-waiting-room-employees-list
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-24

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại trên trang Danh sách nhân sự chính thức (`/employees`), hệ thống chưa có bộ lọc loại trừ nhân sự mới nháp. Dẫn đến nhân sự mới (onboarding nháp, mã tạm `TMP...`) chưa được duyệt vẫn bị hiển thị trên màn hình Danh sách nhân sự chính thức.
- **Vấn đề cần giải quyết:** 
  1. Nhân sự mới (mã tạm `TMP...`) đang ở phòng chờ (`state_phong_cho = true`) chưa duyệt bị chui ra Danh sách nhân sự chính thức `/employees`.
  2. Cần phân định rạch ròi giữa 2 màn hình:
     - **Danh sách nhân sự chính thức (`/employees`)**: Chứa toàn bộ nhân sự chính thức đang làm việc. Nhân sự cũ đang hoạt động nếu có đợt điều chỉnh nháp (`state_phong_cho = true`, mã không phải `TMP`) VẪN HIỂN THỊ tại màn hình này để chốt Snapshot và giữ nguyên các icon chỉ báo nháp (PDF, $, Info).
     - **Phòng chờ (`/pending-room`)**: Chứa toàn bộ nhân sự đang có đề xuất chờ duyệt (`state_phong_cho = true`).
- **Mục tiêu:** 
  - Thêm parameter contract `exclude_pending_new_hires = true` cho API backend `/api/employees`. Khi xem danh sách chính thức và xuất Excel, backend áp dụng chế độ này để tự động lọc bỏ nhân sự nháp mới (`ma_nhan_su` bắt đầu bằng `TMP` AND `state_phong_cho = true`).
  - Giữ nguyên hiển thị các icon chỉ báo phòng chờ (PDF đính kèm nháp, $ điều chỉnh lương, Info sửa hồ sơ) trên Danh sách nhân sự chính thức cho nhân sự cũ đang hoạt động.
- **Kết quả mong đợi:** Danh sách nhân sự chính thức sạch sẽ, tuyệt đối không xuất hiện nhân sự nháp mới `TMP...`, trong khi vẫn giữ nguyên icon chỉ báo nháp và dữ liệu nhân sự cũ đang hoạt động.

---

## 2. Phạm vi

### In scope
- Cập nhật API Backend `/api/employees` hỗ trợ parameter/mode `exclude_pending_new_hires = true`:
  - **Mặc định khi xem Danh sách nhân sự chính thức (`/employees`) và Export Excel chính thức**: API tự động kích hoạt `exclude_pending_new_hires = true` (Backend mặc định hoặc Frontend truyền explicit parameter).
  - **Quy tắc lọc Backend**:
    - **Nhân sự mới nháp (`ma_nhan_su` bắt đầu bằng `TMP` AND `state_phong_cho = true`)**: Bị ẩn 100% khỏi Danh sách nhân sự chính thức (`/employees`), Export Excel chính thức, và Autocomplete nhân sự (`/api/employees/autocomplete`). Chỉ xuất hiện duy nhất ở Phòng chờ (`/pending-room`).
    - **Nhân sự cũ đang hoạt động có đề xuất điều chỉnh nháp (`ma_nhan_su` KHÔNG bắt đầu bằng `TMP` AND `state_phong_cho = true`)**: VẪN HIỂN THỊ bình thường trên Danh sách nhân sự chính thức (`/employees`) để đảm bảo tính sẵn sàng cho chốt Snapshot, đồng thời duy trì các icon chỉ báo nháp (PDF đính kèm, $ điều chỉnh lương, Info sửa hồ sơ) cho HR dễ nhận biết.
  - **Phòng chờ (`/pending-room`)**: Gọi API với `state_phong_cho = true` (không bật `exclude_pending_new_hires`), trả về 100% nhân sự chưa duyệt (bao gồm cả `TMP...` và nhân sự cũ).
- Chốt rõ contract Export Excel từ màn Danh sách nhân sự chính thức: tự động áp dụng server default hoặc client truyền explicit `exclude_pending_new_hires = true` để loại bỏ hoàn toàn nhân sự nháp mới `TMP...`.
- Chốt rõ contract Autocomplete nhân sự (`/api/employees/autocomplete`): tự động áp dụng `exclude_pending_new_hires = true` (lọc bỏ nhân sự `TMP...` nháp) để tránh chọn nhầm ở các selector form.
- Cập nhật `EmployeeTable.tsx` / `EmployeeListPage.tsx` và `useEmployees.ts` để đồng bộ truyền parameter `exclude_pending_new_hires`.
- Viết backend integration test bao phủ trọn vẹn cả 2 chiều trong `employee.test.ts` (mặc định list ẩn TMP, explicit pending room trả đủ TMP, nhân sự cũ pending vẫn xuất hiện trên main list, export contract và autocomplete contract).

### Out of scope
- Thay đổi cấu trúc Database hay RPC `get_employee_info_scoped`.
- Xóa bỏ icon chỉ báo phòng chờ trên danh sách chính thức đối với nhân sự cũ.

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `TMP-based New Hire Identification`: Nhân sự mới có mã `TMP...` và `state_phong_cho = true` bắt buộc bị ẩn khỏi danh sách chính thức và autocomplete chính thức.
  - `State-driven Visibility Isolation`: Nhân sự cũ có điều chỉnh nháp vẫn giữ tư cách nhân sự đang hoạt động trên danh sách chính thức để phục vụ chốt Snapshot.
  - `SEC-REV-04 Scoped RPC`: Tiếp tục sử dụng `get_employee_info_scoped` làm base query.
- **"Cấm kỵ" cần tránh:** không dùng đơn thuần query `.eq('state_phong_cho', false)` để lọc danh sách chính thức vì sẽ làm biến mất nhân sự cũ đang hoạt động có đợt điều chỉnh nháp.

---

## 4. Giả định và câu hỏi mở

### Giả định
- Định danh nhân sự mới nháp duy nhất dựa trên invariant: `ma_nhan_su.startsWith('TMP')` AND `state_phong_cho = true`.
- Tất cả truy vấn danh sách chính thức và Export Excel từ trang `/employees` mặc định áp dụng `exclude_pending_new_hires = true`.
- Autocomplete tìm kiếm nhân sự chung (selector form) mặc định áp dụng `exclude_pending_new_hires = true`.

### Câu hỏi mở
- Không có.

---

## 5. Acceptance Criteria

- [ ] Khi truy cập `/employees` (Danh sách nhân sự), không còn bất kỳ nhân sự nào mang mã `TMP...` xuất hiện.
- [ ] Nhân sự cũ đang có bản nháp điều chỉnh (`state_phong_cho = true`, mã không phải `TMP...`) VẪN XUẤT HIỆN đầy đủ trên Danh sách nhân sự chính thức (`/employees`).
- [ ] Khi truy cập `/pending-room` (Phòng chờ), toàn bộ các nhân sự chưa duyệt (bao gồm mã `TMP...` và nhân sự cũ điều chỉnh) vẫn hiển thị đầy đủ.
- [ ] Khi thực hiện Export Excel từ `/employees` (bao gồm export thường, export kèm lương, export full), file xuất ra chứa nhân sự chính thức và nhân sự cũ điều chỉnh, loại bỏ hoàn toàn nhân sự mới nháp `TMP...`.
- [ ] Khi gọi API `/api/employees/autocomplete`, kết quả trả về lọc bỏ nhân sự nháp mới `TMP...`.
- [ ] Các icon PDF màu đỏ, Dollar vàng $, Info xanh dương vẫn hiển thị trên Danh sách nhân sự chính thức đối với nhân sự cũ đang có bản nháp điều chỉnh.
- [ ] Tất cả integration tests liên quan đến employee list, export và autocomplete đều PASS.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/routes/employees.ts` | Sửa | Hỗ trợ parameter `exclude_pending_new_hires` và mặc định bật cho main list/export | 🟢 Thấp | Có |
| `backend/src/services/employeeService.ts` | Sửa | Thêm logic lọc `exclude_pending_new_hires` (bỏ TMP nháp) trong `listEmployees` & `searchAutocompleteEmployees` | 🟢 Thấp | Có |
| `frontend/src/hooks/useEmployees.ts` | Sửa | Truyền `exclude_pending_new_hires` khi fetch main list | 🟢 Thấp | Có |
| `frontend/src/pages/Employees/EmployeeListPage.tsx` | Sửa | Đảm bảo các hàm export (`handleExport`, `runExportFull`) truyền `exclude_pending_new_hires=true` | 🟢 Thấp | Có |
| `backend/src/__tests__/integration/employee.test.ts` | Sửa | Bổ sung test case 2 chiều: (1) TMP bị ẩn khỏi main list qua `exclude_pending_new_hires`; (2) nhân sự cũ pending vẫn hiển thị và có pending flags; (3) export & autocomplete contract | 🟢 Thấp | Không |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo `listEmployees` trong backend áp dụng điều kiện lọc `exclude_pending_new_hires` sau khi đã fetch data từ `get_employee_info_scoped` mà không ảnh hưởng phân trang (`count`).
- **Review focus areas:** Đảm bảo xuất Excel full không bị sót dữ liệu nhân sự cũ.

---

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Cập nhật Backend Route & Service (`listEmployees`, `searchAutocompleteEmployees`) + Frontend Hook & Export Page.
  - Phase 2: Bổ sung Integration Test Backend & Kiểm thử thực tế.

---

## 9. Test Strategy

- **Automated Integration Tests (Supabase Local Docker CLI Standard)**: 
  - **Môi trường Test cô lập 100% (Bắt buộc)**: Sử dụng Supabase CLI Local (`npx supabase start`) chạy PostgreSQL + PostgREST Engine + Auth Schema trong Docker tại máy local (`127.0.0.1:54321`).
  - **Quy trình Provisioning Local Harness**:
    1. Khởi tạo cấu hình Supabase CLI (`npx supabase init`) và liên kết schema `database/001_schema.sql` + các migrations vào local setup.
    2. Cấu hình file `supabase/seed.sql` tự động nạp dữ liệu Auth test (`loi.admicro@gmail.com`) và permission baseline khi local DB khởi tạo.
    3. Cấu hình file `.env.test.local` trong backend trỏ `SUPABASE_URL=http://127.0.0.1:54321` và `SUPABASE_SERVICE_ROLE_KEY` local.
  - **Ưu điểm**: **Tuyệt đối KHÔNG chạm, KHÔNG ghi, KHÔNG làm ảnh hưởng bất kỳ dữ liệu nào trên Supabase Cloud Dev/Prod DB**.
  - **Dọn dẹp sạch 100%**: Sử dụng `npx supabase db reset` để khôi phục DB local về trạng thái sạch ban đầu trong 3 giây.
  - **Lệnh chạy integration test**:
    - `pnpm --filter backend run test:integration`
    - `pnpm run typecheck`
- **Manual verification:** 
  1. Mở màn hình `/employees` kiểm tra xem có nhân sự `TMP` nào không.
  2. Mở màn hình `/pending-room` kiểm tra nhân sự nháp vẫn đầy đủ.
  3. Tạo thử 1 nhân sự nháp mới (`TMP`), kiểm tra màn `/employees` không thấy, màn `/pending-room` thấy.
  4. Kiểm tra 1 nhân sự cũ có pending change: vẫn xuất hiện trên `/employees` với các icon PDF/$/Info.

---

## 10. Rollback Plan

- Git revert commit sửa đổi tại `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts` và `frontend/src/pages/Employees/EmployeeListPage.tsx`.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
