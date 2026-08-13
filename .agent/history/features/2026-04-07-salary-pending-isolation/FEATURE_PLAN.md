# Feature Plan: Tách biệt Salary Pending khỏi bảng Employees

> **Trạng thái**: ✅ ĐÃ DUYỆT (Đã cập nhật theo 7 ý kiến chuyên gia)
> **Review gate**: Đã vượt qua review. Sẵn sàng thực thi với thiết kế an toàn giao dịch và API contract chuẩn xác.
> **Feature slug**: `salary-pending-isolation`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hệ thống Phase 3 (NS-002 Salary CRUD) hiện lưu dữ liệu salary pending trong `employees.pending_changes.salary` — một JSONB key nằm bên trong bảng `employees`. Thiết kế này mâu thuẫn trực tiếp với nguyên tắc **Salary Data Isolation** đã chốt từ Phase 2: salary data phải tách biệt hoàn toàn khỏi `employees`, được bảo vệ bởi view `employee_info_only` và middleware VI hard-block.
- **Vấn đề cần giải quyết:**
  1. **Vi phạm Data Isolation:** Salary data (dù ở dạng pending) nằm vật lý trong bảng `employees`, tạo bề mặt rò rỉ (leak surface) cho mọi endpoint đọc `employees.pending_changes`.
  2. **Rủi ro bảo mật:** `employeeService.getEmployeeById()` (L184-191) query trực tiếp bảng `employees` để lấy `pending_changes`, bypass view `employee_info_only` → có thể vô tình trả salary pending cho VI.
  3. **Single state flag:** `employees.state_phong_cho` không phân biệt được "pending info" vs "pending salary" vs "pending cả hai", khiến UI phải parse JSONB ở client.
  4. **Chặn hướng phát triển:** Không thể tách workflow approval info/salary, không thể thêm versioning/deadline cho salary pending riêng.
- **Mục tiêu:** Chuyển hoàn toàn salary pending data sang bảng `salaries` với cơ chế `pending_changes` + `state_pending` riêng biệt, giữ nguyên tính atomic khi submit, và loại bỏ hoàn toàn salary data khỏi bảng `employees`.
- **Kết quả mong đợi:** Sau refactor, bảng `employees.pending_changes` KHÔNG BAO GIỜ chứa key `salary`. Mọi salary pending được lưu trong `salaries.pending_changes`. SQL function submit vẫn atomic. UI Phòng chờ hoạt động đúng. Không có regression.

## 2. Phạm vi

### In scope
- **DB — Migration:** Thêm cột `pending_changes JSONB DEFAULT '{}'` và `state_pending BOOLEAN DEFAULT false` vào bảng `salaries`
- **DB — Data migration:** Chuyển dữ liệu `employees.pending_changes.salary` hiện có sang `salaries.pending_changes`, rồi strip key `salary` khỏi `employees.pending_changes`
- **DB — SQL Function:** Cập nhật `submit_employee_pending` để đọc salary pending từ `salaries.pending_changes` thay vì `employees.pending_changes -> 'salary'`. KHÔNG early-return nếu `employees.pending_changes` rỗng mà `salaries.pending_changes` có data (cover nhánh salary-only). Đảm bảo check rỗng `IF v_sal_pending IS NULL OR v_sal_pending = '{}'::jsonb`.
- **DB — SQL Function (MỚI):** Tạo RPC `save_salary_pending` với Transaction an toàn: Lock `employees` trước (để chống deadlock), sau đó Upsert (`INSERT ... ON CONFLICT DO UPDATE`) vào `salaries` để đảm bảo luôn tồn tại row, cuối cùng update `employees.state_phong_cho`.
- **BE — salaryService.ts:** Sửa `saveSalaryToPending()` gọi qua RPC `save_salary_pending`. Lưu ý KHÔNG được xóa bỏ hay bỏ quên logic bind chứng từ tài liệu (`temp_uuid`) của đoạn hội thoại cũ.
- **BE — salaryService.ts:** Sửa `getSalaryByMaNhanSu()` và `getSalaryList()` đọc pending từ `salaries.pending_changes`
- **BE — employeeService.ts:** Strip key `salary` khỏi `pending_changes`, tính toán và trả thêm cờ `can_view_salary_detail` ở API `getEmployeeById` để FE check record-level permission. Đồng thời chuẩn hóa DTO list trả về 2 boolean riêng biệt: `has_pending_info` và `has_pending_salary`.
- **FE — PendingRoomPage.tsx:** Render tag "Hồ sơ" và "Lương" hoàn toàn dựa vào `has_pending_info` và `has_pending_salary` từ List API (không parse `pending_changes`).
- **FE — EmployeeDetailPage.tsx:** Fetch `pending_salary` từ salary API chỉ khi `employee.can_view_salary_detail === true` (gating an toàn), tránh lỗi 403 cho role VI.
- **Shared/DTO**: Cập nhật strict types cho `EmployeeListItem`, `EmployeeDetail` và permission DTO.
- **Integration tests**: Update data seed tests: chứng minh legacy dữ liệu cũ (có pending salary trong bản ghi employee) migrate thành công sang salaries trước khi xóa key; owner: team Backend.

