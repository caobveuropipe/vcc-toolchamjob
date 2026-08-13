# Feature Tasks: Bổ sung Ngày điều chỉnh vào Form Lương

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-06

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Shared & Backend Contract

**Mục tiêu:** Cập nhật các định nghĩa dùng chung để hỗ trợ trường `ngay_dieu_chinh_luong`.

- [x] Task 1.1: **Bỏ qua** việc cập nhật `SALARY_FIELDS` để bảo vệ các vòng lặp render số.
- [x] Task 1.2: Cập nhật `packages/shared/src/schemas/salary.ts` để thêm `ngay_dieu_chinh_luong` (z.coerce.date()) vào `salarySchema`.
- [x] Task 1.3: Chạy `pnpm run build:shared` để cập nhật build output cho FE/BE.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra Zod validation với trường ngày mới trong salary payload).

## Phase 2: Database Layer

**Mục tiêu:** Cập nhật logic xử lý Duyệt hồ sơ để áp dụng ngày điều chỉnh vào bảng nhân sự.

- [x] Task 2.1: Tạo file migration mới cập nhật SQL Function `submit_employee_pending`.
- [x] Task 2.2: Bổ sung logic **bóc tách (pop)** `ngay_dieu_chinh_luong` khỏi payload lương trước khi loop update `salaries`.
- [x] Task 2.3: Thực hiện `UPDATE employees SET ngay_dieu_chinh_luong = ...` bằng giá trị đã bóc tách.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra lệnh Duyệt: đảm bảo không lỗi ép kiểu Numeric và ngày được cập nhật đúng bảng).

## Phase 3: Frontend UI

**Mục tiêu:** Hiển thị trường nhập liệu trên giao diện và hoàn thiện luồng người dùng.

- [x] Task 3.1: Cập nhật `SALARY_LABELS` trong `frontend/src/pages/Salaries/SalaryEditModal.tsx`.
- [x] Task 3.2: Thêm `DatePicker` cho `ngay_dieu_chinh_luong` vào vị trí cạnh phần Upload minh chứng (ngoài loop render số).
- [x] Task 3.3: Kiểm tra luồng lưu nháp (Save to pending) đảm bảo ngày được gửi lên đúng định dạng ISO và render số không bị hỏng.
- [x] Task 3.4: Hiển thị `ngay_dieu_chinh_luong` trong trang chi tiết nhân sự (EmployeeDetailPage).
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (End-to-end: Nhập ngày -> Lưu nháp -> Duyệt -> Kiểm tra kết quả cuối cùng).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-05-06 10:00] | [Phase 0] | [Plan] | Khởi tạo kế hoạch | done | |
| [2026-05-06 10:07] | [Phase 1] | [Task 1.2] | Bắt đầu cập nhật shared schema | start | |
| [2026-05-06 10:08] | [Phase 1] | [Task 1.Final] | Hoàn thành Phase 1 (Build & Test Schema OK) | done | |
| [2026-05-06 10:12] | [Phase 3] | [Task 3.2] | Triển khai UI DatePicker (tăng tốc theo yêu cầu User) | done | |
| [2026-05-06 10:13] | [Phase 2] | [Task 2.1] | Bắt đầu cập nhật Database Layer | start | |
| [2026-05-06 10:14] | [Phase 2] | [Task 2.Final] | Tạo migration 022 thành công (SQL isolation + date support) | done | |
| [2026-05-06 10:22] | [Phase 3] | [Task 3.4] | Re-apply UI display (Fix syntax error & restore labels) | done | |
| [2026-05-06 10:24] | [Phase 3] | [Task 3.4] | Rút gọn nhãn và xử lý hiển thị trùng lặp | done | |
| [2026-05-06 10:25] | [Phase 3] | [Task 3.4] | Đổi lại nhãn thành "Ngày điều chỉnh lương" theo ảnh mẫu | done | |
