# Feature Plan: EA Personnel & Salary Integration

> **Trạng thái**: ✅ ĐÃ PHÊ DUYỆT  
> **Review gate**: Bắt buộc review trước khi thực thi  
> **Feature slug**: ea-personnel-salary-integration  
> **Tạo bởi**: feature-plan  
> **Ngày tạo**: 2026-04-15 (Revised 2026-04-16)

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi tạo nhân sự mới, EA chỉ nhập thông tin hồ sơ. Thông tin lương phải nhập riêng ở màn hình khác, gây ngắt quãng trong khi giấy tờ tuyển dụng chứa cả hai loại dữ liệu.
- **Vấn đề cần giải quyết:** Luồng onboarding thiếu phần lương; OCR chỉ bóc 7 field nhân sự; bảng salaries thiếu 5 cột cho cơ chế nội bộ và metadata lương; PII bị log khi OCR parse lỗi.
- **Mục tiêu:** Cho phép EA nhập đồng thời hồ sơ + lương trong cùng 1 form, hỗ trợ AI OCR bóc tách 36 trường từ ảnh giấy tờ, giữ vững Salary Isolation.
- **Kết quả mong đợi:** EA onboard nhân sự mới hoàn chỉnh trong 1 lượt; dữ liệu hồ sơ và lương nằm tách biệt vật lý trong 2 bảng nhưng ghi atomic trong 1 transaction.

## 2. Phạm vi

### In scope
- Thêm 5 cột mới vào bảng `salaries` (và mirror sang `snapshot_employees`).
- Tạo SQL RPC `fn_create_employee_onboarding` xử lý ghi đa bảng atomic.
- Cập nhật view `employee_full`, function `submit_employee_pending`, function `create_monthly_snapshot`.
- Nâng OCR prompt từ 7 lên 36 fields, bao gồm bóc lương Giấy tờ + Nội bộ.
- Hardening: Ẩn `has_pending_salary` khỏi VI, xoá raw PII khỏi log.
- Cập nhật Frontend form tạo mới: Thêm section Lương, logic fill từ OCR, tính `ty_le_luong_tv`.

### Out of scope
- Luồng phê duyệt (Approval) thay đổi lương sau khi đã Submit.
- Tự động chuyển trạng thái `thu_viec` → `chinh_thuc`.
- Refactor luồng `save_salary_pending` hiện tại (route `PUT /salary`).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
    - Salary Data Isolation (KB [2026-04-01]): Dữ liệu lương LUÔN nằm riêng bảng `salaries`, KHÔNG lồng vào `employees.pending_changes`.
    - Salary Pending Isolation (KB [2026-04-07]): Pending salary dùng `salaries.pending_changes` + `salaries.state_pending`.
    - Zero-trust logging (KB [2026-03-31]): KHÔNG log nội dung thô từ AI vào backend log.
- **"Cấm kỵ" cần tránh:**
    - KHÔNG để salary keys đi qua `employees.pending_changes` (SEC-REV-03).
    - KHÔNG cho phép FE gọi trực tiếp DB/RPC — phải qua chain `FE → Hono API → Service → Supabase RPC`.
- **Ràng buộc kiến trúc liên quan:**
    - `employee_info_only` view KHÔNG chứa `pending_changes` (do đó `has_pending_info` trong list API đang tính sai).
    - `submit_employee_pending` SQL function đang cast toàn bộ salary fields sang `::NUMERIC(15,0)` — cần branch cho `bac_luong` (TEXT).

## 4. Giả định và câu hỏi mở

### Giả định
- Matching Fallback: Nếu **toàn bộ** mục Nội bộ trên giấy tờ trống → Copy nguyên bộ giá trị HĐLĐ sang Cơ chế trên Form.
- `bac_luong` dùng kiểu TEXT để hỗ trợ mã bậc phức tạp (ví dụ: `L4B1/B5/TBL`).
- `ty_le_luong_tv` lưu dưới dạng NUMERIC(15,0) đơn vị phần trăm nhân 100 (ví dụ: 85% → 8500).
- Enum hệ thống dùng `chinh_thuc` (KHÔNG phải `dang_lam`) — xác nhận tại `khoi.ts` line 22.

### Câu hỏi mở
- [Non-blocking] Quy ước hiển thị % trên UI: `85%` hay `0.85`? Giả định: hiển thị `85%`.

## 5. Acceptance Criteria

