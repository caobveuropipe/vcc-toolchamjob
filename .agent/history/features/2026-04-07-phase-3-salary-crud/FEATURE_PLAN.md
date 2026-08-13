# Feature Plan: Phase 3 — NS-002 Quản lý Tiền Lương (Salary CRUD)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: 🟢 Handoff sang `feature-coordinator`. Review lần 10 (Final Docs). Chốt hạ Atomic Audit + Unified Doc Binding + ma_nhan_su FE integration.
> **Feature slug**: `phase-3-salary-crud`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hệ thống hiện tại (Phase 2) đã có full Employee CRUD, phòng chờ, search/filter, và permission engine. Tuy nhiên, dữ liệu lương (25 cột, chia 2 bộ Giấy tờ + Cơ chế) chưa có API hay UI quản lý. Zod schema `salary.ts` và constant `SALARY_FIELDS` đã sẵn sàng trong `@vcc/shared`. Employee routes đang **chặn cứng** mọi salary field qua 403 — đúng contract. Bảng `salaries` đã tồn tại trong DB schema v2.5.0.
- **Vấn đề cần giải quyết:** Chưa có cách xem, sửa, hoặc quản lý tiền lương nhân sự. Đây là phân hệ P0 trong MVP scope.
- **Mục tiêu:** Cung cấp API + UI cho EA/SA xem và sửa tiền lương, VA xem lương, VI bị chặn hoàn toàn. Change History ghi đầy đủ old/new cho salary fields, filter ẩn salary khỏi VI.
- **Kết quả mong đợi:** EA/SA có thể xem + sửa 25 cột lương qua form + inline edit trên table. Change History ghi đúng. Export lương ra Excel. VI không thấy bất kỳ cột lương nào ở bất kỳ UI/API nào.

## 2. Phạm vi

### In scope
- **BE — Salary API routes** (`backend/src/routes/salary.ts`): GET (list + detail), PUT (save to pending) cho 25 salary fields
- **BE — Salary Service** (`backend/src/services/salaryService.ts`): Business logic CRUD, query bảng `salaries`, enforce `trang_thai !== nghi_viec` (trừ SA)
- **BE — Auto-create salary row**: Logic vào `createEmployee()` để INSERT salary row mặc định khi tạo NS mới + script backfill cho NS hiện có (**FR-02 prerequisite**)
- **BE — Salary Adjustment Workflow (WF-EMP-03 — FR-02)**: Tích hợp upload giấy tờ minh chứng (Cloudflare R2). **Contract**: Cập nhật `documentService.ts` để cho phép Reviewer upload tài liệu cho NS họ nghiệm thu (cần gửi kèm `ma_nhan_su` khi presign/save metadata).
- **BE — Reviewer Permissions (FR-05 — User confirmed)**: Reviewer (bảng `employee_reviewers`) được cấp quyền EA (xem/sửa lương đưa vào pending) cho đúng nhân sự họ nghiệp thu.
- **BE — Atomic Submit (FR-01)**: **CHỐT** sử dụng PostgreSQL function (`.rpc()`) để thực hiện submit nguyên tử (atomic) toàn bộ: apply `pending_changes` → Live data + Ghi `change_history` + Ghi `audit_log` TRONG CÙNG 1 TRANSACTION. **SQL Function là "Owner" duy nhất của các bản ghi lịch sử/audit này.**
- **BE — Change History API route (FR-03)**: Tạo `GET /api/change-history/:ma_nhan_su` endpoint mới. Filter ẩn records có `field_changed ∈ SALARY_FIELDS` khi user là VI.
- **FE — Trang Quản lý Lương** (`frontend/src/pages/Salaries/`): Table view salary per khối, search/filter, inline edit
- **FE — Form điều chỉnh lương (WF-EMP-03)**: Modal/Drawer tích hợp 25 fields lương + Document Upload (giấy tờ minh chứng).
- **FE — Route & Menu Guard Update (FR-05)**: Cập nhật `ProtectedRoute.tsx` và `MainLayout.tsx` để cho phép Reviewer truy cập `/salaries` (khi họ có NS được gán).
- **FE — Pending Room UI cho Salary**: Hiển thị indicator "Lương" + Preview thay đổi (old → new) lương trước khi submit.
- **FE — Export salary ra Excel**: Reuse watermark pattern từ Phase 1
- **Audit Log**: Ghi action `update` module `NS-002` cho mọi thao tác sửa lương. Ghi log upload chứng từ điều chỉnh lương.

