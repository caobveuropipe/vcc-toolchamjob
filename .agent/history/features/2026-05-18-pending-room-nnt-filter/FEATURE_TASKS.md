# Feature Tasks: Bổ sung cột NNT có Filter vào Phòng Chờ (Plan B - RPC Approach)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-18

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Database Migration — Tạo hàm RPC

**Mục tiêu:** Tạo function `get_employee_info_scoped` trong PostgreSQL để PostgREST có thể truy vấn `employee_info_only` thông qua POST request, vượt qua giới hạn độ dài URL. Áp dụng chuẩn bảo mật không cấp quyền PUBLIC.

- [x] Task 1.1: Tạo file migration script (FR-05)
  - Tạo file migration mới: `database/migrations/030_create_rpc_get_employee_info_scoped.sql`
  - Nội dung script (đã sửa SQL scope FR-01 và Security FR-02):
    ```sql
    CREATE OR REPLACE FUNCTION get_employee_info_scoped(
      p_unrestricted boolean DEFAULT false,
      p_khoi text[] DEFAULT NULL, 
      p_ma_nhan_su text[] DEFAULT NULL, 
      p_emp_ids uuid[] DEFAULT NULL
    )
    RETURNS SETOF employee_info_only
    LANGUAGE sql
    STABLE
    SECURITY INVOKER
    AS $$
      SELECT * FROM employee_info_only
      WHERE 
        (
          p_unrestricted = true
          OR (p_khoi IS NOT NULL AND khoi = ANY(p_khoi))
          OR (p_ma_nhan_su IS NOT NULL AND ma_nhan_su = ANY(p_ma_nhan_su))
        )
        AND 
        (p_emp_ids IS NULL OR id = ANY(p_emp_ids));
    $$;

    -- FR-02: Chặn gọi trực tiếp từ public, chỉ cấp quyền cho service_role
    REVOKE EXECUTE ON FUNCTION get_employee_info_scoped FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION get_employee_info_scoped FROM anon;
    REVOKE EXECUTE ON FUNCTION get_employee_info_scoped FROM authenticated;
    GRANT EXECUTE ON FUNCTION get_employee_info_scoped TO service_role;
    ```
- [x] Task 1.2: Apply migration (FR-06)
  - Chạy migration trên DB.
  
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Verify hàm được tạo thành công. Verify user `anon` VÀ `authenticated` không gọi được hàm này (permission denied).
  - Smoke test hàm RPC trên DB qua REST hoặc SQL Editor (bằng quyền service_role).

---

## Phase 2: Backend Logic — Filter NNT + Áp dụng RPC

**Mục tiêu:** Backend dùng RPC mới làm base query, qua đó tự tự động sửa luôn lỗi URL-too-long của cả tính năng Reviewer Scope cũ và tính năng NNT Filter mới.

- [x] Task 2.1: Sửa `packages/shared/src/types/api.ts` (FR-07)
  - File `packages/shared/src/types/api.ts`: interface `EmployeeListItem` thêm `nnt?: string[]`
  - Build shared package (`pnpm run build:shared`)

- [x] Task 2.2: Sửa `backend/src/routes/employees.ts`
  - Parse query param `nnt`: `if (c.req.query('nnt')) filters.nnt = c.req.query('nnt')!`
  - Sửa route `unique-values/:field`: truyền thêm `userEmail` khi `field === 'nnt'` (để lấy đúng scope cho Reviewer login ở Phòng Chờ).

- [x] Task 2.3: Sửa `backend/src/services/employeeService.ts` — Base query qua RPC
  - Đổi base query thành gọi `rpc`. Set `p_unrestricted = permissionMatrix.is_superadmin`.
    ```typescript
    let p_khoi = accessibleKhoi.length > 0 ? accessibleKhoi : null
    let p_ma_nhan_su = reviewerEmployeeIds.length > 0 ? reviewerEmployeeIds : null
    let p_emp_ids = null // mặc định

    if (filters.nnt) {
      const nntEmails = filters.nnt.split(',')
      const { data: revRows } = await supabase
        .from('employee_reviewers')
        .select('employee_id')
        .in('reviewer_email', nntEmails)
      
      const empUuids = revRows?.map((r: any) => r.employee_id) || []
      p_emp_ids = empUuids.length > 0 ? empUuids : ['00000000-0000-0000-0000-000000000000']
    }

    let query = supabase.rpc('get_employee_info_scoped', {
      p_unrestricted: permissionMatrix.is_superadmin,
      p_khoi,
      p_ma_nhan_su,
      p_emp_ids
    }, { count: 'exact' }).select('*')
    ```
  - **Xóa** khối lệnh `.or(\`khoi.in.$\{khoiList},ma_nhan_su.in.$\{ids}\`)` cũ vì RPC đã xử lý logic OR này.
  - Đảm bảo logic Mixed-role (vừa có `accessibleKhoi` vừa có `reviewerEmployeeIds`) vẫn chạy đúng.

- [x] Task 2.4: Sửa `backend/src/services/employeeService.ts` — Map dữ liệu NNT & Chunking Export
  - Tạo helper `chunkArray(array, size)` ở đầu hoặc import utility.
  - Chunk mảng `employeeIds` thành các lô nhỏ (vd: 200 items/lô) khi gọi Supabase để fetch trạng thái lương (`salaryPendingMap`) và info pending (`infoPendingMap`). Gom data bằng `Promise.all`. Việc này đảm bảo export `limit=all` không bị lỗi 414.
  - Tương tự, dùng chunking để fetch NNT từ `employee_reviewers` bằng `employeeIds` và map vào kết quả (`nnt: string[]`).

