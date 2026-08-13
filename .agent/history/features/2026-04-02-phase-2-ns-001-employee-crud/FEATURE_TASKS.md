# Feature Tasks: Phase 2 — NS-001 Employee CRUD

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-03-26
> **Cập nhật cuối**: 2026-04-01 (Tách Phase E sang `.agent/active/phase-2-taskE/`)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase A: BE Core — Routes + Service + Reviewer Auth + State Transition

**Mục tiêu:** API CRUD employees hoạt động, permission enforcement đúng (bao gồm reviewer-as-EA per-employee), state machine validation, change history + audit log tự động ghi cho mọi operation.

- [x] Task A.1: **Shared — Thêm/sửa schemas + types cho NS-001 API**
  - Tạo `submitEmployeeSchema` trong `packages/shared/src/schemas/employee.ts` — validate required fields khi submit phòng chờ (`ma_nhan_su`, `email`, `line_nhan_su` required; `bu`, `nguoi_quan_ly`, `ngay_vao_cong_ty` optional)
  - **Sửa `createEmployeeSchema`**: không dùng `= employeeSchema` nguyên bản. Override `trang_thai` chỉ cho phép `z.enum(['thu_viec', 'dang_lam'])` (theo BR-001-003). Loại bỏ `state_phong_cho` khỏi schema (BE auto set `true`). Các fields khác giữ nguyên.
  - Tạo `stateTransitionSchema` — validate `new_state` (enum trang_thai) + optional `ngay_nghi_sinh` / `ngay_nghi_viec` + optional `reason`
  - **Sửa `updateEmployeeSchema`**: strip `trang_thai` và `state_phong_cho` khỏi partial update (`.omit({ ma_nhan_su: true, trang_thai: true, state_phong_cho: true })`). Generic update KHÔNG được phép sửa 2 field này.
  - Tạo `PaginatedResponse<T>` type trong `packages/shared/src/types/` cho API pagination meta
  - Tạo `EmployeeListItem` type (gồm employee fields + `can_edit: boolean`)
  - Tạo `VALID_STATE_TRANSITIONS` map trong `packages/shared/src/constants/` — danh sách transitions hợp lệ theo STATE_MACHINES.md
  - Export từ barrel `index.ts`
  - Build shared: `pnpm run build:shared`

- [x] Task A.2: **BE — Tạo Employee Service (`backend/src/services/employeeService.ts`)**
  - `listEmployees(permissionMatrix, page, limit, sort, filters, search)` — query từ view phù hợp, auto filter theo danh sách khối user có quyền (`khoi` param optional). Nếu user là reviewer → UNION thêm NS được gán. Kèm `can_edit` flag (batch query `employee_reviewers` cho reviewer).
  - `getEmployeeById(id, permissionMatrix)` — get detail, kèm `can_edit` flag, verify IDOR
  - `createEmployee(data, actorEmail)` — validate Zod (cho phép bỏ trống `ma_nhan_su` + `email`, BE tự sinh `TMP...`/`@vcc.tmp` — theo G8/AC-3), check unique `ma_nhan_su`, insert `employees`, auto set `state_phong_cho=true`. `trang_thai` cho phép `thu_viec` (default) hoặc `dang_lam` (tuyển thẳng — BR-001-003). Chặn `ngay_dieu_chinh_luong` và `tam_ung_hang_thang` (Data Isolation). Ghi audit_log.
  - `updateEmployee(id, data, actorEmail, permissionMatrix)` — validate Zod (updateEmployeeSchema — KHÔNG chứa `trang_thai`/`state_phong_cho`), check `trang_thai ≠ nghi_viec` (trừ SA), diff old/new → ghi change_history + audit_log
  - `submitFromPending(id, actorEmail)` — validate required fields (submitEmployeeSchema), set `state_phong_cho=false`, **ghi change_history** (`state_phong_cho: true→false`) + ghi audit_log
  - `returnToPending(id, actorEmail)` — set `state_phong_cho=true`, **ghi change_history** (`state_phong_cho: false→true`) + ghi audit_log
  - `changeEmployeeState(id, newState, dateField?, reason?, actorEmail)` — validate transition hợp lệ theo `VALID_STATE_TRANSITIONS` map, update `trang_thai` + set date field nếu có, **ghi change_history** (kèm `reason` nếu có) + ghi audit_log. Return `STATE_ERROR` nếu transition không hợp lệ.
  - `deleteEmployee(id, actorEmail)` — SA only, **soft delete** (set `trang_thai=nghi_viec`, `ngay_nghi_viec=now()`) → ghi change_history + audit_log

