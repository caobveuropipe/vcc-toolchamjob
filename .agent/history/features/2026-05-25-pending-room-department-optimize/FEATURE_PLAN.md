# Feature Plan: Thêm Cột Bộ Phận và Tối Ưu Hiển Thị Phòng Chờ

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: `pending-room-department-optimize`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Màn hình Phòng chờ hiển thị danh sách nhân sự chờ duyệt với rất nhiều trường thông tin. Người dùng có nhu cầu quản lý thêm thông tin "Bộ phận" của nhân sự ngay tại màn hình danh sách này để dễ đối chiếu trước khi duyệt.
- **Vấn đề cần giải quyết:** 
  - Chưa có cột "Bộ phận" (`bo_phan`) trong bảng danh sách phòng chờ.
  - Màn hình phòng chờ hiện tại có quá nhiều cột, chiều rộng bảng lớn gây cuộn ngang nhiều. Cột "Hành động" đang bị quá tải khi chứa cả nút Action (Submit, Menu More) lẫn 5-6 loại tag trạng thái (`NEW`, `ĐGTV`, icon PDF, Info, Dollar) làm cột bị phình to và rối mắt.
- **Mục tiêu:** 
  - Thêm thành công cột "Bộ phận" vào trước cột "Email" khi ở chế độ Phòng chờ.
  - Tối ưu hóa layout toàn diện: co gọn các cột hiện có, bật `ellipsis` thông minh cho các trường dài (Họ tên, NNT, Email, Bộ phận).
  - Di chuyển các tag/icon trạng thái nháp (`NEW`, `ĐGTV`, PDF, Info, Dollar) từ cột "Hành động" sang hiển thị ngay bên cạnh cột "Họ và tên" để giao diện tự nhiên và giải phóng không gian cột Hành động.
  - Giảm nhẹ font size và padding của bảng thông qua Config Provider cục bộ của AntD v6 giúp hiển thị nhiều thông tin hơn trên một màn hình mà không cần cuộn ngang quá mức.
- **Kết quả mong đợi:** Bảng phòng chờ hiển thị đầy đủ cột Bộ phận, giao diện cực kỳ compact, hiện đại và không bị rối mắt hay vỡ layout.

## 2. Phạm vi

### In scope
- Shared: Mở rộng type `EmployeeListItem` để hỗ trợ các field list-safe: `pending_bo_phan?: string | null` và `has_pending_bo_phan?: boolean`.
- Backend: Cập nhật `listEmployees` trong `employeeService.ts` để gán thêm trường `pending_bo_phan` và `has_pending_bo_phan` bằng `Object.prototype.hasOwnProperty.call(pendingData, 'bo_phan')` ra list API một cách an toàn mà không expose toàn bộ pending payload.
- Frontend: Cập nhật file `frontend/src/components/EmployeeTable.tsx` để thêm cột Bộ phận (`bo_phan`) có điều kiện khi `state_phong_cho === true`.
- Frontend: Tái cấu trúc cấu hình cột (`columns`) trong `EmployeeTable.tsx`: co gọn width, bật `ellipsis: { showTitle: true }`.
- Frontend: Di chuyển các tag trạng thái và icon từ hàm `renderActions` trong `PendingRoomPage.tsx` và `EmployeeTable.tsx` vào cột "Họ và tên".
- Frontend: Áp dụng `<ConfigProvider theme={{ components: { Table: { fontSize: 13, cellPaddingBlock: 10, cellPaddingInline: 10 } } }}>` cho bảng.

### Out of scope
- Thay đổi cấu trúc cơ sở dữ liệu (Database schema) vì trường `bo_phan` đã tồn tại sẵn trong bảng `employees`.
- Thay đổi logic nghiệp vụ duyệt (Submit) hay phân quyền.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Kế thừa quyết định `UI Architecture` dùng Ant Design v6 + Theme Tokens. Tuyệt đối không dùng Tailwind CSS.
  - Kế thừa các utility checks như `isNewHire`, `hasPendingInfo`, `hasPendingSalary` từ `@/utils/employeeUtils`.
