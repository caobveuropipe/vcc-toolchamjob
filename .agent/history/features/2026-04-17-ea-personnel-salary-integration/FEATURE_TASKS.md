# Feature Tasks: EA Personnel & Salary Integration

> **Trạng thái**: 🔄 Đang thực hiện  
> **Liên kết plan**: `FEATURE_PLAN.md`  
> **Ngày tạo**: 2026-04-15 (Revised 2026-04-16)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Infrastructure & DB Contract

**Mục tiêu:** Land migration 017 với 5 cột mới, RPC onboarding, và updated SQL functions. Sync shared package lên 30 salary fields.

- [x] Task 1.1: Database Migration 017
    - [x] Thêm 5 cột vào `salaries`: `bac_luong` (TEXT), `ty_le_luong_tv` (NUMERIC(15,0)), `nhuan_but_cc` (NUMERIC(15,0)), `okr_cc` (NUMERIC(15,0)), `thuong_doanh_so_cc` (NUMERIC(15,0))
    - [x] Thêm 5 cột tương ứng vào `snapshot_employees`
    - [x] Tạo RPC `fn_create_employee_onboarding(p_emp_data JSONB, p_salary_data JSONB, p_temp_uuid UUID)` — atomic insert employee + salary + bind docs
    - [x] Cập nhật `submit_employee_pending`: Mở rộng `v_salary_fields` (25→30), thêm logic rẽ nhánh TEXT cho `bac_luong` tại vị trí cast (ref: 015 line 226)
    - [x] Cập nhật view `employee_full`: Thêm 5 cột mới vào SELECT (ref: 001_schema line 448-461)
    - [x] Cập nhật function `create_monthly_snapshot`: Thêm 5 cột mới vào INSERT...SELECT (ref: 001_schema line 516-550)
- [x] Task 1.2: Shared Layer (@vcc/shared)
    - [x] `salary-fields.ts`: Thêm 5 fields (25→30), dùng đúng naming `ty_le_luong_tv`
    - [x] `salary.ts`: Thêm 5 fields vào `salarySchema`; `bac_luong` dùng `z.string()`, còn lại dùng `salaryAmount`
    - [x] `employee.ts`: Tạo `createEmployeeOnboardSchema` wrapper:
        ```ts
        const createEmployeePersonnelSchema = createEmployeeSchema.omit({ temp_uuid: true, pending_changes: true })
        export const createEmployeeOnboardSchema = z.object({
          personnel: createEmployeePersonnelSchema,
          salary: salarySchema.partial(),
          temp_uuid: z.string().uuid(),
        }).strict()
        export type CreateEmployeeOnboardInput = z.infer<typeof createEmployeeOnboardSchema>
        ```
    - [x] `api.ts` line 62: Đổi `has_pending_salary: boolean` thành `has_pending_salary?: boolean` (optional)
    - [x] `schemas/index.ts`: Export `createEmployeeOnboardSchema` và type `CreateEmployeeOnboardInput` qua barrel (convention: route import từ `@vcc/shared`, không từ file con)
    - [x] `schema-sync.test.ts`: Cập nhật assert từ 25 → 30
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
    - [ ] Run `pnpm build:shared` — PASS
    - [ ] Run `pnpm test` trong shared — schema sync PASS (30 fields)
    - [ ] SQL verify: `SELECT bac_luong, ty_le_luong_tv, nhuan_but_cc, okr_cc, thuong_doanh_so_cc FROM employee_full LIMIT 1` — không lỗi
    - [ ] SQL verify: Gọi `submit_employee_pending` với mock pending có `bac_luong = 'L4B1'` — không crash, giá trị TEXT được apply
    - [ ] SQL verify: Gọi `create_monthly_snapshot` — snapshot_employees chứa 5 cột mới
    - [ ] AC-6 covered, AC-7 covered

## Phase 2: Secure Backend Path

**Mục tiêu:** Implement onboarding API route mới, hardening DTO/log, và nâng cấp OCR prompt.

