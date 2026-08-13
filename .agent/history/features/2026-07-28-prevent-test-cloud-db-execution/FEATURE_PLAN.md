# Feature Plan: Chặn Triệt Để Test Tác Động Vào DB Cloud (Prevent Test Cloud DB Execution)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Plan đã được phê duyệt (✅ ĐỒNG Ý)
> **Feature slug**: `prevent-test-cloud-db-execution`
> **Tạo bởi**: feature-plan (Updated by expert-rebuttal Round 6)
> **Ngày tạo**: 2026-07-28

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Các bộ test integration (như `snapshots.test.ts`, `employee.test.ts`, `adminCleanup.test.ts`...) khi được khởi chạy đã từng đâm trực tiếp vào Database Cloud Supabase thực tế (`https://ymmqxoxtnaavkcidpoaq.supabase.co`), chèn/sửa/xóa dữ liệu nhân sự test (`S99999`, `MOCKCLEAN001`, `SNAPEMP01`, `TMPCLEAN001`...) và làm rác dữ liệu đợt chốt `Admicro` cũng như `audit_log`.
- **Vấn đề cần giải quyết:** 
  1. `vitest.integration.setup.ts` bị nuốt exception im lặng trong `catch(e)` rỗng và chỉ check khi URL đã tồn tại ở top-level. <!-- Sửa theo EFR-01 -->
  2. `safetyGuard.test.ts` import trực tiếp `vitest.integration.setup.ts` có top-level side effects gây crash unit test runner hoặc CI. <!-- Sửa theo EFR-03 -->
  3. Nhiều integration test tạo Supabase Client bằng `SUPABASE_SERVICE_ROLE_KEY` bypass RLS trực tiếp, khiến việc đổi mật khẩu user Cloud không ngăn được ghi DB nếu Service Key lọt vào test environment. <!-- Sửa theo EFR-02 -->
  4. Các file test integration tự ý gọi `dotenv.config({ path: '.env.local' })`, và `backend/src/config/env.ts` tự động nạp `.env.local` khi `NODE_ENV=test`. <!-- Sửa theo EFR-01 -->
  5. Thiếu artifact provisioning local seed (`supabase/seed.sql`) và đồng bộ baseline `database/001_schema.sql` cùng toàn bộ delta migrations trong `database/migrations/` vào `supabase/migrations/` khiến fresh clone `supabase db reset` không dựng được application schema. <!-- Sửa theo EFR-04, EFR-08, EFR-10, EFR-14 -->
  6. Việc copy SQL files sang `supabase/migrations/` chưa tự động apply vào local Postgres container nếu thiếu bước `supabase db reset` trong lệnh test. <!-- Sửa theo EFR-12 -->
  7. Lệnh bare `supabase` trong `backend/package.json` bị lỗi `Command not found` trên fresh clone thiếu global CLI và nhận sai `cwd` vì `config.toml` nằm ở repo root. <!-- Sửa theo EFR-15 -->
  8. Việc gọi `npx` không pin phiên bản Supabase CLI trong `package.json` làm câu lệnh test không deterministic và phụ thuộc network. <!-- Sửa theo EFR-16 -->
  9. File `backend/.env.test` được git-track hiện chứa Cloud-like URL (`https://test.supabase.co`) và thiếu local keys khiến fresh clone bị safety guard chặn hoặc thiếu credential. <!-- Sửa theo EFR-09 -->
  10. Thiếu dummy employee & `employee_reviewers` fixtures trong local seed contract khiến `permission.test.ts` fail khi assert reviewer. <!-- Sửa theo EFR-11 -->
  11. Các scratch script (`scratch_run_submit.js`, `scratch_restore_live.js`...) nạp `.env.local` chưa có guard. <!-- Sửa theo EFR-07 -->

