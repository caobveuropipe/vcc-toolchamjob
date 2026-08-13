# Feature Tasks: AI OCR Fix & Regression Testing

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-15

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Fix Logic & Integration Tests

**Mục tiêu:** Khắc phục lỗi truyền tin với proxy và bảo vệ bằng integration tests.

- [x] Task 1.1: Triển khai Streaming Collector trong `ocrService.ts` (Done)
- [x] Task 1.2: Verify sơ bộ bằng script `test_ocr_openai.ts` (Done)
- [x] Task 1.3: Tạo file `backend/src/__tests__/integration/ocr.test.ts`
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy vitest cho integration test)

## Phase 2: UI Regression Tests

**Mục tiêu:** Đảm bảo luồng người dùng hoạt động hoàn chỉnh trên Frontend.

- [x] Task 2.1: Quét component upload tài liệu ở Frontend để tìm selector phù hợp.
- [x] Task 2.2: Thực hiện UI test manual/scripted để verify AI tự điền form.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (User xác nhận form được điền đúng)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-15 14:50 | Phase 1 | 1.1 | Triển khai streaming theo RCA | done | Fix lỗi proxy trả content null |
| 2026-04-15 14:58 | Phase 1 | 1.2 | Chạy script test_ocr_openai.ts | done | Kết quả trả về JSON hợp lệ |
| 2026-04-15 15:00 | Phase 1 | Final | Chạy integration test | done | Pass 2/2 tests (vitest) |
| 2026-04-15 15:03 | Phase 2 | Final | User manual test UI | done | Thành công theo screenshot của User |
