# Feature Tasks: Chuyển Đổi Form Nhân Sự Sang Search Dropdown Cho 5 Cấp Tổ Chức & Line Nhân Sự

<!-- Sửa theo EFR-01: Thuật toán Sparse Tree Traversal dựa trên anchor node gần nhất đã chọn thay vì lọc parent_id theo cấp cố định -->
<!-- Sửa theo EFR-02: Bổ sung task cập nhật QuickAddOrgUnitModal.tsx hỗ trợ truyền initialParentId và per-button create context -->
<!-- Sửa theo EFR-03: Thêm helper chuẩn hóa Unicode tiếng Việt (NFD, strip combining marks, unaccent đ/Đ) áp dụng nhất quán cho 100% Selects -->
<!-- Sửa theo EFR-04: Mở rộng Test Strategy thành test matrix đủ 3 mode, hydrate initial values, và assert payload 12 fields -->
<!-- Sửa theo EFR-05: Đồng bộ toàn bộ nội dung EFR accepted vào các mục In Scope, Risk Triage, Test Strategy, Phase Strategy và Rollback Plan của FEATURE_PLAN.md -->
<!-- Sửa theo EFR-06: Mở rộng Quick Add matrix xử lý HTTP 503 SERVICE_UNAVAILABLE (giữ input/context trong modal) và test đủ 5 child types + Line trên SA/EA/no-perm và mutation modes (disabled/sa_only) -->
<!-- Sửa theo EFR-07: Chuẩn hóa scope Quick Add trên EmployeeForm thành 4 child levels (bu, phong_ban, bo_phan, nhom_team) + Line Global; loại Root Khối khỏi modal Quick Add flow này do KHOI_VALUES tĩnh -->
<!-- Sửa theo EFR-08: Định nghĩa ma trận phân quyền per-button (canQuickAddChild yêu cầu anchorNode.id != null và EA đúng anchorNode.khoi; canQuickAddLine yêu cầu SA hoặc any-EA) -->
<!-- Sửa theo EFR-09: Bổ sung cơ chế fallback resolve text-to-ID dựa trên normalized_name cho hồ sơ legacy có text nhưng FK ID null khi hydrate edit mode -->
<!-- Sửa theo EFR-10: Thắt chặt Fallback Text-to-ID Resolution theo thứ tự tuần tự top-down (khoi_id -> bu_id -> phong_ban_id -> bo_phan_id -> nhom_team_id -> line_nhan_su_id); chỉ auto-fill khi có ĐÚNG 1 active candidate khớp (type, normalized_name, khoi, parent_id anchor); giữ unresolved nếu 0 hoặc >1 candidates -->
<!-- Sửa theo EFR-11: Chuẩn hóa toàn bộ wording số lượng Khối trong plan thành KHOI_VALUES (10 Khối chuẩn) khớp 100% với khoi.ts và 049 seed migration -->
<!-- Sửa theo EFR-12: Bắt buộc đăng ký cả 12 keys bằng Form.Item hidden/noStyle trong EmployeeForm.tsx hoặc merge form.getFieldsValue(true) tại boundary handleSubmit để Ant Form onFinish thu gom đủ 12 fields -->
<!-- Sửa theo EFR-13: Định nghĩa modal lifecycle contract trong QuickAddOrgUnitModal.tsx (dùng useEffect/form.resetFields đồng bộ create-context {type, khoi, parentId} mỗi lần open=true) và khóa type theo nút bấm -->
<!-- Sửa theo EFR-14: Nạp danh mục active kết hợp các node inactive đang được record hiện tại tham chiếu (hiển thị tag (Đã khóa)), cho phép hydrate chính xác hồ sơ tham chiếu đơn vị inactive -->
<!-- Sửa theo EFR-15: Đưa vào pair-consistency validation gate trước khi submit: nếu một cấp có text label nhưng FK ID null (do ambiguous/unresolved match), hiển thị cảnh báo lỗi trên Select và chặn submit cho đến khi chọn node chuẩn -->
<!-- Sửa theo EFR-16: Loại bỏ ngoại lệ khoi === selectedKhoi khi lọc top-level; luôn resolve root khoi_id và lọc parent_id === rootKhoiNode.id để không bị lộ các descendants ở depth sâu hơn -->
<!-- Sửa theo EFR-17: Cập nhật DB function public.fn_trg_employees_org_unit_sync() grandfather 6 FKs inactive không đổi (TG_OP = 'INSERT' OR NEW.<fk> IS DISTINCT FROM OLD.<fk>), chỉ chặn gán MỚI FK inactive -->
<!-- Sửa theo EFR-18: Chỉ định rõ EmployeeForm.handleSubmit là owner thực thi Pair-Consistency Validation Gate trước onSubmit, đảm bảo form.validateFields() chặn submit khi text có me FK null -->
<!-- Sửa theo EFR-19: Cập nhật RPC submit_employee_pending bổ sung 6 UUID FK keys (khoi_id, bu_id, phong_ban_id, bo_phan_id, nhom_team_id, line_nhan_su_id) vào whitelist và cast sang UUID để apply pending transfer đủ 12 fields -->
<!-- Sửa theo EFR-20: Khóa type Select trong QuickAddOrgUnitModal.tsx ở chế độ disabled/read-only hoặc không render Select, luôn ép dùng initialType từ atomic create-context -->
<!-- Sửa theo EFR-21: Migration 052 chỉ định rõ CREATE OR REPLACE FUNCTION public.fn_trg_employees_org_unit_sync() để cập nhật đúng trigger function thực tế của DB -->
<!-- Sửa theo EFR-23: Mở rộng grandfathering & validation logic ở DB function fn_trg_employees_org_unit_sync() cho toàn bộ cả 6 UUID FK fields (khoi_id, bu_id, phong_ban_id, bo_phan_id, nhom_team_id, line_nhan_su_id) -->
<!-- Sửa theo EFR-24: Bổ sung Authoritative Ancestry & Alignment Validation Gate: kiểm tra các UUID FKs không những tồn tại mà phải tạo thành chuỗi phân cấp hợp lệ thuộc cùng root Khối trước khi submit/UPDATE DB -->
<!-- Sửa theo EFR-25: Enforce Scope-based Authorization trên EmployeeForm edit mode và API update: hạn chế chỉnh sửa trực tiếp tổ chức trong edit mode cho tài khoản không có quyền SA/EA target scope, yêu cầu thực hiện qua Transfer Workflow -->
<!-- Sửa theo EFR-26: Bổ sung Authoritative Ancestry Validator ở Backend API (backend/src/routes/employees.ts & employeeService.ts) và DB Trigger cho cả Create, Onboard, Update và Pending endpoints -->
<!-- Sửa theo EFR-27: Phân tách rõ ràng: Ancestry Alignment Gate chỉ áp dụng cho 5 FKs tổ chức (khoi_id -> bu_id -> phong_ban_id -> bo_phan_id -> nhom_team_id); validate line_nhan_su_id theo rule riêng (type = line_nhan_su, parent_id = NULL) -->
<!-- Sửa theo EFR-28: Sửa đúng path endpoint pending thành PUT /api/employees/:id/personnel-pending và phân định rõ authorization: khởi tạo pending dùng source scope/reviewer, duyệt pending / direct update org dùng target scope -->
<!-- Sửa theo EFR-29: Xử lý Catalog GET Failure trong OrgUnitCascadingSelect.tsx: hiển thị Alert thông báo kèm nút Retry, disable dropdowns nhưng vẫn giữ hydrated initial values -->
<!-- Sửa theo EFR-30: Bắt buộc dùng Supabase Local Docker CLI Harness và restore từ database_backups/dump-postgres-202608071702.backup trước khi chạy pnpm --filter backend test:integration để test E2E DB trigger, RPC whitelist và API auth -->
<!-- Sửa theo EFR-37 (ACCEPTED & RE-INSTATED): Tạo Migration forward 052_update_org_unit_triggers_and_pending_rpc.sql ở cả database/migrations và supabase/migrations (đồng bộ qua backend/scripts/sync-migrations.cjs) -->
<!-- Sửa theo EFR-38: Bắt buộc cấu hình quy trình restore DB backup cloud bằng script ./scripts/restore-local-db.ps1 database_backups/dump-postgres-202608071702.backup và seed dev test users trước khi chạy test integration suite -->
<!-- Sửa theo EFR-39: Áp dụng Target Scope Authorization Policy cho endpoint duyệt/apply pending thực tế PUT /api/employees/:id/submit và submitFromPending() trong employeeService.ts -->
<!-- Sửa theo EFR-40: Định nghĩa thuật toán Sparse Tree Ancestry Alignment: mỗi FK non-null chọn lựa phải có parent_id bằng ID của node non-null gần nhất trước đó (nearest non-null ancestor), áp dụng đồng nhất ở FE, BE và DB trigger -->
<!-- Sửa theo EFR-41: Xây dựng hợp đồng Effective State Merge (effectiveState = live employee + existing pending_changes + current patch) trước khi validate pair-consistency, text-matching và target scope cho PUT /api/employees/:id/personnel-pending -->
<!-- Sửa theo EFR-42 & EFR-43: Bắt buộc dùng Supabase Local Docker CLI Harness nạp restore file backup cloud database_backups/dump-postgres-202608071702.backup qua script ./scripts/restore-local-db.ps1 và seed test users pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test trước khi chạy integration tests -->
<!-- Sửa theo EFR-44: Xây dựng submitEffectiveState = live employee + pending_changes cho PUT /api/employees/:id/submit trước khi validate ancestry, text matching và target scope -->
<!-- Sửa theo EFR-45: Bổ sung validation mapping cố định org-unit type cho từng FK: khoi_id=khoi, bu_id=bu, phong_ban_id=phong_ban, bo_phan_id=bo_phan, nhom_team_id=nhom_team, line_nhan_su_id=line_nhan_su ở FE, BE và DB trigger -->
<!-- Sửa theo EFR-46: Enforce Pair-Consistency hai chiều (text == null <=> UUID == null) và canonical name equality cho cả 6 cặp trường tổ chức ở FE và BE -->
<!-- Sửa theo EFR-47: OrgUnitCascadingSelect.tsx cung cấp catalog metadata/validation callback để EmployeeForm.handleSubmit validate type mapping & sparse tree ancestry trước khi submit -->
<!-- Sửa theo EFR-48: Phân định Target Scope EA Authorization tại PUT /submit chỉ kích hoạt khi submitEffectiveState có diff trên 12 org fields so với live employee -->
<!-- Sửa theo EFR-49: Chuẩn hóa Rollback Plan cho deployed DBs sử dụng compensating forward migration 053_rollback_org_unit_triggers_and_pending_rpc.sql hoặc runbook CREATE OR REPLACE khôi phục body cũ -->
<!-- Sửa theo EFR-50: Bổ sung Staged Migration Test verification: apply riêng 052 lên DB hiện hữu (đã up to 051) trước khi chạy integration tests -->
<!-- Sửa theo EFR-51: Migration 052 bảo toàn nguyên vẹn function signatures, default arguments, return types, SECURITY DEFINER, SET search_path = public, owner và grants -->
<!-- Sửa theo EFR-52: Sửa chính xác signature tham số submit_employee_pending thành (p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL) -->
<!-- Sửa theo EFR-53: Chỉ định cụ thể lệnh test staged migration pnpm --filter backend test:integration:upgrade-052 apply 052 lên DB up to 051 -->
<!-- Sửa theo EFR-54: Tách biệt updateEffectiveState = live + parsed update cho direct PUT vs submitEffectiveState = live + pending cho PUT /submit, chỉ enforce target EA scope khi có org diff -->
<!-- Sửa theo EFR-55: Cho phép grandfathering org fields hiện hữu khi update/pending/submit không có org diff (editing non-org fields/salary-only pending trên legacy employee không bị block bởi org validator) -->
<!-- Sửa theo EFR-56: DB trigger fn_trg_employees_org_unit_sync chỉ chạy fixed-type mapping và ancestry validations khi TG_OP = 'INSERT' hoặc có ít nhất 1 trong 6 org FKs thay đổi (NEW.<fk> IS DISTINCT FROM OLD.<fk>) -->
<!-- Sửa theo EFR-57: Đảm bảo fetch/validate/check target scope và gọi submit_employee_pending trong submitFromPending được xử lý atomic trong DB transaction để tránh TOCTOU race condition -->
<!-- Sửa theo EFR-58: Chuẩn hóa chuỗi text rỗng (trim() === '') đồng nhất như null khi kiểm tra Two-Way Null Parity (text == null <=> UUID == null) ở FE và BE -->
<!-- Sửa theo EFR-59: Đặt tên script test staged migration là test:integration:upgrade-052 để tránh ghi đè script test:integration:staged hiện hữu -->
<!-- Sửa theo EFR-60: Thêm line_nhan_su_id vào quy trình Disambiguated Text-to-ID Fallback Resolution (resolve top-down khoi_id -> bu_id -> phong_ban_id -> bo_phan_id -> nhom_team_id -> line_nhan_su_id) -->
<!-- Sửa theo EFR-61: Migration 052 thực thi REVOKE ALL ON FUNCTION public.submit_employee_pending(...) FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role; bảo vệ SECURITY DEFINER RPC -->
<!-- Sửa theo EFR-62 & EFR-63: Thực thi row lock SELECT ... FOR UPDATE và target scope verification theo p_changed_by atomic bên trong submit_employee_pending RPC transaction body để giải quyết TOCTOU race condition hoàn toàn -->
<!-- Sửa theo EFR-64: Áp dụng Optimistic Concurrency Locking (updated_at compare-and-swap 409 Conflict) cho direct PUT /api/employees/:id để bảo vệ state khi update trực tiếp -->
<!-- Sửa theo EFR-65: RPC submit_employee_pending thực thi full org re-validation (two-way null parity, canonical text matching, fixed type mapping, DB ancestry) sau FOR UPDATE row lock trên submitEffectiveState và derive target scope từ canonical root khoi_id đã validate -->
<!-- Sửa theo EFR-66: Staged Upgrade test 051->052 khởi tạo DB bằng reset schema --version 051 rồi mới apply 052 để kiểm chứng chính xác upgrade path từ 051 -->
<!-- Sửa theo EFR-67: Sửa chính xác canonical command path seed dev test users thành pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test hoặc npx tsx backend/scripts/seed_dev_users.ts --test -->
<!-- Sửa theo EFR-68: Sửa chính xác path của EmployeeEditPage.tsx thành frontend/src/pages/Employees/EmployeeEditPage.tsx trong Task 3.3 và các tài liệu plan -->

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-08-07

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Create Migration Forward 052 For Inactive FK Grandfathering & Transfer Pending RPC

