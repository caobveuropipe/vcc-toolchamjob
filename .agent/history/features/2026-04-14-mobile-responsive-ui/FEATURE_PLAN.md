# Feature Plan: Mobile WebApp Responsiveness (Tối ưu giao diện Mobile)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review (Đã review và xử lý các blocker). Luồng upload liên quan tới file lớn, OCR, và biên FE/BE nên rủi ro cao hơn chỉ là CSS layout thông thường.
> **Feature slug**: mobile-responsive-ui
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-14

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại ứng dụng được thiết kế tối ưu cho trải nghiệm Desktop. Việc upload giấy tờ bằng ảnh chụp trên di động cần gửi ảnh qua laptop rất cồng kềnh.
- **Vấn đề cần giải quyết:** Tối ưu luồng chụp ảnh và upload trực tiếp từ Mobile Browser. Xử lý triệt để rủi ro lỗi OOM (Out-Of-Memory) backend khi xử lý ảnh dung lượng cao (>5MB) bằng AI Vision OCR.
- **Mục tiêu:** Điều chỉnh toàn vẹn giao diện Mobile (Layout, Navbar, Toolbar, Tabs, Modals, Tables) và xây dựng contract RÕ RÀNG cho luồng Native Camera UX + Bắt buộc Nén ảnh Client-side.
- **Kết quả mong đợi:** Webapp hiển thị chuẩn trên viewport `375px+`. Giao diện các trang, bộ lọc và modal điều chỉnh mượt. Form tải lên ưu tiên gọi luôn Camera. Ảnh lớn tự nén kích thước gọn gàng trực tiếp ở thiết bị của người dùng để quá tải rủi ro Egress cũng như RAM.

## 2. Phạm vi

### In scope
- Cập nhật `MainLayout`, Sidebar thành Drawer/Hamburger.
- Phủ Responsive cho Toolbar, Filter Stack, Action Wrap, Tabs tại `EmployeeListPage`, `SalaryListPage`, và `AdminDashboard`.
- Điều chỉnh Responsive Form lưới (Grid) ở `EmployeeForm` và các màn Modal trọng yếu: `SalaryEditModal`, `PendingRoomPage`.
- Cho phép cuộn ngang (horizontal scroll) của các Data Tables để bảo toàn thông tin.
- **BẮT BUỘC (FR-01):** Cài đặt và áp dụng logic nén ảnh client-side (vd: `browser-image-compression`) để chủ động thu nhỏ hình ảnh (<2MB) hoặc down-sampling (<1920px) trước khi tải lên Storage. 
- **BẮT BUỘC (FR-02):** Khai báo rõ UX "camera-first" (Ưu tiên Camera) trên `DocumentUpload` sử dụng property tag chuẩn `capture="environment"` (cho Camera quay về phía sau), đồng thời phân biệt UX khi tải bằng Camera và Document Picker.

### Out of scope
- Cập nhật/thêm API hệ thống hoặc các luồng CRUD Backend.
- Đóng gói ứng dụng React Native / PWA trong store.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Sử dụng Ant Design v6 + Theme Tokens. Tuyệt đối không dùng Tailwind.
- **"Cấm kỵ" cần tránh:** Không phá Zod Schema bindings của Form UI. Tuyệt đối tránh gửi Payload Base64 ảnh gốc chưa nén quá 2-3MB làm cạn RAM (Quota Strict Caps: 512Mi) trên các Node Cloud Run (Theo FR-01 hội đồng bảo mật chỉ ra).

## 4. Giả định và câu hỏi mở

### Giả định
- User đồng thuận dùng Horizontal Scroll thay vì Render dạng Card cho các bảng dữ liệu nhiều cột.

### Câu hỏi mở
- Không còn câu hỏi. Mọi vấn đề blocker đã được tích hợp thành yêu cầu bắt buộc giải quyết trong plan.

## 5. Acceptance Criteria

