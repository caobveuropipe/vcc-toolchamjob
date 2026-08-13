# Rebuttal Log: org-units-ea-scope-guard

## Round 1 - 2026-08-05T17:58:30+07:00

### Tổng kết
- EFR: 8 (accepted: 8, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 1)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `backend/src/routes/orgUnits.ts`, `backend/src/middleware/requireSuperAdmin.ts`

### EFR Đã Chấp Nhận -> [EFR-01]: SA-only dựa vào permission cache/JWT metadata | Sửa: Yêu cầu requireSuperAdmin query trực tiếp DB superadmins cho DELETE/execute-deactivate/reparent/root Khối
### EFR Đã Chấp Nhận -> [EFR-02]: PATCH status bypass SA cascade deactivate | Sửa: Chặn EA PATCH status de-activate non-leaf node có child active (trả 409 CONFLICT); EA chỉ được PATCH leaf node
### EFR Đã Chấp Nhận -> [EFR-03]: Create/rename root Khối làm đổi scope key | Sửa: Quy định POST type='khoi' và rename root Khối là SA-only
### EFR Đã Chấp Nhận -> [EFR-04]: Guard tin input.khoi và nhận diện null-only | Sửa: DB-side scope resolver load target/parent từ DB (không tin client input.khoi), 404 cho target/parent không tồn tại
### EFR Đã Chấp Nhận -> [EFR-05]: Test strategy thiếu security matrix & harness | Sửa: Tạo dedicated orgUnitsScope.test.ts chạy trên Supabase Local Harness với bảng test matrix đầy đủ
### EFR Đã Chấp Nhận -> [EFR-06]: Frontend UI guard thiếu flow Create | Sửa: Bổ sung canCreateOrgUnit, filter parent/Khối dropdown theo scope EA
### EFR Đã Chấp Nhận -> [EFR-07]: Rollback plan khôi phục lỗ hổng | Sửa: Chuyển Rollback sang Fail-Closed Policy (khóa mutation về SA-only/maintenance mode)
### EFR Đã Chấp Nhận -> [EFR-08]: Error contract chưa thống nhất | Sửa: Chuẩn hóa Canonical Error Contract HTTP 403 { error: { code: 'FORBIDDEN', message: '...' } }

---

## Round 2 - 2026-08-05T18:07:30+07:00