### Out of scope
- **Snapshot integration** (Phase 6)
- **Data migration / import salary từ Sheets** (Phase 4)
- **Notification khi salary thay đổi**
- **Luồng Điều chuyển/Bổ nhiệm phức tạp** (Phase sau)

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-04-01] Salary Data Isolation`: Salary fields bị chặn cứng trong luồng Hồ sơ (Phase 2), chỉ thay đổi qua phân hệ Lương (Phase 3) → Route salary phải hoàn toàn tách biệt khỏi employee route
  - `[2026-03-14] Salary Isolation`: View `employee_info_only` ẩn salary cho VI → salary route phải có middleware check cứng chặn VI
  - `[2026-03-31] Service-Layer Data Splitting`: Flatten/Split tại Service layer → salaryService query trực tiếp bảng `salaries`, JOIN `employees` khi cần context (khối, trạng thái)
  - `[2026-03-13] Zod Schema = Single Source of Truth`: Dùng `salarySchema` / `updateSalarySchema` từ `@vcc/shared`
  - `[2026-03-19] Permission Cache Strategy`: Redis key `perm:{email}` → reuse middleware hiện tại
  - `[2026-03-14] Hard Limits`: Export salary 5 lần/phút, max 5000 rows
  - `[2026-03-14] Traceability`: Watermark trên Excel export
- **"Cấm kỵ" cần tránh:**
  - KHÔNG dùng `supabase.from()` ở FE
  - KHÔNG cho VI xem bất kỳ salary data nào
  - KHÔNG skip permission check khi Redis down
  - KHÔNG dùng Tailwind
- **Ràng buộc kiến trúc liên quan:**
  - Bảng `salaries` liên kết 1:1 với `employees` qua `employee_id` (FK)
  - `employee_info_only` view đã tách salary → salary route không dùng view này
  - `SALARY_FIELDS` constant (25 items) là source of truth cho field names
  - Change History filter cho VI dùng `isSalaryField()` từ `@vcc/shared`

## 4. Giả định và câu hỏi mở

### Giả định
1. **Pending Room cho Salary (User confirmed)**: Mọi thay đổi lương PHẢI qua phòng chờ. Flow: EA sửa lương → `pending_changes.salary` JSONB lưu salary payload → `state_phong_cho = true` → Submit **cùng lúc** (employee info + salary) → apply tất cả → `state_phong_cho = false` → ghi Change History + Audit Log.
2. **⚠️ First-time implementation (FR-01)**: `pending_changes` JSONB column tồn tại trên DB nhưng **chưa từng được sử dụng trong backend code**. `submitFromPending()` hiện chỉ toggle `state_phong_cho = false`, KHÔNG đọc/apply `pending_changes`. Phase 3 sẽ implement pending flow đầy đủ lần đầu tiên.
3. **⚠️ Salary row prerequisite (FR-02)**: `createEmployee()` hiện KHÔNG auto-create salary row. Cần: (a) backfill salary rows cho employees hiện có, (b) thêm logic INSERT salary khi tạo NS mới.
4. **Submit cùng lúc (FR-05 — User confirmed)**: Khi submit từ phòng chờ, hệ thống apply TẤT CẢ pending changes (employee info + salary) trong cùng 1 transaction. **CHỐT** sử dụng PostgreSQL function (`.rpc()`) để bảo đảm Atomicity (FR-01). Function phải thực hiện cả: (a) APPLY data, (b) INSERT `change_history`, (c) INSERT `audit_log` trong 1 BEGIN/COMMIT. **Backend Service KHÔNG insert các bản ghi này để tránh trùng lặp hoặc mất tính atomic.**
5. **Pending changes structure**: `pending_changes` JSONB sẽ chứa key `salary` với payload salary fields bị thay đổi. VD: `{ "salary": { "luong_target_cc": 20000000, ... } }`. Khi submit, hệ thống đọc toàn bộ `pending_changes` → apply employee info + salary → clear `pending_changes = '{}'` → set `state_phong_cho = false`.
6. **⚠️ Reviewer Document Upload (FR-NNT)**: Quy trình upload chứng từ của Reviewer: Reviewer chọn NS → Request Presign với `ma_nhan_su` + `khoi` → `documentService.ts` kiểm tra nếu user là reviewer của `ma_nhan_su` thì cho phép upload (kể cả không có EA khối đó).
7. **Document binding contract**: EA/Reviewer upload file (PDF/Ảnh) → nhận `temp_uuid`. EA/Reviewer PUT salary update → gửi kèm `temp_uuid`. Service gọi `bindDocToEmployee` để gắn `temp_uuid` đó vào `employee_id`.
8. **Reviewer access contract (FR-05)**: Reviewer CÓ QUYỀN EA (xem/sửa lương đưa vào pending) cho đúng nhân sự họ gán. Phân quyền này phải được thể hiện ở cả Middleware backend và Route Guard frontend.
9. **Deadline ngày 27**: Việc điều chỉnh lương nên thực hiện trước ngày 27 hàng tháng, nhưng hệ thống không chặn kỹ thuật (chỉ note/log).
## 5. Acceptance Criteria

- [ ] AC-01: API `GET /api/salaries?khoi=X&page=1&limit=50` trả danh sách salary kèm employee info, phân trang đúng
- [ ] AC-02: API `GET /api/salaries/:ma_nhan_su` trả chi tiết salary 25 fields (route param = `ma_nhan_su` nhất quán với convention — FR-10)
- [ ] AC-03: API `PUT /api/salaries/:ma_nhan_su` lưu salary changes vào `pending_changes.salary` + set `state_phong_cho = true` (pending room flow)
- [ ] AC-04: EA trên khối → xem + sửa salary OK. VA → xem OK, sửa bị 403. VI → mọi salary endpoint trả 403
- [ ] AC-05: NS có `trang_thai = nghi_viec` → block sửa salary (trừ SA)
- [ ] AC-06: Submit phòng chờ (cùng lúc) → apply employee info pending + salary pending vào bảng tương ứng → Change History ghi đúng → clear `pending_changes = '{}'` → `state_phong_cho = false`
- [ ] AC-07: API `GET /api/change-history/:ma_nhan_su` trả lịch sử thay đổi, filter ẩn `SALARY_FIELDS` khi user là VI (FR-03)
- [ ] AC-08: FE Salary table hiển thị đúng columns, search/filter/sort, inline edit (vào pending)
- [ ] AC-09: FE Export salary ra Excel có watermark (user, date, khối)
- [ ] AC-10: Audit Log ghi action `update` module `NS-002` đầy đủ
- [ ] AC-11: Rate limit: PUT salary 10 req/min/user, export 5 req/min/user
- [ ] AC-12: Pending Room hiển thị NS đang có pending salary changes, kèm indicator "Lương" phân biệt với pending info
- [ ] AC-13: Auto-create salary row khi tạo NS mới; backfill salary rows cho NS hiện tại (FR-02)
- [ ] AC-14: **Reviewer Access (FR-05)**: User gán là Reviewer của NS X → xem được `/salaries`, sửa được lương NS X (vào pending), không can thiệp được NS khác cùng khối nếu không có quyền EA.
- [ ] AC-15: **Document Lifecycle**: Chứng từ điều chỉnh lương (upload qua `temp_uuid`) được bind chính xác vào NS. Sau khi Submit, chứng từ hiển thị trong danh sách Hồ sơ của NS.
## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/routes/salary.ts` | **Tạo mới** | Route chính cho salary CRUD (GET list, GET detail, PUT to pending) | 🔴 | Chưa — viết mới |
| `backend/src/routes/changeHistory.ts` | **Tạo mới** | Change History API route (FR-03) | 🟡 | Chưa — viết mới |
| `backend/src/routes/documents.ts` | **Cập nhật** | Cho phép Reviewer upload chứng từ (Zod schema update) | 🟡 | `ma_nhan_su` validation |
| `backend/src/services/salaryService.ts` | **Tạo mới** | Business logic salary: read, save to pending | 🔴 | Chưa — viết mới |
| `backend/src/services/documentService.ts` | **Cập nhật** | Kiểm tra quyền Reviewer khi upload file | 🟡 | Reviewer check logic |
| `backend/src/routes/employees.ts`| **Cập nhật** | Xóa redundant audit log call trong `/submit` (FR-Audit) | Thấp | Tránh double log |
| `backend/src/services/employeeService.ts` | **Sửa** | (1) Auto-create salary row khi `createEmployee()` (FR-02). (2) Mở rộng `submitFromPending()` để apply employee info + salary pending cùng lúc (FR-04/05) | 🔴 | Có contract |
| `backend/src/services/changeHistoryService.ts` | **Sửa** | Thêm `diffSalaryFields()` để diff 25 salary fields | 🟡 | Có contract ngầm |
| `backend/src/index.ts` | **Sửa** | Mount salary routes + change-history routes | 🟢 | — |
| `frontend/src/components/DocumentUpload.tsx` | **Cập nhật** | Parameterize `document_type` (không hardcode 'tuyen_moi') | Thấp | Reusability |
| `Salaries/` (FE) | Tạo mới | UI quản lý lương, search, filter, edit | Trung bình | Editable Table, Modal Form |
| `PendingRoom/` (FE) | Cập nhật | Hiển thị indicator/preview salary changes | Thấp | Metadata preview |
| `packages/shared/src/schemas/salary.ts` | **Giữ nguyên** | Đã có schema, reuse | 🟢 | Có |
| `packages/shared/src/constants/salary-fields.ts` | **Giữ nguyên** | `SALARY_FIELDS`, `isSalaryField()` | 🟢 | Có CI test |
| `frontend/src/pages/Salaries/SalaryListPage.tsx` | **Tạo mới** | Trang danh sách salary | 🟡 | — |
| `frontend/src/pages/Salaries/SalaryEditModal.tsx` | **Tạo mới** | Modal/Form sửa salary | 🟡 | — |
| `frontend/src/hooks/useSalaryQueries.ts` | **Tạo mới** | TanStack Query hooks cho salary API | 🟢 | — |
| `frontend/src/services/salaryService.ts` | **Tạo mới** | API client calls cho salary | 🟢 | — |
| `frontend/src/App.tsx` | **Sửa** | Thêm route `/salaries` | 🟢 | — |
| `frontend/src/components/ProtectedRoute.tsx` | **Sửa** | Thêm logic Reviewer EA cho salary route | 🟡 | Access guard |
| `frontend/src/components/MainLayout.tsx` | **Sửa** | Thêm menu item "Quản lý lương" (ẩn cho VI) | 🟢 | — |

