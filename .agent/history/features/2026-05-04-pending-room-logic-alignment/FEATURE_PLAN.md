# Feature Plan: Pending Room Logic Alignment & Refactor

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: User đã xác nhận hướng xử lý, ưu tiên tính gọn nhẹ và ít ảnh hưởng hệ thống.
> **Feature slug**: pending-room-logic-alignment
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-04

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Giao diện phòng chờ hiện tại có các icon nhận diện nhưng logic đang bị lặp lại (redundant) ở cả `EmployeeTable` và `PendingRoomPage`. Icon nhận diện người mới đang dùng hình ảnh chưa tối ưu theo mong muốn của User.
- **Vấn đề cần giải quyết:** 
    - Icon "New Hire" cần nổi bật hơn (Tag NEW đỏ).
    - Icon "Info adjustment" cần chuyển sang dạng Info icon để thân thiện hơn.
    - Code đang bị rườm rà, lặp lại logic `isNewHire`, `hasPendingInfo`... ở nhiều component.
- **Mục tiêu:** Tái cấu trúc logic nhận diện và cập nhật bộ UI icons + tooltips đồng nhất trên toàn hệ thống.
- **Kết quả mong đợi:** 
    - Logic nhận diện được tập trung vào một chỗ (Utilities).
    - UI icons hiển thị đúng theo yêu cầu mới.
    - Codebase sạch hơn, dễ bảo trì.

## 2. Phạm vi

### In scope
- Tạo file `frontend/src/utils/employeeUtils.ts` chứa logic phân loại.
- Cập nhật `PendingRoomPage.tsx` và `EmployeeTable.tsx` sử dụng Utilities mới.
- Thay đổi Icon "Sửa hồ sơ" từ `FileTextOutlined` sang `InfoCircleOutlined`.
- Giữ nguyên Icon "Sửa lương" là `DollarOutlined`.
- Sử dụng Tag "NEW" đỏ cho nhân sự mới.
- Thêm Tooltips cho tất cả icons.

### Out of scope
- Thay đổi cấu trúc Database hay API.
- Thay đổi luồng Approve/Reject hồ sơ.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên cách nhận diện qua `state_phong_cho` và tiền tố `TMP` của `ma_nhan_su` vì đây là phương án "ít ảnh hưởng hệ thống nhất" như User yêu cầu.
- **"Cấm kỵ" cần tránh:** Tránh thêm các trường mới vào Database nếu không thực sự cần thiết.
- **Ràng buộc kiến trúc liên quan:** Đảm bảo logic đồng nhất giữa Dashboard, Danh sách nhân sự và Phòng chờ.

## 4. Giả định và câu hỏi mở

### Giả định
- Logic `isNewHire` vẫn dựa trên `record.ma_nhan_su?.startsWith('TMP')`.
- Các icon chỉ cần hiển thị trên 1 dòng (đã xử lý bằng Space component).

### Câu hỏi mở
- [Non-blocking] Tooltip của "NEW" có cần hiển thị ngày tạo hay không? (Mặc định: Chỉ hiện "Nhân sự mới").

## 5. Acceptance Criteria

- [ ] Icon Nhân sự mới là Tag màu đỏ chữ "NEW".
- [ ] Icon Sửa hồ sơ là `InfoCircleOutlined` màu xanh dương.
- [ ] Icon Sửa lương là `DollarOutlined` màu vàng.
- [ ] Tất cả icon đều có Tooltip rõ nghĩa.
- [ ] Logic hiển thị được gom vào `employeeUtils.ts`.
- [ ] Code tại `EmployeeTable.tsx` và `PendingRoomPage.tsx` không còn logic tính toán rườm rà.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `frontend/src/utils/employeeUtils.ts` | Tạo mới | Nơi quản lý tập trung logic phân loại | 🟢 | Có |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Cập nhật UI và tích hợp Utils | 🟢 | Có |
| `frontend/src/components/EmployeeTable.tsx` | Sửa | Cập nhật UI và tích hợp Utils | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** No (User đã trực tiếp chỉ đạo hướng làm).
- **Risk hotspots:** Đảm bảo logic `isNewHire` chính xác để không gắn nhầm tag NEW cho nhân sự cũ.
- **Review focus areas:** Tính gọn gàng của Utilities mới.

## 8. Chiến lược triển khai

- **Phase strategy:** 
    - Phase 1: Tạo Utilities và tập trung logic.
    - Phase 2: Cập nhật UI đồng bộ.
    - Phase 3: Dọn dẹp code rườm rà.
- **Thứ tự triển khai:** Utils -> PendingRoom -> EmployeeTable.

## 9. Test Strategy

- **Manual verification:** 
    - Kiểm tra Nhân sự mới (mã TMP) hiện đúng tag NEW.
    - Kiểm tra Nhân sự cũ sửa profile hiện đúng icon Info.
    - Kiểm tra Nhân sự cũ sửa lương hiện đúng icon $.
    - Kiểm tra Tooltip khi hover.

## 10. Rollback Plan

- Revert lại commit trước đó của 2 file UI.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
