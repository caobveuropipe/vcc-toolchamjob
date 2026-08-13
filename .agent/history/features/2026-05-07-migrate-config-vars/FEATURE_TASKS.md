# Feature Tasks: Di dời biến môi trường cấu hình (Migrate Config Vars)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-07

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành

## Phase 1: Chuẩn bị cấu hình trên GitHub (Manual)

**Mục tiêu:** Tạo biến môi trường đúng phạm vi, TÁCH RỜI môi trường Dev và Prod cho CORS.

- [x] Task 1.1: User vào màn hình `Settings -> Secrets and variables -> Actions -> Variables`.
- [x] Task 1.2: Bấm nút **New repository variable** để tạo đủ 5 biến:
  - `OCR_API_URL` = `https://proxycli.playai.vn/v1`
  - `OCR_PROVIDER` = `openai`
  - `TELEGRAM_DEFAULT_CHAT_ID` = `-5217699045`
  - `DEV_FRONTEND_URL` = `http://localhost:5174,https://vcc-hr-frontend-dev-69050732080.asia-southeast1.run.app` (Có localhost)
  - `PROD_FRONTEND_URL` = `https://hrvcc.playai.vn` (KHÔNG CÓ localhost, chỉ domain thật của Prod)
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Xác nhận User đã tạo xong 5 biến).

## Phase 2: Cập nhật CI/CD, Deploy & Smoke Test

**Mục tiêu:** Đổi mã YAML để đọc Github Variables, cài cắm logic IF/ELSE cho CORS.

- [x] Task 2.1: Sửa file `.github/workflows/deploy-be.yml`, tìm Step `Set Environment Variables`, bổ sung đoạn export biến `FRONTEND_URL` phụ thuộc vào `$TARGET`:
```bash
          if [[ "$TARGET" == "prod" ]]; then
            ...
            echo "FRONTEND_URL=${{ vars.PROD_FRONTEND_URL }}" >> $GITHUB_ENV
          else
            ...
            echo "FRONTEND_URL=${{ vars.DEV_FRONTEND_URL }}" >> $GITHUB_ENV
          fi
```
- [x] Task 2.2: Kéo xuống Step `Deploy to Cloud Run`, xóa 4 biến (`OCR_API_URL`, `OCR_PROVIDER`, `TELEGRAM_DEFAULT_CHAT_ID`, `FRONTEND_URL`) khỏi mục `secrets:`.
- [x] Task 2.3: Thêm block `env_vars:` đúng thụt lề:
```yaml
          env_vars: |
            OCR_API_URL=${{ vars.OCR_API_URL }}
            OCR_PROVIDER=${{ vars.OCR_PROVIDER }}
            TELEGRAM_DEFAULT_CHAT_ID=${{ vars.TELEGRAM_DEFAULT_CHAT_ID }}
            FRONTEND_URL=${{ env.FRONTEND_URL }}
```
- [x] Task 2.4: Kích hoạt thủ công qua lệnh `gh workflow run deploy-be.yml` cho Dev.
- [x] Task 2.5: Deploy cho Prod bằng cách tạo Tag mới hoặc dispatch Prod.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Đảm bảo OCR, Telegram và CORS chạy tốt trên cả 2 môi trường. Prod không cho phép localhost chọc vào).

## Phase 3: Cleanup Secret Manager 

**Mục tiêu:** Cắt giảm chi phí an toàn sau khi đã chứng minh ứng dụng sống sót ở Phase 2.

- [x] Task 3.1: Xóa 4 biến cũ khỏi Secret Manager của project **DEV** (`admicro-2026`). (Giữ lại 6 biến rác do thuộc repo khác).
- [x] Task 3.2: (Gộp chung với 3.1 do DEV và PROD dùng chung project `admicro-2026`).
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Hệ thống sạch rác, chi phí đã được chốt giảm).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-07T15:43 | Phase 1 | Task 1.1 | Bắt đầu Phase 1: Chuẩn bị cấu hình trên GitHub | start | Chờ User thao tác tạo biến |
| 2026-05-07T15:49 | Phase 1 | Task 1.Final | Xác nhận User tạo xong biến qua ảnh chụp | done | Đã hoàn thành Phase 1 |
| 2026-05-07T15:49 | Phase 2 | Task 2.1-2.3 | Bắt đầu sửa deploy-be.yml | start | Sửa biến env và secrets |
| 2026-05-07T15:51 | Phase 2 | Task 2.4 | Hoàn thành sửa YAML, chuẩn bị trigger CI | done | Cần commit/push file YAML trước khi trigger |
| 2026-05-07T16:00 | Phase 2 | Task 2.4-2.5 | Trigger Deploy cho Dev và Prod | done | Đã chạy lệnh gh workflow run cho cả 2 môi trường |
| 2026-05-07T16:00 | Phase 2 | Task 2.Final | Đợi Deploy xong và bắt đầu Test | start | Đang chờ Cloud Run cập nhật |
| 2026-05-07T16:04 | Phase 2 | Task 2.Final | Gặp lỗi Deploy (Cannot update env var) | block | Lỗi do Cloud Run giữ biến dạng secret cũ. Đã sửa YAML để remove secret trước. |
| 2026-05-07T16:07 | Phase 2 | Task 2.4-2.5 | Re-trigger Deploy cho Dev và Prod | start | Đã push file YAML sửa lỗi và dispatch lại. Đang theo dõi. |
| 2026-05-07T16:12 | Phase 2 | Task 2.Final | Self-test CORS qua curl | start | DEV cho phép localhost, PROD từ chối localhost. Chờ User test. |
| 2026-05-07T16:20 | Phase 2 | Task 2.Final | Lỗi cấu hình CORS gcloud | block | Biến DEV có chứa dấu phẩy bị gcloud cắt đôi thành 2 biến sai lệch. |
| 2026-05-07T16:22 | Phase 2 | Task 2.4-2.5 | Re-trigger Deploy lần 2 | start | Đã bash escape \, và push. Đang đợi Cloud Run cập nhật. |
| 2026-05-07T16:28 | Phase 2 | Task 2.Final | Hoàn thành Phase 2 | done | User confirm CORS hết lỗi, AI và Telegram chạy OK. |
| 2026-05-07T16:28 | Phase 3 | Task 3.1 | Bắt đầu Phase 3 | start | Chuẩn bị lệnh xóa Secret Manager trên project DEV. |
| 2026-05-07T16:31 | Phase 3 | Task 3.1 | Loại trừ 6 biến URL phụ | info | User yêu cầu không xóa 6 biến URL do thuộc repo khác. Chỉ xóa 4 biến. |
| 2026-05-07T16:31 | Phase 3 | Task 3.1 | Xóa thành công 4 biến cũ | done | Đã xóa OCR_API_URL, OCR_PROVIDER, TELEGRAM_DEFAULT_CHAT_ID, FRONTEND_URL. |
| 2026-05-07T16:32 | Tất cả | Hoàn tất feature | done | Đã hoàn thành mọi task. Chuẩn bị archive. |
