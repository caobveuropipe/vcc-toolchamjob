# 📝 FEATURE_TASKS — Project Master Plan

> Bản roadmap tổng thể cho **coordinator** điều phối tiến trình.
> Mỗi Phase khi bắt đầu sẽ được lập **FEATURE_PLAN chi tiết riêng** (plan con).
> Tasks ở đây = **milestone/deliverable**, không phải coding tasks.
> **Trạng thái**: 🔄 Đang triển khai (Phase 4) — 2026-04-07

---

## Phase 0: Foundation — Hạ tầng & Database
*Mục tiêu: Thiết lập môi trường chạy được toàn bộ Tech Stack.*
*Deliverable: Deploy thành công 2 services lên Cloud Run, login Google OK.*
*Chi tiết: [Phase 0 FEATURE_PLAN](../phase-0-foundation/FEATURE_PLAN.md) (Approved 2026-03-14)*

- [x] Task 0.1: Khởi tạo pnpm Monorepo (frontend + backend + packages/shared)
- [x] Task 0.2: Setup Frontend (Vite + React 19 + Ant Design + Zustand + React Query)
- [x] Task 0.3: Setup Backend (Hono + tsup bundle + Supabase client + Upstash Redis client)
- [x] Task 0.4: Setup shared package (Zod schemas + TypeScript types + tsup build ESM/CJS). ⚠️ `zodToAntRules` defer → Phase 2
- [x] Task 0.4b: Tạo `SALARY_FIELDS` constant trong `packages/shared/constants/` — danh sách tên tất cả salary columns. CI test verify constant đồng bộ với actual columns bảng `salaries` (SEC-REV-03)
- [x] Task 0.5: Deploy 001_schema.sql **v2.5.0** lên Supabase Database
- [x] Task 0.5b: Verify RLS đã bật trên **tất cả 9 bảng** (deny_direct_access) — SEC-01→05
- [x] Task 0.5c: Setup `database/migrations/` folder + README quy ước migration
- [x] Task 0.6: Cấu hình Supabase Auth (Google Provider)
- [x] Task 0.7: Setup Dockerfile & Nginx (FE) + Dockerfile (BE) — build từ **root context** (`-f Dockerfile .`)
- [x] Task 0.8: Setup GitHub Actions CI/CD lên Cloud Run (2 services) + Cloud Run config (FE 256Mi, BE 512Mi, min=0)
- [x] Task 0.9: Cấu hình env variables — tách `.env.example` riêng FE/BE. Production secrets qua **GCloud Secret Manager**.
- [x] Task 0.10: Setup Hono Middlewares: CORS (FE domain only) + Error Handler (strip secrets). ⚠️ Rate Limit defer → Phase 1
- [x] Task 0.10b: Setup Nginx Security Headers (HSTS, NoSniff, X-Frame-Options, Referrer, Permissions)
- [x] Task 0.11: Health check: `GET /health` (lightweight, Cloud Run probe) + `GET /health/detail` (full DB+Redis check)
- [x] Task 0.F: 🧪 Verify Phase 0: 2 services live trên Cloud Run, login Google OK, DB connected, health check 200

---

## Phase 1: NS-004 Core — Auth & Permission Engine
*Mục tiêu: Xây dựng "trái tim" của hệ thống — Bộ lọc quyền.*
*Deliverable: API middleware check quyền EA/VI/VA/SA hoạt động đúng, cache Redis OK.*

- [x] Task 1.1: BE — Hono Middleware xác thực JWT từ Supabase (local verify JWKS + fallback getUser())
- [x] Task 1.2: BE — Permission Resolver: SA → Reviewer EA → Khối Permission (EA/VI/VA)
- [x] Task 1.3: BE — Upstash Redis cache permission matrix (TTL 5min, invalidate on change)
- [x] Task 1.4: BE — Middleware chặn truy cập chéo khối (**IDOR protection**) + ẩn Salary fields cho VI (dùng `SALARY_FIELDS` constant)
- [x] Task 1.4a: BE — Redis fallback: khi Redis unavailable → query permission trực tiếp từ DB (superadmins + user_permissions + employee_reviewers). KHÔNG skip permission check (SEC-REV-05)
- [x] Task 1.4c: BE + Test — Route VI bắt buộc dùng view `employee_info_only`. Unit test: response VI không chứa salary fields (SEC-REV-02)
- [x] Task 1.4b: FE — Export Util: tự động chèn Watermark (email, date, khoi) vào file Excel
- [x] Task 1.5: BE — Permission Seeder & Seed data: tạo SA + permission test users cho development. (SEC-REV-01)
- [x] Task 1.6: FE — Auth flow & Guard: Login/Logout UI + hydration gate + logic route-level check. (SEC-REV-06)
- [x] Task 1.F: 🧪 Verify Phase 1: Truy cập API với các user khác quyền — log đúng, cache hit/miss, fallback DB OK.

