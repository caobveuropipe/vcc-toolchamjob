# Feature Plan: Xuất Excel nhân sự thử việc kèm lương

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Khuyến nghị gọi `feature-review` do có đụng chạm đến xuất dữ liệu Lương (`SALARY_FIELDS`).
> **Feature slug**: export-probation-salary
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-26

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại danh sách nhân sự không hỗ trợ xuất Excel kết hợp với dữ liệu lương đặc thù của luồng thử việc theo chu kỳ (từ ngày 26 tháng trước đến 25 tháng hiện tại).
- **Vấn đề cần giải quyết:** Cần một chức năng trích xuất danh sách nhân sự mới/thử việc chứa các trường hỗn hợp (Hồ sơ + Tiền lương) dành riêng cho quản lý nhân sự cấp khối (EA).
- **Mục tiêu:** Nâng cấp nút "Xuất Excel" hiện tại thành một Menu Dropdown, bổ sung thêm tùy chọn "Xuất danh sách nhân sự thử việc". Báo cáo này lấy 16 trường dữ liệu chỉ định, lọc tự động theo ngày vào công ty (chu kỳ 26 tháng T-1 đến 25 tháng T, với T là tháng xuất báo cáo).
- **Kết quả mong đợi:** Tại trang Danh sách nhân sự, EA khối khi bấm vào menu xuất Excel sẽ có tùy chọn xuất riêng cho thử việc. File Excel tải về chứa đúng 16 trường, tuân thủ Salary Isolation, có ghi Audit Log và Rate Limiting.

## 2. Phạm vi

### In scope
- Cải tiến nút "Xuất Excel" hiện tại trên UI `EmployeeListPage` thành dạng Dropdown Menu.
- Bổ sung tùy chọn "Xuất danh sách nhân sự thử việc" (chỉ hiển thị cho role EA hoặc SA).
- API endpoint mới trả về dữ liệu kết hợp từ bảng `employees` và `salaries`, giới hạn đúng 16 trường yêu cầu.
- PostgreSQL Function (RPC) để join an toàn và bypass RLS nếu cần, có kiểm tra quyền truy cập (EA của khối).
- Logic tính toán ngày chu kỳ: Từ ngày 26 tháng T-1 đến 25 tháng T (T là tháng gọi xuất, theo time zone Asia/Ho_Chi_Minh).

### Out of scope
- Xuất dữ liệu cho các tháng khác trong quá khứ (chỉ hỗ trợ tính toán động với T = tháng hiện tại lúc bấm nút).
- Chỉ áp dụng cho EA và SA; VI/VA/Reviewer không thuộc scope.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Áp dụng `exportRateLimiter` (5 lần/phút/user) và `audit_log` chống scraping. Module log sử dụng `NS-002` (vì có chứa dữ liệu lương).
  - Sử dụng chung hàm tiện ích UI `exportToExcel` có chứa metadata ẩn và watermark (traceability).
  - Sử dụng chung PermissionMatrix cache thay vì đọc từ payload JWT.
- **"Cấm kỵ" cần tránh:** 
  - Không phá vỡ **Salary Isolation**. Tuyệt đối không nhồi trường lương vào API lấy danh sách nhân sự mặc định (`get_employees`). Phải dùng một API/RPC chuyên biệt riêng phục vụ đúng chức năng export này.
  - RPC không được public. Phải được hardening kỹ càng (revoke from public, grant to service_role).
- **Ràng buộc kiến trúc liên quan:** Backend Hono chỉ gọi DB Supabase thông qua `service_role` (vì RLS block access trực tiếp từ frontend).

## 4. Giả định và câu hỏi mở