- [x] Task A.3: **BE — Tạo Employee Routes (`backend/src/routes/employees.ts`)**
  - `GET /api/employees` — auth + permission middleware → list (auto filter by khối in permission matrix, `khoi` query param optional). Reviewer → UNION NS được gán.
  - `GET /api/employees/:id` — auth + permission middleware → detail (IDOR check)
  - `POST /api/employees` — auth + permission middleware + IDOR check (EA trên khối target hoặc SA) → create
  - `PUT /api/employees/:id` — auth + permission middleware + IDOR check (EA/SA/reviewer per-employee) → update. **Reject body chứa `trang_thai` hoặc `state_phong_cho`** → 400 VALIDATION_ERROR.
  - `PUT /api/employees/:id/submit` — auth + permission + IDOR check → submit phòng chờ
  - `PUT /api/employees/:id/pending` — auth + permission + IDOR check → đưa lại phòng chờ
  - `PUT /api/employees/:id/state` — auth + permission + IDOR check → chuyển trạng thái NS (state machine validated). Body: `{ new_state, ngay_nghi_sinh?, ngay_nghi_viec?, reason? }`
  - `DELETE /api/employees/:id` — auth + permission + requireSA → soft delete
  - Wire `sensitiveRateLimiter` cho POST/PUT/DELETE routes
  - Tạo `exportRateLimiter = createRateLimiter('export', 5, '1 m')` (5 req/min/user — theo master plan chốt)
  - Wire `exportRateLimiter` cho `GET /api/employees` khi detect `limit=all`
  - **Enforce max 5000 rows**: khi `limit=all`, BE clamp kết quả tối đa 5000 rows. Nếu tổng số vượt 5000 → trả 5000 rows + meta `{ truncated: true, total: N }` để FE thông báo user lọc bớt.
  - Ghi audit_log action `export` inline trong route handler GET khi detect export request — KHÔNG tạo endpoint riêng

- [x] Task A.4: **BE — Mount route + Permission guards**
  - Mount `/api/employees` trong `backend/src/index.ts`
  - Thêm/sửa guards trong `backend/src/middleware/guards.ts`:
    - `requireWriteAccess(employeeId)`: (1) check EA/SA trên `employee.khoi`, HOẶC (2) query `employee_reviewers WHERE reviewer_email = ? AND employee_id = ?` → allow as EA
    - `requireSA`: check SA only
  - IDOR protection helper `checkEmployeeAccess(c, employeeId)`: fetch employee row → verify user có quyền trên khối đó hoặc là reviewer cho NS đó → return employee row hoặc 403

- [x] Task A.5: **BE — Change History Service**
  - Tạo helper `recordChangeHistory(ma_nhan_su, changes: {field, old, new}[], changedBy, reason?)` — bulk insert vào `change_history`
  - Tạo helper `diffEmployeeFields(oldRow, newRow)` — compare 24 employee fields, return danh sách changed
  - Integrate vào: `updateEmployee`, `submitFromPending` (field `state_phong_cho`), `returnToPending` (field `state_phong_cho`), `changeEmployeeState` (field `trang_thai` + date fields), `deleteEmployee` (fields `trang_thai` + `ngay_nghi_viec`)

- [x] Task A.6: **BE — Unit tests cho API + Permission + State Machine**
  - Test CRUD operations với các role (EA/VI/VA/SA)
  - Test reviewer-as-EA: reviewer sửa NS được gán → OK, reviewer sửa NS không được gán → 403
  - Test IDOR: EA khối A sửa NS khối B → 403
  - Test duplicate `ma_nhan_su` → 409 CONFLICT
  - Test block edit khi `nghi_viec` (trừ SA)
  - Test submit phòng chờ: thiếu required fields → 400 VALIDATION_ERROR
  - Test state transition: `thu_viec → dang_lam` OK, `nghi_viec → thu_viec` → 400 STATE_ERROR
  - Test generic update reject `trang_thai`/`state_phong_cho` → 400 VALIDATION_ERROR
  - Test submit/pending/state transition ghi change_history (không chỉ audit_log)
  - Test soft delete ghi change_history cho cả `trang_thai` + `ngay_nghi_viec`
  - Test export `limit=all` clamp tối đa 5000 rows

