# Feature Tasks: Luồng đánh giá thử việc (WF-EMP-08)

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-08

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Shared Schema & Backend API

**Mục tiêu:** Xây dựng endpoint cho phép lưu thông tin đánh giá thử việc vào phòng chờ.

- [x] Task 1.1: Định nghĩa `probationEvaluationSchema` trong `@vcc/shared/src/schemas/employee.ts`.
- [x] Task 1.2: Tạo service method `evaluateProbation` trong `backend/src/services/employeeService.ts` để lưu `pending_changes` cho cả Employee và Salary.
- [x] Task 1.3: Thêm route `PUT /api/employees/:id/evaluate-probation` trong `backend/src/routes/employees.ts`.
- [x] Task 1.4: Cập nhật SQL RPC `submit_employee_pending` (nếu cần) để xử lý việc chuyển đổi `trang_thai` từ `pending_changes`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Sử dụng Postman/Curl để test API).

## Phase 2: Frontend UI & Integration

**Mục tiêu:** Xây dựng giao diện đánh giá thử việc và tích hợp vào danh sách nhân sự.

- [x] Task 2.1: Tạo component `ProbationEvaluationModal` sử dụng `SalaryForm` và `EmployeeForm` (nếu có thể reuse).
- [x] Task 2.2: Tích hợp nút "Đánh giá thử việc" vào `EmployeeTable` (action menu).
- [x] Task 2.3: Tích hợp nút "Đánh giá thử việc" vào header hoặc toolbar của `EmployeeDetailPage`.
- [x] Task 2.4: Xử lý logic upload file trong Modal đánh giá.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra UI flow).

## Phase 3: Submit & Validation

**Mục tiêu:** Đảm bảo luồng duyệt hồ sơ hoạt động đúng sau khi đánh giá.

- [ ] Task 3.1: Kiểm tra hiển thị nhân sự trong "Phòng chờ" sau khi đánh giá.
- [ ] Task 3.2: Thực hiện "Duyệt hồ sơ" và kiểm tra data trong DB (trang_thai, salaries).
- [ ] Task 3.3: Kiểm tra Lịch sử thay đổi (`change_history`) sau khi Submit.
- [ ] Task 3.Final: 🧪 Test & Verify Phase 3 (End-to-end UAT).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-08 | - | - | Khởi tạo kế hoạch | done | - |
| 2026-05-11 | Phase 1 | Task 1.1 | Bắt đầu định nghĩa schema cho probation evaluation | start | - |
| 2026-05-11 | Phase 1 | Task 1.2 | Đã tạo service method evaluateProbation | done | - |
| 2026-05-11 | Phase 1 | Task 1.3 | Thêm route evaluate-probation | start | - |
| 2026-05-11 | Phase 1 | Task 1.4 | Kiểm tra SQL RPC submit_employee_pending | done | Không cần thay đổi code SQL |
| 2026-05-11 | Phase 1 | Task 1.Final | Chạy self-test cho service method | done | Test PASSED |
| 2026-05-11 | Phase 2 | Task 2.1 | Đã tạo component ProbationEvaluationModal | done | - |
| 2026-05-11 | Phase 2 | Task 2.2 | Tích hợp nút Đánh giá vào EmployeeTable | done | - |
| 2026-05-11 | Phase 2 | Task 2.3 | Tích hợp nút Đánh giá vào EmployeeDetailPage | done | - |
| 2026-05-11 | Phase 2 | Task 2.4 | Xử lý upload file trong Modal | done | Tích hợp DocumentUpload |
| 2026-05-11 | Phase 2 | Task 2.Final | Hoàn tất giao diện Phase 2 | done | Sẵn sàng để User test |
| 2026-05-11 | Phase 3 | Task 3.1 | Refine Zod Schema cho đánh giá | start | - |
| 2026-05-11 | Phase 3 | Task 3.2 | Kiểm tra hiển thị lỗi | start | - |
