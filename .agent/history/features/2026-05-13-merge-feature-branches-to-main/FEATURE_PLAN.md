# Feature Plan: Merge 2 Feature Branches vào Main

> **Trạng thái**: ✅ ĐÃ DUYỆT (v13)
> **Review gate**: Đã vượt qua review council. Handoff sang `feature-coordinator` để thực thi.
> **Feature slug**: merge-feature-branches-to-main
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-11
> **Cập nhật**: 2026-05-12 — v13 sau phản biện review lần 12

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hai nhánh feature đã phát triển **song song** từ các thời điểm khác nhau của `main` và cần merge:
  1. `feature-05-dieu-chuyen-bo-nhiem` (7 commits, 73 files, forked từ `896357b` — trước khi các feature search optimization, migrate-config-vars, show-salary được merge vào main)
  2. `feature/probation-evaluation-flow` (1 commit, 12 files, forked từ `487d892` — HEAD của main hiện tại)

- **Vấn đề cần giải quyết:**
  - Nhánh 1 diverge lớn so với main (forked từ commit cũ), chứa nhiều thay đổi đa lớp (DB migrations, backend services, frontend UI/UX, shared schemas, .agent docs, CI/CD).
  - Nhánh 2 forked từ HEAD main nên ít conflict hơn, nhưng chạm vào nhiều file giống nhánh 1.
  - **Hiện tượng phát triển song song:** Do 2 nhánh phát triển cùng lúc, một số file bị cả 2 nhánh sửa nhưng không biết về nhau. Điều này tạo ra conflict khi merge — không phải vì xóa code của nhau, mà vì **cả hai thêm code mới vào cùng vùng**.
  - Nhánh 2 có function `evaluateProbation()` ghi 3 bước riêng biệt không atomic → vi phạm nguyên tắc `Atomic Submit RPC` trong KB → **cần refactor trước khi merge**.

- **Mục tiêu:** Merge cả 2 nhánh vào `main` an toàn, đảm bảo:
  - Không mất code hoặc logic từ bất kỳ nhánh nào
  - DB migrations đúng thứ tự, không trùng số
  - Shared schemas/types nhất quán
  - UI/UX hoạt động đúng khi cả 2 feature cùng tồn tại
  - Tuân thủ nguyên tắc Atomic Submit RPC cho luồng đánh giá thử việc

- **Kết quả mong đợi:** `main` branch chứa đầy đủ cả 2 features, CI pass, không regression.

## 2. Phạm vi

### In scope
- **Sửa nhánh 2 trước merge (Option A):** Refactor `evaluateProbation()` sang atomic RPC + tạo migration `027_fn_evaluate_probation.sql`
- Merge `feature-05-dieu-chuyen-bo-nhiem` vào `main` (merge thứ nhất — nhánh lớn hơn, diverge xa hơn)
- Sửa nhánh 1 trong lúc merge: Refactor luồng transfer sang atomic RPC (gộp personnel + salary pending vào 1 lời gọi duy nhất - FR-16).
- Renumber migrations nhánh 1 để không trùng số 024 với main + sửa signature bug FR-07.
- Merge `feature/probation-evaluation-flow` vào `main` (merge thứ hai — nhỏ hơn, đã sửa atomic RPC)
- Resolve conflicts giữa 2 nhánh và `main` ở các file chung (phát triển song song) bao gồm cả UI search refactor
- Chạy build, lint, typecheck, test sau mỗi merge
- Cập nhật `.agent/` docs sau khi merge hoàn tất

### Out of scope
- Không refactor thêm code ngoài scope merge
- Không tạo feature mới
- Không sửa bug không liên quan đến merge
- Không merge các nhánh khác (`feat/admin-excel-import`, `feature/salary-advance-sync`, v.v.)

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - [RLS Atomic Exemption] Cả 2 nhánh đều dùng `SECURITY DEFINER` RPC cho SQL transactions — nhất quán với KB
  - [Salary Pending Isolation] Nhánh 1 thêm `save_personnel_pending` và `fn_reject_employee_pending` — tuân thủ nguyên tắc tách pending data
  - [Atomic Submit RPC] Nhánh 2 cần refactor `evaluateProbation()` sang RPC atomic trước khi merge.
  - [Atomic Submit RPC] Nhánh 1 cần refactor `savePersonnelPending` để gộp cả `salaryData` thành 1 transaction khi điều chuyển (FR-16).
  - [Single Source of Truth] Nhánh 2 thêm `probationEvaluationSchema` vào Zod — đúng pattern
  - [Two-Tier CI/CD] Merge vào `main` sẽ trigger auto-deploy Dev → chọn Option A (sửa trước merge) để tránh deploy code chưa đúng chuẩn