**Mục tiêu:** Tạo file Forward Migration `052_update_org_unit_triggers_and_pending_rpc.sql` ở cả 2 thư mục (`database/migrations` và `supabase/migrations` via `node backend/scripts/sync-migrations.cjs`) bảo toàn nguyên vẹn function signatures (`submit_employee_pending(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)`), `SECURITY DEFINER` và `SET search_path = public` để grandfather cả 6 FKs inactive không đổi khi update các field khác, validate fixed FK type mapping & 5-FK Sparse Tree ancestry & global Line tại DB trigger `public.fn_trg_employees_org_unit_sync()` (chỉ kích hoạt KHI `TG_OP = 'INSERT'` HOẶC có FK thay đổi `NEW.<fk> IS DISTINCT FROM OLD.<fk>`), whitelist 6 UUID FKs trong `submit_employee_pending` RPC, thực thi re-run full validation & target scope authorization sau `SELECT ... FOR UPDATE` row lock trong RPC body, và thắt chặt quyền truy cập (`REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role`), bảo toàn Upgrade Path cho Deployed DBs.

- [x] Task 1.1: Tạo `052_update_org_unit_triggers_and_pending_rpc.sql` ở `database/migrations` và mirror sang `supabase/migrations` via `node backend/scripts/sync-migrations.cjs`:
  - `CREATE OR REPLACE FUNCTION public.fn_trg_employees_org_unit_sync()`: Bảo toàn signature, `SECURITY DEFINER`, `SET search_path = public`. Grandfather cả 6 FKs inactive không đổi (`TG_OP = 'INSERT' OR NEW.khoi_id IS DISTINCT FROM OLD.khoi_id`, `NEW.bu_id IS DISTINCT FROM OLD.bu_id`, `NEW.phong_ban_id IS DISTINCT FROM OLD.phong_ban_id`, `NEW.bo_phan_id IS DISTINCT FROM OLD.bo_phan_id`, `NEW.nhom_team_id IS DISTINCT FROM OLD.nhom_team_id`, `NEW.line_nhan_su_id IS DISTINCT FROM OLD.line_nhan_su_id`), chỉ cấm gán MỚI FK trỏ đến node inactive.
  - Bổ sung DB-level validation: kiểm tra fixed type mapping (`khoi_id=khoi`, `bu_id=bu`, `phong_ban_id=phong_ban`, `bo_phan_id=bo_phan`, `nhom_team_id=nhom_team`, `line_nhan_su_id=line_nhan_su`) và chuỗi 5 FKs tổ chức theo thuật toán Sparse Tree (mỗi FK non-null phải có `parent_id` bằng nearest non-null ancestor node); validate `line_nhan_su_id` là global line (`parent_id = NULL`). Kích hoạt validation KHI VÀ CHỈ KHI `TG_OP = 'INSERT'` HOẶC ít nhất 1 trong 6 FKs có thay đổi (`NEW.<fk> IS DISTINCT FROM OLD.<fk>`).
  - Redefine RPC `submit_employee_pending`: Bảo toàn chính xác signature `(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)`, return type `JSONB`, `SECURITY DEFINER`, `SET search_path = public`, owner postgres. Thêm 6 UUID FK keys (`khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`) vào whitelist `v_employee_fields` và cast JSON values sang `UUID` khi apply update vào bảng `employees`. Sau `SELECT ... FOR UPDATE`, re-run full validation (two-way null parity, canonical text matching, fixed mapping, active/new-assignment rule, sparse ancestry) và kiểm tra target SA/EA scope của `p_changed_by` đối với canonical root `khoi_id` trước khi apply.
  - Security Hardening cho RPC: Bổ sung `REVOKE ALL ON FUNCTION public.submit_employee_pending(VARCHAR, TEXT, UUID) FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION public.submit_employee_pending(VARCHAR, TEXT, UUID) TO service_role;`.