### Giả định
- Giao diện nút "Xuất Excel" hiện tại (nếu đang là Button thường) sẽ được chuyển thành Ant Design `Dropdown` chứa `Menu`. Tùy chọn xuất lương thử việc chỉ hiển thị bên trong menu nếu User có role EA (hoặc SA). VA và Reviewer sẽ bị chặn không được hiển thị nút này.
- 16 trường sẽ được map chính xác với schema DB hiện tại: `khoi`, `ma_nhan_su`, `ho_va_ten`, `chuc_danh`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su`, `nguoi_quan_ly`, `ngay_vao_cong_ty`, `ngay_ky_hd`, `luong_target_gt` (Target), `lcd_gt` (Lương cố định hợp đồng), `thuong_doanh_so_gt` (Thưởng KD), `ty_le_luong_tv` (Tỷ lệ lương thử việc).

### Câu hỏi mở
- Không còn (Đã chốt toàn bộ mapping 16 trường).

## 5. Acceptance Criteria

- [ ] Cải tiến nút xuất Excel hiện tại thành Dropdown Menu, bổ sung tùy chọn "Xuất danh sách nhân sự thử việc" (chỉ hiển thị đối với role EA và SA). VA, Reviewer và VI sẽ bị chặn (giao diện ẩn menu item, gọi trực tiếp API trả về 403).
- [ ] Tính toán đúng chu kỳ 26/T-1 đến 25/T, ví dụ: xuất vào 10/05/2026 thì lấy nhân sự có `ngay_vao_cong_ty` từ `26/04/2026` đến `25/05/2026` (theo Timezone UTC+7).
- [ ] Trả về đúng 16 cột dữ liệu đã map chuẩn schema, không thừa trường lương nhạy cảm khác.
- [ ] Chỉ nhân sự thuộc quyền quản lý khối của EA mới được trích xuất. SA được phép trích xuất tất cả thông qua cờ `p_unrestricted = true`.
- [ ] Điều kiện "nhân sự thử việc": Lấy các bản ghi live (`state_phong_cho = false`) và có trạng thái thử việc (`trang_thai = 'thu_viec'`).
- [ ] Viết Log xuống `audit_log` khi xuất file với module `NS-002`.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `frontend/src/pages/Employees/EmployeeListPage.tsx` | Sửa | Refactor nút Export hiện tại thành Dropdown Menu và gắn gọi API xuất mới | 🟢 | Không rõ |
| `backend/src/routes/salary.ts` | Sửa | Đăng ký API Route `GET /export-probation` (đường dẫn tuyệt đối: `GET /api/salaries/export-probation`) | 🟡 | `GET /api/salaries/export-probation` |
| `database/migrations/xxx_export_probation_rpc.sql` | Tạo | Tạo RPC an toàn lấy dữ liệu cho export | 🔴 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** API Endpoint và PostgreSQL RPC vì query trộn dữ liệu hồ sơ và lương.
- **Review focus areas:** Cách kiểm tra phân quyền (EA chỉ được xuất khối của mình) bên trong RPC/Route; Cách tránh rò rỉ các trường lương không được phép; Xử lý RateLimit.
- **Known pitfalls / historical issues:** Chú ý múi giờ (Timezone) khi so sánh ngày 26 đến 25 (đảm bảo UTC+7).
- **Dependencies / rollout concerns:** Cần run migration SQL RPC mới.

## 8. Chiến lược triển khai

- **Phase strategy:**
  - Phase 1: Database & Backend (Tạo RPC, tạo Route, áp RateLimit/AuditLog).
  - Phase 2: Frontend (Gắn nút gọi API, download file Excel qua utils).
- **Thứ tự triển khai:** DB -> Backend -> Frontend.
- **Điểm cần phối hợp:** Không có.

## 9. Test Strategy

- **Automated tests:** 
  - Integration test cho API endpoint:
    - HTTP 401 nếu thiếu hoặc sai token.
    - HTTP 403 nếu đã xác thực (role VA, VI, Reviewer) nhưng không có quyền truy cập.
    - HTTP 200 nếu role là EA (chỉ lấy khối của EA) hoặc SA (lấy tất cả).
    - API trả về đúng 16 keys, tuyệt đối không lộ thêm các trường salary khác.
    - Test Rate Limit: gọi quá 5 lần/phút bị chặn.
    - Test Hard Limit: API/RPC giới hạn tối đa 5000 dòng (EXPORT_LIMIT) hoặc trả về lỗi rõ ràng nếu vượt quá.
    - Test RPC privileges: Đảm bảo user thường / `anon` / `authenticated` gọi trực tiếp vào RPC bằng REST API sẽ bị `HTTP 401/403`.
- **Manual verification:** 
  - Đăng nhập tk EA, click nút xuất, xác minh file Excel trả về có dòng metadata watermark.
  - Filter chu kỳ ngày 26 đến 25 hoạt động chính xác (đảm bảo boundary UTC+7).
  - Có audit log trong DB với module `NS-002`.
- **Data / env chuẩn bị trước khi test:** Seed nhân sự có `ngay_vao_cong_ty` rải rác trong và ngoài chu kỳ để kiểm tra lọc. Seed nhân sự có `state_phong_cho = true` để đảm bảo bị loại trừ khỏi report.

## 10. Rollback Plan

- Revert commit UI.
- Drop RPC trong DB nếu cần.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
