# Feature Plan: Chuyển Đổi Form Nhân Sự Sang Search Dropdown Cho 5 Cấp Tổ Chức & Line Nhân Sự

<!-- Sửa theo EFR-01: Thuật toán Sparse Tree Traversal dựa trên anchor node gần nhất đã chọn thay vì lọc parent_id theo cấp cố định -->
<!-- Sửa theo EFR-02: Khai báo per-button Quick Add context với initialParentId bắt buộc cho child units và initialType/initialKhoi tương ứng -->
<!-- Sửa theo EFR-03: Sử dụng Unicode normalizer (NFD, strip combining marks, unaccent đ/Đ) cho tiếng Việt không phân biệt hoa thường/dấu cho 100% Selects -->
<!-- Sửa theo EFR-04: Mở rộng Test Strategy thành test matrix đủ 3 mode (create, edit, transfer), hydrate initial values, và assert payload 12 fields -->
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
<!-- Sửa theo EFR-21: Cập nhật đúng trigger function thực tế public.fn_trg_employees_org_unit_sync() -->
<!-- Sửa theo EFR-23: Mở rộng grandfathering & validation logic ở DB function fn_trg_employees_org_unit_sync() cho toàn bộ cả 6 UUID FK fields (khoi_id, bu_id, phong_ban_id, bo_phan_id, nhom_team_id, line_nhan_su_id) -->
<!-- Sửa theo EFR-24: Bổ sung Authoritative Ancestry & Alignment Validation Gate: kiểm tra các UUID FKs không những tồn tại mà phải tạo thành chuỗi phân cấp hợp lệ thuộc cùng root Khối trước khi submit/UPDATE DB -->
<!-- Sửa theo EFR-25: Enforce Scope-based Authorization trên EmployeeForm edit mode và API update: hạn chế chỉnh sửa trực tiếp tổ chức trong edit mode cho tài khoản không có quyền SA/EA target scope, yêu cầu thực hiện qua Transfer Workflow -->
<!-- Sửa theo EFR-26: Bổ sung Authoritative Ancestry Validator ở Backend API (backend/src/routes/employees.ts & employeeService.ts) và DB Trigger cho cả Create, Onboard, Update và Pending endpoints -->
<!-- Sửa theo EFR-27: Phân tách rõ ràng: Ancestry Alignment Gate chỉ áp dụng cho 5 FKs tổ chức (khoi_id -> bu_id -> phong_ban_id -> bo_phan_id -> nhom_team_id); validate line_nhan_su_id theo rule riêng (type = line_nhan_su, parent_id = NULL) -->
<!-- Sửa theo EFR-28: Sửa đúng path endpoint pending thành PUT /api/employees/:id/personnel-pending và phân định rõ authorization: khởi tạo pending dùng source scope/reviewer, duyệt pending / direct update org dùng target scope -->
<!-- Sửa theo EFR-29: Xử lý Catalog GET Failure trong OrgUnitCascadingSelect.tsx: hiển thị Alert thông báo kèm nút Retry, disable dropdowns nhưng vẫn giữ hydrated initial values -->
<!-- Sửa theo EFR-30: Chỉ định quy trình restore DB backup cloud database_backups/dump-postgres-202608071702.backup trước khi chạy pnpm --filter backend test:integration để test E2E DB trigger, RPC whitelist và API auth -->
<!-- Sửa theo EFR-37 (ACCEPTED & RE-INSTATED): Tạo Migration forward 052_update_org_unit_triggers_and_pending_rpc.sql ở cả database/migrations và supabase/migrations (đồng bộ qua backend/scripts/sync-migrations.cjs) để bảo tồn Upgrade Path cho Deployed DBs (staging/cloud) đã apply 048/049 -->
<!-- Sửa theo EFR-38: Cấu hình quy trình restore DB backup cloud bằng script ./scripts/restore-local-db.ps1 database_backups/dump-postgres-202608071702.backup trước khi chạy test integration suite -->
<!-- Sửa theo EFR-39: Áp dụng Target Scope Authorization Policy cho endpoint duyệt/apply pending thực tế PUT /api/employees/:id/submit và submitFromPending() trong employeeService.ts -->
<!-- Sửa theo EFR-40: Định nghĩa thuật toán Sparse Tree Ancestry Alignment: mỗi FK non-null chọn lựa phải có parent_id bằng ID của node non-null gần nhất trước đó (nearest non-null ancestor), áp dụng đồng nhất ở FE, BE và DB trigger -->
<!-- Sửa theo EFR-41: Xây dựng hợp đồng Effective State Merge (effectiveState = live employee + existing pending_changes + current patch) trước khi validate pair-consistency, text-matching và target scope cho PUT /api/employees/:id/personnel-pending -->
<!-- Sửa theo EFR-42 & EFR-43: Bắt buộc dùng Supabase Local Docker CLI Harness nạp restore file backup cloud database_backups/dump-postgres-202608071702.backup qua script ./scripts/restore-local-db.ps1 và seed test users pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test trước khi chạy integration tests -->
<!-- Sửa theo EFR-44: Xây dựng submitEffectiveState = live employee + pending_changes cho PUT /api/employees/:id/submit trước khi validate ancestry, text matching và target scope -->
<!-- Sửa theo EFR-45: Bổ sung validation mapping cố định org-unit type cho từng FK: khoi_id=khoi, bu_id=bu, phong_ban_id=phong_ban, bo_phan_id=bo_phan, nhom_team_id=nhom_team, line_nhan_su_id=line_nhan_su ở FE, BE và DB trigger -->
<!-- Sửa theo EFR-46: Enforce Pair-Consistency hai chiều (text == null <=> UUID == null) và canonical name equality cho cả 6 cặp trường tổ chức ở FE và BE -->
<!-- Sửa theo EFR-47: OrgUnitCascadingSelect.tsx cung cấp catalog metadata/validation callback để EmployeeForm.handleSubmit validate type mapping & sparse tree ancestry trước khi submit -->
<!-- Sửa theo EFR-48: Phân định Target Scope EA Authorization tại PUT /submit chỉ kích hoạt khi submitEffectiveState có diff trên 12 org fields -->
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
<!-- Sửa theo EFR-68: Sửa chính xác path của EmployeeEditPage.tsx thành frontend/src/pages/Employees/EmployeeEditPage.tsx trong affected files table và rollback runbook -->

