# Rebuttal Log: org-unit-select-employee-form

## Round 1 - 2026-08-07T15:20:00+07:00

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `database/migrations/048_create_org_units.sql:100-130`, `backend/src/routes/orgUnits.ts:170-220`, `OrgUnitCascadingSelect.tsx:150-190`, `QuickAddOrgUnitModal.tsx:30-90`

### EFR Đã Chấp Nhận -> [EFR-01]: Thuật toán Sparse Tree mâu thuẫn với điều kiện lọc theo cấp cố định | Sửa: Chuyển sang thuật toán Anchor Traversal linh hoạt theo node gần nhất đã chọn trong `OrgUnitCascadingSelect.tsx` (cập nhật Task 1.1 trong `FEATURE_TASKS.md` và `FEATURE_PLAN.md`).
### EFR Đã Chấp Nhận -> [EFR-02]: Quick Add chưa có contract cha/ngữ cảnh để tạo node con đúng và ổn định | Sửa: Bổ sung prop `initialParentId` cho `QuickAddOrgUnitModal.tsx`, truyền parent ID phù hợp từ anchor node, bổ sung Task 1.3 và thêm `QuickAddOrgUnitModal.tsx` vào affected files table.
### EFR Đã Chấp Nhận -> [EFR-03]: Tiêu chí search không được chuyển thành task triển khai có thể kiểm chứng | Sửa: Bổ sung Task 1.2 xây dựng Unicode normalizer (NFD, strip combining marks, unaccent đ/Đ) áp dụng cho 100% Selects.
### EFR Đã Chấp Nhận -> [EFR-04]: Chiến lược verify bỏ sót luồng transfer và các regression trọng yếu | Sửa: Mở rộng Task 1.Final và Task 2.Final thành test matrix đầy đủ 3 mode (`create`, `edit`, `transfer`), kiểm tra hydrate initial values, và assert payload 12 fields.

### Vùng đã scan khi không có SFR
- `frontend/src/components/EmployeeForm.tsx:510-520` (Xác nhận gỡ ô text input line_nhan_su)
- `frontend/src/components/common/OrgUnitCascadingSelect.tsx:100-210` (Form state reset & dual-write properties)

---

## Round 2 - 2026-08-07T15:25:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `backend/src/routes/orgUnits.ts:90-125`, `QuickAddOrgUnitModal.tsx:30-55`

### EFR Đã Chấp Nhận -> [EFR-05]: Canonical plan vẫn chưa phản ánh các EFR đã accepted | Sửa: Đồng bộ toàn bộ nội dung EFR-01 đến EFR-04 vào các mục In Scope, Risk Triage, Test Strategy, Phase Strategy và Rollback Plan (cả 3 file bị sửa) của `FEATURE_PLAN.md`.
### EFR Đã Chấp Nhận -> [EFR-06]: Quick Add matrix vẫn bỏ sót các type và trạng thái API bắt buộc | Sửa: Bổ sung xử lý HTTP 503 SERVICE_UNAVAILABLE (mutation mode `disabled`), giữ input/context trong modal khi bị 503 để user thử lại sau; mở rộng test matrix ở Task 1.3/Task 1.Final/Task 2.Final kiểm thử đủ 5 child types + Line trên SA/EA/no-perm và mutation modes (`disabled`/`sa_only`).

### Vùng đã scan khi không có SFR
- `backend/src/routes/orgUnits.ts:90-125` (Xác nhận 503 SERVICE_UNAVAILABLE khi mutation mode disabled)
- `frontend/src/components/common/QuickAddOrgUnitModal.tsx:30-55` (Xác nhận error handling và preservation of modal form inputs)

---

## Round 3 - 2026-08-07T15:32:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `packages/shared/src/constants/khoi.ts:1-19`, `backend/src/routes/orgUnits.ts:74-89,167-230`, `OrgUnitCascadingSelect.tsx:108-118`

### EFR Đã Chấp Nhận -> [EFR-07]: Phạm vi Quick Add Root Khối không thể đạt với contract hiện tại | Sửa: Khóa không cho chọn `type = khoi` trong modal Quick Add flow này (Root Khối là `KHOI_VALUES` tĩnh 11 Khối machine keys quản lý tại Admin Page); chuẩn hóa wording scope thành "4 child levels + Line Global".
### EFR Đã Chấp Nhận -> [EFR-08]: Thiếu ma trận hiển thị quyền riêng cho child unit và Line global | Sửa: Xây dựng per-button permission helper (`canQuickAddChild` kiểm tra `anchorNode.id != null` và SA/EA đúng `anchorNode.khoi`; `canQuickAddLine` kiểm tra SA hoặc any-EA); cập nhật Task 1.3, Task 1.Final, Task 2.Final và Test Matrix.
### EFR Đã Chấp Nhận -> [EFR-09]: Tiền điều kiện dữ liệu không đủ để hydrate 12 trường cho hồ sơ legacy | Sửa: Thêm cơ chế Fallback Text-to-ID Resolution tự động match `normalized_name` cho hồ sơ legacy có text nhưng FK ID null khi hydrate edit mode trong `OrgUnitCascadingSelect.tsx`; cập nhật Task 1.1 và test matrix edit mode.

