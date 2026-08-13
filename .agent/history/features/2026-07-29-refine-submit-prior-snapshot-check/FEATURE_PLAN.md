# Feature Plan: Tinh chỉnh cơ chế check prior-period snapshot khi submit phòng chờ

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: refine-submit-prior-snapshot-check
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-29

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** 
  Trước đó, trong tính năng `reconcile-snapshot-waiting-room` (Migration 043), hệ thống đã bổ sung một rule chặn (Prior-period snapshot lock check) bên trong hàm DB `submit_employee_pending`. Rule này quy định rằng khi HR duyệt (submit) nhân sự từ phòng chờ, nếu kỳ lương liền trước của ngày hiệu lực thay đổi chưa được chốt snapshot (`locked`), hệ thống sẽ từ chối phê duyệt để tránh drift dữ liệu lịch sử.
  Tuy nhiên, trong quá trình vận hành thực tế tại kỳ lương tháng 7/2026, xuất hiện trường hợp nhân sự mới `112933` (Hoàng Thị Hoài Phương, khối KND) vào công ty ngày `20/07/2026` nhưng có ngày ký hợp đồng lao động chính thức đặt ở tương lai (`ngay_ky_hd = 2026-09-20`). 

- **Vấn đề cần giải quyết:** 
  Hàm `submit_employee_pending` hiện tại thu thập mọi ngày hiệu lực (bao gồm cả `ngay_ky_hd` của hồ sơ tuyển mới) để thực hiện Prior-period snapshot check. Điều này khiến hệ thống đòi hỏi kỳ trước của ngày ký hợp đồng (`2026-08`) phải khóa snapshot, dẫn đến việc tuyển mới nhân viên trong tháng 7 bị chặn một cách sai lệch.

- **Mục tiêu:**
  Tách biệt logic xác định kỳ lương mục tiêu đối với hồ sơ tuyển mới để đảm bảo tính chặt chẽ của nghiệp vụ khóa kỳ lương:
  1. Đối với hồ sơ tuyển mới (`document_type = 'tuyen_moi'`), kỳ lương đầu tiên của họ chỉ chịu sự quyết định bởi ngày bắt đầu làm việc (`ngay_vao_cong_ty`). Do đó, chỉ sử dụng `ngay_vao_cong_ty` làm mốc xác định kỳ lương mục tiêu khi check prior-period snapshot, loại bỏ `ngay_ky_hd` và các ngày phụ trợ khác khỏi diện kiểm tra prior-period của hồ sơ này.
  2. Đối với hồ sơ điều chỉnh (nhân sự cũ hoặc tài liệu khác), giữ nguyên 100% logic check nghiêm ngặt đối với tất cả ngày hiệu lực thay đổi (bao gồm cả ngày tương lai) để ngăn chặn lỗ hổng duyệt thay đổi khi kỳ trước chưa khóa snapshot.

- **Kết quả mong đợi:**
  HR duyệt thành công nhân sự tuyển mới `112933` có ngày ký hợp đồng tương lai mà không bị chặn, đồng thời duy trì tính bảo mật tuyệt đối của luật khóa kỳ lương đối với tất cả các thay đổi/điều chỉnh khác.

## 2. Phạm vi

### In scope
- Cập nhật hàm PostgreSQL `submit_employee_pending` tại file migration mới `044_refine_prior_snapshot_check.sql`.
- Xác định trạng thái tuyển mới (`tuyen_moi`) chưa được submit một cách chính xác dựa trên sự kết hợp các điều kiện:
  ```sql
  v_is_new_hire := v_employee.state_phong_cho = true 
    AND NOT EXISTS (
        SELECT 1 FROM change_history 
        WHERE ma_nhan_su = p_ma_nhan_su
    )
    AND EXISTS (
        SELECT 1 FROM employee_documents 
        WHERE employee_id = v_employee.id 
          AND document_type = 'tuyen_moi'
          AND temp_uuid IS NOT NULL
    );
  ```