> **Trạng thái**: ✅ Hoàn thành
> **Review gate**: ✅ ĐÃ DUYỆT - Cho phép thực thi
> **Feature slug**: org-unit-select-employee-form
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-08-07

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Vừa qua feature `2026-08-05-org-units-management-hierarchy` đã xây dựng danh mục tổ chức 5 tầng (`Khối` ➔ `BU` ➔ `Phòng ban` ➔ `Bộ phận` ➔ `Nhóm team`) và `Line Nhân sự` độc lập tại backend DB & API. Tuy nhiên, trên UI form nhập mới/chỉnh sửa hồ sơ nhân sự (`EmployeeForm.tsx`), việc chọn danh mục chưa được triển khai hoàn chỉnh.
- **Vấn đề cần giải quyết:** 
  1. Trong `EmployeeForm.tsx`, tại Card *"Quản lý & Hợp đồng"*, vẫn còn tồn tại ô gõ text tự do dư thừa `<Form.Item label="Line nhân sự" name="line_nhan_su"><Input /></Form.Item>`.
  2. Component `OrgUnitCascadingSelect.tsx` hiện mới chỉ code cứng 3 dropdown (`Khối`, `Phòng ban`, `Line nhân sự`), hoàn toàn thiếu 3 cấp tổ chức: `BU`, `Bộ phận`, `Nhóm team` và chưa xử lý đầy đủ luồng nối tầng phân cấp (cascading) kèm Traversal Cây Thưa (Sparse UI Traversal).
  3. RPC `submit_employee_pending` (trong `044`/`049`) chưa whitelist 6 UUID FKs nên luồng duyệt điều chuyển (Pending Transfer Approval) hiện bỏ qua các UUIDs. Đồng thời trigger DB `fn_trg_employees_org_unit_sync` đang chặn edit các hồ sơ cũ giữ nguyên đơn vị inactive cho cả 6 FKs.
- **Mục tiêu:** 
  - Nâng cấp `OrgUnitCascadingSelect.tsx` hiển thị và chọn nối tầng linh hoạt đủ 5 cấp tổ chức (**Khối ➔ BU ➔ Phòng ban ➔ Bộ phận ➔ Nhóm team**) + **Line Nhân sự** dưới dạng **Searchable Select** (hỗ trợ tìm kiếm tiếng Việt không dấu NFD, Anchor Traversal theo root `khoi_id`, Catalog GET Failure Alert & Retry) kèm nút Quick Add `+` cho 4 child levels và Line Nhân sự (khoá `type` không cho tạo Root Khối qua flow này để bảo vệ `KHOI_VALUES` tĩnh).
  - Tạo Migration forward `052_update_org_unit_triggers_and_pending_rpc.sql` (đồng bộ ở cả `database/migrations` và `supabase/migrations` qua `backend/scripts/sync-migrations.cjs`) bảo toàn nguyên vẹn function signatures (`submit_employee_pending(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)`), `SECURITY DEFINER` & `SET search_path = public` để whitelist 6 UUID FKs trong `submit_employee_pending` RPC, grandfather cả 6 FKs inactive không đổi trong `fn_trg_employees_org_unit_sync()`, kiểm tra tính hợp lệ của chuỗi phân cấp 5 tầng Sparse Tree Ancestry Alignment độc lập với Line nhân sự global (chỉ kích hoạt khi `TG_OP = 'INSERT'` hoặc có FK thay đổi), và thắt chặt security contract (`REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role`), đảm bảo Upgrade Path cho Deployed/Cloud DBs đã đánh dấu applied 048/049.
  - Phân định và Enforce Scope-based Authorization trên cả Frontend `EmployeeForm.tsx` & Backend API (`backend/src/routes/employees.ts`): ở edit mode, chỉ SA/EA có target scope permission mới được sửa trực tiếp tổ chức; các tài khoản khác khi đổi tổ chức phải qua luồng Điều chuyển (`PUT /api/employees/:id/personnel-pending`). Duyệt/apply điều chuyển (`PUT /api/employees/:id/submit`) và direct update (`PUT /api/employees/:id`) áp dụng target SA/EA scope khi `submitEffectiveState` hoặc `updateEffectiveState` có diff trên các trường tổ chức, thực thi row lock `SELECT ... FOR UPDATE`, re-run full validation (parity, text matching, fixed mapping, DB ancestry) và verification target scope theo canonical root `khoi_id` đối với `p_changed_by` atomic bên trong RPC transaction body để triệt để chống TOCTOU race condition. Direct `PUT` thực thi optimistic concurrency check (`updated_at` compare-and-swap) trả về `409 Conflict` nếu dữ liệu đã bị sửa đổi đồng thời.
  - Loại bỏ hoàn toàn ô gõ text tự do `Line nhân sự` dư thừa ở Card *"Quản lý & Hợp đồng"* trong `EmployeeForm.tsx`.
