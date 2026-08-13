---
document_type: data_schema
project: tool-hieu-suat-vcc
version: 2.6.0
last_updated: 2026-04-05
status: draft
---

# 📊 SCHEMA — Định nghĩa toàn bộ Fields

> **Quy tắc**: Đây là nguồn sự thật DUY NHẤT cho field definitions.
> Tất cả modules tham chiếu file này thay vì tự định nghĩa fields.

---

## 1. Employee Info (Thông tin nhân sự — không bao gồm lương) {#employee_info}

> **Tổng**: 26 trường
> **Tần suất thay đổi**: Ít — chủ yếu khi onboard hoặc điều chuyển
> **⚠️ Required fields**: Cột Required chỉ định bắt buộc ở phase nào.
> - **✅ (Khi Submit)** = bắt buộc khi **Submit** (app-level validation).
> - **✅ (Tạo nháp)** = bắt buộc ngay khi lưu nháp (DB NOT NULL).
> - **Auto** = Hệ thống tự gán giá trị mặc định.
> DB cho phép NULL đối với hầu hết các field (ngoại trừ họ tên, khối) để hỗ trợ **phòng chờ** (NS mới chưa đủ info khi tạo bản ghi).

| # | Field ID | Tên hiển thị | Data Type | Required | PII Level | Ghi chú |
|---|----------|-------------|-----------|----------|-----------|---------|
| A | `ma_nhan_su` | Mã nhân sự | `text` (max 20 ký tự) | ✅ (Khi Submit) | 🟢 Internal | UNIQUE. Alphanumeric, min 3 ký tự. Format linh hoạt (CTV có thể khác) |
| B | `ho_va_ten` | Họ và tên | `text` | ✅ (Tạo nháp) | 🟡 Sensitive | Min 2 ký tự |
| C | `email` | Email | `email` | ✅ (Khi Submit) | 🟡 Sensitive | Email công ty |
| D | `ngay_sinh` | Ngày sinh | `date` | ❌ | 🟡 Sensitive | < today |
| E | `so_dien_thoai` | Số điện thoại | `text` | ❌ | 🟡 Sensitive | 10-11 chữ số, lưu dạng text |
| F | `chuc_danh` | Chức danh | `text` | ❌ | 🟢 Internal | |
| G | `loai_hop_dong` | Loại hợp đồng | `enum` | ❌ | 🟢 Internal | Values: `chinh_thuc`, `ctv` |
| H | `khoi` | Khối | `enum` | ✅ (Tạo nháp) | 🟢 Internal | Values: `Vccorp`, `Admicro`, `KND`, `My Soha`, `Sohagame`, `CNND`, `Bizfly Cloud`, `Bizfly Martech & Sale tech`, `Viva`, `Nanda` |
| I | `khu_vuc` | Khu vực | `text` | ❌ | 🟢 Internal | Values: `HN`, `HCM` |
| J | `bu` | BU (Business Unit) | `text` | ❌ | 🟢 Internal | |
| K | `phong_ban` | Phòng ban | `text` | ❌ | 🟢 Internal | |
| L | `bo_phan` | Bộ phận | `text` | ❌ | 🟢 Internal | Thuộc WF-05 (Điều chuyển) |
| M | `nhom_team` | Nhóm/Team | `text` | ❌ | 🟢 Internal | |
| N | `line_nhan_su` | Line nhân sự | `text` | ✅ (Khi Submit) | 🟢 Internal | Người phụ trách nghiệm thu NS này |
| O | `nguoi_quan_ly` | Người quản lý | `text` | ❌ | 🟢 Internal | Khi cần đổi → cập nhật + ghi Change History |
| P | `ngay_vao_cong_ty` | Ngày vào công ty | `date` | ❌ | 🟢 Internal | |
| Q | `ngay_ky_hd` | Ngày ký HĐ | `date` | ❌ | 🟢 Internal | |
| R | `ngay_dieu_chinh_luong` | Ngày điều chỉnh lương | `date` | ❌ | 🟡 Sensitive | Lần gần nhất. Lịch sử lưu trong Change History |
| S | `ngay_nghi_sinh` | Ngày nghỉ sinh | `date` | ❌ | 🟡 Sensitive | Null nếu chưa nghỉ sinh |
| T | `ngay_nghi_viec` | Ngày nghỉ việc | `date` | ❌ | 🟢 Internal | Null nếu đang làm |
| U | `trang_thai` | Trạng thái | `enum` | Auto | 🟢 Internal | → Xem [STATE_MACHINES.md](./STATE_MACHINES.md) |
| V | `state_phong_cho` | Trạng thái phòng chờ | `boolean` | Auto | 🟢 Internal | `true` = đang trong phòng chờ. Default: `true` |
| V2 | `pending_changes` | Dữ liệu chờ duyệt | `jsonb` | Auto | 🔴 Highly Sensitive | Lưu thông tin các trường bị thay đổi trong lúc pending |
| W | `nguoi_bi_thay_the` | Người bị thay thế | `text` | ❌ | 🟢 Internal | Mã NS cũ (điền tay khi tuyển mới) |
| X | `ky_nghiem_thu` | Kỳ nghiệm thu | `enum` | ❌ | 🟢 Internal | Values: `thang`, `quy` |
| Y | `khong_co_nnt` | Không có NNT | `boolean`| ❌ | 🟢 Internal | Cờ bỏ qua luồng nghiệm thu (chờ Manager) khi submit phòng chờ |

