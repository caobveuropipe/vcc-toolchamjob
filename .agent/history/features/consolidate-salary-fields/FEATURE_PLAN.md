# Feature Plan: Consolidate Salary Fields & Align Formulas

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Khuyến nghị gọi `feature-review` để duyệt migration và ảnh hưởng công thức UI. **Yêu cầu bắt buộc: User review và xác nhận kết quả backup/migration trước khi áp dụng DB thực tế.**
> **Feature slug**: consolidate-salary-fields
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-15

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Dữ liệu lương nội bộ đang có sự dư thừa/xung đột giữa trường lưu trực tiếp từ OCR/Onboarding (`okr_cc`, `thuong_doanh_so_cc`) và trường lưu theo cơ chế thưởng M1 (`thuong_okr_m1`, `thuong_doanh_so_m1`).
- **Vấn đề cần giải quyết:** Tên các trường cũ trong DB và hệ thống đặt chưa đồng nhất, nhưng hiện tại chưa thực hiện đổi tên trường vật lý trong DB để tránh rủi ro. Thay vào đó, cần dọn dẹp dữ liệu rác, sao lưu phần dữ liệu bị xóa vào thư mục `database_backups/`, và cập nhật lại công thức hiển thị trên giao diện chi tiết lương Bộ Cơ chế (Nội bộ) cùng cơ chế tự động gán hiệu suất tạm thời khi duyệt lương nhân viên mới.
- **Mục tiêu:**
  1. Giữ nguyên cấu trúc các trường vật lý trong DB.
  2. Thực hiện sao lưu dữ liệu của tất cả các bản ghi có dữ liệu không null (`okr_cc IS NOT NULL OR thuong_doanh_so_cc IS NOT NULL`) tại các trường sắp bị xóa, sau đó ghi file backup JSON vào thư mục [database_backups](file:///d:/ToolNhanSuVcc/database_backups/). <!-- Sửa theo EFR-01: Thống nhất predicate backup và clear để assert count chuẩn xác -->
  3. Set NULL cho hai trường `okr_cc` và `thuong_doanh_so_cc` đối với các dòng dữ liệu này trong DB. (Việc dọn dẹp dữ liệu trùng của 3 nhân sự cũ được tách sang một plan riêng sau này).
  4. Sửa lại công thức validate lương core để đưa `nhuan_but_cc` vào tính toán chính thống.
  5. Cập nhật cơ chế gán động phần Hiệu suất chưa phân loại khi người nghiệm thu mở Modal phê duyệt/cập nhật lương cho nhân viên mới.
  6. Cung cấp bảng ánh xạ (Mapping) chuẩn hóa giữa Tên hiển thị UI và Tên trường DB làm tài liệu tham khảo.

---

## 2. Phạm vi

### In scope
- **Sao lưu & Dọn dẹp dữ liệu (Có Guardrails & Preflight):** <!-- Sửa theo EFR-01: Dùng chung predicate IS NOT NULL cho backup và clear -->
  - Tạo script Node.js kết nối DB, truy xuất và ghi file backup JSON chứa tất cả bản ghi có giá trị `okr_cc IS NOT NULL OR thuong_doanh_so_cc IS NOT NULL`.
    Lưu tệp backup dưới dạng JSON vào thư mục [database_backups](file:///d:/ToolNhanSuVcc/database_backups/).
  - Cập nhật `.gitignore` hoặc `database_backups/.gitignore` để tự động loại bỏ các tệp backup lương nhạy cảm (`backup_mismatch_*.json`) khỏi Git tracking. <!-- Sửa theo EFR-01: Bảo vệ privacy của dữ liệu backup -->
  - Tạo SQL migration `039_clear_redundant_salary.sql` chạy trong block `BEGIN ... COMMIT` (Transaction):
    - Thực hiện set `NULL` cho các cột `okr_cc` và `thuong_doanh_so_cc` với điều kiện `WHERE okr_cc IS NOT NULL OR thuong_doanh_so_cc IS NOT NULL`.
    - Đếm và assert chính xác số dòng được thay đổi bằng đúng số lượng bản ghi trong file backup.
    - Nếu count không khớp hoặc backup JSON chưa được user phê duyệt, abort/rollback transaction.
- **Cập nhật công thức validate core (`salary-validation.ts`):**
  - Đưa `nhuan_but_cc` vào công thức validate CC Target:
    `Sum CC = luong_cb + thuong_hieu_suat_cham_job_nhuan + thuong_kpi_m1 + thuong_okr_m1 + thuong_doanh_so_m1 + thuong_du_an_m1 + nhuan_but_cc (+ thuong_kiem_nhiem_m1 nếu checked)`
  - Cập nhật unit test trong `packages/shared/src/tests/salary-validation.test.ts` để kiểm thử trường hợp có `nhuan_but_cc`. <!-- Sửa theo EFR-02: Cập nhật unit test cho packages/shared -->
- **Sửa giao diện tóm tắt lương Nội bộ (`EmployeeDetailPage.tsx`):**
  - **Lương cố định**: hiển thị từ trường `luong_cb`
  - **Hiệu suất**: hiển thị tổng các trường (`thuong_hieu_suat_cham_job_nhuan` + `thuong_kpi_m1` + `thuong_doanh_so_m1` + `thuong_du_an_m1` + (`thuong_kiem_nhiem_m1` chỉ cộng khi `is_target_cc_include_kn_m1` bật)). <!-- Sửa theo EFR-02: Đồng nhất công thức Hiệu suất UI với validation core -->
  - **Nhuận bút**: hiển thị từ trường `nhuan_but_cc`
  - **OKR**: hiển thị từ trường `thuong_okr_m1`
  - **Thưởng KD**: để trống / hiển thị `-` (vì đã được gộp vào Hiệu suất ở trên)
  - **Tổng thu nhập**: Tính toán động bằng tổng 4 thành phần hiển thị trên (`Lương cố định` + `Hiệu suất` + `Nhuận bút` + `OKR`). Khoản `thuong_kiem_nhiem_m1` nếu ngoài target (checkbox tắt) sẽ hiển thị ở dòng riêng/tooltip hoặc không cộng vào Tổng thu nhập đối chiếu. <!-- Sửa theo EFR-02: Không cộng KN ngoài target vào tổng đối chiếu -->
  - **Cảnh báo lệch (Yellow Warning)**: So sánh Tổng thu nhập đối chiếu ở trên với giá trị `luong_target_cc` trong DB. Nếu khác nhau, hiển thị một icon cảnh báo màu vàng kèm Tooltip chi tiết ngay sát cạnh con số hiển thị.
- **Cập nhật Form Onboarding (`EmployeeForm.tsx`) & Logic Auto-fill:**
  - Sửa `DocumentUpload.tsx`:
    - Phần hiển thị kết quả AI: Dòng "OKR" hiển thị `okr_cc` từ kết quả AI; dòng "Thưởng KD" (Nội bộ) được ẩn đi.
    - Nút **Tự điền thông tin (Auto-fill)**: map `okr_cc` từ AI sang form field `thuong_okr_m1`. Bỏ qua không điền `thuong_doanh_so_cc`.
  - Sửa form nhập liệu Onboarding `EmployeeForm.tsx`:
    - Thay thế các trường nhập liệu cũ: OKR $\rightarrow$ `thuong_okr_m1`, Nhuận bút $\rightarrow$ `nhuan_but_cc`.
    - **Hiển thị ô Hiệu suất và loại bỏ lưu DB:** Ô nhập liệu "Hiệu suất" (Nội bộ) vẫn được hiển thị cho người dùng trên giao diện. Tuy nhiên, trước khi submit/gửi lên server, frontend sẽ tự động xóa trường `thuong_hieu_suat_cham_job_nhuan` và `thuong_doanh_so_cc` để đảm bảo không lưu vào DB (để trống/NULL).
    - **Sửa Logic Fallback (khi phần Cơ chế trống):** Khi Khối Cơ chế trống, form sẽ copy `okr_gt` sang `thuong_okr_m1` (thay vì `okr_cc`) và copy `nhuan_but_gt` sang `nhuan_but_cc`. Đặc biệt, **Lương cố định (CC) = Lương cố định (GT) + Thưởng KD (GT)** (sao chép `processed.luong_cb = lcd_gt + thuong_doanh_so_gt`). Loại bỏ hoàn toàn việc copy `okr_cc`, `thuong_doanh_so_cc` và không tự copy Hiệu suất/Thưởng KD sang CC.
- **Cập nhật Modal Cập nhật lương (`SalaryEditModal.tsx`):**
  - **Tính toán gán động phần Hiệu suất chưa phân loại:** Khi mở Modal để sửa lương cho nhân viên ở trạng thái chờ duyệt (thuộc phòng chờ `state_phong_cho === true`): <!-- Sửa theo EFR-02: unallocated trừ tất cả các M1 components -->
    - Tự động tính toán phần chênh lệch chưa phân bổ: `unallocated = luong_target_cc - luong_cb - nhuan_but_cc - thuong_okr_m1 - thuong_kpi_m1 - thuong_doanh_so_m1 - thuong_du_an_m1 - (is_target_cc_include_kn_m1 ? thuong_kiem_nhiem_m1 : 0)`.
    - Nếu `unallocated > 0` và trường `thuong_hieu_suat_cham_job_nhuan` đang trống: tự động điền `unallocated` vào trường `thuong_hieu_suat_cham_job_nhuan` (HS Chấm/Job/Nhuận).
    - Hiển thị Alert cảnh báo màu vàng trên modal: *"Hệ thống tự động gán phần lương hiệu suất chưa phân loại (...,...đ) vào ô 'HS Chấm/Job/Nhuận'. Vui lòng kiểm tra và chia chi tiết trước khi duyệt."*
- **Tài liệu hóa Mapping:** Viết bảng ánh xạ trường lương Nội bộ chuẩn.

### Out of scope
- Đổi tên vật lý các cột trong DB.
- Thay đổi prompt AI OCR của backend.
- Thay đổi logic Module snapshot tháng.
- Dọn dẹp dữ liệu trùng lặp của 3 nhân sự cũ (chuyển sang một kế hoạch riêng).

---

## 3. Bản ánh xạ Toàn bộ các trường lương trong hệ thống

Bảng dưới đây chuẩn hóa ánh xạ giữa Nhãn hiển thị trên giao diện (UI) và Tên cột trong Database thực tế (DB) cho toàn bộ các trường liên quan đến Lương & Cơ chế:

### A. Bộ Giấy tờ (Theo HĐLĐ)

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic |
| :--- | :--- | :--- |
| **Tổng thu nhập (GT)** | `luong_target_gt` | Target thu nhập ký kết trên hợp đồng |
| **Lương cố định (GT)** | `lcd_gt` | Lương cứng |
| **Hiệu suất (GT)** | `luong_hieu_suat_gt` | Thưởng hiệu suất |
| **Nhuận bút (GT)** | `nhuan_but_gt` | Thưởng nhuận bút |
| **OKR (GT)** | `okr_gt` | Thưởng OKR |
| **Thưởng KD (GT)** | `thuong_doanh_so_gt` | Thưởng kinh doanh / doanh số |

### B. Bộ Cơ chế (Nội bộ) - Base

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic |
| :--- | :--- | :--- |
| **Tổng thu nhập** | `luong_target_cc` | Target thu nhập cơ chế (Dùng để kiểm soát / Validate) |
| **Lương cố định** | `luong_cb` | Lương cứng cơ chế |
| **Hiệu suất** | *(Tính toán động)* | `= thuong_hieu_suat_cham_job_nhuan + thuong_kpi_m1 + thuong_doanh_so_m1 + thuong_du_an_m1 (+ thuong_kiem_nhiem_m1 nếu is_target_cc_include_kn_m1=true)` |
| **Nhuận bút** | `nhuan_but_cc` | Nhuận bút cơ chế |
| **OKR** | `thuong_okr_m1` | OKR cơ chế |
| **Thưởng KD** | *(Để trống)* | Để trống/`-` (Không dùng riêng do doanh số M1 đã gộp vào dòng Hiệu suất) |
| **Tạm ứng/tháng** | `tam_ung_hang_thang` | Số tiền tạm ứng hàng tháng |

### C. Cơ chế chi tiết - Thưởng M1 / M2 / M3

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic |
| :--- | :--- | :--- |
| **HS Chấm/Job/Nhuận** | `thuong_hieu_suat_cham_job_nhuan` | Thưởng hiệu suất chấm job nhuận CC |
| **KPI M1 / M2 / M3** | `thuong_kpi_m1`, `_m2`, `_m3` | Thưởng KPI theo từng tháng của quý |
| **OKR M1 / M2 / M3** | `thuong_okr_m1`, `_m2`, `_m3` | Thưởng OKR theo từng tháng |
| **DS M1 / M2 / M3** | `thuong_doanh_so_m1`, `_m2`, `_m3` | Thưởng doanh số / kinh doanh theo tháng |
| **Dự án M1 / M2 / M3** | `thuong_du_an_m1`, `_m2`, `_m3` | Thưởng dự án theo tháng |
| **KN M1 / M2 / M3** | `thuong_kiem_nhiem_m1`, `_m2`, `_m3` | Thưởng kiêm nhiệm theo tháng |

### D. Các cấu hình và thông tin khác

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic |
| :--- | :--- | :--- |
| **Bậc lương** | `bac_luong` | Cột bậc lương (text) |
| **Tỷ lệ lương Thử việc (%)** | `ty_le_luong_tv` | Tỷ lệ % hưởng lương khi thử việc |
| **Target (CC) bao gồm KN M1** | `is_target_cc_include_kn_m1` | Checkbox xác định tổng cơ chế có bao gồm thưởng kiêm nhiệm không |
| **Ngày điều chỉnh** | `ngay_dieu_chinh_luong` | Ngày bắt đầu áp dụng cơ chế lương mới |

### E. Các trường cũ/dư thừa (Sẽ bị xoá dữ liệu và ngưng sử dụng)

| Nhãn trên UI | Cột DB thực tế | Mô tả / Hành động |
| :--- | :--- | :--- |
| **OKR (CC)** | `okr_cc` | Trường OKR cc cũ $\rightarrow$ **Clear và Ngưng sử dụng** |
| **Thưởng DS (CC)** | `thuong_doanh_so_cc` | Trường thưởng doanh số cc cũ $\rightarrow$ **Clear và Ngưng sử dụng** |

---

## 4. Giả định và câu hỏi mở

### Giả định
- Dữ liệu backup được xuất ra dạng file JSON đặt tên theo cấu trúc: `database_backups/backup_mismatch_okr_ds_YYYYMMDD.json`.

---

## 5. Acceptance Criteria
- [ ] Dữ liệu cũ (giá trị không null: `IS NOT NULL`) của `okr_cc` và `thuong_doanh_so_cc` được xuất ra file JSON đặt tại [database_backups](file:///d:/ToolNhanSuVcc/database_backups/) an toàn.
- [ ] File backup JSON được ignore trong Git (`.gitignore` hoặc `database_backups/.gitignore`) và không bị đưa vào staged/tracked changes. <!-- Sửa theo EFR-01: Bảo vệ bảo mật dữ liệu lương -->
- [ ] User review và xác nhận file backup và migration OK trước khi xóa dữ liệu thực tế trên DB.
- [ ] Migration SQL được chạy trong transaction với assert row count chính xác dựa theo số lượng dòng được backup thực tế (đối với dòng không null), tự động abort nếu count lệch.
- [ ] Cả 2 trường `okr_cc` và `thuong_doanh_so_cc` trên DB được set về `NULL` cho tất cả các dòng không null.
- [ ] UI chi tiết lương Cơ chế hiển thị đúng Lương cố định, Hiệu suất (chỉ gộp `thuong_kiem_nhiem_m1` nếu checkbox bật), Nhuận bút, OKR, Thưởng KD (để trống).
- [ ] Tổng thu nhập hiển thị trên UI bằng tổng các thành phần hiển thị cộng lại, khớp hoàn toàn.
- [ ] Cảnh báo màu vàng xuất hiện khi và chỉ khi Tổng thu nhập tính toán thực tế khác biệt so với `luong_target_cc`.
- [ ] Nút "Tự điền thông tin" điền đúng trường `okr_cc` từ OCR vào form field `thuong_okr_m1` và bỏ qua thưởng KD nội bộ.
- [ ] Logic Fallback trong `EmployeeForm.tsx` copy đúng `okr_gt` $\rightarrow$ `thuong_okr_m1` và `nhuan_but_gt` $\rightarrow$ `nhuan_but_cc`, không tự ghi nhận `thuong_hieu_suat_cham_job_nhuan` hay `thuong_doanh_so_cc`.
- [ ] Modal Cập nhật lương tự động tính toán và điền phần hiệu suất chưa phân bổ vào `thuong_hieu_suat_cham_job_nhuan` (trừ đi tất cả các phần M1 khác bao gồm kiêm nhiệm nếu check bật) kèm Warning Alert cho hồ sơ có `state_phong_cho === true`.
- [ ] Unit test cho package shared (`packages/shared/src/tests/salary-validation.test.ts`) được bổ sung các case kiểm thử cho `nhuan_but_cc` và chạy pass 100%. <!-- Sửa theo EFR-02: Bổ sung unit test coverage -->

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/scratch_backup_mismatch.js` | Tạo mới | Script Node.js thực hiện export dữ liệu lệch ra file JSON | 🟢 | Không |
| `.gitignore` hoặc `database_backups/.gitignore` | Sửa | Ignore các file backup JSON lương nhạy cảm (`backup_mismatch_*.json`) | 🟢 | Không |
| `database/migrations/039_clear_redundant_salary.sql` | Tạo mới | Clear `okr_cc`, `thuong_doanh_so_cc` về NULL bằng Transaction/Assert | 🟢 | Có |
| `packages/shared/src/utils/salary-validation.ts` | Sửa | Cập nhật công thức validation đưa `nhuan_but_cc` vào bộ CC | 🟡 | Có |
| `packages/shared/src/tests/salary-validation.test.ts` | Sửa | Bổ sung test cases bao phủ `nhuan_but_cc` trong công thức CC | 🟢 | Không |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Sửa | Cập nhật lại công thức hiển thị lương Cơ chế và logic Warning | 🟢 | Có |
| `frontend/src/components/DocumentUpload.tsx` | Sửa | Cập nhật logic Auto-fill mapping và ẩn dòng Thưởng KD Nội bộ | 🟢 | Có |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Cập nhật trường nhập liệu Onboarding và sửa hàm xử lý logic Fallback | 🟢 | Có |
| `frontend/src/pages/Salaries/SalaryEditModal.tsx` | Sửa | Cập nhật logic tự tính và gán Hiệu suất tạm thời kèm Warning Alert | 🟢 | Có |

---

## 7. Risk Triage và Review Focus
- **Review required:** Yes (Bắt buộc User duyệt kết quả backup & migration)
- **Risk hotspots:** Đảm bảo script migration xóa dữ liệu chạy chính xác, không xóa nhầm cột hoặc ảnh hưởng đến dữ liệu lương khác.

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1: Backup & Clean DB:** Viết script backup dữ liệu không null (`IS NOT NULL`) -> Cấu hình ignore file backup -> Lưu file JSON -> User verify -> Chạy SQL clear dữ liệu trong transaction.
  - **Phase 2: Core Formula & UI Updates (Forms, Modals, Details):** Thay đổi công thức validate trong `salary-validation.ts`, cập nhật unit test `salary-validation.test.ts`, sửa công thức hiển thị trên `EmployeeDetailPage.tsx`, cập nhật Auto-fill và ẩn Thưởng KD trong `DocumentUpload.tsx`, sửa form Onboarding `EmployeeForm.tsx`, và tích hợp logic tính động / Warning Alert trên `SalaryEditModal.tsx`.
- **Yêu cầu migration / config / deploy:** Cần run script migration SQL `039_clear_redundant_salary.sql` trên production (Supabase).

## 9. Test Strategy

- **Automated tests:** 
  - Chạy `pnpm --filter @vcc/shared test` (hoặc tương đương) để verify thay đổi của core formula. <!-- Sửa theo EFR-02: Đảm bảo chạy unit test package shared -->
  - Chạy `pnpm --filter backend test` để đảm bảo hệ thống API không bị ảnh hưởng.
  - Chạy snapshot integration tests để chứng minh module snapshot không bị ảnh hưởng.
- **Manual verification:**
  - Chạy `git status` trước khi commit/deploy để kiểm tra chắc chắn các file backup JSON không nằm trong tracked/staged files. <!-- Sửa theo EFR-01: Chống leak dữ liệu nhạy cảm -->
  - Verify file JSON backup chứa đầy đủ và chính xác dữ liệu của các cột bị xóa có giá trị không null (IS NOT NULL, kiểm tra cả các trường hợp có giá trị = 0).
  - Thử tải tài liệu/phân tích OCR lúc onboarding xem nút "Tự điền" và cơ chế copy fallback tự động khi bỏ trống Khối cơ chế hoạt động đúng thiết kế mới.
  - Mở thử Modal cập nhật lương của nhân sự mới xem hệ thống có tự gán Hiệu suất tạm thời và hiện Warning Alert màu vàng không.

## 10. Rollback Plan

- Trong trường hợp xảy ra sự cố mất dữ liệu, sử dụng file JSON backup trong `database_backups/` và chạy script khôi phục giá trị cũ ngược lại DB.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