- [/] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy sync migration và unit tests verify RPC whitelist, RPC revoke public security, internal full re-validation & target scope verification & trigger DB).

## Phase 2: Refactor OrgUnitCascadingSelect Component & QuickAdd Support

**Mục tiêu:** Cập nhật `OrgUnitCascadingSelect.tsx` & `QuickAddOrgUnitModal.tsx` hỗ trợ hiển thị 5 cấp tổ chức (`Khối` chọn từ 10 Khối `KHOI_VALUES`, `BU`, `Phòng ban`, `Bộ phận`, `Nhóm team`) + `Line Nhân sự` với Search Box hỗ trợ tiếng Việt không dấu, Anchor Traversal trỏ root `khoi_id`, Per-button Permission Matrix, Sequential Disambiguated Fallback Text-to-ID (6 fields gồm `line_nhan_su_id`), Inactive Node Hydration, Validation Callback cho Parent Form, và Quick Add Atomic Modal Lifecycle kèm 503 maintenance mode handling & disabled type select.

- [x] Task 2.1: Xây dựng thuật toán Anchor Traversal cho Cây Thưa (Sparse Tree), Sequential Disambiguated Fallback Text-to-ID Resolution (cho 6 fields gồm `line_nhan_su_id`), Inactive Hydration & Validation Callback trong `OrgUnitCascadingSelect.tsx`:
  - Nạp danh mục active kết hợp nạp thêm các node inactive đang được record nhân sự hiện tại tham chiếu (gắn tag `(Đã khóa)` cho node inactive).
  - Thêm Catalog GET Error Recovery: Khi API nạp danh mục thất bại, hiển thị Antd `Alert` thông báo lỗi kèm nút "Thử lại", disable các ô chọn nhưng vẫn bảo toàn hydrated initial values.
  - Khi chọn Khối, resolve root `khoi_id` từ node Khối tương ứng; mọi cấp con đều lọc theo `parent_id === anchorNode.id` (loại bỏ ngoại lệ `khoi === selectedKhoi` ở top-level để không bị lộ descendants ở depth sâu hơn). Mỗi node non-null phải trỏ `parent_id` tới nearest non-null ancestor.
  - Ánh xạ linh hoạt các node con vào đúng dropdown theo `type` của node (`bu`, `phong_ban`, `bo_phan`, `nhom_team`).
  - Khi thay đổi bất kỳ cấp cha nào, tự động reset đồng thời cả text label lẫn UUID FK của toàn bộ các cấp hậu duệ bên dưới.
  - Thêm cơ chế Sequential Disambiguated Fallback Text-to-ID Resolution:
    1. Resolve tuần tự top-down: `khoi_id` ➔ `bu_id` ➔ `phong_ban_id` ➔ `bo_phan_id` ➔ `nhom_team_id` ➔ `line_nhan_su_id`.
    2. Chỉ auto-fill FK ID khi tìm thấy **đúng 1 active candidate** khớp `(type, normalized_name, khoi, parent_id)` của anchor cha đã resolve (đối với Line: `type='line_nhan_su'`, `parent_id=NULL`).
    3. Nếu 0 hoặc có nhiều hơn 1 candidate (tên trùng mơ hồ như `bgd`/`social`/`app`), giữ nguyên FK ID = null.
  - Cung cấp validation callback `validateOrgUnitValues(values)` để parent form `EmployeeForm.tsx` có thể validate fixed type mapping, two-way null parity (chuẩn hóa `trim() === ''` như null) và nearest-parent ancestry đối chiếu catalog.