### Out of scope
- Tách workflow approval riêng cho info/salary (enhancement tương lai)
- Thêm salary pending versioning/deadline
- Thay đổi view `employee_full` hoặc `employee_info_only` (không cần — pending data không đi qua view)

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-04-01] Salary Data Isolation`: Salary fields bị chặn cứng trong luồng Hồ sơ, chỉ thay đổi qua phân hệ Lương → **cần mở rộng nguyên tắc này sang cả pending data**
  - `[2026-03-14] Salary Isolation`: View `employee_info_only` ẩn salary cho VI → cần đảm bảo `employees.pending_changes` cũng không chứa salary
  - `[2026-03-31] Service-Layer Data Splitting`: Flatten/Split tại Service layer → salary pending cũng nên nằm ở bảng `salaries`
  - `[2026-04-06] RLS Atomic Exemption`: SQL Function dùng `SECURITY DEFINER` để bypass RLS → function mới vẫn cần property này khi đọc `salaries.pending_changes`
  - `[2026-04-06] State-driven Visibility Isolation`: NS phòng chờ bị ẩn khỏi danh sách lương → cờ `state_phong_cho` vẫn là gate chính
- **"Cấm kỵ" cần tránh:**
  - KHÔNG cho VI xem bất kỳ salary data nào (kể cả pending)
  - KHÔNG dùng `supabase.from()` ở FE
  - KHÔNG skip permission check khi Redis down
- **Ràng buộc kiến trúc liên quan:**
  - `salaries` có RLS `USING(false)` → mọi truy cập qua `service_role` key
  - SQL Function `submit_employee_pending` là **Owner duy nhất** của INSERT vào `change_history` + `audit_log` khi submit
  - `SALARY_FIELDS` (25 items) từ `@vcc/shared` là source of truth
  - `employees.state_phong_cho` vẫn là cờ chính quyết định NS có nằm trong Phòng chờ hay không

## 4. Giả định và câu hỏi mở

### Giả định
1. **`state_phong_cho` giữ vai trò tổng hợp:** Khi salary pending được lưu → vẫn set `employees.state_phong_cho = true` để NS xuất hiện trong Phòng chờ. Cờ `salaries.state_pending` chỉ dùng để phân biệt loại pending (info vs salary), không thay thế `state_phong_cho`.
2. **Submit vẫn atomic qua 1 SQL function:** Function `submit_employee_pending` mở rộng đọc thêm `salaries.pending_changes`, clear cả 2 bảng trong cùng transaction.
3. **Data migration an toàn:** Dữ liệu `employees.pending_changes.salary` hiện tại không nhiều (hệ thống mới go-live). Migration có thể chạy online không cần downtime.
4. **View `employee_full` không cần thay đổi:** View này dùng `e.*` nên bản chất CÓ mang theo cột `employees.pending_changes`. Tuy nhiên, vì migration DB đã rút sạch key `salary` ra khỏi cột này, cái view sẽ trả về pending info thay vì leak lương. Do đó, cấu trúc view này an toàn và không cần sửa.
5. **Số lượng record có pending salary hiện tại:** Dự kiến < 10 records (hệ thống đang ở giai đoạn đầu). Migration có thể chạy idempotent.

### Câu hỏi mở
- [Non-blocking] Có nên tạo index cho `salaries.state_pending` không? → Tạm giả định có, vì Phòng chờ cần query nhanh.

## 5. Acceptance Criteria

- [ ] AC-01: Bảng `salaries` có cột `pending_changes JSONB DEFAULT '{}'` và `state_pending BOOLEAN DEFAULT false`
- [ ] AC-02: Mọi `employees.pending_changes` trong DB KHÔNG chứa key `salary` sau migration
- [ ] AC-03: `PUT /api/salaries/:ma_nhan_su` ghi vào `salaries.pending_changes` + set `salaries.state_pending = true` + set `employees.state_phong_cho = true`
- [ ] AC-04: `GET /api/salaries/:ma_nhan_su` trả `pending_salary` từ `salaries.pending_changes` (KHÔNG từ `employees.pending_changes`)
- [ ] AC-05: Submit phòng chờ → apply employee pending + salary pending trong cùng 1 transaction → clear cả `employees.pending_changes`, `salaries.pending_changes`, `salaries.state_pending`, `employees.state_phong_cho`
- [ ] AC-06: API employee list cho Phòng chờ trả `has_pending_salary: boolean` và `has_pending_info: boolean` — computed từ DB.
- [ ] AC-07a: FE Phòng chờ hiển thị tag "Lương" dựa trên `has_pending_salary` (không parse `pending_changes`)
- [ ] AC-07b: FE Phòng chờ hiển thị tag "Hồ sơ" dựa trên `has_pending_info` (không parse `pending_changes`)
- [ ] AC-08: API `getEmployeeById()` KHÔNG trả salary data trong `pending_changes` cho bất kỳ role nào
- [ ] AC-09: Integration tests `salary.test.ts` pass với schema mới
- [ ] AC-10: Integration tests `phase-d-flow.test.ts` pass (regression)
- [ ] AC-11: Không regression trên UI: danh sách lương, sửa lương, phòng chờ, submit, export

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/015_salary_pending_isolation.sql` | **Tạo mới** | Schema change + data migration + function update | 🔴 | Chưa — viết mới |
| `backend/src/services/salaryService.ts` | **Sửa** | `saveSalaryToPending()` ghi sang `salaries`, read functions đọc pending từ `salaries` | 🔴 | Có contract |
| `backend/src/services/employeeService.ts` | **Sửa** | Strip salary từ `pending_changes` response, thêm `has_pending_salary` vào list | 🟡 | Có contract |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | **Sửa** | Đọc `has_pending_salary` thay vì parse JSONB | 🟢 | — |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | **Sửa** | Đọc pending salary từ salary API | 🟢 | — |
| `frontend/src/services/salaryService.ts` | **Sửa (nhỏ)** | Type update nếu cần | 🟢 | — |
| `backend/src/__tests__/integration/salary.test.ts` | **Sửa** | Verify pending schema mới | 🟡 | — |
| `backend/src/__tests__/integration/phase-d-flow.test.ts` | **Sửa** | Regression verify | 🟡 | — |

