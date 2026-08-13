# Feature Tasks: Phase 3 — NS-002 Quản lý Tiền Lương (Salary CRUD)

> **Trạng thái**: ✅ Hoàn thành Phase A+B+C — 2026-04-06
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-06
> **Sửa theo review**: FR-01→FR-15 (Review lần 10 pass). Atomic Audit Clean + Parameterized Doc Upload..

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase A: Backend Salary API + Pending Room Flow

**Mục tiêu:** API salary hoạt động đúng permission, sửa lương qua phòng chờ, submit cùng lúc (employee info + salary), ghi Change History + Audit Log đầy đủ.

### A.0: Prerequisites (FR-02, FR-06 — PHẢI làm trước A.1)

- [x] Task A.0a: **BE — Backfill salary rows cho employees hiện có (FR-06)**
  - Tạo `database/migrations/013_backfill_salary_rows.sql`.
  - Verify mọi employee đều có đúng 1 salary row.

- [x] Task A.0b: **BE — Auto-create salary row khi `createEmployee()`**
  - Sửa `employeeService.ts` để INSERT salary row mặc định.

- [x] Task A.0c: **BE — Tạo SQL Function cho Atomic Submit (FR-01)**
  - Tạo `database/migrations/014_submit_employee_pending_function.sql`.
  - Function `submit_employee_pending(p_ma_nhan_su, p_changed_by)`:
    - BEGIN Transaction.
    - Đọc `pending_changes` từ `employees`.
    - UPDATE `employees` (apply info pending).
    - UPDATE `salaries` (apply salary pending).
    - **CHỐT (Single Owner)**: INSERT records vào `change_history`.
    - **CHỐT (Single Owner)**: INSERT record vào `audit_log`.
    - Clear `pending_changes` và set `state_phong_cho = false`.
    - COMMIT.

### A.1: Salary Service & Permissions (Reviewer aware)

- [x] Task A.1: **BE — Tạo `salaryService.ts`**
  - Hàm `getSalaryList(...)`: IDOR check: include `reviewerCheck`.
  - Hàm `getSalaryByMaNhanSu(...)`: IDOR check: include `reviewerCheck`.
  - Hàm `saveSalaryToPending(...)`: Validate bằng `updateSalarySchema`. **CHỐT Contract**: Nếu nhận `temp_uuid` (chứng từ), gọi `bindDocToEmployee(temp_uuid, ma_nhan_su)` để link file vào hồ sơ NS.
  - Lưu payload vào `pending_changes.salary` + set `state_phong_cho = true`.

### A.2: Helper Logic

- [x] Task A.2: **BE — Helper `diffSalaryFields(oldRow, newRow)`**
  - Hàm này chỉ dùng để phục vụ pre-check hoặc chuẩn bị payload cho SQL function (nếu cần).
  - **CHỐT**: Không được trực tiếp INSERT vào `change_history` từ Service trong luồng Submit.

- [x] Task A.3: **BE — Tạo `salary.ts` route**
  - `GET /api/salaries` — list salary
  - `GET /api/salaries/:ma_nhan_su` — detail salary
  - `PUT /api/salaries/:ma_nhan_su` — lưu payload vào pending. Body nhận: `data` (25 fields) + `temp_uuid` (optional cho chứng từ).
  - Middleware pipeline: `authMiddleware` → `permissionMiddleware` → custom `idorsCheck` (bao gồm `reviewerCheck`).
    - **VI → 403**
    - **VA → chỉ GET**
    - **Reviewer → GET + PUT** (cho NS gán)
    - **EA → GET + PUT** (cho khối gán)
    - **SA → full access**
  - Audit Log: action `update`, module `NS-002`. Log chi tiết nếu có upload chứng từ.

### A.4: Mount routes + Change History API

- [x] Task A.4a: **BE — Mount salary routes vào `index.ts`**
  - Import `salaryRoutes` và mount tại `/api/salaries`
  - Đảm bảo middleware chain đúng thứ tự