### Tổng kết
- EFR: 6 (accepted: 6, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 2 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `backend/src/services/orgUnitService.ts`, `database/migrations/048_create_org_units.sql`, `frontend/src/pages/Admin/OrgUnitManagementPage.tsx`

### EFR Đã Chấp Nhận -> [EFR-09]: SA cascade gọi sai named parameter p_root_node_id | Sửa: Sửa p_root_node_id thành p_root_id trong orgUnitService.ts
### EFR Đã Chấp Nhận -> [EFR-10]: PREVIEW_STALE so sánh array phụ thuộc order | Sửa: Bổ sung migration 051 ORDER BY id cho array_agg trong cascade RPCs
### EFR Đã Chấp Nhận -> [EFR-11]: Generic PATCH status cho SA phá invariant | Sửa: Actor-agnostic block: Mọi caller (kể cả SA) PATCH de-activate non-leaf node đều nhận 409 CONFLICT
### EFR Đã Chấp Nhận -> [EFR-12]: UI thiếu Parent_id control và Status toggle | Sửa: Thêm Form.Item parent_id trong Create Modal và nút Status toggle cho leaf node
### EFR Đã Chấp Nhận -> [EFR-13]: Middleware requireSuperAdmin trả PERMISSION_DENIED | Sửa: Chuẩn hóa org-units authorization error response trả FORBIDDEN trong orgUnits.ts
### EFR Đã Chấp Nhận -> [EFR-14]: Operational Fail-Closed Rollback thiếu flag | Sửa: Triển khai cờ ORG_UNITS_MUTATION_MODE (normal|sa_only|disabled)

---

## Round 3 - 2026-08-05T18:17:15+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 3 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `database/migrations/048_create_org_units.sql`, `backend/src/config/env.ts`, `frontend/src/components/common/QuickAddOrgUnitModal.tsx`, `frontend/src/components/common/OrgUnitCascadingSelect.tsx`, `backend/scripts/sync-migrations.cjs`

### EFR Đã Chấp Nhận -> [EFR-15]: Cross-Khối RPC fail-open khi p_actor_role là NULL | Sửa: Mở rộng migration 051 sửa `p_actor_role IS DISTINCT FROM 'SA'`, truyền trusted SA flag từ route qua service
### EFR Đã Chấp Nhận -> [EFR-16]: ORG_UNITS_MUTATION_MODE thiếu truth table & env Zod schema | Sửa: Khai báo Zod enum in env.ts với 3 modes (normal, sa_only, disabled-503)
### EFR Đã Chấp Nhận -> [EFR-17]: Status toggle leaf-only gây deadlock khôi phục cây | Sửa: Leaf restriction chỉ áp dụng khi deactivation (is_active=false -> 409); cho phép reactivation (is_active=true) top-down khi parent active
### EFR Đã Chấp Nhận -> [EFR-18]: Alternate Create path QuickAddOrgUnitModal thiếu UI guard | Sửa: Bổ sung QuickAddOrgUnitModal.tsx & OrgUnitCascadingSelect.tsx vào UI scope guard, bind parent_id và filter scope
### EFR Đã Chấp Nhận -> [EFR-19]: Verification command chưa apply migration 051 trên DB sạch | Sửa: Tạo migration 051 tại database/migrations (dùng sync-migrations.cjs) và đổi verification command thành `pnpm --filter backend test:integration:fresh`

---

## Round 4 - 2026-08-05T18:40:15+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 4 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-20]: Test matrix chưa phủ các nhánh RBAC đặc quyền vừa được chốt | Sửa: Mở rộng Test Strategy & Task 3.1 bổ sung 4 case đặc quyền (Line Global EA vs Non-EA, SA vs EA root khoi rename, SA vs EA reparent cross-Khối, DB RPC NULL/non-SA/SA regression)

---

## Round 5 - 2026-08-05T20:16:30+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 5 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `database/migrations/048_create_org_units.sql`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-21]: SA reparent cross-Khối bị trigger exception và chưa đồng bộ khoi subtree | Sửa: Mở rộng rpc_update_org_unit trong migration 051 tự động cập nhật khoi của target node và toàn bộ descendants sang newParent.khoi trong transaction nguyên tử

---

## Round 6 - 2026-08-05T20:19:50+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 6 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `database/migrations/048_create_org_units.sql`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-22]: Root khoi rename/create chưa có contract migration cho scope key | Sửa: Khóa invariant Root Khối Machine Key Immutability (`code` & `khoi` của `type = 'khoi'` là immutable machine key matching `user_permissions.khoi`; SA rename root Khối chỉ cập nhật display label `name`, bảo toàn `user_permissions` và descendants binding)

---

## Round 7 - 2026-08-05T20:22:50+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 7 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `database/migrations/048_create_org_units.sql`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-23]: Machine-key invariant của root bị trigger hiện hữu ghi đè | Sửa: Nâng cấp trigger function `trg_org_units_invariants()` trong migration 051: Trên UPDATE `type = 'khoi'`, cưỡng chế `NEW.khoi := OLD.khoi` và `NEW.code := OLD.code` (giữ nguyên machine keys bất biến khi SA rename `name`)

---

## Round 9 - 2026-08-05T20:35:10+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 9 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `database/migrations/048_create_org_units.sql`, `frontend/src/components/common/OrgUnitCascadingSelect.tsx`, `frontend/src/components/EmployeeForm.tsx`, `backend/src/routes/orgUnits.ts`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-24]: Root creation vẫn có thể phá machine-key invariant | Sửa: Mở rộng trigger trg_org_units_invariants() cho INSERT type='khoi': NEW.khoi := COALESCE(NEW.code, NEW.khoi, NEW.name) đảm bảo machine key canonical
### EFR Đã Chấp Nhận -> [EFR-25]: Display name khác machine key làm hỏng OrgUnitCascadingSelect và mất khoi_id in EmployeeForm | Sửa: Refactor root lookup bằng `u.khoi === selectedKey` / `u.id` thay vì `u.name === selectedKhoi`, bảo đảm khoi_id truyền chính xác vào EmployeeForm.tsx
### EFR Đã Chấp Nhận -> [EFR-26]: Matrix ORG_UNITS_MUTATION_MODE chưa có dynamic per-request env reader cho test harness | Sửa: Đọc ORG_UNITS_MUTATION_MODE động per-request (`process.env.ORG_UNITS_MUTATION_MODE || env.ORG_UNITS_MUTATION_MODE`), hỗ trợ harness switch 3 modes linh hoạt và assert HTTP 403/503 chuẩn xác

---

## Round 10 - 2026-08-05T20:47:30+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: Normal (Rebuttal Round 10 - Codex Desktop Review Pass)
- Context loaded: `.agent/active/org-units-ea-scope-guard/EXPERT_REVIEW.md`, `backend/src/routes/orgUnits.ts`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-27]: Dynamic mutation-mode reader bypass Zod contract ở runtime | Sửa: Dùng helper getOrgUnitsMutationMode() parse/validate bằng Zod enum per-request, fail-closed về disabled (503) khi invalid, restore env trong test afterEach
### EFR Đã Chấp Nhận -> [EFR-28]: Case xác minh OrgUnitCascadingSelect không thể chạy trong backend-only integration suite | Sửa: Phân định rõ phạm vi Test Harness: Backend integration suite (orgUnitsScope.test.ts) kiểm thử API/DB/triggers/RPCs, Frontend component verify OrgUnitCascadingSelect mapping khoi_id
