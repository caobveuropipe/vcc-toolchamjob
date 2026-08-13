# Feature Tasks: Mobile WebApp Responsiveness (Tối ưu giao diện Mobile)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-14

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: 📱 Core Layout & Lists (Responsive)

**Mục tiêu:** Sidebar, Profile Header, Toolbars, Admin Tabs và Data Tables tương thích viewport nhỏ nhằm ngăn chặn hiện tượng Overflow hỏng Layout chung.

- [x] Task 1.1: `MainLayout.tsx`: Đổi Sidebar thành Drawer (ẩn/hiện Sidebar Mobile) qua Drawer component và nút Hamburger. Thu gọn text khu vực Header Profile.
- [x] Task 1.2: Các List Views (`EmployeeListPage.tsx`, `SalaryListPage.tsx`): Tái thiết kế Toolbars, Filter Stack Stack. Break Filter wrap xuống dưới grid (span=24 trên xs). Thêm logic cuộn bảng Data (`scroll={{ x: 'max-content' }}`).
- [x] Task 1.3: Trang Cấu hình `AdminDashboard.tsx`, `BulkReviewerOps.tsx`: Sắp xếp lại container của Tabs để khi xuất hiện trên điện thoại mượt mà, và tuỳ chỉnh thanh Actions/Filter bên trong các Tab không bị bung khung.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Nhất thiết kiểm tra DevTools với chiều rộng <768px: KHÔNG ĐƯỢC CÓ thẻ thành phần tràn/kéo ngang màn hình).

## Phase 2: 🖼 Forms & Modals

**Mục tiêu:** Đảm bảo luồng form CRUD khó nhằn trên modal hay phòng chờ xếp được thành kiểu dáng Stacked 1-cột thân thiện.

- [x] Task 2.1: `EmployeeForm.tsx` (và các steps): Phủ Responsive Cấu trúc Form Grid, chuyển hệ thống Grid từ fixed hoặc nhiều span về `<Col xs={24} ...>` ở những bề mặt thao tác tạo mới nhân sự/Form.
- [x] Task 2.2: Modal Lương `SalaryEditModal.tsx`: Chỉnh sửa layout form tiền lương thành xếp dòng dọc với các phần Input Group được căn lại, đảm bảo UI Mobile không bị đè chữ.
- [x] Task 2.3: Phòng Chờ `PendingRoomPage.tsx`: Bọc và tuỳ biến Action Rows và Expansion Rows giúp nhân sự EA ở mobile chạm nhấp duyệt hoặc sửa nhanh mà bảng không biến dạng.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Đảm bảo form Lương sửa/tạo và form Pending Room vận hành trơn tru Layout trên mode Responsive giả lập).

## Phase 3: 📸 Camera Upload UX & Client Compression (Blocker Resolved)

**Mục tiêu:** Tối ưu hiệu năng upload và trải nghiệm chụp hình giấy tờ nhân sự ngay trên trình duyệt di động cho EA.

- [x] Task 3.1: `Package Installation & Settings`: Cài đặt thư viện `browser-image-compression`.
- [x] Task 3.2: `DocumentUpload.tsx / Image Uploader`: Viết lại component customRequest của Upload/Dragger, hứng sự kiện lấy file chụp từ Camera, tự động scale down & giảm quality (nếu là thẻ nhớ ảnh) trước khi đẩy Presigned URL lên MinIO. Tối ưu lại trải nghiệm loading "Đang nén hình ảnh...".: gọi Upload với `accept="image/*"` cùng thuộc tính `capture="environment"`. Luồng 2 "Chọn tệp PDF": gọi Upload picker thông thường (`accept="image/*,application/pdf"`) không dùng thuộc tính capture. Cần đảm bảo UI vẫn sạch và dễ nhìn (Ví dụ: bọc 2 component gộp trong `Space`).
- [x] Task 3.3: `DocumentUpload.tsx`: Tích hợp Logic Compression ở sự kiện `customRequest` hoặc `beforeUpload` trước khi xin chữ ký Presign của server. Đảm bảo cấu hình tham số Option tối đa file gốc chỉ nặng dưới `2MB` / Độ phân giải tối đa `1920px`. Hiển thị Spin "Đang xử lý ảnh tối ưu..." cho người dùng rõ.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 theo Matrix Bắt Buộc. 
      - (Matrix-Mạng): Thực hiện bài test bằng Wifi và 4G/LTE qua IP LAN.
      - (Matrix-ThiếtBị): Load lên iOS Safari và Android Chrome.
      - (Matrix-Camera & Non-Regression Check): Bấm nút Chụp ảnh để xem trình duyệt có gọi Native Camera không. Sau đó, huỷ ảnh và bấm nút Tệp/PDF để kiểm tra Picker của OS lên đúng thư mục Documents cho phép đính kèm tệp PDF lưu trên máy điện thoại không.
      - (Matrix-DungLượng): Cố tình lấy ảnh gốc máy DSLR/điện thoại Pro Max 6-10MB và Upload. Nắm bắt lượng payload truyền lên Object R2 chỉ khoảng ~1 MB đổ lại. Sau đó nhấn đọc OCR để Verify Cloud Run Log không báo OOM.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-14T17:25 | Phase 1 | Task 1.1 | Bắt đầu chuyển Sidebar thành Drawer (MainLayout.tsx) | start | |