- **Kết quả mong đợi:** 
  - Khi nhập liệu trên `EmployeeForm.tsx` (tạo mới, chỉnh sửa, điều chuyển), 100% các trường đơn vị tổ chức và Line nhân sự được chọn qua Search Dropdown từ danh mục chuẩn. Dual-write lưu đồng thời cả Text Labels và UUID FKs (12 trường) thông qua đăng ký Form.Item fields đầy đủ. Hỗ trợ hydrate chính xác cả hồ sơ legacy (dữ liệu inactive & text-to-ID fallback 6 trường bao gồm `line_nhan_su_id`), áp dụng two-way null parity (chuẩn hóa `trim() === ''` như null) & ancestry validation gate trước khi submit ở `EmployeeForm.handleSubmit` (thông qua validation callback của `OrgUnitCascadingSelect`) và backend API cho cả create/onboard/update/pending/submit, đồng thời duyệt điều chuyển thành công 12 trường qua `submit_employee_pending` an toàn.

---

## 2. Phạm vi

### In scope
- **Cập nhật `OrgUnitCascadingSelect.tsx`**:
  - Load danh mục active từ API `orgUnitApi.getOrgUnits({ is_active: true })` đồng thời nạp bổ sung các node inactive đang được record nhân sự hiện tại tham chiếu (hiển thị nhãn kèm tag `(Đã khóa)` để hydrate đúng lịch sử nhưng chỉ cho phép chọn sang node active mới).
  - Thêm xử lý **Catalog GET Failure Error State**: Hiển thị Antd `Alert` thông báo lỗi kèm nút "Thử lại", disable các Select dropdown cho đến khi nạp catalog thành công nhưng vẫn bảo toàn hydrated initial values.
  - Hiển thị Select Search cho 5 cấp tổ chức: Khối (chọn từ danh sách 10 Khối chuẩn `KHOI_VALUES`), BU, Phòng ban, Bộ phận, Nhóm team, và 1 Select Search cho Line Nhân sự.
  - Triển khai **Sparse Tree Anchor Traversal**: Khi chọn Khối, resolve root `khoi_id` và luôn lọc `parent_id === anchorNode.id` (không dùng ngoại lệ `khoi === selectedKhoi` tránh lộ các node con thuộc depth sâu hơn). Mỗi node non-null chọn lựa phải có `parent_id` bằng ID của nearest non-null ancestor trước đó.
  - Reset đồng thời cả Text Label lẫn UUID FK của toàn bộ các cấp hậu duệ khi bất kỳ cấp cha nào thay đổi.
  - Áp dụng Unicode normalizer (`NFD`, strip combining marks, unaccent `đ/Đ`) cho `filterOption` của 100% Selects (hỗ trợ tìm tiếng Việt không dấu).
  - Triển khai **Per-button Permission Matrix**:
    - `canQuickAddChild`: Cần `anchorNode.id != null` và (SuperAdmin HOẶC EA đúng `anchorNode.khoi`).
    - `canQuickAddLine`: SuperAdmin HOẶC có bất kỳ quyền EA nào (truyền `parent_id = null`).
  - Xây dựng cơ chế **Sequential Disambiguated Fallback Text-to-ID Resolution**: Khi hydrate hồ sơ legacy có text label nhưng FK ID rỗng, thực hiện resolve tuần tự top-down (`khoi_id` ➔ `bu_id` ➔ `phong_ban_id` ➔ `bo_phan_id` ➔ `nhom_team_id` ➔ `line_nhan_su_id`). Chỉ tự động gắn FK ID khi có **đúng 1 candidate active** khớp đồng thời `(type, normalized_name, khoi, parent_id)` của anchor cha đã resolve. Nếu có 0 hoặc nhiều hơn 1 candidate (tên trùng dưới nhiều phòng ban khác nhau như `bgd`, `social`, `app`), giữ nguyên FK ID = null để người dùng chọn/xác nhận rõ ràng.
  - Cung cấp **Catalog Context / Validation Callback** `validateOrgUnitValues(values)` cho `EmployeeForm.tsx` để parent form validate fixed type mapping, two-way null parity (chuẩn hóa `trim() === ''` thành null) và nearest-parent ancestry trước khi submit.
  - Trả về payload `onChange` chuẩn chứa 12 trường: `khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su` và `khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`.
