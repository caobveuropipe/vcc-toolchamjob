---
module_id: NS-003
module_name: Chốt danh sách nhân sự tháng (Monthly Snapshot — per Khối)
status: draft
priority: P0
actors: [EA, SA]
depends_on: [SCHEMA#monthly_snapshot, STATE_MACHINES#snapshot_state, NS-001, NS-002]
data_scope: [monthly_snapshot]
---

# NS-003: Chốt danh sách nhân sự tháng (per Khối)

> **⚠️ Reference Only**
> Source of truth cho luồng nghiệp vụ đã chuyển sang `docs/business-flows/`. File này giữ lại làm technical reference cho Validation Rules và Implementation details.

## 1. Tổng quan

Module này thực hiện **chốt danh sách nhân sự hàng tháng cho từng khối** — tạo bản snapshot cố định chứa toàn bộ trường của NS thuộc khối đó tại thời điểm chốt.

**Tại sao per khối?**
- Mỗi khối có User EA riêng chịu trách nhiệm chốt
- Cho phép chốt độc lập — khối A chốt xong không cần đợi khối B
- Phân quyền rõ ràng: EA chỉ chốt khối mình

> **Data scope**: [SCHEMA.md#monthly_snapshot](../data/SCHEMA.md#5-monthly-snapshot)
> **State machine**: [STATE_MACHINES.md#snapshot_state](../data/STATE_MACHINES.md#3-snapshot-state)
> **Phân quyền**: [PERMISSION_MATRIX.md#2d](../data/PERMISSION_MATRIX.md)

---

## 2. Business Rules

- **BR-003-001**: Mỗi khối mỗi tháng có tối đa **1 snapshot** (UNIQUE: month + khoi)
- **BR-003-002**: Snapshot chỉ chứa NS có `state_phong_cho` = `false` thuộc khối đó
- **BR-003-003**: Snapshot copy toàn bộ trường (employee + salary) tại thời điểm chốt. KHÔNG copy `employee_reviewers`
- **BR-003-004**: Sau khi chốt (`locked`), data snapshot KHÔNG bị ảnh hưởng bởi thay đổi
- **BR-003-005**: Chỉ SA có quyền mở lại snapshot đã chốt
- **BR-003-006**: User EA chốt chịu trách nhiệm kiểm tra danh sách
- **BR-003-007**: Deadline chốt: cuối tháng
- **BR-003-008**: User **VI KHÔNG xem được snapshot** (vì chứa salary data 🔴 HIGHLY SENSITIVE)
- **BR-003-009**: BLOCK TẠO SNAPSHOT: Nếu bắt kỳ NS nào trong Khối đang có `state_phong_cho = true` (chưa chốt list phòng chờ) thì thao tác Lock/Create Snapshot bị chặn.
- **BR-003-010**: NS `nghi_viec` chỉ nằm trong snapshot nếu `ngay_nghi_viec` thuộc tháng snapshot. NS đã nghỉ trước tháng snapshot → **KHÔNG** copy vào
- **BR-003-011**: Lock/Unlock PHẢI validate `snapshot_status` hiện tại trước khi chuyển. Return `STATE_ERROR` nếu transition không hợp lệ (VD: lock snapshot đã locked)

---

## 3. Workflows

### 3.1. Tạo Snapshot tháng cho 1 khối

> **Actor**: User EA (trên khối cần chốt)

**Bước 1**: User EA chọn "Tạo snapshot tháng MM/YYYY cho khối X"
- IF snapshot (month + khoi) đã tồn tại → cảnh báo

**Bước 2**: System tự động
- Lọc: NS có `state_phong_cho` = `false` AND `khoi` = khối đang chốt
- Copy toàn bộ trường. Set `snapshot_status` = `draft`

**Bước 3**: User EA review danh sách khối mình

### 3.2. Chốt (Lock) Snapshot

> **Actor**: User EA (khối mình)

1. Xác nhận danh sách → bấm "Chốt"
2. System: validate `snapshot_status` = `draft` (nếu đã `locked` → return `STATE_ERROR`)
3. System: `snapshot_status` = `locked`, `locked_at` = now(), `snapshot_by` = email
4. Ghi Audit Log: Sau khi backend gọi hàm tạo db function thành công, CẦN log 2 event rành mạch trong khối transaction API để match với action schema:
   - `{action: "snapshot_create", details: {month, khoi, total_ns}}`
   - `{action: "snapshot_lock", details: {month, khoi, total_ns}}`

### 3.3. Mở lại Snapshot (Unlock)

> **Actor**: SA ONLY

1. SA bấm "Mở lại" → nhập lý do (bắt buộc)
2. System: validate `snapshot_status` = `locked` (nếu đã `draft` → return `STATE_ERROR`)
3. System: `snapshot_status` = `draft`, `locked_at` = NULL. **GIỮ NGUYÊN** `snapshot_employees` data cũ
4. Ghi Audit Log: `{action: "snapshot_unlock", details: {month, khoi, reason}}`

### 3.4. Rechốt Snapshot (Unlock → Rechốt)

> **Actor**: EA (khối mình) — sau khi SA đã Unlock
> **Trigger**: Snapshot bị Unlock, EA cần chốt lại với data mới nhất

1. EA bấm "Chốt" trên snapshot đang `draft` (đã có data cũ từ lần chốt trước)
2. System phát hiện `snapshot_employees` **đã có data** → kích hoạt flow rechốt:
   - **Bước 2a**: Backup data cũ → **Backend API** (Nodejs/Go) tự động query data cũ, export và upload lên **Google Cloud Storage (GCS) Bucket** (miễn phí, nằm trong hệ sinh thái GCloud). Metadata ghi log link backup.
   - **Bước 2b**: Gọi Database Function `create_monthly_snapshot`. Function này sẽ tự động **cascade xóa toàn bộ** `snapshot_employees` của snapshot này.
   - **Bước 2c**: DB tự động Re-copy data mới từ `employees` + `salaries` (cùng logic filter như Bước 3.1).
   - **Bước 2d**: Update `total_employees`, `snapshot_status` = `locked`, `locked_at` = now(), `snapshot_by` = email.
3. Ghi Audit Log: `{action: "snapshot_lock", details: {month, khoi, total_ns, is_rechot: true, backup_uri: "gs://..."}}`

> ⚠️ **Lưu ý kỹ thuật**: Flow rechốt cần tích hợp Google Cloud Storage Client. Sử dụng gói Always Free (5GB) là đủ cho hàng chục năm dữ liệu.

---

## 4. Edge Cases

| Case | Xử lý |
|------|-------|
| NS vào giữa tháng | Xuất hiện nếu `state_phong_cho` = false tại thời điểm chốt |
| NS nghỉ việc giữa tháng | Xuất hiện **chỉ khi** `ngay_nghi_viec` thuộc tháng snapshot. VD: nghỉ tháng 3 + snapshot tháng 3 → có. Nghỉ tháng 2 + snapshot tháng 3 → **không** |
| NS chuyển khối giữa tháng | Xuất hiện trong snapshot của khối **hiện tại** |
| NS trong phòng chờ | KHÔNG xuất hiện (BR-003-002) |
| Khối A chốt, khối B chưa | OK — mỗi khối độc lập |

---

*Phụ thuộc NS-001 + NS-002. Implement sau.*
*Cập nhật: 2026-03-30 — v2.5.0*
*Changelog v2.3.0: Thêm BR-003-010 (filter nghi_viec), BR-003-011 (state validation), Workflow 3.4 (rechốt + GCS backup), rename snapshot_date → locked_at.*
