# Test Cases: Kiểm thử xác minh tác động và an toàn của PR #8 & PR #9 (Snapshot Detail API)

> **Feature slug**: `pr8-pr9-verification-tests`
> **Ngày cập nhật**: 2026-07-28

---

## 1. Safety Guard & Local DB Check

- [x] **TC-SG-01 (Happy Path)**: Pass validation khi `SUPABASE_URL = http://127.0.0.1:54321`.
- [x] **TC-SG-02 (Happy Path)**: Pass validation khi `SUPABASE_URL = http://localhost:54321`.
- [x] **TC-SG-03 (Negative)**: Crash process/throw error khi protocol là `https:`.
- [x] **TC-SG-04 (Negative)**: Crash process/throw error khi URL trỏ về Supabase Cloud (`https://xyz.supabase.co`).
- [x] **TC-SG-05 (Negative)**: Crash process/throw error khi port sai (`http://127.0.0.1:54322`).
- [x] **TC-SG-06 (Security)**: Chặn tấn công hostname lừa đảo (`http://127.0.0.1.attacker.com:54321`).
- [x] **TC-SG-07 (Negative)**: Chặn chạy `seed_dev_users.ts` nếu URL DB không phải local Docker port 54321.

---

## 2. Service Month Parsing & Branch Matrix (`getSnapshotEmployeesDetail`)

- [x] **TC-SM-01 (Happy Path)**: Parse `T6.2024` -> Query DB với `month = 2024-06`, format output trả về `T6.2024`.
- [x] **TC-SM-02 (Happy Path)**: Parse `T06.2024` -> Query DB với `month = 2024-06`.
- [x] **TC-SM-03 (Happy Path)**: Parse `T12.2024` -> Query DB với `month = 2024-12`.
- [x] **TC-SM-04 (Negative)**: `T0.2024` -> Throw `INVALID_FORMAT` (400 Bad Request).
- [x] **TC-SM-05 (Negative)**: `T13.2024` -> Throw `INVALID_FORMAT` (400 Bad Request).
- [x] **TC-SM-06 (Negative)**: Over-padded month `T001.2024` -> Throw `INVALID_FORMAT` (400 Bad Request).
- [x] **TC-SM-07 (Negative)**: Over-padded month `T012.2024` -> Throw `INVALID_FORMAT` (400 Bad Request).
- [x] **TC-SM-08 (Negative)**: Chuỗi ngày chuẩn `2024-06` -> Throw `INVALID_FORMAT` (400 Bad Request).
- [x] **TC-SM-09 (Negative)**: Chuỗi ngẫu nhiên `abc` -> Throw `INVALID_FORMAT` (400 Bad Request).
- [x] **TC-SM-10 (Query Guard)**: Assert Supabase query builder gọi `.neq('snapshots.snapshot_status', 'deleted')`.

---

## 3. Integration & API Security (`GET /api/snapshots/employees-detail`)

- [x] **TC-API-01 (Security)**: Thiếu header `x-api-key` -> Return 401 Unauthorized.
- [x] **TC-API-02 (Security)**: Header `x-api-key` sai -> Return 401 Unauthorized.
- [x] **TC-API-03 (Security)**: Header `x-api-key` rỗng `""` -> Return 401 Unauthorized.
- [x] **TC-API-04 (Validation)**: Thiếu query param `thang` -> Return 400 Bad Request.
- [x] **TC-API-05 (Validation)**: Query param `thang=T15.2024` -> Return 400 Bad Request.
- [x] **TC-API-06 (Routing)**: `GET /api/snapshots/employees-detail` không đi nhầm vào dynamic route `/api/snapshots/:id`.
- [x] **TC-API-07 (Data Assertion)**: Gọi với `x-api-key` đúng trả về HTTP 200 OK kèm danh sách 12 trường thông tin chi tiết và 2 trường lương target (`luong_target_gt`, `luong_target_cc`).