- [x] Task 2.2: Xây dựng helper chuẩn hóa Unicode tìm kiếm tiếng Việt không phân biệt hoa thường / dấu:
  - Sử dụng `.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()`.
  - Áp dụng helper vào `filterOption` cho 100% các component `Select` (Khối cho 10 Khối `KHOI_VALUES`, BU, Phòng ban, Bộ phận, Nhóm team, Line nhân sự).
- [x] Task 2.3: Cập nhật Per-button Permission Matrix và Atomic Modal Lifecycle trong `QuickAddOrgUnitModal.tsx`:
  - Triển khai `canQuickAddChild(anchorKhoi, anchorParentId)`: chỉ hiện nút `+` child unit khi `anchorParentId != null` và (SA hoặc EA thuộc `anchorKhoi`).
  - Triển khai `canQuickAddLine()`: hiện nút `+` Line Global cho SA hoặc bất kỳ user nào có quyền EA trong bất kỳ Khối nào (`parent_id = null`).
  - Triển khai Atomic Modal Lifecycle Contract trong `QuickAddOrgUnitModal.tsx`: dùng `useEffect` / `form.resetFields()` đồng bộ atomic create-context `{ type, khoi, parentId }` mỗi khi `open = true` hoặc context đổi; khóa Select `type` ở chế độ disabled/read-only ép dùng `initialType`.
  - Xử lý các HTTP status codes: 201 (Thành công), 400 (Bad request), 403 (Forbidden), 404 (Not found), và **503 SERVICE_UNAVAILABLE** (khi mutation mode `disabled` ➔ hiển thị toast cảnh báo bảo trì và giữ nguyên input/context trong modal để user thử lại sau).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra hiển thị dropdown 10 Khối, traversal cây thưa theo root khoi_id, search tiếng Việt không dấu, disambiguated fallback text-to-ID bao gồm line_nhan_su_id, inactive hydration, catalog error recovery, per-button permission matrix, và Quick Add atomic modal khóa type với 503 status).

