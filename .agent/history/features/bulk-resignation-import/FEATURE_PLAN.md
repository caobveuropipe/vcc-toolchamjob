# Feature Plan: Cập nhật trạng thái nghỉ việc hàng loạt bằng file Excel

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi nhằm bảo đảm an toàn phân quyền và cơ chế khóa kỳ chốt lương.
> **Feature slug**: `bulk-resignation-import`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-17

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, khi nhân viên nghỉ việc, người dùng (EA/SA) phải thực hiện cập nhật thủ công từng người qua giao diện chi tiết nhân sự. Khi có đợt nghỉ việc lớn (cuối tháng/cuối năm), việc này tốn nhiều thời gian và dễ nhầm lẫn.
- **Vấn đề cần giải quyết:** Thiếu công cụ cho phép cập nhật trạng thái nghỉ việc cho nhiều nhân sự cùng lúc qua file Excel.
- **Mục tiêu:** Cung cấp tính năng upload file Excel chứa danh sách mã nhân sự và ngày nghỉ việc để chuyển trạng thái hàng loạt sang `nghi_viec` trên dữ liệu live.
- **Kết quả mong đợi:** 
  - Người dùng có thể tải file Excel mẫu.
  - Người dùng có thể upload file Excel chứa danh sách cần xử lý.
  - Hệ thống validate toàn bộ dữ liệu (tối đa 200 dòng): nếu có lỗi ở bất kỳ bản ghi nào thì chặn toàn bộ (All-or-Nothing) và chỉ ra rõ lỗi. Nếu hợp lệ 100%, hệ thống cho phép bấm "Xác nhận" và thực hiện cập nhật trực tiếp vào dữ liệu live, ghi nhận đầy đủ lịch sử thay đổi (Change History) và nhật ký hoạt động (Audit Log).
  - <!-- Sửa theo EFR-01: Ghi nhận ngoại lệ phê duyệt trực tiếp live --> **Ngoại lệ Nghiệp vụ:** Việc cập nhật trực tiếp vào dữ liệu live (bỏ qua Phòng chờ) là ngoại lệ đã được User xác nhận và phê duyệt rõ ràng. Để kiểm soát rủi ro, hệ thống sẽ thực hiện kiểm tra khóa kỳ chặt chẽ (Anti-drift lock) ở mức DB Transaction và ngăn chặn mọi sửa đổi đối với các bản ghi đã ở trạng thái terminal (`nghi_viec`).

---

## 2. Phạm vi

### In scope
- API backend `/api/employees/bulk-resign` (POST để validate dữ liệu, POST để confirm thực thi) với các ràng buộc bảo mật:
  - <!-- Sửa theo EFR-05: Định nghĩa API contract rõ ràng và bảo vệ route --> Định dạng payload gửi lên backend: JSON dạng `{ records: Array<{ ma_nhan_su: string, ngay_nghi_viec: string, reason?: string }> }` đã được frontend parse từ Excel để đảm bảo tính gọn nhẹ và kiểm soát chặt chẽ.
  - Cấu hình Route Hardening: Giới hạn kích thước payload (max 100KB), áp dụng `sensitiveRateLimiter`, sắp xếp thứ tự route `/api/employees/bulk-resign` nằm TRƯỚC route động `/api/employees/:id` để tránh xung đột đường dẫn.
- Validation (All-or-Nothing):
  - Kiểm tra số lượng dòng (`<= 200` dòng). <!-- Sửa theo EFR-04: Thêm kiểm tra trùng lặp và EFR-05: validate date format -->
  - Kiểm tra trùng lặp `ma_nhan_su` ngay trong file upload (nếu trùng sẽ báo lỗi chỉ rõ các dòng bị lặp).
  - Validate định dạng ngày nghỉ việc (hỗ trợ `DD/MM/YYYY`, `YYYY-MM-DD`, Excel serial dates) và normalize về múi giờ UTC+7 trước khi kiểm tra logic.
  - Kiểm tra sự tồn tại của nhân sự (`ma_nhan_su`).
  - Kiểm tra phân quyền khối của người dùng hiện tại (EA chỉ được xử lý nhân sự thuộc khối mình được gán).
  - Kiểm tra trạng thái hiện tại (phải khác `nghi_viec`).
  - Kiểm tra khóa kỳ chốt lương của khối nhân sự đó tại tháng của ngày nghỉ việc (`is_period_locked`).
- Giao diện UI:
  - Nút "Import nghỉ việc" trên trang [EmployeeListPage](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx) cạnh nút "Thêm nhân sự".
  - Modal upload file Excel, hiển thị lỗi chi tiết theo từng dòng (nếu có), hoặc nút "Xác nhận" kèm tóm tắt nếu hợp lệ.
  - Cơ chế tải file Excel mẫu.

