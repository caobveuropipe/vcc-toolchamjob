# FEATURE_PLAN.md - Hiển thị lương trong chi tiết nhân sự

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: 🟢 CHO PHÉP TRIỂN KHAI (User đã xác nhận qua chat)
> **Feature slug**: show-salary-in-employee-info

## Bối cảnh và Mục tiêu
Hiện tại, trang chi tiết nhân sự (`EmployeeDetailPage`) chỉ hiển thị các thông tin cơ bản về hồ sơ và phần "Tiền lương thay đổi (chờ duyệt)" nếu có. Người dùng có quyền (SA, EA, VA) cần xem được cả mức lương hiện tại của nhân sự để đối chiếu và quản lý, thay vì chỉ xem được lương khi bấm vào nút "Cập nhật lương".

Mục tiêu:
- Bổ sung section hiển thị lương hiện tại trong `EmployeeDetailPage`.
- Tuân thủ quy tắc phân quyền: Chỉ SA, EA, VA và Reviewer được gán mới thấy section này.
- Tổ chức hiển thị dữ liệu lương (25+ trường) một cách khoa học, dễ đọc.

## In Scope / Out of Scope

### In Scope
- Sửa `EmployeeDetailPage.tsx` để render dữ liệu lương hiện tại.
- Sử dụng dữ liệu từ hook `useSalaryDetail` (đã có sẵn nhưng chưa được hiển thị đầy đủ).
- Định nghĩa lại các nhóm trường lương (Giấy tờ, Cơ chế Base, KPI, OKR, v.v.).
- Đảm bảo hiển thị đúng format tiền tệ (VND).

### Out of Scope
- Sửa đổi logic phân quyền ở Backend (đã được implement chuẩn ở Phase 3).
- Sửa đổi logic tính toán lương.
- Thay đổi UI của trang danh sách.

## Đối chiếu Knowledge Base
- **Salary Isolation**: Việc fetch dữ liệu lương đã được tách riêng qua `/api/salaries/:ma_nhan_su`. `EmployeeDetailPage` đã có logic check `can_view_salary_detail` trước khi fetch.
- **Aesthetics**: Sử dụng Ant Design `Descriptions` và `Card` để đảm bảo tính thẩm mỹ premium theo tiêu chuẩn của dự án.

## Giả định và Câu hỏi mở
- Giả định: Dữ liệu lương hiện tại được lưu trong bảng `salaries` và backend trả về đầy đủ các trường khi gọi `getSalaryDetail`.
- Câu hỏi: Có nên gộp "Tiền lương hiện tại" và "Tiền lương thay đổi" vào cùng một section không? -> Quyết định: Tách riêng để người dùng dễ phân biệt cái gì đang sống và cái gì đang chờ duyệt.

## Acceptance Criteria
1. Người dùng có quyền (SA, EA, VA, Reviewer gán) xem được section "Thông tin tiền lương hiện tại".
2. Người dùng không có quyền (VI) KHÔNG nhìn thấy section này.
3. Dữ liệu lương được hiển thị theo nhóm: Giấy tờ (GT) và Cơ chế (CC).
4. Các trường tiền tệ được format VND (ví dụ: 10.000.000 đ).
5. Các trường rỗng/null hiển thị dấu "-".

## Files và Modules bị ảnh hưởng
- `frontend/src/pages/Employees/EmployeeDetailPage.tsx`: Sửa đổi UI chính.
- `frontend/src/services/salaryService.ts`: Kiểm tra type `SalaryDetail` (đã ổn).

## Risk Triage và Review Focus
- **Bảo mật**: Tuyệt đối không được rò rỉ lương cho role VI. Cần kiểm tra kỹ cờ `can_view_salary_detail`.
- **UI/UX**: Với 25+ trường lương, nếu hiển thị hết sẽ rất dài. Cần nhóm lại và sử dụng layout Row/Col hợp lý.

## Chiến lược triển khai
1. Định nghĩa các nhóm trường lương (Constant).
2. Tạo component hoặc section render lương hiện tại.
3. Tích hợp vào `EmployeeDetailPage`.
4. Kiểm thử với các role khác nhau.

## Test Strategy
- Login với SA/EA: Kiểm tra hiển thị đầy đủ.
- Login với VI: Kiểm tra section lương biến mất hoàn toàn.
- Kiểm tra các trường hợp nhân sự chưa có dữ liệu lương (mới tạo).
- Kiểm tra format tiền tệ.