- **Cập nhật `QuickAddOrgUnitModal.tsx`**:
  - Triển khai **Atomic Modal Lifecycle Contract**: Dùng `useEffect` / `form.resetFields()` đồng bộ lại atomic create-context `{ type, khoi, parentId }` mỗi khi prop `open` chuyển sang `true` hoặc context thay đổi, loại bỏ việc lưu rác state từ lần mở trước.
  - Khóa dropdown `type` ở chế độ disabled / read-only theo nút `+` đã bấm (chỉ cho phép tạo 4 child types `bu`, `phong_ban`, `bo_phan`, `nhom_team` hoặc `line_nhan_su`), validate `parent_id` bắt buộc đối với đơn vị con, riêng Line nhân sự gửi `parent_id = null`.
  - Xử lý các HTTP status code từ API: 201 (Thành công), 400 (Bad Request), 403 (Forbidden), 404 (Not Found), và **503 SERVICE_UNAVAILABLE** (khi mutation mode `disabled` ➔ hiển thị thông báo phù hợp và giữ nguyên dữ liệu/context trong modal để user thử lại).
- **Cập nhật `EmployeeForm.tsx` & `frontend/src/pages/Employees/EmployeeEditPage.tsx`**:
  - Gỡ bỏ ô `<Input>` gõ text tự do `Line nhân sự` dư thừa tại dòng 514-518.
  - **Đăng ký đầy đủ 12 Form Fields**: Đăng ký cả 12 field tổ chức & line nhân sự bằng `<Form.Item name="..." noStyle>` hoặc merge `form.getFieldsValue(true)` tại boundary `handleSubmit` để Ant Design `Form.onFinish` thu gom đầy đủ 12 trường vào payload submit ở cả 3 mode (`create`, `edit`, `transfer`).
  - **Thực thi Two-Way Null Parity & Separate Sparse Ancestry Validation Gate**: Đặt logic kiểm tra trong `handleSubmit` trước khi gọi `onSubmit` (thông qua validation callback của `OrgUnitCascadingSelect`):
    1. Kiểm tra 2 chiều: text == null <=> UUID == null cho 6 cặp trường (chuẩn hóa `trim() === ''` như null); nếu có text label nhưng FK ID null (do ambiguous match) hoặc có UUID nhưng thiếu text, hiển thị lỗi và chặn `onSubmit`.
    2. Kiểm tra tính đồng bộ chuỗi phân cấp Sparse Tree (mỗi FK ID chọn lựa phải có `parent_id` bằng nearest non-null ancestor và đúng type mapping). Phân tách `line_nhan_su_id` kiểm tra riêng (phải là global line có `parent_id = NULL`).
  - **Scope-based Org Edit Enforcement**: Trong edit mode, disable chỉnh sửa các dropdown tổ chức đối với user không có quyền SA/EA trên Khối hiện tại/Khối mới, hướng dẫn user chuyển sang luồng Điều chuyển (`PUT /api/employees/:id/personnel-pending`).
- **Cập nhật Backend API (`backend/src/routes/employees.ts` & `backend/src/services/employeeService.ts`)**:
  - **Authoritative Backend Ancestry, Text Matching & Effective State Merge**: Áp dụng cho 5 endpoints (`POST /api/employees`, `POST /api/employees/onboard`, `PUT /api/employees/:id`, `PUT /api/employees/:id/personnel-pending`, `PUT /api/employees/:id/submit`):
    1. Trên create/onboard: luôn thực thi 100% full validation (two-way null parity với `trim() === ''` mapped sang null, fixed type mapping, text matching & sparse tree ancestry).
    2. Trên update/pending/submit: tính toán `updateEffectiveState = live + parsed patch` cho direct PUT, `effectiveState = live + pending + patch` cho pending, và `submitEffectiveState = live + pending` cho submit. Kích hoạt full org validation KHI VÀ CHỈ KHI effective state tương ứng có diff trên 12 trường tổ chức so với live data. Nếu không có org diff (ví dụ chỉ đổi SĐT/lương trên hồ sơ legacy), grandfather các trường tổ chức hiện hữu mà không chặn request.
    3. Enforce Fixed Type Mapping cho từng FK: `khoi_id -> type='khoi'`, `bu_id -> type='bu'`, `phong_ban_id -> type='phong_ban'`, `bo_phan_id -> type='bo_phan'`, `nhom_team_id -> type='nhom_team'`, `line_nhan_su_id -> type='line_nhan_su'`.
  - **Target Scope Authorization Policy & Atomic Execution**:
    1. Khởi tạo pending transfer (`PUT /personnel-pending`): Người dùng chỉ cần scope Khối nguồn (source Khối EA) hoặc quyền reviewer.
    2. Duyệt/apply pending transfer (`PUT /submit` & `submitFromPending`): Sau `SELECT ... FOR UPDATE` row lock trong RPC `submit_employee_pending`, RPC tính toán `submitEffectiveState`, thực thi re-validation toàn bộ 12 fields (two-way null parity, canonical text matching, fixed mapping, active/new-assignment, sparse ancestry & global line) và kiểm tra target SA/EA scope của `p_changed_by` đối với target canonical root `khoi_id` trước khi apply.
    3. Sửa trực tiếp tổ chức (direct `PUT /api/employees/:id`): Sử dụng Optimistic Concurrency Control (`updated_at` compare-and-swap) trả về HTTP `409 Conflict` nếu record bị sửa đổi bởi request khác trong quá trình authorization.