- **Xử lý và bàn giao vòng đời tài liệu tuyển mới:**
  * Khi `v_is_new_hire` là true, ta truy vấn tìm document tuyển mới đang hoạt động của nhân viên để gán vào `v_new_hire_document_id`:
    ```sql
    SELECT id INTO v_new_hire_document_id
    FROM employee_documents
    WHERE employee_id = v_employee.id
      AND document_type = 'tuyen_moi'
      AND temp_uuid IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    ```
  * Khi ghi nhận lịch sử thay đổi (`change_history`) cho các trường thông tin nhân sự của luồng tuyển mới, ta sẽ sử dụng `v_new_hire_document_id` làm khóa ngoại liên kết thay vì `v_document_id` (vốn có thể bị trỏ sang tài liệu lương do `p_temp_uuid` bị ghi đè ở tầng service). Các thay đổi về lương vẫn liên kết với `v_document_id` của tài liệu lương tương ứng.
  * Khi submit thành công, thực hiện clear `temp_uuid` cho **tất cả** tài liệu đang pending của nhân sự này để đưa chúng về trạng thái chính thức (locked):
    ```sql
    UPDATE employee_documents
    SET temp_uuid = NULL
    WHERE employee_id = v_employee.id
      AND temp_uuid IS NOT NULL;
    ```
- Đối với `tuyen_moi`, ngày hiệu lực để check prior-period snapshot được trích xuất bằng `COALESCE(NULLIF(v_emp_pending->>'ngay_vao_cong_ty','')::DATE, v_employee.ngay_vao_cong_ty)`. Nếu cả hai đều null thì không thực hiện check.
- Bổ sung Integration tests bao phủ ma trận kiểm thử toàn diện.

### Out of scope
- Thay đổi cấu trúc hay logic của hàm `is_period_locked` (Anti-drift guard lớp 1).
- Thay đổi schema của bảng `employee_documents` hay `employees`.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `Anti-drift Guard Pattern — DB-side Lock Check`: Giữ nguyên kiểm tra `is_period_locked(v_check_date, v_k)`.
  - `Atomic Submit RPC`: Phép duyệt và ghi lịch sử vẫn nằm trọn vẹn trong một transaction DB function.
- **"Cấm kỵ" cần tránh:**
  - Không được bỏ qua lớp bảo mật `is_period_locked` đối với các ngày hiệu lực (kể cả trong tương lai hoặc quá khứ) để ngăn chặn việc sửa dữ liệu lùi về các kỳ đã lock.
  - Tuyệt đối không để rò rỉ ngoại lệ RLS hoặc bypass quyền ghi log lịch sử.

## 4. Giả định và câu hỏi mở

### Giả định
- Kỳ lương của một ngày hiệu lực $D$ được tính bằng quy tắc: ngày $\ge 26$ thuộc kỳ lương tháng sau, ngược lại thuộc kỳ lương tháng hiện tại.
- Nếu không tìm thấy document hoặc không xác định được type `tuyen_moi` chưa submit, ta fallback về việc check tất cả các ngày hiệu lực phát sinh trong payload.

### Câu hỏi mở
- *Không có câu hỏi mở blocking nào.*

## 5. Acceptance Criteria

- [ ] HR duyệt (submit) thành công nhân sự tuyển mới `112933` đang vướng lỗi kỳ lương tương lai `2026-08` chưa chốt.
- [ ] Nhân viên mới có `ngay_vao_cong_ty` rơi vào kỳ lương mà kỳ trước đó chưa khóa snapshot thì vẫn bị chặn chính xác.
- [ ] Các thay đổi thông thường (như điều chỉnh lương) có ngày hiệu lực rơi vào kỳ lương mà kỳ trước đó chưa khóa snapshot (kể cả ngày tương lai) thì vẫn bị chặn chính xác.
- [ ] Mọi integration tests trong ma trận test chạy thành công.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `supabase/migrations/044_refine_prior_snapshot_check.sql` | Tạo mới | Định nghĩa lại hàm `submit_employee_pending` nâng cấp logic check prior-period. | 🟡 Trung bình/Cao | Có |
| `database/migrations/044_refine_prior_snapshot_check.sql` | Tạo mới | Đồng bộ migration với thư mục database chính (hai bản migration phải byte-equivalent). | 🟡 Trung bình/Cao | Có |
| `database/rollbacks/044_refine_prior_snapshot_check.rollback.sql` | Tạo mới | File chứa SQL rollback thủ công để hoàn trả DB về Migration 043 (nằm ngoài thư mục auto-run). | 🟢 Thấp | Có |
| `backend/src/__tests__/integration/snapshots.test.ts` | Sửa | Thêm test case kiểm thử lỗi submit với ngày tương lai và ma trận test. | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Bắt buộc)
- **Risk hotspots:** Không nới lỏng cơ chế check của nhân sự cũ (existing employees) để đảm bảo không tạo lỗ hổng duyệt lịch trình tương lai khi kỳ trước chưa khóa snapshot.
- **Review focus areas:** 
  - Logic xác định `document_type` từ `employee_documents` thông qua `p_temp_uuid` và fallback qua `employee_id` nếu `p_temp_uuid` null.
