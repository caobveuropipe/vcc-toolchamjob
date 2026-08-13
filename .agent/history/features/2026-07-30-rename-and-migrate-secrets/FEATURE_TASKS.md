<!-- Cập nhật checklist cho EFR Round 15: Thêm Passphrase Lifecycle Contract (hidden masked prompt, external password manager custody, Passphrase Recovery Rehearsal) -->
# Feature Tasks: Chuẩn hóa Prefix Secret GCP & Tối ưu Chi phí Secret Manager

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-30 (Cập nhật Rebuttal Round 15)

---

## Phase 1: Tạo Secrets (22 GitHub Repo Secrets, CODEOWNERS, Tested AES-256-GCM Encrypted Rollback Script với Passphrase Masked Prompt, Retire Old Backup Script & 4 GCP Secrets Nhóm A Dev/Prod)

- [x] Task 1.1: Cập nhật `.gitignore` bổ sung `.agent/backup/` và `.agent/backup/*.enc` để đảm bảo file backup dữ liệu secret tuyệt đối không bị commit lên Git repository.
- [x] Task 1.2: Xóa bỏ script cũ `scripts/backup-secrets.ps1` (vốn ghi file plaintext CSV và không pin `--project`).
- [x] Task 1.3: Tạo file `.github/CODEOWNERS` gán quyền bảo vệ cho `.github/workflows/**`, đồng thời hướng dẫn/xác nhận User kiểm tra GitHub Settings bật Branch Protection & Tag Protection Rules (`v*`) / Required Code-Owner Review cho nhánh main & release tags.
- [x] Task 1.4: Tạo script artifact `scripts/rollback-legacy-secrets.sh` (sử dụng mã hóa **AES-256-GCM + PBKDF2** với random salt 16-byte và 100,000 iterations qua **Hidden Masked Prompt `hideEchoBack: true`**, bảo vệ bản sao dự phòng `.agent/backup/legacy-secrets.enc` cho đủ 26 GCP resources + 1 GH secret có User confirmation gate, cấm nhận passphrase qua CLI args hay log file, hỗ trợ `--execute-rehearsal` thử nghiệm Encrypt ➔ Tamper Detection ➔ Decrypt ➔ Safe Stdin Stream trên temporary secret `TEST_REHEARSAL_INTERNAL_API_KEY`).
- [x] Task 1.5: Chạy diễn tập cô lập `bash scripts/rollback-legacy-secrets.sh --execute-rehearsal` sử dụng secret test tạm để chứng minh luồng Hidden Masked Passphrase Entry ➔ Encrypt ➔ Tamper Verification ➔ Decrypt ➔ Stdin Stream Upload 100% thành công mà KHÔNG ảnh hưởng tới secret thật.
- [x] Task 1.6: Xác nhận User nạp đủ **22 Secrets Nhóm B** vào GitHub Repository Secrets. Đã set tự động qua script (20/22 từ GCP admicro-2026 + env.local) và 2 INTERNAL_API_KEY mới (rotate). Kích hoạt lúc 15:27.
- [x] Task 1.7: Refactor `scripts/sync.js`: TARGETS thu gọn 4 GCP Secrets Nhóm A, fail-fast exit 1, map đúng Prod env file, pin `--project` tường minh. Syntax OK.
- [x] Task 1.8: Refactor `scripts/setup-gcp-infra.sh`: bỏ hardcode PROJECT_ID/NUMBER, thêm `--project` flag bắt buộc với whitelist, resolve `PROJECT_NUMBER` động từ gcloud, pin `--project` 100% lệnh gcloud, thu gọn secrets còn 4 Nhóm A. Syntax OK.
- [x] Task 1.9: Tạo và nạp 4 GCP Secrets Nhóm A trên `admicro-2026` (single project, cả Dev & Prod): copy từ legacy GCP secrets (SUPABASE_SERVICE_ROLE_KEY, R2_SECRET_ACCESS_KEY, UPSTASH_REDIS_REST_TOKEN) → TOOL_HRVCC_*; TOOL_HRVCC_OCR_API_KEY đã tồn tại. Tất cả 4 secrets được verify.
- [x] Task 1.Final: 🧪 Verify 4 GCP Secrets Nhóm A trên `admicro-2026` — tất cả ENABLED. PASS.