### Vùng đã scan khi không có SFR
- `packages/shared/src/constants/khoi.ts:1-19` (Khóa Root Khối machine key static enum)
- `backend/src/routes/orgUnits.ts:74-89,167-230` (Backend scope checking for child vs global line units)

---

## Round 4 - 2026-08-07T15:40:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `packages/shared/src/constants/khoi.ts:1-20`, `database/migrations/048_create_org_units.sql:45-47`, `database/migrations/049_seed_and_update_workflow_rpcs.sql:180-230`

### EFR Đã Chấp Nhận -> [EFR-10]: Fallback `normalized_name` chưa có contract chống match mơ hồ, có thể ghi nhầm UUID | Sửa: Thắt chặt Sequential Disambiguated Fallback Text-to-ID Resolution (resolve tuần tự top-down `khoi_id -> bu_id -> phong_ban_id -> bo_phan_id -> nhom_team_id`; chỉ auto-fill khi có ĐÚNG 1 active candidate khớp `(type, normalized_name, khoi, parent_id anchor)`; nếu 0 hoặc >1 candidates thì giữ unresolved/null FK ID để user tự chọn); cập nhật Task 1.1 và test matrix edit mode.
### EFR Đã Chấp Nhận -> [EFR-11]: Invariant “11 Khối” trong plan không khớp nguồn dữ liệu chuẩn hiện có | Sửa: Chuẩn hóa toàn bộ wording trong `FEATURE_PLAN.md` thành `KHOI_VALUES` (10 Khối chuẩn) khớp 100% với `packages/shared/src/constants/khoi.ts` và `049_seed_and_update_workflow_rpcs.sql`.

### Vùng đã scan khi không có SFR
- `database/migrations/049_seed_and_update_workflow_rpcs.sql:180-230` (Xác nhận các tên trùng thực tế như `bgd`, `social`, `app` dưới các Phòng ban khác nhau trong Khối KND)
- `packages/shared/src/constants/khoi.ts:6-17` (Xác nhận KHOI_VALUES gồm 10 Khối)

---

## Round 5 - 2026-08-07T16:10:00+07:00

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `EmployeeForm.tsx:325-356,462-496`, `QuickAddOrgUnitModal.tsx:30-88`, `@rc-component/form/lib/hooks/useForm.js`

### EFR Đã Chấp Nhận -> [EFR-12]: Các field tổ chức chưa được đăng ký với Ant Form nên `onFinish` có thể loại toàn bộ payload 12 trường | Sửa: Đăng ký cả 12 field tổ chức & line nhân sự bằng `<Form.Item name="..." noStyle>` hoặc merge `form.getFieldsValue(true)` tại boundary `handleSubmit` trong `EmployeeForm.tsx` (cập nhật Task 2.2).
### EFR Đã Chấp Nhận -> [EFR-13]: Quick Add modal chưa có lifecycle contract để đồng bộ atomically `initialType`/`initialKhoi`/`initialParentId` | Sửa: Triển khai Atomic Modal Lifecycle Contract trong `QuickAddOrgUnitModal.tsx` bằng `useEffect` / `form.resetFields()` đồng bộ context `{ type, khoi, parentId }` mỗi khi prop `open = true` hoặc context đổi, khóa `type` theo nút bấm đã click (cập nhật Task 1.3).
### EFR Đã Chấp Nhận -> [EFR-14]: Active-only catalog không thể hydrate/edit hồ sơ đang tham chiếu đơn vị đã inactive | Sửa: Nạp danh mục active kết hợp nạp thêm các node inactive đang được record nhân sự hiện tại tham chiếu (hiển thị tag `(Đã khóa)`), cho phép hydrate và giữ nguyên lịch sử chính xác ở edit/transfer mode (cập nhật Task 1.1).
### EFR Đã Chấp Nhận -> [EFR-15]: Fallback “unresolved” chưa có validation gate nên text legacy + FK null vẫn được submit | Sửa: Thêm Pair-Consistency Validation Gate trước submit: nếu một cấp có text label nhưng FK ID null (do ambiguous match), hiển thị cảnh báo lỗi trên Select và chặn submit cho đến khi người dùng chọn node chuẩn hoặc xóa cấp (cập nhật Task 1.1 và Task 2.Final).

