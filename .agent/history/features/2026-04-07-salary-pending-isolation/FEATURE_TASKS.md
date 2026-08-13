# Feature Tasks: Tách biệt Salary Pending khỏi bảng Employees

> **Trạng thái**: ✅ Hoàn thành
> **Người thực hiện**: AI Assistant
> **Feature slug**: salary-pending-isolation06
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-06

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase A: DB Migration + Backend Refactor

**Mục tiêu:** Schema mới hoạt động, backend service ghi/đọc salary pending từ bảng `salaries`, SQL function submit đọc từ đúng source, integration tests pass.

### A.1: Database Migration

- [x] Task A.1a: **DB — Tạo `015_salary_pending_isolation.sql` — Schema change**
  - `ALTER TABLE salaries ADD COLUMN pending_changes JSONB DEFAULT '{}';`
  - `ALTER TABLE salaries ADD COLUMN state_pending BOOLEAN DEFAULT false;`
  - `CREATE INDEX idx_salaries_state_pending ON salaries(state_pending);`
  - Idempotent: dùng `IF NOT EXISTS` hoặc `ADD COLUMN IF NOT EXISTS`.

- [x] Task A.1b: **DB — Data migration (trong cùng file 015)**
  - Chuyển `employees.pending_changes -> 'salary'` sang `salaries.pending_changes` cho mọi employee có key `salary` trong `pending_changes`.
  - Set `salaries.state_pending = true` cho các record vừa migrate.
  - Strip key `salary` khỏi `employees.pending_changes` (dùng `- 'salary'`).
  - Chỉ chạy trên records có `pending_changes -> 'salary' IS NOT NULL AND pending_changes -> 'salary' != '{}'::JSONB`.
  - Phải idempotent: chạy 2 lần không duplicate data.

- [x] Task A.1c: **DB — Cập nhật SQL Function `submit_employee_pending`**
  - Fix early-return: Bỏ logic chỉ return khi `v_pending` rỗng. Sửa thành chỉ return khỏi function khi cả `employees.pending_changes` VÀ `salaries.pending_changes` đều rỗng (cover nhánh salary-only).
  - Section "Read pending_changes": bỏ `v_pending -> 'salary'`, thay bằng SELECT `pending_changes` từ `salaries` (JOIN bằng `employee_id`).
  - Section "Clear pending": ngoài clear `employees.pending_changes`, thêm `UPDATE salaries SET pending_changes = '{}'::JSONB, state_pending = false WHERE employee_id = v_employee.id`.
  - Section "Separate employee vs salary": `v_emp_pending = v_pending` (toàn bộ, không cần `- 'salary'`), `v_sal_pending` đọc từ salary row. **Lưu ý:** Thêm check `IF v_sal_pending IS NULL OR v_sal_pending = '{}'::jsonb THEN <skip>`.
  - Giữ nguyên `SECURITY DEFINER`, `SET search_path = public`, `OWNER TO postgres`.

- [x] Task A.1d: **DB — Tạo SQL Function RPC `save_salary_pending` (trong cùng file 015)**
  - Function nhận 2 arguments: `p_employee_id (UUID)` và `p_pending_changes (JSONB)`.
  - Có Lock Order và Transaction Atomic:
    - Step 1: Lock record employee: `SELECT id FROM employees WHERE id = p_employee_id FOR UPDATE;`
    - Step 2: Cập nhật `employees`: `UPDATE employees SET state_phong_cho = true WHERE id = p_employee_id;`
    - Step 3: Upsert `salaries`: `INSERT INTO salaries (employee_id, pending_changes, state_pending) VALUES (p_employee_id, p_pending_changes, true) ON CONFLICT (employee_id) DO UPDATE SET pending_changes = salaries.pending_changes || EXCLUDED.pending_changes, state_pending = EXCLUDED.state_pending;` (Lưu ý dùng toán tử `||` để append/merge JSON thay vì ghi đè nếu Node chưa merge chuẩn).
  - Gắn tag `SECURITY DEFINER`.

### A.2: Backend Service Refactor

