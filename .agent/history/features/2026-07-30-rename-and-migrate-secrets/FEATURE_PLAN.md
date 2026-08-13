# Feature Plan: Chuẩn hóa Prefix Secret GCP & Tối ưu Chi phí Secret Manager

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Expert Review Round 16 — `✅ HỘI TỤ`, 0 finding mới. User xác nhận triển khai 2026-07-30.
> **Feature slug**: `rename-and-migrate-secrets`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-30 (Cập nhật Rebuttal Round 15)

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:**
  - Dự án hiện đang duy trì 14-15 secrets trên GCP Secret Manager trên cả môi trường Dev và Prod. Chi phí quản lý bị phình to do lưu trữ các secret ít nhạy cảm hoặc public config không cần thiết trên GCP Secret Manager.
- **Quyết định Chiến lược của User:**
  - **MỤC TIÊU CHÍNH LÀ TỐI ƯU CHI PHÍ HỢP LÝ, KHÔNG ÉP CỐ ĐỊNH VỀ $0:** Tập trung giảm thiểu tối đa các secret không nhạy cảm trên GCP Secret Manager, nhưng giữ nguyên mức bảo mật cần thiết cho toàn bộ môi trường.
  - **Nhóm A (GCP Secret Manager):** Giữ lại các Secret nhạy cảm tử huyệt (`SUPABASE_SERVICE_ROLE_KEY`, `OCR_API_KEY`, `R2_SECRET_ACCESS_KEY`, `UPSTASH_REDIS_REST_TOKEN`) trên GCP Secret Manager của cả 2 môi trường Dev (`vcc-hr-dev`) và Prod (`vcc-hr-prod`) với tiền tố `TOOL_HRVCC_` (Tổng 8 active versions).
  - **Nhóm B (GitHub Actions Secrets - Naming convention `DEV_*` và `PROD_*`):** Chuyển 11 secrets/keys phụ còn lại sang GitHub Repository Secrets dưới dạng 22 secrets cụ thể (`DEV_*` và `PROD_*`).
- **Mục tiêu chính:**
  - **Tối ưu chi phí GCP Secret Manager:** Cắt giảm từ ~30 active secret versions xuống chỉ còn 8 active secret versions (giảm hơn 70% chi phí duy trì secret GCP).
  - **Bảo vệ an toàn cao nhất:** Đảm bảo toàn bộ 4 Key tử huyệt ở cả môi trường Dev và Prod được bảo vệ bằng mã hóa KMS trên GCP Secret Manager.
  - **Chuẩn hóa Naming Convention:** Toàn bộ GCP Secrets được gắn prefix `TOOL_HRVCC_` để tránh nhầm lẫn giữa các dự án.

## 2. Phân Nhóm Secret Chiến Lược & Billing Metrics

### 🔴 Nhóm A: DUY TRÌ TRÊN GCP SECRET MANAGER (8 Active Versions — Đã giảm >70% chi phí)
*Được mã hóa KMS trên GCP Secret Manager của cả Dev (`vcc-hr-dev`) và Prod (`vcc-hr-prod`) — Đặt tiền tố `TOOL_HRVCC_`:*

| # | Local / App Env Key | Target GCP Secret ID (Dev & Prod) | Scope | Legacy ID Cần Cleanup Sau Migration |
|---|---------------------|------------------------------------|-------|-------------------------------------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | `TOOL_HRVCC_SUPABASE_SERVICE_ROLE_KEY` | BE Runtime | `SUPABASE_SERVICE_ROLE_KEY` |
| 2 | `TOOL_HRVCC_OCR_API_KEY` | `TOOL_HRVCC_OCR_API_KEY` | BE Runtime | *(Giữ nguyên - Đã có prefix)* |
| 3 | `R2_SECRET_ACCESS_KEY` | `TOOL_HRVCC_R2_SECRET_ACCESS_KEY` | BE Runtime | `R2_SECRET_ACCESS_KEY` |
| 4 | `UPSTASH_REDIS_REST_TOKEN` | `TOOL_HRVCC_UPSTASH_REDIS_REST_TOKEN` | BE Runtime | `UPSTASH_REDIS_REST_TOKEN` |

