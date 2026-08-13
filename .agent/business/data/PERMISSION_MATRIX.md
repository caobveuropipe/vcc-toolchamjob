---
document_type: permission_matrix
project: tool-hieu-suat-vcc
version: 2.6.0
last_updated: 2026-04-05
status: draft
---

# 🔐 PERMISSION MATRIX — Ma trận phân quyền theo Khối

> **Mô hình v2.0**: Phân quyền **per user per khối** (thay thế role-based cũ).
> Mỗi user có 1 permission level cho từng khối mà họ được gán.

---

## 1. Permission Levels

| Level | Mã | Mô tả | Scope |
|-------|-----|-------|-------|
| **Edit All** | `EA` | Xem + sửa toàn bộ data (employee info + salary) + mọi thao tác write | Per khối |
| **View Info** | `VI` | Chỉ xem thông tin nhân sự (KHÔNG xem salary) | Per khối |
| **View All** | `VA` | Xem toàn bộ data (employee info + salary) nhưng KHÔNG sửa | Per khối |
| **Super Admin** | `SA` | Toàn quyền trên mọi khối + thao tác đặc biệt | Toàn hệ thống |

---

## 2. Ma trận: Permission Level × Data Access

### 2a. Employee Info (25 trường — 🟢🟡 Internal/Sensitive)

| Thao tác | `EA` | `VI` | `VA` | `SA` |
|----------|------|------|------|------|
| **Xem danh sách** | ✅ (NS thuộc khối) | ✅ (NS thuộc khối) | ✅ (NS thuộc khối) | ✅ (toàn bộ) |
| **Thêm mới** | ✅ | ❌ | ❌ | ✅ |
| **Sửa thông tin** | ✅ | ❌ | ❌ | ✅ |
| **Submit phòng chờ** | ✅ | ❌ | ❌ | ✅ |
| **Đưa lại phòng chờ** | ✅ | ❌ | ❌ | ✅ |
| **Xóa nhân sự** | ❌ | ❌ | ❌ | ✅ Only |

### 2b. Salary — Giấy tờ (6 trường — 🔴 Highly Sensitive)

| Thao tác | `EA` | `VI` | `VA` | `SA` |
|----------|------|------|------|------|
| **Xem** | ✅ | ❌ | ✅ | ✅ |
| **Thêm/Sửa** | ✅ | ❌ | ❌ | ✅ |

### 2c. Salary — Cơ chế (19 cột — 🔴 Highly Sensitive)

| Thao tác | `EA` | `VI` | `VA` | `SA` |
|----------|------|------|------|------|
| **Xem** | ✅ | ❌ | ✅ | ✅ |
| **Thêm/Sửa** | ✅ | ❌ | ❌ | ✅ |

### 2d. Monthly Snapshot (per khối)

| Thao tác | `EA` | `VI` | `VA` | `SA` |
|----------|------|------|------|------|
| **Tạo snapshot** | ✅ (khối mình) | ❌ | ❌ | ✅ |
| **Chốt (lock)** | ✅ (khối mình) | ❌ | ❌ | ✅ |
| **Mở lại (unlock)** | ❌ | ❌ | ❌ | ✅ Only |
| **Xem snapshot** | ✅ | ❌ | ✅ | ✅ |

### 2e. Audit Log & Change History

| Thao tác | `EA` | `VI` | `VA` | `SA` |
|----------|------|------|------|------|
| **Xem audit log** | ✅ (của mình) | ✅ (của mình) | ✅ (của mình) | ✅ (toàn bộ) |
| **Xem change history** | ✅ | ✅ (NS thuộc khối, **ẩn salary fields & reason**) | ✅ | ✅ |

### 2f. Quản lý giấy tờ (`employee_documents`)

**Quy định bảo mật 3 Trạng Thái File**:
- **Trạng thái Presign (Cấp Upload URL)**: Chỉ yêu cầu `EA`, `SA` có quyền tại `khoi` được gửi lên.
- **Trạng thái Draft Un-bound (`employee_id IS NULL`)**: Người dùng chỉ được GET/DELETE/OCR đúng những file mình Upload (`created_by === actor.email`). Cấm mọi user khác (kể cả EA cùng khối), ngoại trừ `SA`. 
- **Trạng thái Bound (`employee_id` đã gán)**: Tuân thủ theo rule của Nhân Sự:

