# Feature Plan: AI OCR Fix & Regression Testing

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: User bỏ qua review với rủi ro đã nêu (Fix đã được áp dụng và kiểm chứng qua script test)
> **Feature slug**: ocr-fix-and-tests
> **Tạo bởi**: feature-coordinator (manual initialization)
> **Ngày tạo**: 2026-04-15

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Proxy `proxycli.playai.vn` hiện bị lỗi không trả về nội dung (content: null) cho các model `gpt-5.x` ở chế độ gọi non-streaming, và model `gpt-4o` cũ trả về lỗi 502.
- **Vấn đề cần giải quyết:** AI OCR bị lỗi bóc tách do nhận được dữ liệu rỗng từ AI Provider thông qua Proxy.
- **Mục tiêu:** Khắc phục lỗi bằng cách chuyển sang chế độ Streaming và thêm bộ test kiểm thử tích hợp (Integration) và giao diện (UI) để đảm bảo không tái phát.
- **Kết quả mong đợi:** Tính năng "AI Đọc Giấy Tờ" hoạt động ổn định trên cả môi trường Dev và Prod.

## 2. Phạm vi

### In scope
- Áp dụng cơ chế Streaming collector trong `ocrService.ts`.
- Tạo Integration Test cho `ocrService.ts` sử dụng mock hoặc thực tế qua proxy (tùy điều kiện env).
- Thực hiện UI Test (manual verify via Browser Subagent hoặc script Playwright đơn giản).

### Out of scope
- Chuyển đổi toàn bộ API sang Streaming (chỉ áp dụng cho OCR).
- Thay đổi Proxy Provider.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** [2026-04-01] AI OCR Base64 Strategy — Ưu tiên truyền ảnh Base64.
- **"Cấm kỵ" cần tránh:** Không lưu PII (Thông tin cá nhân nhạy cảm) vào log backend.
- **Ràng buộc kiến trúc liên quan:** Zod schema validation cho kết quả OCR.

## 4. Giả định và câu hỏi mở

### Giả định
- Proxy `proxycli.playai.vn` sẽ tiếp tục hỗ trợ streaming cho `gpt-5.4`.

### Câu hỏi mở
- [Non-blocking] Liệu có nên bổ sung cơ chế fallback sang provider khác (như Claude) nếu OpenAI proxy sập?

## 5. Acceptance Criteria

- [x] AI OCR trả dữ liệu đúng format sau khi đọc stream (Đã verify qua `test_fix_ocr_v2.txt`).
- [ ] Integration test cho OCR pass (Giả lập image base64).
- [ ] UI Test: User có thể upload và AI tự động điền form trên giao diện frontend.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/services/ocrService.ts` | Sửa | Triển khai streaming collector | 🟡 | Có |
| `backend/src/__tests__/integration/ocr.test.ts` | Tạo | Thêm kiểm thử tích hợp | 🟢 | Chưa |
| `frontend/src/components/DocumentUpload.tsx` | Quét | Kiểm tra workflow UI | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** No (Fix đã được apply và verify nhanh)
- **Risk hotspots:** Tốc độ phản hồi của stream (UI trễ hơn một chút).
- **Review focus areas:** Exception handling khi stream bị ngắt quãng.

## 8. Chiến lược triển khai

- **Phase strategy:** 2 Phase (Fix & Integration Test -> UI Regression Test)
- **Thứ tự triển khai:** Apply Fix (Done) -> Integration Test -> UI Test.

## 9. Test Strategy

- **Automated tests:** Integration test gọi trực tiếp `processDocumentOCR` với mock Base64.
- **Manual verification:** Dùng Browser Subagent để thực hiện luồng "Tạo mới nhân sự" -> "Upload tài liệu" -> "AI Đọc".

## 10. Rollback Plan

- Revert file `ocrService.ts` về phiên bản sử dụng `response.json()`.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
