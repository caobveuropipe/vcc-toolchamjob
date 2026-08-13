# Feature Tasks: NS-003 Chốt dữ liệu hàng tháng

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-15
> **Cập nhật ngày**: 2026-07-14

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Core Logic & DB Updates

**Mục tiêu:** Cập nhật DB schema, constraint, cài đặt các package phụ thuộc và SQL function để đáp ứng các blo- [x] Task 1.1: **[Update Contract & Env - Point 6 & Point 1]** Cập nhật `@vcc/shared/src/schemas/snapshot.ts`: thêm `deleted` vào enum, các trường `supplemental_employees_count`, `locked_by` (optional string), `period_start` và `period_end` (optional string định dạng YYYY-MM-DD) vào `snapshotSchema` để đồng bộ UI/API type. **(CẢNH BÁO: Phải làm file schema này đầu tiên, nếu quên FE/API parse sẽ crash).** **Không** thêm audit action mới vào enum (tái sử dụng các core action và semantic audit hiện có: `'snapshot_create'`, `'snapshot_lock'`, `'snapshot_unlock'`, còn hành động xóa dùng `'delete'` kèm details `type = 'snapshot_delete'`, hành động xuất Excel trước khi xóa dùng `'export'` kèm details `type = 'before_snapshot_delete'`). **[Sửa theo EFR-65] Bổ sung các schema API contract và validation:** Định nghĩa các schema cho payload/params của API snapshot bao gồm: query params cho `active-keys`, supplemental pending (`snapshot_supplemental_pending`), restore rows, route params (như `:id`), error contracts, và các cảnh báo warnings để backend dùng validation và frontend dùng type. Cập nhật `backend/src/config/env.ts`: thêm validate Zod cho `INTERNAL_API_KEY` (chuỗi tối thiểu 8 ký tự, optional/default cho local dev nhưng required trên production) để phục vụ API đối chiếu khóa.`
- [x] Task 1.2: **[Sửa theo EFR-64]** Tạo file migration `038_update_snapshot_logic.sql` (số thứ tự tiếp theo của migration). **[FR-17 & FR-48] Yêu cầu Migration Idempotent:** Trong script migration, tất cả các câu lệnh tạo bảng, tạo role, tạo policy phải tuân thủ chuẩn idempotent (sử dụng `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, và bọc trong `DO $$ BEGIN ... EXCEPTION ... END $$` đối với các operation không hỗ trợ `IF NOT EXISTS` theo chuẩn của repo). *(Lưu ý: Việc dùng `CREATE TABLE` ở đây là ngoại lệ có chủ đích so với `database/migrations/README.md` do tính năng yêu cầu khởi tạo bảng mới `snapshot_supplemental_pending`.)*
- [x] Task 1.3: **[Blocker FR-01 & Point 2 - Safe Migration Backfill & FR-17]** Cập nhật bảng `snapshots`: Xóa CHECK constraint cũ của `snapshot_status` và thêm giá trị `('draft', 'locked', 'deleted')`. Thêm cột `supplemental_employees_count INT DEFAULT 0`. **[FR-17] Thêm cột `locked_by TEXT`** để lưu email SA thực hiện Lock (gán khi Lock, clear NULL khi Unlock, song song với `locked_at`). Thêm hai cột `period_start` DATE và `period_end` DATE với thứ tự 3 bước an toàn trong file SQL:
    1. Tạo 2 cột nullable (`period_start DATE`, `period_end DATE`).
    2. Chạy lệnh SQL UPDATE tự động bóc tách từ cột `month` sang khoảng 27-26 tương ứng và cast rõ kiểu DATE sau khi trừ INTERVAL: `SET period_start = ((month || '-27')::date - INTERVAL '1 month')::date, period_end = (month || '-26')::date WHERE period_start IS NULL`.
    3. Thực hiện ALTER thay đổi cả 2 cột thành `NOT NULL`.
    Cập nhật bảng `snapshot_employees`: Thêm các cột `is_supplemental BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`, và `updated_by TEXT`.
