---
module_id: NS-001
module_name: Quản lý thông tin nhân sự (không bao gồm tiền lương)
status: draft
priority: P0
actors: [EA, SA]
depends_on: [SCHEMA#employee_info, STATE_MACHINES#employee_state, PERMISSION_MATRIX]
data_scope: [employee_info, employee_documents]
---

# NS-001: Quản lý thông tin nhân sự (không bao gồm tiền lương)

> **⚠️ Reference Only**
> Source of truth cho luồng nghiệp vụ đã chuyển sang `docs/business-flows/`. File này giữ lại làm technical reference cho Validation Rules và Implementation details.

## 1. Tổng quan

Module này quản lý **25 trường thông tin nhân sự** (không bao gồm tiền lương). Bao gồm:
- Thêm mới nhân sự
- Cập nhật thông tin nhân sự (điều chuyển, thay đổi trạng thái)
- Xóa nhân sự (chỉ SA)

> **Data scope**: [SCHEMA.md#employee_info](../data/SCHEMA.md#1-employee_info)
> **Phân quyền**: [PERMISSION_MATRIX.md#2a](../data/PERMISSION_MATRIX.md)

---

## 2. Business Rules

### Rules chung
- **BR-001-001**: Mã nhân sự (`ma_nhan_su`) là UNIQUE, tối đa 20 ký tự. Format linh hoạt (CTV có thể khác)
- **BR-001-002**: Khi tạo bản ghi mới, `state_phong_cho` = `true` (mặc định)
- **BR-001-003**: Khi tạo bản ghi mới, `trang_thai` = `thu_viec` (mặc định) hoặc `dang_lam` (tuyển thẳng)
- **BR-001-004**: IF `trang_thai` = `nghi_viec` THEN block mọi thao tác sửa (trừ SA)
- **BR-001-005**: IF tái tuyển NS cũ THEN tạo bản ghi MỚI, mã nhân sự MỚI
- **BR-001-006**: Mọi thay đổi PHẢI ghi [Change History](../data/SCHEMA.md#change_history) + [Audit Log](../data/SCHEMA.md#audit_log)

### Rules phòng chờ
- **BR-001-007**: User EA có quyền "Submit" (state_phong_cho: true → false). **Bất kỳ EA nào cùng khối** đều có thể Submit, không phụ thuộc ai đưa vào phòng chờ
- **BR-001-008**: Khi Submit, validate: `ma_nhan_su`, `email`, `line_nhan_su` PHẢI có giá trị. Các field `bu`, `ngay_sinh`, `loai_hop_dong`, `nguoi_quan_ly`, `ngay_vao_cong_ty` cho phép NULL khi submit
- **BR-001-009**: NS trong phòng chờ KHÔNG được tính vào snapshot (NS-003)

---

## 3. Workflows

### 3.1. Case Setup — Thêm nhân sự mới

> **Trigger**: Khi nhận giấy tờ từ tuyển dụng
> **Actor**: User EA trên khối tương ứng

**Bước 1**: User EA nhận giấy tờ từ tuyển dụng

**Bước 2**: User EA nhập thông tin lên tool
- Nhập: `ho_va_ten`, `ngay_sinh`, `so_dien_thoai`, `chuc_danh`, `loai_hop_dong`, `line_nhan_su`, `khoi`...
- **Upload Giấy tờ (`tuyen_moi`)**: FE gọi API Backend Hono lấy Pre-signed URL → File đẩy thẳng lên Cloudflare R2 Private Bucket. FE gửi `temp_uuid` và `r2_object_key` cho BE để lưu dữ liệu `employee_documents`.
- Nhập thông tin tiền lương → Xem [NS-002 Case Setup](./NS-002_salary_crud.md#31-case-setup)
- System auto: `state_phong_cho` = `true`, `trang_thai` = `thu_viec` (hoặc `dang_lam` nếu tuyển thẳng)
- → ⚠️ Edge: IF `ma_nhan_su` đã tồn tại THEN lỗi
- → ⚠️ Edge: IF `email` đã tồn tại THEN chỉ cảnh báo trên UI thay vì block (do khác biệt policy, xem DISC-002)

**Bước 3**: Lưu dữ liệu → bản ghi được phân bổ vào DB với `state_phong_cho = true`. Trạng thái này khiến UI coi đây là bản nháp Phòng chờ. (Không dùng `pending_changes` vì là bản ghi mới, không có cột live để bảo vệ).

**Bước 4**: User EA (cùng khối) bổ sung thông tin
- Nhập: `ma_nhan_su`, `email`, `bu`, `phong_ban`, `nhom_team`, `nguoi_quan_ly`
- → ⚠️ IF thiếu required fields THEN block Submit

**Bước 5**: User EA bấm "Submit"
- System: `state_phong_cho` = `false` (Bản ghi chính thức gia nhập luồng live)
- Ghi Audit Log + Change History
- Bắn Notification tới nhóm nghiệm thu qua Telegram/App

---

### 3.2. Case cập nhật thông tin cá nhân/hành chính

> **Trigger**: Theo luồng WF-EMP-02
> **Actor**: User EA trên khối NS hiện tại

**Bước 1**: User EA cập nhật fields thông tin cá nhân cần thay đổi (VD: `so_dien_thoai`, `nguoi_quan_ly`, `ky_nghiem_thu`...)
  *(⚠️ Lưu ý: Thay đổi `khoi`, `bu`, `phong_ban`, `nhom_team` phải đưa qua luồng điều chuyển WF-EMP-05).*
**Bước 2**: Hệ thống lưu trực tiếp (không qua phòng chờ) đối với thông tin cá bản cơ bản. Nếu sửa chức danh, phòng ban bắt buộc qua phòng chờ `state_phong_cho` = `true`. Ghi Change History + Audit Log
**Bước 3**: (Nếu cần) User EA chủ động điều chỉnh lương tại [NS-002 Case 3.2](./NS-002_salary_crud.md) (Quy trình độc lập)

---

### 3.3. Case nghỉ sinh / Đi làm lại

> **Actor**: User EA | **Deadline**: Ngày 30 hàng tháng

1. Check bảng công → xác định NS nghỉ sinh hoặc đi làm lại. Mọi thay đổi trạng thái đều đi kèm giấy tờ liên quan nếu có.
2. Lưu phiên thao tác vào phòng chờ do có sửa đổi trạng thái & giấy tờ (`state_phong_cho` = `true`, `pending_changes` lưu dữ liệu trạng thái mới)
3. Sau khi xác nhận (EA duyệt Submit), áp dụng data từ `pending_changes`. Nếu là nghỉ sinh: set `trang_thai = nghi_sinh`, `ngay_nghi_sinh` = ngày bắt đầu. Nếu là đi làm lại: set `trang_thai = dang_lam` và SET `ngay_nghi_sinh` = NULL.
4. Set lại `state_phong_cho` = `false`, reset `pending_changes`.
5. Ghi Change History + Audit Log (truyền payload `ngay_di_lam_lai` vào đây nếu là case đi làm lại).

### 3.4. Case nghỉ việc

> **Actor**: User EA | **Deadline**: Ngày 30 hàng tháng

1. Xác nhận thông tin nghỉ việc
2. Lưu phiên thao tác đổi trạng thái vào phòng chờ (`state_phong_cho` = `true`, thông tin ghi vào `pending_changes`)
3. Khi duyệt Submit, áp dụng data: set `trang_thai` = `nghi_viec`, `ngay_nghi_viec` = ngày nghỉ, `state_phong_cho` = `false`
4. Ghi Change History + Audit Log → BR-001-004 block thay đổi tiếp

### 3.5. Case thử việc lên chính thức

> **Actor**: User EA | **Deadline**: Ngày 30 hàng tháng

1. Xác nhận NS đã pass thử việc. Cập nhật lương chính thức và tải giấy tờ đánh giá (chuẩn bị)
2. Lưu phiên thao tác vào phòng chờ (`state_phong_cho` = `true` và `pending_changes` chứa dữ liệu mới) do có kèm giấy tờ và lương mới
3. Khi duyệt Submit, hệ thống apply JSON vào live data: set `trang_thai` = `dang_lam`, update `salaries`, `state_phong_cho` = `false`, reset `pending_changes`
4. Ghi Change History + Audit Log

### 3.6. Xóa nhân sự

> **Actor**: SA ONLY

- **BR-001-010**: Chỉ SA có quyền xóa
- **BR-001-011**: Hiển thị cảnh báo xác nhận
- **BR-001-012**: Ưu tiên soft delete (chuyển `nghi_viec`)
- **BR-001-013**: Hard delete → ghi Audit Log đầy đủ data bị xóa
- **BR-001-014**: (Defer Phase 4/6) Khi Hard Delete, cảnh báo người dùng rằng hệ thống sẽ tự động cascade xóa bảng lương, tài liệu, reviewer, và set null bảng history tương ứng theo Schema Rules. Không được phép giữ lại do constraint khóa.

---

## 4. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `ma_nhan_su` | Required, max 20 ký tự, unique, alphanumeric, min 3 ký tự | "Mã NS không hợp lệ" |
| `ho_va_ten` | Required, min 2 ký tự | "Họ tên không được để trống" |
| `email` | Required, format email | "Email không hợp lệ" |
| `ngay_sinh` | Optional, < today | "Ngày sinh phải nhỏ hơn hôm nay" |
| `so_dien_thoai` | Optional, 10-11 chữ số | "SĐT không hợp lệ" |
| `loai_hop_dong` | Optional, enum | "Loại HĐ không hợp lệ" |
| `khoi` | Required, enum (10 giá trị) | "Khối không hợp lệ" |
| `ky_nghiem_thu` | Optional, enum: thang/quy | "Kỳ nghiệm thu không hợp lệ" |

---

---

*Module nền tảng — implement trước NS-002, NS-003, NS-004.*
*Cập nhật: 2026-03-12 — v2.0.0*