### Vùng đã scan khi không có SFR
- `EmployeeForm.tsx:325-356` (Form submit boundary & Ant Form field registration check)
- `QuickAddOrgUnitModal.tsx:65-88` (Modal props effect sync & form initial values reset)

---

## Round 6 - 2026-08-07T16:35:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `database/migrations/044_refine_prior_snapshot_check.sql:42-49,275-304`, `database/migrations/048_create_org_units.sql:174-203`, `database/migrations/049_seed_and_update_workflow_rpcs.sql`, `EmployeeForm.tsx:325-356`, `QuickAddOrgUnitModal.tsx:30-88`

### EFR Đã Chấp Nhận -> [EFR-16]: Fallback lọc top-level bằng `khoi` làm lộ toàn bộ descendants, phá Anchor Traversal | Sửa: Chuẩn hóa Anchor Traversal: khi chọn Khối, resolve root `khoi_id` và luôn lọc `parent_id === anchorNode.id` (loại bỏ `khoi === selectedKhoi` tránh lộ descendants ở depth sâu hơn); cập nhật Task 2.1.
### EFR Đã Chấp Nhận -> [EFR-17]: “Hydrate inactive” chỉ sửa hiển thị nhưng DB vẫn chặn edit record giữ FK inactive không đổi | Sửa: Cập nhật DB trigger `trg_employees_validate_org_units` grandfather FK inactive không đổi (`TG_OP = 'INSERT' OR NEW.<fk> IS DISTINCT FROM OLD.<fk>`), chỉ chặn gán MỚI FK inactive; cập nhật Task 1.1.
### EFR Đã Chấp Nhận -> [EFR-18]: Pair-consistency gate chưa có owner/contract nối với `EmployeeForm.onFinish`, nên chưa bảo đảm chặn submit | Sửa: Chỉ định rõ `EmployeeForm.handleSubmit` làm owner thực thi Pair-Consistency Validation Gate trước khi gọi `onSubmit`, hiển thị lỗi và chặn submit nếu text có nhưng FK null; cập nhật Task 3.2.
### EFR Đã Chấp Nhận -> [EFR-19]: Transfer pending workflow hiện bỏ qua toàn bộ 6 UUID FK khi approve | Sửa: Cập nhật RPC `submit_employee_pending` bổ sung 6 UUID FKs (`khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`) vào whitelist `v_employee_fields` và cast sang `UUID` để apply pending transfer đủ 12 trường; cập nhật Task 1.1 và test matrix E2E transfer approval.
### EFR Đã Chấp Nhận -> [EFR-20]: Task 1.3 chưa yêu cầu khóa type theo nút bấm như canonical plan | Sửa: Đồng bộ Task 2.3 khóa Select `type` trong `QuickAddOrgUnitModal.tsx` ở chế độ disabled/read-only, ép luôn dùng `initialType` từ atomic create-context.

### Vùng đã scan khi không có SFR
- `database/migrations/044_refine_prior_snapshot_check.sql:42-49,275-304` (Xác nhận whitelist cũ RPC submit_employee_pending thiếu 6 UUID FKs)
- `database/migrations/048_create_org_units.sql:174-203` (Xác nhận trigger DB trg_employees_validate_org_units thiếu check IS DISTINCT FROM OLD)

---

## Round 7 - 2026-08-07T16:45:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `database/migrations/048_create_org_units.sql:145,200-203`, `supabase/config.toml`, `packages/shared/src/schemas/employee.ts`, `backend/src/routes/employees.ts:375-403`

### EFR Đã Chấp Nhận -> [EFR-21]: Migration 052 tham chiếu trigger không tồn tại nên có thể không sửa được blocker inactive hiện hữu | Sửa: Chỉ định rõ trong migration sử dụng `CREATE OR REPLACE FUNCTION public.fn_trg_employees_org_unit_sync()` để cập nhật đúng function trigger thực tế của DB.
### EFR Đã Chấp Nhận -> [EFR-22]: Plan chỉ tạo migration trong `database/migrations`, nên Supabase CLI deployment không nhận migration 052 | Sửa: Cập nhật trực tiếp SQL migrations `048` và `049` ở cả 2 thư mục `database/migrations` và `supabase/migrations`, loại bỏ sinh file migration rác 052.
### EFR Đã Chấp Nhận -> [EFR-23]: Inactive-FK guard vẫn chỉ bao phủ 3/6 UUID fields | Sửa: Mở rộng grandfathering & validation logic trong `fn_trg_employees_org_unit_sync()` cho toàn bộ cả 6 UUID FK fields (`khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`).
### EFR Đã Chấp Nhận -> [EFR-24]: Pair-Consistency chỉ kiểm tra presence, không xác thực ID/type/name/ancestry nên payload 12 trường vẫn có thể tự mâu thuẫn | Sửa: Bổ sung Authoritative Ancestry & Alignment Validation Gate trong `EmployeeForm.handleSubmit` và backend DB trigger để kiểm tra tính đồng bộ chuỗi phân cấp thuộc cùng root Khối trước khi submit.
### EFR Đã Chấp Nhận -> [EFR-25]: Org selector dùng generic `can_edit`, cho phép Reviewer/EA đổi tổ chức trực tiếp hoặc sang Khối ngoài scope | Sửa: Enforce Scope-based Authorization trong `EmployeeForm` edit mode và update API: disable các ô chọn tổ chức nếu user không có quyền SA/EA target scope, yêu cầu thực hiện đổi tổ chức qua luồng Transfer Workflow.

