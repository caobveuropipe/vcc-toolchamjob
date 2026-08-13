# Feature Tasks: Cập nhật hiển thị NNTTV và Tùy chọn xuất Excel nhân sự nghỉ việc

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: [FEATURE_PLAN.md](file:///d:/ToolNhanSuVcc/.agent/active/update-nnt-display-and-export-options/FEATURE_PLAN.md)
> **Ngày tạo**: 2026-06-23

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Cấu trúc lại bảng nhân sự (EmployeeTable)

**Mục tiêu:** Thay thế cột Email bằng cột Người nghiệm thu thử việc trên cả 2 giao diện.

- [x] Task 1.1: Sửa [EmployeeTable.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/EmployeeTable.tsx) dòng cấu hình cột Email để chuyển thành cột Người nghiệm thu thử việc.
- [x] Task 1.2: Cấu hình hiển thị cột Người nghiệm thu thử việc ở cả 2 chế độ (`state_phong_cho` là true và false), đảm bảo data được map đúng trường `nguoi_nghiem_thu_thu_viec`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Xác nhận hiển thị cột NNTTV thay cho Email ở cả Danh sách nhân sự và Phòng chờ).

## Phase 2: Thêm tùy chọn khi xuất Excel Full

**Mục tiêu:** Cho phép người dùng lựa chọn bao gồm cả nhân sự đã nghỉ việc hay không trước khi export, đồng thời đảm bảo an toàn bảo mật.

- [x] Task 2.1: Sửa [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx) hàm `handleExportFull` để gọi một controlled `<Modal>` hoặc `modal.confirm` với custom footer/extra button của Ant Design để có 3 outcome tách biệt (Có, Không, Hủy).
- [x] Task 2.2: Cập nhật logic parse params `trang_thai` dựa trên kết quả lựa chọn (Có: `thu_viec,chinh_thuc,nghi_sinh,nghi_viec` hoặc không truyền; Không: `thu_viec,chinh_thuc,nghi_sinh`).
- [x] Task 2.3: Đảm bảo khi nhấn Cancel / Close / bấm ngoài Modal, quá trình export sẽ bị hủy hoàn toàn (abort) và không phát sinh bất kỳ network request nào.
- [x] Task 2.4: Refactor header export actions: Đảm bảo `setPageInfo` được nạp lại closure mới nhất khi `searchParams` thay đổi (đưa `menuItems`, `searchParams` vào dependency của `useEffect` hoặc sử dụng React Ref).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm chứng các trường hợp: (1) Thay đổi bộ lọc search/filter trên bảng rồi bấm xuất, xác nhận URL gọi API sử dụng query params mới nhất; (2) Hủy modal không gửi API; (3) Lựa chọn Có/Không gửi đúng query params; (4) Rate limit, audit log, watermark và masking lương hoạt động đúng).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-23 15:18 | Phase 1 | Task 1.1, 1.2 | Bắt đầu sửa EmployeeTable.tsx để chuyển cột Email thành cột NNTTV | start | |
| 2026-06-23 15:20 | Phase 1 | Task 1.1, 1.2 | Hoàn thành thay đổi cột Email thành cột NNTTV và điều chỉnh scroll.x | done | Chạy typecheck thành công |
| 2026-06-23 15:21 | Phase 1 | Task 1.Final | Bắt đầu self-test Phase 1 | start | |
| 2026-06-23 15:22 | Phase 1 | Task 1.Final | User xác nhận OK, chốt Phase 1 | done | |
| 2026-06-23 15:23 | Phase 2 | Task 2.1-2.4 | Bắt đầu triển khai Phase 2: custom modal export full, logic params, refactor useEffect | start | |
| 2026-06-23 15:27 | Phase 2 | Task 2.1-2.4 | Hoàn thành triển khai modal xuất excel và refactor stale closures | done | Chạy typecheck thành công |
| 2026-06-23 15:28 | Phase 2 | Task 2.Final | Bắt đầu self-test Phase 2 | start | |
| 2026-06-23 15:30 | Phase 2 | Task 2.Final | Chạy toàn bộ integration tests backend thành công | done | 46/46 test cases passed |
| 2026-06-23 15:35 | Phase 2 | Task 2.Final | Cập nhật cột NNTTV từ sort thành filter (bộ lọc) | done | Hỗ trợ cả backend & frontend |