## 7. Risk Triage và Review Focus

- **Review required:** 🔴 **BẮT BUỘC** — salary data là highly sensitive
- **Risk hotspots:**
  1. **Permission check trong salary route**: Phải chặn cứng VI ở mọi endpoint, VA chỉ GET, EA/SA mới PUT. Nếu sai → data leak lương
  2. **Change History filter cho VI**: Nếu quên filter salary records trong change_history API → VI thấy old/new salary values
  3. **IDOR protection**: Salary route phải check employee thuộc khối user có quyền, không tin `employee_id` từ request
  4. **Block sửa lương NS nghỉ việc**: `trang_thai = nghi_viec` → 403 (trừ SA)
  5. **Database query**: Salary JOIN employees cần đảm bảo không leak data cross-khối
- **Review focus areas:**
  - Middleware pipeline cho salary routes: auth → permission → VI check cứng → IDOR check (bao gồm Reviewer check) → business logic
  - Change History diff logic cho 25 salary fields: đảm bảo ghi đúng old/new
  - FE: Đảm bảo menu Salary và route `/salaries` bị ẩn hoàn toàn cho VI (route guard + menu hide)
  - Workflow điều chỉnh lương: Phải upload chứng từ thành công trước khi PUT salary to pending
  - Export: Watermark enforcement, rate limit