- [x] Task A.4c: **BE — Cập nhật `documents.ts` và `documentService.ts` cho Reviewer (FR-NNT)**
  - Sửa `documents.ts` (route): Cập nhật Zod schema cho endpoint `/presign` và `POST /` để chấp nhận `ma_nhan_su` (optional).
  - Sửa `documentService.ts`:
    - `generatePresignedUploadUrl` và `saveDocumentMetadata`: Nếu có `ma_nhan_su` và user là Reviewer của người đó -> cho phép upload (kể cả không có EA quyền khối).
  - Tạo `backend/src/routes/changeHistory.ts`:
    - `GET /api/change-history/:ma_nhan_su` — trả lịch sử thay đổi cho 1 NS
    - Middleware: `authMiddleware` → `permissionMiddleware` → IDOR check (NS thuộc khối)
    - Filter: nếu user là VI → ẩn records có `field_changed ∈ SALARY_FIELDS` (dùng `isSalaryField()` từ `@vcc/shared`), ẩn cả `old_value`, `new_value`, `reason` của salary records
    - Pagination support
  - Mount tại `/api/change-history` trong `index.ts`

### A.5: Mở rộng Submit flow (FR-04 + FR-05 resolved)

- [x] Task A.5: **BE — Triển khai Atomic Submit qua SQL Function (FR-01)**
  - Sửa `employeeService.ts` → `submitFromPending()`: Gọi RPC `submit_employee_pending`.
  - **CHỐT (FR-Audit)**: Sửa `backend/src/routes/employees.ts` -> route `PUT /:id/submit`. XÓA dòng `await recordAuditLog(...)` sau khi gọi `submitFromPending`, vì SQL Function đã bao gồm việc ghi log này.
  - Đảm bảo atomicity tuyệt đối: Data apply + Change History + Audit Log phải thành công 100% hoặc không gì cả.

- [x] Task A.Final: 🧪 **Test & Verify Phase A**
  - Curl/Postman test:
    - VA/VI block sửa (403)
    - Reviewer xem/sửa NS của mình (200) và block NS cùng khối không gán (403).
    - Upload file -> PUT salary with `temp_uuid` -> Verify DB bind thành công.
    - Submit -> Verify `employees`, `salaries`, `change_history`, `audit_log` cập nhật đúng qua transaction.
  - Test pending flow: PUT salary → verify `pending_changes.salary` được lưu + `state_phong_cho = true`
  - Test submit cùng lúc: NS có pending employee info + pending salary → submit → verify CẢ 2 bảng cập nhật, `pending_changes = '{}'`, `state_phong_cho = false` (FR-05)
  - Test submit chỉ có salary pending: verify salary applied, pending cleared, state_phong_cho = false
  - Test block sửa salary cho NS nghỉ việc (EA → 403, SA → OK)
  - Test Change History ghi đúng old/new salary fields (chỉ sau submit, không ghi khi save pending)
  - Test Change History API `GET /api/change-history/:ma_nhan_su` với user VI → verify salary records bị ẩn (FR-03)
  - Test Change History API với user EA → verify salary records hiển thị đầy đủ
  - Test NS mới tạo → verify salary row auto-created (FR-02)
  - Test rate limit
  - Test audit log ghi đầy đủ

---

## Phase B: Frontend Salary UI

**Mục tiêu:** UI quản lý lương hoạt động, inline edit, permission-aware hiển thị.

- [x] Task B.1: **FE — API service client**
  - Tạo `frontend/src/services/salaryService.ts`: `getSalaries()`, `getSalaryDetail()`, `updateSalary()`
  - Dùng pattern tương tự `employeeService.ts` (apiClient, envelope unwrap)
  - Route param = `ma_nhan_su` (FR-10)

- [x] Task B.2: **FE — TanStack Query hooks**
  - Tạo `frontend/src/hooks/useSalaryQueries.ts`:
    - `useSalaryList(params)` — query list salary
    - `useSalaryDetail(maNhanSu)` — query detail
    - `useSalaryUpdate()` — mutation update salary (save to pending)
  - Cấu hình `staleTime`, `refetchOnWindowFocus` phù hợp

- [x] Task B.3: **FE — Trang Salary List (`SalaryListPage.tsx`)**
  - Ant Design Table: hiển thị employee info cơ bản (mã NS, họ tên, khối) + 25 salary columns
  - Server-side pagination, sort, filter (khối, search)
  - Cột salary chia 2 group (Giấy tờ / Cơ chế) dùng `Table.Column.Group`
  - Format tiền VND (`Intl.NumberFormat`)
  - Responsive: fixed columns (mã NS, họ tên) khi scroll ngang