- **"Cấm kỵ" cần tránh:** 
  - Không thay đổi cấu trúc API hay payload gửi lên nếu không thực sự cần thiết (ở đây UI chỉ hiển thị dữ liệu sẵn có).
- **Ràng buộc kiến trúc liên quan:** Đảm bảo responsive trên mobile (AntD Grid `md` breakpoint).

## 4. Giả định và câu hỏi mở

### Giả định
- Trường `bo_phan` trong dữ liệu trả về từ API có thể chứa giá trị null hoặc rỗng, cần render dấu gạch ngang (`—`) thay thế.
- Cột "Bộ phận" chỉ hiển thị ở Phòng chờ để giải quyết nhu cầu đối soát dữ liệu nháp của HR, các màn hình danh sách nhân sự Live khác sẽ giữ nguyên cấu trúc cột hiện tại để tránh loãng thông tin.

### Câu hỏi mở
- **[FR-01, FR-10] Hiển thị Bộ phận Live hay Pending/Effective & Phân biệt Xóa Bộ phận:**
  - *Quyết định thiết kế:* Cột Bộ phận sẽ hiển thị giá trị **Effective Department** (`has_pending_bo_phan ? pending_bo_phan : bo_phan`).
  - *Phân biệt trạng thái:* Để phân biệt trường hợp "không có pending thay đổi Bộ phận" và "pending thay đổi đang Xóa Bộ phận về null/rỗng", Backend sẽ trả ra cờ `has_pending_bo_phan` bằng check `Object.prototype.hasOwnProperty.call(pendingData, 'bo_phan')`.
  - *UI Indicator:* Nếu `has_pending_bo_phan === true`, ta render kèm theo một tag nhỏ dạng nét đứt hoặc icon Tooltip: `Bộ phận chờ duyệt (Hiện tại: Live Value)` để HR dễ đối soát, không bị lầm tưởng dữ liệu đã lưu chính thức, ngay cả khi giá trị pending là null/rỗng (xóa bộ phận).
  - *Expose dữ liệu an toàn:* Do list API strip sạch `pending_changes` để bảo mật dữ liệu, ta sẽ expose thêm 2 field gọn nhẹ `pending_bo_phan?: string | null` và `has_pending_bo_phan?: boolean` trong type `EmployeeListItem` ở Backend Service và Shared Types để Frontend có thể lấy thông tin trực tiếp mà không cần đọc full payload pending nhạy cảm.
- **[FR-02] Nghĩa của PDF icon:**
  - *Quyết định thiết kế:* Đổi rõ ý nghĩa Tooltip của PDF icon là "Có tài liệu hồ sơ đính kèm" (vì cờ `pending_document_uuid` thuộc về personnel pending).

## 5. Acceptance Criteria