## Phase 3: Backend API Validation, Scope Authorization, Form Integration & Integration Harness

**Mục tiêu:** Cập nhật Backend API (`backend/src/routes/employees.ts` & `employeeService.ts`), Frontend `EmployeeForm.tsx` & `frontend/src/pages/Employees/EmployeeEditPage.tsx`, thực thi Two-Way Null Parity (chuẩn hóa `trim() === ''` mapped sang null), Fixed Type Mapping & Authoritative Sparse Ancestry Gate cùng Conditional Target Scope Authorization & Optimistic Concurrency Control ở cả FE/BE cho 5 endpoints, đăng ký 12 Form keys, xóa ô text input `Line nhân sự` dư thừa, và chạy integration test harness trên Supabase Local Docker CLI khôi phục từ cloud backup `database_backups/dump-postgres-202608071702.backup`.

- [x] Task 3.1: Sửa [EmployeeForm.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/EmployeeForm.tsx): Xóa bỏ ô gõ text tự do `<Form.Item label="Line nhân sự" name="line_nhan_su"><Input /></Form.Item>` ở Card *"Quản lý & Hợp đồng"*.
- [/] Task 3.2: Cập nhật Backend API (`backend/src/routes/employees.ts` & `backend/src/services/employeeService.ts`):
  - Xây dựng **Authoritative Backend Ancestry, Two-Way Null Parity (String Trim Normalized), Fixed Type Mapping & Effective State Merge Validator**: 
    1. Trên create/onboard: luôn thực thi 100% full validation (two-way null parity với `trim() === ''` mapped sang null, fixed type mapping, text matching & sparse tree ancestry).
    2. Trên update/pending/submit: tính toán `updateEffectiveState = live + parsed patch` cho direct PUT, `effectiveState = live + pending + patch` cho pending, và `submitEffectiveState = live + pending` cho submit. Kích hoạt full org validation KHI VÀ CHỈ KHI effective state tương ứng có diff trên 12 trường tổ chức so với live data. Nếu không có org diff (ví dụ chỉ đổi SĐT/lương trên hồ sơ legacy), grandfather các trường tổ chức hiện hữu mà không chặn request.
    3. Enforce Fixed Type Mapping: `khoi_id -> type='khoi'`, `bu_id -> type='bu'`, `phong_ban_id -> type='phong_ban'`, `bo_phan_id -> type='bo_phan'`, `nhom_team_id -> type='nhom_team'`, `line_nhan_su_id -> type='line_nhan_su'`.
  - Xây dựng **Backend Target Scope Authorization & Optimistic Concurrency Control**: 
    1. Khởi tạo pending transfer (`PUT /personnel-pending`) dùng source scope/reviewer; 
    2. Duyệt/apply pending transfer (`PUT /submit` & `submitFromPending`): Xử lý truyền `p_changed_by` vào `submit_employee_pending` RPC để RPC thực hiện `SELECT ... FOR UPDATE` row lock, re-run full org validation và target scope validation atomic bên trong SQL transaction body.
    3. Sửa trực tiếp tổ chức (direct `PUT /api/employees/:id`): Sử dụng Optimistic Concurrency Control (`updated_at` compare-and-swap) trả về HTTP `409 Conflict` nếu record bị sửa đổi bởi request khác trong quá trình authorization/validation.
