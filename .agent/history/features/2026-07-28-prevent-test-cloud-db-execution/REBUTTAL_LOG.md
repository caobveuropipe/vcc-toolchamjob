# Rebuttal Log: prevent-test-cloud-db-execution

## Round 1 - 2026-07-28T13:44:00+07:00
### Tổng kết
- EFR: 7 (accepted: 7, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `.agent/active/prevent-test-cloud-db-execution/EXPERT_REVIEW.md:1-77`
  - `backend/vitest.integration.setup.ts:45-60`
  - `backend/src/config/env.ts:1-25`
  - `backend/src/__tests__/unit/safetyGuard.test.ts:1-43`
  - `supabase/` directory list

### EFR Đã Chấp Nhận
- **[EFR-01] Sửa `catch` chưa đóng đường bypass khi env thiếu hoặc được nạp muộn** | Sửa: Tách logic guard, gọi `validateLocalSupabaseUrl()` vô điều kiện trong `vitest.integration.setup.ts`, và bỏ nạp `.env.local` trong `env.ts` khi `NODE_ENV=test`.
- **[EFR-02] Lớp đổi mật khẩu không bảo vệ các đường ghi bằng `service_role`** | Sửa: Loại bỏ việc coi đổi mật khẩu Cloud user là control ngăn ghi DB (vì `service_role` key bypass RLS & login). Tập trung control vào URL Validation & Env Isolation.
- **[EFR-03] Cách sửa dự kiến làm vỡ unit test và CI hiện tại** | Sửa: Tách `validateLocalSupabaseUrl()` sang module `src/utils/safetyGuard.ts` không side-effect. `unit/safetyGuard.test.ts` import từ module này để không làm crash CI.
- **[EFR-04] Local harness không tái tạo được từ trạng thái sạch** | Sửa: Bổ sung Task 2.2 tạo `supabase/seed.sql` phục vụ provisioning local docker từ trạng thái sạch.
- **[EFR-05] Task đổi credential Cloud là thay đổi external state chưa được phê duyệt và không có rollback** | Sửa: Chuyển credential rotation trên Cloud ra ngoài scope PR code thành Security Runbook đề xuất riêng.
- **[EFR-06] Verification chưa chứng minh được command-level safety và dùng target Cloud thật không cần thiết** | Sửa: Cập nhật Phase 3 Test Strategy dùng child-process test với non-local dummy URL (`http://fake-cloud-target.invalid`) để assert failure, không dùng Cloud URL thật.
- **[EFR-07] Hotspot scratch scripts đã được nêu nhưng không có task xử lý** | Sửa: Bổ sung Task 2.3 rà soát, dọn dẹp và thêm safety guard cho các file `backend/scratch_*`.

### Vùng đã scan khi không có SFR
- Đã rà soát lại toàn bộ 7 EFRs và không phát sinh rủi ro ẩn mới trong plan/tasks đã cập nhật.

---

## Round 2 - 2026-07-28T14:00:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal (Codex Desktop Review Pass)
- Context loaded:
  - `.agent/active/prevent-test-cloud-db-execution/EXPERT_REVIEW.md:1-38`
  - `database/migrations/`
  - `backend/.env.test`

### EFR Đã Chấp Nhận
- **[EFR-08] `seed.sql` không thay thế được schema/migration provisioning [P1][High]** | Sửa: Thêm Task 2.1 đồng bộ 43 migrations từ `database/migrations/` sang `supabase/migrations/` để `supabase db reset` dựng được full schema trên fresh clone.
- **[EFR-09] Fresh clone không có local test env để guard và integration clients sử dụng [P1][High]** | Sửa: Thêm Task 1.5 cập nhật file git-tracked `backend/.env.test` trỏ mặc định `http://127.0.0.1:54321` kèm local dummy keys.

---

## Round 3 - 2026-07-28T14:54:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal (Codex Desktop Review Pass Round 5)
- Context loaded:
  - `.agent/active/prevent-test-cloud-db-execution/EXPERT_REVIEW.md:1-38`
  - `database/001_schema.sql`
  - `backend/scripts/seed_dev_users.ts`

### EFR Đã Chấp Nhận
- **[EFR-10] Task sync migration bỏ sót baseline `001_schema.sql` [P1][High]** | Sửa: Cập nhật Task 2.1 đưa `database/001_schema.sql` làm migration version `001` trong `supabase/migrations/`, rồi sync 42 delta migrations `002-043`.
- **[EFR-11] Seed contract thiếu employee/reviewer fixtures bắt buộc cho permission suite [P1][High]** | Sửa: Cập nhật Task 2.2 mở rộng `supabase/seed.sql` bao gồm Auth users, superadmins, permissions, dummy employee & `employee_reviewers` mapping cho local harness.

---

## Round 4 - 2026-07-28T16:26:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal (Codex Desktop Review Pass Round 8)
- Context loaded:
  - `.agent/active/prevent-test-cloud-db-execution/EXPERT_REVIEW.md:1-40`
  - `backend/package.json`

### EFR Đã Chấp Nhận
- **[EFR-12] Hook sync migration không apply schema/seed trước khi Vitest chạy [P1][High]** | Sửa: Cấu hình chuỗi lệnh `"test:integration:fresh"` thực hiện `sync-migrations.cjs && supabase db reset --local && vitest run ...` để ép reset local Postgres container trước khi Vitest chạy.
- **[EFR-13] Mục tiêu bổ sung guardrail cho `feature-coordinator` không có task hoặc file ownership [P2][High]** | Sửa: Dọn dẹp dòng văn bản thừa trong mục tiêu Phase 2 của `FEATURE_TASKS.md` theo chỉ thị của User (bỏ qua mục 2/skill modification).
- **[EFR-14] Dynamic sync vẫn được nghiệm thu bằng số migration cố định [P2][High]** | Sửa: Chuyển toàn bộ mô tả nghiệm thu sang dạng mirror clean-sync động quét toàn bộ `database/001_schema.sql` + delta files SQL trong `database/migrations/`, không hardcode số 42.

---

## Round 5 - 2026-07-28T16:33:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal (Codex Desktop Review Pass Round 10)
- Context loaded:
  - `.agent/active/prevent-test-cloud-db-execution/EXPERT_REVIEW.md:1-32`
  - `backend/package.json`

### EFR Đã Chấp Nhận
- **[EFR-15] `test:integration:fresh` không resolve Supabase CLI và chạy sai project cwd [P1][High]** | Sửa: Cập nhật chuỗi lệnh `"test:integration:fresh"` trong `backend/package.json` dùng `npx` và trỏ `--workdir ..` tường minh: `"node scripts/sync-migrations.cjs && npx supabase db reset --workdir .. --local && vitest run --config vitest.integration.config.ts"`.

---

## Round 6 - 2026-07-28T16:38:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal (Codex Desktop Review Pass Round 12)
- Context loaded:
  - `.agent/active/prevent-test-cloud-db-execution/EXPERT_REVIEW.md:1-32`
  - `package.json` (root)

### EFR Đã Chấp Nhận
- **[EFR-16] `npx supabase` chưa được cài và pin version nên fresh command không deterministic [P1][High]** | Sửa: Cài đặt và pin cố định phiên bản `supabase` CLI trong `devDependencies` của root `package.json`, dùng `pnpm exec supabase db reset --workdir .. --local` trong script để đảm bảo tính đồng nhất 100% không phụ thuộc network hay global CLI.