---

## Phase 2: NS-001 — Quản lý nhân sự (Employee CRUD)
*Mục tiêu: Hoàn thiện CRUD nhân sự và luồng phòng chờ.*
*Deliverable: CRUD NS hoạt động, phòng chờ có, search/filter OK.*

- [x] Task 2.1: API — CRUD employees (GET list + pagination, GET detail, POST, PUT, DELETE soft, state transition). *(Kèm cờ `can_edit: boolean` trên từng row)*.
- [x] Task 2.2: FE — Dashboard danh sách NS (Ant Table, server-side pagination, search/filter/sort)
  - Search: tìm theo `ho_va_ten` (ILIKE) và `email` — cần index GIN/B-tree
- [x] Task 2.3: API & FE — Luồng "Thêm mới" → phòng chờ (state_phong_cho = true)
- [x] Task 2.3a: API & Infra — Upload giấy tờ nhân sự (R2 Signed URL + `employee_documents`) + **AI OCR auto-fill** (đọc ảnh → tự điền form)
- [x] Task 2.3b: FE — Component upload file + AI OCR trigger trong form tạo/sửa NS (`temp_uuid` linking, preview, xóa file, nút "AI Đọc")
- [x] Task 2.4: API & FE — Luồng "Cập nhật" (điều chuyển khối/phong_ban)
- [x] Task 2.5: FE — Màn hình Phòng chờ (Pending Room) & Nút Submit
- [x] Task 2.6: BE — Auto ghi Change History khi sửa Employee fields
- [x] Task 2.7: FE — Export danh sách NS ra Excel (xlsx) — watermark chính thức
- [x] Task 2.8: FE — Trang chi tiết NS + State transition UI
- [x] Task 2.9: BE — Fix email duplicate (cho phép trùng, FE cảnh báo) *(Done 2026-03-31)*
- [x] Task 2.F: 🧪 Verify Phase 2: Luồng nhập NS → Upload giấy tờ → AI OCR → Phòng chờ → Submit → Hiển thị

---

## Phase 3: NS-002 — Quản lý tiền lương (Salary CRUD)
*Mục tiêu: Xử lý dữ liệu nhạy cảm nhất — salary 25 fields.*
*Deliverable: Sửa lương hoạt động, inline edit, change history đúng quyền.*

- [x] Task 3.1: API — CRUD salary (GET, PUT) + enforce EA/SA/VA/Reviewer access + Audit Log
- [x] Task 3.2: FE — Form nhập lương Giấy tờ & Cơ chế (Ant Form + Zod validation, 25 fields)
- [x] Task 3.3: FE — Inline edit salary trên Ant Table
- [x] Task 3.4: API & FE — View Change History (ẩn salary fields cho VI)
- [x] Task 3.5: BE — Business rule: block sửa lương NS đã nghỉ việc
- [x] Task 3.6: FE — Export salary ra Excel
- [x] Task 3.F: 🧪 Verify Phase 3: Sửa lương EA/VA/Reviewer vs VI, Change History filter đúng

---

## Phase 4: Admin & Migration — Quản lý quyền & Nhập liệu
*Mục tiêu: SA tools + Import 4000+ NS vào hệ thống.*
*Deliverable: SA quản lý quyền, migration script chạy thành công.*

- [/] Task 4.1: API & FE — Màn hình SA quản lý ma trận quyền (User → Khối → EA/VI/VA)
- [/] Task 4.2: API & FE — Màn hình SA gán Người nghiệm thu (Reviewers)
- [/] Task 4.3: FE — Dashboard SA phát hiện "Reviewer Mismatch" (NS đổi khối)
- [/] Task 4.4: Script — Import data từ Google Sheets/Excel → employees & salaries
- [ ] Task 4.F: 🧪 Verify Phase 4: Import 100 NS mẫu, SA gán quyền + reviewer OK

---

## Phase 5: Production Polish — Hoàn thiện & Demo & Go-live
*Mục tiêu: Tối ưu, bảo mật, deploy production, demo cho người dùng sớm.*
*Deliverable: Hệ thống production-ready cho demo, HR sử dụng được (chưa cần Snapshot).*
*Chi tiết: [Phase 5 FEATURE_PLAN](../phase-5-production-polish/FEATURE_PLAN.md) (Draft 2026-04-08)*