- **"Cấm kỵ" cần tránh:**
  - Không dùng Tailwind (Ant Design v6 only)
  - Không commit salary data không qua isolation layer
  - Không bypass IDOR check
  - Không ghi dữ liệu đa bảng (employee + salary) ngoài atomic RPC

- **Ràng buộc kiến trúc liên quan:**
  - DB migrations **append-only** — không sửa/xóa migration đã phát hành. Nhánh 1 tạo migration cùng số 024 với main (do phát triển song song) → **cần renumber, không xóa 024 cũ**
  - Migration 023: nhánh 1 có version cũ (trước fix `3f38f3b`), main có version mới → **giữ version main khi conflict**
  - Thứ tự migration chốt: `024 (GIN index, đã trên main)` → `025 (reject pending, từ nhánh 1)` → `026 (save personnel pending, từ nhánh 1, sửa signature FR-07)` → `027 (evaluate probation RPC, mới cho nhánh 2)`
  - `@vcc/shared` phải build trước khi FE/BE chạy
  - `deploy-be.yml`: nhánh 1 có config **cũ** (dùng Secret Manager) vì fork trước khi main migrate sang GitHub Vars → **giữ version main khi conflict**

## 4. Giả định và câu hỏi mở

### Giả định
1. **Thứ tự merge:** Merge nhánh 1 trước (lớn hơn, diverge xa hơn) → Merge nhánh 2 sau (nhỏ hơn, ít conflict hơn). Lý do: Nhánh 2 forked từ HEAD main nên sau khi main đã có code nhánh 1, việc resolve conflict nhánh 2 sẽ dễ hơn.
2. **Merge strategy:** Sử dụng merge commit (không squash) để giữ lịch sử commit rõ ràng cho từng feature.
3. **DB migrations nhánh 1:** Đã được test trên môi trường dev — giả định các RPC function chạy đúng.
4. **Không có breaking changes** trong API contract giữa 2 nhánh — cả 2 đều thêm endpoint mới (additive).
5. **Giữ bộ lọc tìm kiếm** (`escapeSearchString`): Theo phản biện FR-14, đây là hardening feature từ main (`4c94b58`). Nhánh 1 không xóa, chỉ là chưa có do fork sớm. Sẽ **giữ nguyên** từ main.

### Câu hỏi mở (đã chốt)
- ~~[FR-06] Atomic RPC cho probation flow~~ → **Đã chốt: tuân thủ, sửa trước merge (Option A)**
- ~~[FR-03] Migration numbering~~ → **Đã chốt: renumber 024→025, 025→026, thêm 027**
- ~~[FR-01, FR-14] escapeSearchString~~ → **Đã chốt: GIỮ LẠI theo bản main**
- [Non-blocking] Nhánh 1 xóa `scripts/backup-secrets.ps1` và `scripts/find-wasted-secrets.ps1` — giả định là chủ ý do phát triển song song.

## 5. Acceptance Criteria

- [ ] AC1: Nhánh 2 đã được sửa atomic RPC trước khi merge
- [ ] AC2: `feature-05-dieu-chuyen-bo-nhiem` merged vào `main` thành công, migrations renumbered
- [ ] AC3: `feature/probation-evaluation-flow` merged vào `main` thành công
- [ ] AC4: `pnpm run build` pass (shared → FE + BE)
- [ ] AC5: `pnpm run lint` pass
- [ ] AC6: `pnpm run typecheck` pass
- [ ] AC7: `pnpm --filter backend test` pass
- [ ] AC8: `pnpm --filter @vcc/shared test` pass
- [ ] AC9: `pnpm --filter backend test:integration` pass — chứng minh atomicity RPC (FR-21)
- [ ] AC10: Cả 2 features hoạt động đúng trên local dev (manual verification)
- [ ] AC11: `EmployeeDetailPage` hiện đúng cả 4 nút (Sửa hồ sơ, Điều chuyển, Đánh giá thử việc, Cập nhật lương) với điều kiện hiển thị đúng cho từng trạng thái
- [ ] AC12: `.agent/` docs được cập nhật phản ánh 2 features mới

## 6. Files và modules bị ảnh hưởng