- [ ] **AC-1**: OCR bóc tách chính xác tối đa 36 trường từ ảnh "Quyết định cuối cùng" (personnel + salary).
- [ ] **AC-2**: Tỷ lệ thử việc (`ty_le_luong_tv`) được tính đúng: `LCD Thử việc / LCD HĐLĐ * 100`.
- [ ] **AC-3**: Tạo nhân sự mới có kèm dữ liệu lương → dữ liệu hồ sơ nằm ở `employees`, lương nằm ở `salaries.pending_changes`. KHÔNG có salary key nào lọt vào `employees.pending_changes`.
- [ ] **AC-4**: Backend log KHÔNG chứa nội dung thô từ AI OCR khi parse lỗi.
- [ ] **AC-5**: Role VI gọi list API → response KHÔNG chứa field `has_pending_salary`.
- [ ] **AC-6**: Submit thành công → 5 field mới (`bac_luong`, `ty_le_luong_tv`, `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`) được apply từ pending vào live columns.
- [ ] **AC-7**: Snapshot tháng chứa đủ 5 field mới.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do | Rủi ro | Contract |
|-------------|-----------|-------|--------|----------|
| `database/001_schema.sql` | Sửa header version | Đồng bộ version | 🟢 | Có |
| `database/migrations/017_*.sql` | Tạo mới | 5 cột + RPC + updated functions | 🔴 | Chưa |
| `database/migrations/015_salary_pending_isolation.sql` | Tham chiếu | `v_salary_fields` (line 95) + cast logic (line 226) cần mirror trong 017 | 🔴 | Có |
| `packages/shared/src/constants/salary-fields.ts` | Sửa | Thêm 5 fields (25→30) | 🟡 | Có |
| `packages/shared/src/schemas/salary.ts` | Sửa | Thêm 5 fields Zod | 🟡 | Có |
| `packages/shared/src/schemas/employee.ts` | Sửa | Thêm `createEmployeeOnboardSchema` wrapper (omit temp_uuid + wrap personnel/salary/temp_uuid) | 🟡 | Có |
| `packages/shared/src/schemas/index.ts` | Sửa | Export `createEmployeeOnboardSchema` + type `CreateEmployeeOnboardInput` qua barrel (line 1-2) | 🟢 | Có |
| `packages/shared/src/types/api.ts` | Sửa | `has_pending_salary` đổi thành optional (`?:`) vì VI sẽ không nhận field này (line 62) | 🟡 | Có |
| `packages/shared/src/tests/schema-sync.test.ts` | Sửa | Assert 30 thay vì 25 | 🟡 | Có |
| `backend/src/services/ocrService.ts` | Sửa | Prompt 36 fields + xoá PII log (line 113) | 🔴 | Có |
| `backend/src/services/employeeService.ts` | Sửa | Masking `has_pending_salary` cho VI (line 146), sửa `has_pending_info` (line 140-141) | 🔴 | Có |
| `backend/src/routes/employees.ts` | Sửa | Route `POST /api/employees/onboard` mới, validate bằng `createEmployeeOnboardSchema` | 🔴 | Có |
| `frontend/src/hooks/useEmployees.ts` | Sửa | Thêm hook `useCreateEmployeeOnboard()` gọi `/api/employees/onboard` (line 57-65) | 🟡 | Có |
| `frontend/src/pages/Employees/EmployeeCreatePage.tsx` | Sửa | Phân nhánh: có salary → dùng onboard hook, không salary → giữ hook cũ (line 12-17) | � | Có |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Guard render `has_pending_salary` theo role (line 135) | 🟡 | Chưa |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Thêm section Lương, logic fill OCR, phát salary bag qua onSubmit | 🟡 | Chưa |

## 7. Risk Triage và Review Focus

- **Review required:** Yes — bắt buộc
- **Risk hotspots:**
    - SQL `submit_employee_pending` cast `::NUMERIC(15,0)` cho toàn bộ salary keys (line 226 migration 015) → `bac_luong` TEXT sẽ crash nếu không branch.
    - `employees.ts` route line 115 chặn mọi salary key → Onboarding route phải bypass guard này một cách có kiểm soát.
    - `employee_info_only` view không có `pending_changes` → list API tại service line 140 tính `has_pending_info` sai.
- **Review focus areas:**
    - Salary Isolation có bị phá khi mở onboarding path?
    - RPC mới có đảm bảo atomicity và rollback khi một bước fail?
    - OCR prompt mới có rủi ro hallucination giữa Trial/Official?
- **Known pitfalls / historical issues:**
    - Migration 015 đã từng rebuild `submit_employee_pending` hoàn toàn → migration 017 phải `CREATE OR REPLACE` cẩn thận.
    - OCR proxy từng bị 502 → streaming strategy đã fix (conversation [70ce28b5]).
- **Dependencies / rollout concerns:**
    - Migration 017 phải chạy trước khi deploy code mới (RPC phải tồn tại khi service gọi).
    - Shared package phải build lại trước khi backend/frontend pick up schema mới.
    - Rollout order: Migration → Shared → Backend → Frontend.

## 8. Chiến lược triển khai

- **Phase strategy:** 3 phases — DB/Shared → Backend → Frontend. Mỗi phase có gate test riêng.
- **Thứ tự triển khai:**
    1. Phase 1: Land migration 017 + cập nhật shared constants/schemas/test
    2. Phase 2: Backend service/route/OCR hardening
    3. Phase 3: Frontend form + matching logic
- **Điểm cần phối hợp:** Migration phải chạy trên DB Dev trước khi test backend.
- **Yêu cầu migration / config / deploy:** Migration 017 phải idempotent (IF NOT EXISTS pattern).

### Boundary Contract cho Onboarding Flow

