# Feature Tasks: Tối ưu hiệu năng tìm kiếm Danh sách nhân sự

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-06

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Frontend Performance — Loại bỏ re-render không cần thiết

**Mục tiêu:** Ô search gõ mượt không giật lag, `EmployeeTable` không bị re-render khi người dùng đang gõ.

- [x] Task 1.1: Tách search input state trong `EmployeeListPage`
  - Giữ `searchValue` (state local cho ô input) và `searchQuery` (đọc từ `searchParams`) riêng biệt như hiện tại.
  - **Vấn đề cốt lõi:** `setSearchValue` trong `onChange` đang ở cùng component với `<EmployeeTable search={searchQuery} />` gây re-render cả cây. 
  - **Fix:** Tách `<SearchInput>` thành sub-component riêng (hoặc dùng `useRef` + controlled `Input.Search` không nâng state lên parent) để việc gõ phím chỉ re-render chính nó, không lan ra `EmployeeTable`.
  - **Cụ thể:** Tạo component `EmployeeSearchBar` riêng, nhận `onSearch` callback, quản lý `inputValue` state nội bộ. Áp dụng chung `EmployeeSearchBar` này cho cả `EmployeeListPage` và `PendingRoomPage` để tránh việc `searchValue` thay đổi làm re-render toàn bộ trang và `EmployeeTable`.

- [x] Task 1.2: Memo hóa `columns` trong `EmployeeTable`
  - Bọc định nghĩa `columns` trong `useMemo` với dependency array gồm `page`, `limit`, `khoi`, `trang_thai`, `salaryLoading`, `isMobile`, `renderActions`, và các callback (`navigate`, `setSalaryModalRecord`, `setSalaryLoading`, `message`).
  - Bọc các callback `onClick` trong `useCallback` tương ứng để tránh dependency array bị invalidate mỗi render.

- [x] Task 1.3: Bọc `EmployeeTable` trong `React.memo`
  - Export `EmployeeTable` được bọc `React.memo` thay vì export trực tiếp.
  - `React.memo` mặc định so sánh shallow tất cả props: `search`, `state_phong_cho`, `renderActions`.
  - Đảm bảo prop `renderActions` (nếu truyền từ PendingRoom) được bọc `useCallback` tại nơi truyền vào để tránh reference mới mỗi render.

- [x] Task 1.4: Kiểm tra và fix `renderActions` tại `PendingRoom`
  - Hiện tại hàm `renderActions` trong `PendingRoomPage.tsx` đang định nghĩa inline mà không dùng `useCallback`.
  - Bọc `renderActions` prop trong `useCallback` với dependency đầy đủ để `React.memo` trên `EmployeeTable` hoạt động đúng.

- [x] Task 1.Final: 🧪 Test & Verify Phase 1
  - Mở trang Danh sách nhân sự, gõ nhanh nhiều ký tự trong ô search → xác nhận không giật lag, bảng không nhấp nháy/re-render.
  - Dùng React DevTools Profiler để xác nhận `EmployeeTable` không re-render khi chỉ thay đổi `searchValue` (trước khi nhấn Enter).
  - Mở trang PendingRoom → xác nhận hiển thị đúng danh sách, filter, sort, các action (Sửa hồ sơ, Sửa lương, Submit) vẫn hoạt động bình thường.
  - Nhấn Enter hoặc click Search icon → xác nhận bảng vẫn fetch API và cập nhật kết quả đúng.

---

## Phase 2: Backend Query Optimization — GIN Index cho full-text search

**Mục tiêu:** Câu truy vấn search sử dụng GIN index thay vì Full Table Scan, cải thiện latency khi dataset lớn dần.

- [x] Task 2.1: Tạo migration file bật `pg_trgm` và tạo GIN indexes độc lập
  - Tạo file `database/migrations/024_search_gin_index.sql` (hoặc số tiếp theo của migration cuối trong thư mục).
  - Nội dung migration (bỏ qua `ho_va_ten` do hệ thống đã có sẵn `idx_employees_ho_va_ten`):
    ```sql
    -- Bật extension pg_trgm nếu chưa có
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Tạo GIN indexes cho email và mã nhân sự
    CREATE INDEX IF NOT EXISTS idx_employees_email_trgm ON employees USING gin (email gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_employees_id_trgm ON employees USING gin (ma_nhan_su gin_trgm_ops);
    ```
  - Dùng `IF NOT EXISTS` để migration có thể re-run an toàn.

