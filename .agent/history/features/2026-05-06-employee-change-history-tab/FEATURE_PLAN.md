# Feature Plan: Hiển thị Tab Lịch sử thay đổi nhân sự

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` để đảm bảo UI/UX thống nhất và permission isolation.
> **Feature slug**: employee-change-history-tab
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống đã có backend ghi nhận lịch sử thay đổi thông tin nhân sự và tiền lương vào bảng `change_history`, đồng thời có API `GET /api/change-history/:ma_nhan_su`. Tuy nhiên, giao diện (UI) trang chi tiết nhân sự chưa hiển thị thông tin này cho người dùng.
- **Vấn đề cần giải quyết:** Người quản trị (EA/SA) không thể xem lại các lần điều chỉnh trong quá khứ của một nhân sự ngay trên giao diện, dẫn đến khó khăn trong việc đối soát và theo dõi vết thay đổi.
- **Mục tiêu:** Tích hợp tab "Lịch sử" vào trang Chi tiết nhân sự (`EmployeeDetailPage`), phân tách rõ ràng giữa **Lịch sử Lương** và **Lịch sử Hồ sơ** để dễ dàng theo dõi, đồng thời hỗ trợ phân quyền lọc thông tin nhạy cảm.
- **Kết quả mong đợi:** Người dùng có quyền truy cập có thể xem lịch sử thay đổi theo hai nhóm riêng biệt: Lương (chỉ SA/EA/VA thấy chi tiết) và Hồ sơ (các thông tin điều chuyển, thông tin cá nhân...).

## 2. Phạm vi

### In scope
- Cập nhật `@vcc/shared` để bổ sung types cho Change History.
- Thêm hook `useChangeHistory` vào frontend để fetch dữ liệu từ API hiện có.
- Chuyển đổi giao diện `EmployeeDetailPage.tsx` sang dạng sử dụng `Tabs`.
- Xây dựng component `ChangeHistoryTab` hiển thị bảng lịch sử với Ant Design `Table`.
- Mapping mã trường (snake_case) sang tên hiển thị (Vietnamese labels).
- Xử lý phân trang (Pagination) cho danh sách lịch sử.

### Out of scope
- Sửa đổi backend API (trừ khi phát hiện lỗi nghiêm trọng trong quá trình tích hợp).
- Thêm tính năng export lịch sử ra Excel (để dành cho phase sau).
- Hiển thị lịch sử trong các trang khác ngoài trang chi tiết nhân sự.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
    - [2026-03-13] UI Architecture: Sử dụng Ant Design v6 + Theme Tokens. Không dùng Tailwind.
    - [2026-03-14] Salary Isolation: Đối với user Viewer (VI), hệ thống ẩn các bản ghi lịch sử liên quan đến chi tiết lương (các trường trong `SALARY_FIELDS` như bậc lương, số tiền...). Tuy nhiên, thông tin về "Ngày điều chỉnh lương" (`ngay_dieu_chinh_luong`) vẫn được phép hiển thị để theo dõi tiến độ hồ sơ. Backend đã thực hiện logic lọc này, frontend cần hiển thị đúng theo dữ liệu trả về.
- **"Cấm kỵ" cần tránh:** 
    - Không bypass IDOR: Luôn truyền `ma_nhan_su` và để backend validate quyền truy cập.
- **Ràng buộc kiến trúc liên quan:** 
    - Tôn trọng monorepo: Mọi type/schema mới phải nằm trong `@vcc/shared`.

## 4. Giả định và câu hỏi mở

### Giả định
- Backend API `/api/change-history/:ma_nhan_su` hoạt động ổn định và trả về đúng schema như đã thiết kế.
- Các trường `old_value` và `new_value` được lưu dưới dạng string (đã format) trong DB, FE chỉ việc hiển thị.

### Câu hỏi mở
- [Non-blocking] Có cần hiển thị theo dạng Timeline thay vì Table không? (Tạm thời chọn Table vì dễ tra cứu và hỗ trợ phân trang tốt hơn).
- [Non-blocking] Các trường lương có cần format tiền tệ VND trong bảng lịch sử không? (Nên thực hiện để đồng nhất UX).

## 5. Acceptance Criteria

- [ ] Trang chi tiết nhân sự (`/employees/:id`) có thêm tab "Lịch sử".
- [ ] Dữ liệu lịch sử được tải đúng theo mã nhân sự đang xem.
- [ ] Bảng lịch sử hiển thị đầy đủ các cột: Thời gian (format DD/MM/YYYY HH:mm), Người thực hiện, Nội dung thay đổi (Tên trường TV), Giá trị cũ, Giá trị mới, Lý do.
- [ ] Phân trang hoạt động bình thường (mặc định 20-50 dòng/trang).
- [ ] User VI (Viewer) không nhìn thấy các dòng lịch sử liên quan đến lương (đã được backend filter, FE hiển thị danh sách rỗng hoặc filter thêm nếu cần).
- [ ] Mobile responsive: Bảng hiển thị tốt hoặc có cơ chế cuộn ngang trên màn hình nhỏ.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `packages/shared/src/types/api.ts` | Sửa | Thêm interface `ChangeHistoryEntry` và `ChangeHistoryResponse`. | 🟢 | Có |
| `frontend/src/hooks/useEmployees.ts` | Sửa | Thêm `useChangeHistory` hook sử dụng TanStack Query. | 🟢 | Có |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Sửa | Chuyển đổi sang `Tabs`, tích hợp component mới. | 🟡 | Có |
| `frontend/src/pages/Employees/components/ChangeHistoryTab.tsx` | Tạo mới | Component chính hiển thị dữ liệu lịch sử. | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
    - **Permission Leak**: Đảm bảo thông tin lương không bị lộ cho user VI qua các bản ghi lịch sử.
    - **UI Layout**: Việc chuyển sang `Tabs` có thể làm thay đổi cấu trúc hiện tại của trang Detail, cần test kỹ responsive.
- **Review focus areas:** 
    - Kiểm tra tính đúng đắn của việc mapping label trường dữ liệu.
    - Kiểm tra hiệu năng khi nhân sự có hàng trăm bản ghi lịch sử (pagination check).
- **Known pitfalls / historical issues:** 
    - `ma_nhan_su` có thể đổi từ `TMPxxx` sang mã chính thức. DB dùng `ON UPDATE CASCADE` nên history không bị mất, nhưng cần kiểm tra link URL.

## 8. Chiến lược triển khai

- **Phase strategy:** Chia làm 3 phase: 1. Core (Shared + Hooks), 2. UI (Component), 3. Integration & Polish.
- **Thứ tự triển khai:** Shared -> Hooks -> Component -> Integration.
- **Yêu cầu migration / config / deploy:** Không yêu cầu migration DB.

## 9. Test Strategy

- **Automated tests:** 
    - Mock API response để test hiển thị bảng.
    - Test mapping label trong `@vcc/shared`.
- **Manual verification:** 
    - Đăng nhập SA/EA để xem full history.
    - Đăng nhập VI để kiểm chứng việc ẩn salary history.
    - Kiểm tra phân trang và loading state.

## 10. Rollback Plan

- Revert commit trên frontend. Feature này hoàn toàn nằm ở UI nên không ảnh hưởng đến dữ liệu DB.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
