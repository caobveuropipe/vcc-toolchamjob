# Feature Plan: Sửa lỗi giới hạn dữ liệu khi gợi ý Người Nghiệm Thu (NNT)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: [Khuyến nghị gọi `feature-review` / Bắt buộc review trước khi thực thi / User bỏ qua review với rủi ro đã nêu]
> **Feature slug**: suggest-reviewers-truncation-fix
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi HR nhấn nút **Submit** một nhân sự ra khỏi phòng chờ, hệ thống sẽ mở ra một Modal "Xác nhận NNT trước khi Submit" và gọi API `/api/employees/:id/suggest-reviewers` để lấy danh sách người nghiệm thu được gợi ý dựa trên chuỗi tổ chức của nhân sự đó.
- **Vấn đề cần giải quyết:** 
  - API `/suggest-reviewers` gọi hàm `suggestReviewers` trong `backend/src/services/nntService.ts`. Hàm này thực hiện lấy toàn bộ dữ liệu bảng `employee_reviewers` (joined `employees`) bằng câu lệnh `.select()` không filter từ Database rồi tiến hành filter in-memory trên RAM.
  - Tuy nhiên, bảng `employee_reviewers` hiện tại đã phình to lên 1,474 bản ghi. Do giới hạn mặc định của Supabase/PostgREST API gateway (chốt cứng tối đa **1000 bản ghi** cho mỗi truy vấn không phân trang), dữ liệu trả về cho Hono backend bị mất đi 474 bản ghi cuối.
  - Hậu quả là nếu bản ghi phân công NNT của nhân sự rơi vào phần bị mất này, backend sẽ trả về mảng gợi ý rỗng `reviewers: []` kèm cảnh báo nhầm: *"Không tìm thấy NNT phù hợp cho tổ chức mới (Khối Sohagame)"*. HR không thể tự chọn NNT và buộc phải tích chọn "Xác nhận không có NNT".
- **Mục tiêu:** 
  - Khắc phục triệt để lỗi giới hạn dữ liệu 1000 bản ghi khi gợi ý NNT.
  - Tối ưu hóa hiệu năng truy vấn NNT bằng cách thực hiện filter trực tiếp ở phía Database thay vì in-memory trên RAM.
- **Kết quả mong đợi:** 
  - Khi bấm Submit nhân sự, modal hiển thị đúng NNT được gợi ý từ hệ thống (nếu có trong phân công).
  - Không còn hiện tượng mất gợi ý NNT do số lượng bản ghi trong bảng `employee_reviewers` vượt ngưỡng 1000.

## 2. Phạm vi

### In scope
- Thiết lập một Database Function (RPC) mới `fn_suggest_reviewers` trong PostgreSQL để thực hiện filter và join trực tiếp cấp Database. 
  - **RPC Signature:** `fn_suggest_reviewers(p_ma_nhan_su text, p_use_pending boolean) RETURNS TABLE(reviewer_email text)`
  - Logic fallback chain: `line_nhan_su` -> `nhom_team` -> `bo_phan` -> `phong_ban` -> `khoi`.
- Khóa chặt bảo mật RPC bằng cách cấu hình `SECURITY DEFINER SET search_path = public`, thực hiện `REVOKE ALL ON FUNCTION fn_suggest_reviewers(text, boolean)` từ `PUBLIC, anon, authenticated` và chỉ `GRANT EXECUTE ON FUNCTION fn_suggest_reviewers(text, boolean)` cho `service_role`.
- Sử dụng số hiệu migration kế tiếp không trùng lặp: `031_create_fn_suggest_reviewers.sql`.
- Khóa cứng frontend [PendingRoomPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/PendingRoom/PendingRoomPage.tsx) truyền tham số `?use_pending=true` để đảm bảo gợi ý đúng NNT theo cơ cấu tổ chức mới.
- Khắc phục bug lệch gợi ý khi click nút "Cập nhật theo gợi ý" trong [ReviewerCard.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/ReviewerCard.tsx) bằng cách truyền cờ `usePending = true` cho hàm `handleSuggest`.
- **Phòng chống React MouseEvent Truthiness:** Chuyển đổi toàn bộ các hàm gọi `handleSuggest` trên UI sang dạng sử dụng arrow function rõ ràng (`onClick={() => handleSuggest(false)}` cho nút gợi ý thường và `onClick={() => handleSuggest(true)}` cho nút trong alert mismatch) để tránh bị truyền nhầm `MouseEvent` của React khiến nút gợi ý thường bị hiểu nhầm thành `use_pending=true`.
- Cập nhật hàm `suggestReviewers` trong [nntService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/nntService.ts) gọi Supabase RPC `fn_suggest_reviewers`. Nếu RPC trả về rỗng, service sinh warning semantic chính xác chứa tên khối đang lưu RAM-side.
- Bổ sung Integration test đầy đủ bao phủ Route contract, Fallback chain, Deduplication, Null/Undefined fields, Large dataset, và **kiểm tra chặn đứng cuộc gọi RPC trực tiếp từ Client Anon/Authenticated**.