- [x] Task 2.1: Route & Service — Onboarding Path
    - [x] Tạo route `POST /api/employees/onboard` trong `employees.ts` (tách biệt với `POST /api/employees`)
    - [x] Áp dụng `sensitiveRateLimiter` cho route mới (parity với POST /employees hiện tại, ref: employees.ts line 109)
    - [x] Route nhận body `{ personnel: {...}, salary: {...}, temp_uuid: "..." }`
    - [x] Validate bằng `createEmployeeOnboardSchema` (wrapper mới từ Task 1.2, KHÔNG dùng `createEmployeeSchema` nguyên bản)
    - [x] IDOR check: EA/SA quyền tạo khối (lấy từ `parsed.data.personnel.khoi`)
    - [x] `employeeService.createEmployeeWithSalary()`: Phải validate sự tồn tại và quyền sở hữu của `temp_uuid` trước khi thực hiện (copy guard này từ logic create cũ, ref: employeeService.ts line 239-250)
    - [x] Gọi RPC `fn_create_employee_onboarding` sau khi các check trên pass
    - [x] Gọi `recordAuditLog(userEmail, 'create', 'NS-001', ...)` sau khi RPC thành công (parity với POST /employees, ref: employees.ts line 133)
- [x] Task 2.2: Security — DTO Masking & Flag Fix
    - [x] `employeeService.ts` line 146: Filter `has_pending_salary` khỏi response khi user role = VI
    - [x] `employeeService.ts` line 140-141: Sửa logic `has_pending_info` — check direct từ bảng `employees` (không dùng `emp.pending_changes` từ view `employee_info_only` vì view này không có cột đó)
    - [x] `employees.ts` route `POST /api/employees`: Reject 403 nếu body chứa key `pending_changes` (SEC-REV-03 hardening)
    - [x] `employees.ts` route `PUT /api/employees/:id`: Reject 403 nếu body chứa key `pending_changes` (cùng nguyên tắc SEC-REV-03 — chặn cả create lẫn update)
    - [x] `PendingRoomPage.tsx` line 135: Thêm guard render — chỉ hiện tag "Lương" nếu user role có quyền xem lương
- [x] Task 2.3: Zero-Trust OCR
    - [x] `ocrService.ts` line 62: Nâng prompt từ 7 lên 36 fields, structured JSON output
    - [x] `ocrService.ts` line 113: Xóa `logger.error({ fullContent })` → thay bằng `logger.error({ error: 'AI_PARSE_ERROR', documentId })` (không log nội dung thô)
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
    - [ ] Test `POST /api/employees/onboard` → verify employee row + salary.pending_changes row tách biệt
    - [ ] Test `POST /api/employees` (route cũ) vẫn chặn salary keys → 403
    - [ ] Test `POST /api/employees` với body chứa `pending_changes: { salary: {...} }` → reject 403 (SEC-REV-03)
    - [ ] Test `PUT /api/employees/:id` với body chứa `pending_changes: { salary: {...} }` → reject 403 (SEC-REV-03)
    - [ ] Test `POST /api/employees/onboard` với `personnel.pending_changes` → reject (schema validation error)
    - [ ] Test login VI → GET list → verify NO `has_pending_salary` in response JSON
    - [ ] Test tạo employee có `pending_changes` không rỗng → GET list → verify `has_pending_info = true` (đảm bảo bug cũ đã sửa)
    - [ ] Test OCR parse error → verify log KHÔNG chứa raw AI content
    - [ ] Test `POST /api/employees/onboard` với `temp_uuid` không hợp lệ hoặc thuộc user khác → reject 403/400 (bảo vệ ownership)
    - [ ] AC-3 covered, AC-4 covered, AC-5 covered, AC-5c covered

## Phase 3: Frontend & UX

**Mục tiêu:** Cập nhật form tạo mới nhân sự, thêm section Lương, logic fill từ OCR, tính `ty_le_luong_tv`.

- [x] Task 3.1: EmployeeForm & Create Flow Integration
    - [x] Thêm section "Thông tin lương" vào `EmployeeForm.tsx` (chỉ hiển thị cho EA/SA)
    - [x] `EmployeeForm.tsx`: Vẫn tự tạo và quản lý `temp_uuid`, phát `onSubmit({ ...personnelValues, salary: salaryValues, temp_uuid })` (không tự reshape)
    - [x] `useEmployees.ts`: Thêm hook `useCreateEmployeeOnboard()` typed bằng `CreateEmployeeOnboardInput`, gọi `POST /api/employees/onboard`
    - [x] `EmployeeCreatePage.tsx` **(owner reshape)**: Nhận values từ form (hiện đã chứa cả `temp_uuid`) → tách thành `{ personnel, salary, temp_uuid }` theo contract → gọi hook onboard. Nếu không có salary thì giữ hook cũ
    - [x] Logic client-side tính `ty_le_luong_tv` = LCD Thử việc / LCD HĐLĐ * 100
    - [x] Logic fill from OCR: Map kết quả AI vào đúng form fields theo bảng Matching trong Plan
    - [x] Logic fallback: Nếu toàn bộ mục Nội bộ từ OCR trống → copy bộ HĐLĐ sang bộ Cơ chế trên form
    - [x] Enum đích khi tuyển thẳng: `chinh_thuc` (KHÔNG phải `dang_lam`)
