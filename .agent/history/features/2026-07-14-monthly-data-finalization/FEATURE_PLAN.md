# Feature Plan: NS-003 Chốt dữ liệu hàng tháng

> **Trạng thái**: ✅ Đã phê duyệt (Sẵn sàng triển khai)
> **Review gate**: ✅ ĐỒNG Ý (Approved after EFR Round 6)
> **Feature slug**: monthly-data-finalization
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-15
> **Cập nhật ngày**: 2026-07-14

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống đã có bảng `snapshots` và `snapshot_employees` nhưng logic chốt dữ liệu (finalization) chưa được triển khai hoàn chỉnh theo quy tắc nghiệp vụ mới (Chu kỳ 27-26).
- **Vấn đề cần giải quyết:**
    - Thiếu logic tính toán kỳ lương tự động (27 tháng trước đến 26 tháng hiện tại).
    - Thiếu cơ chế kiểm soát "Phòng chờ" khi chốt (cần đồng bộ logic chặn ở DB và API).
    - Thiếu tính năng Lock/Unlock dành cho Super Admin (SA).
    - Thiếu quy trình chốt bổ sung (Xóa snapshot + Tải Excel có Watermark & Ghi Audit Log, Upload Excel bổ sung/đầy đủ được SA duyệt lẻ).
    - **Yêu cầu mới bổ sung:** Tích hợp API đối chiếu danh sách nhân sự đã chốt (`GET /api/snapshots/active-keys`) cho hệ thống Apps Script cũ truy vấn. **Không sử dụng và loại bỏ hoàn toàn việc lưu trữ/đồng bộ Google Sheets.**