- **Known pitfalls / historical issues:**
  - `[2026-04-01]` Phase 2 từng có bug salary fields lọt vào employee create/update payload → đã fix bằng 403 check cứng. Salary route mới phải dùng `updateSalarySchema` riêng, KHÔNG dùng `updateEmployeeSchema`
  - `changeHistoryService.diffEmployeeFields()` hiện chỉ diff 23 employee fields → cần hàm mới `diffSalaryFields()` hoặc mở rộng
  - **[FR-01]** `pending_changes` JSONB column tồn tại nhưng backend code chưa từng đọc/ghi. `submitFromPending()` chỉ toggle flag. Đây là first-time implementation.
  - **[FR-09]** `pending_changes` JSONB có thể chứa salary data → bất kỳ endpoint nào trả `pending_changes` cho VI đều là security breach. Hiện tại an toàn vì `employee_info_only` view không chứa cột này.
- **Dependencies / rollout concerns:**
  - **[FR-02]** Cần tạo salary row cho employees hiện có (backfill migration) + auto-create khi tạo NS mới
  - Salary route query bảng `employees` + `salaries` trực tiếp (KHÔNG dùng view `employee_info_only`). Middleware VI check cứng là tầng bảo vệ duy nhất. (FR-08)
  - FE route `/salaries` cần route guard tương tự `/employees`
  - Pending Room FE cần mở rộng để hiển thị NS có pending salary (hiện chỉ hiển thị pending employee info)

