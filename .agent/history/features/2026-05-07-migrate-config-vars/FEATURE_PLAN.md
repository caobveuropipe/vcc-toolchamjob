# Feature Plan: Di dời biến môi trường cấu hình (Migrate Config Vars)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: migrate-config-vars
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-07

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Chi phí Google Cloud Secret Manager đang phát sinh lãng phí cho các biến cấu hình không nhạy cảm (public URL, Provider names, Chat ID, CORS URL). Việc gộp chung biến môi trường cấu hình và bảo mật gây sai lệch nguyên lý Single Source of Truth. Đặc biệt, biến `FRONTEND_URL` đang dùng chung khiến cấu hình CORS ở Prod có nguy cơ bị lộ cho `localhost`.
- **Vấn đề cần giải quyết:** Tách biệt Config (GitHub Variables) và Secret (GCP Secret Manager). Giải quyết triệt để vấn đề dùng chung `FRONTEND_URL` cho Dev và Prod để tăng cường bảo mật CORS. Dọn rác 6 URL không dùng đến.
- **Mục tiêu:** Di dời 4 biến sang Github Variables (có tách riêng `DEV_FRONTEND_URL` và `PROD_FRONTEND_URL`). Cập nhật CI/CD. Chốt kịch bản Rollback chặt chẽ trước và sau khi xóa rác trên GCP.
- **Kết quả mong đợi:** Cloud Run nhận biến cấu hình an toàn từ `env_vars`, ứng dụng Prod miễn nhiễm với CORS localhost, và Secret Manager được dọn dẹp sạch sẽ.

## 2. Phạm vi

### In scope
- Di chuyển 3 biến chung (`OCR_API_URL`, `OCR_PROVIDER`, `TELEGRAM_DEFAULT_CHAT_ID`) và 2 biến tách biệt (`DEV_FRONTEND_URL`, `PROD_FRONTEND_URL`) sang **GitHub Repository Variables**.
- Cập nhật `.github/workflows/deploy-be.yml`: Xóa 4 biến khỏi `secrets:`, bổ sung logic gán `FRONTEND_URL` theo môi trường và nạp chúng qua `env_vars:`.
- Thiết lập Rollback Plan 2 lớp (Trước và Sau khi xóa secret).
- Xóa hoàn toàn 10 biến cũ khỏi GCP Secret Manager tách biệt theo Dev và Prod.

### Out of scope
- Không chạm vào các biến thực sự nhạy cảm (`TELEGRAM_BOT_TOKEN`, `OCR_API_KEY`, `SUPABASE_*`, `R2_*`).
- Không chỉnh sửa logic nội tại của mã nguồn Backend.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Đảm bảo bảo mật Zero-JSON-Key Identity, tuân thủ Kiến trúc định tuyến CORS nghiêm ngặt ([2026-04-09] Strict CORS Over Regex).
- **"Cấm kỵ" cần tránh:** Không xóa Secret Manager khi chưa chứng minh được ứng dụng đã chạy tốt. Không cho phép `localhost` xuất hiện trong cấu hình CORS của Production.

## 4. Giả định và câu hỏi mở

### Giả định
- User có quyền tạo Repository Variables trên GitHub Settings.
- 6 biến URL phụ (`addon_dangtin_url`, v.v.) không được sử dụng ở bất cứ đâu trong codebase và an toàn để xóa vĩnh viễn.

## 5. Acceptance Criteria

- [ ] File `deploy-be.yml` nạp đúng `FRONTEND_URL` tương ứng cho Dev hoặc Prod, ngăn chặn tuyệt đối CORS localhost trên Prod.
- [ ] Tính năng OCR và gửi Telegram hoạt động bình thường trên Cloud Run sau khi deploy.
- [ ] 10 biến rác/biến cũ bị xóa khỏi Secret Manager sau khi (và chỉ khi) ứng dụng đã chạy ổn định.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `.github/workflows/deploy-be.yml` | Sửa | Sửa cơ chế nạp cấu hình và bổ sung logic tách biến CORS Dev/Prod | 🟡 Cao | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Lỗi gõ sai tên biến hoặc sai cấu trúc `env_vars:` trong YAML.
- **Known pitfalls:** Mọi thay đổi YAML không tự trigger CI/CD, bắt buộc dùng `workflow_dispatch`.

## 8. Chiến lược triển khai

- **Phase 1:** Setup cấu hình trên GitHub (Manual).
- **Phase 2:** Cập nhật CI/CD, Deploy và Smoke Test (Môi trường Dev và Prod).
- **Phase 3:** Cleanup dọn dẹp Secret Manager (Tách biệt xóa rác môi trường Dev xong mới xóa rác môi trường Prod).

## 9. Test Strategy

- **Manual verification:** Smoke test gọi chức năng OCR và kiểm tra xem Bot Telegram có gửi cảnh báo chính xác không. Gọi API từ Frontend để đảm bảo CORS Dev vẫn nhận localhost, còn CORS Prod thì không.

## 10. Rollback Plan

Quy trình phục hồi bắt buộc tuân theo 2 mốc thời gian:
- **Kịch bản 1 (Nếu lỗi xảy ra ở Phase 2 - Lúc chưa xóa Secret trên GCP):**
  1. Hủy (Revert) commit sửa file `deploy-be.yml` trên Github và Push lại.
  2. Kích hoạt lại workflow Github Actions để Cloud Run đọc lại từ GCP Secret Manager.
- **Kịch bản 2 (Nếu lỗi xảy ra ngầm và chỉ phát hiện ở Phase 3 - Lúc ĐÃ XÓA Secret trên GCP):**
  1. Tuyệt đối KHÔNG revert workflow ngay lập tức (Cloud Run sẽ sập do không tìm thấy secret).
  2. Bắt buộc mở file `secrets-backup.csv`, tạo tay lại 4 Secret trên GCP.
  3. Sau khi chắc chắn GCP đã có Secret, mới tiến hành revert commit và trigger Github Actions.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