- [x] Task A.2a: **BE — Sửa `salaryService.ts` → `saveSalaryToPending()`**
  - **LƯU Ý QUAN TRỌNG:** Phải giữ nguyên hoàn toàn đoạn logic verify và bind tài liệu (`temp_uuid`) vào Employee hiện có ở service.
  - Check cẩn thận payload: Trước khi gọi RPC, phải đảm bảo Service đọc/merge `salaries.pending_changes` cũ. Nếu gửi dạng raw patch thì nhờ toán tử `||` trong SQL tự động merge mảng JSON thay thay vì bị ghi đè hoàn toàn (overwrite).
  - Đổi logic gọi từ 2 bước rải rác sang việc gọi duy nhất hàm SQL RPC `save_salary_pending`:
    - `await supabase.rpc('save_salary_pending', { p_employee_id: empData.id, p_pending_changes: mergedPayload })`
  - Đảm bảo exception handling cho trường hợp gọi RPC thất bại.
  - KHÔNG ghi bất kỳ key `salary` nào vào `employees.pending_changes` trực tiếp nữa.

- [x] Task A.2b: **BE — Sửa `salaryService.ts` → read functions**
  - `getSalaryByMaNhanSu()`: Đọc `pending_salary` từ `salaries.pending_changes` thay vì `empData.pending_changes?.salary`.
  - `getSalaryList()`: Nếu `employee_full` view trả `pending_changes` → đảm bảo không parse key `salary` từ đó. Nếu cần pending indicator → query `salaries.state_pending`.

- [x] Task A.2c: **BE — Sửa `employeeService.ts` → loại bỏ salary leak surface**
  - `getEmployeeById()`: Khi trả `pending_changes`, strip key `salary` nếu còn tồn tại. Code thêm logic resolver: tính toán và trả về flag boolean `can_view_salary_detail` (gộp quyền SA, EA, VA toàn cục + quyền gán NNT của Record theo cá nhân), để FE quyết định fetch lương hay không.
  - `listEmployees()`: TÍNH TOÁN 2 biến boolean `has_pending_info` và `has_pending_salary` bằng query an toàn. Không trả dữ liệu payload pending_changes ra khỏi API list này.

- [x] Task A.2d: **Shared — Cập nhật Type DTO**
  - Sửa `EmployeeListItem` trong `packages/shared` để có type chặt `has_pending_info: boolean` và `has_pending_salary: boolean`.
  - Cập nhật rạch ròi cho cấu trúc `EmployeeDetail` phục vụ FE (bổ sung optional `pending_salary` với type chặt + bổ sung flag `can_view_salary_detail: boolean`). Không dùng chung List API type cho Detail API nữa.
  
- [x] Task A.2e: **BE — Cập nhật integration tests**
  - Test seed backfill: Seed record có data ở `employees.pending_changes.salary` cũ rích, gọi migration và query lại `salaries.pending_changes` bằng SQL/Superadmin để verify copy data thành công.
  - Test regression luồng Document: Truyền lên `temp_uuid` lương và verify documents vẫn được liên kết hợp lệ sau khi refactor qua RPC.
  - `salary.test.ts`: Verify `PUT` salary → `salaries.pending_changes` có data, `employees.pending_changes` KHÔNG có key `salary`. Verify submit -> clear cả 2 bảng.
  - Test case mới: "salary-only pending" submit không bị abort do early return.

- [/] Task A.Final: 🧪 **Test & Verify Phase A**
  - User chạy migration 015 trên Supabase.
  - Chạy `pnpm run typecheck` → 0 errors.
  - Chạy integration tests → pass.
  - Verify trên Supabase Dashboard: `employees` table không còn `pending_changes.salary` trên bất kỳ record nào.
  - Verify `salaries` table: có cột `pending_changes` và `state_pending`.
  - Test thủ công: EA sửa lương → verify salary ghi vào `salaries.pending_changes`.
  - Test thủ công: Submit → verify salary applied đúng, cả 2 bảng pending cleared.

---

## Phase B: Frontend Update + Final Regression

**Mục tiêu:** FE đọc pending salary từ đúng nguồn, UI Phòng chờ hoạt động chính xác, không regression.