### A. Files xung đột (với `main` hoặc giữa 2 nhánh — cần resolve thủ công)

| File | Nhánh 1 thêm/sửa | Nhánh 2 thêm/sửa | Rủi ro | Merge rule |
|------|-------------------|-------------------|--------|------------|
| `backend/src/routes/employees.ts` | +3 routes, sửa suggest-reviewers | +1 route (evaluate-probation) | 🔴 | Giữ cả 2 bộ imports + routes |
| `backend/src/services/employeeService.ts` | +3 functions, sửa submitFromPending, thêm contract mới | +1 function (evaluateProbation → refactored sang RPC) | 🔴 | **Giữ `escapeSearchString` từ main** (FR-14), giữ tất cả functions, consolidate 3 contract comments thành 1 |
| `frontend/src/components/EmployeeTable.tsx` | Refactor mobile (82 dòng) | Thêm logic thử việc (+28 dòng) | 🟡 | Khác vùng, ít conflict. **Sửa import lỗi vị trí (FR-33):** move `import { Card, Typography }` lên đầu file, `const { Text } = Typography` sau imports |
| `frontend/src/hooks/useEmployees.ts` | +2 hooks | +1 hook + type imports | 🟡 | Thêm cuối file, ít conflict |
| `frontend/src/components/MainLayout.tsx` | Giảm mobile spacing, dùng `disabled` trong Tooltip | Không sửa | 🟡 | **Giữ Tooltip title logic từ main** (chống lỗi strict mode), giữ mobile spacing từ nhánh 1 (FR-15) |
| `frontend/src/pages/Employees/EmployeeListPage.tsx` | Sửa responsive padding, card layout | Không sửa | 🔴 | **Giữ search refactor từ main** (EmployeeSearchBar, useCallback), giữ padding/card từ nhánh 1 (FR-13) |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Thêm nút "Điều chuyển", fix calculation | Thêm nút "Đánh giá thử việc" + modal | 🔴 | **Giữ cả 4 nút**: Sửa hồ sơ + Điều chuyển (nhánh 1) + Đánh giá thử việc (nhánh 2) + Cập nhật lương (main). Mỗi nút có điều kiện hiển thị riêng |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Refactor lớn + reject logic | Thêm menu "Đánh giá thử việc" + modal | 🔴 | **Giữ search refactor từ main** (EmployeeSearchBar), graft thêm reject logic (nhánh 1) + menu/modal (nhánh 2) (FR-12) |
| `database/migrations/023_...` | Có version cũ (trước fix `3f38f3b`) | Không sửa | 🔴 | **Giữ version main** — main đã có fix `3f38f3b` qua merge `dieu-chinh-luong` |
| `.github/workflows/deploy-be.yml` | Có config cũ (Secret Manager) | Không sửa | 🔴 | **Giữ version main** — main đã migrate sang GitHub Vars |
| `.gitignore` | Thay đổi (xóa file) | Thay đổi (binary) | 🔴 | **Giữ version main** (để không mất `secrets-backup.csv` và giữ chuẩn UTF-8), thêm thủ công các path cần thiết (FR-17) |

### B. Files chỉ thuộc nhánh 1

| File/Module | Hành động | Lý do | Rủi ro |
|-------------|-----------|-------|--------|
| `database/migrations/024→025_add_reject_pending_function.sql` | Tạo mới (renumber) | RPC fn_reject_employee_pending | 🟡 |
| `database/migrations/025→026_save_personnel_pending_rpc.sql` | Tạo mới (renumber + **sửa FR-07, FR-16, FR-26**) | RPC save_personnel_pending — Sửa param nhận `salary_data`, gộp transaction atomic, **gọi `save_salary_pending()` không update trực tiếp (FR-26)**, tự ghi audit (FR-28) | 🔴 |
| `backend/src/services/nntService.ts` | Sửa | Thêm `use_pending` param | 🟢 |
| `frontend/src/pages/Employees/EmployeeEditPage.tsx` | Sửa lớn | Refactor logic điều chuyển: dùng 1 mutation duy nhất thay vì `Promise.all` personnel+salary (FR-16) | 🔴 |
| `backend/src/routes/employees.ts` (route `/personnel-pending`) | Sửa | Destructure `salaryData` riêng từ body, validate riêng, pass xuống service — giữ safety check chặn salary fields top-level (FR-31) | 🔴 |
| `frontend/src/components/ReviewerCard.tsx` | Sửa | Cảnh báo reviewer | 🟢 |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Hỗ trợ mode transfer | 🟢 |
| `frontend/src/services/employeeService.ts` | Sửa | +savePersonnelPending API | 🟢 |
| `frontend/src/pages/Admin/*` (7 files) | Sửa | Mobile responsiveness | 🟢 |
| `.agent/` docs (nhiều file) | Sửa/Tạo | Archive/reorganize features | 🟢 |