- [x] Task A.Final: 🧪 Test & Verify Phase A
  - API CRUD employees hoạt động qua curl/Postman
  - Permission enforcement đúng (EA/VI/VA/SA + reviewer-as-EA)
  - State transition route validate đúng state machine
  - Generic update reject `trang_thai`/`state_phong_cho`
  - Change history ghi chính xác cho update, submit, pending, state transition, **soft delete**
  - Audit log ghi đúng module='NS-001'
  - Export `limit=all` clamp 5000 rows + audit log ghi

---

## Phase B: FE Danh sách — Table + Search + Filter + Pagination

**Mục tiêu:** FE hiển thị danh sách NS với server-side pagination, search, filter, sort hoạt động.

- [x] Task B.1: **FE — TanStack Query hooks (`frontend/src/hooks/useEmployees.ts`)**
  - `useEmployeeList(params)` — GET list với pagination, filters, search
  - `useEmployeeDetail(id)` — GET detail
  - `useCreateEmployee()` — mutation POST
  - `useUpdateEmployee()` — mutation PUT
  - `useSubmitEmployee()` — mutation PUT submit
  - `useReturnToPending()` — mutation PUT pending
  - `useChangeEmployeeState()` — mutation PUT state transition
  - `useDeleteEmployee()` — mutation DELETE (soft delete)
  - Invalidate cache đúng khi mutation thành công

- [x] Task B.2: **FE — EmployeeTable component (`frontend/src/components/EmployeeTable.tsx`)**
  - Ant Design Table với columns: STT, Mã NS, Họ tên, Email, Khối, BU, Trạng thái, Hành động
  - Server-side pagination (onChange → gọi API với page/limit mới)
  - Server-side sort (onChange sorter → gọi API với sort param)
  - Client-side column filter dropdowns cho khối, trạng thái → serialize thành query params
  - Hiển thị badge trạng thái (màu theo trang_thai)
  - Nút "Sửa" chỉ hiện khi `can_edit = true`
  - Responsive: fixed columns trên mobile (Mã NS, Họ tên, Hành động)

- [x] Task B.3: **FE — Trang Danh sách NS (`frontend/src/pages/Employees/EmployeeListPage.tsx`)**
  - Search bar (tìm theo tên hoặc email)
  - Filter controls (khối, trạng thái)
  - EmployeeTable component
  - Nút "Thêm NS mới" (chỉ hiện cho EA/SA)
  - Nút "Export Excel"
  - Breadcrumb + page title

- [x] Task B.4: **FE — Update App.tsx routes**
  - Replace placeholder `/employees` với `EmployeeListPage`
  - Thêm route `/employees/new` → Form tạo mới
  - Thêm route `/employees/:id` → Chi tiết NS
  - Thêm route `/employees/:id/edit` → Form sửa
  - Thêm route `/pending-room` → Trang phòng chờ

- [x] Task B.Final: 🧪 Test & Verify Phase B
  - Danh sách NS hiển thị đúng với pagination
  - Search tên/email hoạt động
  - Filter khối/trạng thái hoạt động
  - Sort theo cột hoạt động
  - Nút hành động hiển thị đúng theo quyền

---

## Phase C: FE Form + Phòng chờ — Create/Edit/Submit

**Mục tiêu:** Form thêm/sửa NS hoạt động, phòng chờ submit flow hoạt động end-to-end.

- [x] Task C.1: **FE — zodToAntRules utility (`frontend/src/utils/zodToAntRules.ts`)**
  - Map Zod schema → Ant Design Form rules (required, min/max length, regex, custom validators)
  - Support: z.string(), z.enum(), z.coerce.date(), z.boolean()
  - Đủ dùng cho 25 employee fields

