# Feature Plan: Bổ sung cột NNT có Filter vào Phòng Chờ (Plan B - RPC Approach)

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Bắt buộc review kiến trúc trước khi thực thi.
> **Feature slug**: pending-room-nnt-filter
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-18

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Màn hình Phòng Chờ (`PendingRoomPage`) cần hiển thị cột NNT kèm tính năng filter. Tuy nhiên, khi một NNT quản lý >500 nhân sự, mảng UUIDs gửi qua URL query (như `.in('id', uuids)`) tạo ra URL dài >21KB, gây lỗi `414 URI Too Long` / `fetch failed`.
- **Vấn đề của Plan A:** Hướng giải quyết bằng `X-HTTP-Method-Override: GET` đã thất bại ở Phase 0 Spike do hạ tầng Supabase Cloud / Kong bỏ qua header này, khiến POST bị hiểu nhầm thành INSERT.
- **Mục tiêu Plan B (RPC Approach):**
  1. Tạo Postgres Function (RPC) trả về `SETOF employee_info_only` và nhận các tham số mảng qua body (POST) để bypass giới hạn độ dài URL.
  2. Áp dụng RPC này làm base query cho danh sách nhân sự, qua đó giải quyết dứt điểm lỗi URL-too-long cho cả filter NNT và "Reviewer Scope" hiện tại.
  3. Bổ sung cột NNT trên Frontend.

## 2. Phạm vi

### In scope
- **Phase 1 (Database):** Tạo migration thêm hàm RPC `get_employee_info_scoped`.
- **Phase 2 (Backend):** Refactor `listEmployees` sử dụng RPC làm base query. Thêm logic query NNT và map NNT data vào API response. Sửa endpoint `unique-values`.
- **Phase 3 (Frontend):** Ẩn cột BU, thêm cột NNT (chỉ ở Phòng Chờ), đồng bộ URL search params, fix deps `useMemo`.

