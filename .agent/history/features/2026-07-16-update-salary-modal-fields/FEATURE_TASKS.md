# Feature Tasks: Bổ sung Nhuận bút cơ chế và đổi tên HS Chấm/Job/Nhuận

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-16

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Cập nhật giao diện Frontend & Cấu hình Excel

**Mục tiêu:** Bổ sung ô hiển thị `nhuan_but_cc`, đổi tên nhãn "HS Chấm/Job/Nhuận" thành "HS chấm job" trên UI, hiển thị Nhuận bút cơ chế ở bảng phân tích lương chi tiết, cập nhật cấu hình mapping Excel Snapshot tương thích ngược, và bổ sung automated test.

- [x] Task 1.1: Cập nhật `SALARY_LABELS` trong `frontend/src/pages/Salaries/SalaryEditModal.tsx` để đổi nhãn `thuong_hieu_suat_cham_job_nhuan` thành "HS chấm job".
- [x] Task 1.2: Bổ sung `nhuan_but_cc` vào mảng các trường render của "Bộ Cơ chế — Base" trong `SalaryEditModal.tsx`.
- [x] Task 1.3: Cập nhật nội dung alert warning `unallocatedWarning` trong `SalaryEditModal.tsx` để hiển thị nhãn mới "HS chấm job".
- [x] Task 1.4: Cập nhật nhãn hiển thị trong bảng chi tiết lương của `frontend/src/pages/Employees/EmployeeDetailPage.tsx` (từ `"3. HS Chấm/Job/Nhuận"` thành `"3. HS chấm job"`).
- [x] Task 1.5: Bổ sung dòng hiển thị `"4. Nhuận bút (CC)"` ứng với trường `nhuan_but_cc` vào bảng breakdown lương chi tiết (`detailedSalaryRows`) và cập nhật công thức tính tổng Target/Tổng thu nhập dự kiến trong `EmployeeDetailPage.tsx`.
- [x] Task 1.6: Cập nhật nhãn hiển thị `"Thưởng hiệu suất chấm Job nhuận"` thành `"Thưởng hiệu suất chấm job"` trong `frontend/src/pages/Employees/EmployeeListPage.tsx`.
- [x] Task 1.7: Cập nhật `ProbationEvaluationModal.tsx` để bổ sung ô hiển thị `nhuan_but_cc` trong vùng "Bộ Cơ chế — Base".
- [x] Task 1.8: Cập nhật `RESTORE_COLUMN_MAPPING` trong `backend/src/services/snapshotService.ts` để thêm alias `"Thưởng hiệu suất chấm job CC"` trỏ tới `thuong_hieu_suat_cham_job_nhuan`. Đồng thời, sửa đổi logic vòng lặp map cột tại `snapshotService.ts` để chỉ gán giá trị `null` nếu trường dữ liệu đó chưa được gán giá trị (tức `sanitized[dbField] === undefined`), tránh việc alias vắng mặt ghi đè `null` lên giá trị hợp lệ đã map trước đó.
- [x] Task 1.9: Thay đổi tên cột xuất file Excel tại `backend/src/routes/snapshots.ts` và `backend/src/services/snapshotService.ts` thành `"Thưởng hiệu suất chấm job CC"`.
- [x] Task 1.10: Bổ sung 2 automated test cases độc lập trong `backend/src/__tests__/integration/snapshots.test.ts` (một case cho file chứa cột header cũ và một case cho file chứa cột header mới) và cùng assert giá trị trường `thuong_hieu_suat_cham_job_nhuan` được import chính xác.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Chạy `pnpm --filter backend test:integration` để xác nhận các test suite đi qua thành công và không bị lỗi ghi đè null khi import/restore snapshot.
  - Mở trang chi tiết nhân sự, kiểm tra bảng phân tích lương cơ chế xem dòng "4. Nhuận bút (CC)" đã xuất hiện chưa và tổng cộng dồn Target/Tổng thu nhập có chính xác không.
  - Mở modal điều chỉnh lương và kiểm tra vị trí/hiển thị của các ô trong vùng "Bộ Cơ chế — Base".
  - Kiểm tra xem nhãn và thông báo cảnh báo đã đổi thành "HS chấm job" hay chưa ở cả trang chi tiết nhân sự, danh sách nhân sự và các modal.
  - Test xuất/nhập Excel Snapshot thủ công để đảm bảo không lỗi mapping tên cột mới và lưu thử dữ liệu thành công.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-16 | Phase 1 | - | Khởi tạo checklist | ⏳ pending | |
| 2026-07-16 | Phase 1 | Task 1.1 | Bắt đầu cập nhật nhãn trong SalaryEditModal.tsx | 🔄 start | |
| 2026-07-16 | Phase 1 | Task 1.Final | Self-test và được User xác nhận hoàn tất phase | ✅ done | |