### C. Files chỉ thuộc nhánh 2 (có cập nhật tương thích)

| File/Module | Hành động | Lý do | Rủi ro |
|-------------|-----------|-------|--------|
| `frontend/src/components/ProbationEvaluationModal.tsx` | Tạo mới | Modal đánh giá thử việc. **Cần bổ sung các field lương mới từ main (`nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`) (FR-20)** | 🟡 |
| `packages/shared/src/schemas/employee.ts` | Sửa | +probationEvaluationSchema | 🟢 |
| `packages/shared/src/schemas/index.ts` | Sửa | Export mới | 🟢 |

### D. Files tạo mới trong scope merge

| File/Module | Hành động | Lý do | Rủi ro |
|-------------|-----------|-------|--------|
| `database/migrations/027_fn_evaluate_probation.sql` | Tạo mới | Atomic RPC cho probation evaluation (FR-06), tự ghi audit log, bảo toàn contract (FR-08, FR-09) | 🟡 |

## 7. Risk Triage và Review Focus

- **Review required:** Yes — **Khuyến nghị mạnh**
- **Risk hotspots:**
  1. 🔴 `EmployeeDetailPage.tsx` — Cả 2 nhánh thêm nút action **song song** (nhánh 1: "Điều chuyển", nhánh 2: "Đánh giá thử việc"). Khi merge cần đảm bảo cả 4 nút hiển thị đúng điều kiện, không mất nút "Cập nhật lương" từ main.
  2. 🔴 `employeeService.ts` — File service chính, cả 2 nhánh thêm function mới. **Phải giữ `escapeSearchString` từ main** (FR-14). Contract comments trùng lặp cần consolidate.
  3. 🔴 `employees.ts` (routes) — Import list và route registration cần merge chính xác.
  4. 🟡 DB migrations — Nhánh 1 tạo migration trùng số 024 với main (phát triển song song) → renumber thành 025/026. Thêm 027 cho atomic RPC mới.
  5. 🔴 `PendingRoomPage.tsx` & `EmployeeListPage.tsx` — Nhánh 1 refactor UI, nhưng main đã có search refactor (`EmployeeSearchBar`). Dễ bị ghi đè mất component search của main.
  6. 🟡 `MainLayout.tsx` — Main có fix strict mode cho Tooltip, nhánh 1 đưa lại code gây fail build. Dễ bị overwrite khi resolve layout conflict.

- **Review focus areas:**
  - Merge conflict resolution ở `EmployeeDetailPage.tsx` có giữ đúng cả 4 nút action không?
  - `employeeService.ts` sau merge: **còn giữ `escapeSearchString` không?**, consolidate contracts, function `evaluateProbation` dùng RPC atomic?
  - `EmployeeEditPage.tsx` (nhánh 1) đã bỏ `Promise.all` và chỉ gọi 1 hàm `savePersonnelPending` kèm `salaryData` chưa? (FR-16)
  - Thứ tự DB migration files: 024 (main) → 025 → 026 → 027?
  - `PendingRoomPage.tsx` và `EmployeeListPage.tsx` có giữ đúng `EmployeeSearchBar` và flow search mới từ main không?
  - `PendingRoomPage.tsx` dropdown menu có chứa cả "Hủy thay đổi" (nhánh 1) và "Đánh giá thử việc" (nhánh 2) không?

- **Known pitfalls / historical issues:**
  - Lần merge `feature/dieu-chinh-luong` trước đó (commit `51e9079`) cũng từng có conflict changelogs cần resolve thủ công.
  - Hiện tượng phát triển song song: diff output có thể hiển thị file là "deleted" nhưng thực tế chỉ là file chưa tồn tại tại thời điểm nhánh fork. Git merge sẽ giữ cả 2 phía — cần verify thủ công.