- [ ] Cột "Bộ phận" xuất hiện đúng vị trí đứng trước cột "Email" trên màn hình phòng chờ. Hiển thị effective value kèm chỉ thị/tooltip so sánh đối soát nếu `has_pending_bo_phan === true`.
- [ ] Các tag trạng thái (`NEW`, `ĐGTV`) và các icon cảnh báo (`PDF`, `Info`, `Dollar`) được chuyển từ cột "Hành động" sang hiển thị gọn gàng, thẩm mỹ bên cạnh "Họ và tên".
- [ ] Cột Họ và tên áp dụng `minWidth: 150`, `flex: 1`, bọc tag gọn gàng không bị tụt dòng hoặc co rúm khó đọc.
- [ ] Chiều rộng cột "Hành động" co gọn khoảng `110px`, hiển thị thẳng hàng chỉ gồm nút `Submit` (nếu có) và icon dropdown `More`.
- [ ] Bảng hiển thị compact đẹp mắt nhờ ConfigProvider (cỡ chữ 13px, padding thu gọn), các cột dài (Email, Bộ phận, NNT) tự động co gọn dùng `ellipsis` hiển thị dấu ba chấm và tooltip khi hover.
- [ ] Compact theme chỉ được áp dụng khi `state_phong_cho === true` để tránh làm ảnh hưởng đến danh sách nhân viên thông thường ngoài phòng chờ.
- [ ] Không có lỗi runtime hay warning CSS trên console.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `packages/shared/src/types/api.ts` | Sửa | Mở rộng type `EmployeeListItem` để thêm field `pending_bo_phan` và `has_pending_bo_phan` | 🟢 Thấp | Có |
| `backend/src/services/employeeService.ts` | Sửa | Expose giá trị `pending_bo_phan` và `has_pending_bo_phan` ra list API | 🟢 Thấp | Có |
| `frontend/src/components/EmployeeTable.tsx` | Sửa | Thêm cột Bộ phận, cấu hình lại độ rộng các cột, di chuyển tag trạng thái sang cột Họ tên, áp dụng ConfigProvider | 🟢 Thấp | Có |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Cập nhật hàm `renderActions` để loại bỏ các tag trạng thái và thu gọn cột Hành động | 🟢 Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Khuyến nghị review UI layout và responsive để đảm bảo hiển thị hoàn hảo trên các độ phân giải màn hình khác nhau).
- **Risk hotspots:** Đảm bảo khi di chuyển các tag trạng thái sang cột Họ tên, các hàm check điều kiện (`isNewHire`, `shouldShowInfoIcon`, v.v.) hoạt động chính xác dựa trên **Single Source of Truth** từ `employeeUtils.ts` để tránh duplicate indicator.
- **Review focus areas:** 
  - [FR-05] Đảm bảo ConfigProvider chỉ bao bọc bảng khi ở màn phòng chờ (`state_phong_cho === true`).
  - [FR-06] Indicator Predicates được khóa rõ ràng:
    - `NEW` = `isNewHire(record)`
    - `ĐGTV` = `record.is_probation_eval === true`
    - `PDF` = `!!record.pending_document_uuid`
    - `Info` = `shouldShowInfoIcon(record)`
    - `Dollar` = `shouldShowSalaryIcon(record)`

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1:** Triển khai Hạ tầng: Cập nhật Shared Types và Backend `listEmployees` để expose trường `pending_bo_phan` và `has_pending_bo_phan`.
  - **Phase 2:** Tái cấu trúc cột "Họ và tên" và cột "Hành động" (di chuyển các tag/icon trạng thái).
  - **Phase 3:** Thêm cột "Bộ phận" và tinh chỉnh độ rộng các cột khác, tích hợp ConfigProvider compact theme.
- **Thứ tự triển khai:** Shared Types -> Backend -> Frontend Components -> Chạy thử local -> Verify UI.

## 9. Test Strategy

- **Automated tests:**
  - Chạy `pnpm run typecheck` để verify static types.
  - Chạy `pnpm run build` để kiểm tra compile/bundling.
- **Manual verification:**
  - Truy cập màn hình phòng chờ `/pending-room` và trang live `/employees`.
  - Kiểm tra xem cột Bộ phận hiển thị đúng trước cột Email không.
  - Kiểm tra các tag NEW, ĐGTV, PDF icon, Info icon, Dollar icon hiển thị đẹp đẽ bên cạnh Họ và tên.
  - Kiểm tra xem cột Hành động có hiển thị thẳng hàng và gọn gàng không.
  - Kiểm tra tính năng hover tooltip trên các cột dùng `ellipsis`.
  - **Responsive Matrix**: Test trên Mobile (360px), Tablet (768px) và Desktop để kiểm tra layout.

## 10. Rollback Plan

- **Checklist Revert:**
  - `git checkout -- packages/shared/src/types/api.ts backend/src/services/employeeService.ts frontend/src/components/EmployeeTable.tsx frontend/src/pages/PendingRoom/PendingRoomPage.tsx`
  - Chạy `pnpm run typecheck` để verify.
  - Verify UI ngoài phòng chờ quay lại nguyên bản.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