---

### 🔵 Nhóm B: CHUYỂN SANG GITHUB ACTIONS SECRETS (22 Specific Repository Secrets)
*Danh sách 22 GitHub Repository Secrets (11 keys x 2 môi trường Dev/Prod). Workflow `deploy-be.yml` và `deploy-fe.yml` bind qua intermediate step `env` có fail-fast validation:*

| # | Local / App Env Key | Dev Secret Name | Prod Secret Name | Legacy GCP Secret ID Cần Cleanup |
|---|---------------------|-----------------|------------------|----------------------------------|
| 1 | `TELEGRAM_BOT_TOKEN` | `DEV_TELEGRAM_BOT_TOKEN` | `PROD_TELEGRAM_BOT_TOKEN` | `TELEGRAM_BOT_TOKEN` |
| 2 | `HEALTH_CHECK_KEY` | `DEV_HEALTH_CHECK_KEY` | `PROD_HEALTH_CHECK_KEY` | `HEALTH_CHECK_KEY` |
| 3 | `WEBHOOK_SECRET` | `DEV_WEBHOOK_SECRET` | `PROD_WEBHOOK_SECRET` | `WEBHOOK_SECRET` |
| 4 | `INTERNAL_API_KEY` | `DEV_INTERNAL_API_KEY` | `PROD_INTERNAL_API_KEY` | Generic `INTERNAL_API_KEY` (GH) |
| 5 | `SUPABASE_URL` | `DEV_SUPABASE_URL` | `PROD_SUPABASE_URL` | `SUPABASE_URL` |
| 6 | `UPSTASH_REDIS_REST_URL` | `DEV_UPSTASH_REDIS_REST_URL` | `PROD_UPSTASH_REDIS_REST_URL` | `UPSTASH_REDIS_REST_URL` |
| 7 | `R2_BUCKET_NAME` | `DEV_R2_BUCKET_NAME` | `PROD_R2_BUCKET_NAME` | `R2_BUCKET_NAME` |
| 8 | `R2_ACCESS_KEY_ID` | `DEV_R2_ACCESS_KEY_ID` | `PROD_R2_ACCESS_KEY_ID` | `R2_ACCESS_KEY_ID` |
| 9 | `R2_ENDPOINT` | `DEV_R2_ENDPOINT` | `PROD_R2_ENDPOINT` | `R2_ENDPOINT` |
| 10 | `VITE_SUPABASE_URL` | `DEV_VITE_SUPABASE_URL` | `PROD_VITE_SUPABASE_URL` | `VITE_SUPABASE_URL` |
| 11 | `VITE_SUPABASE_ANON_KEY` | `DEV_VITE_SUPABASE_ANON_KEY` | `PROD_VITE_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |

---

## 3. Safe 2-Step Cleanup & Fully Tested Two-Tier Rollback Plan

### Quy trình 2 bước xóa an toàn (Safe 2-Step Cleanup & Pre-Disable Backup Verification):
1. **Step 3.3 (Pre-Disable Gate - Tạo & Xác Minh Production Backup Mã Hóa):**
   - **TRƯỚC KHI DISABLE BẤT KỲ VERSION NÀO**, bắt buộc chạy `bash scripts/rollback-legacy-secrets.sh --backup` để nạp toàn bộ payload của đủ 26 legacy GCP secret versions (`ENABLED`) trên 2 project `vcc-hr-dev` và `vcc-hr-prod` + 1 GitHub Generic Secret `INTERNAL_API_KEY` vào file mã hóa `.agent/backup/legacy-secrets.enc`.
   - Passphrase được nhập trực tiếp qua **Hidden Masked Prompt (`readlineSync.question masked`)** / **Protected Stdin Stream**, tuyệt đối không qua CLI Arguments hay ghi vào log file.
   - Thực hiện thử nghiệm giải mã kiểm tra GCM Auth Tag hợp lệ và xác nhận đủ đúng ma trận 27 items payload trước khi chuyển qua Step 3.4.
2. **Step 3.4 (Disable All Enabled Legacy Versions):** Chạy `gcloud secrets versions list [LEGACY_ID] --project=[PROJECT_ID]` để lấy toàn bộ các version đang `ENABLED`, sau đó thực thi `gcloud secrets versions disable [VERSION] --secret=[LEGACY_ID] --project=[PROJECT_ID]` cho từng ID trên cả 2 môi trường Dev và Prod.
3. **Step 3.5 (Post-Disable Re-Verification):** Bắt buộc chạy lại Full Integration Smoke Test trong Bake Period sau khi disable legacy secrets để chứng minh hệ thống hoàn toàn độc lập khỏi các legacy secrets cũ trước khi tiến hành xóa vĩnh viễn.
4. **Step 3.6 (Destroy Versions, Delete GCP Resources & Cleanup GH Generic Key):** 
   - Kiểm tra lại tính tồn tại/integrity của artifact `.agent/backup/legacy-secrets.enc` đã được tạo ở Step 3.3 và xác nhận User đã lưu passphrase vào password manager ngoài repository.
   - Thực hiện `gcloud secrets delete [LEGACY_ID] --project=[PROJECT_ID]` giải phóng tài nguyên GCP và chạy `gh secret delete INTERNAL_API_KEY`.

### Target-Version Rotation Policy:
- Khi chạy script `sync.js` nạp version mới cho 4 Target Secrets Nhóm A, sau khi deploy verify thành công, thực hiện disable/destroy các **superseded target versions cũ** để giữ đúng hạn mức 8 active versions bền vững trên cả 2 môi trường.

### Passphrase Lifecycle & Custody Contract (EFR-52):
- **Hidden Masked Input:** Passphrase mã hóa/giải mã chỉ được nhập qua kênh interactive prompt bị ẩn (`hideEchoBack: true`) hoặc đọc qua environment variable tạm thời trong session RAM. Nghiêm cấm nhận passphrase qua command-line arguments (`--passphrase=...`) hoặc in ra console logs.
- **External Passphrase Custody:** Passphrase được bảo quản ngoài repository (như 1Password / Bitwarden / Password Manager do User trực tiếp nắm giữ). Script tuyệt đối không lưu passphrase vào disk hay bất kỳ file nào trong workspace.
- **Passphrase Custody Verification Gate:** Trong bước rehearsal (Task 1.5) và Pre-Disable Gate (Task 3.3), script sẽ yêu cầu nhập passphrase qua masked prompt 2 lần (xác nhận khớp), mã hóa thử, giải mã lại để verify passphrase hoạt động 100% trước khi tiếp tục.

### Safe Backup & Authenticated Encryption Standard (EFR-46 đến EFR-52):
- **Cấu hình `.gitignore`:** Thêm `.agent/backup/` và `.agent/backup/*.enc` vào `.gitignore` để đảm bảo file backup không bao giờ bị commit lên Git repository.
- **Xóa/Retire Script Backup Plaintext Cũ (`scripts/backup-secrets.ps1`):** Loại bỏ hoàn toàn script `scripts/backup-secrets.ps1`. Cưỡng chế 100% luồng backup phải đi qua `scripts/rollback-legacy-secrets.sh` (mã hóa AES-256-GCM + pin `--project` tường minh).
- **Mã Hóa Xác Thực AES-256-GCM (Authenticated Encryption) + PBKDF2 KDF:** File backup `.agent/backup/legacy-secrets.enc` được mã hóa bằng **AES-256-GCM** (chống tampering dữ liệu) kết hợp PBKDF2 KDF (salt 16B ngẫu nhiên, 100k iterations).

### Rollback Plan 2 Lớp Đầy Đủ (Fully Tested Two-Tier Rollback):
- **Lớp 1 (Trong Bake Period - Trước khi Delete Resource):** Re-enable lại các versions cũ bằng `gcloud secrets versions enable [VERSION] --secret=[LEGACY_ID] --project=[PROJECT_ID]` và revert workflow file về commit cũ.
- **Lớp 2 (Sau khi Delete Resource & GH Generic Key):** 
  - Giải mã file backup `.agent/backup/legacy-secrets.enc` qua hidden masked prompt (tự động verify GCM Auth Tag) và nạp lại 26 legacy GCP resources (13 IDs x 2 projects) bằng script `scripts/rollback-legacy-secrets.sh`.
  - Khôi phục generic GitHub Secret bằng cách đọc value giải mã từ stdin stream an toàn: `printf %s "$DECRYPTED_INTERNAL_KEY" | gh secret set INTERNAL_API_KEY`.
  - **Diễn tập Cô lập & Passphrase Recovery Rehearsal:** Diễn tập thử nghiệm toàn bộ luồng Masked Passphrase Entry ➔ Encrypt ➔ Tamper Verification ➔ Decrypt ➔ Safe Stdin Stream trên temporary secret `TEST_REHEARSAL_INTERNAL_API_KEY` để chứng minh khả năng khôi phục và bảo mật 100% trước khi cho phép tiến hành Delete Prod.

---

## 4. Script Hardening & Fail-Fast Standards

1. **`scripts/sync.js`:**
   - Map chính xác target `--project` với file env tương ứng: `vcc-hr-prod` ➔ `backend/.env.prod.local`, `vcc-hr-dev` ➔ `backend/.env.local`. Yêu cầu cờ `--force-prod-sync` khi trỏ Prod.
   - Thu thập tất cả lỗi sync; nếu có bất kỳ secret nào thất bại hoặc rỗng, **exit non-zero (exit 1)**.
2. **`scripts/setup-gcp-infra.sh`:**
   - Resolve `PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")`.
   - Cưỡng chế truyền `--project="${PROJECT_ID}"` vào **100% tất cả các lệnh `gcloud`**.
3. **`scripts/rollback-legacy-secrets.sh` (NEW Artifact):**
   - Script hỗ trợ mã hóa/giải mã AES-256-GCM + PBKDF2 qua hidden masked prompt. Pin `--project` tường minh vào mọi lệnh `gcloud`.
4. **Xóa `scripts/backup-secrets.ps1` (RETIRED):**
   - Xóa bỏ hoàn toàn script backup plaintext cũ không an toàn.

---

## 5. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Contract |
|-------------|-----------|----------------|----------|
| `scripts/backup-secrets.ps1` | [DELETE] | Xóa bỏ script backup plaintext cũ không pin project | Có |
| `.gitignore` | Sửa | Thêm `.agent/backup/` và `.agent/backup/*.enc` để bảo vệ backup data | Có |
| `.github/CODEOWNERS` | [NEW] | Tạo file bảo vệ các workflow CI/CD `.github/workflows/**` | Có |
| `scripts/rollback-legacy-secrets.sh` | [NEW] | Artifact mã hóa AES-256-GCM + PBKDF2 qua hidden masked prompt backup & phục hồi 26 legacy GCP secrets + GH secret | Có |
| `.github/workflows/deploy-be.yml` | Sửa | Preflight check 11 GitHub secrets, gán qua intermediate step `env`, mount 4 GCP secrets | Có |
| `.github/workflows/deploy-fe.yml` | Sửa | Preflight check 2 `VITE_*` secrets, truyền an toàn vào `build-args` | Có |
| `scripts/sync.js` | Sửa | Map chính xác Prod env file, thu gọn 4 GCP secrets, fail-fast exit 1 | Có |
| `scripts/setup-gcp-infra.sh` | Sửa | Dynamic `PROJECT_NUMBER`, pin `--project` vào 100% gcloud commands | Có |