- **Dependencies / rollout concerns:**
  - DB migrations 025/026/027 phải chạy trên Supabase **trước khi** push (vì push triggers auto-deploy)
  - **Migration gate (FR-02, FR-25):** Trước push phải verify: (1) migrations đã chạy, (2) RPC functions tồn tại trên Supabase Dev (`pg_proc` + `pg_get_function_identity_arguments`), (3) smoke test RPC
  - Auto-deploy Dev sẽ trigger khi merge vào main → chọn Option A (sửa nhánh 2 trước) để deploy lần đầu đã đúng chuẩn
  - `pnpm run build:shared` phải pass trước khi test FE/BE (vì nhánh 2 thêm export mới)
  - `deploy-be.yml` conflict: giữ version main (GitHub Vars), không cần preflight Secret Manager

## 8. Chiến lược triển khai

- **Phase strategy:** 5 phases:
  1. **Phase 1 — Preparation:** Fetch latest, dry-run merge check
  2. **Phase 2 — Fix Branch 2:** Refactor `evaluateProbation()` sang atomic RPC, tạo migration 027, push commit lên nhánh 2
  3. **Phase 3 — Merge Branch 1:** Merge `feature-05-dieu-chuyen-bo-nhiem`, renumber migrations, resolve conflicts (giữ `escapeSearchString`), verify
  4. **Phase 4 — Merge Branch 2:** Merge `feature/probation-evaluation-flow`, resolve conflicts (giữ cả 4 nút action), verify
  5. **Phase 5 — Post-merge Verification & Docs:** Full test, update docs, push

- **Thứ tự triển khai:**
  1. Sửa nhánh 2 trước (atomic RPC) → push lên remote
  2. Merge nhánh lớn (nhánh 1 — 73 files) → renumber migrations → ổn định base
  3. Merge nhánh nhỏ (nhánh 2 — 12+ files) → resolve conflicts
  4. Build & test sau mỗi merge
  5. Push chỉ khi cả 2 merge đã pass verification

- **Điểm cần phối hợp:**
  - DB team: Chạy migrations 025 + 026 + 027 trên Supabase dev
  - Tester: Manual test 2 flows (điều chuyển bổ nhiệm + đánh giá thử việc) sau merge
  - DevOps: Monitor auto-deploy Dev sau push

- **Yêu cầu migration / config / deploy:**
  - Chạy `025_add_reject_pending_function.sql` → `026_save_personnel_pending_rpc.sql` → `027_fn_evaluate_probation.sql` trên Supabase
  - Không cần thêm env vars mới
  - `deploy-be.yml`: giữ version main (đã migrate sang GitHub Vars) — **không** lấy version nhánh 1

## 9. Test Strategy

- **Automated tests:**
  - `pnpm run build` (full monorepo build)
  - `pnpm run lint` (ESLint tất cả workspaces)
  - `pnpm run typecheck` (TypeScript strict)
  - `pnpm --filter @vcc/shared test` (Zod schema tests + schema-sync)
  - `pnpm --filter backend test` (Backend unit tests)
  - **`pnpm --filter backend test:integration` (FR-11):** Bổ sung test chứng minh atomicity của `fn_evaluate_probation` (happy path + failure path không bị partial write).

- **Manual verification:**
  - [ ] Luồng Điều chuyển bổ nhiệm: EA tạo pending → **Verify chỉ có 1 request gọi lên BE để lưu cả personnel + salary nháp (FR-16)** → Reviewer review → Submit → Verify history
  - [ ] Luồng Hủy thay đổi (Reject): EA tạo pending → SA/EA reject → Verify state reset
  - [ ] Luồng Đánh giá thử việc: Chọn NS thử việc → Modal đánh giá → Submit → Verify state change (atomic)
  - [ ] Mobile responsiveness trên Admin pages (nhánh 1)
  - [ ] EmployeeDetailPage hiện đúng 4 nút:
    - "Sửa hồ sơ" (điều kiện: có quyền sửa)
    - "Điều chuyển" (điều kiện: chưa nghỉ việc, có quyền sửa)
    - "Đánh giá thử việc" (điều kiện: `trang_thai === 'thu_viec'` && chưa vào phòng chờ)
    - "Cập nhật lương" (điều kiện: `showEditSalary`)
  - [ ] Phòng chờ hiện menu "Hủy thay đổi" và "Đánh giá thử việc"
  - [ ] Tìm kiếm nhân sự vẫn hoạt động: **test tìm với ký tự đặc biệt (`%`, `_`) không bị crash 400 (FR-14)**