## 7. Risk Triage và Review Focus

- **Review required:** 🔴 **BẮT BUỘC** — chạm salary data schema, SQL function atomic, data migration, security boundary
- **Risk hotspots:**
  1. **SQL Function `submit_employee_pending`**: Phải đọc pending salary từ `salaries.pending_changes` thay vì `employees.pending_changes -> 'salary'`. Sai ở đây = data loss khi submit.
  2. **Data migration idempotency**: Nếu migration chạy 2 lần, không được duplicate hoặc mất data.
  3. **Race condition**: Giữa lúc ghi `salaries.pending_changes` và set `employees.state_phong_cho = true` — 2 statement riêng biệt. Cần đảm bảo consistency.
  4. **Security — `pending_changes` leak**: Sau migration, kiểm tra KHÔNG còn endpoint nào trả `employees.pending_changes.salary`.
  5. **`employee_full` view**: Hiện đang được dùng bởi `getSalaryList()`. View này join `e.*` từ `employees` → bao gồm `pending_changes`. Cần xác nhận FE không parse nó từ list response.
- **Review focus areas:**
  - SQL Function: đọc đúng source, clear đúng target, atomicity không bị phá
  - Data migration: handle edge case — employee có pending salary nhưng chưa có salary row? (phải có rồi do backfill migration 013)
  - Security: audit toàn bộ nơi `pending_changes` được trả về, đảm bảo không còn salary key
  - FE: xác nhận `has_pending_salary` boolean hoạt động đúng cho Phòng chờ tag
- **Known pitfalls / historical issues:**
  - `[2026-04-06]` SQL Function `submit_employee_pending` từng gặp lỗi RLS chặn `SELECT salaries` → đã fix bằng `SECURITY DEFINER` + `INSERT ON CONFLICT`. Function mới vẫn cần giữ cơ chế này.
  - `[2026-04-06]` `employee_full` view chứa `e.*` → bao gồm `pending_changes`. Nếu FE dùng `pending_changes` từ list response thì sẽ sai sau migration. Cần verify.
