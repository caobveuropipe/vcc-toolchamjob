# Feature Tasks: Sửa lỗi lệch khóa đối chiếu Snapshot (API active-keys) cho Khối Bizfly Martech & Sale tech và các khối dùng tên đầy đủ

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-20

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Triển khai code sửa logic hàm khoisAbbreviation

**Mục tiêu:** Cập nhật logic hàm viết tắt khối để hỗ trợ các khối dùng tên đầy đủ.

- [x] Task 1.1: Sửa hàm `khoisAbbreviation` trong `backend/src/services/snapshotService.ts` để tích hợp danh sách `fullNameBlocks`.
- [x] Task 1.2: Chuẩn hóa logic sinh tiền tố prefix tại `getActiveKeys` sử dụng `T${monthNum}.${yearNum}` để tự động loại bỏ zero-padding của tham số tháng gửi lên. <!-- Sửa theo EFR-03: Chuẩn hóa tiền tố tháng -->
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra syntax và build thành công)

## Phase 2: Cập nhật Tests và Kiểm chứng

**Mục tiêu:** Viết integration test và kiểm tra hoạt động của API đối chiếu active keys.

- [x] Task 2.1: Cập nhật hoặc viết bổ sung integration test dạng table-driven trong `backend/src/__tests__/integration/snapshots.test.ts` (hoặc file tests liên quan) để test hàm `getActiveKeys` bao phủ toàn bộ `fullNameBlocks`, các khối viết tắt cũ (`ADMICRO`, etc.), case-insensitive, và fallback. <!-- Sửa theo EFR-02: Bổ sung table-driven test bao phủ đầy đủ -->
- [x] Task 2.2: Bổ sung integration test assert trường hợp gọi `thang=T06.2026` trả về danh sách key bắt đầu bằng `T6.2026-...`. <!-- Sửa theo EFR-03: Kiểm tra chuẩn hóa tiền tố month -->
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Đảm bảo toàn bộ tests pass và API trả về đúng định dạng tên khối đầy đủ / viết tắt theo đúng quy tắc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-07-20 16:51] | [Phase 1] | [Task 1.1] | Tạo kế hoạch thực hiện | done | |
| [2026-07-20 17:15] | [Phase 1] | [Task 1.1] | Bắt đầu sửa hàm khoisAbbreviation | start | |
| [2026-07-20 17:18] | [Phase 1] | [Task 1.1] | Sửa xong khoisAbbreviation với fullNameBlocks | done | |
| [2026-07-20 17:19] | [Phase 1] | [Task 1.2] | Chuẩn hóa prefix tháng tại getActiveKeys | start | |
| [2026-07-20 17:21] | [Phase 1] | [Task 1.2] | Chuẩn hóa prefix tháng xong | done | |
| [2026-07-20 17:22] | [Phase 1] | [Task 1.Final] | Kiểm tra syntax và build backend | start | |
| [2026-07-20 17:23] | [Phase 1] | [Task 1.Final] | Chạy typecheck thành công | done | |
| [2026-07-20 17:25] | [Phase 1] | [Task 1.Final] | User confirm pass Phase 1 | done | |
| [2026-07-20 17:26] | [Phase 2] | [Task 2.1] | Viết table-driven integration tests cho active-keys | start | |
| [2026-07-20 17:35] | [Phase 2] | [Task 2.1] | Hoàn thành table-driven integration tests | done | |
| [2026-07-20 17:36] | [Phase 2] | [Task 2.2] | Bổ sung test kiểm tra chuẩn hóa T06.2026 | start | |
| [2026-07-20 17:37] | [Phase 2] | [Task 2.2] | Hoàn thành test chuẩn hóa tháng | done | |
| [2026-07-20 17:38] | [Phase 2] | [Task 2.Final] | Chạy integration test xác minh toàn bộ | start | |
| [2026-07-20 17:39] | [Phase 2] | [Task 2.Final] | Integration tests pass thành công | done | |
| [2026-07-20 17:40] | [Phase 2] | [Task 2.Final] | User confirm pass Phase 2 | done | |
| [2026-07-20 17:41] | [Phase 2] | [Task 2.Final] | Chốt hoàn thành feature | done | |
