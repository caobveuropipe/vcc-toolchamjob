# Feature Tasks: Thêm Cột Bộ Phận và Tối Ưu Hiển Thị Phòng Chờ

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Triển khai hạ tầng (Shared & Backend)

**Mục tiêu:** Cập nhật Shared Types và Backend Service để expose trường `pending_bo_phan` và `has_pending_bo_phan` một cách an toàn và bảo mật cho API.

- [x] Task 1.1: Cập nhật file `packages/shared/src/types/api.ts` để thêm trường `pending_bo_phan?: string | null` và `has_pending_bo_phan?: boolean` vào type `EmployeeListItem`.
- [x] Task 1.2: Cập nhật hàm `listEmployees` trong `backend/src/services/employeeService.ts` tại phần gán dữ liệu `enhancedData` để:
  - Xác định xem có pending change của Bộ phận không: `const has_pending_bo_phan = Object.prototype.hasOwnProperty.call(pendingData, 'bo_phan')`.
  - Trích xuất giá trị pending: `const pending_bo_phan = pendingData.bo_phan ?? null`.
  - Bổ sung cả hai trường này vào đối tượng trả về.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Chạy `pnpm run build:shared` và build backend, chạy thử local API để xác nhận API trả về trường `pending_bo_phan` và `has_pending_bo_phan` đúng khi thay đổi bộ phận (kể cả khi gán bộ phận về null/rỗng).

## Phase 2: Tái cấu trúc cột "Họ và tên" và cột "Hành động" (Frontend)

**Mục tiêu:** Di chuyển các tag/icon trạng thái sang cột Họ và tên, giải phóng không gian cột Hành động, đồng bộ hóa các điều kiện check duy nhất từ `employeeUtils.ts`.

- [x] Task 2.1: Cập nhật hàm `renderActions` trong `PendingRoomPage.tsx` để gỡ bỏ phần hiển thị các tag trạng thái (`NEW`, `ĐGTV`, `PDF`, `Info`, `Dollar`) khỏi cột Hành động.
- [x] Task 2.2: Cập nhật `EmployeeTable.tsx` để gỡ bỏ phần hiển thị các tag trạng thái tương ứng trong render cột `action` dự phòng.
- [x] Task 2.3: Cập nhật cấu hình cột `ho_va_ten` trong `EmployeeTable.tsx` để:
  - Bọc tên trong cấu trúc flexbox có độ rộng linh hoạt (`minWidth: 150px`, `flex: 1`).
  - Dùng `employeeUtils.ts` làm Single Source of Truth cho các điều kiện:
    - `NEW`: `isNewHire(record)` -> Render Tag đỏ
    - `ĐGTV`: `record.is_probation_eval === true` -> Render Tag xanh dương
    - `PDF`: `!!record.pending_document_uuid` -> Render icon FilePdfOutlined với Tooltip "Có tài liệu hồ sơ đính kèm"
    - `Info`: `shouldShowInfoIcon(record)` -> Render icon InfoCircleOutlined
    - `Dollar`: `shouldShowSalaryIcon(record)` -> Render icon DollarOutlined
  - Đảm bảo các tag hiển thị inline cạnh tên hoặc bọc trong cấu trúc chống vỡ layout trên các dòng.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Mở giao diện phòng chờ, xác nhận các tag và icon xuất hiện bên cạnh Tên nhân sự và biến mất khỏi cột Hành động.

## Phase 3: Bổ sung cột Bộ phận, tinh chỉnh độ rộng các cột & tích hợp Compact Theme (Frontend)

**Mục tiêu:** Thêm cột Bộ phận hỗ trợ đối soát, co gọn độ rộng các cột khác, bật ellipsis và thu nhỏ bảng bằng ConfigProvider chỉ khi ở phòng chờ.

- [x] Task 3.1: Thêm cột "Bộ phận" (`bo_phan`) vào cấu trúc `columns` của `EmployeeTable.tsx` đứng ngay trước cột `email` khi ở chế độ phòng chờ (`state_phong_cho === true`).
  - Lấy giá trị Effective value: `record.has_pending_bo_phan ? record.pending_bo_phan : record.bo_phan`.
  - Nếu `record.has_pending_bo_phan === true`, hiển thị text kèm icon hoặc tag đứt thể hiện: `Chờ duyệt (Hiện tại: record.bo_phan)`.
- [x] Task 3.2: Tinh chỉnh độ rộng (`width`) của các cột:
  - Mã NS: `100` (giảm từ `120`)
  - Họ và tên: `180` (giảm từ `200`), bật `ellipsis: { showTitle: true }`
  - Ngày vào: `105` (giảm từ `130`)
  - Khối: `100` (giảm từ `120`), bật `ellipsis: true`
  - Trạng thái: `120` (giảm từ `150`)
  - Người nghiệm thu: `180` (giảm từ `200`), bật `ellipsis: true`
  - Line nhân sự: `130` (giảm từ `150`), bật `ellipsis: true`
  - Bộ phận: `140`, bật `ellipsis: { showTitle: true }`
  - Email: `160` (giảm từ `200`), bật `ellipsis: { showTitle: true }`
  - Hành động: `110` (giảm từ `120` - đủ rộng cho nút Submit gọn và More mà không bị vỡ)
- [x] Task 3.3: Bọc bảng `Table` trong `EmployeeTable.tsx` bằng `<ConfigProvider theme={state_phong_cho ? { components: { Table: { fontSize: 13, cellPaddingBlock: 10, cellPaddingInline: 10 } } } : {}}>` để chỉ thu gọn khi ở phòng chờ, tuyệt đối không ảnh hưởng trang live `/employees`.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3:
  - Chạy `pnpm run typecheck` để verify types.
  - Chạy `pnpm run build` để kiểm tra compile.
  - Kiểm tra thủ công giao diện trên Mobile (360px), Tablet (768px), Desktop.
  - Verify UI trang live `/employees` không có thay đổi về padding/font size.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-25 21:21 | 1 | 1.1 | Bắt đầu cập nhật `packages/shared/src/types/api.ts` | start | |
| 2026-05-25 21:26 | 1 | 1.Final | Self-test build & API listEmployees | done | pass |
| 2026-05-25 21:28 | 2 | 2.1 | Bắt đầu sửa PendingRoomPage.tsx | start | User skip test P1 |
| 2026-05-25 21:30 | 2 | 2.1-2.3 | Hoàn thành sửa UI | done | |
| 2026-05-25 21:30 | 2 | 2.Final | Typecheck Frontend | done | pass |
| 2026-05-25 21:35 | 3 | 3.1 | Bắt đầu thêm cột Bộ phận | start | |
| 2026-05-25 21:36 | 3 | 3.1-3.3 | Hoàn tất cập nhật bảng và giao diện | done | |
| 2026-05-25 21:36 | 3 | 3.Final | Self-test typecheck frontend | done | pass |
| 2026-05-25 22:04 | 3 | 3.Final | Check lỗi báo đỏ & clean unused imports | done | clean & typecheck pass |
| 2026-05-25 22:04 | - | - | Tất cả phase đã hoàn tất, chuẩn bị archive | done | |