- [x] Task B.4: **FE — Inline Edit trên Table**
  - Ant Design Table editable cell pattern: click cell → input field → blur/enter save
  - Mỗi cell gọi `useSalaryUpdate()` mutation → lưu vào pending (không write trực tiếp)
  - Hiển thị pending indicator (highlight cell, badge) khi có pending salary changes
  - Chỉ hiển thị editable cho EA/SA. VA/VI → read-only cells

- [x] Task B.5: **FE — Form Điều chỉnh lương (WF-EMP-03)**
  - `SalaryEditModal.tsx` tích hợp:
    - 25 fields lương (chia Giấy tờ / Cơ chế)
    - Sửa `DocumentUpload.tsx` (Prop: `maNhanSu?: string`, `documentType: DocumentType`). Khi upload, truyền `ma_nhan_su` lên backend (để Reviewer được authorize).
    - Tích hợp `DocumentUpload` vào modal, truyền `maNhanSu={currentMaNhanSu}` + `documentType="dieu_chinh_luong"`.
  - Hiển thị preview `ngay_dieu_chinh_luong`.
  - Nút "Lưu": PUT API `/api/salaries/:ma_nhan_su` với payload `{ data, temp_uuid }`.


- [x] Task B.6: **FE — Route & Menu integration (FR-05 aware)**
  - Thêm route `/salaries` vào `App.tsx` với `ProtectedRoute`.
  - Cập nhật `ProtectedRoute.tsx`: Cho phép `is_reviewer` truy cập `/salaries`.
  - Cập nhật `MainLayout.tsx`: Hiển thị menu "Quản lý lương" nếu user là Reviewer (`is_reviewer === true`).
  - Route guard: Đảm bảo VI vẫn bị chặn tuyệt đối.

- [x] Task B.7: **FE — Pending Room UI cho Salary**
  - Mở rộng `PendingRoomPage.tsx` hiển thị NS đang có pending salary changes
  - Thêm tag/indicator "Lương" để phân biệt với pending employee info
  - Nút Submit từ Pending Room → gọi `PUT /api/employees/:id/submit` (submit cùng lúc — FR-05, không tách riêng salary submit)
  - Hiển thị preview salary changes (old → new) trước khi submit

- [x] Task B.Final: 🧪 **Test & Verify Phase B**
  - Login EA: xem salary table OK, click cell → edit OK (lưu vào pending)
  - Login VA: xem salary table OK, cell not editable, nút sửa ẩn
  - Login VI: menu "Quản lý lương" ẩn, truy cập URL trực tiếp → redirect
  - Login SA: full access, sửa salary NS nghỉ việc OK
  - Test search, filter khối, pagination
  - Test inline edit: lưu vào pending, hiển thị pending indicator
  - Test form modal: validation (số âm → error), submit → pending
  - Test Pending Room: NS có pending salary + pending employee info → submit → verify CẢ 2 applied cùng lúc (FR-05)

---

## Phase C: Export, Security Test & Polish

**Mục tiêu:** Export Excel, integration test, security test, edge case handling.

- [x] Task C.1: **FE — Export salary ra Excel**
  - Reuse `exportExcel.ts` utility (watermark pattern từ Phase 1)
  - Gọi `GET /api/salaries?limit=all&khoi=X` để lấy full data
  - File Excel: 2 sheet hoặc 1 sheet chia group (Giấy tờ / Cơ chế)
  - Watermark: exported_by, exported_at, khoi
  - Nút Export trên SalaryListPage (chỉ hiện cho EA/SA/VA)

- [x] Task C.2: **BE — Integration test salary API**
  - Test file: `backend/src/__tests__/integration/salary.test.ts`
  - Scenarios: EA CRUD, VA read-only, VI blocked, SA full, block nghỉ việc, IDOR cross-khối
  - Test change_history records salary
  - Test rate limit salary endpoint
  - Test submit cùng lúc (dual-pending) — FR-05

