# Feature Plan: Bổ sung Nhuận bút cơ chế và đổi tên HS Chấm/Job/Nhuận

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: ✅ Đã duyệt bởi User
> **Feature slug**: update-salary-modal-fields
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-16

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Giao diện điều chỉnh lương và đánh giá thử việc hiện chưa hiển thị ô nhập "Nhuận bút cơ chế" (`nhuan_but_cc`) trong vùng "Bộ Cơ chế — Base". Ngoài ra, tên nhãn "HS Chấm/Job/Nhuận" chưa thống nhất và cần đổi thành "HS chấm job". Trang chi tiết nhân sự cũng đang thiếu dòng hiển thị Nhuận bút (CC) trong bảng cơ cấu lương nội bộ.
- **Vấn đề cần giải quyết:** 
  1. Người dùng không thể điều chỉnh hoặc xem trường `nhuan_but_cc` trực tiếp trong vùng "Bộ Cơ chế — Base" của modal điều chỉnh lương và modal đánh giá thử việc.
  2. Bảng breakdown cơ cấu lương ở trang chi tiết nhân viên không hiển thị dòng "Nhuận bút (CC)", dẫn đến tổng Target dự kiến trên UI bị thiếu hụt so với database.
  3. Tên hiển thị của trường hiệu suất "HS Chấm/Job/Nhuận" cần đổi sang "HS chấm job" để đồng bộ và dễ hiểu hơn.
  4. Header file Excel xuất snapshot cần đồng bộ tên cột mới và đảm bảo khả năng tương thích ngược mà không bị lỗi ghi đè `null` khi map nhiều alias.
- **Mục tiêu:**
  1. Thêm trường `nhuan_but_cc` vào vùng hiển thị "Bộ Cơ chế — Base" trong modal sửa lương ([SalaryEditModal.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Salaries/SalaryEditModal.tsx)) và modal đánh giá thử việc ([ProbationEvaluationModal.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/ProbationEvaluationModal.tsx)).
  2. Bổ sung dòng hiển thị "Nhuận bút (CC)" vào bảng phân tích cơ cấu lương chi tiết của trang chi tiết nhân sự ([EmployeeDetailPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeDetailPage.tsx)) và cộng dồn chính xác vào Target/Tổng thu nhập dự kiến.
  3. Thay đổi nhãn hiển thị của `thuong_hieu_suat_cham_job_nhuan` thành "HS chấm job" trên toàn bộ giao diện và các thông báo cảnh báo liên quan.
  4. Đổi tên cột trong file Excel xuất snapshot từ "Thưởng hiệu suất/chấm job/nhuận CC" thành "Thưởng hiệu suất chấm job CC" nhưng vẫn hỗ trợ import file cũ thông qua alias mapping an toàn.
- **Kết quả mong đợi:** 
  - Cả hai modal đều hiển thị đầy đủ 4 ô trong vùng "Bộ Cơ chế — Base": Target (CC), Lương CB, HS chấm job, Nhuận bút (CC).
  - Trang chi tiết nhân sự hiển thị dòng "4. Nhuận bút (CC)" và tính tổng thu nhập chính xác.
  - Tên nhãn "HS Chấm/Job/Nhuận" được đổi thành "HS chấm job" ở tất cả các vị trí hiển thị liên quan.
  - File Excel xuất ra hiển thị header "Thưởng hiệu suất chấm job CC" và restore thành công cho cả file cũ và file mới (không bị mất giá trị khi một trong các alias bị khuyết).

## 2. Phạm vi

### In scope
- Cập nhật `SALARY_LABELS` trong `frontend/src/pages/Salaries/SalaryEditModal.tsx`.
- Bổ sung `nhuan_but_cc` vào danh sách trường hiển thị của "Bộ Cơ chế — Base" trong `SalaryEditModal.tsx` và `ProbationEvaluationModal.tsx`.
- Bổ sung dòng hiển thị `nhuan_but_cc` ("4. Nhuận bút (CC)") vào bảng cơ cấu lương chi tiết và cập nhật công thức tính tổng Target/Tổng thu nhập trong `frontend/src/pages/Employees/EmployeeDetailPage.tsx`.
- Cập nhật nhãn hiển thị tương ứng trong `frontend/src/pages/Employees/EmployeeDetailPage.tsx` và `frontend/src/pages/Employees/EmployeeListPage.tsx`.
- Cập nhật thông báo cảnh báo tự động gán lương hiệu suất chưa phân loại trong `SalaryEditModal.tsx` để khớp với tên nhãn mới.
- Thay đổi tên cột trong file Excel xuất snapshot ở `backend/src/routes/snapshots.ts` và `backend/src/services/snapshotService.ts` đồng thời giữ tương thích ngược với header cũ trong `RESTORE_COLUMN_MAPPING`.
- Sửa logic loop mapping trong [snapshotService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/snapshotService.ts) để tránh việc alias vắng mặt ghi đè giá trị `null` lên trường dữ liệu đã map thành công trước đó.

### Out of scope
- Thay đổi cấu trúc cơ sở dữ liệu hoặc logic lưu trữ/kiểm toán (trường `nhuan_but_cc` và `thuong_hieu_suat_cham_job_nhuan` đã tồn tại trong DB).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên logic tính toán tự động gán phần lương hiệu suất chưa phân loại (`unallocatedWarning`) vào ô hiệu suất cơ chế.
- **"Cấm kỵ" cần tránh:** Không sửa đổi trực tiếp các file schema hoặc database migration vì đây chỉ là thay đổi giao diện (FE) và cấu hình export file Excel.

## 4. Giả định và câu hỏi mở