- [x] Task 3.3: Cập nhật Frontend `EmployeeForm.tsx` & [EmployeeEditPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeEditPage.tsx):
  - Đăng ký cả 12 keys (`khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su`, `khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`) bằng `<Form.Item name="..." noStyle>` hoặc merge `form.getFieldsValue(true)` tại boundary `handleSubmit`.
  - Thực thi Two-Way Null Parity (chuẩn hóa `trim() === ''` như null) & Separate Sparse Ancestry Alignment Gate trong `EmployeeForm.handleSubmit` trước khi gọi `onSubmit` (thông qua validation callback của `OrgUnitCascadingSelect`):
    1. Kiểm tra 2 chiều: `text == null <=> UUID == null` cho 6 cặp trường; nếu có text label nhưng FK ID null (do ambiguous match) hoặc có UUID nhưng thiếu text, hiển thị thông báo lỗi trên Select và chặn `onSubmit`.
    2. Kiểm tra tính đồng bộ chuỗi 5 FKs tổ chức (mỗi FK non-null phải trỏ parent_id tới nearest non-null ancestor). Validate riêng `line_nhan_su_id` (chỉ kiểm tra global line).
  - Enforce Scope-based Org Edit Guard: Trong edit mode tại `frontend/src/pages/Employees/EmployeeEditPage.tsx`, disable các ô chọn tổ chức nếu user không có quyền SA/EA target scope, hướng dẫn user thực hiện qua luồng Điều chuyển (`PUT /api/employees/:id/personnel-pending`).
- [x] Task 3.4: Bắt buộc cấu hình Supabase Local Docker CLI Harness, restore `database_backups/dump-postgres-202608071702.backup` và seed test users trước khi chạy integration tests:
  - Bổ sung script / runbook restore local DB `powershell -ExecutionPolicy Bypass -File ./scripts/restore-local-db.ps1 database_backups/dump-postgres-202608071702.backup` và seed users `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test`.
  - Bổ sung Integration Test cases trong `backend/src/__tests__/integration/employee.test.ts` & script `test:integration:upgrade-052` trong `backend/package.json` kiểm tra 6 FKs grandfathering, migration 052 RPC pending whitelist 6 UUIDs, RPC security hardening (chặn anon/auth, cho phép service_role), RPC internal full re-validation & target scope check after FOR UPDATE row lock, backend ancestry validation, two-way null parity (gồm empty string trim), fixed type mapping, effective state merge, conditional target scope authorization, optimistic concurrency 409 conflict, và non-org legacy updates.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Thực thi restore backup cloud `database_backups/dump-postgres-202608071702.backup` trên Supabase Local Docker CLI DB, seed test users và chạy `pnpm --filter backend test:integration` & staged upgrade test `pnpm --filter backend test:integration:upgrade-052` với schema version 051 trước khi apply 052).
  - Manual test matrix toàn diện:
    1. Mode `create`: chọn từng nhánh (gồm cả nhánh cây thưa `Khối ➔ Phòng ban`, `BU ➔ Bộ phận`), kiểm tra payload gửi lên tại boundary `onSubmit`/API chứa đủ 12 field `khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su` & các `*_id`.
    2. Mode `edit`: load hồ sơ nhân sự cũ (bao gồm record legacy có text nhưng FK ID null, record tham chiếu node inactive `(Đã khóa)`). Sửa 1 field không liên quan (như SĐT) trên nhân sự legacy ➔ assert DB cho phép update thành công (grandfather org fields hiện hữu). Sửa đơn vị tổ chức ➔ enforce target EA scope & two-way null parity validation gate.
    3. Mode `transfer` & Approval E2E: Thay đổi đơn vị tổ chức ➔ Submit pending transfer (`PUT /api/employees/:id/personnel-pending`) ➔ Duyệt điều chuyển ở Pending Room (`PUT /api/employees/:id/submit`) ➔ Refetch nhân sự live và assert đủ 12 trường text & UUID FKs đúng chuỗi tổ chức mới.
    4. Non-Org Pending Approval: Duyệt pending đổi lương bởi approver không có EA scope Khối ➔ assert thành công.
    5. Search Unicode & Catalog Error Test: Gõ từ không dấu (ví dụ `phong`) kiểm tra kết quả lọc khớp từ có dấu (như `Phòng`). Giả lập lỗi API GET danh mục ➔ alert thông báo kèm nút "Thử lại".
    6. Per-button Quick Add Atomic Modal Test Matrix: Kiểm tra modal reset context atomic, disabled type select, per-button permission matrix và 503 SERVICE_UNAVAILABLE error handling.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-07 12:45 | Plan | Draft | Khởi tạo FEATURE_PLAN.md & FEATURE_TASKS.md | done | Chờ review gate |