## 8. Chiến lược triển khai

- **Phase strategy:** Chia thành **3 sub-phases**:
  - **Phase A — Backend Salary API**: Routes, Service, Permission checks, Change History, Audit Log
  - **Phase B — Frontend Salary UI**: Table list, Form edit, Inline edit, Route/Menu integration
  - **Phase C — Export & Polish**: Excel export, integration test, security test, edge cases
- **Thứ tự triển khai:**
  1. Backend API trước (FE cần API để phát triển)
  2. FE UI sau khi API ổn
  3. Export + Test cuối cùng
- **Điểm cần phối hợp:**
  - `@vcc/shared` không cần thay đổi (schema + constants đã có)
  - Backend: Salary route mới, mount vào `index.ts`
  - Frontend: Route, menu, page, hooks, service client
- **Yêu cầu migration / config / deploy:** 
  - **SQL Migration**: Tạo `013_backfill_salary_rows.sql` để backfill cho NS hiện có (**FR-06**).
  - **SQL Function**: Tạo DB function `submit_employee_pending` để xử lý atomic submit (**FR-01**).
  - Cần verify salary rows tồn tại cho existing employees.
  - FE route `/salaries` cần route guard tương tự `/employees` và phải cho phép Reviewer truy cập (FR-05).
## 9. Test Strategy

- **Automated tests:**
  - **Unit test**: `salaryService` business logic (block nghỉ việc, IDOR check)
  - **Unit test**: `diffSalaryFields()` diff đúng 25 fields, ghi change_history
  - **Integration test**: Salary API với các role EA/VI/VA/SA → đúng permission
  - **Integration test**: Change History API route — filter salary cho VI
  - **Integration test**: Rate limit + export limit
  - **Integration test**: Submit cùng lúc employee info + salary pending → verify cả 2 bảng cập nhật, change history ghi cho cả 2