### Giả định
- Nhãn của `nhuan_but_cc` được giữ nguyên là "Nhuận bút (CC)" theo đúng thiết kế hiện tại của hệ thống.
- Các nhãn dạng ngắn như "Hiệu suất" trong `EmployeeForm.tsx` và `DocumentUpload.tsx` được giữ nguyên vì không gây nhầm lẫn trong ngữ cảnh form tối giản.

### Câu hỏi mở
- Không còn câu hỏi mở nào cần giải quyết.

## 5. Acceptance Criteria

- [ ] Vùng "Bộ Cơ chế — Base" trong `SalaryEditModal.tsx` hiển thị thêm ô nhập cho `nhuan_but_cc`.
- [ ] Vùng "Bộ Cơ chế — Base" trong `ProbationEvaluationModal.tsx` hiển thị thêm ô nhập cho `nhuan_but_cc`.
- [ ] Trang chi tiết nhân sự `EmployeeDetailPage.tsx` hiển thị dòng "4. Nhuận bút (CC)" với giá trị chính xác và tính tổng Target/Tổng thu nhập bao gồm cả nhuận bút.
- [ ] Nhãn hiển thị của `thuong_hieu_suat_cham_job_nhuan` đổi từ "HS Chấm/Job/Nhuận" thành "HS chấm job" trong `SalaryEditModal.tsx` (nhãn và alert warning), `ProbationEvaluationModal.tsx`, `EmployeeDetailPage.tsx`, và `EmployeeListPage.tsx`.
- [ ] Tên cột trong file Excel snapshot đổi thành "Thưởng hiệu suất chấm job CC" cho file mới xuất ra, đồng thời file Excel cũ vẫn import bình thường (không bị lỗi mất giá trị do overwrite null).
- [ ] Các modal lưu dữ liệu thành công mà không gây lỗi format hay validation.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [SalaryEditModal.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Salaries/SalaryEditModal.tsx) | Sửa | Đổi nhãn `thuong_hieu_suat_cham_job_nhuan` và bổ sung `nhuan_but_cc` vào UI render | 🟢 Thấp | Chưa |
| [EmployeeDetailPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeDetailPage.tsx) | Sửa | Đổi nhãn hiển thị "HS Chấm/Job/Nhuận" thành "HS chấm job", bổ sung dòng hiển thị `nhuan_but_cc` và cập nhật công thức tính tổng | 🟢 Thấp | Chưa |
| [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx) | Sửa | Đổi nhãn `"Thưởng hiệu suất chấm Job nhuận"` thành `"Thưởng hiệu suất chấm job"` | 🟢 Thấp | Chưa |
| [ProbationEvaluationModal.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/ProbationEvaluationModal.tsx) | Sửa | Bổ sung `nhuan_but_cc` vào UI render | 🟢 Thấp | Chưa |
| [snapshots.ts](file:///d:/ToolNhanSuVcc/backend/src/routes/snapshots.ts) | Sửa | Đổi tên cột xuất Excel | 🟢 Thấp | Chưa |
| [snapshotService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/snapshotService.ts) | Sửa | Đổi mapping tên cột xuất/nhập Excel, thêm alias hỗ trợ header cũ và điều chỉnh logic loop mapping tránh overwrite null | 🟢 Thấp | Chưa |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Logic parse restore Excel khi chứa nhiều alias trỏ về cùng một trường dữ liệu.
- **Review focus areas:** Đảm bảo trường `nhuan_but_cc` hiển thị và bind dữ liệu form đúng cách ở cả hai modal, đồng thời logic parse Excel không làm mất dữ liệu của bất kỳ cột nào.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai một phase duy nhất tập trung vào cập nhật frontend và backend Excel mapping.
- **Thứ tự triển khai:**
  1. Cập nhật nhãn trong `SalaryEditModal.tsx`, `EmployeeDetailPage.tsx`, và `EmployeeListPage.tsx`.
  2. Bổ sung trường `nhuan_but_cc` vào component render của `SalaryEditModal.tsx` và `ProbationEvaluationModal.tsx`.
  3. Bổ sung dòng hiển thị `nhuan_but_cc` và cập nhật công thức tính tổng trong `EmployeeDetailPage.tsx`.
  4. Cập nhật tên cột Excel và sửa logic mapping loop trong `backend/src/services/snapshotService.ts`.
  5. Viết automated tests kiểm thử cả 2 định dạng file import mới và cũ.
  6. Kiểm thử tích hợp xuất/nhập Excel và lưu form.

## 9. Test Strategy

- **Automated tests:**
  - Bổ sung unit/integration test trong `backend/src/__tests__/integration/snapshots.test.ts` để kiểm tra khả năng parse và restore thành công dữ liệu cho cả header mới "Thưởng hiệu suất chấm job CC" và header cũ "Thưởng hiệu suất/chấm job/nhuận CC" (chạy 2 test case độc lập và cùng assert giữ đúng giá trị).
- **Manual verification:**
  - Mở modal điều chỉnh lương và modal đánh giá thử việc, xác nhận ô "Nhuận bút (CC)" hiển thị dưới "Bộ Cơ chế — Base".
  - Xác nhận nhãn đổi từ "HS Chấm/Job/Nhuận" thành "HS chấm job".
  - Mở trang chi tiết nhân sự và kiểm tra xem bảng breakdown đã hiển thị dòng "4. Nhuận bút (CC)" và tính tổng đúng chưa.
  - Chốt thử một Snapshot hoặc kiểm tra tính năng xuất file Excel xem tên cột đã đổi thành "Thưởng hiệu suất chấm job CC" chưa.
  - Kiểm tra nhập liệu và lưu thành công.

## 10. Rollback Plan

- Sử dụng Git rollback về commit trước đó nếu xảy ra lỗi xung đột giao diện nghiêm trọng.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