- [x] Task C.2: **FE — EmployeeForm component (`frontend/src/components/EmployeeForm.tsx`)**
  - Ant Design Form.useForm() + Zod validation
  - Chia sections: Thông tin cá nhân → Công việc → Tổ chức → Quản lý → Ngày tháng
  - Mode create: `ma_nhan_su` + `email` optional (BE tự sinh `TMP...`/`@vcc.tmp` nếu bỏ trống — theo G8/AC-3). `trang_thai` hiển dạng radio/select giới hạn `thu_viec` (default) | `dang_lam` (tuyển thẳng). `state_phong_cho` **luôn hidden** (BE auto set `true`). Chặn `ngay_dieu_chinh_luong` + `tam_ung_hang_thang` (Data Isolation — AC-11).
  - Mode edit: `ma_nhan_su` disabled (IMMUTABLE), `trang_thai`/`state_phong_cho` KHÔNG hiện trong form (chuyển qua route riêng), pre-fill values
  - Email duplicate warning (check khi blur, hiển thị cảnh báo)
  - Submit → gọi mutation tương ứng (create or update)
  - Loading state, error handling, success notification

- [x] Task C.3: **FE — Trang thêm NS mới (`frontend/src/pages/Employees/EmployeeCreatePage.tsx`)**
  - Breadcrumb: Nhân sự > Thêm mới
  - EmployeeForm ở mode create
  - Sau tạo thành công → navigate về danh sách hoặc chi tiết

- [x] Task C.4: **FE — Trang sửa NS (`frontend/src/pages/Employees/EmployeeEditPage.tsx`)**
  - Breadcrumb: Nhân sự > [Tên NS] > Sửa
  - Load employee detail → EmployeeForm ở mode edit
  - Block edit nếu `trang_thai = nghi_viec` (trừ SA) — hiển thị thông báo
  - Sau sửa thành công → navigate về chi tiết

- [x] Task C.5: **FE — Trang Phòng chờ (`frontend/src/pages/PendingRoom/PendingRoomPage.tsx`)**
  - EmployeeTable filter cứng `state_phong_cho = true`
  - Nút "Submit" trên mỗi row (hiện khi `can_edit = true` — bao gồm EA/SA/Reviewer per-employee)
  - Submit → validate required fields → gọi API submit → refresh danh sách
  - Hiển thị count phòng chờ trên Sidebar/Menu badge
  - Nút "Đưa lại phòng chờ" trên danh sách chính (hiện khi `can_edit = true`)

- [x] Task C.6: **FE — Cập nhật MainLayout sidebar**
  - Thêm menu item "Phòng chờ" với badge count
  - Active state cho menu items
  - Permission-aware: ẩn menu items user không có quyền

- [x] Task C.7: **Fix email duplicate: BE bỏ reject + FE thêm warning** *(Bổ sung 2026-03-31)*
  - ✅ BE: Bỏ email reject trong `createEmployee` (cho phép email trùng — BR tái tuyển)
  - ✅ BE: Thêm route `GET /api/employees/check-email?email=xxx` trả về `{ exists, matches[{ ma_nhan_su, ho_va_ten, trang_thai, khoi }] }`
  - ✅ FE: `EmployeeForm.tsx` — thêm `onBlur` trên email field → gọi `/check-email` → hiển thị Ant Alert warning với thông tin NS cũ (tên, khối, trạng thái). Không block submit.

- [x] Task C.Final: 🧪 Test & Verify Phase C
  - Luồng: Thêm NS mới → vào phòng chờ → xem trong Phòng chờ → Submit → hiện trong Danh sách
  - Luồng: Sửa NS → Đưa lại phòng chờ → Submit lại
  - Block edit NS đã nghỉ việc
  - Email trùng → cảnh báo hiển thị (không block tạo mới)
  - Validate form: thiếu field → hiển thị lỗi

---

## Phase D: Polish — Chi tiết + State UI + Export + Edge Cases

**Mục tiêu:** Hoàn thiện trang chi tiết NS, state transition UI, export Excel (với BE audit), và xử lý edge cases.

- [x] Task D.1: **FE — Trang chi tiết NS (`frontend/src/pages/Employees/EmployeeDetailPage.tsx`)**
  - Hiển thị full 25 trường thông tin
  - Phân sections đẹp (Ant Descriptions component)
  - Badge trạng thái + phòng chờ
  - Nút "Sửa" (nếu `can_edit`), "Đưa lại phòng chờ" (nếu `can_edit`)
  - Nút "Xóa" (SA only) với confirm modal — **soft delete only** (chuyển `nghi_viec`)

