---
module_id: NS-002
module_name: Quản lý thông tin tiền lương
status: draft
priority: P0
actors: [EA, SA]
depends_on: [SCHEMA#salary_giay_to, SCHEMA#salary_co_che, PERMISSION_MATRIX, NS-001]
data_scope: [salary_giay_to, salary_co_che, employee_documents]
---

# NS-002: Quản lý thông tin tiền lương

## 1. Tổng quan

Module này quản lý **25 cột tiền lương** chia thành 2 bộ song song, độc lập:
- **Bộ Giấy tờ**: 6 trường (lương theo hợp đồng)
- **Bộ Cơ chế**: 19 cột (lương thực tế, 4 base + 5 loại thưởng × 3 mức)
- **Người nghiệm thu**: Tách riêng → bảng `employee_reviewers` (SA quản lý)

> **Data scope**: [SCHEMA.md#salary_giay_to](../data/SCHEMA.md#2-salary--giấy-tờ) + [SCHEMA.md#salary_co_che](../data/SCHEMA.md#3-salary--cơ-chế)
> **Phân quyền**: [PERMISSION_MATRIX.md#2b, #2c, #3](../data/PERMISSION_MATRIX.md)
> **🔴 Toàn bộ data ở đây là HIGHLY SENSITIVE**

---

## 2. Business Rules

### Rules chung
- **BR-002-001**: User EA trên khối tương ứng có quyền xem + sửa tiền lương
- **BR-002-002**: User VI **KHÔNG** được xem tiền lương
- **BR-002-003**: User VA chỉ XEM (không sửa). Reviewer (bảng `employee_reviewers`) → EA cho NS đó
- **BR-002-004**: Mọi thay đổi lương PHẢI ghi [Change History](../data/SCHEMA.md#change_history) + [Audit Log](../data/SCHEMA.md#audit_log)
- **BR-002-005**: IF `trang_thai` = `nghi_viec` THEN block sửa lương (trừ SA)

### Rules cho M1/M2/M3
- **BR-002-006**: M1, M2, M3 = Mức 1, 2, 3. Gắn theo từng nhân sự
- **BR-002-007**: M1/M2/M3 chỉ thay đổi khi user cập nhật (KHÔNG tự động)
- **BR-002-008**: Giá trị M1/M2/M3 là số nguyên ≥ 0 (VND)

### Rules cho Người nghiệm thu
- **BR-002-009**: Người nghiệm thu lưu trong bảng `employee_reviewers` (tách riêng khỏi salaries)
- **BR-002-010**: 1 NS có thể có nhiều người nghiệm thu. **Chỉ SA** thêm/xóa
- **BR-002-011**: Reviewer → tự động EA cho NS đó. Khi NS đổi khối → giữ nguyên + cảnh báo UI

---

## 3. Workflows

### 3.1. Case Setup — Nhập lương cho NS mới {#31-case-setup}

> **Trigger**: Song song với [NS-001 Case Setup](./NS-001_employee_crud.md#31-case-setup)
> **Actor**: User EA

**Bước 1**: Nhập lương Giấy tờ: `luong_target_gt`, `lcd_gt`, `luong_hieu_suat_gt`, `nhuan_but_gt`, `okr_gt`, `thuong_doanh_so_gt`

**Bước 2**: Nhập lương Cơ chế: `luong_target_cc`, `luong_cb`, `thuong_hieu_suat_cham_job_nhuan`, `tam_ung_hang_thang`, thưởng KPI/OKR/Doanh số/Dự án/Kiêm nhiệm (M1/M2/M3)

**Bước 3**: SA gán người nghiệm thu nếu cần (bảng `employee_reviewers`)

**Bước 4**: Lưu → gắn vào bản ghi NS. Ghi Audit Log

### 3.2. Case thay đổi lương khi cập nhật thông tin/điều chuyển

> **Trigger**: Khi nhân sự được điều chỉnh lương hoặc bị thay đổi thông tin ảnh hưởng đến lương (xem [WF-EMP-03](../../docs/business-flows/03-dieu-chinh-luong.md))
> **Actor**: User EA trên khối NS

1. Kiểm tra cấu trúc tiền lương hiện tại
2. Tự điều chỉnh lương nếu cần (lưu phòng chờ `state_phong_cho=true`, payload vào `pending_changes`)
3. Ghi Change History: old → new + Audit Log

### 3.3. Case điều chỉnh lương (không liên quan điều chuyển)

> **Trigger**: User EA tự điều chỉnh
> **Deadline**: Ngày 27 hàng tháng

1. User EA cập nhật (lưu phòng chờ `state_phong_cho=true`, lưu vào `pending_changes`)
2. Ghi Change History + Audit Log

### 3.4. Case cập nhật lương khi đánh giá thử việc (WF-EMP-08)

> **Trigger**: Khi nhân sự pass thử việc (WF-EMP-08)
> **Actor**: User EA

1. Trên form đánh giá thử việc, EA nhập cập nhật lương chính thức (Giấy tờ + Cơ chế)
2. Hệ thống lưu biên bản lên R2, ghi phiên thao tác vào phòng chờ (`state_phong_cho=true`, data vào `pending_changes`)
3. EA duyệt Submit → Hệ thống cập nhật đổi thông tin lương, chuyển trạng thái NS sang `dang_lam`, set `state_phong_cho=false`
4. Ghi Change History + Audit Log

---

## 4. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Tất cả fields lương | Optional, number ≥ 0 | "Giá trị không được âm" |
| Tất cả fields lương | Không cho text | "Giá trị phải là số" |

---

## 5. Mối quan hệ 2 bộ lương

```
┌─────────────────────────────┐     ┌────────────────────────────────────┐
│    BỘ GIẤY TỜ (6 trường)   │     │    BỘ CƠ CHẾ (19 cột)             │
│  Lương theo hợp đồng        │     │  Lương thực tế theo cơ chế         │
│  - luong_target_gt           │     │  - luong_target_cc                 │
│  - lcd_gt                    │     │  - luong_cb                        │
│  - luong_hieu_suat_gt        │     │  - thuong_hieu_suat_cham_job_nhuan │
│  - nhuan_but_gt              │     │  - tam_ung_hang_thang              │
│  - okr_gt                    │     │  - KPI (M1/M2/M3)                  │
│  - thuong_doanh_so_gt        │     │  - OKR (M1/M2/M3)                  │
│                              │     │  - Doanh số (M1/M2/M3)             │
│                              │     │  - Dự án (M1/M2/M3)                │
│                              │     │  - Kiêm nhiệm (M1/M2/M3)           │
└─────────────────────────────┘     └────────────────────────────────────┘
         │         SONG SONG, ĐỘC LẬP            │
         └────────────────┬───────────────────────┘
                          ▼
                    Snapshot tháng (per khối)
```

---

*Module này phụ thuộc NS-001. Implement sau NS-001.*
*Bảng `employee_reviewers` → SA quản lý riêng, tách khỏi salary CRUD.*
*Cập nhật: 2026-03-13 — v2.1.1*
