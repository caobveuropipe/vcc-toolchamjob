# Feature Plan: Thêm trường tạm ứng hàng tháng vào bảng salaries

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã review (2 vòng — internal + external council). Có thể handoff sang `feature-coordinator`
> **Feature slug**: add-tam-ung-hang-thang
> **Tạo bởi**: skill-feature-plan
> **Ngày tạo**: 2026-03-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Phát sinh nhu cầu một số nhân sự cần tạm ứng hàng tháng theo một số tiền cố định. Không phải tất cả nhân sự đều có khoản tạm ứng này — chỉ một số người được cấu hình.
- **Vấn đề cần giải quyết:** Hiện tại bảng `salaries` chưa có trường lưu giá trị tạm ứng hàng tháng. Cần bổ sung để phục vụ nghiệp vụ tạm ứng hàng tháng và trace lại qua snapshot.
- **Mục tiêu:** Thêm trường `tam_ung_hang_thang` vào bảng `salaries`, đồng bộ tất cả các layer liên quan (DB → Zod schema → constants → views → snapshot function → tests).
- **Kết quả mong đợi:** Trường mới xuất hiện đúng trong DB, Zod, constants, view `employee_full`, snapshot copy, và tất cả CI sync tests pass.

## 2. Phạm vi

### In scope
- ALTER TABLE `salaries`: thêm cột `tam_ung_hang_thang NUMERIC(15,0) CHECK (tam_ung_hang_thang >= 0)` (nullable)
- ALTER TABLE `snapshot_employees`: thêm cột `tam_ung_hang_thang NUMERIC(15,0)` (nullable)
- Cập nhật VIEW `employee_full`: thêm `s.tam_ung_hang_thang`
- Cập nhật FUNCTION `create_monthly_snapshot`: thêm cột vào INSERT...SELECT
- Cập nhật `001_schema.sql`: phản ánh schema mới (source of truth docs)
- Tạo migration file `003_add_tam_ung_hang_thang.sql` (idempotent)
- Cập nhật Zod schema `salary.ts`: thêm `tam_ung_hang_thang`
- Cập nhật `SALARY_FIELDS` constant: thêm field mới
- Cập nhật CI sync test: cập nhật expected count 24 → 25
- Cập nhật business docs: `.agent/business/data/SCHEMA.md` và `.agent/business/modules/NS-002_salary_crud.md` (count 24→25, 18→19)

### Out of scope
- UI form nhập/hiển thị tạm ứng (sẽ làm khi triển khai module NS-002 Salary Management)
- Backend API route cho salary CRUD (chưa có, sẽ triển khai ở phase riêng)
- Nghiệp vụ "lưu vào data thu nhập để bù trừ" (sẽ xử lý ở phase thu nhập)
- Logic tạm ứng hàng loạt (batch advance) cho nhiều nhân sự

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Zod Schema là Single Source of Truth cho FE+BE — phải có CI test đảm bảo Zod đồng bộ 100% với DB (`information_schema`) → KB line 41
  - `ma_nhan_su` là Immutable → không ảnh hưởng feature này
  - Snapshot là bản sao vật lý → trường mới phải được copy vào snapshot
- **"Cấm kỵ" cần tránh:**
  - Không dùng Tailwind (KB line 40) → không liên quan
  - Không skip RLS check khi Redis down (KB line 25) → không liên quan
- **Ràng buộc kiến trúc liên quan:**
  - Hybrid Security: RLS `USING(false)` trên `salaries` → migration không cần sửa RLS policy, chỉ thêm cột
  - Salary Isolation: trường mới thuộc salary → VI không được xem → `employee_info_only` view không cần sửa (đúng, vì view đó chỉ chứa employee fields)
  - `SALARY_FIELDS` constant dùng để filter change_history cho VI → phải thêm field mới vào constant

## 4. Giả định và câu hỏi mở