### Out of scope
- Thay đổi cấu trúc bảng `employee_reviewers` hoặc `employees` trong DB.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - **Reviewer Mismatch Verification [2026-05-07]:** Phải hỗ trợ tham số `usePending` để kiểm tra NNT trên cây tổ chức đang chờ duyệt (pending org data) thay vì dữ liệu hiện tại khi nhân sự trong luồng điều chuyển.
  - **SEC-REV-04 Scoped RPC and Service-Layer Chunking [2026-05-18] / Batch-Chunking Strategy on Supabase Client [2026-05-18]:** Ý thức về giới hạn PostgREST, các query lớn hoặc query mảng UUIDs lớn cần được tối ưu hoặc chunking để phòng ngừa lỗi 414 / 502 / limits.
  - **Atomic Submit RPC [2026-04-07] / Scoped RPC only to service_role [2026-05-18]:** Sử dụng PostgreSQL Function (`SECURITY DEFINER`) và khóa chặt quyền thực thi đối với vai trò `service_role` để đảm bảo tính an toàn và bảo mật tuyệt đối.
- **"Cấm kỵ" cần tránh:** 
  - Tuyệt đối không để RPC `fn_suggest_reviewers` mở quyền thực thi mặc định cho `PUBLIC`, `anon` hoặc `authenticated`.
  - Không phá vỡ luồng fallback chain mặc định: `line_nhan_su` -> `nhom_team` -> `bo_phan` -> `phong_ban` -> `khoi`.

## 4. Giả định và câu hỏi mở

### Giả định
- **Tập dữ liệu lớn (Large Match Set):** Test suite tự động sẽ chứng minh logic RPC PostgreSQL hoàn toàn độc lập và không bị giới hạn truncation bởi số lượng bản ghi (>1000 lines) ở bất kỳ cấp độ tổ chức nào.

### Câu hỏi mở
- Không có câu hỏi blocking nào.

## 5. Acceptance Criteria

