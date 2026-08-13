# Feature Tasks: Chặn Triệt Để Test Tác Động Vào DB Cloud

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-28

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Core Safety Refactoring (Guard & Env Isolation)

**Mục tiêu:** Tách module guard thuần không side-effect, làm `vitest.integration.setup.ts` fail-fast vô điều kiện (rethrow), chặn `env.ts` nạp `.env.local` khi `NODE_ENV=test`, và cập nhật `backend/.env.test` an toàn.

- [x] Task 1.1: Tạo module `backend/src/utils/safetyGuard.ts` chứa hàm `validateLocalSupabaseUrl()` không side-effect. <!-- Sửa theo EFR-03 -->
- [x] Task 1.2: Cập nhật `backend/src/__tests__/unit/safetyGuard.test.ts` import từ `src/utils/safetyGuard.ts` để unit test / CI không bị crash bởi setup side-effects. <!-- Sửa theo EFR-03 -->
- [x] Task 1.3: Cập nhật `backend/vitest.integration.setup.ts` gọi `validateLocalSupabaseUrl()` vô điều kiện và `throw e;` ngắt lập tức khi target URL không phải local. <!-- Sửa theo EFR-01 -->
- [x] Task 1.4: Cập nhật `backend/src/config/env.ts` để khi `NODE_ENV=test`, bỏ qua việc nạp `.env.local` chứa Cloud secrets. <!-- Sửa theo EFR-01, EFR-02 -->
- [x] Task 1.5: Cập nhật `backend/.env.test` trỏ mặc định `http://127.0.0.1:54321` kèm local anon & service-role dummy keys phục vụ fresh clone. <!-- Sửa theo EFR-09 -->
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy `pnpm --filter backend test` unit suite để đảm bảo 100% pass trên CI env). <!-- Sửa theo EFR-03 -->

---

## Phase 2: Local Harness Provisioning, Dynamic Migration Mirror Sync & Tooling Quarantine

**Mục tiêu:** Cài đặt và pin phiên bản `supabase` CLI vào root `package.json`, viết script `sync-migrations.cjs` mirror clean-sync toàn bộ migrations từ `database/` sang `supabase/migrations/`, cấu hình chuỗi reset & test integration trong `backend/package.json` trỏ `--workdir ..` qua `pnpm exec supabase`, tạo `supabase/seed.sql`, dọn dẹp nạp `.env.local` ở các bài test integration, và quarantine scratch scripts.

- [x] Task 2.1: Khai báo và pin cố định phiên bản `supabase` CLI trong `devDependencies` của root `package.json` để đảm bảo tính đồng nhất 100% cho toàn bộ team và CI runner. <!-- Sửa theo EFR-16 -->
- [x] Task 2.2: Viết script `backend/scripts/sync-migrations.cjs` tự động mirror clean-sync (xóa cũ, copy mới) `database/001_schema.sql` (thành `001`) và **toàn bộ** các file migration SQL trong `database/migrations/` (bất kể số lượng) sang `supabase/migrations/`. <!-- Sửa theo EFR-08, EFR-10, EFR-14 -->
- [x] Task 2.3: Cập nhật `backend/package.json` bổ sung chuỗi lệnh `"test:integration:fresh": "node scripts/sync-migrations.cjs && pnpm exec supabase db reset --workdir .. --local && vitest run --config vitest.integration.config.ts"`. <!-- Sửa theo EFR-12, EFR-15, EFR-16 -->
- [x] Task 2.4: Tạo file `supabase/seed.sql` chứa Auth users, superadmins, permissions, dummy employee & `employee_reviewers` mapping cho Supabase Local Docker. <!-- Sửa theo EFR-04, EFR-11 -->
- [x] Task 2.5: Rà soát và gỡ bỏ `dotenv.config({ path: ... '.env.local' })` ở tất cả các file trong `backend/src/__tests__/integration/`. <!-- Sửa theo EFR-01 -->
- [x] Task 2.6: Rà soát, dọn dẹp hoặc thêm safety check cho các file `backend/scratch_*` có nguy cơ nạp `.env.local` đâm vào Cloud. <!-- Sửa theo EFR-07 -->
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Chạy `pnpm --filter backend test:integration:fresh` xác nhận script sync migrations + db reset qua pnpm exec supabase + seed nạp 100% thành công). <!-- Sửa theo EFR-08, EFR-10, EFR-11, EFR-12, EFR-14, EFR-15, EFR-16 -->

---

## Phase 3: Verification & Failure Assertion

**Mục tiêu:** Kiểm chứng command-level safety bằng assertion child process với fake non-local URL và chạy full suite trên Local Docker.