### Giả định
- [GA-1] Trường `tam_ung_hang_thang` thuộc nhóm "Bộ Cơ chế" (User đã confirm)
- [GA-2] Trường nullable vì không phải nhân sự nào cũng có tạm ứng (User đã confirm)
- [GA-3] Kiểu `NUMERIC(15,0)` giống các cột salary khác, CHECK >= 0 (User đã confirm)
- [GA-4] Snapshot phải copy trường này (User đã confirm)
- [GA-5] Migration file sẽ là `003_add_tam_ung_hang_thang.sql`, tuân theo convention idempotent (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`)
- [GA-6] Không cần backend route / frontend UI trong scope này vì module NS-002 chưa triển khai

### Câu hỏi mở
- Không còn câu hỏi blocking

## 5. Acceptance Criteria

- [ ] AC-1: Cột `tam_ung_hang_thang` tồn tại trong bảng `salaries` với đúng kiểu `NUMERIC(15,0)`, nullable, CHECK >= 0
- [ ] AC-2: Cột `tam_ung_hang_thang` tồn tại trong bảng `snapshot_employees` với kiểu `NUMERIC(15,0)`, nullable
- [ ] AC-3: View `employee_full` trả về cột `tam_ung_hang_thang` từ `salaries`
- [ ] AC-4: View `employee_info_only` KHÔNG chứa cột `tam_ung_hang_thang` (salary isolation)
- [ ] AC-5: Function `create_monthly_snapshot` copy `tam_ung_hang_thang` khi tạo snapshot
- [ ] AC-6: Zod `salarySchema` có field `tam_ung_hang_thang` với validation đúng
- [ ] AC-7: `SALARY_FIELDS` constant bao gồm `'tam_ung_hang_thang'`, tổng 25 fields
- [ ] AC-8: CI sync test (`schema-sync.test.ts`) pass với 25 fields
- [ ] AC-9: `001_schema.sql` phản ánh schema mới (documentation source of truth)
- [ ] AC-10: Migration file `003_add_tam_ung_hang_thang.sql` tồn tại và idempotent

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/001_schema.sql` | Sửa | Thêm cột vào `salaries`, `snapshot_employees`, cập nhật view + function | 🔴 | Có (FILE-LEVEL CONTRACT) |
| `database/migrations/003_add_tam_ung_hang_thang.sql` | Tạo | Migration idempotent cho Supabase | 🟡 | Chưa (convention từ 002) |
| `packages/shared/src/schemas/salary.ts` | Sửa | Thêm field Zod, cập nhật comment count | 🟡 | Có (Single Source of Truth) |
| `packages/shared/src/constants/salary-fields.ts` | Sửa | Thêm field vào array + cập nhật count | 🟡 | Có (SEC-REV-03) |
| `packages/shared/src/tests/schema-sync.test.ts` | Sửa | Cập nhật expected count 24 → 25 | 🟢 | Không |
| `.agent/business/data/SCHEMA.md` | Sửa | Cập nhật count salary fields 24→25, sub-count Cơ chế 18→19, snapshot 48→49 | 🟢 | Có (self-declared source of truth cho field definitions) |
| `.agent/business/modules/NS-002_salary_crud.md` | Sửa | Cập nhật count 24→25 cột, Cơ chế 18→19 cột | 🟢 | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Khuyến nghị — schema change ảnh hưởng multi-layer)
- **Risk hotspots:**
  - 🔴 `001_schema.sql`: Chạm nhiều object (table, view, function) — cần verify không break existing data
  - 🟡 Migration file: Phải idempotent (verify bằng rerun lần 2), phải `CREATE OR REPLACE` view/function, `ADD COLUMN IF NOT EXISTS` cho tables
  - 🟡 Snapshot function: Phải thêm cả INSERT column list VÀ SELECT column list — thiếu 1 bên sẽ silent data loss
  - 🟢 Migration file: Ghi sẵn reverse SQL dưới dạng comment `-- ROLLBACK:` để rollback nhanh khi cần
- **Review focus areas:**
  - Migration idempotency: Có chạy lại được không?
  - View đúng/đủ: `employee_full` có trường mới, `employee_info_only` KHÔNG có
  - Function `create_monthly_snapshot`: cả INSERT và SELECT đều đầy đủ cột mới
  - Zod sync: CI test có pass không?
- **Known pitfalls / historical issues:**
  - Từng gặp lỗi sai tên bảng trong migration (CHANGELOG-DB 2026-03-16) → cần review kỹ tên cột/bảng
  - Convention migration idempotent đã được chốt từ v2.4.0