| 2026-08-07 15:20 | Rebuttal | Rebuttal R1 | Cập nhật plan & tasks theo EFR-01 -> EFR-04 accepted | done | Cập nhật EFR fixes |
| 2026-08-07 15:25 | Rebuttal | Rebuttal R2 | Đồng bộ FEATURE_PLAN.md & mở rộng Quick Add test matrix + 503 handling theo EFR-05, EFR-06 | done | Plan & Tasks hội tụ R2 |
| 2026-08-07 15:32 | Rebuttal | Rebuttal R3 | Chuẩn hóa scope Quick Add 4 child types + Line Global, Per-button Permission Matrix, & Fallback Text-to-ID theo EFR-07, EFR-08, EFR-09 | done | Plan & Tasks hội tụ R3 |
| 2026-08-07 15:40 | Rebuttal | Rebuttal R4 | Thắt chặt Sequential Disambiguated Fallback Text-to-ID & chuẩn hóa 10 Khối KHOI_VALUES theo EFR-10, EFR-11 | done | Plan & Tasks hội tụ R4 |
| 2026-08-07 16:10 | Rebuttal | Rebuttal R5 | Bổ sung Form registration 12 fields, Quick Add Atomic Modal Lifecycle, Hydrate Inactive Nodes, & Pair-Consistency Validation Gate theo EFR-12 -> EFR-15 | done | Plan & Tasks hội tụ R5 |
| 2026-08-07 16:35 | Rebuttal | Rebuttal R6 | Bổ sung Migration 052 (Grandfather DB inactive FK & RPC submit_employee_pending 6 UUIDs whitelist), Root khoi_id Anchor Traversal, Submit Pair-Consistency Owner, & Disabled Modal Type Select theo EFR-16 -> EFR-20 | done | Plan & Tasks hội tụ R6 |
| 2026-08-07 16:45 | Rebuttal | Rebuttal R7 | Bổ sung Dual Migration Trees (database + supabase), fn_trg_employees_org_unit_sync name fix, Grandfather 6 FKs, Ancestry Alignment Gate & Scope-based Org Edit Guard theo EFR-21 -> EFR-25 | done | Plan & Tasks hội tụ R7 |
| 2026-08-07 16:58 | Rebuttal | Rebuttal R8 | Bổ sung Backend Authoritative Ancestry Validator, Phân tách Line Nhan Su khỏi chuỗi 5 FKs tổ chức, Backend Target Scope Enforcement, Catalog GET Error Recovery, & pnpm run test:integration theo EFR-26 -> EFR-30 | done | Plan & Tasks hội tụ R8 |
| 2026-08-07 17:05 | Rebuttal | Rebuttal R9 | Gộp SQL migrations vào 048 & 049 (không tạo 052 rác), dùng cloud DB dump 202608071702.backup cho test harness, validate create/onboard/PUT/pending 4 endpoints, fix pending path PUT /personnel-pending theo EFR-31 -> EFR-36 | done | Plan & Tasks hội tụ R9 |
| 2026-08-07 17:20 | Rebuttal | Rebuttal R10 | Phản biện REJECTED EFR-37 (gộp trực tiếp 048/049, không sinh 052 rác), chỉ định restore script DB backup cloud, gắn Target Scope Auth cho PUT /submit & submitFromPending(), định nghĩa Sparse Tree Ancestry (nearest non-null ancestor) & Effective State Merge cho pending theo EFR-37 -> EFR-41 | done | Plan & Tasks hội tụ R10 |
| 2026-08-07 17:28 | Rebuttal | Rebuttal R11 | Chuẩn hóa test command gate pnpm --filter backend test:integration:fresh + seed test users khi restore backup, submitEffectiveState cho PUT /submit, Fixed FK Type Mapping (khoi_id=khoi, bu_id=bu, phong_ban_id=phong_ban, bo_phan_id=bo_phan, nhom_team_id=nhom_team, line_nhan_su_id=line_nhan_su), & Two-Way Null Parity (text == null <=> UUID == null) theo EFR-42 -> EFR-46 | done | Plan & Tasks hội tụ R11 |
| 2026-08-07 17:35 | Rebuttal | Rebuttal R12 | Chấp nhận EFR-37 theo yêu cầu User: Khôi phục Migration forward 052_update_org_unit_triggers_and_pending_rpc.sql ở cả database/migrations và supabase/migrations (đồng bộ qua backend/scripts/sync-migrations.cjs) bảo đảm Upgrade Path cho Deployed DBs đã applied 048/049 | done | Plan & Tasks hội tụ R12 |
| 2026-08-07 17:40 | Rebuttal | Rebuttal R13 | Bổ sung OrgUnitCascadingSelect validation callback cho parent form (EFR-47), conditional target EA scope tại PUT /submit cho org diff (EFR-48), compensating forward migration 053 cho deployed DB rollback (EFR-49), staged migration test 052 (EFR-50), & bảo toàn SECURITY DEFINER / SET search_path = public / signatures cho migration 052 (EFR-51) theo EFR-47 -> EFR-51 | done | Plan & Tasks hội tụ R13 |
| 2026-08-07 17:44 | Rebuttal | Rebuttal R14 | Sửa chính xác signature tham số submit_employee_pending (p_ma_nhan_su, p_changed_by, p_temp_uuid) (EFR-52), chỉ định script test staged migration test:integration:staged (EFR-53), tách biệt updateEffectiveState cho direct PUT vs submitEffectiveState cho submit (EFR-54), & grandfathering legacy non-org updates khi không có org diff (EFR-55) theo EFR-52 -> EFR-55 | done | Plan & Tasks hội tụ R14 |
| 2026-08-07 17:50 | Rebuttal | Rebuttal R15 | DB trigger validation chỉ chạy khi TG_OP = 'INSERT' hoặc có FK diff (EFR-56), xử lý submit transaction atomic tránh TOCTOU (EFR-57), chuẩn hóa trim() === '' như null (EFR-58), đổi tên script staged test thành test:integration:upgrade-052 (EFR-59), & thêm line_nhan_su_id vào fallback text-to-ID (EFR-60) theo EFR-56 -> EFR-60 | done | Plan & Tasks hội tụ R15 |
| 2026-08-07 17:59 | Rebuttal | Rebuttal R16 | RPC submit_employee_pending security hardening REVOKE ALL FROM PUBLIC/GRANT TO service_role (EFR-61), & row locking SELECT ... FOR UPDATE atomic submit verification bên trong RPC body (EFR-62) theo EFR-61 -> EFR-62 | done | Plan & Rebuttal R16 |
| 2026-08-07 18:03 | Rebuttal | Rebuttal R17 | Target scope verification sau FOR UPDATE row lock bên trong submit_employee_pending RPC (EFR-63), & Optimistic Concurrency Control (updated_at compare-and-swap 409 Conflict) cho direct PUT (EFR-64) theo EFR-63 -> EFR-64 | done | Plan & Tasks hội tụ R17 |
| 2026-08-07 18:10 | Rebuttal | Rebuttal R18 | RPC submit_employee_pending re-runs full validation (two-way parity, canonical text matching, fixed mapping, DB ancestry) on locked submitEffectiveState & derives target scope from validated canonical root khoi_id (EFR-65) | done | Plan & Tasks hội tụ R18 |
| 2026-08-07 18:24 | Rebuttal | Rebuttal R19 | Staged Upgrade 051->052 test harness reset --version 051 (EFR-66), & Sửa canonical command path seed dev test users thành pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test (EFR-67) theo EFR-66 -> EFR-67 | done | Plan & Tasks hội tụ R19 |
| 2026-08-07 18:28 | Rebuttal | Rebuttal R20 | Sửa chính xác path của EmployeeEditPage.tsx thành frontend/src/pages/Employees/EmployeeEditPage.tsx (EFR-68) | done | Plan & Tasks hội tụ R20 |
> **Trạng thái**: ✅ Hoàn thành

| 2026-08-08 09:50 | Phase 1 | Task 1.1 & 1.Final | Tạo forward migration 052_update_org_unit_triggers_and_pending_rpc.sql và sync sang supabase/migrations | done | Phase 1 self-tested & completed |
| 2026-08-08 09:53 | Phase 2 | Tasks 2.1 - 2.Final | Refactor OrgUnitCascadingSelect.tsx & QuickAddOrgUnitModal.tsx hỗ trợ 5 cấp tổ chức + Unicode NFD search + Anchor Traversal + QuickAdd Modal | done | Phase 2 typechecked & completed |
| 2026-08-08 09:59 | Phase 3 | Tasks 3.1 - 3.Final | Cập nhật Backend API validation & scope auth, đăng ký 12 keys EmployeeForm, gỡ ô text dư thừa, cấu hình test script upgrade-052 | done | Phase 3 typecheck & build pass 100% |
| 2026-08-08 11:35 | Phase 4 | Manual UI & E2E | Manual UI test pass 100% các mode create, edit, transfer, target EA guard & cascading strict filters | done | User confirm pass all phases & ready for archive |