| 2026-04-14T17:26 | Phase 1 | Task 1.1 | Hoàn thành đổi Sidebar thành Drawer | done | |
| 2026-04-14T17:26 | Phase 1 | Task 1.2 | Bắt đầu tối ưu Responsive cho EmployeeListPage và SalaryListPage | start | |
| 2026-04-14T17:27 | Phase 1 | Task 1.2 | Hoàn thành wrap toolbars và auto scroll | done | |
| 2026-04-14T17:27 | Phase 1 | Task 1.3 | Tối ưu responsive AdminDashboard và BulkReviewerOps | start | |
| 2026-04-14T17:28 | Phase 1 | Task 1.3 | Hoàn thành | done | |
| 2026-04-14T17:28 | Phase 1 | Task 1.Final | Self-test responsive trên các view | start | Chờ User test |
| 2026-04-14T17:38 | Phase 1 | Task 1.Final | User báo lỗi các cột fixed: left chiếm hết màn hình mobile, không scroll ngang được | retry | Sửa EmployeeTable và SalaryListPage |
| 2026-04-14T17:40 | Phase 1 | Task 1.Final | Đã gỡ fixed: left trên mobile viewport cho các bảng | done | Chờ User test lại |
| 2026-04-14T17:41 | Phase 1 | Task 1.Final | Phát hiện Quản lý lương chưa cập nhật do thiếu dependency trong useMemo | retry | Sửa SalaryListPage.tsx |
| 2026-04-14T17:41 | Phase 1 | Task 1.Final | Đã cập nhật xong lỗi useMemo | done | Chờ User test lại |
| 2026-04-14T17:42 | Phase 1 | Task 1.Final | User confirm pass thay đổi UI | done | Hoàn thành Phase 1 |
| 2026-04-14T17:43 | Phase 2 | Task 2.1 | Hoàn thành đổi fixed span 8 thành responsive xs 24 cho EmployeeForm | done | |
| 2026-04-14T17:43 | Phase 2 | Task 2.2 | Bắt đầu sửa layout Modal lương SalaryEditModal | start | |
| 2026-04-14T17:44 | Phase 2 | Task 2.2 | Hoàn tất responsive form grid Modal | done | |
| 2026-04-14T17:44 | Phase 2 | Task 2.3 | Bắt đầu responsive PendingRoomPage | start | |
| 2026-04-14T17:45 | Phase 2 | Task 2.3 | Hoàn tất wrap và bỏ fixed action column ở data table | done | |
| 2026-04-14T17:45 | Phase 2 | Task 2.Final | Tiến hành self-test Phase 2 | start | Chờ chạy typecheck và báo user test |
| 2026-04-14T17:52 | Phase 2 | Task 2.Final | User feedback khoảng cách thừa ở Card Phòng chờ | retry | Bổ sung bodyStyle để sát viền |
| 2026-04-14T17:52 | Phase 2 | Task 2.Final | Hoàn tất Phase 2 | done | |
| 2026-04-14T17:54 | Phase 3 | Task 3.1 | Bắt đầu cài browser-image-compression | start | |
| 2026-04-14T17:55 | Phase 3 | Task 3.2, 3.3 | Viết component DocumentUpload, tách Camera button, thêm image compression | done | |
| 2026-04-14T17:55 | Phase 3 | Task 3.Final | Bắt đầu self-test Phase 3 | start | Chờ chạy typecheck và báo user test |
| 2026-04-14T17:58 | Phase 3 | Task 3.Final | User báo lỗi nút tải ảnh quay chờ mãi không xong | retry | Dời image compression sang hook beforeUpload và giữ uid file |
| 2026-04-14T17:58 | Phase 3 | Task 3.Final | Đã sửa lần 1 | done | Chờ user test lại |
| 2026-04-14T18:04 | Phase 3 | Task 3.Final | Lỗi quay mãi chưa được fix triệt để | retry | Tắt `useWebWorker` do có thể gây treo webworker thread âm thầm |
| 2026-04-14T18:04 | Phase 3 | Task 3.Final | Đã sửa triệt để lỗi treo Nén ảnh | done | Chờ user verify |
| 2026-04-14T18:08 | Phase 3 | Task 3.Final | User báo file dưới 2MB (chụp) vẫn quay vòng ở tiến trình Antd Upload | retry | Sửa lỗi chí mạng: Thẻ `<Upload>` kích hoạt tiến trình bị unmount (biến mất khỏi DOM) ngay lập tức khi fileList > 0 khiến AntD huỷ toàn bộ Promise nền. Đổi sang `display: none`. |
| 2026-04-14T18:08 | Phase 3 | Task 3.Final | Đã fix giữ nguyên vòng đời DOM thẻ Upload | done | Chờ user test |
| 2026-04-14T18:14 | Phase 3 | Task 3.Final | Fix AntD Warnings: Space.direction, Spin.tip, Drawer.width | done | |
| 2026-04-14T18:14 | Phase 3 | Task 3.Final | Hoàn tất Phase 3 và toàn bộ Feature | done | Xin phép Archive |