```
Frontend (EmployeeCreatePage → useCreateEmployeeOnboard hook)
  │ POST /api/employees/onboard  ← Route MỚI, tách biệt với POST /employees hiện tại
  │ Body: { personnel: {...}, salary: {...}, temp_uuid: "..." }
  ▼
Hono Router (employees.ts)
  │ Validate bằng createEmployeeOnboardSchema (wrapper schema mới trong shared):
  │   - personnel: createEmployeeSchema.omit({ temp_uuid, pending_changes })
  │   - salary: salarySchema.partial()
  │   - temp_uuid: z.string().uuid()
  │ IDOR check: EA/SA quyền tạo khối (lấy từ personnel.khoi)
  ▼
employeeService.createEmployeeWithSalary()
  │ Split: p_emp_data = personnel, p_salary_data = salary
  │ Validate ownership of temp_uuid docs
  ▼
Supabase RPC: fn_create_employee_onboarding(p_emp_data, p_salary_data, p_temp_uuid)
  │ Transaction:
  │   1. INSERT employees (state_phong_cho=true) → get employee_id
  │   2. INSERT salaries (employee_id, pending_changes=p_salary_data, state_pending=true)
  │   3. UPDATE employee_documents SET employee_id WHERE temp_uuid = p_temp_uuid
  │ COMMIT or ROLLBACK
  ▼
Response: { data: employee_row }
```

**Giữ Route cũ**: `POST /api/employees` vẫn giữ nguyên guard chặn salary + bổ sung reject `pending_changes` nếu client gửi (SEC-REV-03 hardening).

## 9. Test Strategy

- **Automated tests:**
    - Schema sync test: verify 30 fields (shared package)
    - SQL unit test: Gọi `submit_employee_pending` với `bac_luong = 'L4B1'` → verify không crash
    - SQL unit test: Gọi `fn_create_employee_onboarding` → verify data nằm đúng 2 bảng
    - Integration test: `POST /api/employees/onboard` → verify employee + salary rows
    - Security test: Login VI → GET list → verify response không có `has_pending_salary`
- **Manual verification:**
    - Upload ảnh "Quyết định cuối cùng" mẫu → verify OCR fill đúng form → Submit → Check DB
    - Verify Pending Room tags hiển thị đúng theo role
- **Data / env chuẩn bị:**
    - Ảnh mẫu đã redact cho OCR test
    - Tài khoản test role VI và EA trên Dev
    - DB Dev đã chạy migration 017

### Test Matrix (Acceptance → Task)

| AC | Test | Loại | Phase | Task |
|----|------|------|-------|------|
| AC-1 | OCR trả JSON 36 fields | Manual | 2 | 2.3 |
| AC-2 | `ty_le_luong_tv` = LCD_TV / LCD_CT * 100 | Auto + Manual | 3 | 3.1 |
| AC-3 | Salary key không lọt `employees.pending_changes` | Auto | 2 | 2.Final |
| AC-4 | Log không chứa raw OCR content | Manual | 2 | 2.3 |
| AC-5 | VI list API không thấy `has_pending_salary` | Auto | 2 | 2.Final |
| AC-5b | `EmployeeListItem.has_pending_salary` optional trong shared type | Auto | 1 | 1.2 |
| AC-5c | `has_pending_info` trả đúng khi employee có pending_changes | Auto | 2 | 2.Final |
| AC-6 | Submit apply 5 field mới vào live | Auto | 1 | 1.Final |
| AC-7 | Snapshot chứa 5 field mới | Auto | 1 | 1.Final |

## 10. Rollback Plan

1. **Preserve data**: Trước khi rollback, chạy script backup:
   ```sql
   CREATE TABLE IF NOT EXISTS backup_salaries_ea_psi AS
   SELECT employee_id, bac_luong, ty_le_luong_tv, nhuan_but_cc, okr_cc, thuong_doanh_so_cc
   FROM salaries WHERE bac_luong IS NOT NULL OR ty_le_luong_tv IS NOT NULL
      OR nhuan_but_cc IS NOT NULL OR okr_cc IS NOT NULL OR thuong_doanh_so_cc IS NOT NULL;
   ```
2. **DROP objects**: Xoá RPC `fn_create_employee_onboarding`, recreate `submit_employee_pending` và `create_monthly_snapshot` từ trạng thái 015/001, recreate view `employee_full`. DROP 5 cột mới trong `salaries` và `snapshot_employees`.
3. **Code revert**: Git revert toàn bộ files đã sửa:
    - Backend: `employees.ts` (route onboard), `employeeService.ts`, `ocrService.ts`
    - Shared: `schemas/employee.ts` (xóa onboard schema), `schemas/index.ts` (xóa export), `types/api.ts` (revert optional), `salary-fields.ts`, `salary.ts`, `schema-sync.test.ts`
    - Frontend: `useEmployees.ts` (xóa hook onboard), `EmployeeCreatePage.tsx` (xóa phân nhánh), `EmployeeForm.tsx` (xóa section lương), `PendingRoomPage.tsx` (xóa role guard)
4. **Verify**: Chạy lại schema sync test (25 fields), confirm Pending Room không bị lỗi.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