- **Security / data smoke tests (FR-06, FR-08, FR-09):**
  - [ ] IDOR: User không thuộc khối → bị chặn 403 khi gọi `/evaluate-probation`, `/personnel-pending`, `/reject`
  - [ ] Audit log: Ghi đúng action sau reject, evaluate, transfer. **Chỉ có đúng 1 record audit từ RPC cho evaluate, không ghi đè ở route (FR-08).**
  - [ ] State transition: NS `thu_viec` → evaluate → vào phòng chờ → submit → `chinh_thuc` hoặc `nghi_viec`
  - [ ] Salary pending isolation: Salary data chỉ ghi qua RPC, không bypass
  - [ ] Metadata bảo toàn: Verify evaluate probation giữ nguyên `temp_uuid`, `document_type = 'danh_gia_thu_viec'`, và merge `pending_changes` cũ thay vì overwrite.

- **Data / env chuẩn bị:**
  - Cần có ít nhất 1 nhân sự `trang_thai = 'thu_viec'` để test probation flow
  - Cần có ít nhất 1 nhân sự `state_phong_cho = true` để test reject flow
  - DB migrations phải đã chạy trên dev Supabase

## 10. Rollback Plan

### Trước push (local only)
1. **Merge nhánh 1 fail:** `git reset --hard` về commit trước merge (`487d892`)
2. **Merge nhánh 2 fail (nhánh 1 đã OK):** `git reset --hard` về merge commit nhánh 1

### Sau push (remote + deploy)
3. **Git:** `git revert -m 1 <merge-commit>` cho từng merge commit cần revert
4. **Cloud Run:** Rollback về revision trước qua GCP Console hoặc `gcloud run services update-traffic --to-revisions=REVISION=100`
5. **DB rollback scripts:**
   ```sql
   -- Rollback 027 (evaluate probation RPC)
   DROP FUNCTION IF EXISTS fn_evaluate_probation(VARCHAR, TEXT, JSONB, TEXT, UUID, TEXT);
   -- Rollback 026 (save personnel pending)
   DROP FUNCTION IF EXISTS save_personnel_pending(VARCHAR, JSONB, JSONB, UUID);
   -- Rollback 025 (reject pending)
   DROP FUNCTION IF EXISTS fn_reject_employee_pending(VARCHAR, TEXT);
   -- Phục hồi constraint cũ cho 025 (FR-10, FR-18)
   ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;
   ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check
     CHECK (action IN (
       'create', 'update', 'delete', 'submit',
       'snapshot_create', 'snapshot_lock', 'snapshot_unlock',
       'reviewer_assign', 'reviewer_remove',
       'export', 'api_blocked', 'access_denied',
       'permission_grant', 'permission_revoke',
       'superadmin_add', 'superadmin_remove', 'bulk_import'
     ));
   ```
   Các migration này đều additive (CREATE FUNCTION) nên rollback = DROP FUNCTION, không ảnh hưởng data. Phải phục hồi CHECK constraint cho 025 với danh sách action đầy đủ hiện tại của main (FR-18).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## Review Notes

### Review lần 1 (2026-05-11)
- **Verdict:** ⚠️ CẦN SỬA
- FR-01→FR-06: Đã xử lý trong v2. Xem chi tiết tại artifacts/review-merge-feature-branches.md.

### Review lần 2 — Phản biện (2026-05-12)
- **FR-01 (024 xóa):** **BÁC BỎ** — 024_search_gin_index.sql không tồn tại tại fork point `896357b`. Git 3-way merge sẽ giữ file. Expert đọc nhầm diff.
- **FR-01 (023 sửa):** **Chấp nhận** — nhánh 1 có version cũ, main có fix `3f38f3b`. Thêm merge rule: giữ version main.
- **FR-02 (migration gate):** **Chấp nhận** — thêm gate verify RPC trước push.
- **FR-03 (deploy-be.yml):** **BÁC BỎ** — nhánh 1 có config cũ (Secret Manager), main đã migrate sang GitHub Vars. Giữ main.
- **FR-04 (rollback):** **Chấp nhận 1 phần** — thêm SQL rollback scripts + Cloud Run rollback.
- **FR-05 (rehearsal):** **Không chặn** — optional.
- **FR-06 (security tests):** **Chấp nhận** — thêm security/IDOR smoke tests.
- **FR-07 (signature):** **Chấp nhận hoàn toàn** — bug thật: ALTER/COMMENT dùng `(VARCHAR, JSONB)` nhưng function có 3 params `(VARCHAR, JSONB, UUID)`.