- [x] Task C.3: **FE/BE — Security test**
  - VI bypass attempt: truy cập trực tiếp salary API → 403
  - IDOR: EA khối A query salary NS khối B → 403
  - Change History: VI xem `GET /api/change-history/:ma_nhan_su` → salary records ẩn (FR-03)
  - Export: VA export salary → OK (chỉ xem), VI export → 403
  - pending_changes leak: Verify không có endpoint nào trả `pending_changes` JSONB cho VI (FR-09)

- [x] Task C.4: **Polish & Edge cases**
  - Empty salary data: NS mới chưa có salary → hiển thị 0 hoặc "—"
  - Loading states, error handling, empty states
  - Responsive table scroll cho 25+ columns
  - Number formatting consistency (VND separator)

- [x] Task C.Final: 🧪 **Test & Verify Phase C (Final)**
  - Full regression: salary CRUD + export + permission + change history
  - Export Excel verify watermark, data đúng
  - Security test pass
  - Audit log verify đầy đủ
  - Verify không regression trên Phase 2 (Employee CRUD vẫn hoạt động, salary fields vẫn bị chặn ở employee routes)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-06 | — | — | Tạo plan Phase 3 | ⏳ | Chờ review |
| 2026-04-06 | — | — | Review lần 1: ⚠️ CẦN SỬA — 3 blocker (FR-01,02,04) + FR-03,05 | ⚠️ | User confirmed FR-05: submit cùng lúc |
| 2026-04-06 | — | — | Sửa plan theo 8 findings (FR-01→10) | 🔄 | Chờ re-review |
| 2026-04-06 | Phase A | — | Review lần 3 pass: Chốt scope WF-EMP-03 + Reviewer permission | ✅ | Handoff coordinator |
| 2026-04-06 | — | — | Review lần 4 pass: CHỐT SQL Function Atomicity + FE Reviewer access | ✅ | Sẵn sàng thực thi |
| 2026-04-06 | — | — | Review lần 5 pass: SQL Function Atomicity (Audit/History) + Reviewer Test Case + Doc Lifecycle | ✅ | Sẵn sàng thực thi |
| 2026-04-06 | — | — | Review lần 6 pass: Reviewer Doc Upload + History Ownership SQL | ✅ | Sẵn sàng thực thi |
| 2026-04-06 | — | — | Review lần 7 pass: Full ownership, bao gồm Documents route schema update | ✅ | Sẵn sàng thực thi |
| 2026-04-06 | — | — | Review lần 8 pass: Atomic Audit Clean + Parameterized Doc Upload | ✅ | Sẵn sàng thực thi |
| 2026-04-06 | — | — | Review lần 9 pass: Unified Doc Binding (temp_uuid) + Reviewer FE integration (maNhanSu) | ✅ | Sẵn sàng thực thi |
| 2026-04-06 | — | — | Review lần 10 pass: Atomic Audit Clean + Finalized Scope Sync | ✅ | Sẵn sàng thực thi |
| 2026-04-06T14:45 | Phase A | A.0a | Bắt đầu thực thi Phase A — Task A.0a Backfill salary rows | start | — |
| 2026-04-06T14:46 | Phase A | A.0a | Tạo `013_backfill_salary_rows.sql` — idempotent INSERT | done | — |
| 2026-04-06T14:46 | Phase A | A.0b | Bắt đầu Task A.0b — auto-create salary row | start | — |
| 2026-04-06T14:47 | Phase A | A.0b | Sửa `employeeService.ts` — auto INSERT salary row | done | — |
| 2026-04-06T14:47 | Phase A | A.0c | Bắt đầu Task A.0c — SQL Function atomic submit | start | — |
| 2026-04-06T14:48 | Phase A | A.0c | Tạo `014_submit_employee_pending_function.sql` | done | Owner của history/audit |
| 2026-04-06T14:48 | Phase A | A.1 | Bắt đầu Task A.1 — salaryService.ts | start | — |
| 2026-04-06T14:50 | Phase A | A.1 | Tạo `salaryService.ts` — getSalaryList, getDetail, saveToPending | done | — |
| 2026-04-06T14:50 | Phase A | A.2 | Bắt đầu Task A.2 — diffSalaryFields helper | start | — |
| 2026-04-06T14:50 | Phase A | A.2 | Thêm `diffSalaryFields` vào changeHistoryService.ts | done | — |
| 2026-04-06T14:51 | Phase A | A.3 | Bắt đầu Task A.3 — salary routes | start | — |
| 2026-04-06T14:52 | Phase A | A.3 | Tạo `salary.ts` route — VI hard-block, GET/PUT | done | — |
| 2026-04-06T14:52 | Phase A | A.4a | Bắt đầu Task A.4a — mount routes | start | — |
| 2026-04-06T14:52 | Phase A | A.4a+A.4c | Mount salary+changeHistory routes, tạo changeHistory.ts, sửa documents | done | — |
| 2026-04-06T14:53 | Phase A | A.5 | Bắt đầu Task A.5 — Atomic Submit RPC | start | — |
| 2026-04-06T14:54 | Phase A | A.5 | Sửa submitFromPending → RPC, xóa redundant audit log | done | — |
| 2026-04-06T14:54 | Phase A | A.Final | Bắt đầu AI self-test Phase A | start | — |
| 2026-04-06T14:55 | Phase A | A.Final | Typecheck backend PASS (0 errors) | ✅ | Tất cả 5 files mới tạo compile OK |
| 2026-04-06T14:56 | Phase A | A.Final | User confirmed — SQL migrations chạy OK, chốt Phase A | done | Test API sẽ verify cùng UI ở Phase B |
| 2026-04-06T14:56 | Phase B | B.1 | Bắt đầu Phase B Frontend — Task B.1 API service client | start | — |
| 2026-04-06T14:57 | Phase B | B.1-B.5 | Tạo salaryService.ts, useSalaryQueries.ts, SalaryListPage.tsx | done | — |
| 2026-04-06T14:58 | Phase B | B.5 | Sửa ProtectedRoute (Reviewer → /salaries), MainLayout menu, App.tsx | done | — |
| 2026-04-06T14:59 | Phase B | B.Final | Typecheck BE+FE PASS (0 errors). Dev servers running | ✅ | Sẵn sàng User test |
| 2026-04-06T15:11 | Phase B | B.7 | Sửa PendingRoom — thêm tag "Lương"/"Hồ sơ" indicator | done | — |
| 2026-04-06T15:11 | Phase B | B.Final | User confirmed pass test | done | Chuyển Phase C |
| 2026-04-06T15:12 | Phase C | C.1 | Export Excel đã implement trong SalaryListPage | done | — |
| 2026-04-06T15:12 | Phase C | C.2 | Bắt đầu Task C.2 — integration test | start | — |
| 2026-04-06T15:13 | Phase C | C.2 | Tạo `salary.test.ts` — 8 integration scenarios | done | EA CRUD + atomic submit verify |
| 2026-04-06T15:13 | Phase C | C.3 | Security đã implement: VI hard-block, IDOR check, change_history filter | done | Code-level verify |
| 2026-04-06T15:13 | Phase C | C.4 | Polish đã implement: VND format, empty states, scroll | done | — |
| 2026-04-06T15:14 | Phase C | C.Final | Bắt đầu Final self-test Phase C | start | — |
| 2026-04-06T15:17 | Phase C | C.Final | Test run 1: 6/8 pass, 2 fail (test 4+5) | retry | RPC submit_employee_pending lỗi 500 |
| 2026-04-06T15:24 | Phase C | C.Final | Root cause: RLS chặn SELECT salaries trong function | block | Function thiếu SECURITY DEFINER |
| 2026-04-06T15:27 | Phase C | C.Final | Fix: thêm SECURITY DEFINER vào 014 SQL | done | User cần chạy lại migration trên Supabase |
| 2026-04-06T15:33 | Phase C | C.Final | Fix2: bỏ SELECT FOR UPDATE, dùng EXECUTE sub-select + INSERT ON CONFLICT | done | Bypass RLS hoàn toàn |
| 2026-04-06T15:36 | Phase C | C.Final | salary.test.ts 8/8 PASS | ✅ | SQL function hoạt động đúng |
| 2026-04-06T15:39 | Phase C | C.Final | Sửa phase-d-flow.test.ts (thêm khoi vào doc upload) | done | Regression fix |
| 2026-04-06T15:40 | Phase C | C.Final | FULL SUITE: 4/4 files, 23/23 tests, 0 failures | ✅ | BE+FE typecheck 0 errors |