### Vùng đã scan khi không có SFR
- `database/migrations/048_create_org_units.sql:145,200-203` (Xác nhận tên trigger function thực tế là public.fn_trg_employees_org_unit_sync)
- `supabase/config.toml:59-71` (Xác nhận Supabase CLI đọc migrations từ supabase/migrations)

---

## Round 8 - 2026-08-07T16:58:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `backend/src/routes/employees.ts:370-407`, `backend/src/services/employeeService.ts:438-447,779-796`, `backend/package.json:8-18`, `OrgUnitCascadingSelect.tsx:26-63`

### EFR Đã Chấp Nhận -> [EFR-26]: “Authoritative Ancestry” vẫn chỉ có owner ở frontend, không có backend/DB task | Sửa: Bổ sung Authoritative Ancestry Validator ở Backend API (`backend/src/routes/employees.ts` & `employeeService.ts`) và DB Trigger cho cả Create, Onboard, Update và Pending endpoints (cập nhật Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-27]: Wording ancestry đang kéo `line_nhan_su_id` global vào chuỗi root/parent-child | Sửa: Phân tách rõ ràng: Ancestry Alignment Gate chỉ áp dụng cho 5 FKs tổ chức (`khoi_id -> bu_id -> phong_ban_id -> bo_phan_id -> nhom_team_id`); validate `line_nhan_su_id` theo rule riêng (`type = line_nhan_su`, `parent_id = NULL`) (cập nhật Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-28]: Scope-based org authorization vẫn chỉ là UI guard; API direct-update/pending vẫn bypass được | Sửa: Enforce Scope-based Target Authorization ở Backend API (`PUT /api/employees/:id` & `PUT /api/employees/:id/personnel-pending`), reject direct update tổ chức nếu thiếu quyền (cập nhật Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-29]: Catalog GET failure vẫn silent và không có recovery contract | Sửa: Xử lý Catalog GET Failure trong `OrgUnitCascadingSelect.tsx`: hiển thị Antd `Alert` thông báo kèm nút "Thử lại", disable các dropdowns nhưng vẫn giữ hydrated initial values (cập nhật Task 2.1).
### EFR Đã Chấp Nhận -> [EFR-30]: Migration/auth thay đổi rủi ro cao nhưng Automated Tests chỉ có typecheck/build | Sửa: Bổ sung Automated Integration Tests (`pnpm --filter backend test:integration:fresh` nạp bản backup `database_backups\dump-postgres-202608071702.backup`) chỉ định cụ thể file `employee.test.ts` để verify migrations `048`/`049`, trigger, RPC pending whitelist, và backend target scope authorization (cập nhật Task 3.4 và Test Strategy).

### Vùng đã scan khi không có SFR
- `backend/src/routes/employees.ts:370-407` (Xác nhận backend API route chưa có authoritative ancestry & target scope authorization)
- `backend/package.json:8-18` (Xác nhận pnpm run test:integration scripts sẵn có)

---

## Round 9 - 2026-08-07T17:05:00+07:00