- [ ] RPC `fn_suggest_reviewers` khớp chính xác Signature: `fn_suggest_reviewers(p_ma_nhan_su text, p_use_pending boolean) RETURNS TABLE(reviewer_email text)` và trả về đúng danh sách email người nghiệm thu phù hợp từ Database dựa trên chuỗi fallback chain cấp bậc giảm dần.
- [ ] Logic gợi ý NNT không còn bị ảnh hưởng bởi số lượng dòng dữ liệu lớn hơn 1000 trong bảng `employee_reviewers` nhờ lọc và distinct ở tầng Database.
- [ ] RPC `fn_suggest_reviewers` cấu hình `search_path = public`, bị thu hồi quyền thực thi từ `PUBLIC, anon, authenticated` và chỉ cho phép `service_role` chạy.
- [ ] API gợi ý NNT hỗ trợ chính xác cờ `use_pending=true` cho luồng điều chuyển bộ phận, và frontend [PendingRoomPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/PendingRoom/PendingRoomPage.tsx) truyền tham số query `use_pending=true` đầy đủ.
- [ ] Khắc phục triệt để lỗi "Cập nhật theo gợi ý" trong [ReviewerCard.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/ReviewerCard.tsx) bằng cách truyền `usePending = true` khi xử lý mismatch warning alert, đồng thời bọc arrow functions tường minh `onClick={() => handleSuggest(false/true)}` cho toàn bộ nút bấm gợi ý để loại trừ lỗi MouseEvent truthy.
- [ ] Trả về đúng định dạng envelope `{ data: { reviewers: string[], has_multiple: boolean, warning?: string } }` và check permission route chính xác (trả 403 nếu unauthorized).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/031_create_fn_suggest_reviewers.sql` | Tạo mới | Định nghĩa SQL Function và phân quyền bảo mật | 🟢 Thấp | Có (SQL Schema Contract) |
| `backend/src/services/nntService.ts` | Sửa | Chuyển sang gọi RPC `fn_suggest_reviewers` và duy trì warning semantics | 🟢 Thấp | Có (Fallback chain và Pending support) |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Khóa cứng API call truyền thêm `?use_pending=true` | 🟢 Thấp | Không |
| `frontend/src/components/ReviewerCard.tsx` | Sửa | Sửa nút "Cập nhật theo gợi ý" và nút gợi ý thường bọc arrow function tường minh tránh MouseEvent | 🟢 Thấp | Không |
| `backend/src/routes/employees.test.ts` (hoặc test tương ứng) | Sửa / Tạo mới | Bổ sung test matrix bảo vệ tính ổn định và chặn RPC trực tiếp | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
  - Dynamic SQL execution in postgres: Cần đảm bảo chuỗi build dynamic query an toàn và được gán chính xác parameters.
  - Phân quyền thực thi: Đảm bảo kiểm tra triệt để việc chặn truy cập anon trực tiếp vào DB RPC.
- **Review focus areas:** 
  - Thiết lập `search_path = public` để phòng chống tấn công Search Path.
  - Kiểm tra `REVOKE ALL ON FUNCTION fn_suggest_reviewers(text, boolean) FROM PUBLIC, anon, authenticated` đã được chạy chính xác.
- **Known pitfalls / historical issues:** 
  - Mặc định các function mới tạo trong Postgres được mở quyền EXECUTE cho `PUBLIC`. Nếu không `REVOKE`, client anon có thể lợi dụng để quét lấy thông tin NNT nhạy cảm.
- **Dependencies / rollout concerns:** Cần chạy file migration `031` để tạo SQL function trong database trước khi deploy backend code.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1: Triển khai Database RPC (Bảo mật Cao).** Viết file SQL migration `031` và apply vào Database.
  - **Phase 2: Triển khai Backend.** Sửa đổi `nntService.ts` gọi RPC mới và bổ sung test matrix chi tiết để xác thực.
  - **Phase 3: Cập nhật Frontend.** Sửa đổi `PendingRoomPage.tsx` và `ReviewerCard.tsx` để truyền tham số `use_pending=true` chính xác và bọc onClick bằng arrow functions.
  - **Phase 4: Smoke Test & Verification.** QA/User thực hiện kiểm thử theo seed data mẫu.
- **Thứ tự triển khai:**
  1. Tạo file migration SQL `031_create_fn_suggest_reviewers.sql`.
  2. Cập nhật `nntService.ts`.
  3. Cập nhật frontend `PendingRoomPage.tsx` và `ReviewerCard.tsx`.
  4. Chạy test suite.

## 9. Test Strategy

### Test Matrix Chi Tiết
Hệ thống bắt buộc phải vượt qua các ca kiểm thử tự động (Route & Service integration tests) bao phủ các trường hợp sau:
1. **Fallback Chain Correctness:** Xác minh reviewer được trả về đúng cấp độ ưu tiên cao nhất.
2. **Deduplication:** Trả về danh sách email `DISTINCT` không bị trùng lặp.
3. **Null/Undefined Org Fields:** Nếu một số cấp tổ chức của nhân sự mục tiêu bị rỗng, truy vấn tự động trôi xuống cấp thấp hơn mà không bị lỗi.
4. **Large Dataset Protection:** Giả lập dữ liệu có > 1000 assignments trong cùng một level để chứng minh hàm RPC trả về đầy đủ mà không bị cắt cụt.
5. **Use Pending Verification:**
   - Khi `use_pending = false`: Gợi ý NNT theo tổ chức hiện tại.
   - Khi `use_pending = true`: Gợi ý NNT theo tổ chức mới trong `pending_changes`.
   - Fallback khi `pending_changes` bị null hoặc partial.
6. **Route-Level Security & Envelope:**
   - Trả về `403` khi user không có quyền can_edit.
   - Trả về `404` khi mã nhân sự không tồn tại.
   - Trả về envelope chuẩn `{ data: { reviewers: string[], has_multiple: boolean, warning?: string } }`.
7. **Direct RPC Block Check:**
   - Viết test mô phỏng cuộc gọi trực tiếp từ Client Anon/Authenticated tới RPC `fn_suggest_reviewers`.
   - Xác thực Database chặn đứng cuộc gọi và trả lỗi `403 Permission Denied`.

### Manual Verification & Smoke Gate
1. **Chuẩn bị Dữ liệu mẫu (Seed Data):**
   - Tạo nhân sự giả lập có mã `112865` ở phòng chờ, khối cũ `Sohagame`, khối mới trong `pending_changes` là `Admicro`.
   - Gán NNT `Huehoangthinhu@vccorp.vn` cho khối `Sohagame` và NNT `admin_test@vccorp.vn` cho khối `Admicro`.
2. **Kịch bản Kiểm thử:**
   - **Bước 1:** Bấm Submit nhân sự `112865`. Modal hiển thị gợi ý NNT `admin_test@vccorp.vn`.
   - **Bước 2:** Gọi API gợi ý NNT không truyền query param. Xác minh hệ thống gợi ý NNT `Huehoangthinhu@vccorp.vn`.
   - **Bước 3:** Vào màn hình chi tiết nhân sự, kiểm tra khi có cảnh báo mismatch NNT, click nút **"Cập nhật theo gợi ý"** trên Alert. Xác minh danh sách NNT được cập nhật tự động thành `admin_test@vccorp.vn`.
3. **Smoke Gate sau deploy:**
   - Xác thực biểu đồ log và audit logs ghi nhận hành động submit diễn ra mượt mà và không sinh cảnh báo warning giả.

## 10. Rollback Plan

- Thực hiện revert Git commit của backend & frontend, chạy script SQL drop function `fn_suggest_reviewers` để phục hồi trạng thái cũ.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