- [/] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)
    - [x] E2E: Upload ảnh mẫu → OCR fill form → Submit → Verify DB employee + salary rows
    - [x] Verify fallback logic: OCR trả nội bộ trống → form CƠ CHẾ được lấp bằng HĐLĐ
    - [x] Verify `ty_le_luong_tv` hiển thị đúng trên UI
    - [x] Fix: Loại bỏ "Tạm ứng" khỏi AI OCR prompt & UI kết quả
    - [x] Fix: Xử lý email validation "Expected string, received null" bằng cách build sạch shared library + preprocessing
    - [x] Fix: Khử warning deprecated 'bodyStyle' trong console log antd Card
    - [x] Integration Test: Verify `POST /api/employees/onboard` creates atomic employee + salary records
- [x] Phase 4: Handoff & Archive (Done)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|------------|---------|
| 2026-04-15 16:58 | - | - | Nhận yêu cầu feature + ảnh mẫu giấy tờ | done | |
| 2026-04-15 17:15 | - | - | Chốt bảng Matching và logic Fallback | done | |
| 2026-04-15 17:40 | - | - | Review FR-01→FR-06: Reset gate, chốt RPC/DTO/OCR | done | |
| 2026-04-15 17:48 | - | - | Review FR-07→FR-10: Template alignment, boundary fix | done | |
| 2026-04-15 17:52 | - | - | Review Rollback/Enum/Naming: Hardened | done | |
| 2026-04-16 11:17 | - | - | Review FR-01→FR-04 (round 4): Full rewrite plan/tasks | done | Viết lại hoàn toàn theo template |
| 2026-04-16 11:55 | - | - | Review round 5: Schema wrapper, FE owner, shared type, verify gate | done | 4 findings resolved |
| 2026-04-16 14:10 | - | - | Chốt Plan & Tasks sau thẩm định hội đồng | done | ✅ ĐÃ PHÊ DUYỆT |
| 2026-04-16 14:37 | Phase 1 | Task 1.1 | Bắt đầu implement migration 017 | start | |
| 2026-04-16 14:40 | Phase 1 | Task 1.1 | Hoàn thiện migration 017 | done | |
| 2026-04-16 14:43 | Phase 1 | Task 1.2 | Cập nhật schemas, fields và test trong shared | done | |
| 2026-04-16 14:45 | Phase 1 | Task 1.Final | Self-test success cho `shared`, chờ user chạy SQL verify | start | |
| 2026-04-16 14:52 | Phase 1 | Task 1.Final | User chạy migration thành công, chốt Phase 1 | done | |
| 2026-04-16 14:52 | Phase 2 | Task 2.1 | Cập nhật route và service POST /onboard | start | |
| 2026-04-16 14:55 | Phase 2 | Task 2.1-2.3| Hoàn thành implement, self-test TSC pass. Chờ User API Test | done | |
| 2026-04-16 16:30 | Phase 2 | Task 2.Final | User confirm Phase 2 pass | done | |
| 2026-04-16 16:30 | Phase 3 | Task 3.1 | Bắt đầu implement FE form + onboard hook | start | |
| 2026-04-17 09:10 | Phase 3 | Task 3.1 | Hoàn thành implement FE. Các UI form mới đã được validate | done | |
| 2026-04-17 09:10 | Phase 3 | Task 3.Final | Chờ User Test Frontend UI | start | |
| 2026-04-17 10:10 | Phase 3 | Task 3.Final | Fix lỗi validation email, loại bỏ Tạm ứng, fix console warning AntD | done | |
| 2026-04-17 11:45 | Phase 3 | Task 3.Final | Fix NaN, alignment UI chi tiết, chạy Integration Test onboard | done | Verify `POST /onboard` atomic success |
| 2026-04-17 11:50 | Phase 4 | Archive | Clean up test data & Archive feature | done | Phase 3 hoàn tất 100% |