- **Manual verification:**
  - EA sửa lương → verify pending → submit → verify Change History hiển thị old/new
  - VI truy cập `/salaries` → verify 403 / redirect
  - VA xem salary → verify hiển thị đúng, nút sửa bị ẩn
  - SA sửa lương NS nghỉ việc → verify cho phép
  - Export salary Excel → verify watermark
  - NS mới tạo → verify salary row auto-created (FR-02)
  - NS vừa có pending employee info + pending salary → submit → verify cả 2 applied cùng lúc (FR-05)
- **Data / env chuẩn bị trước khi test:**
  - Seed accounts EA, VI, VA, SA (đã có từ Phase 1)
  - Seed employees có salary data (backfill migration)
  - Seed employees có `trang_thai = nghi_viec` để test block rule

## 10. Rollback Plan

- Backend: Không mount salary routes trong `index.ts` → salary API không expose
- Frontend: Không thêm route `/salaries` vào `App.tsx` → UI không accessible
- **DB Migration (FR-06)**: Chạy script DELETE salary rows đã được backfill nếu cần (nhưng bảng `salaries` là an toàn, có thể giữ nguyên nếu row đó rỗng). Phải ROLLBACK SQL Function vừa tạo.
- Change History records salary mới sẽ vẫn tồn tại nhưng vô hại

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## Review Notes

- **Review lần 1 (2026-04-06)**: ⚠️ CẦN SỬA — 3 blocker (FR-01, FR-02, FR-04) + 2 khuyến nghị (FR-03, FR-05). User confirmed FR-05: submit cùng lúc.
- **Đã sửa**: FR-01 (ghi nhận first-time impl), FR-02 (prerequisite + auto-create), FR-03 (thêm change history API), FR-04 (chốt unified submit qua employee submit route), FR-05 (submit cùng lúc, atomic transaction), FR-08 (ghi rõ dùng bảng trực tiếp), FR-09 (ghi nhận risk), FR-10 (đổi route param thành `:ma_nhan_su`).
- **Re-review lần 2 (2026-04-06)**: ✅ ĐỒNG Ý — Tất cả 8 findings đã được giải quyết. Không còn blocker. Gate cleared cho `feature-coordinator`.
- **Review lần 3 (2026-04-06)**: ✅ ĐỒNG Ý — Cập nhật scope bao gồm workflow "Điều chỉnh lương" (FR-02) và xác nhận quyền Reviewer (FR-05) theo yêu cầu User.
- **Review lần 4 (2026-04-06)**: ✅ ĐỒNG Ý — Chốt cơ chế Transaction qua SQL Function (FR-01), bổ sung task FE cho Reviewer access (FR-05), đồng nhất tài liệu Migration/Rollback (FR-06).
- **Review lần 5 (2026-04-06)**: ✅ ĐỒNG Ý — Chốt Atomicity cấp SQL (Apply+History+Audit), bổ sung AC và Test scenarios cho Reviewer và Document binding lifecycle.
- **Review lần 6 (2026-04-06)**: ✅ ĐỒNG Ý — Cập nhật quyền Document Upload cho Reviewer, chốt SQL Function là "Owner" duy nhất của Lịch sử thay đổi/Audit.
- **Review lần 7 (2026-04-06)**: ✅ ĐỒNG Ý — Chốt hạ toàn bộ danh sách file ảnh hưởng (Documents module), đồng nhất Task Route Schema cho Reviewer upload.
- **Review lần 8 (2026-04-06)**: ✅ ĐỒNG Ý — Loại bỏ double audit log, tham số hóa DocumentUpload props để hỗ trợ luồng điều chỉnh lương.
- **Review lần 9 (2026-04-06)**: ✅ ĐỒNG Ý — Đồng nhất contract `temp_uuid` cho luồng gắn chứng từ, bổ sung `ma_nhan_su` vào props `DocumentUpload` để khép kín luồng Reviewer.
- **Review lần 10 (2026-04-06)**: ✅ ĐỒNG Ý — Chuẩn hóa file path `backend/src/routes/documents.ts` và đồng bộ Master Plan.