- **Mục tiêu kỹ thuật:**
    - Cập nhật Database Schema & Functions cho logic 27-26.
    - Thay đổi CHECK constraint của `snapshot_status` để cho phép nhận thêm giá trị `'deleted'`.
    - Thêm các cột `is_supplemental BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, và `updated_by TEXT` vào bảng `snapshot_employees` ngay từ đầu để phục vụ luồng chốt bổ sung và audit.
    - Thêm cột `supplemental_employees_count INT DEFAULT 0` vào bảng `snapshots` để thống kê nhân sự chốt bổ sung độc lập với `total_employees` (headcount chính thức).
    - **Thêm cột `locked_by` (FR-12 - Người khóa):** Thêm cột `locked_by TEXT` vào bảng `snapshots` để lưu email SA thực hiện hành động Lock. Cột này được gán khi Lock và clear NULL khi Unlock, song song với `locked_at`. Giải quyết vấn đề UI hiển thị "Người khóa" mà schema hiện tại chỉ có `snapshot_by` (người tạo snapshot, không phải người khóa).
    - **Thêm cột lưu ngày (Point 2 - Backfill):** Thêm 2 cột `period_start` DATE NOT NULL và `period_end` DATE NOT NULL vào bảng `snapshots` trong Phase 1 migration. Do DB hiện tại đã có dữ liệu cũ, việc này bắt buộc phải triển khai qua 3 bước an toàn trong tệp SQL:
        1. Tạo 2 cột nullable (`period_start DATE`, `period_end DATE`).
        2. Chạy lệnh SQL UPDATE tự động bóc tách từ cột `month` sang khoảng 27-26 tương ứng (ví dụ: `SET period_start = ((month || '-27')::date - INTERVAL '1 month')::date, period_end = (month || '-26')::date WHERE period_start IS NULL`).
        3. Thực hiện ALTER thay đổi 2 cột thành `NOT NULL`.
- **DB Function:** Sửa hàm `create_monthly_snapshot` để nhận dải ngày `p_start_date` và `p_end_date` và lưu chúng trực tiếp vào cột `period_start` / `period_end` của snapshot. Cập nhật logic copy nhân sự nghỉ việc sử dụng khoảng `[p_start_date, p_end_date]` thay vì lọc theo tháng dương lịch. Đồng thời đồng bộ logic chặn phòng chờ động. **Lưu ý:** Phải chạy lệnh `DROP FUNCTION IF EXISTS create_monthly_snapshot` cũ trước khi tạo lại để tránh conflict signature.
- **Phục hồi bổ sung & Trùng lặp (Hai Luồng Khôi Phục):** 
  1. **Khôi phục Live Master:** Khôi phục `deleted` về `draft`, tính lại master data, đồng thời tự động chèn ngược các dòng `'approved'` từ `snapshot_supplemental_pending` vào `snapshot_employees` (với `is_supplemental = true`, ép zero toàn bộ target aggregate). Tính lại count bằng lệnh `SELECT COUNT(*)` (không dùng phép cộng để tránh drift). Nếu master data có trùng `ma_nhan_su` với dòng bổ sung, ưu tiên chính thức, tự động chuyển dòng bổ sung về `'rejected'`, ghi `audit_log`.
       2. **Khôi phục từ backup:** Khi người dùng upload Excel đầy đủ ở Phase 5, server khôi phục bản ghi `deleted` về `draft` và import trực tiếp danh sách tĩnh từ file Excel backup. **Server sẽ bỏ qua hoàn toàn cột `is_supplemental` từ file Excel. Insert toàn bộ Excel rows vào `snapshot_employees` như dữ liệu lịch sử phẳng (flat data) với `is_supplemental = false`. Tự động cập nhật `total_employees` = số dòng import và gán cứng `supplemental_employees_count = 0`.**
- **Bảng tạm mới:** Tạo bảng `snapshot_supplemental_pending` với các cột lưu vết chỉnh sửa đầy đủ (gồm `updated_at TIMESTAMPTZ` và `updated_by TEXT` bên cạnh `created_at` / `created_by`), ràng buộc `UNIQUE(snapshot_id, ma_nhan_su)`, và **ràng buộc kiểm tra CHECK (`status IN ('pending', 'approved', 'rejected')`) để tránh dữ liệu trạng thái rác**. Sử dụng cơ chế Upsert (`ON CONFLICT (snapshot_id, ma_nhan_su) DO UPDATE SET employee_data = EXCLUDED.employee_data, note = EXCLUDED.note, status = 'pending', updated_at = NOW(), updated_by = EXCLUDED.created_by WHERE snapshot_supplemental_pending.status != 'approved'`) để cho phép EA tự do re-upload hoặc làm mới bản ghi bị reject/pending. **Xử lý Conflict lỗi nghiệp vụ rõ ràng:** Backend khi nhận Excel upload sẽ chủ động validate nếu có mã nhân viên trùng với bản ghi đã có status `'approved'` của snapshot đó trong bảng tạm, lập tức trả về lỗi **HTTP 409 Conflict** với mã lỗi `APPROVED_SUPPLEMENTAL_LOCKED` và thông báo chi tiết thay vì âm thầm bỏ qua. **Bật RLS `USING(false) WITH CHECK (false)` theo chính sách Hybrid Security (chặn mọi truy cập trực tiếp từ Client/Frontend, mọi thao tác bắt buộc đi qua Service-Role client của backend).**
- **Chống Drift dữ liệu:** Bổ sung cơ chế chặn chỉnh sửa/duyệt dữ liệu đối với mọi write-paths nếu ngày hiệu lực nằm trong chu kỳ lương đã bị khóa (`locked`).
    - **DB Helper Function:** Tạo hàm SQL helper `is_period_locked(p_date DATE, p_khoi TEXT) RETURNS BOOLEAN` trong database để dùng trực tiếp cho RPC và trigger. **Bắt buộc xử lý NULL ngay dòng đầu tiên: `IF p_date IS NULL THEN RETURN FALSE; END IF;`**. Hàm này kiểm tra boundary ngày 27-26 cực kỳ chính xác: quét tất cả snapshots của khối `p_khoi` có trạng thái `'locked'` (bỏ qua trạng thái `'deleted'`), và kiểm tra `p_date BETWEEN period_start AND period_end`.
    - **RPC `submit_employee_pending` (Database):** Gọi trực tiếp hàm SQL helper `is_period_locked` trên đầu hàm. Trích xuất tất cả các ngày hiệu lực (Effective Dates) từ payload pending (cho employee: `ngay_vao_cong_ty`, `ngay_nghi_viec`, `ngay_nghi_sinh`, `ngay_ky_hd`; cho salary: `ngay_dieu_chinh_luong`). **Quy tắc chống Bypass Anti-Drift Lương:** Nếu payload cập nhật lương bị khuyết `ngay_dieu_chinh_luong` (NULL), bắt buộc phải fetch giá trị `ngay_dieu_chinh_luong` hiện hành của nhân sự từ bảng `employees` để kiểm tra (chỉ bypass check nếu cả hai đều NULL). Nếu đổi khối `khoi`, kiểm tra locked period của cả khối cũ và khối mới. Chặn duyệt nếu bất kỳ ngày hiệu lực nào bị locked. **Bảo lưu 100% signature `(VARCHAR, TEXT, UUID)` và BẮT BUỘC kế thừa toàn bộ logic nghiệp vụ mới nhất từ migration mới nhất hiện tại, tối thiểu là `037_add_reviewer_form_integration.sql` (bao gồm logic ghi nhận `change_history`, `document_id` tuyển mới, `reviewer_emails`, `nguoi_nghiem_thu_thu_viec` và `SET search_path = public`) để tránh regression**, tuyệt đối không gây regression code cũ.
    - **Generic Live-Write Paths (Backend):** Tích hợp helper check locked `is_period_locked` vào các generic API ghi trực tiếp vào master data sống:
      1. `PUT /api/employees/:id` (Cập nhật thông tin nhân viên trực tiếp - bóc tách `ngay_vao_cong_ty`, `ngay_ky_hd`, `ngay_nghi_sinh`, `ngay_nghi_viec`).
      2. `PUT /api/employees/:id/state` (Cập nhật trạng thái nghỉ việc, thai sản trực tiếp - khớp 100% method PUT hiện tại của codebase).
      3. `DELETE /api/employees/:id` (Soft delete nhân viên trực tiếp - sử dụng ngày hệ thống hiện tại làm ngày hiệu lực để truyền vào `is_period_locked`).
      * **Lưu ý:** Tuyệt đối **không chặn** `PUT /api/salaries/:ma_nhan_su` hay các API ghi nháp khác chỉ ghi nháp vào pending phòng chờ. Drift prevention chỉ nằm ở live-write paths hoặc khi phê duyệt áp dụng thay đổi vào bảng sống.
    Việc lưu nháp/CRUD draft trong phòng chờ (`state_phong_cho = true`) được phép hoạt động bình thường mà không bị chặn, giúp tối ưu hiệu năng và tăng độ linh hoạt UX.
- API Backend cho Snapshots tuân thủ RESTful API convention với tên file route **`backend/src/routes/snapshots.ts`** (export router dưới tên biến **`snapshotsRoutes`**). Áp dụng **Resource-based Auth**: EA thao tác theo `khoi`, SA giữ quyền Duyệt/Lock/Config, VA được quyền Read-only. **Swagger Schema cơ bản:**
    - `GET /` và `GET /:id`: Lấy danh sách và chi tiết snapshot (Cho phép SA, EA, VA).
    - `/commit` (Upsert tạm): Nhận `FormData` (file Excel).
    - `/approve` (Bulk Duyệt): Nhận `{ pending_ids: string[] }`.
    - `DELETE /:id` (Xóa) và `/export`: Yêu cầu Guard trạng thái chỉ cho phép khi snapshot đang `draft`. Nếu snapshot đã `deleted` thì trả lỗi HTTP `409 SNAPSHOT_ALREADY_DELETED`.
    - `/lock` và `/unlock`: Cần State Guard chặt chẽ (Lock chỉ gọi từ `draft` -> không cho phép từ `deleted`, Unlock chỉ gọi từ `locked` để clear `locked_at`/`locked_by`).
- **Bảo mật và Hiệu năng:** Gắn `exportRateLimiter` và `bodyLimit` (tối đa 5MB) chống spam và crash OOM Cloud Run khi parse Excel. **[FR-16] Chống Excel zip bomb/parse expansion:** Ngoài `bodyLimit` ở tầng HTTP, service parse Excel phải kiểm tra thêm: (a) Giới hạn số dòng tối đa sau khi parse (MAX_ROWS = 5000), (b) Giới hạn kích thước workbook sau khi đọc vào bộ nhớ (MAX_UNCOMPRESSED = 50MB, tham chiếu pattern `adminImportService.ts` dòng 113-114), (c) Timeout parse 30 giây để tránh treo server. Nếu vượt ngưỡng, trả lỗi HTTP 413 kèm thông báo cụ thể. 
- **Cập nhật Contract (Point 6 & Point 1):** Bổ sung trạng thái `deleted`, trường **`supplemental_employees_count`**, cùng 2 cột `period_start` và `period_end` (kiểu string định dạng DATE YYYY-MM-DD, optional) vào `snapshotSchema` tại `@vcc/shared/src/schemas/snapshot.ts` để đồng bộ UI/API type.
  - **Semantic Audit Logs hiện hữu:** Tái sử dụng và giữ nguyên vẹn 100% semantic audit hiện tại của hệ thống:
    * Tạo mới: Action `'snapshot_create'`
    * Khóa: Action `'snapshot_lock'`
    * Mở khóa: Action `'snapshot_unlock'`
    * Xóa snapshot: Sử dụng action `'delete'` sẵn có kèm `details: { type: 'snapshot_delete' }` vì `snapshot_delete` chưa tồn tại trong enum hệ thống.
    * Xuất Excel trước khi xóa: Sử dụng action `'export'` sẵn có kèm `details: { type: 'before_snapshot_delete' }`.
    * Tự động hủy chốt bổ sung do trùng mã (Override): Sử dụng action `'update'` (module `'NS-003'`, `target_ma_nhan_su = ma_nhan_su`, details: `{ type: 'supplemental_auto_rejected', reason: 'official_overrode_supplemental', snapshot_id, ma_nhan_su }`).
    Tuyệt đối không tự ý thêm các action mới vào enum audit actions của hệ thống.
- **UI Frontend (Point 5):** Khởi tạo trang `Snapshots` mới tại `frontend/src/pages/Snapshots/index.tsx` (tạo mới file) và cập nhật `frontend/src/App.tsx` để wire trang này vào route `/snapshots` hiện tại thay thế cho PlaceholderPage. Chặn VI-only và Reviewer-only (nếu user có quyền EA/VA/SA hợp lệ thì được xử lý theo quyền đó dù đồng thời là reviewer). VA (View All) được cấp quyền Read-only để xem danh sách và chi tiết do VA được phân quyền xem lương, nhưng bị ẩn mọi thao tác (Chốt, Xóa, Lock, Config, v.v.).

### Out of scope
- Tự động hóa hoàn toàn việc chốt (vẫn cần EA bấm nút).
- Tích hợp gửi thông báo Telegram khi chốt (sẽ làm ở phase sau nếu cần).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
    - `[2026-03-13] Snapshot Rechốt`: Bắt buộc backup bản cũ (ở đây là tự động tải Excel để lưu trữ dự phòng) trước khi ghi đè/xóa.
    - `[2026-04-06] State-driven Visibility Isolation`: Nhân sự trong phòng chờ bị chặn chốt (nếu vướng ngày hiệu lực).
    - `[2026-03-14] Traceability`: Enforce watermark (User/Time/Khối) và ghi log `'export'` cho mọi file export, bao gồm cả file tự động tải về khi xóa.
- **"Cấm kỵ" cần tránh:**
    - Tuyệt đối chặn VI-only và Reviewer-only (nếu user có quyền EA/VA/SA hợp lệ thì được xử lý theo quyền đó dù đồng thời là reviewer) ở mọi route, API (`/api/snapshots/*`) và UI của snapshots. Tuy nhiên, VA (View All) ĐƯỢC PHÉP có quyền Xem (Read-only) vì VA được phép xem toàn bộ thông tin nhân sự và lương theo khối. Các thao tác ghi/xóa/lock/unlock vẫn phải chặn/ẩn đối với VA. Cần cập nhật đồng bộ ProtectedRoute, MainLayout để đảm bảo VA không thấy các nút thao tác.
    - Không cho phép EA mở khóa (Unlock) kỳ đã chốt — chỉ SA.
- **Quyết định kiến trúc mới bổ sung (2026-05-18):**
    - `[2026-05-18] Chặn Drift tại cửa ngõ Phê duyệt (Approve/Submit)`: Mọi hành động phê duyệt (Submit/Approve) để áp dụng chính thức thay đổi từ phòng chờ vào Master Data sống sẽ bị chặn cứng nếu ngày hiệu lực ứng với thay đổi đó rơi vào kỳ lương đã bị khóa (`locked`) trong `snapshots`. Các thao tác CRUD nháp (draft) trong phòng chờ được bỏ qua kiểm tra này để tối ưu hóa hiệu năng và tính linh hoạt của luồng nhập liệu.
    - `[2026-05-18] Phòng chờ chốt bổ sung dạng bảng quan hệ`: Lưu dữ liệu chốt bổ sung tạm thời ở bảng quan hệ `snapshot_supplemental_pending` (có `UNIQUE(snapshot_id, ma_nhan_su)`) thay vì JSONB để tối ưu tính toàn vẹn, tính ACID, và cho phép duyệt lẻ.
    - `[2026-05-18] [ĐÃ HỦY - LỊCH SỬ CŨ] Đồng bộ song song Google Sheets cấu hình động`: (Đã được hủy bỏ hoàn toàn và thay thế bằng API đối chiếu khóa `active-keys` để bảo mật và tối giản kiến trúc).
    - `[2026-05-18] RLS bắt buộc trên mọi bảng mới`: Tuân thủ chính sách `[2026-03-13] Hybrid Security` — bật `ENABLE ROW LEVEL SECURITY` và tạo policy `USING(false) WITH CHECK (false)` cho bảng mới (`snapshot_supplemental_pending`).
    - Sử dụng SQL RPC (`SECURITY DEFINER`) cho các tác vụ atomic liên quan đến snapshot.
    - Tôn trọng `khoi` level permission hiện có.

## 4. Giả định và câu hỏi mở

### Giả định
- "Khối/BU/Phòng" được phân quyền quản lý trực tiếp: Tạm thời áp dụng theo `khoi` level mà user có quyền EA. Nếu cần BU/Phòng chi tiết hơn, sẽ cần mở rộng `PermissionMatrix` và filter theo BU/Phòng.
- "Dữ liệu được chốt bao gồm tất cả các trường": Sử dụng `snapshot_employees` đã có sẵn các trường từ `employees` và `salaries`.
- "Đã nghỉ việc nhưng phát sinh thu nhập thì SA mở khóa": Nghĩa là nhân sự đã nghỉ việc từ các tháng trước, nay phát sinh thêm thu nhập (truy lĩnh, thưởng...). Quy trình là EA upload file Excel "Chốt bổ sung". Dữ liệu upload lên sẽ nằm ở bảng tạm `snapshot_supplemental_pending`. SA sau đó sẽ kiểm tra và nhấn Duyệt (Submit) từng dòng hoặc toàn bộ để đưa dữ liệu này vào snapshot chính thức.
- Nhân sự dạng "Chốt bổ sung" có tính chất đặc biệt:
    - **Không tính vào danh sách nhân sự thực tế** của tháng đó (không đếm headcount báo cáo).
    - **Không tính lương target** của tháng đó (hệ thống sẽ ép Lương Target = 0 khi vào báo cáo).
    - Chỉ xuất hiện thông tin cá nhân và khoản thu nhập phát sinh thực tế trong snapshot.
- Bảng `snapshot_employees` có trường đánh dấu (flag) `is_supplemental BOOLEAN DEFAULT false`. Các nhân sự chốt bổ sung sẽ có cờ này là `true`.
- File upload chốt bổ sung có tính chất **Ghi nối tiếp (Append)**, không phải ghi đè.
- **Lưu vết hành động Xóa (Phục vụ Upload Đầy đủ):** Khi người dùng xóa một snapshot, hệ thống sẽ chuyển `snapshot_status = 'deleted'`, xóa dữ liệu trong `snapshot_employees`, đồng thời **reset `total_employees = 0` và `supplemental_employees_count = 0`** để đồng nhất hiển thị trên UI (dữ liệu audit cũ đã lưu đầy đủ trong file Excel watermark đã tải). Việc này đóng vai trò như một "log" để hệ thống biết kỳ này từng bị xóa và mở khóa tính năng "Upload danh sách chốt đầy đủ".
- **Upload đầy đủ sau khi Deleted (Khôi phục từ Excel Backup):** File Excel upload đầy đủ chứa toàn bộ dữ liệu tĩnh (được kết xuất từ snapshot trước đó, bao gồm cả nhân sự chính thức và bổ sung). Server sẽ bỏ qua cờ `is_supplemental` của file Excel. Thành công sẽ đổi trạng thái snapshot về `draft`, toàn bộ dòng được coi là chính thức (`is_supplemental = false`), cập nhật `total_employees` = số dòng import và `supplemental_employees_count = 0`. Không đồng bộ dữ liệu lên Google Sheets.

### Câu hỏi mở
*(Không có)*

### Quyết định từ trao đổi
- **Mục đích bắt buộc tải Excel khi xóa snapshot:** Việc tải bản Excel về máy tính trước khi xóa snapshot nhằm mục đích để người dùng có sẵn một nguồn dữ liệu tham chiếu để **kiểm tra, đối chiếu lại các thay đổi** trong quá trình xóa hoặc tạo lại snapshot, chứ không nhằm thay thế các quy trình backup hệ thống.

## 5. Acceptance Criteria

- [ ] **DB Constraints:** Cập nhật CHECK constraint `snapshot_status IN ('draft', 'locked', 'deleted')`. Ràng buộc khóa ngoại bảng tạm `snapshot_supplemental_pending.snapshot_id REFERENCES snapshots(id) ON DELETE RESTRICT` để bảo toàn lịch sử và ngăn ngừa việc vô tình hard-delete snapshots làm mất dữ liệu phòng chờ bổ sung.
- [ ] **DB Logic:** Sửa đổi SQL Function `create_monthly_snapshot` nhận `p_start_date` và `p_end_date` và thực hiện kiểm tra phòng chờ động bằng cách tìm các bản ghi pending trong phòng chờ có ngày hiệu lực rơi vào kỳ đang chốt bằng cách trích xuất (parse) các trường `ngay_vao_cong_ty`, `ngay_nghi_viec`, `ngay_nghi_sinh`, `ngay_ky_hd` từ mảng JSONB `employees.pending_changes` và `ngay_dieu_chinh_luong` từ `salaries.pending_changes` và kiểm tra `BETWEEN p_start_date AND p_end_date` (không lạm dụng hàm `is_period_locked` vì kỳ này chưa ở trạng thái `locked`).
- [ ] **Drift Prevention:** Chặn phê duyệt (Submit/Approve) hồ sơ phòng chờ (như duyệt tuyển mới, nghỉ việc, điều chỉnh lương chính thức) nếu ngày hiệu lực ứng với thay đổi đó rơi vào kỳ chốt đã bị khóa (`locked`) bằng SQL helper `is_period_locked` check boundary 27-26 chính xác. Hoàn toàn không chặn thao tác lưu nháp/CRUD nháp của EA (nhập pending salary) khi dữ liệu vẫn ở trạng thái phòng chờ.
- [ ] Hệ thống tự động xác định đúng kỳ lương mặc định: từ 27 tháng trước đến 26 tháng hiện tại.
- [ ] Nhân sự được chốt thỏa mãn: 
    - `ngay_vao_cong_ty <= Ngày cuối kỳ lương` AND `trang_thai = 'chinh_thuc'` (hoặc `thu_viec`, `nghi_sinh`).
    - OR `trang_thai = 'nghi_viec'` AND `Ngày bắt đầu kỳ lương <= ngay_nghi_viec <= Ngày cuối cùng kỳ lương`.
- [ ] Chặn chốt nếu Khối có nhân sự trong phòng chờ (`state_phong_cho = true`) mà có ít nhất một trong các ngày sau nằm trong kỳ lương đang chốt: `Ngày vào`, `Ngày nghỉ việc`, `Ngày nghỉ sinh`, `Ngày ký HĐ`, `Ngày điều chỉnh lương`. (Vô hiệu hóa nút Chốt và hiển thị popup thông báo).
- [ ] Có UI quản lý chốt trực tiếp trên hệ thống (không dùng Upload để chốt lần đầu).
- [ ] Chỉ có thể chốt (hoặc sửa) kỳ lương chưa bị khóa (locked).
- [ ] Chỉ SA mới nhìn thấy và thao tác được nút Lock/Unlock. Khi Lock, hệ thống gán đồng thời `locked_at = NOW()` và `locked_by = email SA`. Khi Unlock, clear cả hai về NULL.
- [ ] **[FR-14] Guard xóa snapshot locked:** API `DELETE /api/snapshots/:id` bắt buộc check `snapshot_status = 'draft'` trước khi thực hiện. Nếu snapshot đang ở trạng thái `locked`, trả HTTP 409 `SNAPSHOT_LOCKED`. Nếu đang ở trạng thái `deleted`, trả HTTP 409 `SNAPSHOT_ALREADY_DELETED`. UI cũng vô hiệu hóa nút Xóa/Export khi status = locked hoặc deleted.
- [ ] Xóa snapshot chia làm 2 bước API độc lập: (1) Export Excel có Watermark & ghi log `export` với details `type: 'before_snapshot_delete'`. Response trả về header chứa checksum `X-Snapshot-Updated-At`. (2) User xác nhận xóa trên UI sau khi tải file thành công -> Gọi API soft delete (`DELETE /api/snapshots/:id`), bắt buộc truyền lên version checksum. Backend kiểm tra không lệch version, chuyển DB sang `'deleted'`, **thực hiện `DELETE FROM snapshot_employees WHERE snapshot_id = id` để làm sạch dữ liệu cũ, bảo toàn nguyên vẹn mọi bản ghi tạm trong bảng `snapshot_supplemental_pending` để giữ lịch sử gửi duyệt/từ chối phục vụ cho việc khôi phục snapshot**, (không có bất kỳ liên kết hay đồng bộ Google Sheets).
- [ ] Khi snapshot đang ở trạng thái `'deleted'`, nút "Upload chốt bổ sung" sẽ bị vô hiệu hóa/ẩn hoàn toàn.
- [ ] **[ĐÃ BỎ] Google Sheets Integration Sync (Cấu hình động):** Không còn thực hiện đồng bộ Google Sheets. Thay thế hoàn toàn bằng API đối chiếu khóa `active-keys`.

- [ ] Tính năng Upload Excel danh sách chốt ĐẦY ĐỦ (Point 7):
    - **Điều kiện kiên quyết:** Chỉ hiển thị và cho phép dùng tính năng này khi snapshot của tháng/khối đó đang ở trạng thái `'deleted'`.
    - **File mẫu (Template):** Có nút tải "File Excel Mẫu" định dạng cell chuẩn chống sai lệch ngày tháng (`yyyy-MM-dd`) và số.
    - **Validate Tồn tại:** `Mã nhân sự` upload lên bắt buộc phải tồn tại trong bảng Master Data (`employees`) đối với luồng Upload bổ sung (`/commit`). Riêng luồng Full Restore từ file Excel tĩnh, KHÔNG bắt buộc tồn tại trong Master Data (chỉ kiểm tra định dạng và không trùng lặp) để hỗ trợ khôi phục lịch sử của người đã nghỉ việc.
    - **Ràng buộc Phòng chờ & Khối & Ngày làm việc:** Validate tương tự như luồng chốt trực tiếp.
    - **Cơ chế xử lý bảo mật & Ràng buộc nghiệp vụ tối cao (Server-side generated fields & Guards):** Thành công sẽ chuyển trạng thái snapshot từ `'deleted'` trở lại `'draft'` và chèn dữ liệu vào `snapshot_employees`. Server sẽ bỏ qua hoàn toàn cột `is_supplemental` từ file Excel. Các cột hệ thống kỹ thuật bắt buộc được server sinh tự động và ghi đè để chống hack: `id` (sinh UUID mới), `snapshot_id` (gán theo ID hiện tại), `updated_by` (email EA), `updated_at = now()`, `created_at = now()`. **Đặc biệt, hệ thống insert toàn bộ rows vào `snapshot_employees` với `is_supplemental = false`, không ép zero bất kỳ trường nào (không áp dụng SUPPLEMENTAL_ZERO_FIELDS), và cập nhật `total_employees` = số dòng import, `supplemental_employees_count = 0`.** Không đồng bộ lên Google Sheets.
- [ ] Tính năng Upload Excel chốt BỔ SUNG (Ghi nối tiếp/Append):
    - **Điều kiện kiên quyết:** Chỉ cho phép upload bổ sung khi Khối và Tháng được chọn **đã tồn tại bản chốt gốc và chưa bị khóa** (trạng thái `'draft'`, tuyệt đối cấm upload/approve khi `'locked'` - yêu cầu SA mở khóa trước).
    - **Lưu trữ:** Dữ liệu chốt bổ sung sau khi upload sẽ được lưu vào bảng tạm `snapshot_supplemental_pending` thay vì cột JSONB.
    - **Duyệt lẻ:** SA có UI hiển thị danh sách từ bảng tạm này, hiển thị nổi bật ghi chú của EA, và có nút Duyệt (Submit)/Từ chối cho từng dòng nhân sự riêng lẻ hoặc hàng loạt.
    - **[FR-13] Atomic Approve RPC:** Khi SA duyệt, toàn bộ chuỗi thao tác sau được thực hiện trong **một SQL RPC transaction duy nhất** (SECURITY DEFINER) có `SELECT ... FOR UPDATE` lock dòng pending để chống double-click và race condition: (a) kiểm tra status pending chưa bị xử lý, (b) insert vào `snapshot_employees` với `is_supplemental = true` và **ép zero toàn bộ các field thuộc danh sách SUPPLEMENTAL_ZERO_FIELDS**, (c) tính lại `supplemental_employees_count` bằng lệnh `SELECT COUNT(*)`, (d) đổi status bảng tạm thành `approved`. Nếu bất kỳ bước nào lỗi, toàn bộ rollback. 

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/package.json` | Sửa | Cài đặt thư viện `exceljs` để phục vụ Export Excel có Watermark | Thấp | Có |
| `database/migrations/` | Tạo mới | Cập nhật logic `create_monthly_snapshot` (thêm DROP cũ, reuse deleted/draft, rule 27-26, period columns), tạo bảng `snapshot_supplemental_pending`, chặn check drift cho `submit_employee_pending` (lấy baseline từ migration `037`) | Logic SQL phức tạp | Có |
| `backend/src/routes/snapshots.ts` | Tạo mới | API endpoints prefix `/api/snapshots`, đặc biệt API đối chiếu `GET /api/snapshots/active-keys` (được bảo vệ bằng `x-api-key` qua `INTERNAL_API_KEY`). Áp dụng **Resource-based Auth** (EA chỉ thao tác được snapshot thuộc `khoi` của họ). Khai báo static route `active-keys` trước dynamic `/:id`. | Thấp | Có |
| `backend/src/services/snapshotService.ts` | Tạo mới | Business logic chốt dữ liệu, export watermark, truy vấn keys đối chiếu | Thấp | Có |
| `backend/src/routes/employees.ts` & `submit_employee_pending` RPC | Sửa | Bổ dung kiểm tra chặn duyệt (Submit/Approve) dữ liệu thuộc kỳ lương đã khóa (tất cả paths ghi trực tiếp + RPC) | Data drift prevention | Có |
| `frontend/src/pages/Snapshots/` | Tạo mới | Khởi tạo trang `Snapshots` mới tại `frontend/src/pages/Snapshots/index.tsx` và wire route tại `App.tsx` (thay thế cho PlaceholderPage cũ, thêm Tab/Sub-menu, UI Upload bổ sung, UI SA duyệt lẻ, ẩn mọi action ghi đối với VA, chặn Reviewer-only) | Thấp | Chưa |
| `frontend/src/components/ProtectedRoute.tsx` & `MainLayout.tsx` | Sửa | Cấp quyền Read-only cho VA, loại bỏ quyền Reviewer khỏi màn hình và menu Snapshot | Thấp | Có |
| `@vcc/shared/src/schemas/snapshot.ts` | Sửa | Thêm `deleted` vào enum trạng thái, `supplemental_employees_count`, `locked_by`, `period_start` và `period_end` (optional YYYY-MM-DD DATE string) vào snapshot schema. Định nghĩa schema API validation & error contracts (approve/reject/revoke/restore/route params). | Thấp | Có |
| `backend/src/config/env.ts` & `.env.example` | Sửa | Bổ sung Zod schema validate `INTERNAL_API_KEY` (độ dài tối thiểu 8 ký tự) để bảo mật API đối chiếu và cập nhật `.env.example` | Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Bắt buộc)
- **Risk hotspots:** 
    - Logic tính toán ngày 27-26.
    - Data Integrity: Tách biệt nhân sự "Chốt bổ sung" khỏi nhân sự "Chính thức" bằng cờ `is_supplemental = true` (triệt tiêu lương target và headcount).
    - Database constraints: Sửa CHECK constraint của bảng `snapshots` sang `'deleted'`.
    - Data Drift: Chặn phê duyệt (Submit/Approve) thay đổi live rơi vào kỳ chốt đã khóa.
    - **[Sửa theo EFR-01] Loại bỏ hoàn toàn Google Sheets:** Không triển khai đồng bộ Google Sheets, gỡ cấu hình `GOOGLE_SERVICE_ACCOUNT_KEY` và bảng `google_sheets_config`.
    - **[Sửa theo EFR-02] Bảo mật API đối chiếu:** Endpoint `GET /api/snapshots/active-keys` bắt buộc phải check header `x-api-key` thông qua `INTERNAL_API_KEY` để tránh rò rỉ dữ liệu lương/headcount.
    - **RLS trên bảng mới (FR-07):** Bắt buộc bật RLS `USING(false) WITH CHECK (false)` trên bảng `snapshot_supplemental_pending` để tuân thủ chính sách Hybrid Security (chặn mọi truy cập trực tiếp từ Client/Frontend, mọi thao tác bắt buộc đi qua Service-Role client của backend).
    - **Duplicate prevention (FR-09):** Bảng `snapshot_supplemental_pending` phải có `UNIQUE(snapshot_id, ma_nhan_su)` để ngăn EA upload trùng cùng mã nhân sự. **[FR-41] Cập nhật Rule Duyệt:** Khi Approve, RPC bắt buộc kiểm tra `ma_nhan_su` có còn tồn tại trong bảng master `employees` hay không, nếu master đã bị xóa/đổi mã thì từ chối duyệt (HTTP 400).
    - **[FR-13 & Full Restore] Atomic approve bổ sung & Full Restore:** Chuỗi thao tác duyệt bổ sung và thao tác khôi phục từ Excel đầy đủ phải được thực hiện bằng SQL RPC transaction duy nhất để chống lệch dữ liệu.
    - **[FR-14] Guard xóa snapshot locked:** Chặn cứng xóa snapshot đang locked.
    - **[FR-16] Excel zip bomb/parse expansion:** Giới hạn số dòng (`MAX_ROWS`), kích thước workbook sau parse (`MAX_UNCOMPRESSED`), và timeout parse 30s.
- **Review focus areas:**
    - Cấu trúc "Phòng chờ duyệt" (`snapshot_supplemental_pending`) và Bulk Approve (All-or-nothing policy).
    - Watermark và audit trail cho API Export ngầm. Export cũng áp dụng chung quyền Resource-based Auth như Delete.
    - Backend API route guard: Phân quyền **Resource-based Auth** (kiểm tra `khoi` của EA), chặn hoàn toàn VI-only và Reviewer-only. (VA chỉ được GET / và GET /:id). Chú ý khai báo Hono route đúng thứ tự.
    - Luôn dùng `SELECT COUNT(*)` cho `supplemental_employees_count` thay vì increment để chống drift.

## 8. Chiến dịch triển khai

- **Phase strategy:** 
    - Phase 1: Core Logic, Contracts & DB Updates (Update `@vcc/shared` types/schemas cho validation, validate `env.ts` cho `INTERNAL_API_KEY`, sửa CHECK constraint, thêm cột audit & `is_supplemental` & `supplemental_employees_count`, cập nhật DB function `create_monthly_snapshot` tính kỳ lương 27-26 và THAY THẾ DELETE FROM snapshots, tạo bảng `snapshot_supplemental_pending`, cài package `exceljs`).
    - Phase 2: Backend API & Active Keys (Viết route snapshots CRUD và tách đôi luồng Xóa, **viết static route GET /api/snapshots/active-keys với x-api-key guard và query chuẩn hóa ma_nhan_su/khoi**, bổ sung `GET /` cho danh sách, validation tại hàm phê duyệt/RPC submit chặn drift).
    - Phase 3: Frontend UI (Tái sử dụng/mở rộng route `/snapshots`, Tabs quản lý chốt, Export có Watermark, Xác nhận Xóa). Chú ý cấp quyền VA (Read-Only).
    - Phase 4: Additional Finalization Flow (Upload Excel chốt bổ sung vào bảng tạm quan hệ, UI cho SA duyệt lẻ/hàng loạt từ bảng tạm, append vào snapshot với `is_supplemental = true`, tính lại toàn bộ (recompute) `supplemental_employees_count`).
    - Phase 5: Full Excel Upload Flow (Upload đè toàn bộ danh sách chốt khi snapshot ở trạng thái `'deleted'`, khôi phục về `'draft'`).
- **Thực tế triển khai:** DB -> Backend API & Active Keys -> Frontend -> Upload Flows.

## 9. Test Strategy

- **Automated tests:**
    - Unit test logic tính toán period start/end.
    - Integration test SQL helper `is_period_locked` chặn đúng boundary ngày 26 của kỳ bị khóa nhưng bỏ qua ngày 27 (kỳ kế tiếp).
    - Integration test API create snapshot chặn chốt thành công nếu có pending record vướng ngày hiệu lực thuộc kỳ chốt `[p_start_date, p_end_date]`.
    - Integration test cho phép Admin lưu lương pending bình thường, nhưng chặn phê duyệt (submit/approve) cũng như chặn ghi trực tiếp qua `PUT /api/employees/:id/state` nếu ngày hiệu lực rơi vào kỳ đã khóa.
    - Integration test re-finalization: chốt nháp đè lên snapshot `draft` cũ sẽ xóa official rows cũ (`is_supplemental = false`) nhưng bảo toàn các dòng bổ sung (`is_supplemental = true`) (ngoại trừ các dòng bị trùng mã với nhân sự chính thức mới từ Live Master sẽ bị ghi đè và chuyển sang status `'rejected'`) và cập nhật giá trị `supplemental_employees_count` tương ứng.
    - **[FR-14]** Integration test API xóa snapshot: Bị chặn khi đang `locked` (trả SNAPSHOT_LOCKED) hoặc `deleted` (trả SNAPSHOT_ALREADY_DELETED). Soft-delete thành công khi `draft`, reset các count về 0, xóa bảng `snapshot_employees`, bảo toàn `snapshot_supplemental_pending`.
    - **[FR-13 & Full Restore]** Integration test gọi RPC Atomic Approve (duyệt bổ sung) và RPC Restore from Excel: verify transaction insert, đếm lại counts, và update status thành công.
    - **[Sửa theo EFR-02]** Integration test API `GET /api/snapshots/active-keys`: Verify đối chiếu khóa thành công khi truyền đúng `x-api-key` và `thang` (T6.2024 / T06.2024), trả về kết quả chuẩn hóa đúng định dạng `["T6.2024-101132-ADM", ...]`. Test các case thiếu key, sai key (trả 401 Unauthorized), truyền sai định dạng tháng (trả 400 Bad Request), exclusion các snapshot đã bị xóa, và kiểm tra route ordering của Hono.
    - Stress-test upload file Excel tiệm cận giới hạn 5MB và test các luồng zip bomb guard (`MAX_ROWS`, `MAX_UNCOMPRESSED`).
- **Manual verification:**
    - SA thực hiện lock/unlock (kiểm tra `locked_by`).
    - EA thực hiện xóa snapshot -> File excel tải về có Watermark, ghi Audit Log.
    - SA duyệt lẻ nhân sự bổ sung -> Kiểm tra DB thay đổi, các cột lương của dòng bổ sung bị áp zero.
    - Test login tài khoản `VA` -> verify có thể truy cập `/snapshots` nhưng bị ẩn toàn bộ các nút action (Chốt, Xóa). Test tài khoản `Reviewer-only` -> verify bị chặn hoàn toàn.
    - Kiểm chứng đối chiếu khóa bằng API client / Postman / curl gọi qua endpoint `GET /api/snapshots/active-keys` với `x-api-key` tương ứng.

## 10. Rollback Plan

- **Rollback Database:** Khôi phục lại signature RPC 3 tham số cũ. Backup dữ liệu `snapshot_employees` của tháng bị lỗi ra file CSV trước khi dọn dẹp để đảm bảo an toàn. Không truncate bừa bãi.
- **Rollback API/Frontend:** Revert code, gỡ package `exceljs`. Giữ nguyên bảng `snapshot_supplemental_pending` để không mất lịch sử phòng chờ bổ sung.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

---
## Appendix: Lịch sử Phản biện
### Council Review Lần 1 (2026-05-18)
- **Verdict:** ⚠️ CẦN SỬA
- **Nội dung điều chỉnh:**
  - Bổ sung migration sửa constraint `snapshot_status` cho phép nhận giá trị `'deleted'` (**FR-01**).
  - Đồng bộ logic chặn phòng chờ động trong hàm `create_monthly_snapshot` ở database (**FR-02**).
  - Bổ sung cơ chế chặn cập nhật Master Data thuộc kỳ lương đã khóa để chống drift dữ liệu (**FR-03**).
  - Thay đổi thiết kế lưu trữ chốt bổ sung: Tạo bảng quan hệ `snapshot_supplemental_pending` thay vì cột JSONB để hỗ trợ duyệt lẻ (**FR-04**).
  - Bắt buộc áp dụng Watermark và ghi audit log `'export'` cho file Excel tự động tải về khi xóa snapshot (**FR-05**).
  - Áp dụng `bodyLimit` tối đa 5MB để bảo vệ bộ nhớ backend không vượt quá 512Mi RAM (**FR-06**).
  - **Tinh chỉnh sau phản biện:** Không chặn CRUD nháp, vẫn chặn live-write chính thức (bắt buộc check Lock Guard trước khi submit/approve thay đổi vào bảng nhân sự). Giúp tăng tốc độ xử lý nhập liệu nháp và tối ưu trải nghiệm người dùng linh hoạt.

### Council Re-Review Lần 2 (2026-05-18)
- **Verdict:** ✅ ĐỒNG Ý
- **Nội dung điều chỉnh:**
  - Xác nhận tất cả các phát hiện blocker (FR-01 đến FR-06) đã được tích hợp đầy đủ vào Task Breakdown và Solution Design.
  - Tinh chỉnh cơ chế chặn Drift tại bước Submit/Approve đã được phê duyệt bởi Kiến Trúc Sư Trưởng.
  - Kế hoạch chính thức thông qua cổng review và sẵn sàng triển khai (`feature-coordinator`).

### Council Re-Review Lần 3 (2026-05-18)
- **Verdict:** ⚠️ CẦN SỬA → Đã tích hợp
- **Nội dung điều chỉnh:**
  - **FR-07 [Cao]:** Bổ sung bắt buộc RLS `USING(false) WITH CHECK (false)` trên 2 bảng DB mới (`google_sheets_config`, `snapshot_supplemental_pending`) theo chính sách Hybrid Security `[2026-03-13]`. Đã cập nhật vào Task 1.3 và Task 1.6.
  - **FR-08 [Trung bình]:** Chốt chiến lược xử lý lỗi Google Sheets API: try-catch không chặn nghiệp vụ, log error, trả cảnh báo người dùng. Đã cập nhật vào Task 2.3 và Task 2.4.
  - **FR-09 [Trung bình]:** Bổ sung `UNIQUE(snapshot_id, ma_nhan_su)` trên bảng `snapshot_supplemental_pending` để ngăn duplicate ở tầng DB. Đã cập nhật vào Task 1.3.

### Council Re-Review Lần 4 (2026-05-18)
- **Verdict:** ✅ ĐỒNG Ý
- **Nội dung điều chỉnh:**
  - Khắc phục 9 điểm mâu thuẫn kiến trúc theo khuyến nghị của chuyên gia.
  - Sửa thứ tự migration: thêm `is_supplemental` và `supplemental_employees_count` ngay từ Phase 1.
  - Bổ sung update contract `@vcc/shared` (trạng thái `deleted`, và sử dụng action `delete` kèm `details: { type: 'snapshot_delete' }` thay vì tạo action mới) và validate `env.ts` (`GOOGLE_SERVICE_ACCOUNT_KEY`).
  - Cập nhật logic Pl/PgSQL trong Task 1.4: Lọc `ngay_nghi_viec` theo khoảng `[p_start_date, p_end_date]` thay vì tháng dương lịch để đúng rule 27-26.
  - Phân rõ Total Employees: Bổ sung không tăng headcount (`total_employees`), tách sang biến đếm riêng `supplemental_employees_count`.
  - Tách quy trình xóa Snapshot thành 2 API độc lập (Export sau đó Confirm Delete) để giải quyết giới hạn HTTP.
  - UI/Routes: Sử dụng lại route `/snapshots` hiện hữu thay vì tạo `/finalization` gây đứt gãy.
  - Quyền VA: Chốt cứng VA chỉ có quyền Read-only đối với danh sách và chi tiết Snapshot, chặn mọi hành động Write/Lock/Delete.
  - Google Sheets Config: Thiếu config thì bypass & warning (không block nghiệp vụ).

### Council Re-Review Lần 5 (2026-05-19)
- **Verdict:** ⚠️ CẦN SỬA
- **Nội dung điều chỉnh:**
  - Đồng bộ logic khôi phục Excel backup parses dynamic `is_supplemental`. *(Đã cập nhật: Full Restore hiện tại bỏ qua is_supplemental và dùng flat data)*
  - Enforce dọn rác soft-delete: `DELETE FROM snapshot_employees`.
  - Đồng nhất tên nút khôi phục: `"Khôi phục từ Excel Backup"`.

### Council Re-Review Lần 6 (2026-05-19 - Phiên Bản Hoàn Thiện Tuyệt Đối)
- **Verdict:** 🟢 ĐỒNG Ý TUYỆT ĐỐI (Sẵn sàng code)
- **Nội dung điều chỉnh:**
  - **Triệt tiêu mâu thuẫn Phase 5:** Sửa đổi mục Upload đầy đủ trong plan khớp 100% với logic parse dạng is_supplemental của Task 5.3. *(Đã cập nhật: Full Restore bỏ qua is_supplemental)*
  - **Ràng buộc Bảo mật tối cao (Guards):** *(Đã thay đổi: Full Restore bỏ qua is_supplemental, không ép zero lương, đếm toàn bộ vào headcount)*
  - **Đồng bộ RLS Policy:** Cập nhật mục Hotspots ghi rõ RLS USING(false) WITH CHECK(false) enforce Service-role backend bypass (Dòng 165).
  - **Đồng bộ Test Strategy:** Bổ sung verify snapshot_employees trống sạch dòng sau khi soft-delete trong mục Test Strategy của plan (Dòng 190).

### Council Re-Review Lần 7 (2026-05-19)
- **Verdict:** 🟢 ĐỒNG Ý
- **Nội dung điều chỉnh:**
  - Đạt cổng review, sẵn sàng chuyển sang feature-coordinator triển khai.
  - Có 2 khuyến nghị nhỏ không chặn rollout: (FR-10) Điều chỉnh wording Task 2.6 sang dạng positive check, (FR-11) Bổ sung chi tiết các bước rollback ở Section 10.

### Phản biện Chuyên gia Lần 8 (2026-05-19)
- **Verdict:** ⚠️ CẦN SỬA — 2 Cao + 4 Trung bình/Thấp
- **Nội dung điều chỉnh:**
  - **FR-13 [Cao]:** Duyệt bổ sung chưa atomic — Task 4.4 mô tả chuỗi thao tác rời (insert snapshot_employees, tăng count, đổi status, sync Sheets). Đã chuyển thành SQL RPC transaction duy nhất có `SELECT ... FOR UPDATE` lock dòng pending để chống double-click và race condition. Google Sheets sync chạy ngoài transaction (try-catch). Đã cập nhật Task 4.4.
  - **FR-14 [Cao]:** Xóa snapshot locked chưa có rule rõ — Plan nói "chỉ chốt hoặc sửa kỳ chưa locked" nhưng task delete không guard. Đã bổ sung guard cứng: API `DELETE /api/snapshots/:id` check `snapshot_status != 'locked'`, trả HTTP 409 `SNAPSHOT_LOCKED` nếu vi phạm. UI vô hiệu hóa nút Xóa khi locked. Đã cập nhật Task 2.4 và Acceptance Criteria.
  - **FR-15 [Trung bình]:** Thiếu cơ chế retry/resync Google Sheets — Khi delete rows thành công nhưng append fail, Sheet mất dữ liệu. Đã bổ sung endpoint `POST /api/snapshots/:id/resync-sheets` (SA-only) thực hiện idempotent delete-before-append, không thay đổi DB. Đã cập nhật Task 2.7.
  - **FR-16 [Trung bình]:** `bodyLimit` 5MB chưa đủ chống zip bomb/parse expansion — Đã bổ sung 3 lớp bảo vệ: (a) MAX_ROWS = 5000 sau parse, (b) MAX_UNCOMPRESSED = 50MB (tham chiếu pattern adminImportService.ts), (c) timeout parse 30s. Đã cập nhật Task 4.2 và Task 5.2.
  - **FR-17 [Trung bình]:** UI hiển thị "Người khóa" thiếu dữ liệu nguồn — Schema chỉ có `locked_at` và `snapshot_by` (người tạo, không phải người khóa). Đã thêm cột `locked_by TEXT` vào migration, gán khi Lock, clear khi Unlock. Đã cập nhật Task 1.3, Task 3.2.
  - **FR-18 [Thấp-Trung bình]:** `GOOGLE_SERVICE_ACCOUNT_KEY` cần format contract — Đã chốt: JSON string escaped trên một dòng, backend parse bằng `JSON.parse()` bọc try-catch, validate trường `client_email` và `private_key`, log lỗi rõ nếu format sai. Đã cập nhật Task 1.1.

### Phản biện Chuyên gia Lần 9 (2026-05-19)
- **Verdict:** ⚠️ CẦN SỬA — 2 Cao + 3 Trung bình + 1 Thấp
- **Nội dung điều chỉnh:**
  - **FR-19 [Cao]:** Full restore từ Excel cần atomic transaction — Giống duyệt bổ sung, Task 5.3 khôi phục từ Excel cần gom vào RPC `restore_snapshot_from_excel` để (update deleted->draft, insert rows, đếm count) chạy nguyên tử. Đã cập nhật Task 5.3.
  - **FR-20 [Cao]:** Thứ tự DB vs Google Sheets dễ gây lệch — Plan đã quy định DB không rollback vì Sheets lỗi, nhưng một số task mô tả Sheets delete trước DB delete. Đã chốt lại toàn bộ wording: "DB transaction hoàn tất (commit) trước, sau đó mới chạy sync Google Sheets bằng try-catch". Đã sửa Task 2.4, 5.3.
  - **FR-21 [Trung bình]:** Backend guard snapshots chưa chặn Reviewer — Đã đổi thành positive check: backend route guard chỉ cho phép `SA`, `EA` (và `VA` đối với GET /), chặn tất cả các role khác kể cả Reviewer-only. Đã sửa Task 2.6.
  - **FR-22 [Trung bình]:** Đổi signature RPC `create_monthly_snapshot` cần update caller — Đã nhắc kiểm tra lại code gọi RPC (nếu có, dù khả năng thấp do feature mới) trong lúc tạo migration. Đã thêm ghi chú ở Task 1.5.
  - **FR-23 [Thấp-Trung bình]:** Thiếu .env.example trong affected files — Đã cập nhật bảng Section 6 để bổ sung `.env.example`.
  - **FR-24 [Thấp]:** Risk/Test strategy chưa update FR-13..18 — Đã cập nhật Section 7 (Risk) và Section 9 (Test Strategy) để đồng bộ nội dung guard locked, resync, atomic restore, DB-first, và zip bomb protection.

### Phản biện Chuyên gia Lần 10 (2026-05-19)
- **Verdict:** ⚠️ CẦN SỬA — 7 Blocker + 5 Should fix
- **Nội dung điều chỉnh:**
  - **FR-26 [Blocker]:** EA permission quá rộng — Đã đổi route guard thành **Resource-based Auth**: check `khoi` của EA khớp với `khoi` của snapshot. Đã cập nhật Task 2.6.
  - **FR-28 [Blocker]:** `supplemental_employees_count` dễ drift do increment — Chuyển qua dùng `SELECT COUNT(*) WHERE is_supplemental = true` trong mọi transactions. Đã cập nhật Task 1.5, Task 4.4.
  - **FR-29 [Blocker]:** Lỗi markdown rác dòng 32 — Đã dọn sạch phần duplicated content trong Plan.
  - **FR-31 [Blocker]:** API `export-before-delete` cần Resource-based Auth và Check Locked — Đã cập nhật Task 2.4 để share chung Guard với Delete.
  - **FR-32 [Should Fix]:** RPC `SECURITY DEFINER` cần `search_path` — Yêu cầu `SET search_path = public` trong SQL migrations (Task 1.5).
  - **FR-34 [Should Fix]:** Bulk Approve All-or-Nothing — Trong một RPC call nếu có dòng sai thì rollback cả batch, trả lỗi chi tiết. Đã cập nhật Task 4.4.
  - **FR-35 [Should Fix]:** Validate duplicate `ma_nhan_su` trong JSON/Excel — Chặn duplicate trùng ID ngay từ bước parse Excel trước khi hit UNIQUE constraint của DB. Đã cập nhật Task 5.2.
  - **FR-36 [Should Fix]:** Rollback plan an toàn — Bỏ lệnh truncate, thay bằng backup CSV trước. Khôi phục lại old signature RPC (Plan Section 10).

### Phản biện Chuyên gia Lần 11 (2026-05-19)
- **Verdict:** ⚠️ CẦN SỬA — 4 Blocker + 5 Should fix
- **Nội dung điều chỉnh:**
  - **FR-37 [Blocker]:** Dọn sạch lỗi rác tài liệu (dòng 32) — Đã loại bỏ hoàn toàn mảng text duplicate do lỗi regex trước đó.
  - **FR-40 [Blocker]:** Whitelist cột khi Restore từ Excel — Yêu cầu chặn tuyệt đối các cột hệ thống (`id`, `snapshot_id`, `created_at`, v.v.), chỉ lấy các cột nghiệp vụ (Task 5.3).
  - **FR-41 [Should Fix]:** Xử lý nhân sự bị xóa trước khi pending duyệt — Yêu cầu RPC approve bổ sung check `ma_nhan_su` vẫn tồn tại trong master `employees` trước khi duyệt.
  - **FR-42 [Should Fix]:** API `export-before-delete` là Backend Export — Đã chỉ định phải tạo file Excel bằng `exceljs` ở backend để gán watermark + audit cứng thay vì gọi lại FE utils.
  - **FR-43 [Should Fix]:** Đồng bộ Header Plan Status — Đã đổi header sang Lần 11.
  - **FR-45 [Should Fix]:** Schema `snapshot.ts` chưa cập nhật — Đã thêm cảnh báo ở Task 1.1 nhắc nhở bắt buộc cập nhật file `shared` này đầu tiên.

### Phản biện Chuyên gia Lần 12 (2026-05-19)
- **Verdict:** ⚠️ CẦN SỬA — 12 Blocker + 6 Should fix
- **Nội dung điều chỉnh (Lần 12):**
  - **FR-46 [Blocker]:** Lỗi cấu trúc tài liệu dòng 26 — Đã bóc tách rõ ràng phần mô tả cột `locked_by` và 3 bước migrate `period_start`.
  - **FR-47 [Blocker]:** Sai status nhân sự `dang_lam` -> `chinh_thuc` — Đã đổi toàn bộ references sang `chinh_thuc` (dòng 107).
  - **FR-48 [Blocker]:** Lỗi Migration không idempotent — Đã bổ sung requirement IF NOT EXISTS / DROP POLICY vào Task 1.2, 1.4.
  - **FR-49 [Blocker]:** Bổ sung trên Snapshot Locked — Đã sửa logic: cấm tiệt upload/approve nếu snapshot đang locked (Plan dòng 139, Task 4.4).
  - **FR-50 [Blocker]:** RPC approve thiếu check Snapshot — Đã yêu cầu check sự tồn tại, đúng khối, không deleted/locked trong approve RPC (Task 4.4).
  - **FR-52 [Blocker]:** Thiếu actor trong RPC signature — Đã nhét thêm `p_actor_email` vào `approve_supplemental_employees` và `restore_snapshot_from_excel` để ghi audit chuẩn (Task 4.4, 5.3).
  - **FR-53 [Blocker]:** `/commit` thiếu validation lúc ghi — Yêu cầu re-validate Khối, Lock, logic duplicate trước khi upsert vào bảng tạm (Task 4.3).
  - **FR-54 [Blocker]:** Bổ sung thiếu whitelist/sanitize cột khi upload — Yêu cầu filter cứng các business columns lúc upload Excel bổ sung tương tự như full restore (Task 4.2).
  - **FR-55 [Blocker]:** Mâu thuẫn 'tăng count' — Đã thay "tăng `supplemental_employees_count`" thành "tính lại toàn bộ (recompute)" ở Acceptance Criteria (Plan dòng 142).
  - **FR-56 [Blocker]:** Dọn sạch dữ liệu cũ khi Full Restore — Đã yêu cầu thêm dòng lệnh `DELETE FROM snapshot_employees WHERE snapshot_id = p_snapshot_id` ở đầu RPC để làm sạch sheet cũ (Task 5.3).
  