### Tổng kết
- EFR: 6 (accepted: 6, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `employees.ts:288-344,415-434`, `employeeService.ts:779-796`, `048_create_org_units.sql`, `049_seed_and_update_workflow_rpcs.sql`, `database_backups/dump-postgres-202608071702.backup`

### EFR Đã Chấp Nhận -> [EFR-31]: Backend validator bỏ sót hai create endpoints | Sửa: Áp Authoritative Backend Ancestry & Target Scope Validator cho cả 4 endpoints (`POST /api/employees`, `POST /api/employees/onboard`, `PUT /api/employees/:id`, `PUT /api/employees/:id/personnel-pending`) trong `backend/src/routes/employees.ts` & `employeeService.ts` (cập nhật Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-32]: Plan ghi sai method/path của pending endpoint | Sửa: Chuẩn hóa lại toàn bộ plan & tasks ghi chính xác method/path endpoint pending là `PUT /api/employees/:id/personnel-pending`.
### EFR Đã Chấp Nhận -> [EFR-33]: Target-scope rule làm chính Transfer Workflow bị khóa | Sửa: Phân định rõ ràng Authorization Policy: Khởi tạo pending transfer chỉ cần scope Khối nguồn (source EA) hoặc quyền reviewer; Duyệt/apply pending transfer hoặc sửa trực tiếp tổ chức (direct PUT) cần SA hoặc EA target scope (cập nhật Section 2 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-34]: DB ancestry trigger được annotation cam kết nhưng không có migration task | Sửa: Bổ sung validation 5-FK ancestry và global Line trực tiếp vào DB function `public.fn_trg_employees_org_unit_sync()` (cập nhật Task 1.1).
### EFR Đã Chấp Nhận -> [EFR-35]: Backend task chưa kiểm tra text-label khớp UUID | Sửa: Bổ sung Text-Label Matching Validation trong backend validator (`backend/src/routes/employees.ts`): giải mã các UUIDs gửi lên và verify khớp 100% với tên chuẩn hóa (`org_units.name`) (cập nhật Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-36]: Lệnh integration test không chạy/apply migration như plan tuyên bố | Sửa: Chỉ định cụ thể lệnh test integration chính xác `pnpm --filter backend test:integration:fresh` nạp bản backup mới nhất `database_backups\dump-postgres-202608071702.backup` làm DB test harness (cập nhật Test Strategy & Task 3.Final).

### Vùng đã scan khi không có SFR
- `employees.ts:288-344,415-434` (Xác nhận các create/onboard endpoints & path endpoint personnel-pending thực tế)
- `database_backups/dump-postgres-202608071702.backup` (Xác nhận bản backup mới nhất từ cloud)

---

## Round 10 - 2026-08-07T17:20:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `048_create_org_units.sql`, `049_seed_and_update_workflow_rpcs.sql`, `restore-local-db.ps1`, `employees.ts:522-563`, `employeeService.ts:798-865`

### EFR Đã Chấp Nhận -> [EFR-37]: Khôi phục Migration forward 052 để đảm bảo Upgrade Path cho Deployed DBs | Sửa: Chấp nhận EFR-37 theo chỉ đạo trực tiếp của User. Do DB cloud đã run/applied `048` và `049`, việc tạo forward migration `052_update_org_unit_triggers_and_pending_rpc.sql` (ở cả `database/migrations` và `supabase/migrations` via `backend/scripts/sync-migrations.cjs`) là bắt buộc để áp dụng các hàm `CREATE OR REPLACE FUNCTION` mới cho DB cloud mà không làm gãy migration history.
### EFR Đã Chấp Nhận -> [EFR-38]: Test command không hề nạp cloud backup như plan tuyên bố | Sửa: Cấu hình chính xác script restore backup cloud `powershell -ExecutionPolicy Bypass -File ./scripts/restore-local-db.ps1 database_backups/dump-postgres-202608071702.backup` trước khi chạy `pnpm --filter backend test:integration` (cập nhật Test Strategy, Task 3.4 & Task 3.Final).
### EFR Đã Chấp Nhận -> [EFR-39]: Target-scope authorization chưa gắn với endpoint duyệt/apply thực tế | Sửa: Áp dụng Target Scope Authorization Policy cho endpoint duyệt/apply pending thực tế `PUT /api/employees/:id/submit` và `submitFromPending()` trong `employeeService.ts` (cập nhật Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-40]: Backend/DB ancestry contract chưa định nghĩa Sparse Tree | Sửa: Định nghĩa thuật toán Sparse Tree Ancestry Alignment: mỗi FK non-null chọn lựa phải có `parent_id` bằng ID của node non-null gần nhất trước đó (nearest non-null ancestor), áp dụng đồng nhất ở FE, BE và DB trigger (cập nhật Section 2 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-41]: Pending validator thiếu effective-state merge contract | Sửa: Xây dựng hợp đồng Effective State Merge (`effectiveState = live employee + existing pending_changes + current patch`) trước khi validate pair-consistency, text-matching và target scope cho `PUT /api/employees/:id/personnel-pending` (cập nhật Task 3.2).

### Vùng đã scan khi không có SFR
- `database/migrations/`
- `scripts/restore-local-db.ps1`

---

## Round 11 - 2026-08-07T17:28:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `.gitignore:44`, `restore-local-db.ps1`, `employee.test.ts:8-30`, `employee.ts:55-69,112-135`, `employees.ts:522-560`

### EFR Đã Chấp Nhận -> [EFR-42]: Automated harness phụ thuộc file backup bị git-ignore | Sửa: Chuẩn hóa lệnh test mặc định cho automated gate là `pnpm --filter backend test:integration:fresh` (tự động reset & seed dev test users); giữ bước restore cloud dump thành tùy chọn local/staged (cập nhật Test Strategy & Task 3.4).
### EFR Đã Chấp Nhận -> [EFR-43]: Restore workflow không seed các tài khoản test mà suite yêu cầu | Sửa: Quy định nếu restore từ cloud backup dump thủ công thì phải chạy bổ sung `npx tsx scripts/seed_dev_users.ts --test` để bảo đảm các tài khoản test sẵn có (cập nhật Test Strategy & Task 3.4).
### EFR Đã Chấp Nhận -> [EFR-44]: Submit/apply chưa có effective-state contract | Sửa: Xây dựng `submitEffectiveState = live employee + pending_changes` cho `PUT /api/employees/:id/submit` và `submitFromPending()` trước khi validate ancestry, text matching và target scope (cập nhật Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-45]: Validator chưa bắt buộc UUID field đúng org-unit type | Sửa: Bổ sung validation mapping cố định org-unit type cho từng FK (`khoi_id=khoi`, `bu_id=bu`, `phong_ban_id=phong_ban`, `bo_phan_id=bo_phan`, `nhom_team_id=nhom_team`, `line_nhan_su_id=line_nhan_su`) ở cả FE, BE và DB trigger (cập nhật Task 1.1 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-46]: Pair-consistency mới kiểm tra một chiều text → UUID | Sửa: Enforce Pair-Consistency hai chiều (`text == null <=> UUID == null`) và canonical name equality cho cả 6 cặp trường tổ chức trên cả FE và BE (cập nhật Task 3.2 & Task 3.3).

### Vùng đã scan khi không có SFR
- `.gitignore:44` (Xác nhận backup dir bị git-ignore)
- `employee.ts:55-69,112-135` (Xác nhận schema validation cho text vs UUID fields)
- `employees.ts:522-560` (Xác nhận submit endpoint implementation)

---

## Round 13 - 2026-08-07T17:40:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `OrgUnitCascadingSelect.tsx:26-63`, `EmployeeForm.tsx:462-498`, `employees.ts:522-563`, `employeeService.ts:878-929`, `044_refine_prior_snapshot_check.sql`, `048_create_org_units.sql`

### EFR Đã Chấp Nhận -> [EFR-47]: Frontend handleSubmit chưa có catalog contract để validate type/ancestry | Sửa: `OrgUnitCascadingSelect.tsx` cung cấp catalog metadata/validation callback `validateOrgUnitValues(values)` cho parent form `EmployeeForm.tsx` để validate type mapping & sparse tree ancestry trước khi submit (cập nhật Task 2.1 & Task 3.3).
### EFR Đã Chấp Nhận -> [EFR-48]: Target-scope guard tại `/submit` chưa giới hạn cho pending có thay đổi tổ chức | Sửa: Phân định Target Scope EA Authorization tại `PUT /submit` chỉ kích hoạt khi `submitEffectiveState` có diff trên 12 org fields so với live employee data; giữ nguyên quyền duyệt cho non-org pending (cập nhật Section 2 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-49]: Rollback bằng cách xóa migration 052 là không hợp lệ với cloud đã apply | Sửa: Chuẩn hóa Rollback Plan cho deployed DBs sử dụng compensating forward migration `053_rollback_org_unit_triggers_and_pending_rpc.sql` hoặc runbook `CREATE OR REPLACE` khôi phục body cũ (cập nhật Section 10).
### EFR Đã Chấp Nhận -> [EFR-50]: Fresh-reset test không kiểm chứng upgrade path 051 → 052 trên DB hiện hữu | Sửa: Bổ sung Staged Migration Test verification: apply riêng migration 052 lên DB hiện hữu (đã up to 051) trước khi chạy integration tests (cập nhật Test Strategy & Task 3.Final).
### EFR Đã Chấp Nhận -> [EFR-51]: Migration 052 chưa yêu cầu bảo toàn security contract của hai functions | Sửa: Migration 052 bảo toàn nguyên vẹn function signatures, default arguments, return types, `SECURITY DEFINER`, `SET search_path = public`, owner postgres và grants cho cả `fn_trg_employees_org_unit_sync` và `submit_employee_pending` (cập nhật Task 1.1).

### Vùng đã scan khi không có SFR
- `OrgUnitCascadingSelect.tsx:26-63`
- `EmployeeForm.tsx:462-498`
- `employees.ts:522-563`

---

## Round 14 - 2026-08-07T17:44:00+07:00

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `044_refine_prior_snapshot_check.sql:5-13`, `backend/package.json:16-17`, `employees.ts:522-563`, `employeeService.ts:884-929`

### EFR Đã Chấp Nhận -> [EFR-52]: Plan ghi sai signature tham số của `submit_employee_pending` | Sửa: Sửa chính xác signature tham số thành `(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)` trong `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1).
### EFR Đã Chấp Nhận -> [EFR-53]: Staged migration verification vẫn chưa có command/harness thực thi | Sửa: Chỉ định cụ thể script test staged migration `pnpm --filter backend test:integration:staged` trong `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 3.4 & Task 3.Final).
### EFR Đã Chấp Nhận -> [EFR-54]: Direct PUT authorization đang tham chiếu nhầm `submitEffectiveState` | Sửa: Tách biệt `updateEffectiveState = live + parsed update` cho direct PUT vs `submitEffectiveState = live + pending` cho submit, chỉ enforce target EA scope khi có org diff (cập nhật Section 2 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-55]: Validator toàn cục có thể chặn non-org workflow trên hồ sơ legacy | Sửa: Cho phép grandfathering các trường tổ chức hiện hữu khi update/pending/submit không có org diff (ví dụ sửa SĐT hoặc duyệt lương trên nhân sự legacy không bị chặn bởi org validation) (cập nhật Section 2 & Task 3.2).

### Vùng đã scan khi không có SFR
- `044_refine_prior_snapshot_check.sql:5-13`
- `backend/package.json:16-17`
- `employees.ts:522-563`

---

## Round 15 - 2026-08-07T17:50:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, DB trigger contract, pending submit service/RPC, shared schemas, backend test scripts, org-unit indexes.

### EFR Đã Chấp Nhận -> [EFR-56]: DB trigger chưa grandfather structural validation khi không có org diff | Sửa: DB trigger `fn_trg_employees_org_unit_sync` trong migration 052 chỉ thực thi fixed-type mapping và ancestry validations khi `TG_OP = 'INSERT'` HOẶC có ít nhất 1 trong 6 org FKs thay đổi (`NEW.<fk> IS DISTINCT FROM OLD.<fk>`) trong `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Task 1.1).
### EFR Đã Chấp Nhận -> [EFR-57]: Submit authorization có TOCTOU với mutable `pending_changes` | Sửa: Xử lý fetch pending state, validation, target scope check và gọi RPC `submit_employee_pending` atomic trong DB transaction trong `employeeService.ts` để chống TOCTOU race condition (Section 2 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-58]: Null parity chưa định nghĩa normalize empty string | Sửa: Chuẩn hóa chuỗi text rỗng (`trim() === ''`) đồng nhất như `null` khi kiểm tra Two-Way Null Parity (`text == null <=> UUID == null`) trên cả FE và BE (cập nhật Section 2 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-59]: Plan đang tái sử dụng sai contract của script `test:integration:staged` hiện hữu | Sửa: Đổi tên script test staged migration thành `test:integration:upgrade-052` trong `FEATURE_PLAN.md` & `FEATURE_TASKS.md` để tránh đè script staged 050 hiện có (Test Strategy & Task 3.4).
### EFR Đã Chấp Nhận -> [EFR-60]: Legacy fallback bỏ sót `line_nhan_su_id` | Sửa: Bổ sung `line_nhan_su_id` vào quy trình Disambiguated Text-to-ID Fallback Resolution (resolve top-down: `khoi_id -> bu_id -> phong_ban_id -> bo_phan_id -> nhom_team_id -> line_nhan_su_id`) với `type = 'line_nhan_su'` và `parent_id = NULL` (cập nhật Task 2.1).

### Vùng đã scan khi không có SFR
- `048_create_org_units.sql:49-51`
- `employeeService.ts:884-929`
- `backend/package.json:16-17`

---

## Round 16 - 2026-08-07T17:59:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `backend/src/lib/supabase.ts:1-14`, `backend/src/routes/employees.ts:347-412,522-563`, `backend/src/services/employeeService.ts:644-707,878-940`, `database/migrations/044_refine_prior_snapshot_check.sql:5-65,275-304,370-387`

### EFR Đã Chấp Nhận -> [EFR-61]: “Bảo toàn grants” sẽ giữ `submit_employee_pending` mở EXECUTE cho PUBLIC | Sửa: Migration 052 thực thi `REVOKE ALL ON FUNCTION public.submit_employee_pending(...) FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role;` để thắt chặt bảo mật RPC theo chuẩn repo (Task 1.1).
### EFR Đã Chấp Nhận -> [EFR-62]: EFR-57 chưa tạo được transaction boundary thật, TOCTOU vẫn còn | Sửa: Thực thi row lock `SELECT ... FOR UPDATE` và verification pending state atomic bên trong `submit_employee_pending` RPC transaction body để giải quyết triệt để TOCTOU race condition (Section 2 & Task 3.2).

### Vùng đã scan khi không có SFR
- `database/migrations/041_bulk_resign_employees.sql:308-309`
- `database/migrations/046_update_workflow_binding_rpcs.sql:52-53`

---

## Round 17 - 2026-08-07T18:03:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `database/migrations/044_refine_prior_snapshot_check.sql:55-75`, `backend/src/routes/employees.ts:347-412`, `backend/src/services/employeeService.ts:644-707,878-932`

### EFR Đã Chấp Nhận -> [EFR-63]: Fix EFR-62 chỉ nhắc lại row lock cũ, target-scope check vẫn nằm ngoài transaction | Sửa: Bổ sung logic kiểm tra SA/EA target scope theo `p_changed_by` trực tiếp bên trong SQL transaction body của `submit_employee_pending` RPC sau `SELECT ... FOR UPDATE` row lock (Section 2 & Task 3.2).
### EFR Đã Chấp Nhận -> [EFR-64]: Direct PUT được tuyên bố atomic qua RPC nhưng plan không có direct-update RPC | Sửa: Áp dụng Optimistic Concurrency Control (`updated_at` compare-and-swap) trả về HTTP `409 Conflict` nếu record bị sửa đổi bởi request khác trong quá trình authorization cho direct `PUT /api/employees/:id` (Section 2 & Task 3.2).

### Vùng đã scan khi không có SFR
- `database/migrations/044_refine_prior_snapshot_check.sql:55-75`
- `backend/src/routes/employees.ts:347-412`
- `backend/src/services/employeeService.ts:644-707,878-932`

---

## Round 18 - 2026-08-07T18:10:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `database/migrations/026_save_personnel_pending_rpc.sql:20-36`, `database/migrations/044_refine_prior_snapshot_check.sql:275-304`, `database/migrations/048_create_org_units.sql:145-203`

### EFR Đã Chấp Nhận -> [EFR-65]: RPC re-check quyền nhưng không re-run full org validation trên pending đã lock | Sửa: Bổ sung logic re-run full org validation (two-way null parity, canonical text matching, fixed mapping, active/new-assignment, sparse ancestry) trên locked `submitEffectiveState` bên trong RPC `submit_employee_pending` sau `SELECT ... FOR UPDATE` row lock và derive target scope từ canonical root `khoi_id` đã validate (Task 1.1 & Task 3.2).

### Vùng đã scan khi không có SFR
- `database/migrations/026_save_personnel_pending_rpc.sql:20-36`
- `database/migrations/044_refine_prior_snapshot_check.sql:275-304`
- `database/migrations/048_create_org_units.sql:145-203`

---

## Round 19 - 2026-08-07T18:24:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `scripts/restore-local-db.ps1:1-9,74-96`, `backend/package.json:13-19`

### EFR Đã Chấp Nhận -> [EFR-66]: Restore harness đã apply 052 trước khi chạy test “upgrade 052 from 051” | Sửa: Staged Upgrade test 051->052 khởi tạo DB bằng `npx supabase db reset --version 051` ➔ restore data dump ➔ seed test users ➔ apply migration 052 để kiểm chứng chính xác upgrade path từ 051 (Test Strategy & Task 3.4 & Task 3.Final).
### EFR Đã Chấp Nhận -> [EFR-67]: Lệnh seed test users trong runbook trỏ sai path | Sửa: Chuẩn hóa canonical command path seed dev test users thành `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test` hoặc `npx tsx backend/scripts/seed_dev_users.ts --test` trong `FEATURE_PLAN.md` & `FEATURE_TASKS.md` (Test Strategy & Task 3.4).

### Vùng đã scan khi không có SFR
- `scripts/restore-local-db.ps1:1-9,74-96`
- `backend/package.json:13-19`

---

## Round 20 - 2026-08-07T18:28:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `frontend/src/pages/Employees/EmployeeEditPage.tsx:1-162`

### EFR Đã Chấp Nhận -> [EFR-68]: Plan trỏ sai path của `EmployeeEditPage.tsx` | Sửa: Chuẩn hóa toàn bộ Plan/Tasks/Rollback thành `frontend/src/pages/Employees/EmployeeEditPage.tsx` (cập nhật Affected Files Table, Task 3.3, và Section 10 Rollback Plan).

### Vùng đã scan khi không có SFR
- `frontend/src/pages/Employees/EmployeeEditPage.tsx:1-162`