- [x] Task B.1: **FE — Sửa `PendingRoomPage.tsx`**
  - Xóa mọi reference đến JSON parse `pending_changes`.
  - Dựa thẳng vào thuộc tính boolean DTO:
    - Tag "Hồ sơ" hiển thị khi `record.has_pending_info === true`.
    - Tag "Lương" hiển thị khi `record.has_pending_salary === true`.

- [x] Task B.2: **FE — Sửa `EmployeeDetailPage.tsx`**
  - Implement Permission Gating (Role-based fetch): Chỉ fetch `pending_salary` API khi BE đã giải quyết xong permission và báo hiệu ở Record object: cờ `employee.can_view_salary_detail === true`. (Loại bỏ logic Frontend tự đánh giá Role). Tránh lỗi 403 API ném ra làm vỡ UI trang.
  - Bỏ dependency vào `employee.pending_changes?.salary`.

- [x] Task B.3: **FE — Update types/hooks nội bộ**
  - Đảm bảo `SalaryDetail` type có `pending_salary` mapped đúng.
  - Refactor hook `useEmployeeDetail()` ép dùng đúng `EmployeeDetail` thay vì fallback vào `EmployeeListItem`.
  - Cập nhật component consuming detail để fetch/read đúng type mạnh.

- [x] Task B.Final: 🧪 **Test & Verify Phase B (Final)**
  - Full regression UI:
    - Danh sách lương: hiển thị đúng, filter hoạt động, export OK.
    - Sửa lương → pending → hiển thị tag "Lương" trong Phòng chờ.
    - Submit → salary applied, tags cleared.
    - VI truy cập employee detail → KHÔNG thấy pending salary.
    - SA sửa lương NS nghỉ việc → vẫn OK.
  - Chạy `pnpm run typecheck` → 0 errors.
  - Chạy integration tests → pass (final regression).
  - Verify DB: `employees.pending_changes` clean — không còn key `salary` trên bất kỳ record nào.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-06 | — | — | Tạo plan salary-pending-isolation | ⏳ | Chờ review |
| 2026-04-07 14:15 | A | — | Bắt đầu Phase A: DB Migration + Backend Refactor | start | Gate ✅ ĐÃ DUYỆT |
| 2026-04-07 14:15 | A | A.1a | Bắt đầu tạo migration file 015 — schema change | start | —  |
| 2026-04-07 14:17 | A | A.1a-d | Hoàn thành migration 015: schema + data migration + submit fn + save RPC | done | 1 file chứa A.1a-d |
| 2026-04-07 14:17 | A | A.2a-c | Hoàn thành refactor BE service layer (salary + employee) | done | strip salary, new queries |
| 2026-04-07 14:28 | A | A.2d | Bắt đầu cập nhật shared Type DTO | start | — |
| 2026-04-07 14:32 | A | A.2d-e | Hoàn tất cập nhật DTO và sửa test assertions | done | typecheck pass |
| 2026-04-07 14:34 | A | A.Final | AI re-test: salary.test.ts 3/8 fail | retry | RPC save_salary_pending chưa tồn tại trên DB — cần chạy migration 015 |
| 2026-04-07 14:36 | A | A.Final | User chạy migration 015 trên Supabase | done | User confirm |
| 2026-04-07 14:37 | A | A.Final | AI re-test: salary 8/8, phase-d 6/6, full suite 36/36 | done | ALL PASS ✅ |
| 2026-04-07 14:48 | B | B.1-2 | Sửa Frontend: PendingRoomPage, EmployeeDetailPage, useEmployees | done | Fetch logic mới |
| 2026-04-07 14:58 | B | B.3 | Cập nhật hook & type | done | done |
| 2026-04-07 14:58 | B | B.Final | AI chạy Final Integration Test (Backend regression) | done | 36/36 PASS ✅ |
| 2026-04-07 16:13 | B | B.Final | User confirm test FE pass | done | Phase B hoàn tất |
| 2026-04-07 16:13 | — | Finish | Đóng feature salary-pending-isolation | done | ✅ Tất cả task hoàn thành |
