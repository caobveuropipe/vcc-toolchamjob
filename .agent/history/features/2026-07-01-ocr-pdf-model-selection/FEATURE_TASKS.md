# Feature Tasks: Tích hợp đọc PDF và lựa chọn Model AI cho OCR

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-01

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Backend Update & AI Connection
**Mục tiêu:** Cấu hình Backend nhận tham số `model` linh động, xác thực qua allowlist, áp dụng PDF Guardrails, lưu/kiểm tra cache theo model, và tích hợp bộ test robust.

- [x] Task 1.1: Spike/Probe kiểm chứng contract PDF và active models của proxy `proxycli.playai.vn` để có contract chính xác. <!-- Sửa theo EFR-01, EFR-03 -->
- [x] Task 1.2: Định nghĩa Model Registry / Allowlist Validation ở backend sử dụng `z.enum` và cấu hình default model thống nhất. <!-- Sửa theo EFR-03 -->
- [x] Task 1.2b: Cài đặt dependency `pdf-parse` vào backend sử dụng workspace command (`pnpm --filter backend add pdf-parse`) và xác thực thay đổi ở file `pnpm-lock.yaml` ở repo root. <!-- Sửa theo EFR-09, EFR-10 -->
- [x] Task 1.3: Cập nhật [documents.ts](file:///d:/ToolNhanSuVcc/backend/src/routes/documents.ts) để nhận và validate `model` an toàn (hỗ trợ request không có body, body `{}` hoặc content-type không xác định mà không gây crash), kiểm tra cache key/validity theo model và prompt_version trước khi trả kết quả. <!-- Sửa theo EFR-02, EFR-03, EFR-07 -->
- [x] Task 1.4: Cập nhật [ocrService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/ocrService.ts):
  - Hỗ trợ dynamic model, gửi native PDF payload qua proxy (không làm fallback render để tránh dependencies phức tạp). <!-- Sửa theo EFR-01, EFR-06 -->
  - Tích hợp PDF Guardrails: Giới hạn tối đa 5 trang sử dụng `pdf-parse` để đếm trang, kiểm tra PDF magic bytes `%PDF-`, thêm `AbortController` timeout 30s, tối ưu stream/base64 tránh peak memory. <!-- Sửa theo EFR-05, EFR-09 -->
  - Redact/truncate raw `errorBody` khi log lỗi từ provider, chỉ ghi nhận thông tin an sau khi log an toàn (status, model, message) để chống rò rỉ PII/base64 payload. <!-- Sửa theo EFR-08 -->
  - Trả về cấu trúc `_ai_meta` thống nhất chứa `provider`, `model`, `prompt_version`, `cache_hit`. <!-- Khuyến nghị EFR -->
- [x] Task 1.5: Xây dựng bộ test hoàn chỉnh: Unit tests mock `fetch` cho PDF/ảnh/stream collector; Route contract tests (no body, `{}`, invalid JSON, valid/invalid model); Cache validator tests; PDF boundary/timeout tests (bao gồm test file PDF > 5 trang sử dụng mock/pdf-parse); Unit test verify logging redact/truncate; Tách biệt live test thành opt-in suite riêng. <!-- Sửa theo EFR-04, EFR-07, EFR-08, EFR-09 -->
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Frontend Integration
**Mục tiêu:** Cập nhật UI để người dùng chọn được file PDF và bấm "AI Đọc Giấy Tờ" trực tiếp.

- [x] Task 2.1: Chỉnh sửa [DocumentUpload.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/DocumentUpload.tsx) để mở rộng thuộc tính `accept` nhận thêm file `.pdf` (`application/pdf`).
- [x] Task 2.2: Kích hoạt nút "AI Đọc Giấy Tờ" hoạt động cho cả định dạng PDF (sử dụng API backend mặc định).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-07-01 15:05] | [Phase 1] | [Init] | Khởi tạo checklist | done | |
| [2026-07-01 16:35] | [Phase 1] | [Task 1.1] | Bắt đầu Spike/Probe kiểm chứng contract PDF và active models | start | |
| [2026-07-01 16:41] | [Phase 1] | [Task 1.1] | Hoàn thành Spike/Probe, xác nhận Gemini hỗ trợ PDF và OpenAI báo lỗi MIME | done | |
| [2026-07-01 16:42] | [Phase 1] | [Task 1.2] | Bắt đầu định nghĩa Model Registry & Allowlist Validation | start | |
| [2026-07-01 16:44] | [Phase 1] | [Task 1.2] | Tạo file config/ocrModels.ts định nghĩa registry model cho backend | done | |
| [2026-07-01 16:45] | [Phase 1] | [Task 1.2b] | Bắt đầu cài đặt dependency pdf-parse | start | |
| [2026-07-01 16:47] | [Phase 1] | [Task 1.2b] | Cài đặt thành công pdf-parse và @types/pdf-parse trong workspace | done | |
| [2026-07-01 16:48] | [Phase 1] | [Task 1.3] | Bắt đầu cập nhật routes/documents.ts để validate model và check cache | start | |
| [2026-07-01 16:50] | [Phase 1] | [Task 1.3] | Hoàn thành cập nhật route documents.ts với validate model và kiểm tra cache | done | |
| [2026-07-01 16:51] | [Phase 1] | [Task 1.4] | Bắt đầu cập nhật ocrService.ts để xử lý PDF và dynamic model | start | |
| [2026-07-01 16:53] | [Phase 1] | [Task 1.4] | Hoàn thành cập nhật ocrService.ts với PDF Guardrails, timeout, error redaction | done | |
| [2026-07-01 16:54] | [Phase 1] | [Task 1.5] | Bắt đầu viết bộ test suite hoàn chỉnh cho dynamic OCR & PDF validation | start | |
| [2026-07-01 16:56] | [Phase 1] | [Task 1.5] | Hoàn thành viết test suite ocr.test.ts, tất cả 20/20 test cases pass thành công | done | |
| [2026-07-01 16:57] | [Phase 1] | [Task 1.Final] | Bắt đầu Test & Verify Phase 1, chờ User confirm | start | |
| [2026-07-01 16:58] | [Phase 1] | [Task 1.Final] | User xác nhận OK, chốt Phase 1 thành công | done | |
| [2026-07-01 16:59] | [Phase 2] | [Task 2.1] | Bắt đầu cập nhật DocumentUpload.tsx để chấp nhận file PDF | start | |
| [2026-07-01 17:01] | [Phase 2] | [Task 2.1] | Hoàn thành cập nhật thuộc tính accept cho PDF và update UI label | done | |
| [2026-07-01 17:02] | [Phase 2] | [Task 2.2] | Kích hoạt nút AI Đọc Giấy Tờ hoạt động cho PDF | done | |
| [2026-07-01 17:03] | [Phase 2] | [Task 2.Final] | Bắt đầu Test & Verify Phase 2, chờ User confirm | start | |
| [2026-07-01 17:38] | [Phase 2] | [Task 2.Final] | User kiểm thử UI thành công và xác nhận Pass | done | |