- **Dependencies / rollout concerns:**
  - Migration 015 phải chạy trên Supabase trước khi deploy backend mới
  - Frontend + backend phải deploy đồng thời (hoặc BE trước, FE sau)
  - Không cần downtime nếu migration chạy nhanh (< 10 records affected)

## 8. Chiến lược triển khai

## 8. Chiến lược triển khai

- **Phase strategy:** Chia thành **2 phases**:
  - **Phase A — DB Migration + Backend Refactor**: Migration schema, RPC, unit/integration test logic (kể cả backfill test).
  - **Phase B — Frontend Update + Final Regression**: Cập nhật DTO, FE PendingRoom, EmployeeDetail có permission gating.
- **Quy trình Rollout:** 
  - Vì dự án đang trong quá trình phát triển (chưa lên Production, data hoàn toàn là dữ liệu test có thể reset bất cứ lúc nào), hệ thống hiện tại **không cần làm tương thích ngược** hay bận tâm về **downtime**.
  - Triển khai theo thứ tự tự nhiên: Deploy DB Migration -> Deploy Backend -> Deploy Frontend. Nếu có lỗi dữ liệu cũ, hoàn toàn có thể reset dữ liệu mà không ảnh hưởng người dùng.
- **Yêu cầu migration / config / deploy:**
  - SQL Migration `015_salary_pending_isolation.sql`
  - Rollout Database -> Backend -> Frontend xong mới mở hệ thống lại.

## 9. Test Strategy

- **Automated tests:**
  - **Integration test**: `salary.test.ts` — verify `PUT` salary ghi vào `salaries.pending_changes`, submit clear cả 2 bảng, pending salary trả từ salary API
  - **Integration test**: `phase-d-flow.test.ts` — regression
  - **Typecheck**: `pnpm run typecheck` pass 0 errors
- **Manual verification:**
  - EA sửa lương → verify DB `salaries.pending_changes` có data, `employees.pending_changes` KHÔNG có key `salary`
  - Phòng chờ → verify tag "Lương" hiển thị đúng
  - Submit → verify salary applied, pending cleared, `state_pending = false`
  - VI truy cập employee detail → verify KHÔNG thấy pending salary data
  - Kiểm tra `employees` table trên Supabase → confirm không còn record nào có `pending_changes.salary`
- **Data / env chuẩn bị trước khi test:**
  - Chạy migration 015 trên Supabase
  - Có sẵn NS test với pending salary changes (để verify data migration)

## 10. Rollback Plan

- **DB Rollback:**
  - Chạy reverse migration: copy `salaries.pending_changes` ngược về `employees.pending_changes.salary`
  - DROP cột `pending_changes` và `state_pending` từ `salaries`
  - Restore SQL function `submit_employee_pending` về version cũ (đọc từ `employees.pending_changes -> 'salary'`)
- **Code Rollback:**
  - Revert backend services + frontend pages về version trước
- **Rollback safe**: Vì data migration là bidirectional, có thể rollback hoàn toàn nếu cần

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## 12. Review Notes

- **Tiếp thu góp ý chuyên gia (FR-01 -> FR-07):** 
  - **FR-01:** Xác nhận vì dự án chưa lên Production (dữ liệu hoàn toàn là test), chọn phương án deploy thẳng (DB -> BE -> FE) và bỏ qua mọi yêu cầu về tương thích ngược hay mô phỏng downtime.
  - **FR-02:** RPC `save_salary_pending` đã được yêu cầu dùng `INSERT ON CONFLICT` và lock `employees` trước để chống deadlock/zero-row update.
  - **FR-03:** Sửa lại logic early-return của `submit_employee_pending` phải check cả hai condition.
  - **FR-04:** Chốt DTO API List trả về `has_pending_info` và `has_pending_salary` thay vì `pending_changes`.
  - **FR-05:** UI Fetch của API Salary tại trang Detail sẽ được wrap trong Permission Check dành cho role không phải VI.
  - **FR-06 & FR-07:** Thống nhất giao test migration backfill và DTO update vào Tasks chi tiết của từng Phase. Bổ sung task cho Explicit Type Typing Detail.
  - **FR-08 (Bonus):** Đảm bảo luồng bind tài liệu `temp_uuid` không bị sót trong quá trình thay thế query. Thêm Acceptance Criteria 07b cho `has_pending_info`.
