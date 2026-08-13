# Feature Plan: API Backend Lấy Snapshot Chi Tiết Nhân Sự và Lương Target

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Có thể handoff sang `feature-coordinator` — xem Review Notes để biết 3 điểm Medium cần xử lý trong lúc implement
> **Feature slug**: `api-thongtin-snapshot-chitiet`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, hệ thống `Module_TongHopTn_TheoChuanHoa` đang đọc file Google Sheets master nhân sự cũ để lấy danh sách chi tiết nhân sự đã chốt snapshot hàng tháng (NS-003). Điều này gây ra chậm trễ, khó kiểm soát phiên bản và không an sau.
- **Vấn đề cần giải quyết:** Cần một API Backend tập trung, bảo mật bằng API Key để cung cấp dữ liệu snapshot chi tiết nhân sự đã chốt hàng tháng cho hệ thống Module_TongHopTn_TheoChuanHoa từ mốc tháng T6.2026 trở đi.
- **Mục tiêu:** Xây dựng endpoint GET `/api/snapshots/employees-detail` hoạt động ổn định, chính xác, bảo mật tốt bằng `x-api-key`.
- **Kết quả mong đợi:** API trả về đúng cấu trúc JSON mong muốn của các nhân sự thuộc các snapshot chưa bị xóa (`snapshot_status != 'deleted'`) trong tháng được yêu cầu, đi kèm bộ test tự động (integration test) để kiểm chứng.

## 2. Phạm vi

### In scope
- Định nghĩa router GET `/api/snapshots/employees-detail` trong `backend/src/routes/snapshots.ts` trước các dynamic routes.
- Xác thực qua header `x-api-key` khớp với `env.INTERNAL_API_KEY`.
- Chuẩn hóa query param `thang` (dạng `Tx.YYYY` hoặc `T0x.YYYY`) thành `YYYY-MM`.
- Query dữ liệu qua Supabase client (service_role) kết hợp giữa bảng `snapshot_employees` và `snapshots` lọc theo `snapshots.month = YYYY-MM` và `snapshots.snapshot_status != 'deleted'`.
- Định dạng response JSON: `data` chứa array các object gồm các trường: `thang` (chuẩn hóa), `ma_nhan_su`, `ho_va_ten`, `email`, `khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su`, `luong_target_gt`, `luong_target_cc`.
- Thêm integration test để kiểm chứng API.

### Out of scope
- Sửa đổi UI của phân hệ snapshots.
- Xử lý phân quyền theo phiên làm việc (Session Auth) cho endpoint này (chỉ dùng API key).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Tiếp tục sử dụng Supabase client service_role ở Backend service để bypass RLS một cách an toàn sau khi đã authenticate (ở đây authenticate qua API key).
  - Sử dụng cấu trúc module Hono router như hiện tại.
- **"Cấm kỵ" cần tránh:**
  - Không khai báo route này sau dynamic route `/:id` vì Hono sẽ nhận nhầm `employees-detail` là một ID.
  - Không hardcode API key, dùng `env.INTERNAL_API_KEY`.
- **Ràng buộc kiến trúc liên quan:**
  - Giữ nguyên cấu trúc Envelope-Based API: trả về `{ data: [...] }`.

## 4. Giả định và câu hỏi mở

### Giả định
- Định dạng trường `thang` trả về trong payload JSON sẽ là định dạng chuẩn hóa dạng `Tx.YYYY` (ví dụ `T6.2026` thay vì `2026-06`) để Module_TongHopTn_TheoChuanHoa dễ dàng khớp trực tiếp với nghiệp vụ cũ. Nếu query param truyền vào là `T06.2026` hay `T6.2026`, API sẽ chuẩn hóa tiền tố trả về thành `T6.2026`.
- Bảng `snapshots` không bao giờ bị hard delete, chỉ đổi status thành `deleted` nên ta lọc bỏ trạng thái `deleted` đúng như nghiệp vụ NS-003.

### Phân tích Chi phí & Latency
- **Về chi phí (Cost):**
  - Việc tạo mới API hoàn toàn **không tốn thêm chi phí vận hành**.
  - Supabase/PostgreSQL không tính phí theo số lượng API/endpoints mà theo dung lượng lưu trữ, RAM và băng thông (egress). Với tần suất gọi API từ **30 đến 100 lần mỗi tháng**, lượng băng thông và compute CPU tiêu thụ là cực kỳ nhỏ. Payload JSON của một tháng snapshot (chỉ gồm thông tin cơ bản của vài ngàn nhân sự) chỉ dao động khoảng vài trăm KB đến vài MB, do đó băng thông phát sinh hoàn toàn nằm trong giới hạn Free Tier hoặc chi phí tiệm cận 0.
  - Cloud Run chỉ tính phí theo CPU/RAM thời gian xử lý thực tế (billing per-millisecond). Vì Hono siêu nhẹ và xử lý request này chỉ mất vài chục mili-giây, nên chi phí compute gần như bằng 0.
- **Về độ trễ (Latency):**
  - API này chạy cực kỳ nhanh (dự kiến **< 100ms** tổng thời gian phản hồi).
  - Lý do: Bảng `snapshot_employees` đã được lập chỉ mục (index) sẵn trên cột `snapshot_id` (`idx_snapshot_emp_snapshot`). Bảng `snapshots` cũng có khóa chính và index trên `month`.
  - Phép JOIN giữa 2 bảng dựa trên index sẽ được PostgreSQL tối ưu hóa triệt để.