- [ ] Mobile Layout: Sidebar ẩn/hiện dạng Drawer, Toolbar full-width, Action/Filter xếp lướt dọc (Stack), Admin Tabs co gập đúng viewport.
- [ ] Màn hình nhập liệu & Modal (`SalaryEditModal`, `PendingRoomPage`, `EmployeeForm`) được tuỳ chỉnh hạ xuống xếp cột đứng `24-span` ở Viewport nhỏ.
- [ ] Bảng dữ liệu có khả năng cuộn ngang không làm bể khung viewport chung.
- [ ] Trải nghiệm Nhập liệu ảnh: Có nút bấm UX mở camera sau chụp nhanh 1 click (nhờ vào contract `capture="environment"`).
- [ ] Nén ảnh ở Client: Trình duyệt phải tự nén tấm ảnh 5MB-10MB (ví dụ từ iPhone) xuống size dưới 2MB.
- [ ] OCR chạy trên tệp đã nén diễn ra mượt mà, không gặp hiện tượng treo tiến trình từ Backend.
- [ ] Bảo toàn tính năng (Non-regression): Tách bạch giao diện hoặc cách xử lý để luồng "Ưu tiên chụp Camera" không chặn đứng quyền lựa chọn File PDF (Document Picker) vốn có.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `MainLayout.tsx` | Sửa | Responsive Drawer | 🟢 | Không rõ |
| `EmployeeListPage`, `SalaryListPage`, `AdminDashboard` | Sửa | Chỉnh Filter bar, Table Scroll, Tabs | 🟢 | Chưa |
| `EmployeeForm`, `SalaryEditModal`, `PendingRoomPage` | Sửa | Chỉnh Grid/Columns Modal -> Stack | 🟢 | Chưa |
| `DocumentUpload.tsx` | Sửa | Nén ảnh (compression) bắt buộc và UX native camera ưu tiên sau | 🔴 | Buộc phải qua Compression |

## 7. Risk Triage và Review Focus

- **Review required:** Đóng vai trò gatekeeper bắt buộc ở khâu Rollout do có matrix Mobile Devices.
- **Risk hotspots:** Việc tải ảnh Heavy Base64 đè chết bộ nhớ RAM của Cloud API OCR. Sửa dứt điểm bằng Image Compression Browser Plugin.
- **Review focus areas:** Verification Check. Sự đánh giá test của Mobile End-device (Browser compatibility).
- **Dependencies / rollout concerns:** Package Compression và cách trình duyệt web mobile cấp quyền truy cập Camera Native.

## 8. Chiến lược triển khai

- **Phase strategy:** 3 Phases.
  - Phase 1: Core Layout & Lists (MainLayout, Table Scroll, Filter Toolbar, Tabs).
  - Phase 2: Form & Modals (EmployeeForm, SalaryEditModal, PendingRoom).
  - Phase 3: Mobile Document Upload & OCR Compression.
- **Thứ tự triển khai:** Phase 1 -> Phase 2 -> Phase 3.
- **Yêu cầu migration / config / deploy:** Cài đặt phụ thuộc FE npm `browser-image-compression`.

## 9. Test Strategy

- **Ma trận Test Test_Matrix_Upload:** 
  - Khởi chạy kiểm thử cụ thể trên 2 nền tảng: `iOS Safari` và `Android Chrome` ở môi trường Local IP LAN.
  - Tình trạng mạng: `Wifi` và `4G LTE`.
  - Quy mô File Input: File bé (`<1MB`) và File Khủng chụp bởi điện thoại Đời Cao (`7MB+`). 
  - File Non-regression: Bắt buộc test tải lên thành công file PDF thông qua tính năng Native Document Picker của iOS/Android.
- **Rollout Check:**
  - Kiểm định Memory GCP Logs của Cloud Run Backend khi luồng OCR hoạt động với file Test Khủng; xem Node API OCR có bị vượt RAM limit không.

## 10. Rollback Plan

- Revert FE commit và gỡ package compression mới đưa vào.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