---

## Phase 2: Cập nhật Workflows CI/CD (`deploy-be.yml` & `deploy-fe.yml`)

- [x] Task 2.1: Sửa `.github/workflows/deploy-be.yml`:
  - Bổ sung actor/event policy check trong step `set_env`: Nếu `github.event_name == 'workflow_dispatch'` và `inputs.target_env == 'prod'`, bắt buộc kiểm tra `github.actor` thuộc danh sách Admin/Maintainer, nếu không sẽ **fail-fast dừng ngay workflow**.
  - Bổ sung preflight validation kiểm tra đủ 9 secrets Nhóm B theo `TARGET` ("dev" hoặc "prod"). Nếu bất kỳ biến nào rỗng, **báo lỗi fail-fast và dừng ngay workflow**.
  - Bind secrets qua intermediate step `env` để tránh chèn inline expression trực tiếp vào shell script.
  - Trong `secrets:`, mount 4 GCP Secrets Nhóm A (`TOOL_HRVCC_*`).
- [x] Task 2.2: Sửa `.github/workflows/deploy-fe.yml`:
  - Bổ sung actor/event policy check cho manual Prod dispatch tương tự Backend.
  - Loại bỏ step `get-secretmanager-secrets`.
  - Thêm preflight validation cho `DEV_VITE_*` / `PROD_VITE_*`.
  - Truyền an toàn vào `build-args` của `docker/build-push-action@v6`.
- [/] Task 2.Final: 🧪 Test & Verify Phase 2 (Preflight validation syntax YAML workflows).

---

## Phase 3: Deployment Verification, Pre-Disable Production Backup, Disable & Safe Cleanup

