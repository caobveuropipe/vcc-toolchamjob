## Round 1 - 2026-07-16

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/services/snapshotService.ts:500-530`, `frontend/src/pages/Employees/EmployeeListPage.tsx:240-270`, `frontend/src/components/EmployeeForm.tsx:580-600`, `frontend/src/components/DocumentUpload.tsx:15-45`, `backend/src/__tests__/integration/snapshots.test.ts`

### EFR Đã Chấp Nhận -> [EFR-01]: Chưa khóa contract import/restore khi đổi header Excel snapshot
- **Sửa:** Cập nhật `RESTORE_COLUMN_MAPPING` tại `snapshotService.ts` để hỗ trợ song song (alias) cả header cũ `"Thưởng hiệu suất/chấm job/nhuận CC"` và header mới `"Thưởng hiệu suất chấm job CC"`. Cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` để bổ sung công việc này.

### EFR Đã Chấp Nhận -> [EFR-02]: Scope "toàn bộ giao diện" chưa bao phủ hết các surface đang hiển thị field này
- **Sửa:** Cập nhật scope trong `FEATURE_PLAN.md` và bổ sung các files/tasks cho việc sửa label tại `frontend/src/pages/Employees/EmployeeListPage.tsx` (từ `"Thưởng hiệu suất chấm Job nhuận"` thành `"Thưởng hiệu suất chấm job"` hoặc `"HS chấm job"` cho đồng bộ). Các label `"Hiệu suất"` ở `EmployeeForm.tsx` và `DocumentUpload.tsx` được làm rõ là giữ nguyên do bản chất thiết kế form đơn giản của chúng.

### EFR Đã Chấp Nhận -> [EFR-03]: Thiếu automated test cho thay đổi contract Excel có rủi ro dữ liệu
- **Sửa:** Bổ sung task viết automated test kiểm tra import/restore snapshot hỗ trợ song song cả 2 định dạng cột cũ và mới.

### Vùng đã kiểm khi không có SFR -> [file/path:line] [đã kiểm gì]
- `backend/src/services/snapshotService.ts:500-530`: Kiểm tra mapping cột Excel.
- `frontend/src/pages/Employees/EmployeeListPage.tsx:240-270`: Lọc tìm label hiển thị của trường.

---

## Round 2 - 2026-07-16

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `backend/src/services/snapshotService.ts:560-600`

### EFR Đã Chấp Nhận -> [EFR-01]: Alias header cũ/mới trong `RESTORE_COLUMN_MAPPING` sẽ tự ghi đè `null` cho cùng một `dbField`
- **Sửa:** Sửa logic mapping loop trong `snapshotService.ts` để tránh việc alias vắng mặt ghi đè giá trị non-null đã được map trước đó. Cụ thể, chỉ gán `null` nếu field chưa tồn tại trong object `sanitized` (hoặc `sanitized[dbField] === undefined`). Cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` tương ứng.