- [x] Task 1.4: **[Blocker FR-04 - Upsert & Validate Conflict Rõ Ràng]** Tạo bảng tạm `snapshot_supplemental_pending` để lưu dữ liệu phòng chờ bổ sung. Schema: `id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `snapshot_id` REFERENCES snapshots(id) ON DELETE RESTRICT, `ma_nhan_su` VARCHAR, `employee_data` JSONB, `note` TEXT, `status` VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), `created_at` TIMESTAMPTZ DEFAULT now(), `created_by` TEXT, `updated_at` TIMESTAMPTZ DEFAULT now(), `updated_by` TEXT. **[FR-09] Bổ sung constraint `UNIQUE(snapshot_id, ma_nhan_su)`.**
    - Khi EA upload, backend validate nếu mã nhân sự đã có status `'approved'` trong bảng tạm của snapshot này thì lập tức chặn và trả lỗi **HTTP 409 APPROVED_SUPPLEMENTAL_LOCKED** kèm thông báo chi tiết.
    - Nếu không trùng bản ghi approved, backend sử dụng cú pháp Upsert (`ON CONFLICT (snapshot_id, ma_nhan_su) DO UPDATE SET employee_data = EXCLUDED.employee_data, note = EXCLUDED.note, status = 'pending', updated_at = NOW(), updated_by = EXCLUDED.created_by WHERE snapshot_supplemental_pending.status != 'approved'`) để ghi đè cập nhật/làm mới bản ghi pending/rejected.
- [x] Task 1.5: **[Blocker FR-02 & Rule 27-26 & Point 3 - Hai Luồng Khôi Phục & Tự động Phục hồi Bổ sung]** Sửa SQL Function `create_monthly_snapshot` và bổ sung DB Helpers:
    - **Tạo DB Helper Function:** Tạo hàm SQL helper `is_period_locked(p_date DATE, p_khoi TEXT) RETURNS BOOLEAN` trong database kiểm tra boundary ngày 27-26 cực kỳ chính xác. **Bắt buộc thêm dòng xử lý an toàn: `IF p_date IS NULL THEN RETURN FALSE; END IF;`**. Sau đó quét tất cả snapshots của khối `p_khoi` có trạng thái `'locked'` (bỏ qua trạng thái `'deleted'`), và kiểm tra `p_date BETWEEN period_start AND period_end`.
    - **Tự động phục hồi Bổ sung:** Bổ sung logic vào hàm `create_monthly_snapshot` để khi khôi phục snapshot từ trạng thái `'deleted'` về `'draft'`, hàm tự động quét bảng tạm `snapshot_supplemental_pending` lọc các hàng `'approved'` của snapshot này để phục hồi chèn ngược lại vào `snapshot_employees` (với `is_supplemental = true`, ép zero toàn bộ các field target aggregate, ta gọi danh sách này là **SUPPLEMENTAL_ZERO_FIELDS** bao gồm TOÀN BỘ CÁC TRƯỜNG LƯƠNG NHƯ: `luong_target_gt`, `lcd_gt`, `luong_hieu_suat_gt`, `nhuan_but_gt`, `okr_gt`, `thuong_doanh_so_gt`, `luong_target_cc`, `luong_cb`, `thuong_hieu_suat_cham_job_nhuan`, `thuong_kpi_m1/m2/m3`, `thuong_okr_m1/m2/m3`, `thuong_doanh_so_m1/m2/m3`, `thuong_du_an_m1/m2/m3`, `thuong_kiem_nhiem_m1/m2/m3`, `bac_luong`, `ty_le_luong_tv`, `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`, cờ `is_target_cc_include_kn_m1` để chống mismatch khi validation/report tính lại) và tự động khôi phục giá trị đếm `supplemental_employees_count` chính xác. **Xử lý trùng lặp mã nhân sự (Re-finalization Overwrite):** Nếu chốt lại từ Live Master gặp nhân sự chính thức mới trùng mã `ma_nhan_su` với bản ghi chốt bổ sung đã duyệt trước đó, nhân sự chính thức sẽ được ưu tiên tuyệt đối: hàm SQL tự động xóa bản ghi chốt bổ sung trùng mã cũ trong `snapshot_employees` để ghi đè bản ghi chính thức mới, cập nhật trạng thái dòng tương ứng trong `snapshot_supplemental_pending` từ `'approved'` sang `'rejected'` (set `updated_at = NOW()`, `updated_by = 'system-refinalization-override@vcc.internal'`), đồng thời chèn một bản ghi vào `audit_log` tuân thủ đúng Check Constraints của DB schema: `actor_email = 'system-refinalization-override@vcc.internal'`, `module = 'NS-003'`, `action = 'update'`, `target_ma_nhan_su = ma_nhan_su`, và `details = jsonb_build_object('type', 'supplemental_auto_rejected', 'reason', 'official_overrode_supplemental', 'snapshot_id', snapshot_id, 'ma_nhan_su', ma_nhan_su)`.
    - **DROP TOÀN BỘ OVERLOAD CŨ:** Thêm câu lệnh `DROP FUNCTION IF EXISTS create_monthly_snapshot(character varying, text, text);` lên đầu migration trước khi định nghĩa signature mới 5 tham số. **[FR-22] Lưu ý:** Cần rà soát các callers (backend hoặc tools) đang gọi RPC 3 tham số này để cập nhật đồng bộ (mặc dù feature mới có thể chưa có caller nào).
    - **[FR-32] SECURITY DEFINER Best Practices:** Khi định nghĩa các RPC (`create_monthly_snapshot`, `restore_snapshot_from_excel`, v.v.), bắt buộc phải cấu hình `SET search_path = public` và gán ownership/grants hợp lý cho backend service role để tránh lỗ hổng bảo mật.
    - Sửa `create_monthly_snapshot` nhận 2 tham số bổ sung `p_start_date` DATE và `p_end_date` DATE, thực hiện lưu chúng thẳng vào 2 cột `period_start` và `period_end` khi insert/update snapshot.
    - **Quan trọng (Rule 27-26):** Sửa logic lấy dữ liệu nhân sự (đặc biệt nhân sự nghỉ việc) dựa trên khoảng ngày `[p_start_date, p_end_date]` thay vì lọc theo tháng dương lịch `to_char`.
    - **Sửa logic kiểm tra phòng chờ động:** Tìm các bản ghi pending trong phòng chờ có ngày hiệu lực rơi vào kỳ đang chốt: trích xuất `ngay_vao_cong_ty`, `ngay_nghi_viec`, `ngay_nghi_sinh`, `ngay_ky_hd` từ mảng JSONB `employees.pending_changes` và `ngay_dieu_chinh_luong` từ `salaries.pending_changes` và kiểm tra `BETWEEN p_start_date AND p_end_date` (không lạm dụng hàm `is_period_locked` vì kỳ này chưa ở trạng thái `locked`).
    - **Tái sử dụng Deleted/Draft Row (Hai Luồng Khôi Phục):** Nếu snapshot ở trạng thái `draft` hoặc `deleted` đã tồn tại cho cặp `(month, khoi)`, tái sử dụng `snapshot_id` hiện tại (status chuyển về `draft`), **BẮT BUỘC thay thế logic `DELETE FROM snapshots` cũ bằng `DELETE FROM snapshot_employees WHERE snapshot_id = ... AND is_supplemental = false`** để CHỈ xóa các official rows cũ (luồng live master) hoặc xóa TOÀN BỘ (bỏ AND) nếu là luồng Full Restore, và chèn dữ liệu mới. Quy trình tái sử dụng row này bắt buộc đối với cả luồng Khôi phục từ Live Master (qua `create_monthly_snapshot`) lẫn luồng Khôi phục tĩnh từ Excel (qua RPC độc lập `restore_snapshot_from_excel`). Tuyệt đối không hard-delete row trong `snapshots` để tránh đụng UNIQUE constraint và ON DELETE RESTRICT của bảng tạm pending.
- [x] Task 1.6: **[Yêu cầu Package]** Cài đặt thư viện **`exceljs`** vào `backend/package.json`.
- [x] Task 1.7: **[RLS cho Bảng Mới]** Bổ sung vào file migration thiết lập bảo mật bảng tạm phòng chờ bổ sung:
    ```sql
    -- [FR-07] Bật RLS USING(false) WITH CHECK(false) cho bảng mới snapshot_supplemental_pending
    ALTER TABLE snapshot_supplemental_pending ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Block all direct access" ON snapshot_supplemental_pending;
    CREATE POLICY "Block all direct access" ON snapshot_supplemental_pending USING (false) WITH CHECK (false);
    -- Note: Mọi thao tác đọc/ghi bảng này bắt buộc đi qua Service-Role client của backend (được bypass RLS). Trực tiếp chặn client anon/authenticated.
    ```
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 - Chạy migration thành công, kiểm tra các bảng và function được cập nhật chính xác. Viết integration test SQL helper `is_period_locked` chặn đúng boundary ngày 26 của kỳ bị khóa nhưng bỏ qua ngày 27 (kỳ kế tiếp).

---

## Phase 2: Backend API & Active Keys

**Mục tiêu:** Xây dựng API quản lý snapshot, xuất Excel an toàn có watermark, API đối chiếu khóa active-keys cho hệ thống Apps Script cũ và chặn đứng rủi ro drift dữ liệu live tại bước phê duyệt.

- [x] Task 2.1: Implement utils tính kỳ lương (`getPeriodDates(month: string)`) tại `packages/shared` hoặc `backend/utils`.
- [x] Task 2.2: **[Blocker FR-03 - Tinh chỉnh & Anti Drift rộng]** 
    - **Hàm validation dùng chung (TypeScript Backend):** Xây dựng helper backend gọi hàm DB `is_period_locked(date, khoi)` hoặc query tương đương.
    - **Bao phủ tất cả live-write paths (Tại `backend/src/routes/employees.ts`):** Tích hợp helper check locked vào các API ghi trực tiếp vào master data sống:
      1. `PUT /api/employees/:id` (generic update employee - bóc tách `ngay_vao_cong_ty`, `ngay_ky_hd`, `ngay_nghi_sinh`, `ngay_nghi_viec` trong body).
      2. `PUT /api/employees/:id/state` (cập nhật trạng thái nghỉ việc, thai sản trực tiếp - khớp 100% method PUT hiện tại của codebase).
      3. `DELETE /api/employees/:id` (soft delete nhân viên trực tiếp).
      * **Lưu ý:** Tuyệt đối **không chặn** `PUT /api/salaries/:ma_nhan_su` hay các API ghi nháp khác vào phòng chờ. Drift prevention chỉ nằm ở live-write paths hoặc khi phê duyệt áp dụng thay đổi vào bảng sống.
    - **SQL Function `submit_employee_pending` (RPC):** Gọi trực tiếp hàm DB helper `is_period_locked`. Bóc tách tất cả Effective Dates nhạy cảm từ payload pending (employee: `ngay_vao_cong_ty`, `ngay_nghi_viec`, `ngay_nghi_sinh`, `ngay_ky_hd`; salary: `ngay_dieu_chinh_luong`). **Rule chặn Bypass:** Nếu payload cập nhật lương bị khuyết `ngay_dieu_chinh_luong` (tức là NULL), bắt buộc hàm phải lấy giá trị hiện hành từ bảng `employees` để đưa vào kiểm tra locked period. Nếu đổi khối `khoi`, kiểm tra locked period của cả khối cũ và khối mới. Chặn duyệt nếu bất kỳ ngày hiệu lực nào bị locked. **[Sửa theo EFR-64] Tuyệt đối bảo lưu signature và toàn bộ logic MỚI NHẤT từ migration mới nhất hiện tại, tối thiểu là `037_add_reviewer_form_integration.sql`** (bao gồm logic `change_history`, `document_id` tuyển mới, `reviewer_emails`, `nguoi_nghiem_thu_thu_viec` và `SET search_path = public`), tránh gây regression bị lùi phiên bản (downgrade logic).
    - Tuyệt đối không kiểm tra chặn ở các route CRUD ghi nháp/CRUD draft để tối ưu hóa hiệu năng.
- [x] Task 2.4: **[Export Excel & Reset Counts & Tái sử dụng]**
    - **Khi chốt snapshot thành công (Chốt mới hoặc Re-finalization):** Tiến hành hoàn tất chốt dữ liệu trên database. Không có bất kỳ liên kết hay đồng bộ Google Sheets nào được thực hiện.
    - **[Blocker FR-05 & Reset counts & Clear Snapshot Employees & FR-14 Guard Locked] Xóa Snapshot (Tách 2 API):** 
      - API 1: `GET /api/snapshots/:id/export-before-delete` gọi xuất Excel có Watermark và ghi log **`export`** có metadata `details: { type: 'before_snapshot_delete' }`. **[FR-31] Bắt buộc check `snapshot_status = 'draft'` (nếu deleted thì trả 409 SNAPSHOT_ALREADY_DELETED) và kiểm tra Resource-based Auth (EA phải quản lý đúng `khoi` của snapshot) trước khi cho phép export.** **[FR-42] File Excel phải được generate hoàn toàn ở Backend bằng thư viện `exceljs` để nhúng watermark cứng và chốt log audit an toàn trước khi stream trả về client (không được dùng utility export của frontend).** Response trả về file Excel và header chứa `X-Snapshot-Updated-At` để client dùng cho bước xóa.
      - API 2: `DELETE /api/snapshots/:id` — **[FR-14] Bắt buộc check `snapshot_status = 'draft'` trước khi xử lý. Nếu snapshot đang locked, trả HTTP 409 `SNAPSHOT_LOCKED`. Nếu deleted thì trả `SNAPSHOT_ALREADY_DELETED`.** Nhận query/body param `version_updated_at`. Backend check `snapshot.updated_at == version_updated_at`, nếu sai lệch (do có người khác sửa sau khi export), ném lỗi HTTP 409 yêu cầu export lại. Giao dịch DB: chuyển DB sang trạng thái `deleted`, **thực hiện `DELETE FROM snapshot_employees WHERE snapshot_id = id` để dọn sạch dữ liệu cũ khỏi bảng nhân sự snapshot**, cập nhật counts bằng cách tính lại thực tế, đồng thời **bảo toàn nguyên vẹn mọi bản ghi tạm trong `snapshot_supplemental_pending`**. Ghi audit **`delete`**.
- [x] Task 2.5: Ghi Audit Log đầy đủ tái sử dụng các core action sẵn có (không nạp action mới để giữ semantic): 
    - `snapshot_create` cho tạo mới.
    - `snapshot_lock` cho khóa (**gán đồng thời `locked_at = NOW()` và `locked_by = email SA`**).
    - `snapshot_unlock` cho mở khóa (**clear `locked_at = NULL` và `locked_by = NULL`**).
    - `delete` (details: `type: 'snapshot_delete'`) cho hành động xóa snapshot.
    - `export` (details: `type: 'before_snapshot_delete'`) cho hành động xuất trước khi xóa snapshot.
- [x] Task 2.6: Viết router **`backend/src/routes/snapshots.ts`** (plural) ánh xạ các API prefix `/api/snapshots`. **[FR-62] Bổ sung hợp đồng API rõ ràng (đủ endpoints):** Router phải cài đặt `GET /` (list), `GET /active-keys` (đối chiếu khóa), `GET /:id` (detail), `POST /create`, `PUT /:id/lock`, `PUT /:id/unlock`, `POST /:id/commit` (upload bổ sung), `POST /:id/approve` (duyệt bổ sung), `POST /:id/reject` (từ chối bổ sung), `POST /:id/revoke` (thu hồi duyệt), `POST /:id/restore` (khôi phục full Excel), `GET /:id/export-before-delete`, `POST /:id/supplemental/preview`, `POST /:id/restore/preview`, `GET /template` (tải file mẫu) với validation rules chặt chẽ sử dụng các schema từ monorepo shared package. Bổ sung **State Guard**: `/lock` chỉ gọi từ `draft`; `/unlock` chỉ gọi từ `locked`; `DELETE /:id` và `/:id/export-before-delete` chỉ gọi từ `draft` (nếu deleted thì trả 409 SNAPSHOT_ALREADY_DELETED). **[FR-30] Route Hono Ordering (Rất Quan Trọng):** Bắt buộc khai báo các static routes (như `/active-keys`, `/template`) trước các dynamic parameterized routes (`/:id/*`) để tránh lỗi match nhầm Hono router. **[Phân quyền RBAC & Resource-based Auth chặt chẽ]:** 
    - **Nhóm 1 (SA, EA, VA):** `GET /` và `GET /:id` (VA chỉ được xem danh sách và chi tiết). Cần xác thực Resource-based Auth: Backend tự lấy `khoi` của thao tác và kiểm tra có quyền trên đúng `khoi` đó hay không. **Đặc biệt với `GET /`:** SA được xem toàn bộ; EA và VA bắt buộc chỉ được trả về danh sách các snapshot thuộc các `khoi` mà họ có quyền (Backend filter dựa trên mảng khối hợp lệ của user, tránh leak data).
    - **Nhóm 2 (SA & EA):** `/create`, `DELETE /:id` (xóa), `GET /:id/export-before-delete`, `/:id/commit` (nháp), `/:id/restore` (khôi phục full), `/:id/supplemental/preview`, `/:id/restore/preview`, `/template`. (Route `/template` là file Excel mẫu tĩnh, không chứa data nhạy cảm nên bỏ check `khoi`, chỉ cần Auth EA/SA chung).
    - **Nhóm 3 (SA-only):** `/lock`, `/unlock`, `/:id/approve`, `/:id/reject`, `/:id/revoke`.
    - **Nhóm 4 (Đối chiếu hệ thống):** `GET /active-keys` được bảo vệ bằng Header `x-api-key` thông qua so khớp với `INTERNAL_API_KEY`.
    - **Chặn hoàn toàn:** Tất cả các role khác (VI, Reviewer-only) không được gọi bất kỳ API nào.
- [x] Task 2.7: **[Sửa theo EFR-02 - Endpoint đối chiếu Active Keys]** Triển khai endpoint `GET /api/snapshots/active-keys`:
    - Nhận query parameter `thang` (ví dụ: `T6.2024` hoặc `T06.2024`), bóc tách năm và tháng rồi chuẩn hóa về dạng `YYYY-MM` (như `2024-06`). Trả về mã lỗi 400 nếu tham số `thang` truyền sai định dạng.
    - **[Quan trọng] Thực hiện Query kết hợp lọc theo tháng:** Query bảng `snapshot_employees` kết hợp JOIN với bảng `snapshots` để lọc đúng điều kiện `snapshots.month = normalizedMonth` và `snapshots.snapshot_status != 'deleted'` nhằm thu được danh sách tổ hợp `ma_nhan_su` và `khoi` của đúng tháng đó.
    - Trả về JSON array danh sách tổ hợp khóa được viết hoa và trim khoảng trắng thừa có format: `["T6.2024-101132-ADM", "T6.2024-101133-KNS", ...]`.
    - Bảo vệ endpoint bằng Header `x-api-key` so khớp với `INTERNAL_API_KEY`. Nếu thiếu hoặc sai key, trả HTTP 401 Unauthorized.
- [x] Task 2.8: **[Đăng ký Route Backend - Point 8]** Đăng ký **`snapshotsRoutes`** vào file entrypoint của backend (`backend/src/index.ts`) dưới prefix `/api/snapshots`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 - Viết integration test cho API Lock/Unlock (verify `locked_by` được gán đúng email SA khi Lock và clear NULL khi Unlock). Test chặn duyệt/submit cũng như chặn ghi trực tiếp qua `PUT /api/employees/:id/state` khi đã khóa và cho phép CRUD nháp lương bình thường. **[Sửa theo EFR-64] Bổ sung test submit pending cho reviewer fields sau khi anti-drift được thêm:** Thực hiện kiểm thử duyệt submit pending chứa `reviewer_emails` và `nguoi_nghiem_thu_thu_viec`, kiểm tra dữ liệu thay đổi và ghi nhận chính xác trong bảng `employee_reviewers` và `change_history` mà không bị ảnh hưởng bởi logic chặn locked period (nếu ngoài period locked) và chặn đúng nếu rơi vào locked period. **[Sửa theo EFR-02] Test API active-keys:** Viết integration tests kiểm tra `GET /api/snapshots/active-keys` (verify: trả 401 nếu thiếu/sai x-api-key, trả 400 nếu sai param `thang`, chuẩn hóa đúng T6.2024 / T06.2024, bỏ qua các snapshot đã xóa, trim/uppercase mã nhân sự và khối). **Bổ sung test cross-month:** Tạo dữ liệu của 2 tháng khác nhau (tháng 5 và tháng 6) chứa cùng một nhân viên, thực hiện gọi API với `thang=T6.2024` và verify chỉ trả về key của tháng 6, không bao gồm key của tháng 5/7. **[FR-14] Test guard xóa locked:** Gọi `DELETE /api/snapshots/:id` khi snapshot đang `locked` -> verify trả HTTP 409 `SNAPSHOT_LOCKED`. Gọi lại sau khi unlock -> verify xóa thành công. **Test soft-delete thực hiện DELETE xóa sạch các bản ghi thuộc snapshot_id đó trong snapshot_employees, reset counts về 0 và bảo toàn bảng tạm pending.**


---

## Phase 3: Frontend UI

**Mục tiêu:** Xây dựng màn hình quản lý chốt tháng, thực hiện chốt khối, xóa snapshot, thao tác lock/unlock của SA, và các thao tác liên quan.

- [x] Task 3.1: **[UI & Phân quyền đồng bộ - Point 5]**
    - **Khởi tạo trang Snapshots mới:** Tạo mới file `frontend/src/pages/Snapshots/index.tsx` và wire route tại `App.tsx` để thay thế cho PlaceholderPage cũ. Thêm các Tab: "Chốt Chính Thức", "Chốt Bổ Sung".
    - **Cấp quyền VA nhưng dạng Read-only:** Cập nhật `frontend/src/components/ProtectedRoute.tsx` (cho phép SA, EA, và VA truy cập route `/snapshots`, chặn hoàn toàn VI-only và Reviewer-only (nếu user có quyền EA/VA/SA hợp lệ thì được xử lý theo quyền đó dù đồng thời là reviewer)) và `MainLayout.tsx` (hiển thị menu Snapshot đối với tài khoản SA, EA, VA, ẩn hoàn toàn đối với VI-only, Reviewer-only). Tuy nhiên, trên UI trang Snapshots, VA chỉ có thể xem danh sách và chi tiết, mọi nút thao tác (Chốt, Xóa, Lock/Unlock) phải bị vô hiệu hóa hoặc ẩn.
    - **Đồng bộ tài liệu nghiệp vụ:** Cập nhật file `docs/business-flows/09-chot-danh-sach-thang.md` (và các tài liệu nghiệp vụ liên quan) để ghi rõ VA chỉ có quyền xem (Read-only) dữ liệu snapshot.
- [x] Task 3.2: Render bảng danh sách các đợt chốt hiển thị Tháng, Khối, Số lượng NS, Status, Ngày khóa (`locked_at`), Người khóa (`locked_by`). **[FR-17]** Dữ liệu "Người khóa" lấy từ cột `locked_by` của bảng `snapshots` (không dùng `snapshot_by` vì đó là người tạo snapshot).
- [x] Task 3.3: Thêm logic thao tác "Chốt khối" trên UI:
    - EA chọn Tháng + Khối: Gọi API check trạng thái chặn. Nếu bị chặn, vô hiệu hóa nút Chốt và hiển thị thông báo popup giải thích lý do (danh sách nhân sự phòng chờ vướng ngày hiệu lực).
    - EA bấm Chốt: Gọi API Create.
- [x] Task 3.4: Thêm thao tác "Xóa đợt chốt" với luồng 2 bước: Bước 1 gọi API Export file Excel về máy. Bước 2 bật Modal xác nhận "Bạn đã tải file, xác nhận chuyển trạng thái xóa?", user ấn OK thì gọi API soft-delete. **[FR-14]** Vô hiệu hóa (disable) nút Xóa khi snapshot đang ở trạng thái `locked` và hiển thị tooltip "Cần mở khóa trước khi xóa". **Nếu snapshot đang ở trạng thái `deleted`, bắt buộc phải ẩn hoàn toàn nút Xóa và Export (chỉ hiển thị nút/menu Khôi phục đợt chốt gốc).** (Không có bất kỳ kiểm tra hay đồng bộ Google Sheets).
- [x] Task 3.5: Thêm Action Lock/Unlock (chỉ hiển thị cho tài khoản SA).

- [x] Task 3.Final: 🧪 Test & Verify Phase 3 - Đăng nhập tài khoản EA -> Đăng nhập tài khoản SA -> Test tài khoản `VA` -> verify vào được `/snapshots` (read-only, không thấy các nút Chốt/Xóa/Lock/Unlock). Test tài khoản `Reviewer-only` -> verify bị chặn hoàn toàn. Test tài khoản `[Reviewer, EA]` -> verify được vào với tư cách EA.

---

## Phase 4: Additional Finalization Flow (Excel Upload Chốt bổ sung)

**Mục tiêu:** Cung cấp tính năng upload Excel chốt bổ sung, lưu bảng tạm và cho phép SA duyệt lẻ từng nhân sự để append vào snapshot (không đồng bộ Google Sheets).

- [x] Task 4.1: (Đã xử lý thêm cột `is_supplemental` ở Phase 1).
- [x] Task 4.2: **[Blocker FR-06 & FR-16]** Xây dựng endpoint phân tích file Excel chốt bổ sung (`/preview`), áp dụng `bodyLimit` tối đa 5MB và `sensitiveRateLimiter`.
    - **[FR-16 & FR-59] Chống zip bomb/parse expansion:** Trong quá trình stream/parse workbook ra JSON, Backend bắt buộc phải đo kích thước uncompressed thực tế của các JSON objects. Kiểm tra: (a) Tổng số dòng không vượt MAX_ROWS = 5000, (b) Kích thước chuỗi JSON giải nén không vượt MAX_UNCOMPRESSED = 50MB, (c) Timeout parse 30 giây. Nếu vượt ngưỡng, trả HTTP 413.
    - **Validate Tồn tại:** Chặn cứng nếu khối và tháng đó chưa được tạo snapshot gốc. **[FR-49] Bắt buộc chặn tải lên nếu snapshot không ở trạng thái `draft` (trả HTTP 409 nếu `locked` hoặc `deleted`).**
    - **Validate Trùng lặp:** Chặn cứng nếu `ma_nhan_su` đã tồn tại trong bản chốt hiện tại.
    - **[FR-54] Whitelist/Sanitize:** Tương tự luồng Full Restore, bắt buộc chỉ map các business columns hợp lệ từ Excel, gạt bỏ hoàn toàn mọi cột hệ thống và các cột lương target/aggregate để chống rác DB.
    - **Validate Khối:** Cảnh báo vàng nếu lệch Khối (EA được phép ghi chú).
- [x] Task 4.3: Xây dựng endpoint lưu dữ liệu vào bảng tạm (`/commit`): Lưu thông tin vào `snapshot_supplemental_pending`. **[FR-53] Bắt buộc Re-validate:** Trước khi upsert vào bảng tạm, Backend phải validate lại một lần nữa: Check Khối hợp lệ, Check Snapshot BẮT BUỘC ở trạng thái `draft` (từ chối nếu `locked` hoặc `deleted`), loại bỏ duplicate nội bộ trong file Excel, và chặn trùng với master data `snapshot_employees` hiện tại.
- [x] Task 4.4: **[Blocker FR-04 & FR-13 Atomic RPC]** Xây dựng endpoint cho SA duyệt chốt bổ sung (`/approve`). **[FR-13 & FR-34] Khi SA duyệt, toàn bộ chuỗi thao tác sau phải được thực hiện trong một SQL RPC transaction duy nhất** (SECURITY DEFINER) có `SELECT ... FOR UPDATE` lock dòng pending để chống double-click và race condition. **[FR-34] Hỗ trợ bulk approve All-or-nothing:** Nhận mảng `pending_ids` và `p_actor_email`. Nếu bất kỳ dòng nào lỗi/không tồn tại, toàn bộ RPC tự động rollback và trả HTTP 400 kèm chi tiết lỗi (`pending_id` nào hỏng):
    - (a) Kiểm tra dòng pending: Nếu `pending_id` không tồn tại hoặc có trạng thái `rejected` (EA chưa re-upload thành pending), RPC lập tức **RAISE EXCEPTION (với mã lỗi riêng, backend sẽ bắt và map thành lỗi HTTP 400)** và rollback toàn bộ batch để báo cho SA biết UI đang bị stale. **Chỉ khi** dòng pending đang có trạng thái `approved` (do SA lỡ click 2 lần), RPC mới coi đây là No-op Idempotent (bỏ qua dòng đó). Dòng nào đang `pending` thì tiến hành xử lý tiếp. **[FR-50] Bắt buộc SELECT kiểm tra Snapshot:** Snapshot phải tồn tại, đúng khối, KHÔNG `deleted`, KHÔNG `locked`. **[FR-41] Kiểm tra `ma_nhan_su` có còn tồn tại trong bảng master `employees` (RAISE EXCEPTION nếu master đã bị xóa/đổi mã).**
    - (b) Insert bản ghi vào `snapshot_employees`, gán `is_supplemental = true` và **ép zero toàn bộ các field thuộc danh sách SUPPLEMENTAL_ZERO_FIELDS (TẤT CẢ các cột lương target/cc/m1/m2/m3/tv, v.v...)**. Gán `updated_by = p_actor_email`, `updated_at = now()`, `created_at = now()`.
    - (c) **[FR-28] Tính lại** `supplemental_employees_count` trong bảng `snapshots` bằng `SELECT COUNT(*) WHERE is_supplemental = true` (tuyệt đối không dùng `count = count + 1` để chống drift).
    - (d) Đổi trạng thái bản ghi trong bảng tạm thành `approved`.
    - **[FR-27] Return newly approved rows:** RPC phải trả về một mảng chứa **chỉ các `pending_id` thực sự vừa được chuyển trạng thái** trong lượt gọi này.
    - **Không tích hợp Google Sheets:** Không thực hiện bất kỳ lệnh append hay đồng bộ nào lên Google Sheets sau khi duyệt.
- [x] Task 4.5: Xây dựng UI Upload Excel (EA): Chỉ sáng khi đã chốt gốc. Hiển thị bảng Preview, bắt buộc nhập ghi chú nếu lệch khối.
- [x] Task 4.6: Xây dựng UI Duyệt chốt bổ sung (SA): Hiển thị danh sách nhân sự từ bảng tạm `snapshot_supplemental_pending` kèm ghi chú, hỗ trợ tích chọn duyệt/từ chối lẻ hoặc bulk action. **[FR-51] Phân rã luồng `/reject` và `/revoke`:** 
    - `/reject`: Từ chối dòng `pending`, đổi trạng thái sang `rejected`. Ghi Audit log sử dụng action `update` kèm `details: { type: 'supplemental_reject', target_ma_nhan_su: ... }`.
    - `/revoke`: Thu hồi dòng đã duyệt (`approved`). **Bắt buộc kiểm tra Snapshot KHÔNG locked và KHÔNG deleted.** Phải là một RPC riêng thực hiện: `DELETE FROM snapshot_employees` (dòng tương ứng), đổi status dòng tạm về `pending`, tính lại count `SELECT COUNT(*)`. Ghi Audit log sử dụng action `update` kèm `details: { type: 'supplemental_revoke', target_ma_nhan_su: ... }`.
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 - Upload trùng bị chặn -> SA duyệt lẻ thành công -> Verify database ghi nhận `is_supplemental = true`, các cột `luong_target_gt`, `luong_target_cc` và tất cả các component liên quan = 0. Verify re-finalization bảo toàn các dòng bổ sung đã duyệt (ngoại trừ các dòng bị trùng mã với nhân sự chính thức mới từ Live Master sẽ bị ghi đè và chuyển sang status `'rejected'`) chính xác. **Test case Idempotent Approve:** Gọi approve lại cho dòng đã approved, xác nhận RPC trả về mảng rỗng và không gây lỗi trùng lặp.

---

## Phase 5: Full Excel Upload Flow (Excel Upload Đầy Đủ)

**Mục tiêu:** Cho phép upload đè toàn bộ danh sách chốt bằng Excel trong trường hợp đã xóa snapshot, tự động khôi phục (không đồng bộ Google Sheets).

- [x] Task 5.1: Tạo endpoint API sinh file Excel mẫu (Template) dựa trên cấu trúc các cột của `snapshot_employees`. Set cell format chuẩn (Text, Number, Date dạng `yyyy-MM-dd`).
- [x] Task 5.2: **[Blocker FR-06 & FR-16]** Xây dựng endpoint phân tích file Excel chốt đầy đủ, áp dụng `bodyLimit` 5MB. **[FR-16 & FR-59] Chống zip bomb/parse expansion:** Tương tự Task 4.2 — kiểm tra MAX_ROWS = 5000, đo lường tổng kích thước chuỗi JSON bung ra không vượt MAX_UNCOMPRESSED = 50MB, timeout parse 30s. Thực hiện validation cứng tương tự luồng chốt trực tiếp. **Validate & Chuẩn hóa cột `is_supplemental`:** Bỏ qua hoàn toàn cột `is_supplemental` nếu có trong Excel. Gán cứng toàn bộ `is_supplemental = false` để phục vụ luồng khôi phục tĩnh. **[FR-35] Validate Duplicate `ma_nhan_su`:** Trong quá trình parse JSON Array từ Excel, bắt buộc dùng một `Set` để kiểm tra trùng mã nhân sự ngay trong bộ nhớ. Nếu phát hiện trùng, trả HTTP 400 Bad Request ngay lập tức trước khi chạm vào DB UNIQUE constraint.
- [x] Task 5.3: **[Khôi phục Snapshot đầy đủ - Point 7 & FR-19 Atomic Restore]** Xây dựng endpoint lưu dữ liệu chốt đầy đủ.
    - **[FR-19] Gom vào một SQL RPC transaction duy nhất (`restore_snapshot_from_excel`)** nhận `p_snapshot_id`, `p_rows JSONB` và **[FR-52] `p_actor_email VARCHAR`**. Trong RPC này thực hiện:
      - Sẽ update snapshot từ trạng thái `deleted` về lại `draft` (tái sử dụng dòng deleted để tránh UNIQUE constraint).
      - **[FR-56] Tẩy trắng:** Bắt buộc chạy lệnh `DELETE FROM snapshot_employees WHERE snapshot_id = p_snapshot_id` để dọn dẹp sạch sẽ mọi tàn dư trước khi insert mới (tự bảo vệ idempotent).
      - Lặp insert toàn bộ dữ liệu từ JSONB vào bảng `snapshot_employees`. Server bỏ qua cột `is_supplemental` từ file. **Ràng buộc nghiệp vụ:** Tất cả các dòng đều insert với `is_supplemental = false`, **TUYỆT ĐỐI KHÔNG ép zero SUPPLEMENTAL_ZERO_FIELDS**. **[FR-40] Whitelist Cột Khôi phục:** RPC phải áp dụng danh sách whitelist cột (chỉ update/insert các business columns từ JSONB), tự động ghi đè an toàn các cột hệ thống để chống file bị sửa đổi bẩn (`id` sinh UUID mới, gán đúng `snapshot_id`, override `created_at/updated_at`, gán `updated_by = p_actor_email`).
      - Tự động cập nhật **`total_employees` bằng tổng số dòng import** và gán cứng **`supplemental_employees_count = 0`**, ghi log audit đầy đủ. Nếu bất kỳ bước nào lỗi, toàn bộ RPC tự động rollback. (Không đồng bộ hay gọi đến Google Sheets).
- [x] Task 5.4: Xây dựng UI khôi phục Snapshot (Point 3 - Hai Luồng Khôi Phục): Khi Snapshot ở trạng thái `deleted`, giao diện UI sẽ hiển thị **hai tùy chọn khôi phục rõ ràng** để tối ưu UX:
    1. Nút **"Khôi phục & Chốt lại (Live Master)"**: Cho phép EA bấm chốt lại tức thì (kích hoạt standard RPC kéo dữ liệu master sống để tính toán lại).
    2. Nút **"Khôi phục từ Excel Backup"**: Cho phép EA upload tệp Excel backup tĩnh đã tải xuống trước đó để khôi phục chính xác trạng thái snapshot tĩnh.
- [x] Task 5.Final: 🧪 Test & Verify Phase 5 - Xóa snapshot -> Kiểm thử cả 2 nhánh khôi phục:
    1. **Test nhánh Khôi phục Live Master & Tự động phục hồi Bổ sung:** Duyệt chốt bổ sung thành công (`approved`, có cờ `is_supplemental = true` trong `snapshot_employees` và `supplemental_employees_count = 1`). Thực hiện Xóa snapshot -> Verify snapshot chuyển trạng thái `deleted`, headcount và count bổ sung reset về 0, nhân viên bị xóa khỏi `snapshot_employees`, bảng tạm pending vẫn bảo toàn nguyên vẹn dòng approved. Click nút "Khôi phục & Chốt lại (Live Master)" -> Verify snapshot khôi phục lại thành `draft`, tự động chèn lại dòng chốt bổ sung cũ vào `snapshot_employees`, tự động thiết lập lại `supplemental_employees_count = 1` chính xác mà không cần SA duyệt lại. Xóa tiếp snapshot lần 2. **(Bổ sung Test Trùng Mã Nhân Sự):** Thêm dữ liệu vào Live Master chứa nhân sự chính thức mới có cùng `ma_nhan_su` với dòng chốt bổ sung đã approved. Thực hiện khôi phục Live Master -> Verify dòng chính thức mới ghi đè hoàn toàn dòng bổ sung trong `snapshot_employees` (cột `is_supplemental` đổi thành `false`, giữ lương thực tế), trạng thái của dòng chốt bổ sung tương ứng trong bảng tạm `snapshot_supplemental_pending` bị tự động đổi thành `'rejected'`, đồng thời verify bảng `audit_log` ghi nhận dòng log tương ứng với `actor_email = 'system-refinalization-override@vcc.internal'`, `module = 'NS-003'`, `action = 'update'`, `target_ma_nhan_su = ma_nhan_su`, và `details` chứa đúng type = 'supplemental_auto_rejected' để đảm bảo truy vết nghiệp vụ chính xác.
    2. **Test nhánh Khôi phục từ Excel Backup:** Click nút "Khôi phục từ Excel Backup" -> Upload file Excel tĩnh 2 dòng, dù có cột `is_supplemental = true` thì backend vẫn bỏ qua -> Khôi phục thành công về `draft` -> Verify cả 2 dòng đều `is_supplemental = false`, `total_employees = 2`, `supplemental_employees_count = 0`, không áp dụng SUPPLEMENTAL_ZERO_FIELDS. (Đã xóa test case boolean edge cases vì không còn sử dụng cờ `is_supplemental` trong luồng Full Restore).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-14 17:35 | Phase 1 | Task 1.1 | Bắt đầu cập nhật shared contract và env variables config | start | |
| 2026-07-14 17:40 | Phase 1 | Task 1.1 | Hoàn tất cập nhật shared schemas, index, và backend/src/config/env.ts | done | |
| 2026-07-14 17:41 | Phase 1 | Task 1.2 | Bắt đầu tạo file migration 038_update_snapshot_logic.sql | start | |
| 2026-07-14 17:42 | Phase 1 | Task 1.Final | Hoàn tất chạy migration 038 và viết integration test cho is_period_locked | done | |
| 2026-07-14 17:43 | Phase 2 | Task 2.1 | Bắt đầu viết hàm utils tính kỳ lương getPeriodDates | start | |
| 2026-07-14 17:44 | Phase 2 | Task 2.1 | Hoàn tất viết hàm getPeriodDates và build shared package thành công | done | |
| 2026-07-14 17:45 | Phase 2 | Task 2.2 | Bắt đầu tích hợp Anti-Drift Guard cho live-write paths và helper validation | start | |
| 2026-07-14 17:50 | Phase 2 | Task 2.2 | Tích hợp thành công helper isPeriodLocked vào routes PUT /:id, PUT /:id/state và DELETE /:id | done | |
| 2026-07-14 17:51 | Phase 2 | Task 2.4 | Bắt đầu thiết kế API export-before-delete, delete snapshot và audit logs | start | |
| 2026-07-14 17:55 | Phase 2 | Task 2.Final | Hoàn tất tất cả test tích hợp Phase 2 đạt 100% | done | |
| 2026-07-14 18:05 | Phase 3 | Task 3.1 | Bắt đầu khởi tạo trang Snapshots mới và cấu hình phân quyền | start | |
| 2026-07-14 18:23 | Phase 3 | Task 3.Final | Hoàn tất kiểm thử và verify giao diện Phase 3 thành công | done | |
| 2026-07-14 18:24 | Phase 4 | Task 4.2 | Bắt đầu xây dựng API preview chốt bổ sung từ file Excel | start | |
| 2026-07-14 18:27 | Phase 4 | Task 4.2 | Hoàn tất API preview chốt bổ sung và xử lý an toàn zip bomb | done | |
| 2026-07-14 18:28 | Phase 4 | Task 4.3 | Bắt đầu thiết kế API commit bảng tạm chốt bổ sung | start | |
| 2026-07-14 18:31 | Phase 4 | Task 4.3 | Hoàn tất API commit bảng tạm với cơ chế Re-validate đầy đủ | done | |
| 2026-07-14 18:32 | Phase 4 | Task 4.4 | Bắt đầu viết SQL RPC và API approve chốt bổ sung | start | |
| 2026-07-14 18:34 | Phase 4 | Task 4.4 | Hoàn tất API approve, reject, revoke chốt bổ sung và các RPC functions | done | |
| 2026-07-14 18:35 | Phase 4 | Task 4.5 | Bắt đầu tích hợp giao diện Upload Excel và Preview cho EA | start | |
| 2026-07-14 18:40 | Phase 4 | Task 4.5 | Hoàn tất giao diện Upload Excel, Preview bảng tạm, bắt buộc nhập Note giải thích lệch khối | done | |
| 2026-07-14 18:41 | Phase 4 | Task 4.6 | Bắt đầu tích hợp giao diện duyệt, từ chối và thu hồi của SA | start | |
| 2026-07-14 18:45 | Phase 4 | Task 4.6 | Hoàn tất giao diện SA Duyệt chốt bổ sung, tích chọn bulk approve/reject và revoke | done | |
| 2026-07-14 18:46 | Phase 4 | Task 4.Final | Chạy toàn bộ suite integration tests cho snapshots bổ sung | start | |
| 2026-07-14 18:55 | Phase 4 | Task 4.Final | Tất cả 104 integration tests chạy thành công 100%, kết thúc Phase 4 | done | |
| 2026-07-14 18:57 | Phase 5 | Task 5.1 | Bắt đầu xây dựng API /template Excel mẫu để khôi phục | start | |
| 2026-07-14 18:58 | Phase 5 | Task 5.1 | Hoàn tất API /template Excel cho khôi phục snapshot | done | |
| 2026-07-14 18:59 | Phase 5 | Task 5.2 | Bắt đầu xây dựng API preview khôi phục Excel và validation duplicate | start | |
| 2026-07-14 19:00 | Phase 5 | Task 5.2 | Hoàn tất API preview và validation trong bộ nhớ cho file khôi phục | done | |
| 2026-07-14 19:01 | Phase 5 | Task 5.3 | Bắt đầu thiết kế SQL RPC restore_snapshot_from_excel và API save restore | start | |
| 2026-07-14 19:02 | Phase 5 | Task 5.3 | Hoàn tất API save restore và RPC transaction an toàn | done | |
| 2026-07-14 19:03 | Phase 5 | Task 5.4 | Bắt đầu phát triển giao diện Khôi phục với 2 luồng rõ ràng | start | |
| 2026-07-14 19:05 | Phase 5 | Task 5.4 | Hoàn tất UI khôi phục: Live Master và Excel upload | done | |
| 2026-07-14 19:06 | Phase 5 | Task 5.Final | Thiết kế các ca kiểm thử tích hợp cho khôi phục và chạy test | start | |
| 2026-07-14 22:29 | Phase 5 | Task 5.Final | Toàn bộ 108/108 integration tests pass — Phase 5 hoàn tất | done | Fix: audit action bulk_import→snapshot_create; fix test dùng employee thực; tạo function restore_snapshot_from_excel trên DB và reload PGRST schema cache |