- [x] Task D.2: **FE — Export Excel danh sách NS**
  - Tích hợp `xlsx` (SheetJS) đã có
  - Export employee info fields (không salary)
  - Watermark gồm 3 trường: `exported_by` (email user), `exported_at` (timestamp), `khoi` (khối đang filter) — lưu vào **metadata/sheet ẩn** (theo master plan), không chỉ hiển thị UI
  - **Max cap: 5000 rows/file** (theo master plan). Vượt → hiển thị thông báo lọc bớt.
  - Client-side UX rate limit (5 lần/phút) — BE đã có `exportRateLimiter` (5/min) riêng
  - Export đi qua `GET /api/employees?limit=all` → BE tự detect và ghi audit_log action `export` inline. KHÔNG gọi endpoint riêng.
  - Sửa `frontend/src/utils/exportExcel.ts` thay watermark "PHIÊN BẢN THỬ NGHIỆM" thành 3 trường chính thức

- [x] Task D.3: **FE — State transition UI (chuyển trạng thái)**
  - Dropdown hoặc button actions trên chi tiết NS: "Chuyển chính thức", "Nghỉ sinh", "Nghỉ việc", "Quay lại làm việc"
  - Chỉ hiển thị transitions hợp lệ theo `VALID_STATE_TRANSITIONS` map (import từ shared)
  - Confirm dialog trước khi chuyển (kèm textarea `reason` optional — ghi vào change_history)
  - Nhập ngày (nghỉ sinh, nghỉ việc) khi chuyển trạng thái tương ứng
  - Gọi `PUT /api/employees/:id/state` với body `{ new_state, ngay_nghi_sinh?, ngay_nghi_viec?, reason? }`

- [x] Task D.4: **FE — Empty states + Error handling**
  - Empty state khi chưa có NS nào
  - Error state khi API lỗi
  - Loading skeleton cho table + form
  - 404 khi NS không tồn tại

- [x] Task D.5: **Integration test — Full flow**
  - Login EA → Thêm NS → Phòng chờ → Submit → Danh sách → Sửa → Change History ghi → State transition → Export Excel
  - Login VI → Chỉ xem, không thấy nút sửa, không thấy salary
  - Login Reviewer → Thấy/sửa NS được gán với quyền `EA`. Các NS khác trong khối vẫn thấy theo base permission (`VI/VA/EA`) của user đó – không bị cô lập hoàn toàn. Chức năng tạo mới/delete vẫn bị chặn theo role gốc.
  - Login SA → Soft delete NS → verify audit log + change history
  - Verify: generic update reject `trang_thai`/`state_phong_cho`
  - Verify: export ghi audit_log action `export` ở BE

- [x] Task D.Final: 🧪 Test & Verify Phase D
  - Toàn bộ AC-1 → AC-18 pass (AC-19 thuộc Phase E)
  - No console errors
  - Build thành công (typecheck + lint)
  - Smoke test trên local

---

## Phase E: ĐÃ TÁCH

> **Phase E đã được tách sang thư mục riêng:** `.agent/active/phase-2-taskE/`
> **Lý do:** File này đã vượt 550 dòng gây lỗi cấu trúc copy-paste khi AI edit. Phase E có scope độc lập đủ để quản lý riêng.
> **Ngày tách:** 2026-04-01

---