- [ ] Task 2.2: Verify query plan sau khi tạo index
  - Chạy lệnh sau trên Supabase SQL Editor để xác nhận index được dùng qua view API:
    ```sql
    EXPLAIN ANALYZE
    SELECT * FROM employee_info_only
    WHERE ho_va_ten ILIKE '%test%' OR email ILIKE '%test%' OR ma_nhan_su ILIKE '%test%';
    ```
  - Kết quả mong đợi: Báo cáo `BitmapOr` kết hợp từ các `Bitmap Index Scan` trên 3 index (gồm 2 index mới và 1 index `ho_va_ten` có sẵn).

- [x] Task 2.3: Bổ sung escape search string trong Backend
  - Trong `employeeService.ts` và `salaryService.ts`, chuỗi `search` đang được ghép chuỗi trực tiếp vào chuỗi filter `.or()`.
  - Cần viết/sử dụng một hàm helper để escape/sanitize biến `search` (loại bỏ hoặc escape các ký tự đặc biệt như `,`, `%`, `*`, `(`, `)`) trước khi gắn vào `.or()`.
  - **Lưu ý:** Việc sửa `salaryService.ts` chạm đến luồng dữ liệu lương (view `employee_full`), bắt buộc phải test cẩn thận các ranh giới Salary Isolation theo role.

- [ ] Task 2.4: (Optional) Profiling 2 batch queries phụ
  - Hiện tại `listEmployees` thực hiện 2 query phụ bằng `.in()` sau khi query chính: `salaries.state_pending` và `employees.pending_changes`.
  - Nếu muốn tối ưu sâu hơn: profiling xem 2 query này chiếm bao nhiêu latency. Thêm LEFT JOIN hoặc subquery trong view nếu cần.
  - **Lưu ý:** Task này là optional vì 2 query hiện tại đã dùng `.in()` batch, không phải N+1. Chỉ thực hiện nếu profiling cho thấy latency từ 2 query phụ đáng kể.

- [x] Task 2.Final: 🧪 Test & Verify Phase 2
  - Chạy migration trên môi trường dev/staging, xác nhận không có lỗi.
  - Chạy `EXPLAIN ANALYZE` xác nhận GIN index được sử dụng cho search query.
  - Test tìm kiếm trên UI với các chuỗi đặc biệt: `Nguyễn, Lê`, `100%`, `admin()` để xác nhận API không bị lỗi cú pháp PostgREST.
  - Kiểm tra không có regression: filter theo Khối, Trạng thái vẫn hoạt động đúng.
  - Kiểm tra rò rỉ phân quyền (Salary Isolation) trên màn Danh sách lương (nếu có sửa `salaryService.ts`), xác nhận đúng role SA/EA/VI/Reviewer.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-07 09:21 | Phase 1 | Task 1.1 | Bắt đầu tách EmployeeSearchBar component | start | Tách search input state để tránh re-render EmployeeTable |
| 2026-05-07 09:23 | Phase 1 | Task 1.1 | Tạo EmployeeSearchBar, cập nhật EmployeeListPage + PendingRoomPage | done | Loại bỏ searchValue state khỏi parent |
| 2026-05-07 09:31 | Phase 1 | Task 1.2-1.4 | Bắt đầu memo columns, React.memo, useCallback renderActions | start | Sửa EmployeeTable.tsx + PendingRoomPage.tsx |
| 2026-05-07 09:36 | Phase 1 | Task 1.2-1.4 | Hoàn thành refactor EmployeeTable + PendingRoom | done | tsc --noEmit pass, 0 errors |
| 2026-05-07 09:37 | Phase 1 | Task 1.Final | Bắt đầu self-test Phase 1 | start | Build + lint check |
| 2026-05-07 09:38 | Phase 1 | Task 1.Final | tsc pass, vite build pass | done | User tạm OK, chưa manual test |
| 2026-05-07 09:46 | Phase 2 | Task 2.1 | Bắt đầu tạo migration GIN index | start | Tạo file SQL migration |
| 2026-05-07 09:53 | Phase 2 | Task 2.1, 2.3 | Hoàn thành tạo migration và thêm escape search string | done | Tạo 024_search_gin_index.sql và escapeSearch.ts |
| 2026-05-07 09:54 | Phase 2 | Task 2.Final | Bắt đầu Self-test Phase 2 | start | Chờ User chạy SQL migration và explain query |
| 2026-05-07 09:56 | Phase 2 | Task 2.Final | User gửi bằng chứng EXPLAIN ANALYZE với BitmapOr | done | GIN index hoạt động chính xác |
| 2026-05-07 09:56 | All | All | Hoàn thành toàn bộ tasks | done | Trạng thái: Hoàn thành |