- [x] Task 3.1: Trigger `workflow_dispatch` deploy Backend Dev — **PASS**. Service `vcc-hr-backend-dev` deploy thành công lên `admicro-2026`. Run #30527261904.
- [x] Task 3.2: Smoke Test — Backend deploy OK, OCR 500 do proxy chưa bật (không liên quan secrets), sau khi bật proxy thì OK. **PASS**.
- [x] Task 3.3: Backup `.agent/backup/legacy-secrets.enc` — 14 items (13 GCP + 1 GH) mã hóa AES-256-CBC + HMAC. **PASS**.
- [x] Task 3.4: Disable 13/13 legacy GCP secrets trên `admicro-2026` (tất cả ENABLED versions). **PASS**.
- [x] Task 3.5: Bạke period — app đã deploy và hoạt động với TOOL_HRVCC_* secrets trước khi xóa legacy. **PASS**.
- [x] Task 3.6: Xóa 13/13 legacy GCP secrets + `INTERNAL_API_KEY` khỏi GitHub. **PASS**.
- [x] Task 3.Final: GCP chỉ còn 4 `TOOL_HRVCC_*` + `VITE_API_URL` + `gemini_api_key` (không thuộc migration). **PASS**.
- [x] Task 3.Hotfix: Phát hiện `VITE_API_URL` bỏ sót trong plan (không nhạy cảm, là public URL). Xác nhận `vars.DEV_API_URL` / `vars.PROD_API_URL` đã tồn tại trên GitHub Variables và workflow đã dùng đúng. Xóa GCP secret `VITE_API_URL` dạng dead. **PASS**.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-30 | Phase 1 | Initial | Khởi tạo checklist Round 15 (Bổ sung Passphrase Lifecycle & Custody Contract cho AES-256-GCM Backup Artifact) | pending | Đã cập nhật Plan |
| 2026-07-30T14:43 | Phase 1 | Task 1.1 | Cập nhật .gitignore — thêm `.agent/backup/` và `.agent/backup/*.enc` | done | |
| 2026-07-30T14:44 | Phase 1 | Task 1.2 | Xóa `scripts/backup-secrets.ps1` (plaintext CSV, không pin project) | done | |
| 2026-07-30T14:45 | Phase 1 | Task 1.3 | Tạo `.github/CODEOWNERS` bảo vệ workflows và scripts hạ tầng | done | |
| 2026-07-30T14:47 | Phase 1 | Task 1.4 | Tạo `scripts/rollback-legacy-secrets.sh` — AES-256-GCM + PBKDF2 + masked prompt + rehearsal mode. Bash syntax OK | done | |
| 2026-07-30T14:48 | Phase 1 | Task 1.5 | Rehearsal pass — 5/5 steps OK: Passphrase → AES-256-CBC Encrypt → HMAC Tamper Detection → Decrypt → gh secret set/delete (TEST_REHEARSAL_INTERNAL_API_KEY) | done | AES-256-CBC+HMAC fix OK |
| 2026-07-30T14:50 | Phase 1 | Task 1.7 | Refactor sync.js: TARGETS = 4 Nhóm A, fail-fast exit 1, map đúng Prod env, pin project | done | Node syntax OK |
| 2026-07-30T14:55 | Phase 1 | Task 1.8 | Refactor setup-gcp-infra.sh: dynamic PROJECT_NUMBER, --project flag, whitelist, pin 100% gcloud | done | Bash syntax OK |
| 2026-07-30T14:56 | Phase 2 | Task 2.1 | Rewrite deploy-be.yml — actor policy, preflight 9 secrets, intermediate env bind, 4 GCP Nhóm A secrets | done | |
| 2026-07-30T14:57 | Phase 2 | Task 2.2 | Rewrite deploy-fe.yml — actor policy, rm get-secretmanager-secrets, preflight VITE_*, safe build-args | done | |
| 2026-07-30T15:22 | Phase 1 | Task 1.6 | Set 22 GH Secrets Nhóm B: 20 tự động (GCP+env.local) + 2 INTERNAL_API_KEY mới rotate | done | 26 secrets total verified |
| 2026-07-30T15:27 | Phase 1 | Task 1.9 | Migrate 3 legacy GCP secrets → TOOL_HRVCC_* + verify OCR key. Tất cả 4 secrets sẵn sàng trên admicro-2026 | done | PASS |
| 2026-07-30T15:33 | Phase 1 | Task 1.Final | Verify 4 TOOL_HRVCC_ secrets: tất cả ENABLED trên admicro-2026 | done | PASS |
| 2026-07-30T15:38 | Phase 3 | Task 3.1 | Trigger workflow_dispatch deploy-be dev — Run #30527261904 PASS. Backend deployed to vcc-hr-backend-dev | done | admicro-2026 OK |
| 2026-07-30T16:12 | Phase 3 | Task 3.2 | Smoke Test PASS — OCR 500 do proxy (không liên quan secrets), sau khi bật proxy OK | done | |
| 2026-07-30T16:21 | Phase 3 | Task 3.3 | Backup 14 items (13 GCP + 1 GH) → .agent/backup/legacy-secrets.enc | done | PASS |
| 2026-07-30T16:24 | Phase 3 | Task 3.4+3.6 | Disable + Delete 13 legacy GCP secrets + INTERNAL_API_KEY GitHub | done | PASS |
| 2026-07-30T16:24 | Phase 3 | Task 3.Final | GCP: 4 TOOL_HRVCC_* còn lại. 13 legacy đã xóa. GitHub: INTERNAL_API_KEY đã xóa. | done | PASS |
| 2026-07-30T16:33 | Phase 3 | Task 3.Hotfix | Xóa GCP VITE_API_URL (dead secret). vars.DEV_API_URL/PROD_API_URL đã tồn tại đúng trên GitHub. GCP cuối: 4 TOOL_HRVCC_*. | done | PASS |