- **Tạo Migration forward 052 (đồng bộ ở cả `database/migrations` và `supabase/migrations`)**:
  - [database/migrations/052_update_org_unit_triggers_and_pending_rpc.sql](file:///d:/ToolNhanSuVcc/database/migrations/052_update_org_unit_triggers_and_pending_rpc.sql) & [supabase/migrations/052_update_org_unit_triggers_and_pending_rpc.sql](file:///d:/ToolNhanSuVcc/supabase/migrations/052_update_org_unit_triggers_and_pending_rpc.sql):
    1. `CREATE OR REPLACE FUNCTION public.fn_trg_employees_org_unit_sync()` bảo toàn nguyên vẹn signature, `SECURITY DEFINER` và `SET search_path = public`, grandfather cả 6 FKs inactive không đổi (`TG_OP = 'INSERT' OR NEW.<fk> IS DISTINCT FROM OLD.<fk>`), kiểm tra gán mới FK inactive. Kích hoạt fixed FK type mappings và 5-FK Sparse Tree Ancestry + global line rules KHI `TG_OP = 'INSERT'` HOẶC có ít nhất 1 trong 6 FKs thay đổi (`NEW.<fk> IS DISTINCT FROM OLD.<fk>`).
    2. Redefine RPC `submit_employee_pending` bảo toàn chính xác signature `(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)`, return type `JSONB`, `SECURITY DEFINER`, `SET search_path = public`, owner postgres. Bổ sung 6 UUID FKs (`khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`) vào whitelist và cast sang `UUID` để apply đầy đủ 12 trường khi duyệt điều chuyển. Sau `SELECT ... FOR UPDATE`, re-run full validation (two-way null parity, canonical text matching, fixed mapping, active/new-assignment rule, sparse ancestry) và thực thi kiểm tra target SA/EA scope theo `p_changed_by` đối với canonical root `khoi_id` nếu pending có thay đổi tổ chức.
    3. Thắt chặt Security Hardening cho RPC: Thực thi `REVOKE ALL ON FUNCTION public.submit_employee_pending(VARCHAR, TEXT, UUID) FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION public.submit_employee_pending(VARCHAR, TEXT, UUID) TO service_role;`.

### Out of scope
- Không sửa trực tiếp file migration cũ `048` và `049` đã deployed.
- Không mở rộng Quick Add Root Khối trên EmployeeForm (Root Khối là 10 machine keys bất biến `KHOI_VALUES` quản lý ở Admin Page).

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Monorepo + Ant Design v6 theme (KNOWLEDGE_BASE: UI Architecture). Không dùng Tailwind.
  - Dual-write (Text Labels + UUID FKs) cho dữ liệu tổ chức nhân sự để duy trì tính bất biến snapshot và tương thích ngược.
  - Root Khối Machine Key Immutability (`KHOI_VALUES` 10 Khối machine keys bất biến).
  - Atomic Submit RPC: Mọi tác vụ duyệt hồ sơ/điều chuyển (Submit) đều dùng SQL Function `SECURITY DEFINER` thực hiện transaction đa bảng.
  - Single Source of Truth cho types và Zod schemas từ `@vcc/shared`.
- **"Cấm kỵ" cần tránh:** 
  - Không sửa trực tiếp các migration đã deployed (`048`, `049`) làm hỏng upgrade path trên Deployed DBs.
  - Không cho phép gõ text tự do trên UI ở các trường đã có danh mục chuẩn hóa.
  - Không xóa các trường FK UUIDs khỏi payload khi submit form hoặc khi duyệt điều chuyển pending.
  - Không cho phép tạo Root Khối động trên EmployeeForm làm lệch `KHOI_VALUES` enum schema và RBAC mappings.
  - Không cấp EXECUTE RPC `submit_employee_pending` cho PUBLIC/anon/authenticated client direct call.
- **Ràng buộc kiến trúc liên quan:** 
  - UI `OrgUnitCascadingSelect` phải đồng bộ 100% với Zod schema `createEmployeeSchema` & `updateEmployeeSchema` trong `@vcc/shared`.

---

## 4. Giả định và câu hỏi mở

### Giả định
- Tất cả danh mục `org_units` đã được seed và sẵn sàng ở DB qua backend API `/api/org-units`.
- Người dùng có quyền EA/SA sẽ nhìn thấy nút `+` để thêm nhanh đơn vị mới nếu danh mục chưa có sẵn.
- **Bắt buộc dùng Supabase Local Docker CLI Harness** cho integration testing: restore từ file cloud backup `database_backups/dump-postgres-202608071702.backup` qua `./scripts/restore-local-db.ps1` và seed test users `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test` trước khi thực thi `pnpm --filter backend test:integration`.

### Câu hỏi mở
- None (Yêu cầu kỹ thuật và phạm vi giao diện đã hoàn toàn rõ ràng).

---

## 5. Acceptance Criteria

- [ ] [UI Dropdown & Anchor Traversal] `OrgUnitCascadingSelect.tsx` hiển thị đầy đủ các Searchable Dropdown cho Khối (10 Khối `KHOI_VALUES`), BU, Phòng ban, Bộ phận, Nhóm team và Line nhân sự; lọc đúng direct children qua root `khoi_id` mà không bị lộ các descendants ở depth sâu hơn.
- [ ] [Catalog Failure Recovery] Khi API nạp danh mục gặp lỗi (GET failure), hiển thị Antd `Alert` thông báo lỗi kèm nút "Thử lại", disable các ô chọn nhưng vẫn bảo toàn hydrated initial values.
- [ ] [Searchable Unicode] Mỗi dropdown hỗ trợ lọc theo từ khóa tiếng Việt không dấu (NFD normalizer, `đ/Đ` ➔ `d/D`) khi gõ vào box.
- [ ] [Cascading & Sparse Traversal] Chọn cấp cha tự động lọc đúng danh mục cấp con dựa trên Anchor Traversal; khi thay đổi cấp cha, toàn bộ nhãn và UUID hậu duệ bị reset; nếu cấp trung gian không có node con, tự động cho phép chọn trực tiếp cấp tiếp theo có dữ liệu (nearest non-null ancestor).
- [ ] [Per-button Permission & Atomic Quick Add Modal] Nút `+` Quick Add hiển thị đúng theo per-button permission matrix (child = SA/EA đúng `anchorNode.khoi` + có `anchorNode.id`; Line = SA/any-EA); modal khoá disabled `type` theo nút bấm và đồng bộ reset context atomic mỗi lần mở (`open = true`); xử lý đúng 503/403/400.
- [ ] [Form Registration & Dual-write 3 Modes] `EmployeeForm.tsx` đăng ký đủ 12 trường với Form store; khi submit trên cả 3 mode (`create`, `edit`, `transfer`), Ant Form `onFinish` thu gom và gửi đầy đủ 12 giá trị text & UUID FKs; hỗ trợ hydrate node inactive và fallback resolve text-to-ID tuần tự top-down (gồm cả `line_nhan_su_id`).
- [ ] [Two-Way Null Parity, Type Mapping & Conditional Target Scope] Frontend `EmployeeForm.handleSubmit` (qua validation callback) & Backend API (`employees.ts` cho 5 endpoints create/onboard/PUT/pending/submit) kiểm tra two-way null parity (`text == null <=> UUID == null` với `trim() === ''` mapped sang null), fixed type mapping cho từng FK, effective state merge và Sparse Tree ancestry alignment; ở submit/update mode, chỉ enforce SA/EA target scope & org validation khi effective state có diff trên các trường tổ chức, xử lý atomic trong DB transaction (với target scope check sau row lock) tránh TOCTOU và optimistic concurrency `409` cho direct PUT.
- [ ] [Forward Migration 052 & Security Hardening] Tạo forward migration `052_update_org_unit_triggers_and_pending_rpc.sql` ở cả `database/migrations` và `supabase/migrations` bảo toàn chính xác signature `(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)`, return types, `SECURITY DEFINER` và `SET search_path = public`, grandfather 6 FKs inactive không đổi trong `public.fn_trg_employees_org_unit_sync()`, whitelist đủ 6 UUID FKs trong `submit_employee_pending` RPC, và thực thi `REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role;`; duyệt điều chuyển pending cập nhật trọn vẹn 12 trường live.
- [ ] [Clean UI] Ô `<Input>` gõ text tự do `Line nhân sự` dư thừa ở Card *"Quản lý & Hợp đồng"* trong `EmployeeForm.tsx` đã được xóa bỏ hoàn toàn.
- [ ] [Automated Supabase Docker Test Harness Verification] Bắt buộc chạy Supabase Local Docker CLI Harness nạp bản backup mới nhất `database_backups/dump-postgres-202608071702.backup` qua `./scripts/restore-local-db.ps1 database_backups/dump-postgres-202608071702.backup` và seed test users `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test` trước khi thực thi `pnpm --filter backend test:integration` và staged upgrade test `pnpm --filter backend test:integration:upgrade-052` (reset `--version 051`, restore data, apply 052, assert anon/authenticated direct RPC call bị từ chối), `pnpm run build` và `pnpm run typecheck` vượt qua 100% không có lỗi.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/052_update_org_unit_triggers_and_pending_rpc.sql` & `supabase/migrations/052_update_org_unit_triggers_and_pending_rpc.sql` | Tạo Mới | Forward migration cập nhật `public.fn_trg_employees_org_unit_sync()` (grandfather 6 FKs, type mapping & DB ancestry khi có FK diff) và RPC `submit_employee_pending` (whitelist 6 UUID FKs, re-run full org validation & target scope check theo canonical khoi_id sau row lock FOR UPDATE, security hardening REVOKE PUBLIC/GRANT service_role) bảo toàn security definitions và tham số chuẩn `(p_ma_nhan_su, p_changed_by, p_temp_uuid)` | 🔴 High | Có |
| `backend/src/routes/employees.ts` | Sửa | Authoritative Ancestry, Two-Way Null Parity, Fixed Type Mapping, Effective State Merge, Optimistic Concurrency Control (409 Conflict) & Conditional Target Scope Enforcement cho create, onboard, PUT update, pending & submit endpoints | 🔴 High | Có |
| `backend/src/services/employeeService.ts` | Sửa | Authoritative Ancestry validation helper, effective state merge, atomic submit transaction & conditional target scope check cho submitFromPending | 🔴 High | Có |
| `frontend/src/components/common/OrgUnitCascadingSelect.tsx` | Refactor | Bổ sung 5 cấp tổ chức + Anchor Traversal chuẩn root khoi_id + Unicode search + Per-button permission matrix + Sequential Disambiguated Fallback Text-to-ID (thêm line_nhan_su_id) + Hydrate Inactive + Catalog GET Failure Alert & Retry + Validation Callback for Parent Form | 🟡 Medium | Có |
| `frontend/src/components/common/QuickAddOrgUnitModal.tsx` | Sửa | Thêm prop `initialParentId`, Atomic Modal Lifecycle Contract reset context khi open, khóa type disabled theo nút bấm, và giữ context khi nhận 503/403 | 🟡 Medium | Có |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Gỡ ô Input text line_nhan_su dư thừa, đăng ký 12 keys với Form store, thực thi Two-Way Null Parity & Separate Sparse Ancestry Validation Gate (qua validation callback) và Scope Edit Guard trong handleSubmit | 🟡 Medium | Có |
| `frontend/src/pages/Employees/EmployeeEditPage.tsx` | Sửa | Disable direct org edit khi không đủ SA/EA target scope, chuyển hướng sang Transfer Workflow | 🟡 Medium | Có |
| `backend/package.json` & `scripts/` | Sửa | Bổ sung npm script / test harness `test:integration:upgrade-052` cho staged migration 052 test từ DB version 051 | 🟡 Medium | Có |
| `backend/src/__tests__/integration/employee.test.ts` | Sửa | Bổ sung integration test cases cho 6 FKs grandfathering, pending whitelist 6 UUIDs, RPC security hardening (reject anon/auth, allow service-role), RPC internal full re-validation & target scope check after FOR UPDATE row lock, backend ancestry validation, two-way null parity, effective state merge, conditional target scope authorization, optimistic concurrency 409 conflict, và non-org legacy updates | 🟡 Medium | Có |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
  - Dual Migration Tree Sync: Cần đảm bảo file `052` có nội dung 100% giống nhau ở cả `database/migrations` and `supabase/migrations` (đồng bộ qua `node backend/scripts/sync-migrations.cjs`).
  - RPC Parameter Names & Grants: Đảm bảo `052` giữ nguyên tham số `(p_ma_nhan_su VARCHAR(20), p_changed_by TEXT, p_temp_uuid UUID DEFAULT NULL)` và thắt chặt security execution `REVOKE PUBLIC / GRANT service_role`.
  - Function Security Attributes: Đảm bảo `052` giữ nguyên `SECURITY DEFINER` và `SET search_path = public` cho cả trigger function và submit RPC.
  - Grandfathering Legacy Non-Org Updates: Chỉ enforce org validation & target EA scope trên update/pending/submit KHI có org diff so với live employee data; DB trigger chỉ validate khi `TG_OP = 'INSERT'` hoặc có FK diff.
  - Atomic Submit Transaction inside RPC: Đảm bảo re-run full validation và target scope check theo canonical root `khoi_id` thực hiện sau `SELECT ... FOR UPDATE` row lock trong RPC body.
  - Optimistic Concurrency Control: Direct `PUT` dùng `updated_at` compare-and-swap trả về HTTP 409 khi stale.
  - Two-Way Null Parity & String Normalization: Chuẩn hóa `trim() === ''` sang null đồng nhất trên FE/BE.
  - Supabase Local Docker CLI Harness Restoration: Restore từ `database_backups/dump-postgres-202608071702.backup` qua `./scripts/restore-local-db.ps1`, seed dev users bằng canonical path `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test` và staged upgrade từ version 051 trước khi test integration.
- **Review focus areas:** 
  - `052` SQL logic ở cả 2 thư mục migrations.
  - Ancestry, Effective State, Atomic Submit inside RPC & Target scope validation trong `backend/src/routes/employees.ts` và `employeeService.ts`.
  - `handleSubmit` boundary validation & scope guard trong `EmployeeForm.tsx`.
  - Anchor traversal lọc theo root `khoi_id` và fallback text-to-ID (bao gồm `line_nhan_su_id`) trong `OrgUnitCascadingSelect.tsx`.
- **Known pitfalls / historical issues:** 
  - Dual migration trees (`database/migrations` vs `supabase/migrations`) có nguy cơ drift nếu không dùng script `sync-migrations.cjs`.
- **Dependencies / rollout concerns:** 
  - Restore DB cloud backup `database_backups/dump-postgres-202608071702.backup` và seed test users trước khi chạy `pnpm --filter backend test:integration` và `pnpm --filter backend test:integration:upgrade-052`.

---

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Tạo Migration forward `052_update_org_unit_triggers_and_pending_rpc.sql` ở cả `database/migrations` và `supabase/migrations` via `node backend/scripts/sync-migrations.cjs` (`public.fn_trg_employees_org_unit_sync()` grandfather 6 FKs inactive + fixed FK type mapping + DB Sparse Tree ancestry validation khi có FK diff + whitelist 6 UUID FKs trong RPC `submit_employee_pending`, re-run full org validation và target scope check theo canonical `khoi_id` sau `SELECT ... FOR UPDATE` row lock, bảo toàn signature tham số `(p_ma_nhan_su, p_changed_by, p_temp_uuid)`, `SECURITY DEFINER`, `SET search_path = public`, và thực thi `REVOKE PUBLIC/GRANT service_role`).
  - Phase 2: Refactor `OrgUnitCascadingSelect.tsx` & `QuickAddOrgUnitModal.tsx` (Anchor Traversal chuẩn root khoi_id, Unicode NFD search, Per-button permission matrix, Sequential Disambiguated Fallback text-to-ID cho cả 6 fields gồm `line_nhan_su_id`, Hydrate inactive nodes, Catalog GET failure Alert & Retry, Validation Callback for parent form, và Quick Add Atomic Modal Lifecycle + disabled type + 503 error preservation).
  - Phase 3: Cập nhật Backend API (`backend/src/routes/employees.ts` & `employeeService.ts`), Frontend `EmployeeForm.tsx` & `frontend/src/pages/Employees/EmployeeEditPage.tsx` (xóa ô text input dư thừa, đăng ký 12 Form.Item keys, thực thi Two-Way Null Parity với `trim() === ''` mapped sang null, Fixed Type Mapping & Separate Sparse Ancestry Validation Gate cùng Scope Edit Guard ở cả FE/BE cho 5 endpoints, conditional target scope auth tại submit & direct PUT, optimistic concurrency 409 cho direct PUT, atomic submit transaction inside RPC, grandfathering legacy non-org updates, effective state merge cho pending & submit, hydrate/submit 12 fields cho 3 modes) và chạy test harness trên Supabase Local Docker CLI khôi phục từ cloud dump `database_backups/dump-postgres-202608071702.backup` (`pnpm --filter backend test:integration` & `pnpm --filter backend test:integration:upgrade-052`).
- **Thứ tự triển khai:** Phase 1 ➔ Phase 2 ➔ Phase 3 ➔ Automated Integration Harness & Build Check.

---

## 9. Test Strategy

- **Automated tests (Bắt buộc dùng Supabase Local Docker CLI Harness & Cloud Dump `database_backups/dump-postgres-202608071702.backup`):** 
  - Step 1: Execute restore script trên Supabase Local Docker DB:
    `powershell -ExecutionPolicy Bypass -File ./scripts/restore-local-db.ps1 database_backups/dump-postgres-202608071702.backup`
  - Step 2: Seed dev test users bằng canonical command path:
    `pnpm --filter backend exec tsx scripts/seed_dev_users.ts --test`
  - Step 3: Run full integration suite:
    `pnpm --filter backend test:integration` (verify DB trigger grandfathering 6 FKs, RPC pending whitelist & security hardening REVOKE PUBLIC/GRANT service_role, backend ancestry, two-way null parity, effective state merge, optimistic concurrency 409 conflict, atomic full re-validation & target scope check inside RPC)
  - Step 4: Run staged migration upgrade verification 051 ➔ 052:
    `npx supabase db reset --version 051` ➔ restore data dump ➔ seed test users ➔ apply migration 052 ➔ `pnpm --filter backend test:integration:upgrade-052`
  - Step 5: Run typecheck and build gates:
    `pnpm run typecheck`
    `pnpm run build`
- **Manual verification matrix:** 
  1. Mode `create`: chọn từng nhánh (gồm cả nhánh cây thưa `Khối ➔ Phòng ban`, `BU ➔ Bộ phận`), kiểm tra payload gửi lên tại boundary `onSubmit`/API chứa đủ 12 field `khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su` & các `*_id`.
  2. Mode `edit`: load hồ sơ nhân sự cũ (bao gồm record legacy có text nhưng FK ID null, record tham chiếu node inactive `(Đã khóa)`). Sửa 1 field không liên quan (như SĐT) trên nhân sự legacy ➔ assert DB cho phép update thành công (grandfather org fields hiện hữu). Sửa đơn vị tổ chức ➔ enforce target EA scope & two-way null parity validation gate.
  3. Mode `transfer` & Approval E2E: Thay đổi đơn vị tổ chức ➔ Submit pending transfer (`PUT /api/employees/:id/personnel-pending`) ➔ Duyệt điều chuyển ở Pending Room (`PUT /api/employees/:id/submit`) ➔ Refetch nhân sự live và assert đủ 12 trường text & UUID FKs đúng chuỗi tổ chức mới.
  4. Non-Org Pending Approval: Duyệt pending đổi lương bởi approver không có EA scope Khối ➔ assert thành công.
  5. Search Unicode & Catalog Error Test: Gõ từ không dấu (ví dụ `phong`) kiểm tra kết quả lọc khớp từ có dấu (như `Phòng`). Giả lập lỗi API GET danh mục ➔ alert thông báo kèm nút "Thử lại".
  6. Per-button Quick Add Atomic Modal Test Matrix: Kiểm tra modal reset context atomic, disabled type select, per-button permission matrix và 503 SERVICE_UNAVAILABLE error handling.

---

## 10. Rollback Plan

- **Quy trình Rollback cho Deployed DBs**:
  - Đối với Deployed/Cloud DBs đã apply 052: Tạo compensating forward migration `053_rollback_org_unit_triggers_and_pending_rpc.sql` hoặc chạy runbook `CREATE OR REPLACE FUNCTION` khôi phục định nghĩa gốc của `public.fn_trg_employees_org_unit_sync()` và `public.submit_employee_pending(...)`.
  - Revert mã nguồn Frontend/Backend qua Git commit revert:
    - `backend/src/routes/employees.ts`
    - `backend/src/services/employeeService.ts`
    - `frontend/src/components/common/OrgUnitCascadingSelect.tsx`
    - `frontend/src/components/common/QuickAddOrgUnitModal.tsx`
    - `frontend/src/components/EmployeeForm.tsx`
    - `frontend/src/pages/Employees/EmployeeEditPage.tsx`

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