> **⚠️ Field đã bỏ**: `ngay_dieu_chinh_thong_tin` — Đã tách sang [Change History](#4-change_history).

---

## 1A. Phụ trách Khối (`khoi_managers`) {#khoi_managers}

> Bảng map Khối với Email Cán Bộ Quản Lý Khối.
> Phục vụ luồng fallback cảnh báo phòng chờ Telegram hoặc luồng duyệt đặc thù. Chỉ SA được sửa.

| Field ID | Tên | Data Type | Ghi chú |
|----------|-----|-----------|---------|
| `id` | ID record | `uuid` | PK |
| `khoi` | Tên Khối | `text` | UNIQUE constraint |
| `manager_email` | Email phụ trách | `text` | Người quản lý của khối |
| `manager_name` | Tên phụ trách | `text` | Nullable |

---

## 2. Salary — Giấy tờ (Cấu trúc tiền lương hợp đồng) {#salary_giay_to}

> **Tổng**: 6 trường
> **Tần suất thay đổi**: Rất ít — chỉ khi ký HĐ mới hoặc điều chỉnh chính thức
> **🔴 PII Level: HIGHLY SENSITIVE**

| # | Field ID | Tên hiển thị | Data Type | Required | Ghi chú |
|---|----------|-------------|-----------|----------|---------|
| Y | `luong_target_gt` | Lương target (Giấy tờ) | `number` | ❌ | VND |
| Z | `lcd_gt` | Lương cố định (Giấy tờ) | `number` | ❌ | VND |
| AA | `luong_hieu_suat_gt` | Lương hiệu suất (Giấy tờ) | `number` | ❌ | VND |
| AB | `nhuan_but_gt` | Nhuận bút (Giấy tờ) | `number` | ❌ | VND |
| AC | `okr_gt` | OKR (Giấy tờ) | `number` | ❌ | VND |
| AD | `thuong_doanh_so_gt` | Thưởng doanh số (Giấy tờ) | `number` | ❌ | VND |

---

## 3. Salary — Cơ chế (Cấu trúc tiền lương thực tế) {#salary_co_che}

> **Tổng**: 19 cột vật lý (4 base + 5 loại thưởng × 3 mức)
> **Tần suất thay đổi**: Khi user cập nhật tiền lương
> **🔴 PII Level: HIGHLY SENSITIVE**
> **Lưu ý**: `nguoi_nghiem_thu` đã tách sang bảng riêng → Xem [Employee Reviewers](#35-employee-reviewers)

### 3a. Base fields

| # | Field ID | Tên hiển thị | Data Type | Required | Ghi chú |
|---|----------|-------------|-----------|----------|---------|
| AE | `luong_target_cc` | Lương target (Cơ chế) | `number` | ❌ | VND |
| AF | `luong_cb` | Lương CB (Cơ bản) | `number` | ❌ | VND |
| AG | `thuong_hieu_suat_cham_job_nhuan` | Thưởng hiệu suất chấm job/nhuận | `number` | ❌ | VND |
| AH | `tam_ung_hang_thang` | Tạm ứng hàng tháng | `number` | ❌ | VND |

### 3b. Thưởng theo Mức (M1 = Mức 1, M2 = Mức 2, M3 = Mức 3)

> **Lưu ý**: M1/M2/M3 = Mức 1, Mức 2, Mức 3 (KHÔNG phải tháng).
> Giá trị gắn theo từng nhân sự, chỉ thay đổi khi user cập nhật tiền lương.

| Field ID Pattern | Tên hiển thị | M1 | M2 | M3 |
|-----------------|-------------|----|----|-----|
| `thuong_kpi_{m}` | Thưởng KPI/Nhiệm vụ | `number` | `number` | `number` |
| `thuong_okr_{m}` | Thưởng OKR | `number` | `number` | `number` |
| `thuong_doanh_so_{m}` | Thưởng doanh số | `number` | `number` | `number` |
| `thuong_du_an_{m}` | Thưởng dự án | `number` | `number` | `number` |
| `thuong_kiem_nhiem_{m}` | Thưởng kiêm nhiệm | `number` | `number` | `number` |

→ Tổng: 5 loại × 3 mức = **15 cột thưởng**

### 3c. Người nghiệm thu (Bảng riêng) {#35-employee-reviewers}

> **⚠️ Đã tách thành bảng `employee_reviewers`** — KHÔNG còn lưu trong bảng salaries.
> **Chỉ SA** được thêm/xóa người nghiệm thu.

| Field ID | Tên | Data Type | Ghi chú |
|----------|-----|-----------|---------|
| `employee_id` | NS được nghiệm thu | `uuid` | FK → employees.id |
| `reviewer_email` | Email người nghiệm thu | `email` | Validate format. 1 NS có thể có nhiều reviewers |

→ User có email trong bảng này → tự động **EA** cho NS tương ứng.
→ Khi NS đổi khối → **giữ nguyên** reviewers + hiển thị cảnh báo trên UI.

---

### 3d. Bảng Quản lý Giấy tờ/Tài liệu (`employee_documents`) {#employee_documents}

> **Mục đích**: Lưu trữ giấy tờ nhân sự đa luồng (Tuyển mới, Đánh giá thử việc, Điều chỉnh lương, Điều chuyển bổ nhiệm, v.v.). Một nhân sự có thể có nhiều giấy tờ.
> **Kiến trúc Lưu trữ**: **Cloudflare R2 (Private Bucket)** + **Supabase DB** để lưu metadata.
> **Bảo mật**: Sử dụng **Backend Hono (S3 SDK)** để sinh Signed URL ngắn hạn (3 phút) bảo vệ file vật lý. Không cấp quyền xem public.
> **Liên kết tạm**: Hỗ trợ gọi API upload tài liệu ngay cả khi bản ghi `employees` chưa được insert hoàn tất vào schema, dùng `temp_uuid` session của FE.

| Field ID | Tên | Data Type | Ghi chú |
|----------|-----|-----------|---------|
| `id` | ID record | `uuid` | PK |
| `employee_id` | NS sở hữu | `uuid` | FK → employees.id. Tạm NULL nếu đang ở session thiết lập |
| `temp_uuid` | Session ID | `uuid` | Session ID FE gửi lên để nối file với employee sau khi submit |
| `document_type` | Loại giấy tờ | `enum` | Values: `tuyen_moi`, `danh_gia_thu_viec`, `dieu_chinh_luong`, `dieu_chuyen`, `nghi_sinh`, `di_lam_lai`, `khac` |
| `file_name` | Tên file | `text` | Tên file tự nhiên để hiển thị trên UI |
| `r2_object_key` | Path lưu R2 | `text` | Đường dẫn vật lý trong private bucket (VD: `documents/emp_id/xyz.pdf`) |
| `content_type` | Định dạng | `text` | Mime type (VD: `image/png`, `application/pdf`) |
| `size_bytes` | Dung lượng | `int` | Tính bằng byte |
| `ocr_result` | OCR Data | `jsonb` | Kết quả phân tích metadata từ AI OCR sinh ra |
| `created_by` | Người upload| `email` | User thực hiện hành động tải file lên |
| `created_at` | Thời điểm | `datetime`| Tự động sinh `now()` |

---

## 4. Change History {#change_history}

> **Mục đích**: Lưu lộ trình thay đổi thông tin từng NS.
> **Phát sinh**: Mỗi lần thông tin NS (hoặc lương) bị thay đổi → 1 record mới.
> **⚠️ API rule**: Khi trả cho user **VI** → **filter ẩn** records có `field_changed` thuộc salary fields (ẩn cả `old_value`, `new_value` và `reason`).

| Field ID | Tên | Data Type | Ghi chú |
|----------|-----|-----------|---------|
| `id` | ID | `auto_increment` | PK |
| `ma_nhan_su` | Mã nhân sự | `text` | FK → employees(ma_nhan_su) |
| `field_changed` | Trường bị thay đổi | `text` | VD: `khoi`, `luong_target_cc` |
| `old_value` | Giá trị cũ | `text` | |
| `new_value` | Giá trị mới | `text` | |
| `changed_by` | Người thay đổi | `email` | |
| `changed_at` | Thời điểm | `datetime` | Auto-generated |
| `reason` | Lý do thay đổi | `text` | **User nhập manual** qua popup. Optional |

---

## 5. Monthly Snapshot (Chốt DS nhân sự tháng — PER KHỐI) {#monthly_snapshot}

> **Mục đích**: Copy toàn bộ trường của NS thuộc 1 khối tại thời điểm chốt.
> **Phát sinh**: Mỗi khối mỗi tháng tối đa 1 snapshot.
> **Tính chất**: Data KHÔNG bị ghi đè. Không copy `employee_reviewers`.
> **⚠️ Quyền xem**: Chỉ **EA, VA, SA**. User **VI KHÔNG xem** được snapshot (vì chứa salary).
> **📐 Cấu trúc lưu trữ**: Normalized — 2 bảng riêng biệt (KHÔNG dùng JSON blob).

### 5a. Bảng `snapshots` (Metadata — 1 row per khối per tháng)

| Field ID | Tên | Data Type | Ghi chú |
|----------|-----|-----------|---------|
| `id` | ID | `uuid` | PK |
| `month` | Tháng | `text` | Format: `YYYY-MM` |
| `khoi` | Khối | `text` | Khối nào. UNIQUE (month, khoi) |
| `locked_at` | Ngày chốt | `datetime` | Thời điểm bấm "Chốt" |
| `snapshot_by` | Người chốt | `email` | User EA thực hiện |
| `snapshot_status` | Trạng thái | `enum` | `draft`, `locked` |
| `total_employees` | Tổng NS | `int` | Số NS được copy vào snapshot |

### 5b. Bảng `snapshot_employees` (Data NS — N rows per snapshot)

> Mỗi NS được copy thành **1 row riêng** (normalized). Gồm toàn bộ employee fields (24 cột — loại trừ `pending_changes`) + salary fields (25 cột) = 49 cột.
> FK: `snapshot_id` → `snapshots.id`. UNIQUE: `(snapshot_id, ma_nhan_su)`.
> Xem chi tiết cột tại [001_schema.sql — snapshot_employees](../../../database/001_schema.sql).

---

## 6. System Audit Log {#audit_log}

> **Mục đích**: Ghi lại mọi thao tác hệ thống.
> **Cross-cutting**: Tất cả modules đều ghi vào đây.

| Field ID | Tên | Data Type | Ghi chú |
|----------|-----|-----------|---------|
| `id` | ID | `auto_increment` | |
| `created_at` | Thời điểm | `datetime` | Auto-generated |
| `actor_email` | Người thực hiện | `email` | |
| `module` | Module | `enum` | `NS-001` → `NS-004` |
| `action` | Hành động | `enum` | `create`, `update`, `delete`, `submit`, `snapshot_create`, `snapshot_lock`, `snapshot_unlock`, `reviewer_assign`, `reviewer_remove`, `export`, `api_blocked`, `access_denied` |
| `target_ma_nhan_su` | Mã NS | `text` | Nullable |
| `details` | Chi tiết | `json` | |

---

## 7. PII Classification Summary

| Level | Ý nghĩa | Fields | Quy tắc |
|-------|---------|--------|---------|
| 🔴 **Highly Sensitive** | Bảo mật cao nhất | Toàn bộ salary (25 cột) + employee_reviewers + pending_changes | Chỉ EA/VA/SA. VI không xem. Change History filter salary cho VI |
| 🟡 **Sensitive** | Thông tin cá nhân | `ho_va_ten`, `email`, `ngay_sinh`, `so_dien_thoai`, `ngay_nghi_sinh`, `ngay_dieu_chinh_luong` | Theo quyền khối |
| 🟢 **Internal** | Thông tin tổ chức | `ma_nhan_su`, `khoi`, `bu`, `phong_ban`, `trang_thai`... | EA/VA/VI trên khối |

---

## 8. Data Type Rules

| Data Type | Quy tắc | Lưu ý |
|-----------|---------|-------|
| `text` | Lưu nguyên | **⚠️ Fields cần giữ format (mã NS, SĐT) → dùng text** |
| `number` | Số nguyên | VND, không âm |
| `date` | `DD/MM/YYYY` | Validate: không cho ngày tương lai (trừ `ngay_ky_hd`) |
| `email` | Format email chuẩn | Validate regex |
| `enum` | Giá trị cố định | Xem values tại từng field |
| `boolean` | `true` / `false` | |
| `datetime` | ISO 8601 | Auto-generated |

---

*Đây là nguồn sự thật duy nhất cho field definitions. Mọi module PHẢI tham chiếu file này.*
*Cập nhật: 2026-04-05 — v2.6.0 (Bổ sung khong_co_nnt, khoi_managers, sửa enums)*