- [ ] Task 5.0a: DevOps — Setup GitHub Actions CD pipelines (`deploy-fe.yml`, `deploy-be.yml`) → Artifact Registry → Cloud Run. *(Gap từ Phase 0 — Task 0.8.2–0.8.5)*
- [ ] Task 5.0b: DevOps — Setup GCP Secret Manager + inject secrets vào Cloud Run env. Đảm bảo secrets KHÔNG log ra console. *(Gap từ Phase 0 — Task 0.9.5)*
- [ ] Task 5.0c: DevOps — Stress test RAM export (4000 rows < 512Mi Cloud Run memory limit). *(Gap từ Phase 0 — Task 0.F.24)*
- [ ] Task 5.1: Review Supabase RLS policies (đã bật Phase 0 với deny_direct_access, xem xét nâng cấp nếu cần)
- [ ] Task 5.2: Audit toàn bộ Audit Log & kiểm tra data integrity
- [ ] Task 5.3: Tối ưu hiệu năng (DB indexes review, Redis caching, FE lazy loading)
- [ ] Task 5.4: UAT testing với HR team + fix bugs
- [ ] Task 5.5: Viết hướng dẫn sử dụng cho HR users
- [ ] Task 5.6: Go-live chính thức & monitoring setup
- [ ] Task 5.F: 🧪 Verify Phase 5: Full regression test, performance OK, HR sign-off, 2 Cloud Run services accessible

---

## Phase 6: NS-003 — Chốt danh sách tháng (Snapshot)
*Mục tiêu: Lưu trữ dữ liệu lịch sử per khối per tháng.*
*Deliverable: Chốt/Unlock snapshot hoạt động, cảnh báo phòng chờ.*

- [ ] Task 6.1: API — create_monthly_snapshot (per khối) + lock/unlock logic
- [ ] Task 6.1b: BE — Snapshot route middleware hard-check: `if (role === 'VI') → 403`. Integration test verify VI luôn bị chặn ở mọi endpoint `/api/snapshots/*` (SEC-REV-04)
- [ ] Task 6.2: FE — Màn hình quản lý Snapshot (lọc theo khối, nút Chốt/Lock)
- [ ] Task 6.3: FE — Cảnh báo "NS đang ở phòng chờ" khi bấm Chốt
- [ ] Task 6.4: API — Unlock snapshot (SA only + ghi lý do + Audit Log)
- [ ] Task 6.5: Tối ưu — Điều chỉnh `staleTime` và Polling interval (`refetchInterval`) dựa trên cost/performance thực tế sau Go-live.
- [ ] Task 6.F: 🧪 Verify Phase 6: Chốt khối A → locked → SA unlock → draft → rechốt

---

## 📊 Tổng kết

| Phase | Tasks | Phụ thuộc | Ước tính |
|-------|-------|-----------|----------|
| **0** Foundation | 15 | — | ~17-21h |
| **1** Permission | 9 | Phase 0 | — |
| **2** NS-001 | 10 | Phase 1 | — |
| **3** NS-002 | 7 | Phase 1, 2 | — |
| **4** Admin | 5 | Phase 1 | — |
| **5** Go-live | 10 | Phase 0-4 | — |
| **6** NS-003 | 6 | Phase 2 | — |

> **Ghi chú**: Phase 2, 3, 4 có thể chạy song song sau khi Phase 1 hoàn tất (với team nhiều người).
> Phase 5 (Go-live/Demo) có thể tiến hành ngay sau Phase 4 mà không cần đợi Phase 6 (Snapshot).
> Ước tính timeline sẽ được bổ sung khi bắt đầu từng Phase.

---

## ## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-03-17 | 0 | All | Hoàn thành hạ tầng, monorepo, deploy Cloud Run | ✅ | — |
| 2026-03-26 | 1 | All | Hoàn thành Auth & Permission Engine, cache Redis, seeder | ✅ | — |
| 2026-03-26 | Mid-3 | 3.x | Thêm trường `tam_ung_hang_thang` vào DB và Shared Package | ✅ | Chuẩn bị cho Salary CRUD |
| 2026-03-26 | Current| — | Cập nhật Master Plan tasks list | 🔄 | Theo yêu cầu User |
| 2026-03-31 | — | — | Đổi thứ tự Phase: Go-live (5) trước Snapshot (6). Thêm task upload giấy tờ vào Phase 2. Sửa version stale. | ✅ | Review FR-01→05 |
| 2026-03-31 | 5 | 5.0a–c | Gộp 3 gaps Phase 0 (CD pipeline, Secret Manager, Stress test) vào Phase 5 | ✅ | Gap analysis Phase 0 |
| 2026-04-06 | 2 | All | Hoàn tất Phase 2: Upload R2, AI OCR, Export Excel, Detail Page & State UI | ✅ | Audit & Sync |
| 2026-04-07 | 3 | All | Hoàn tất Phase 3: Salary CRUD + Salary Pending Isolation | ✅ | Đã archive feature |
| 2026-04-07 | 4 | All | Đã duyệt Feature Plan Phase 4: Admin Polish & Migration | 🔄 | Bắt đầu triển khai |
| 2026-04-08 | 5 | All | Đã lập Feature Plan Phase 5: Production Polish | ⏳ | Chờ review |

---

*Cập nhật: 2026-04-07 — Phase 4 đang triển khai (Admin & Migration).*
*Mỗi Phase khi bắt đầu sẽ được lập FEATURE_PLAN chi tiết riêng.*