- **Mục tiêu & Phương án Bảo vệ:**
  - **Tách biệt Module Safety Guard (EFR-03):** Tạo module thuần `backend/src/utils/safetyGuard.ts` chứa logic `validateLocalSupabaseUrl()` không side-effect.
  - **Bootstrap Fail-Fast Vô Điều Kiện (EFR-01):** Trong `vitest.integration.setup.ts`, gọi `validateLocalSupabaseUrl()` vô điều kiện. Nếu target không phải `http://127.0.0.1:54321`, rethrow exception ngắt lập tức 100% tiến trình test.
  - **Vô hiệu hóa Nạp `.env.local` khi `NODE_ENV=test` & Chuẩn hóa `.env.test` (EFR-01, EFR-02, EFR-09):** Chỉnh `backend/src/config/env.ts` ngưng nạp `.env.local` khi `NODE_ENV=test`, đồng thời cập nhật `backend/.env.test` trỏ mặc định `http://127.0.0.1:54321` kèm local Docker keys chuẩn.
  - **Pin Version Supabase CLI & Provisioning Full Schema Baseline (EFR-04, EFR-08, EFR-10, EFR-11, EFR-12, EFR-14, EFR-15, EFR-16):** 
    - Cài đặt và pin cố định `supabase` CLI vào `devDependencies` của root `package.json` (`pnpm add -D supabase -w`) để đảm bảo tính đồng nhất 100% cho mọi dev và CI.
    - Tạo script `backend/scripts/sync-migrations.cjs` thực hiện mirror clean-sync (xóa cũ, copy mới) quét động `database/001_schema.sql` (thành `001`) và **toàn bộ** delta migration SQL trong `database/migrations/` bất kể số lượng file.
    - Chuỗi lệnh `"test:integration:fresh"` trong `backend/package.json` sử dụng pnpm CLI đã pin và trỏ `--workdir ..` chỉ định đúng Supabase project root: `node scripts/sync-migrations.cjs && pnpm exec supabase db reset --workdir .. --local && vitest run --config vitest.integration.config.ts`.
    - Bổ sung `supabase/seed.sql` chứa Auth users, superadmins, permissions, dummy employee & `employee_reviewers` mapping cho local harness.
  - **Dọn dẹp Scratch Scripts (EFR-07):** Rà soát và thêm safety check cho các scratch scripts.

## 2. Phạm vi

### In scope
- Tạo module `backend/src/utils/safetyGuard.ts` và refactor `safetyGuard.test.ts`. <!-- Sửa theo EFR-03 -->
- Cập nhật `vitest.integration.setup.ts` gọi fail-fast vô điều kiện (rethrow). <!-- Sửa theo EFR-01 -->
- Cập nhật `backend/src/config/env.ts` bỏ nạp `.env.local` khi `NODE_ENV=test`. <!-- Sửa theo EFR-01 -->
- Cập nhật `backend/.env.test` mặc định trỏ `http://127.0.0.1:54321` kèm local anon & service-role keys. <!-- Sửa theo EFR-09 -->
- Pin phiên bản `supabase` CLI trong root `package.json`. <!-- Sửa theo EFR-16 -->
- Viết script `backend/scripts/sync-migrations.cjs` mirror clean-sync động toàn bộ migrations từ `database/` sang `supabase/migrations/`. <!-- Sửa theo EFR-08, EFR-10, EFR-14 -->
- Cấu hình chuỗi lệnh reset & test integration trong `backend/package.json` dùng `pnpm exec supabase --workdir ..`. <!-- Sửa theo EFR-12, EFR-15, EFR-16 -->
- Tạo `supabase/seed.sql` kèm reviewer fixtures. <!-- Sửa theo EFR-04, EFR-11 -->
- Gỡ bỏ `dotenv.config({ path: '.env.local' })` ở tất cả file integration test và bảo vệ scratch scripts. <!-- EFR-07 -->