### Review lần 3 (2026-05-12)
- **FR-08 (Audit Duplicate):** **Chấp nhận** — Xác định RPC `fn_evaluate_probation` là audit owner duy nhất. Xóa gọi `recordAuditLog` ở route.
- **FR-09 (RPC Contract):** **Chấp nhận** — Đã ghi rõ spec bảo toàn behavior cho temp_uuid, document_type, pending merge và _temp_uuid trong salary payload.
- **FR-10 (Rollback 025):** **Chấp nhận** — Đã bổ sung script DROP/ADD constraint `audit_log_action_check` loại bỏ `'reject'`.
- **FR-11 (Integration Atomicity):** **Chấp nhận** — Đã thêm task bổ sung integration test xác nhận tính atomic và failure case của RPC.

### Review lần 4 (2026-05-12)
- **FR-12 (PendingRoom Search):** **Chấp nhận** — Main đã dùng `EmployeeSearchBar`. Thêm merge rule bắt buộc giữ implementation từ main, chỉ graft thêm logic nhánh 1+2.
- **FR-13 (EmployeeListPage Conflict):** **Chấp nhận** — Thêm vào conflict matrix. Merge rule: giữ `EmployeeSearchBar` + `useCallback` từ main, giữ responsive layout từ nhánh 1.

### Review lần 5 (2026-05-12)
- **FR-14 (escapeSearchString Hardening):** **Chấp nhận hoàn toàn** — Sửa lại quyết định sai của reviewer nội bộ. Nhánh 1 không "quyết định xóa", mà là fork trước khi main được thêm `escapeSearchString` (commit `4c94b58`). Phải giữ lại logic hardening này từ main trong `employeeService.ts`.

### Review lần 6 (2026-05-12)
- **FR-15 (MainLayout Conflict):** **Chấp nhận** — MainLayout.tsx conflict thật. Đã thêm merge rule: giữ `Tooltip` implementation từ main (`title={sidebarCollapsed ? ...}`) để tránh fail build strict mode, giữ mobile padding từ nhánh 1.

### Review lần 7 (2026-05-12)
- **FR-16 (Atomic Transfer Flow):** **Chấp nhận hoàn toàn** — Luồng điều chuyển ở nhánh 1 đang dùng `Promise.all` 2 API (nhân sự + lương). Vi phạm luật Atomic Submit RPC. Đã thêm task sửa thẳng `026_save_personnel_pending_rpc.sql` và `EmployeeEditPage.tsx` trong lúc merge nhánh 1 để gộp cả 2 thành 1 transaction.

### Review lần 8 (2026-05-12)
- **FR-17 (.gitignore conflict):** **Chấp nhận** — Nhánh 1 xóa `secrets-backup.csv`, nhánh 2 bị mixed encoding. Chốt merge rule: giữ nguyên bản của main, thêm thủ công bằng plain UTF-8 nếu cần.
- **FR-18 (Rollback constraint sai):** **Chấp nhận** — Script rollback cũ thiếu các action mới của admin (`reviewer_assign`, `bulk_import`...). Đã cập nhật đúng schema hiện hành của main.

### Review lần 9 (2026-05-12)
- **FR-19 (Thiếu import InfoCircleOutlined):** **Chấp nhận** — Nút "Đánh giá thử việc" dùng icon nhưng thiếu import gây fail typecheck. Đã thêm task bổ sung.
- **FR-20 (Thiếu salary fields trong Modal):** **Chấp nhận** — `ProbationEvaluationModal` hardcode thiếu các trường mới của main (`nhuan_but_cc`...). Đã thêm task cập nhật mảng render.