## 5. Acceptance Criteria

- [ ] Route GET `/api/snapshots/employees-detail` hoạt động độc lập không yêu cầu session cookie/header Authorization, chỉ yêu cầu header `x-api-key`.
- [ ] Truyền sai hoặc thiếu `x-api-key` trả về lỗi `401 Unauthorized`.
- [ ] Query parameter `thang` là bắt buộc. Nếu thiếu hoặc sai định dạng (không phải dạng `Tx.YYYY` hoặc `Txx.YYYY`) trả về `400 Bad Request`.
- [ ] Trả về đúng dữ liệu snapshot của tháng yêu cầu, bỏ qua các snapshot có trạng thái `snapshot_status = 'deleted'`.
- [ ] Cấu trúc JSON response chứa array `data` gồm đúng 12 trường: `thang`, `ma_nhan_su`, `ho_va_ten`, `email`, `khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su`, `luong_target_gt`, `luong_target_cc`.
- [ ] Có ít nhất 1 file integration test chạy thành công bao phủ các kịch bản: hợp lệ, thiếu key, sai định dạng tháng, không tìm thấy snapshot.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/routes/snapshots.ts` | Sửa | Mount endpoint static route mới và xử lý validation / authorization. | 🟢 Thấp | Khai báo TRƯỚC dynamic routes |
| `backend/src/services/snapshotService.ts` | Sửa | Thêm hàm `getSnapshotEmployeesDetail` để thực hiện query dữ liệu từ DB. | 🟢 Thấp | Trả về data array đúng kiểu |
| `backend/src/__tests__/integration/snapshots.test.ts` | Sửa | Viết thêm các test cases kiểm tra API mới. | 🟢 Thấp | Chạy độc lập trên local DB |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Việc lọc và phân tích chuỗi định dạng `thang` từ request. Cần đảm bảo parse chuẩn xác regex tránh lỗi 500 khi người dùng gửi chuỗi lạ.
- **Review focus areas:**
  - Route được khai báo trước `snapshotsRoutes.get('/:id')`.
  - Authentication check bằng `x-api-key` không đi qua authMiddleware thông thường.
  - SQL query sử dụng Supabase `.select(...)` thực hiện join thông qua syntax `snapshots!inner(month, snapshot_status)`.
- **Known pitfalls / historical issues:**
  - Cần chú ý match đúng tên cột của table `snapshot_employees` (ví dụ `luong_target_gt` và `luong_target_cc`).

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1:** Triển khai Backend Service logic & Route endpoint.
  - **Phase 2:** Viết Integration Tests và tối ưu hóa query.
- **Thứ tự triển khai:**
  - Thêm function query DB trong `snapshotService.ts`.
  - Thêm route trong `snapshots.ts`.
  - Viết và chạy test trong `snapshots.test.ts`.

## 9. Test Strategy

- **Automated tests:**
  - Sử dụng Vitest chạy integration test: `pnpm --filter backend test:integration`
  - Viết các test cases cụ thể trong `backend/src/__tests__/integration/snapshots.test.ts`.
- **Manual verification:**
  - Sử dụng curl hoặc Postman để gọi thử API từ local host:
    `curl -H "x-api-key: <INTERNAL_API_KEY>" "http://localhost:8080/api/snapshots/employees-detail?thang=T6.2026"`

## 10. Rollback Plan

- Revert commit thay đổi code. Không ảnh hưởng database schema nên rollback cực kỳ an toàn.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
- Findings chi tiết từ review: `EXPERT_REVIEW.md`

## Review Notes

> **Verdict**: ✅ ĐỒNG Ý — Không có blocker Critical hoặc High.
> **Ngày review**: 2026-07-25 | Round 1 | Hội đồng: Kiến Trúc Sư Trưởng + Delivery/QA + Bảo Mật + API Contract

### Điểm Medium phải xử lý trong implementation (không cần re-plan):

- **FR-01:** Trong `getSnapshotEmployeesDetail`, thêm guard `if (monthNum < 1 || monthNum > 12)` sau `parseInt` — throw `INVALID_FORMAT` để đảm bảo `T13.2026` trả về `400` thay vì `{ data: [] }`.
- **FR-03:** Chốt hành vi khi không có snapshot: trả về `{ data: [] }` HTTP 200. Không trả 404. Cập nhật test case 4 cho khớp.
- **FR-07:** Task 1.1 phải map `snapshot.month (YYYY-MM)` → `Tx.YYYY` trước khi đưa vào array response. Tái dùng logic parse từ `normalizedMonth`.

### Điểm Low (khuyến nghị, không chặn rollout):

- **FR-02:** Cập nhật Contract header `snapshots.ts` (số endpoint + đề cập `/employees-detail`).
- **FR-04:** Ghi chú trong Task 1.1: null fields được giữ nguyên trong response.
- **FR-05:** Thêm `logger.info()` gồm `{path, ip, thang}` khi gọi thành công — không log payload.
- **FR-06:** Đây là accepted risk. `INTERNAL_API_KEY` cần được rotation ngay nếu bị nghi lộ.