- [x] Task 2.5: Sửa `backend/src/services/employeeService.ts` — getUniqueFieldValues('nnt')
  - Đổi signature hàm thành: `export async function getUniqueFieldValues(field: string, permissionMatrix: PermissionMatrix, userEmail?: string)`
  - Bổ sung nhánh xử lý riêng cho `'nnt'` ở đầu hàm:
    1. BẮT BUỘC gọi RPC `get_employee_info_scoped` (truyền đủ `p_unrestricted`, `p_khoi`, `p_ma_nhan_su`) với `.select('id')` để lấy mảng `ids` an toàn mà không dính lỗi 414. (Không dùng `.in('ma_nhan_su', reviewerEmployeeIds)` trực tiếp).
    2. Nếu có `ids`, dùng chunking để query `employee_reviewers` (hoặc tạo một RPC khác nếu muốn, nhưng chunking là đủ) lấy mảng `reviewer_email` unique.

- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - Verify GET list hoạt động không lỗi (200 OK) với account có quyền SA.
  - Verify với EA (chỉ quyền 1 khối).
  - Verify với Reviewer (không quyền khối).
  - Verify với Mixed-role (FR-03).
  - Test case unique-values/nnt: Verify `GET /api/employees/unique-values/nnt` trả về đúng danh sách NNT tương ứng scope của SA, EA, và Reviewer.
  - Test case cực đoan NNT >500: Verify request `GET /api/employees?state_phong_cho=true&nnt=<email có >500 nhân sự>` trả 200, đúng dữ liệu, không 414.
  - Test case Export (`limit=all`) không bị crash.
  - Chạy `pnpm --filter backend test:integration` đảm bảo các endpoint hiện tại không bị regression.

---

## Phase 3: Frontend UI — Hiển Thị Cột NNT + Filter

**Mục tiêu:** Phòng Chờ hiển thị cột NNT (thay BU), có filter dropdown, sync với URL params. Danh sách nhân sự không bị ảnh hưởng.

- [x] Task 3.1: Sửa `frontend/src/hooks/useEmployees.ts`
  - Thêm `nnt?: string` vào type local `PaginationAndFilters`
  - Sync `nnt` params vào URL.
  - Sửa signature `useUniqueValues` để có option `enabled`.

- [x] Task 3.2: Sửa `frontend/src/components/EmployeeTable.tsx`
  - Đọc `state_phong_cho` để quyết định `enabled: state_phong_cho === true` cho hook lấy list NNT.
  - Ẩn cột BU khi ở Phòng Chờ, thêm cột NNT trước cột Line nhân sự. Cột NNT hỗ trợ filter.

- [x] Task 3.3: Sửa `frontend/src/components/EmployeeTable.tsx` — Deps & URL Sync
  - Đọc `nnt` từ searchParams.
  - Đảm bảo `nnt: state_phong_cho ? nnt : undefined` để tránh leak filter sang màn hình thường.
  - Thêm `nnt`, `allNnt`, và `allLineNhanSu` vào useMemo deps array.

- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)
  - Mở Phòng Chờ: Cột NNT hiện, cột BU ẩn.
  - Mở Danh sách nhân sự: Cột BU hiện, NNT ẩn.
  - Filter NNT hoạt động mượt, url search thay đổi theo, load lại trang không mất filter.
  - `pnpm run typecheck` thành công.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-18T21:51 | Phase 1 | Task 1.1 | Bắt đầu tạo migration script `030_create_rpc_get_employee_info_scoped.sql` | start | — |
| 2026-05-18T21:52 | Phase 1 | Task 1.1 | Tạo file `database/migrations/030_create_rpc_get_employee_info_scoped.sql` thành công | done | — |
| 2026-05-18T21:52 | Phase 1 | Task 1.2 | Chờ User apply migration trên Supabase SQL Editor | start | Cần User thực hiện thủ công |
| 2026-05-18T21:55 | Phase 1 | Task 1.2 | User xác nhận đã apply migration 030 thành công | done | — |
| 2026-05-18T21:55 | Phase 1 | Task 1.Final | Phase 1 hoàn thành, User confirm pass | done | — |
| 2026-05-18T21:55 | Phase 2 | Task 2.1 | Bắt đầu sửa shared types `EmployeeListItem` | start | — |
| 2026-05-18T22:00 | Phase 2 | Task 2.1~2.5 | Hoàn thành backend: RPC base query, chunking, NNT map, getUniqueFieldValues | done | — |
| 2026-05-18T22:05 | Phase 3 | Task 3.1~3.3 | Hoàn thành frontend: hook nnt, cột NNT, URL sync | done | — |
| 2026-05-18T22:11 | Phase 3 | Task 3.Final | Fix thứ tự cột NNT vào trước Line nhân sự; lỗi console xác nhận là browser extension | retry | — |
| 2026-05-18T22:28 | Phase 3 | Task 3.Final | User confirm pass Phase 3 | done | — |
| 2026-05-18T22:28 | All | Integration | pnpm --filter backend test:integration: 8 test files, 43 tests — ALL PASSED (96s) | done | Không regression |
| 2026-05-18T22:29 | Feature | — | Feature hoàn thành. Tất cả task đã [x]. Chờ archive. | done | — |