### Out of scope
- Cập nhật các trạng thái khác ngoài `nghi_viec` (như `nghi_sinh`, `thu_viec`, `chinh_thuc`).
- Đưa qua phòng chờ (theo yêu cầu của User, tính năng này ghi trực tiếp dữ liệu live).

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - **Hybrid Security**: API middleware check quyền đầy đủ. EA chỉ được thao tác nhân sự trong khối được gán.
  - **Anti-drift Guard Pattern (DB-side Lock Check)**: Sử dụng DB helper `is_period_locked` để chặn cập nhật nếu kỳ lương của ngày nghỉ việc tương ứng đã bị khóa.
  - **Traceability**: Chuyển trạng thái phải ghi nhận vào `change_history` và `audit_log` đầy đủ.
- **"Cấm kỵ" cần tránh:**
  - Không được bỏ qua check quyền khối (EA check block).
  - Không được bỏ qua `is_period_locked`.
  - Không cho phép cập nhật nhân sự đã nghỉ việc trước đó.
- <!-- Sửa theo EFR-02: Đồng bộ kiến trúc Multi-table write qua RPC --> **Ràng buộc Kiến trúc Mới:** Toàn bộ quá trình validate, ghi đè trạng thái live của employee, ghi nhận `change_history` và `audit_log` phải được đóng gói bên trong một PostgreSQL RPC (`SECURITY DEFINER`) duy nhất để đảm bảo tính nguyên tử (Atomicity) ở mức Database, tránh việc phân mảnh logic và partial write ở API layer.

---

## 4. Giả định và câu hỏi mở

### Giả định
- Định dạng ngày nghỉ việc trong file Excel hỗ trợ cả dạng Text (`DD/MM/YYYY` hoặc `YYYY-MM-DD`) và định dạng ngày (Date) của Excel.

### Câu hỏi mở
- *Hiện tại không còn câu hỏi mở nào bị blocking.*

---

## 5. Acceptance Criteria

- [ ] Cho phép tải file mẫu Excel chỉ gồm các cột: `Mã nhân sự` (ma_nhan_su), `Ngày nghỉ việc` (ngay_nghi_viec), `Lý do nghỉ việc` (reason - tùy chọn).
- [ ] Giới hạn file tải lên tối đa 200 bản ghi (`<= 200` dòng).
- [ ] Thực hiện validate "All-or-Nothing" ở cả 2 bước Preview và Confirm:
  - Nếu bất kỳ dòng nào lỗi (mã nhân sự không tồn tại, sai định dạng ngày, sai khối quản lý của EA, kỳ chốt lương đã bị khóa, nhân sự đã nghỉ việc, hoặc mã nhân sự trùng lặp trong file), hệ thống hiển thị danh sách lỗi chi tiết theo dòng và khóa nút "Xác nhận".