- **Known pitfalls / historical issues:** Migration 043 từng gây ra incident chặn nhầm do gom cả `ngay_ky_hd` của hồ sơ tuyển mới để check prior-period.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai một phase duy nhất bao gồm migration DB, sửa test script và chạy kiểm chứng trên local Docker.
- **Thứ tự triển khai:**
  1. Tạo và áp dụng DB migration 044 trên local database.
  2. Viết test case bổ sung trong `snapshots.test.ts`.
  3. Chạy test suite để verify.
- **Yêu cầu migration / config / deploy:** Cần deploy migration này lên Supabase cloud khi go-live.

## 9. Test Strategy

> [!IMPORTANT]
> **RÀNG BUỘC KIỂM THỬ MÔI TRƯỜNG LOCAL:**
> Toàn bộ quá trình chạy kiểm thử tự động (Unit test, Integration test) và kiểm thử thủ công bắt buộc phải thực thi thông qua Supabase Local Docker CLI Harness (local container `supabase_db_ToolNhanSuVcc` chạy tại `127.0.0.1:54322` hoặc các lệnh npm tương ứng). TUYỆT ĐỐI KHÔNG thực hiện chạy test hoặc tác động dữ liệu trực tiếp lên database Cloud Dev/Prod để phòng tránh rò rỉ hoặc làm hỏng dữ liệu live.

- **Automated tests:** Thêm integration test trong `backend/src/__tests__/integration/snapshots.test.ts` bao phủ ma trận kiểm thử:
  - Anti-drift: Chuyển ngày hiệu lực vào kỳ lương đã khóa (cả new hire và existing employee) phải bị block bởi `is_period_locked`.
  - Prior-period check với new-hire:
    - Nếu `ngay_vao_cong_ty` thuộc kỳ $M$ mà kỳ $M-1$ chưa locked: Bị block.
    - Nếu `ngay_vao_cong_ty` thuộc kỳ $M$ mà kỳ $M-1$ đã locked, còn `ngay_ky_hd` trong tương lai: Submit thành công.
    - Test new hire có đồng thời document `tuyen_moi` hoạt động và document salary `dieu_chinh_luong` mới (RPC nhận temp UUID của document lương): Submit thành công.
  - Kiểm chứng tài liệu tuyển mới sau submit (EFR-01 Round 7):
    - Assert: Lịch sử `change_history` của thông tin nhân sự tuyển mới liên kết đúng khóa ngoại với document `tuyen_moi` (thay vì document lương).
    - Assert: Sau submit thành công, tài liệu tuyển mới không còn active (`temp_uuid` bị clear về `NULL`).
    - Assert: Lần cập nhật lương/hồ sơ tiếp theo (điều chỉnh định kỳ) được hệ thống coi là existing employee một cách chính xác.
  - Regression check cho existing employees:
    - Nhân viên đã từng onboarding và có document `tuyen_moi` cũ (nhưng `temp_uuid` đã null) thực hiện điều chỉnh lương/hồ sơ: Phải đi nhánh existing employee (bị check toàn bộ ngày hiệu lực thay đổi và chặn nếu kỳ trước chưa lock).
    - Nhân viên bulk-imported không có lịch sử (`change_history` trống) thực hiện điều chỉnh lương/hồ sơ: Phải đi nhánh existing employee.
  - Prior-period check với existing employee:
    - Sửa lương với `ngay_dieu_chinh_luong` thuộc kỳ $M$ mà kỳ $M-1$ chưa locked: Bị block (kể cả khi $M$ ở tương lai).
  - Test trường hợp `p_temp_uuid` là null, document override, và document null.
- **Manual verification:** Run thử API submit của nhân sự `112933` trên local DB để xác nhận không còn bị báo lỗi `2026-08`.

## 10. Rollback Plan

- **Baseline Rollback:** Nguyên trạng định nghĩa hàm `submit_employee_pending` tại Migration 043 (`database/migrations/043_prevent_submit_without_prior_snapshot.sql`).
- **Quy trình thực hiện:** 
  1. Áp dụng lại file rollback `database/rollbacks/044_refine_prior_snapshot_check.rollback.sql` đảm bảo đúng owner (`postgres`), `SECURITY DEFINER`, `search_path = public`.
  2. Gọi reload schema cache của PostgREST.
  3. Chạy thử nghiệm smoke check submit trên local để verify rollback thành công.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