### Out of scope
- Tự động thay đổi mật khẩu / credentials trên môi trường Cloud Prod/Dev (chuyển thành Security Runbook riêng do Ops/User phê duyệt). <!-- Sửa theo EFR-05 -->

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-07-24] Supabase Local Docker CLI Harness Standard`: Test integration 100% bằng Supabase Local Docker CLI (`127.0.0.1:54321`).

## 4. Giả định và câu hỏi mở

### Giả định
- **[Non-blocking]**: Test integration yêu cầu Supabase Local Docker CLI (`127.0.0.1:54321`) hoạt động. Nếu chưa bật, test runner sẽ crash báo lỗi an toàn thay vì kết nối Cloud.

## 5. Acceptance Criteria

- [ ] Khi `SUPABASE_URL` trỏ về dummy non-local URL (vd: `http://fake-cloud-target.invalid`), `pnpm --filter backend test:integration` crash ngắt ngay từ Setup với thông báo `[SafetyGuard] SECURITY REFUSAL` (0 test executed). <!-- Sửa theo EFR-06 -->
- [ ] Unit tests (`pnpm --filter backend test`) pass 100% trên CI/local mà không bị side-effect từ integration setup. <!-- Sửa theo EFR-03 -->
- [ ] Trên fresh clone không cài global Supabase CLI, lệnh `pnpm --filter backend test:integration:fresh` tự động chạy Supabase CLI đã được pin version trong `package.json`, trỏ đúng `--workdir ..` repo root, mirror clean-sync `001_schema.sql` + toàn bộ delta migrations, thực thi `pnpm exec supabase db reset --workdir .. --local`, nạp seed test users và reviewer fixtures thành công mà không cần mạng để tải CLI hay báo lỗi missing binary. <!-- Sửa theo EFR-04, EFR-08, EFR-10, EFR-11, EFR-12, EFR-14, EFR-15, EFR-16 -->
- [ ] Tracked file `backend/.env.test` trỏ an toàn về `http://127.0.0.1:54321` và có sẵn local keys cho fresh clone. <!-- Sửa theo EFR-09 -->

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/utils/safetyGuard.ts` | Tạo mới | Tách hàm `validateLocalSupabaseUrl` thuần | 🟢 Thấp | Có |
| `backend/vitest.integration.setup.ts` | Sửa | Chạy fail-fast vô điều kiện (rethrow) | 🔴 Cao | Có |
| `backend/src/config/env.ts` | Sửa | Bỏ load `.env.local` khi `NODE_ENV=test` | 🟡 Trung bình | Có |
| `backend/.env.test` | Sửa | Trỏ `http://127.0.0.1:54321` và local keys | 🟢 Thấp | Có |
| `package.json` (root) | Sửa | Pin version `supabase` CLI vào devDependencies | 🟢 Thấp | Có |
| `backend/package.json` | Sửa | Cấu hình script sync & reset test integration dùng `pnpm exec supabase --workdir ..` | 🟢 Thấp | Có |
| `supabase/migrations/` | Tạo / Sync | Mirror clean-sync 001_schema.sql + toàn bộ delta migrations | 🟡 Trung bình | Có |
| `supabase/seed.sql` | Tạo mới | Cung cấp local test seed data + reviewer fixtures | 🟢 Thấp | Có |
| `backend/src/__tests__/unit/safetyGuard.test.ts` | Sửa | Import từ `src/utils/safetyGuard.ts` | 🟢 Thấp | Có |
| `backend/src/__tests__/integration/*.test.ts` | Sửa | Gỡ bỏ `dotenv.config({ path: '.env.local' })` | 🟡 Trung bình | Có |
| `backend/scratch_*` | Dọn dẹp | Loại bỏ / bảo vệ scratch scripts | 🟢 Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Pin version CLI và project root resolution `--workdir ..` cho Supabase CLI.

## 8. Chiến lược triển khai

- **Phase 1:** Core Refactoring (`safetyGuard.ts`, `env.ts`, `vitest.integration.setup.ts`, `safetyGuard.test.ts`, `backend/.env.test`). <!-- Sửa theo EFR-01, EFR-03, EFR-09 -->
- **Phase 2:** Local Harness Baseline, CLI Version Pinning, Dynamic Mirror Sync & Seed Provisioning (`package.json`, `sync-migrations.cjs`, `backend/package.json`, `supabase/migrations/`, `supabase/seed.sql`, `__tests__/integration/*`, scratch cleanup). <!-- Sửa theo EFR-04, EFR-07, EFR-08, EFR-10, EFR-11, EFR-12, EFR-14, EFR-15, EFR-16 -->
- **Phase 3:** Verification bằng Child Process Failure Assertion & Local Docker Test Run. <!-- Sửa theo EFR-06 -->

## 9. Test Strategy

- **Automated tests:**
  - Unit test validator: `pnpm --filter backend test` (chạy unit tests).
  - Integration guard failure test (dùng non-local dummy URL trong child process assertion). <!-- Sửa theo EFR-06 -->
  - Integration full suite on Local Docker: `pnpm --filter backend test:integration:fresh`.

## 10. Rollback Plan

- Revert git commit nếu có vấn đề.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
