# 📁 Business Layer — Hub Điều Hướng

> **Vai trò**: Tầng giữa trong luồng tài liệu dự án.
> **Luồng**: `docs/business-flows/` (nguồn sự thật) → `.agent/business/` (data + module specs) → `database/001_schema.sql`

---

## 1. Nguồn sự thật (Source of Truth)

| File | Mô tả |
|------|------|
| [docs/business-flows/00-MASTER-INDEX.md](../../docs/business-flows/00-MASTER-INDEX.md) | 🔴 Bộ tài liệu luồng nghiệp vụ chuẩn hóa — đọc ĐẦU TIÊN |

---

## 2. Data Contracts

| File | Mô tả | Version |
|------|------|---------|
| [data/SCHEMA.md](./data/SCHEMA.md) | Định nghĩa toàn bộ fields (employees, salaries, snapshots, audit) | v2.5.0 |
| [data/STATE_MACHINES.md](./data/STATE_MACHINES.md) | Bảng chuyển trạng thái nhân sự + phòng chờ + snapshot | v2.5.0 |
| [data/PERMISSION_MATRIX.md](./data/PERMISSION_MATRIX.md) | Ma trận phân quyền EA/VI/VA/SA per khối | v2.5.0 |

---

## 3. Module Specs (Reference Only)

> ⚠️ Source of truth cho luồng nghiệp vụ đã chuyển sang `docs/business-flows/`.
> Các file dưới đây giữ lại làm **technical reference** cho Validation Rules và Implementation details.

| File | Module | Mô tả | Version |
|------|--------|------|---------|
| [modules/NS-001_employee_crud.md](./modules/NS-001_employee_crud.md) | NS-001 | Quản lý thông tin nhân sự | v2.0.0 |
| [modules/NS-002_salary_crud.md](./modules/NS-002_salary_crud.md) | NS-002 | Quản lý tiền lương | v2.1.1 |
| [modules/NS-003_monthly_snapshot.md](./modules/NS-003_monthly_snapshot.md) | NS-003 | Chốt danh sách tháng | v2.1.1 |
| [modules/NS-004_permissions.md](./modules/NS-004_permissions.md) | NS-004 | Quản lý phân quyền | v2.1.1 |

---

## 4. Database Implementation

| File | Mô tả | Version |
|------|------|---------|
| [database/001_schema.sql](../../database/001_schema.sql) | Schema SQL gốc (10 bảng, 2 views, 1 function) | v2.5.0 |
| [database/migrations/](../../database/migrations/) | Migration files cho các thay đổi schema | — |

---

*Tạo: 2026-03-31. Luồng tài liệu: docs/ → business/ → database/*