## Execution Log (Phase A–D only)

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------| 
| 2026-03-27 11:08 | Phase A | Task A.1 | Bắt đầu implement shared schemas, types, constants | start | |
| 2026-03-27 11:09 | Phase A | Task A.1 | Hoàn thành, pnpm build:shared ok | done | |
| 2026-03-27 11:09 | Phase A | Task A.2 | Bắt đầu implement Employee Service | start | |
| 2026-03-27 11:10 | Phase A | Task A.2-A.5 | Hoàn thành Service, Routes, DB Change History, Audit | done | |
| 2026-03-27 11:10 | Phase A | Task A.6 | Bắt đầu viết Unit/Integration tests cho API/Permission | start | |
| 2026-03-27 11:28 | Phase A | Task A.6 | Hoàn thành, 13 test cases pass | done | |
| 2026-03-27 11:28 | Phase A | Task A.Final | AI tự test các case API thành công, dừng chờ User Test | start | |
| 2026-03-27 11:32 | Phase A | Task A.Final | User hoãn test manual chờ UI, AI chốt Phase A | done | Theo yêu cầu User |
| 2026-03-27 11:32 | Phase B | Task B.1 | Bắt đầu tạo TanStack Query hooks | start | |
| 2026-03-27 11:34 | Phase B | Task B.1 | Hoàn thành Tanstack query hooks | done | |
| 2026-03-27 11:34 | Phase B | Task B.2 | Bắt đầu viết bảng EmployeeTable | start | |
| 2026-03-27 11:45 | Phase B | Task B.2 - B.4 | Hoàn thành Employee Table, List Page và App.tsx routes | done | Frontend typecheck pass |
| 2026-03-27 11:45 | Phase B | Task B.Final | Chờ User manual test trên màn hình Danh sách Nhân sự | start | |
| 2026-03-27 11:49 | Phase B | Task B.Final | User phản hồi "ok đạt", Bảng hiển thị xuất sắc | done | Sang Phase C |
| 2026-03-27 11:49 | Phase C | Task C.1 | Bắt đầu viết zodToAntRules utility | start | |
| 2026-03-27 11:51 | Phase C | Task C.1 | Hoàn thành tiện ích mapping Zod qua Antd Rule | done | |
| 2026-03-27 11:51 | Phase C | Task C.2 | Bắt đầu viết EmployeeForm | start | |
| 2026-03-27 11:53 | Phase C | Task C.2 | Hoàn thành EmployeeForm | done | |
| 2026-03-27 11:53 | Phase C | Task C.3 | Bắt đầu viết trang Thêm NS mới | start | |
| 2026-03-27 11:53 | Phase C | Task C.3 | Hoàn thành EmployeeCreatePage | done | |
| 2026-03-27 11:55 | Phase C | Task C.4 - C.6 | Hoàn thành Trang Sửa, Trạng Phòng Chờ, Main Layout Menu | done | Typecheck pass, layout connected |
| 2026-03-27 12:00 | Phase C | Task C.Final | Chờ User manual test trên màn hình Thêm/Sửa & Phòng Chờ | start | |
| 2026-03-31 11:35 | Audit | — | Kiểm toán Phase 2 đối chiếu master plan | done | Phát hiện email bug, thiếu upload/OCR |
| 2026-03-31 11:42 | Phase C | Task C.7 | Fix BE email reject → warn, thêm check-email route | done (BE) | FE blur warning cần implement |
| 2026-03-31 16:40 | Gate | All | User xác nhận plan review xong, gate ✅ ĐỒNG Ý | done | Cho phép triển khai Phase A–E |
| 2026-03-31 16:41 | Phase C | Task C.7 | Hoàn thành FE email blur warning (onBlur + Alert) | done | Typecheck pass |
| 2026-03-31 16:43 | Phase C | Task C.Final | AI self-test pass | done | Chờ User test |
| 2026-03-31 19:59 | Phase C | Task C.Final | User manual test: OK pass | done | Chuyển sang Phase D |
| 2026-03-31 19:59 | Phase D | Task D.1 | Bắt đầu xây dựng trang Chi tiết NS | start | |
| 2026-03-31 20:41 | Phase D | Task D.1-D.5 | Fixed API Not Found, Ant Design Warning, SheetJS Hidden | done | |
| 2026-03-31 20:53 | Phase D | Task D.Final | User manual test: OK pass | done | ✅ Phase A–D hoàn tất |
| 2026-04-01 10:55 | Audit Fix | — | Sửa quyền reviewer, cách ly view lương, chặn update lương generic | done | Self-test pass 13/13 |
| 2026-04-01 11:12 | Audit Fix | Shared | Fix createEmployeeSchema thiếu omit `ngay_dieu_chinh_luong` | done | Shared build + typecheck + 20/20 test pass |
| 2026-04-01 14:32 | Phase E | — | Tách Phase E sang `.agent/active/phase-2-taskE/` | info | File quá dài gây lỗi cấu trúc |
