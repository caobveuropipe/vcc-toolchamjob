# Feature Plan: Tối ưu hiệu năng tìm kiếm Danh sách nhân sự

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã review và chốt phương án. Có thể handoff sang coordinator.
> **Feature slug**: optimize-search-performance
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Người dùng phản ánh hiện tượng giật lag khi gõ tìm kiếm trong ô search tại màn hình "Danh sách nhân sự" (`EmployeeListPage`). Root cause đã được xác định qua `check-issue`.
- **Vấn đề cần giải quyết:**
  1. **Frontend:** Mỗi ký tự gõ vào ô search gây `setState` → re-render toàn bộ `EmployeeListPage` → kéo theo re-render `EmployeeTable` (component nặng ~340 dòng, 50 rows, nhiều Tooltip/Dropdown/Tag). Biến `columns` được khởi tạo lại mỗi render do không có `useMemo`.
  2. **Backend:** Câu truy vấn `ilike` với wildcard `%search%` trên 3 cột (`ho_va_ten`, `email`, `ma_nhan_su`) gây Full Table Scan, không tận dụng được index B-tree. Đồng thời thiếu cơ chế escape cho chuỗi tìm kiếm (nguy cơ lỗi API khi chứa ký tự đặc biệt).
  3. **Backend Batch Query:** Sau khi query danh sách, service thực hiện thêm 2 batch query phụ (`salaries.state_pending` + `employees.pending_changes`) bằng `.in()`, cần profiling để gộp chung nhằm giảm latency tổng.
- **Mục tiêu:** Loại bỏ giật lag khi gõ tìm kiếm, giảm thời gian phản hồi API search.
- **Kết quả mong đợi:** Ô search phản hồi mượt mà (không giật frame), API search < 500ms cho ~4000 records.

## 2. Phạm vi

### In scope
- Tối ưu rendering frontend: tách state ô search, memo hóa `columns` và `EmployeeTable`
- Tối ưu query backend: đảm bảo đủ 3 GIN indexes độc lập (`pg_trgm`) cho các cột tìm kiếm để tương thích với cú pháp OR của PostgREST (bằng cách giữ index `ho_va_ten` hiện hữu và bổ sung 2 index cho `email`, `ma_nhan_su`).
- Profiling 2 batch query phụ trong `listEmployees`, tiến hành tối ưu gộp nếu kết quả đo đạc cho thấy latency bị ảnh hưởng đáng kể.
- Xử lý escape/sanitize search string ở backend để tránh injection/lỗi cú pháp PostgREST.
- Áp dụng pattern tối ưu render FE cho cả `EmployeeListPage` và `PendingRoomPage`.