- [ ] <!-- Sửa theo EFR-03: Ràng buộc revalidate tại thời điểm commit --> Bước Confirm (`POST /api/employees/bulk-resign/confirm`) phải thực hiện lại 100% các validation check trong cùng DB Transaction/RPC ngay trước khi ghi dữ liệu nhằm triệt tiêu hoàn toàn race condition (ví dụ: dữ liệu bị đổi giữa lúc preview và lúc bấm confirm).
- [ ] Khi bấm "Xác nhận":
  - Cập nhật trực tiếp dữ liệu live: set `trang_thai = 'nghi_viec'`, `ngay_nghi_viec = [ngày trong file]`.
  - Ghi nhận `change_history` cho từng nhân sự (ghi nhận sự thay đổi trạng thái và ngày nghỉ việc).
  - Ghi nhận `audit_log` với hành động `update` và type `employee_resigned`.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/routes/employees.ts` | Sửa | Thêm route API `/bulk-resign` (POST để validate, POST để confirm) trước route `/:id` | 🟡 | Có |
| `backend/src/services/employeeService.ts` | Sửa | Gọi RPC `bulk_resign_employees` thực thi bulk update trong DB Transaction | 🟡 | Có |
| `database/migrations/[NEW]_bulk_resign_employees.sql` | Tạo mới | <!-- Sửa theo EFR-02: DB Migration cho RPC atomic write --> Viết hàm RPC PostgreSQL `bulk_resign_employees` kiểm tra điều kiện, ghi đè DB live, chèn logs và tự động rollback nếu bất kỳ nhân sự nào lỗi | 🔴 Bảo mật & Rollback | Có |
| `frontend/src/pages/Employees/EmployeeListPage.tsx` | Sửa | Thêm nút "Import nghỉ việc" ở góc phải | 🟢 | Chưa |
| `frontend/src/components/BulkResignModal.tsx` | Tạo mới | Modal xử lý Upload file Excel (parse client-side), hiển thị kết quả validate và nút Xác nhận | 🟢 | Chưa |
| `packages/shared/src/schemas/employee.ts` | Sửa | Định nghĩa Zod Schema cho payload bulk-resign | 🟢 | Có |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes, bắt buộc review trước khi triển khai.
- **Risk hotspots:**
  - **Transaction integrity**: Đóng gói toàn bộ logic ghi DB vào RPC `bulk_resign_employees` để tránh partial write.
  - **Access control**: Đảm bảo RPC check quyền của EA dựa trên email người thực hiện (`p_actor_email`) truyền từ backend và truy vấn bảng phân quyền `user_permissions` / `superadmins` trong database. Đồng thời, thu hồi quyền EXECUTE của `PUBLIC`, `anon`, `authenticated` và chỉ cấp quyền cho `service_role` để khớp với kiến trúc bảo mật hiện tại.

---

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1: Database Migration & Backend API**: Tạo migration SQL chứa hàm RPC `bulk_resign_employees`. Viết route API `/bulk-resign` nhận JSON payload, thực hiện validate trước (POST) và xác nhận ghi đè (POST /confirm).
  - **Phase 2: Frontend Integration**: Thiết kế Component `BulkResignModal`, tích hợp nút bấm lên `EmployeeListPage`, xử lý parse file Excel ở client bằng `xlsx` rồi gửi JSON lên backend, hiển thị kết quả validate và xác nhận cập nhật.
  - **Phase 3: Testing & Verification**: Viết integration tests cho API backend và kiểm thử thủ công giao diện import.

---

## 9. Test Strategy

- **Automated tests:**
  - <!-- Sửa theo EFR-05: Chi tiết hóa test coverage --> Viết integration test trong `backend/src/__tests__/integration/bulkResign.test.ts` kiểm tra các trường hợp:
    - Validate và bulk update thành công 100%.
    - Validate thất bại do: mã nhân viên không tồn tại, sai định dạng ngày, trùng lặp mã trong file, tài khoản EA không có quyền đối với khối của nhân viên, kỳ chốt lương của ngày nghỉ việc đã bị khóa (`is_period_locked`).
    - Validate thất bại do vượt quá giới hạn 200 dòng.
    - Chống race-condition: Mock trạng thái nhân viên thay đổi ngay trước bước confirm để verify API từ chối ghi và rollback toàn bộ transaction.
- **Manual verification:**
  - Đăng nhập tài khoản EA, thực hiện tải file Excel mẫu, điền dữ liệu và xác nhận.
  - Xác minh khi file hợp lệ 100%, sau khi bấm xác nhận, nhân viên được chuyển sang trạng thái "Nghỉ việc" trên dữ liệu live, đồng thời sinh Change History và Audit Log tương ứng.

---

## 10. Rollback Plan

- **Rollback Code/Deploy:** Nếu phát hiện lỗi nghiêm trọng trong code sau khi deploy, thực hiện rollback branch về commit ổn định trước đó và kích hoạt CI/CD deploy lại Cloud Run (Native Rollback).
- **Rollback Dữ liệu (Data Compensation):** Do đây là thao tác cập nhật trực tiếp dữ liệu live và `nghi_viec` là trạng thái cuối không thể tự đảo ngược ở giao diện EA:
  - *Cấp độ giao diện (UX):* Hiển thị cảnh báo mạnh (Double confirmation pop-up) xác nhận hành động không thể tự hoàn tác trước khi thực thi.
  - *Cấp độ cơ sở dữ liệu (DB Runbook):* RPC `bulk_resign_employees` khi ghi nhận `audit_log` sẽ đính kèm thông tin dạng JSON chứa danh sách chi tiết nhân sự được cập nhật và các giá trị cũ (`old_state`, `old_ngay_nghi_viec`).
  - *Quy trình hoàn tác:* Trong trường hợp import nhầm dữ liệu, Super Admin (SA) sẽ sử dụng một script SQL hoặc gọi DB function để rollback dựa trên ID của Audit Log tương ứng, đưa trạng thái và ngày nghỉ việc của danh sách nhân sự về giá trị cũ, đồng thời ghi nhận thêm log `bulk_resign_rollback`. Chi tiết script rollback sẽ được ghi tài liệu bàn giao tại [USER_MANUAL.md](file:///d:/ToolNhanSuVcc/docs/USER_MANUAL.md).

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