- **Dependencies / rollout concerns:**
  - Migration phải chạy trên Supabase trước khi deploy code mới
  - Sau khi thêm cột DB, cần rebuild `@vcc/shared` để FE/BE nhận Zod schema mới
  - Không cần backfill data (cột nullable, default NULL cho existing rows)

## 8. Chiến lược triển khai

- **Phase strategy:** 2 phases
  - **Phase 1 — DB Layer**: Migration + cập nhật `001_schema.sql` (schema source of truth)
  - **Phase 2 — Code Layer**: Zod schema + constants + CI sync test cập nhật + build shared
- **Thứ tự triển khai:**
  1. Tạo migration SQL → chạy trên Supabase
  2. Cập nhật `001_schema.sql` (docs)
  3. Cập nhật Zod schema + constants + test
  4. Rebuild `@vcc/shared`
  5. Verify CI sync test pass
- **Điểm cần phối hợp:** Không (tự triển khai được, không cần FE/BE route thay đổi)
- **Yêu cầu migration / config / deploy:**
  - Migration `003_add_tam_ung_hang_thang.sql` chạy trên Supabase SQL Editor
  - Không cần thay đổi env, config, deploy pipeline

## 9. Test Strategy

- **Automated tests:**
  - CI sync test `schema-sync.test.ts`: verify Zod ↔ DB columns match (25 fields)
  - CI sync test: verify `SALARY_FIELDS` ↔ DB columns match (25 fields)
- **Manual verification:**
  - Chạy migration trên Supabase → verify cột tồn tại qua SQL query
  - Query `employee_full` view → verify cột `tam_ung_hang_thang` xuất hiện
  - Query `employee_info_only` view → verify cột `tam_ung_hang_thang` KHÔNG xuất hiện
  - Insert salary record với `tam_ung_hang_thang = 5000000` → verify thành công
  - Insert salary record với `tam_ung_hang_thang = -1` → verify CHECK constraint reject
  - Tạo snapshot → verify `snapshot_employees` có cột `tam_ung_hang_thang` với giá trị đúng
- **Data / env chuẩn bị trước khi test:**
  - `TEST_DATABASE_URL` env cho CI sync test (đã có sẵn)
  - Existing salary data không bị ảnh hưởng (cột nullable)

## 10. Rollback Plan

- Reverse SQL được ghi sẵn dưới dạng comment `-- ROLLBACK:` trong migration file `003_add_tam_ung_hang_thang.sql`
- Nếu migration có vấn đề:
  1. `ALTER TABLE salaries DROP COLUMN IF EXISTS tam_ung_hang_thang;`
  2. `ALTER TABLE snapshot_employees DROP COLUMN IF EXISTS tam_ung_hang_thang;`
  3. `CREATE OR REPLACE VIEW employee_full AS ...` (bản cũ — copy từ `-- ROLLBACK:` block trong migration)
  4. `CREATE OR REPLACE FUNCTION create_monthly_snapshot(...)` (bản cũ — copy từ `-- ROLLBACK:` block)
  5. Revert Zod schema, constants, test, business docs về commit trước
- Rủi ro rollback: Thấp — cột mới nullable, không có data dependency
- Operator không cần lần git history — reverse SQL có sẵn trong migration file

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## Review Notes

- **Review lần 1 (internal):** ✅ ĐỒNG Ý — 1 finding Low (FR-01: documentation sub-counts)
- **Review lần 2 (external council):** ⚠️ CẦN SỬA — 4 findings
  - FR-01 [Cao→Trung bình]: Nhận — thêm business docs vào scope (SCHEMA.md, NS-002). Hạ severity vì đây là nợ docs cũ, không phải lỗi plan gây ra.
  - FR-02 [Cao→Cao]: Nhận — thêm bước rerun migration lần 2 verify idempotency vào Task 1.Final.
  - FR-03 [Trung bình]: Nhận một phần — ghi reverse SQL vào comment block trong migration file thay vì commit tag riêng.
  - FR-04 [Trung bình]: Bác — AC-7 đã cover SALARY_FIELDS mechanism, route change_history chưa tồn tại nên không thể tạo AC verify được.
  - Phụ: `guards.ts` dùng `'employees'` thay vì `'employee_full'` — ghi nhận, không phải blocker feature này.
- **Verdict cuối:** ✅ ĐỒNG Ý sau khi cập nhật plan theo FR-01, FR-02, FR-03.
