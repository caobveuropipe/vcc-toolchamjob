# Feature Plan: Sửa lỗi và Merge nhánh dieu-chinh-luong

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Có thể handoff sang coordinator
> **Feature slug**: merge-dieu-chinh-luong
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Nhánh `origin/feature/dieu-chinh-luong` (9 commits, 58 files, +4216/-420 lines) đã hoàn thành feature chính (WF-EMP-03: luồng điều chỉnh lương) cùng nhiều improvement phụ (collapsible sidebar, change history tab, salary validation, show salary in detail). Branch review phát hiện 2 blocker: (1) SALARY_FIELDS_SET thiếu 3 fields → VI thấy salary history, (2) migration 023 mất logic bóc `ngay_dieu_chinh_luong` từ salary pending sang employee pending.
- **Vấn đề cần giải quyết:** Sửa 2 blockers, verify quality, merge vào main an toàn.
- **Mục tiêu:** Merge nhánh `feature/dieu-chinh-luong` vào `main` với zero regressions, đảm bảo Salary Isolation cho VI không bị phá.
- **Kết quả mong đợi:** Nhánh đã merge, CI pass, typecheck pass, tests pass, user test thủ công xong.

## 2. Phạm vi

### In scope
1. **Blocker 1 — SALARY_FIELDS thiếu 3 fields:** Thêm lại `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc` vào `SALARY_FIELDS` + `salarySchema`. Xác nhận bởi migration 023 (`v_salary_fields` vẫn liệt kê 3 fields này → vẫn tồn tại trong DB).
2. **Blocker 2 — Migration 023 mất logic bóc `ngay_dieu_chinh_luong` và mất `is_target_cc_include_kn_m1`:** Migration 022 có logic bóc ngày điều chỉnh từ `v_sal_pending` → `v_emp_pending` và có field `is_target_cc_include_kn_m1` (kèm cast `BOOLEAN`). Migration 023 `CREATE OR REPLACE` toàn bộ function nhưng làm mất 2 logic này → submit sẽ bỏ qua `ngay_dieu_chinh_luong` và bỏ qua (hoặc lỗi ép kiểu) `is_target_cc_include_kn_m1`. Cần patch migration 023. Giữ nguyên `ngay_dieu_chinh_luong` trong `salarySchema` (FORM-ONLY field — Zod strip sẽ phá flow nếu bỏ).
3. **Quality gates:** Typecheck, shared tests (schema-sync count = 31), build verification
4. **Quick smoke test:** Verify stale closures trong `setPageInfo` — không tạo full phase, chỉ quick check
5. **Merge:** `git merge --no-ff` vào main, push
6. **Post-merge:** Update docs (SAU KHI CI/staging pass)