### Review lần 10 (2026-05-12)
- **FR-21 (Integration Test Gate):** **Chấp nhận** — Thêm `test:integration` vào Task 5.1 và AC9 làm gate bắt buộc.
- **FR-22 (REVOKE/GRANT EXECUTE):** **BÁC BỎ làm blocker** — Không có RPC nào trong 24 migrations hiện tại dùng REVOKE/GRANT. Áp dụng cục bộ tạo inconsistency. **Risk acceptance có chủ đích**: rủi ro hệ thống, cần plan riêng cho toàn bộ RPC. → Follow-up backlog.
- **FR-23 (Idempotency/Retry):** **BÁC BỎ làm blocker** — Không RPC hiện hữu nào có idempotency key. Pending merge tự nhiên idempotent (JSONB `||`). **Risk acceptance có chủ đích**: thêm idempotency là thay đổi contract lớn cần áp dụng toàn hệ thống. → Follow-up backlog.
- **FR-24 (Row Lock/Concurrency):** **BÁC BỎ** — Bằng chứng trực tiếp: `fn_reject_employee_pending` đã có `SELECT ... FOR UPDATE`. Pattern `FOR UPDATE` hiện diện trong 8/24 migrations. Các RPC mới sẽ follow cùng pattern.
- **FR-25 (Migration Gate Depth):** **Chấp nhận 1 phần** — Thêm verify `pg_get_function_identity_arguments` vào gate.
- **FR-26 (Salary Pending Contract):** **Chấp nhận** — Chốt gọi `PERFORM save_salary_pending()` bên trong RPC 026, không update trực tiếp `salaries.pending_changes`.
- **FR-27 (IDOR Personnel/Reject):** **BÁC BỎ** — Bằng chứng trực tiếp: route `personnel-pending` gọi `savePersonnelToPending(id, data, userEmail, permission)`, route `reject` gọi `rejectPendingChanges(id, userEmail, permission)` — IDOR check ở service layer.
- **FR-28 (Audit Owner Reject/Transfer):** **Chấp nhận** — Reject: RPC `fn_reject_employee_pending` đã tự ghi audit, route không gọi `recordAuditLog` → tuân thủ. Transfer (FR-16): khi refactor sang atomic RPC, audit sẽ chuyển vào RPC, phải xóa `recordAuditLog` ở route giống evaluate.
- **FR-29 (Rehearsal Nhánh 2):** **Chấp nhận 1 phần** — Thêm dry-run nhánh 2 ở Phase 1. Capture commit/revision không là blocker.

### Review lần 11 (2026-05-12)
- **FR-30 (salary-fields.ts):** **BÁC BỎ** — Nhánh 1 không sửa file này so với merge-base (`896357b`): `git diff 896357b..origin/feature-05-dieu-chuyen-bo-nhiem -- salary-fields.ts` trả diff rỗng. 3 fields (`nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`) + CONTRACT comment được main thêm sau khi nhánh 1 fork (commit `3f38f3b`). Git 3-way merge sẽ auto-merge giữ version main. Pattern giống FR-14. Thêm sanity check vào Task 3.Final thay vì merge rule.
- **FR-31 (Route `/personnel-pending` thiếu salaryData):** **Chấp nhận hoàn toàn** — Route hiện tại destructure `{ temp_uuid, ...restBody }`, parse `restBody` qua `updateEmployeeSchema.partial().safeParse()` (Zod strip unknown keys), rồi gọi `savePersonnelToPending`. Nếu FE gửi `salaryData` dạng nested object, Zod sẽ strip im lặng → RPC nhận `p_salary_data = NULL` → salary pending không lưu (silent data loss). Task 3.5b đã sửa FE+BE service nhưng bỏ sót route layer. Đã bổ sung sub-task sửa route.

### Review lần 12 (2026-05-12)
- **FR-33 (EmployeeTable import sai vị trí):** **Chấp nhận — hạ severity Medium** — Xác nhận cuối file nhánh 1 có `const { Text } = Typography` + `import { Card, Typography }` sau component closing `}`. JavaScript import hoisting sẽ khiến build có thể pass, nhưng ESLint `import/first` sẽ fail (Task 3.9 sẽ catch). Ghi rõ vào merge rule Task 3.3 để fix ngay lúc resolve conflict thay vì debug khi lint fail.
- **FR-34 (Endpoint name sai checklist):** **Chấp nhận** — Plan ghi `/reject-pending` nhưng route thật là `/reject` (cả BE route `POST /:id/reject` và FE hook `apiClient.post('/employees/${id}/reject')`). Đã sửa text checklist.

### Risk Acceptance & Follow-up Backlog
> **[Risk Acceptance — có chủ đích, KHÔNG phải "không có rủi ro"]**
>
> FR-22 và FR-23 là rủi ro **hệ thống** áp dụng cho **toàn bộ 24 migrations + RPC** hiện hữu, không phải riêng feature này. Sửa cục bộ cho 2 RPC mới sẽ tạo inconsistency trong repo.
>
> **Follow-up plan cần tạo sau merge:**
> - `RPC Execute Policy Standardization` — Audit toàn bộ RPC, chốt REVOKE/GRANT policy, migrate đồng bộ, test regression.
> - `RPC Idempotency Standardization` — Chốt contract idempotency, schema/constraint, retry behavior cho mọi flow.