- [x] Task 3.1: Viết test assertion kiểm tra `vitest.integration.setup.ts` trong child-process với URL non-local giả (vd: `http://fake-cloud-target.invalid`) -> Khẳng định exit code != 0 và 0 test executed. <!-- Sửa theo EFR-06 -->
- [x] Task 3.2: Chạy `pnpm --filter backend test:integration:fresh` trên Supabase Local Docker (`127.0.0.1:54321`) -> Khẳng định pass 100%. <!-- Sửa theo EFR-04, EFR-06, EFR-08, EFR-09, EFR-10, EFR-11, EFR-12, EFR-14, EFR-15, EFR-16 -->
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Xác nhận hoàn tất 100% không ảnh hưởng Cloud DB).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-28 16:38 | - | - | Cập nhật plan & tasks theo EFR-16 | done | Đã hội tụ phản biện vòng 6 |
| 2026-07-28 16:49 | Phase 1 | Task 1.1 | Đã tạo backend/src/utils/safetyGuard.ts | done | |
| 2026-07-28 16:49 | Phase 1 | Task 1.2 | Cập nhật/tạo unit test safetyGuard.test.ts | start | |
| 2026-07-28 16:50 | Phase 1 | Task 1.2 | Cập nhật unit test safetyGuard.test.ts xong | done | |
| 2026-07-28 16:50 | Phase 1 | Task 1.3 | Cập nhật vitest.integration.setup.ts để gọi safety guard vô điều kiện | start | |
| 2026-07-28 16:50 | Phase 1 | Task 1.3 | Cập nhật vitest.integration.setup.ts xong | done | |
| 2026-07-28 16:50 | Phase 1 | Task 1.4 | Cập nhật backend/src/config/env.ts | done | |
| 2026-07-28 16:51 | Phase 1 | Task 1.5 | Cập nhật backend/.env.test xong | done | |
| 2026-07-28 16:51 | Phase 1 | Task 1.Final | Chạy unit tests để tự test trước | start | |
| 2026-07-28 16:51 | Phase 1 | Task 1.Final | Chạy unit tests thành công (54 tests passed) | done | Chờ User confirm |
| 2026-07-28 16:52 | Phase 1 | Task 1.Final | User confirm và kết thúc Phase 1 | done | |
| 2026-07-28 16:52 | Phase 2 | Task 2.1 | Bắt đầu pin version supabase CLI | start | |
| 2026-07-28 16:52 | Phase 2 | Task 2.1 | Cài đặt và pin supabase CLI thành công | done | |
| 2026-07-28 16:53 | Phase 2 | Task 2.2 | Bắt đầu viết script backend/scripts/sync-migrations.cjs | start | |
| 2026-07-28 16:53 | Phase 2 | Task 2.2 | Viết và chạy thử sync-migrations.cjs thành công | done | |
| 2026-07-28 16:54 | Phase 2 | Task 2.3 | Cập nhật backend/package.json thêm script test:integration:fresh | start | |
| 2026-07-28 16:54 | Phase 2 | Task 2.3 | Cập nhật backend/package.json xong | done | |
| 2026-07-28 16:54 | Phase 2 | Task 2.4 | Bắt đầu tạo file supabase/seed.sql | start | |
| 2026-07-28 16:54 | Phase 2 | Task 2.4 | Tạo file supabase/seed.sql xong | done | |
| 2026-07-28 16:55 | Phase 2 | Task 2.5 | Rà soát và loại bỏ dotenv.config({ path: ... '.env.local' }) trong test integration | start | |
| 2026-07-28 16:55 | Phase 2 | Task 2.5 | Đã dọn dẹp tất cả 15 files integration test | done | |
| 2026-07-28 16:56 | Phase 2 | Task 2.6 | Bắt đầu rà soát các scratch script | start | |
| 2026-07-28 16:56 | Phase 2 | Task 2.6 | Đã thêm safety guard cho tất cả 12 scratch scripts | done | |
| 2026-07-28 16:56 | Phase 2 | Task 2.Final | Chạy test:integration:fresh để tự test trước | start | |
| 2026-07-28 17:27 | Phase 2 | Task 2.Final | Chạy test:integration:fresh thành công (143/143 tests passed) | done | Chờ User confirm |
| 2026-07-28 17:31 | Phase 2 | Task 2.Final | User confirm và kết thúc Phase 2 | done | |
| 2026-07-28 17:31 | Phase 3 | Task 3.1 | Bắt đầu viết test assertion trong child-process | start | |
| 2026-07-28 17:32 | Phase 3 | Task 3.1 | Đã viết và test assertion child-process thành công | done | |
| 2026-07-28 17:32 | Phase 3 | Task 3.2 | Chạy test:integration:fresh để xác nhận pass 100% | start | |
| 2026-07-28 17:39 | Phase 3 | Task 3.2 | Chạy test:integration:fresh thành công (143/143 tests passed) | done | |
| 2026-07-28 17:39 | Phase 3 | Task 3.Final | Xác nhận hoàn tất không tác động Cloud DB | start | |
| 2026-07-28 17:40 | Phase 3 | Task 3.Final | User confirm và kết thúc Phase 3 | done | |
| 2026-07-28 17:40 | - | - | Đã hoàn thành toàn bộ feature | done | |