### Out of scope
- Tách sidebar refactor thành nhánh riêng (đã commit, không cần tách)
- Thêm server-side category filter cho ChangeHistoryTab (improvement sau)
- Refactor IIFE pattern trong JSX (cosmetic)
- Khôi phục `.url()` validation cho FRONTEND_URL (minor)

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-03-14] Salary Isolation`: Cách ly lương qua View `employee_info_only` và middleware check cứng cho Role VI → `SALARY_FIELDS_SET` phải chứa đầy đủ tất cả salary columns
  - `[2026-04-07] Salary Pending Isolation`: Dữ liệu nháp lương tách khỏi bảng employees
  - `[2026-03-13] Single Source of Truth`: Zod Schema là gốc cho cả FE Form và BE Logic → `salarySchema` chỉ chứa fields thuộc bảng `salaries`
- **"Cấm kỵ" cần tránh:**
  - Không được để VI thấy bất kỳ salary data nào trong change history, API response, hoặc UI
  - Không được phá contract `SALARY_FIELDS ↔ DB columns` sync
- **Ràng buộc kiến trúc liên quan:**
  - `changeHistory.ts` (branch) đã refactor filter từ after-query sang **DB-query level** (Supabase `NOT IN` clause) → filter chạy TRƯỚC pagination → không có metadata/pagination leakage

## 4. Giả định và câu hỏi mở

### Giả định
- G1: 3 fields `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc` **vẫn tồn tại trong DB**. Bằng chứng: migration 023 hàm `submit_employee_pending` liệt kê chúng trong `v_salary_fields`. Không có migration nào DROP các cột này.
- G2: Migrations 020-023 **chưa apply lên production** → có thể gộp nếu User muốn, nhưng không bắt buộc.
- G3: `setPageInfo` stale closures — mức impact thấp: `EmployeeDetailPage` có deps `[employee, setPageInfo]` (re-run khi refetch), `PendingRoomPage` chỉ set title/breadcrumbs (không có actions).

### Câu hỏi mở
- ~~[Blocking] Q1: 3 fields còn trong DB không?~~ → **ĐÃ TRẢ LỜI**: Có, bằng chứng từ migration 023.
- [Non-blocking] Q2: Migrations 020-023 đã apply staging chưa? Nếu chưa, có thể gộp.

## 5. Acceptance Criteria

- [ ] AC-01: `SALARY_FIELDS` chứa đúng **31 items** (30 gốc + 1 mới `is_target_cc_include_kn_m1`), bao gồm `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`
- [ ] AC-02: `salarySchema` VẪN chứa `ngay_dieu_chinh_luong` với comment FORM-ONLY (để đi qua pending payload), nhưng field này KHÔNG nằm trong `SALARY_FIELDS`
- [ ] AC-03: VI đăng nhập → Change History tab → KHÔNG thấy bất kỳ record nào có `field_changed` thuộc salary fields. Bao gồm verify cả API response (curl/Postman `GET /api/change-history/:ma_nhan_su` với VI token)
- [ ] AC-04: `pnpm run typecheck` pass trên nhánh sau khi sửa
- [ ] AC-05: `pnpm --filter @vcc/shared test` pass — `schema-sync.test.ts` assert count = **31**, `salary-validation.test.ts` pass
- [ ] AC-06: Quick smoke test: Export Excel ở SalaryListPage hoạt động đúng, header actions EmployeeDetailPage hoạt động sau refetch
- [ ] AC-07: Merge thành công vào `main` bằng `--no-ff`
- [ ] AC-08: EA → Điều chỉnh lương → OCR → Save → NS xuất hiện ở Phòng chờ (smoke test)

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `packages/shared/src/constants/salary-fields.ts` | **Sửa** | Thêm lại 3 fields vào `SALARY_FIELDS` | 🔴 | Có (SEC-REV-03) |
| `packages/shared/src/schemas/salary.ts` | **Sửa** | Thêm lại 3 salary fields + thêm comment FORM-ONLY cho `ngay_dieu_chinh_luong` | 🟡 | Có |
| `packages/shared/src/tests/schema-sync.test.ts` | **Sửa** | Cập nhật expected count: `28` → `31` | 🟡 | Có |
| `database/migrations/023_add_document_link_to_history.sql` | **Sửa** | Khôi phục logic bóc `ngay_dieu_chinh_luong` từ `v_sal_pending` → `v_emp_pending` | 🔴 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Đã review — gate cleared
- **Risk hotspots:**
  1. **SALARY_FIELDS_SET completeness**: Nếu sửa sai, VI vẫn thấy salary data → vi phạm security policy
  2. **schema-sync.test.ts count**: Count phải = 31 (khớp DB sau migration 020). `ngay_dieu_chinh_luong` KHÔNG nằm trong `SALARY_FIELDS` (thuộc employees), nhưng PHẢI giữ trong `salarySchema` (Zod strip sẽ phá flow nếu bỏ)
  3. **Migration 023 regression**: `CREATE OR REPLACE` mất logic bóc `ngay_dieu_chinh_luong` và mất field `is_target_cc_include_kn_m1` (cùng cast BOOLEAN) từ migration 022. Nếu không patch → submit sẽ bỏ qua hoặc lỗi.
- **Review focus areas:**
  - Consistency giữa `SALARY_FIELDS` (31), DB salary columns (31)
  - Migration 023 phải bóc `ngay_dieu_chinh_luong` từ `v_sal_pending` sang `v_emp_pending` và thêm `is_target_cc_include_kn_m1` vào mảng + cast đúng BOOLEAN.
- **Known pitfalls / historical issues:**
  - Phase 3 (Salary CRUD) từng thiếu fields cuối trong UI — giống vấn đề hiện tại
- **Dependencies / rollout concerns:**
  - Sửa trên nhánh `feature/dieu-chinh-luong` trước khi merge
  - Branch đã fix change_history filter ở DB level → không còn pagination leakage (issue cũ trên main)

## 8. Chiến lược triển khai

- **Phase strategy:** 2 phases:
  - **Phase 1 — Fix Blockers**: Sửa `SALARY_FIELDS` + `salarySchema` + test count + xử lý `ngay_dieu_chinh_luong` → verify typecheck + tests + quick smoke test
  - **Phase 2 — Merge & Post-merge**: Merge vào main, verify CI/staging, rồi mới update docs/archive

- **Thứ tự triển khai:**
  1. Checkout nhánh `feature/dieu-chinh-luong` local
  2. Phase 1: fix all → commit → verify
  3. Phase 2: push → merge → CI → smoke test → archive docs

- **Điểm cần phối hợp:**
  - Chỉ shared package + frontend, không cần phối hợp backend

- **Yêu cầu migration / config / deploy:**
  - 4 migrations (020→023) đã có trên nhánh, cần apply theo thứ tự trên staging
  - Không cần config mới, không cần env mới

## 9. Test Strategy

- **Automated tests:**
  - `pnpm --filter @vcc/shared test` — salary-validation.test.ts + schema-sync.test.ts (assert 31)
  - `pnpm run typecheck` — toàn monorepo
- **Manual verification:**
  - EA đăng nhập → Điều chỉnh lương → Save → NS xuất hiện ở phòng chờ
  - VI đăng nhập → Change History tab → KHÔNG thấy salary fields (UI)
  - VI → API test `GET /api/change-history/:ma_nhan_su` → response KHÔNG chứa salary records
  - Quick check: Export Excel ở SalaryListPage, header actions ở EmployeeDetailPage
- **Data / env chuẩn bị trước khi test:**
  - Tài khoản EA, VI đã có
  - Ít nhất 1 NS có salary data + change_history chứa ít nhất 1 record có `field_changed` thuộc salary fields (để verify filter thực sự lọc)

## 10. Rollback Plan

- Nếu merge gây regression: `git revert -m 1 <merge-commit>` trên main → push → deploy
- Migrations 020-023 (nếu đã apply):
  - 023: DROP COLUMN `document_id` FROM `change_history`, restore `submit_employee_pending` từ migration 022
  - 022: Restore `submit_employee_pending` từ migration 021, bỏ `ngay_dieu_chinh_luong` khỏi pending flow
  - 021: Restore `submit_employee_pending` từ migration 017 (phiên bản đã có Salary Pending Isolation)
  - 020: DROP COLUMN `is_target_cc_include_kn_m1` FROM `salaries` VÀ `snapshot_employees`, restore function `create_monthly_snapshot` về phiên bản trước migration 020.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
- Branch review report: xem artifact `branch-review-dieu-chinh-luong.md`
- Phản biện expert review: xem artifact `rebuttal-expert-review.md`

## Review Notes

- **Review hội đồng (2026-05-06):** ⚠️ CẦN SỬA — 2 blockers: (1) Q1 non-blocking, xóa Kịch bản B; (2) `ngay_dieu_chinh_luong` trong salarySchema sai scope.
- **Phản biện expert review (2026-05-06):** Bác bỏ 4/7 findings (FR-01 sai count, FR-04 migration, FR-06 bac_luong, FR-07 pagination). Đồng ý 3/7 (FR-02 Q1, FR-03 API test, FR-05 archive ordering).
- **Plan v2 (2026-05-06):** Đề xuất bỏ `ngay_dieu_chinh_luong` khỏi salarySchema.
- **Expert counter (2026-05-06):** Phát hiện Zod strip sẽ phá flow. Đúng.
- **Plan v3 (2026-05-06):** ✅ ĐỒNG Ý — Giữ `ngay_dieu_chinh_luong` trong salarySchema (FORM-ONLY). Thêm task patch migration 023 để khôi phục logic bóc field. Gate cleared.
