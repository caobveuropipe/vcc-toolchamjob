---
module_id: NS-004
module_name: Phân quyền theo Khối (EA/VI/VA/SA)
status: draft
priority: P1
actors: [SA]
depends_on: [PERMISSION_MATRIX]
data_scope: [all]
---

# NS-004: Phân quyền theo Khối

> **⚠️ Reference Only**
> Source of truth cho luồng nghiệp vụ đã chuyển sang `docs/business-flows/`. File này giữ lại làm technical reference cho Validation Rules và Implementation details.

## 1. Tổng quan

Module này implement logic phân quyền cho toàn bộ hệ thống. Ma trận phân quyền nằm tại [PERMISSION_MATRIX.md](../data/PERMISSION_MATRIX.md). Module này mô tả **cách thức implement**.

**Mô hình**: Phân quyền per user per khối — mỗi user có 1 permission level (EA/VI/VA) cho từng khối. SA là quyền đặc biệt toàn hệ thống.

---

## 2. Business Rules

### Xác thực
- **BR-004-001**: Mọi user PHẢI đăng nhập trước khi truy cập
- **BR-004-002**: Permission được gán bởi SA. 1 user có thể có nhiều khối

### Data Access
- **BR-004-003**: EA → xem + sửa toàn bộ (employee + salary) cho NS thuộc khối
- **BR-004-004**: VI → chỉ xem employee info. Salary columns **ẩn hoàn toàn**
- **BR-004-005**: VA → xem toàn bộ (employee + salary) nhưng KHÔNG sửa
- **BR-004-006**: SA → toàn quyền mọi khối

### Quyền nguoi_nghiem_thu (bảng `employee_reviewers`)
- **BR-004-007**: IF email user nằm trong bảng `employee_reviewers` THEN → EA cho NS đó
- **BR-004-008**: Quyền này override VI/VA. **Chỉ SA** thêm/xóa reviewer
- **BR-004-009**: Khi NS đổi khối → GIỮ NGUYÊN reviewers + hiển thị cảnh báo UI. SA review qua Dashboard.

### Operations
- **BR-004-010**: Nút "Xóa" → SA only
- **BR-004-011**: Nút "Submit phòng chờ" → EA hoặc SA
- **BR-004-012**: Nút "Tạo/Chốt snapshot" → EA (khối mình) hoặc SA
- **BR-004-013**: Nút "Mở lại snapshot" → SA only
- **BR-004-014**: Quản lý phân quyền → SA only
- **BR-004-015**: Thêm/xóa người nghiệm thu (`employee_reviewers`) → SA only
- **BR-004-016**: Màn hình Dashboard SA tổng hợp "Reviewer Mismatch" (Reviewer khối A - NS khối B)

---

## 3. Workflow: Gán quyền

> **Actor**: SA

1. SA vào quản lý phân quyền
2. Chọn user (theo email)
3. Gán permission level cho từng khối: EA / VI / VA
4. Lưu → Ghi Audit Log

**Gán SA**: SA thêm email vào bảng `superadmins`

---

## 4. Implementation: Authorization Flow

```
Request → Authentication → Authorization → Business Logic
                                │
                                ├── 1. Check: user là SA? → full access
                                ├── 2. Check: user_permissions cho (email, khối NS) → EA/VI/VA
                                ├── 3. Check: email trong `employee_reviewers`? → EA cho NS đó
                                └── 4. Kết hợp: lấy quyền cao nhất (EA > VA > VI > none)
```

### Permission Resolution Order
1. **SA** → toàn quyền, skip các check khác
2. **employee_reviewers** match → EA cho NS cụ thể
3. **user_permissions** (email, khối) → EA/VI/VA
4. **Không có gì** → no access

> **⚠️ Lưu ý**: VI không xem được salary, snapshot, và salary fields trong change_history.

---

## 5. Database Tables

→ Xem [PERMISSION_MATRIX.md#6](../data/PERMISSION_MATRIX.md#6-database-tables)

- `superadmins`: SA users
- `user_permissions`: per user per khối (EA/VI/VA)
- `employee_reviewers`: người nghiệm thu per NS (SA quản lý)

---

## 7. Performance & Optimization

- **BR-004-017**: **Permission Caching** — Tầng API PHẢI có cơ chế cache permission (Redis/In-memory). Cache invalidation khi SA thay đổi bảng phân quyền hoặc reviewers.
- **BR-004-018**: **Rate Limiting** — Enforce 100 req/min (general) và 20 req/min (salary/sensitive).
- **BR-004-019**: **Secret Hardening** — Production secrets (Supabase, Redis) PHẢI lưu trong GCloud Secret Manager. KHÔNG log secrets ra ngoài.
- **BR-004-020**: **IDOR Enforcement** — Backend PHẢI phân giải Employee ID ra Khối thực tế để check quyền, không tin vào tham số lọc (`?khoi=`) từ Client.
- **BR-004-021**: **Redis Fallback** — Khi Redis unavailable (timeout, connection error), middleware PHẢI fallback query permission trực tiếp từ DB (3 bảng: `superadmins`, `user_permissions`, `employee_reviewers`). **KHÔNG BAO GIỜ** skip permission check. **KHÔNG** dùng default permissions.
- **BR-004-022**: **Snapshot VI Hard-Check** — Route `/api/snapshots/*` PHẢI có middleware check cứng: `if (role === 'VI') → return 403`. Không phụ thuộc permission resolver chung. Vì `snapshot_employees` gộp cả salary data.
- **BR-004-023**: **SALARY_FIELDS Constant** — Tất cả nơi cần filter/ẩn salary fields (change_history cho VI, response stripping) PHẢI dùng shared constant `SALARY_FIELDS` từ `packages/shared`. CI test verify constant đồng bộ với actual DB columns.
- **BR-004-024**: **View employee_info_only** — Route cho VI BẮT BUỘC query view `employee_info_only` (chỉ employee fields). KHÔNG dùng `employee_full` (chứa salary). Unit test verify response VI không chứa salary fields.
- **BR-004-025**: **Identifier Mapping (Reviewer)** — Mọi Request Payload từ UI/Workflow đều dùng `ma_nhan_su` (VARCHAR). Backend bắt buộc query quy đổi sang `employees.id` (UUID) trước khi authorize quyền Reviewer trên bảng `employee_reviewers`.

---

## 8. Open Questions

- [ ] User login bằng gì? (Google account? Email/Password?)
- [ ] SA có thể gán quyền tạm thời (có expiry) không?

---

*Cross-cutting module.*
*Cập nhật: 2026-03-14 — v2.2.0*