| Thao tác (Khi file đã Bound) | `EA` / `Reviewer` | `VI` | `VA` | `SA` |
|------------------------------|-------------------|------|------|------|
| **Xem tài liệu** | ✅ (NS thuộc khối/được gán) | ❌ | ❌ | ✅ |
| **Thêm file mới** | ⏳ (Future Scope ngoài Phase E - Tạm khóa) | ❌ | ❌ | ⏳ |
| **Xóa tài liệu** | ✅ (NS thuộc khối/được gán) | ❌ | ❌ | ✅ |
| **Sử dụng AI OCR** | ✅ (NS thuộc khối/được gán) | ❌ | ❌ | ✅ |

---

## 3. Quyền đặc biệt: Người nghiệm thu (Bảng `employee_reviewers`)

> **Chỉ SA** được thêm/xóa người nghiệm thu.
> Data lưu trong bảng riêng `employee_reviewers(employee_id, reviewer_email)`.
> Khi NS đổi khối → **GIỮ NGUYÊN** reviewers + hiển thị cảnh báo trên UI.

| Điều kiện | Quyền | Scope |
|-----------|-------|-------|
| `employee_reviewers` chứa email user | EA | Chỉ NS cụ thể đó |

**Conflict resolution**: Nếu user có VI/VA trên khối + đồng thời là reviewer của NS → EA (cao hơn) cho NS đó.

**Quản lý**: SA thêm/xóa qua UI → ghi Audit Log (`reviewer_assign` / `reviewer_remove`).

---

## 4. Business Rules

- **BR-PERM-001**: SA có toàn quyền trên mọi data và operation, mọi khối
- **BR-PERM-002**: EA/VI/VA chỉ áp dụng cho NS thuộc khối được gán
- **BR-PERM-003**: 1 user có thể có **nhiều khối** với **level khác nhau**. VD: EA trên Admicro + VI trên KND
- **BR-PERM-004**: VI **KHÔNG hiển thị** cột salary + **KHÔNG xem được snapshot**
- **BR-PERM-005**: VI xem Change History → **ẩn records** có `field_changed` thuộc salary fields (bao gồm old/new value & reason)
- **BR-PERM-006**: Mọi thao tác sửa/xóa PHẢI ghi [Audit Log](./SCHEMA.md#audit_log)
- **BR-PERM-007**: Nếu user không có permission nào → không truy cập

### Thao tác chỉ SA (hoặc mở rộng có kiểm soát):
- **BR-PERM-008**: Xóa nhân sự (hard delete) - Chỉ SA
- **BR-PERM-009**: Mở lại snapshot đã chốt (unlock) - Chỉ SA
- **BR-PERM-010**: Quản lý bảng phân quyền - Chỉ SA
- **BR-PERM-011**: Thêm/xóa người nghiệm thu (`employee_reviewers`) - SA có toàn quyền (bulk ops / form). EA được quyền thêm/gỡ NNT **riêng** trên form của nhân sự thuộc khối mình quản lý.

---

## 5. Ví dụ phân quyền thực tế

```json
// User: loi.admicro@gmail.com
{
  "EA": ["Admicro"],
  "VI": [],
  "VA": []
}

// User: caobuivan@vccorp.vn
{
  "EA": ["Admicro", "KND", "Vccorp", "Nanda", "CNND"],
  "VI": [],
  "VA": []
}

// User: loi.quantrihethong@gmail.com → SA (toàn quyền)
// Ngoài ra còn có VA trên tất cả khối

// User: thuycoi187@gmail.com
{
  "EA": ["Admicro"],
  "VI": [],
  "VA": ["Nanda"]
}
```

---

## 6. Database Tables

### 6a. Bảng `user_permissions`

| Field | Type | Ghi chú |
|-------|------|---------|
| `user_email` | TEXT | Email user |
| `khoi` | TEXT | Khối nào |
| `permission_level` | ENUM(EA, VI, VA) | Mức quyền |

→ UNIQUE (user_email, khoi): 1 user chỉ có 1 level per khối.

### 6b. Bảng `superadmins`

| Field | Type | Ghi chú |
|-------|------|---------|
| `user_email` | TEXT | Email SA. UNIQUE |

### 6c. Bảng `employee_reviewers`

| Field | Type | Ghi chú |
|-------|------|---------|
| `employee_id` | UUID | FK → employees.id |
| `reviewer_email` | TEXT | Email người nghiệm thu |

→ UNIQUE (employee_id, reviewer_email). Chỉ SA thêm/xóa.

---

*Cập nhật: 2026-04-05 — v2.6.0*
