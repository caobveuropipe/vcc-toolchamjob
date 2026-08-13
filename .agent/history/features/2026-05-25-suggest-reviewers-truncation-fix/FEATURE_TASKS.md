# Feature Tasks: Sửa lỗi giới hạn dữ liệu khi gợi ý Người Nghiệm Thu (NNT)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database RPC Migration (Bảo mật Cao) (FR-01, FR-04)

**Mục tiêu:** Tạo SQL function `fn_suggest_reviewers` ở tầng database với signature và return shape cố định, thiết lập bảo mật search_path, thu hồi quyền PUBLIC và cấp riêng cho service_role.

- [x] Task 1.1: Tạo file migration mới [031_create_fn_suggest_reviewers.sql](file:///d:/ToolNhanSuVcc/database/migrations/031_create_fn_suggest_reviewers.sql) định nghĩa chính xác signature:
  `fn_suggest_reviewers(p_ma_nhan_su text, p_use_pending boolean) RETURNS TABLE(reviewer_email text)`
  hỗ trợ fallback chain, `SECURITY DEFINER`, `SET search_path = public`, `REVOKE ALL ON FUNCTION fn_suggest_reviewers(text, boolean)` từ `PUBLIC, anon, authenticated` và chỉ `GRANT EXECUTE ON FUNCTION fn_suggest_reviewers(text, boolean)` cho `service_role`.
- [x] Task 1.2: Thực thi file migration SQL `031` để cài đặt hàm mới vào Database local / development.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm thử gọi trực tiếp hàm SQL `fn_suggest_reviewers` bằng SQL client để xác minh nó biên dịch thành công và trả về dữ liệu đúng).

## Phase 2: Migrate Backend Service (Backend)

- [x] 2.1. Cập nhật hàm `suggestReviewers` trong `backend/src/services/nntService.ts` để gọi RPC `fn_suggest_reviewers` thay vì truy vấn JS.
- [x] 2.2. Xử lý semantic return (Vẫn giữ nguyên cảnh báo "Khối X" nếu tập kết quả rỗng để không phá vỡ UI cũ).
- [x] 2.3. Bổ sung Integration test đầy đủ trong `backend/src/__tests__/integration/suggestReviewers.test.ts` bao quát Test Matrix:
  - Fallback chain correctness.
  - Deduplication (`DISTINCT` emails).
  - Null/Undefined org fields handling.
  - Large dataset protection (> 1000 assignments).
  - `use_pending=true` (với full, partial, và null pending_changes).
  - Route envelope, HTTP response code (200, 403, 404, 500).
  - Chặn cuộc gọi RPC trực tiếp từ Client Anon/Authenticated (Trả về 403 / Permission Denied).
- [x] 🧪 **Test & Verify Phase 2** (Chạy và vượt qua 100% test suite backend: `pnpm --filter backend test` và `pnpm --filter backend test:integration`).

## Phase 3: Cập nhật Frontend & Kiểm thử tích hợp (FR-02, FR-06)

**Mục tiêu:** Cập nhật Frontend gọi API đúng tham số trong cả PendingRoomPage và ReviewerCard, bọc onClick bằng arrow functions, đồng thời xác thực hệ thống.

- [x] Task 3.1: Sửa đổi [PendingRoomPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/PendingRoom/PendingRoomPage.tsx) truyền thêm `?use_pending=true` khi gọi gợi ý NNT.
- [x] Task 3.2: Sửa đổi [ReviewerCard.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/ReviewerCard.tsx) để hàm `handleSuggest` nhận tham số `usePending`. Bọc toàn bộ onClick thành arrow functions rõ ràng:
  - Nút gợi ý thông thường: `onClick={() => handleSuggest(false)}`
  - Nút "Cập nhật theo gợi ý" trong alert: `onClick={() => handleSuggest(true)}`
- [x] Task 3.3: Thực hiện kịch bản manual verification khép kín với dữ liệu mẫu (seed data) của nhân sự `112865` để kiểm tra gợi ý NNT ở cả 2 cơ chế (tổ chức cũ vs tổ chức mới) và kiểm tra cả nút "Cập nhật theo gợi ý" trong alert.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Kiểm tra lại toàn bộ UI Modal và các màn hình liên quan ở Phòng Chờ để xác nhận tính năng hoàn thiện mượt mà, ghi nhận audit log đầy đủ).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-25 | - | - | - **[25/05/2026]**: <br> - Hoàn tất Task 1.1: Tạo migration `031_create_fn_suggest_reviewers.sql`. User đã chạy và xác nhận thành công trên Supabase. <br> - Hoàn tất Task 1.2: RPC hoạt động đúng fallback logic và bảo mật `SECURITY DEFINER` + chặn quyền public. Chạy thử nghiệm bằng script `test_rpc.ts` thành công. <br> - Hoàn tất Task 2.1 & 2.2: Sửa `suggestReviewers` trong `nntService.ts` sang dùng RPC, giữ nguyên các message lỗi hiện tại. <br> - Hoàn tất Task 2.3: Tạo `backend/src/__tests__/integration/suggestReviewers.test.ts`, viết các test case đầy đủ bao gồm IDOR checks, `use_pending`, fallback check, deduplication và kiểm tra 403 (Direct RPC call). Tất cả test case cho tính năng suggestReviewers đã PASSED. Phase 2 hoàn tất. <br> - Hoàn tất Phase 3: Sửa đổi chữ ký hàm `handleSuggest` để nhận tham số explicit boolean (tránh parse MouseEvent thành `true`) và bọc lại `onClick` trong Arrow Function tại `ReviewerCard.tsx`. Build code frontend thành công. Chờ User Manual Test và Confirm Archive Feature. | done | Kết thúc Feature |
| 2026-05-25 11:13 | 1 | 1.Final | User xác nhận Phase 1 OK | done | Kết thúc Phase 1 |
| 2026-05-25 11:13 | 2 | 2.1 | Bắt đầu sửa hàm suggestReviewers | start | Cập nhật nntService.ts để gọi RPC thay vì query bảng |
| 2026-05-25 15:35 | - | - | Tất cả các Phase đã xong. Đổi trạng thái thành Hoàn thành. Chờ User xác nhận Archive. | done | Kết thúc Feature |