### Out of scope
- Thay đổi logic quyền hiện tại.
- Các API endpoints khác không liên quan đến danh sách `employee_info_only`.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[SEC-REV-02]` Salary Isolation: RPC bắt buộc phải trả về dữ liệu từ view `employee_info_only`, không query trực tiếp bảng `employees` để tránh leak dữ liệu lương.
- **Ràng buộc kiến trúc liên quan:**
  - `Pagination và Filtering`: PostgREST cho phép apply filters (`.eq`, `.ilike`) và `.range` trực tiếp lên kết quả RPC. Tính năng này giúp giữ nguyên cấu trúc search/sort/pagination trong code TypeScript.
  - RPC được gọi qua `POST /rest/v1/rpc/...`, các arguments được truyền dưới dạng JSON body, không bị giới hạn chiều dài.

## 4. Giả định và câu hỏi mở

### Giả định
- **A1:** Hàm RPC `STABLE` trả về `SETOF` có thể được inlined bởi Postgres optimizer, cho phép các query params (limit, order, filters) từ PostgREST hoạt động mượt mà mà không làm giảm hiệu năng.
- **A2:** Hàm `getUniqueFieldValues('nnt')` sẽ query trực tiếp bảng `employee_reviewers` để lấy unique list, tuân thủ đúng scoping quyền (Khối hoặc quản lý trực tiếp) - giống logic đã duyệt ở Plan A.

## 5. Acceptance Criteria

- [ ] AC1: Migration tạo RPC thành công, không phá vỡ DB.
- [ ] AC2: Base query `listEmployees` hoạt động đúng cho SA, Admin Khối, và Reviewer (kể cả mixed-roles). Không gây regression cho các filter hiện tại.
- [ ] AC3: Phòng Chờ hiển thị cột "Người nghiệm thu" (thay cột BU) nằm trước cột "Line nhân sự".
- [ ] AC4: Lọc theo NNT hoạt động ổn định kể cả khi có >500 UUIDs (không lỗi 414).
- [ ] AC5: Giao diện "Danh sách nhân sự" thường KHÔNG bị thay đổi (vẫn hiện BU, không có NNT).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do | Rủi ro |
|-------------|-----------|-------|--------|
| `database/migrations/*` | Tạo mới | Định nghĩa RPC `get_employee_info_scoped` | 🟡 |
| `backend/src/services/employeeService.ts` | Sửa | Thay base query `.from` bằng `.rpc`, chunk query lấy trạng thái pending, thêm logic filter NNT | 🔴 |
| `backend/src/routes/employees.ts` | Sửa | Parse tham số `nnt` và truyền `userEmail` | 🟢 |
| `frontend/src/components/EmployeeTable.tsx` | Sửa | Thêm cột NNT có điều kiện, update hook | 🟡 |
| `frontend/src/hooks/useEmployees.ts` | Sửa | Hỗ trợ filter NNT | 🟢 |
| `packages/shared/src/types/api.ts` | Sửa | Thêm trường `nnt?: string[]` | 🟢 |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  1. **Hiệu năng RPC:** Cần chắc chắn `get_employee_info_scoped` không quét toàn bộ view `employee_info_only` vào memory trước khi apply filters của TypeScript. Từ khóa `LANGUAGE sql` hoặc `STABLE` trên RPC trả về `SETOF` giúp PostgREST/Postgres tối ưu việc này.
  2. **Security & Permission (FR-01, FR-02):** 
     - Hàm RPC không được dùng NULL làm match-all một cách thiếu an toàn. Cần biến `p_unrestricted boolean` riêng cho quyền SA (để tránh lỗi một người không có quyền khối nhưng vô tình truyền `p_khoi = NULL` lại thấy toàn bộ).
     - Quyền EXECUTE của RPC phải được khóa chặt. Cần `REVOKE EXECUTE FROM PUBLIC` và chỉ `GRANT EXECUTE TO service_role` để ngăn chặn bypass RLS từ external clients (anon/authenticated roles).
  3. **Export `limit=all` crashes:** Mặc dù RPC giải quyết URL-too-long cho base query, phần query fetch trạng thái lương/info pending sau đó vẫn dùng `.in('employee_id', employeeIds)`. Nếu `limit=all` (~5000 records), đoạn này sẽ văng lỗi 414. Bắt buộc phải chunk mảng UUIDs ra thành từng lô (e.g. 200 items/lô) khi gọi Supabase.
- **Known pitfalls:**
  - Cần cẩn thận khi truyền mảng rỗng `[]` vào RPC, kết quả so sánh `ANY('{}')` là false.
  - Hợp đồng type (FR-07): Type của params query url `nnt` là `string` (comma-separated), nhưng trả về ở response `EmployeeListItem.nnt` là `string[]`. Phải tường minh trong TypeScript.

## 8. Chiến lược triển khai

1. **Phase 1:** Viết script migration `database/migrations/030_create_rpc_get_employee_info_scoped.sql` và setup quyền EXECUTE (FR-02).
2. **Phase 2:** Cập nhật `employeeService.ts` để gọi RPC, xử lý logic OR của permission và NNT filter, implement logic chunking cho query lương/info pending.
3. **Phase 3:** Thực hiện UI/Frontend.

**Rollout Gate (FR-06):**
- Bước 1: Chạy DB migration.
- Bước 2: Smoke test RPC trên Production DB qua pgAdmin / curl.
- Bước 3: Deploy Backend.
- Bước 4: Deploy Frontend.

## 9. Test Strategy

- **Automated tests (Integration):** 
  - Đảm bảo `pnpm --filter backend test:integration` (đặc biệt là bài test cho admin import/export) vẫn pass, không bị lỗi filter.
- **Manual verification:**
  - Test list bình thường với account SA (`p_unrestricted = true`).
  - Test list với account EA (chỉ có quyền 1 Khối).
  - Test list với account Reviewer (không có quyền khối nào, nhưng quản lý nhân sự).
  - Test list với account Mixed-role (FR-03: Có quyền 1 khối VÀ là Reviewer quản lý nhân sự thuộc khối khác).
  - Lọc NNT trên giao diện Phòng Chờ.
  - Test case cực đoan (FR-04): Lọc 1 NNT quản lý >500 nhân sự hoặc 1 Reviewer vào phòng chờ. Verify bằng Backend Logs (Pino) hoặc network trace ở phía backend để chứng minh Supabase client đã dùng method POST để gọi RPC `.rpc(...)` và mảng >500 UUIDs được gửi qua body thành công (trả về HTTP 200). Không dùng Browser DevTools vì DevTools chỉ thấy GET request từ UI gửi lên Backend.
  - Test case Export: Gọi tính năng "Export danh sách" (`limit=all`), đảm bảo không lỗi 414.

## 10. Rollback Plan
- Revert commit thay đổi TypeScript (Backend & Frontend).
- Không cần thiết phải drop RPC trên DB, do không ảnh hưởng đến logic cũ (có thể drop nếu muốn clean up).

## 11. Tham chiếu thực thi
- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