### Out of scope
- Thay đổi UX luồng tìm kiếm (vẫn giữ cơ chế nhấn Enter / click nút Search hiện tại)
- Full-text search engine (Elasticsearch, Meilisearch) — overkill cho ~4000 records
- Tối ưu các trang khác (Admin Dashboard)
- Server-side debounce — ô search hiện tại đã hoạt động theo cơ chế "submit on Enter", không fire API mỗi keystroke

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-03-13]` UI Architecture: Ant Design v6 + Theme Tokens, cấm Tailwind → tiếp tục dùng Ant Design component, không đưa vào thư viện ngoài cho UI.
  - `[2026-04-1]` Local-First Admin Search Strategy: Tiền lệ sử dụng pre-fetching + local filtering cho Admin Autocomplete. Tuy nhiên, Employee List là server-side pagination nên không áp dụng strategy này, nhưng triết lý "triệt tiêu giật lag" vẫn giữ.
  - `[2026-03-14]` Salary Isolation: View `employee_info_only` dùng cho list API → phải giữ nguyên, không bypass view.
  - `[2026-04-08]` Quota Strict Caps: 512Mi RAM Backend → tối ưu query phải nhẹ RAM, không cache toàn bộ dataset.
- **"Cấm kỵ" cần tránh:**
  - Không bypass view `employee_info_only` cho list API (SEC-REV-02).
  - Không đưa salary data vào list response cho role VI.
- **Ràng buộc kiến trúc liên quan:**
  - `EmployeeTable` là shared component dùng bởi cả `EmployeeListPage` và `PendingRoom` → phải đảm bảo memo hóa không phá vỡ behavior ở PendingRoom.

## 4. Giả định và câu hỏi mở

### Giả định
- [Non-blocking] Dữ liệu hiện tại ~4000 records, GIN index `pg_trgm` đủ tốt cho scale này.
- [Non-blocking] Extension `pg_trgm` đã có sẵn trên Supabase (mặc định PostgreSQL trên Supabase hỗ trợ `pg_trgm`).
- [Non-blocking] Ô search hiện tại hoạt động theo cơ chế "Enter to search" (không fire API mỗi keystroke), nên vấn đề giật lag chủ yếu đến từ re-render UI, không phải API spam.

### Câu hỏi mở
- [Non-blocking] Có cần thêm debounce cho ô search trong tương lai không? (Hiện tại Enter-to-search đã đủ, nhưng nếu muốn chuyển sang search-as-you-type thì cần debounce + AbortController).

## 5. Acceptance Criteria

- [ ] AC-1: Gõ ký tự trong ô search không gây giật lag UI (không re-render `EmployeeTable` khi chỉ thay đổi `searchValue`).
- [ ] AC-2: `columns` trong `EmployeeTable` được memoize, không khởi tạo lại mỗi render.
- [ ] AC-3: `EmployeeTable` được bọc `React.memo` để chỉ re-render khi props thực sự thay đổi.
- [ ] AC-4: Backend search query sử dụng các GIN indexes độc lập thay vì Full Table Scan (tận dụng BitmapOr), thông qua view `employee_info_only`.
- [ ] AC-5: Trang `PendingRoom` không bị giật lag khi gõ tìm kiếm, `EmployeeTable` hoạt động bình thường.
- [ ] AC-6: Input tìm kiếm chứa các ký tự đặc biệt (%, ,, (, )) không làm lỗi API hoặc sai lệch logic.
- [ ] AC-7: Không regression về security: duy trì Data Isolation (Khối/BU theo role), Salary Masking (SA/EA/VI/Reviewer), và có Rollback Plan rõ ràng cho từng thay đổi.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `frontend/src/pages/Employees/EmployeeListPage.tsx` | Refactor | Tách search input state để không gây re-render EmployeeTable | 🟢 | Không |
| `frontend/src/components/EmployeeTable.tsx` | Refactor | Memo hóa `columns`, bọc `React.memo` | 🟡 | Không — shared component, cần test cả PendingRoom |
| `frontend/src/pages/PendingRoom/` | Verify | Xác nhận không bị ảnh hưởng bởi memo hóa EmployeeTable | 🟢 | Không |
| `backend/src/services/employeeService.ts` | Sửa nhẹ | Tối ưu search query (không thay đổi logic, chỉ cải thiện hiệu năng) | 🟢 | Có — FILE-LEVEL CONTRACT |
| `database/migrations/` | Tạo mới | Migration file tạo GIN index `pg_trgm` | 🟡 | Phải dùng số 024 trở đi, không tạo duplicate index |

## 7. Risk Triage và Review Focus

- **Review required:** Khuyến nghị (không bắt buộc — rủi ro thấp)
- **Risk hotspots:**
  - `EmployeeTable` là shared component → memo hóa sai có thể gây stale data ở PendingRoom
  - Migration tạo GIN indexes trên production → loại bỏ `CONCURRENTLY` do dữ liệu nhỏ (~4000 rows) nhằm tránh lỗi transaction block của migration runner.
- **Review focus areas:**
  - React.memo dependency array đúng chưa? Props nào cần so sánh shallow?
  - GIN index `pg_trgm` có tương thích với Supabase managed PostgreSQL không?
  - Migration có chạy an toàn trên production data (~4000 rows) không?
- **Known pitfalls / historical issues:**
  - KB ghi nhận triết lý "Local-First" cho Admin search — nhưng Employee List dùng server-side pagination, khác pattern.
- **Dependencies / rollout concerns:**
  - Extension `pg_trgm` cần được enable trước khi tạo index.
  - Migration phải chạy trước deploy backend mới.

## 8. Chiến lược triển khai

- **Phase strategy:** 2 phases — Frontend trước (hiệu quả ngay lập tức), Backend sau (tối ưu sâu hơn).
  - **Phase 1 — Frontend Performance:** Tách search state, memo hóa columns, bọc React.memo cho EmployeeTable. Đây là fix có impact lớn nhất vì loại bỏ re-render không cần thiết.
  - **Phase 2 — Backend Query Optimization:** Tạo migration `pg_trgm`, tạo GIN index, verify query plan.
- **Thứ tự triển khai:** Phase 1 (FE) → Phase 2 (BE/DB). Hai phase độc lập, có thể deploy riêng.
- **Điểm cần phối hợp:** Phase 2 cần chạy migration SQL trên Supabase trước khi deploy.
- **Yêu cầu migration / config / deploy:** Migration SQL cho GIN index (Phase 2).

## 9. Test Strategy

- **Automated tests:** Không cần unit test mới cho frontend.
- **Manual verification:**
  - Cần verify qua các Role (SA, EA, VI, Reviewer) để đảm bảo không rò rỉ lương hoặc quyền chỉnh sửa sai lệch trong quá trình refactor (đặc biệt ở PendingRoom).
  - Test ô search với các chuỗi: `Nguyễn, Lê`, `100%`, `admin()`.
  - Phase 1: Gõ nhanh trong ô search → xác nhận không giật lag ở cả Employee List và PendingRoom.
  - Phase 2: Chạy `EXPLAIN ANALYZE` trên view `employee_info_only` thay vì bảng gốc.
- **Data / env chuẩn bị trước khi test:** Dữ liệu dev/staging hiện có (~4000 records).

## 10. Rollback Plan

- **Phase 1 (FE):** Revert commit.
- **Phase 2 (DB):** Chạy SQL cụ thể: `DROP INDEX IF EXISTS idx_employees_email_trgm; DROP INDEX IF EXISTS idx_employees_id_trgm;` (Giữ nguyên `idx_employees_ho_va_ten` của hệ thống cũ).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
