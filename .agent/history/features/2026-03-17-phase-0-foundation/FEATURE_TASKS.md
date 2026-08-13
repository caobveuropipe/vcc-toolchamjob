# 📝 FEATURE_TASKS — Phase 0: Foundation

> Tracker cho Phase 0. Mỗi task có sub-tasks chi tiết.
> Xem [FEATURE_PLAN.md](./FEATURE_PLAN.md) cho context đầy đủ.
> ✅ Reviewed: 2026-03-14 | Review 2 & 3 (Phản biện): 2026-03-14 | Phương án A

---

## Nhóm A: Monorepo & Packages

- [x] **Task 0.1**: Khởi tạo pnpm Monorepo ✅
  - [x] 0.1.1: `package.json` root với scripts
  - [x] 0.1.2: `pnpm-workspace.yaml` (3 workspaces)
  - [x] 0.1.3: `.npmrc` (KHÔNG `shamefully-hoist`)
  - [x] 0.1.4: `tsconfig.base.json`
  - [x] 0.1.5: Cập nhật `.gitignore`
  - **Verify**: ✅ `pnpm install` OK (4 workspace projects), `pnpm -r list` hiện 3 workspaces + root
  - ⚠️ **R02**: `pnpm-lock.yaml` đã tạo — cần commit vào repo

- [x] **Task 0.4**: Setup shared package (`packages/shared` + tsup)
  - [x] 0.4.1: `package.json` (`@vcc/shared`)
  - [x] 0.4.2: `tsconfig.json`
  - [x] 0.4.3: Cài `zod` + `tsup`
  - [x] 0.4.4: `tsup.config.ts` (ESM + CJS + dts)
  - [x] 0.4.5: Tạo cấu trúc thư mục (schemas, types, constants)
  - [x] 0.4.6: Zod schema Employee (24 fields)
  - [x] 0.4.7: Zod schema Salary (24 fields)
  - [x] 0.4.8: Zod schema Snapshot, ChangeHistory, AuditLog
  - [x] 0.4.9: Types API Response format
  - [x] 0.4.10: Types Permission (EA/VI/VA/SA)
  - [x] 0.4.11: Constants `KHOI_VALUES`, `ERROR_CODES`
  - [x] 0.4.12: Build test → output .js + .mjs + .d.ts
  - [x] 0.4.13: **(R06)** CI test verify Zod schema ↔ DB columns sync
  - **Verify**: ✅ Import `@vcc/shared` hoạt động, Zod validate đúng, CI sync test pass
  - ⚠️ `zodToAntRules()` defer → Phase 1

- [x] **Task 0.4b**: Tạo `SALARY_FIELDS` constant (SEC-REV-03)
  - [x] 0.4b.1: `salary-fields.ts` (24 field names)
  - [x] 0.4b.2: CI test verify đồng bộ DB
  - [x] 0.4b.3: Export type `SalaryFieldName`
  - **Verify**: ✅ Constant chứa đúng 24 fields

---

## Nhóm B: Frontend

- [x] **Task 0.2**: Setup Frontend (Vite + React 19 + Ant Design v6) ✅
  - [x] 0.2.1: Khởi tạo Vite project
  - [x] 0.2.2: Cài dependencies (antd, zustand, tanstack-query, react-router, lucide, xlsx, supabase-js)
  - [x] 0.2.3: Cài devDependencies
  - [x] 0.2.4: `tsconfig.json` (paths alias)
  - [x] 0.2.5: `vite.config.ts` (proxy, tspath)
  - [x] 0.2.6: Tạo cấu trúc thư mục
  - [x] 0.2.7: Ant Design v5 theme tokens (ConfigProvider)
  - [x] 0.2.8: React Router v7 routes placeholder (6 routes)
  - [x] 0.2.9: TanStack Query `QueryClientProvider`
  - [x] 0.2.10: Supabase client init (Auth only)
  - [x] 0.2.11: Login page cơ bản (Google Login)
  - [x] 0.2.12: `authStore.ts` (Zustand)
  - [x] 0.2.13: API client wrapper (`services/api.ts`)
  - [x] 0.2.14: Dev server test
  - **Verify**: ✅ `pnpm --filter frontend dev` OK, trang Login hiển thị

---

## Nhóm C: Backend

- [x] **Task 0.3**: Setup Backend (Hono + tsup) ✅
  - [x] 0.3.1: `package.json` + dependencies (hono, hono/node-server, supabase-js, upstash/redis)
  - [x] 0.3.2: DevDependencies (tsx, tsup, typescript)
  - [x] 0.3.3: `tsup.config.ts` (bundle all → single file)
  - [x] 0.3.4: `tsconfig.json`
  - [x] 0.3.5: Tạo cấu trúc thư mục (config, lib, middleware, routes, services)
  - [x] 0.3.6: `config/env.ts` (Zod validate env vars)
  - [x] 0.3.7: Supabase client init (service_role key)
  - [x] 0.3.8: Redis client init (@upstash/redis) — ✅ (R09/R10) Logic `/health/detail` đã ping thực tế
  - [x] 0.3.9: Hono app entry point — ✅ Đã xóa ký tự rác
  - [x] 0.3.10: Scripts: `dev` (tsx watch), `build` (tsup)
  - [x] 0.3.11: Dev server test — ✅ Build pass sau khi clean-up
  - **Verify**: ✅ Backend build OK, logic /health/detail đạt chuẩn full-check
  - ⚠️ Rate Limit defer → Phase 1

- [x] **Task 0.10**: Setup Hono Middlewares (CORS + Error Handler) ✅
  - [x] 0.10.1: CORS middleware (FE domain only)
  - [x] 0.10.2: Error Handler (strip secrets)
  - [x] 0.10.3: Request Logger
  - **Verify**: ✅ Middlewares configured and verified against Nginx CSP
  - ⚠️ Rate Limit defer → Phase 1

- [x] **Task 0.11**: Health Check Endpoints ✅
  - [x] 0.11.1: `GET /health` — lightweight
  - [x] 0.11.2: `GET /health/detail` — ✅ Có gọi Redis ping thực tế
  - [x] 0.11.3: **(R08)** API key auth cho `/health/detail`
  - **Verify**: ✅ Monitoring tin cậy (DB + Redis real status)

---

## Nhóm D: Database & Auth

- [x] **Task 0.5**: Deploy Schema lên Supabase (v2.4.0) ✅
  - [x] 0.5.1: Tạo Supabase project
  - [x] 0.5.2: Chạy 001_schema.sql v2.4.0 — ⚠️ **(R05)** Nếu `pg_trgm` lỗi, bật qua Dashboard > Extensions trước
  - [x] 0.5.3: Verify 9 bảng
  - [x] 0.5.4: Verify 2 views
  - [x] 0.5.5: Verify function `create_monthly_snapshot`
  - [x] 0.5.6: Verify indexes (bao gồm GIN `ho_va_ten`)
  - **Verify**: ✅ 9 bảng + 2 views + 1 function exist, `pg_trgm` active

- [x] **Task 0.5b**: Kiểm tra bảo mật RLS ✅
  - [x] 0.5b.1: Tạo script verify (`scripts/verify-rls.ts`)
  - [x] 0.5b.2: Chạy script với local env — ✅ Đã bổ sung VITE_SUPABASE_ANON_KEY vào example
  - [x] 0.5b.3: Verify lỗi 403/empty data cho Anon
  - [x] 0.5b.4: Ghi kết quả
  - **Verify**: ✅ Script đã chạy được và verify bảo mật thành công

- [x] **Task 0.5c**: Setup Migration Folder + Quy ước ✅
  - [x] 0.5c.1: Tạo thư mục `database/migrations/`
  - [x] 0.5c.2: Tạo `database/migrations/README.md` (quy ước đặt tên, idempotent, comment header)
  - **Verify**: ✅ Folder exists + README hướng dẫn rõ ràng

- [x] **Task 0.5d**: Khóa RLS đối với Authenticated User (Lỗ hổng số 1) ✅
  - [x] 0.5d.1: Tạo file `database/migrations/002_lock_authenticated_rls.sql`
  - [x] 0.5d.2: Viết câu lệnh `CREATE POLICY ... USING (false)` — ✅ Đã sửa tên bảng snapshots
  - **Verify**: ✅ Migration đã sẵn sàng để deploy

- [x] **Task 0.6**: Cấu hình Supabase Auth (Google Provider) ✅
  - [x] 0.6.1: Viết tài liệu hướng dẫn cấu hình (`docs/auth-setup-guide.md`)
  - [x] 0.6.2: Frontend integration (đã xong ở Task 0.2)
  - [x] 0.6.3: Redirect URLs
  - [x] 0.6.4: Test login → JWT token
  - **Verify**: ✅ Hướng dẫn sẵn sàng, code integration và login test thành công.

---

## Nhóm E: Docker & Deployment

- [x] **Task 0.7**: Dockerization Setup ✅
  - [x] 0.7.1: `frontend/Dockerfile` — ✅ Đã copy tsconfig.base.json
  - [x] 0.7.2: `frontend/nginx.conf` — ✅ Sửa CSP, thêm Security Headers (HSTS, etc.)
  - [x] 0.7.3: `backend/Dockerfile` — ✅ Đã copy tsconfig.base.json
  - [x] 0.7.4: `.dockerignore` — ✅ Đã loại bỏ .agent context
  - [x] 0.7.5: `docker-compose.yml` (Stack test)
  - **Verify**: ✅ Docker build đã sẵn sàng và được tối ưu
  - ⚠️ **(R12)** Dùng pnpm store cache mount để tăng tốc build CIOK từ root context

- [x] **Task 0.10b**: Nginx Security Headers ✅
  - [x] 0.10b.1: 5 headers (HSTS, NoSniff, X-Frame, Referrer, Permissions-Policy)
  - **Verify**: ✅ `nginx.conf` configured with security headers

- [x] **Task 0.9**: Cấu hình Env Variables ⏩
  - [x] 0.9.1: `frontend/.env.example`
  - [x] 0.9.2: `backend/.env.example`
  - [x] 0.9.3: `.env.example` ở root — ✅ Đã tạo
  - [x] 0.9.4: `.env.local` files (git-ignored) — ✅ Đã tạo cho FE/BE
  - [ ] 0.9.5: (Moved to Phase 1) Thực thi & Inject secrets (GCP Secret Manager)
  - [x] 0.9.6: Fix lỗi API client — ✅ Đã unwrap data envelope chính xác
  - **Verify**: ✅ Đầy đủ env examples và fix lỗi API wrapper
  - ⚠️ **(R07)** Placeholder dùng `your-xxx-here`, KHÔNG dùng `eyJ...`

- [x] **Task 0.8**: Setup GitHub Actions CI/CD + Cloud Run Config ⏩
  - [x] 0.8.1: `ci.yml` — ✅ Đã sửa Action name và thêm typecheck script
  - [ ] 0.8.2: (Moved to Phase 1) `deploy-fe.yml` — (Sẽ hoàn thiện khi có thông tin GCP)
  - [ ] 0.8.3: (Moved to Phase 1) `deploy-be.yml` — (Sẽ hoàn thiện khi có thông tin GCP)
  - [ ] 0.8.4: (Moved to Phase 1) GitHub Secrets
  - [ ] 0.8.5: (Moved to Phase 1) Cloud Run config
  - **Verify**: ✅ CI Pipeline (validate job) đã sẵn sàng vận hành (Build check: OK)

---

## ✅ Task 0.F: Verify Phase 0

- [x] Checklist 23 items (xem FEATURE_PLAN.md) — ✅ Pass (trừ phần CI/CD Deploy)
- [x] Tất cả tests pass (bao gồm Zod↔DB sync test R06) — ✅ Pass trên CI và local
- [ ] (Moved to Phase 1) 2 Cloud Run services accessible
- [x] Login Google OK — ✅ Tích hợp thành công
- [x] `/health/detail` không có key → 401 (R08) — ✅ Đã check middlewares
- [ ] (Moved to Phase 1) 0.F.24: Stress test RAM cho export (4000 rows < 512Mi)

---

## 📊 Tổng kết

| Nhóm | Tasks | Sub-tasks |
|------|-------|-----------|
| A: Monorepo & Packages | 3 | 19 |
| B: Frontend | 1 | 14 |
| C: Backend | 3 | 18 |
| D: Database & Auth | 4 | 16 |
| E: Docker & Deploy | 4 | 15 |
| **Tổng** | **15** | **~82** |

> **Ước tính**: 20-24 giờ làm việc (solo developer, bao gồm +3h từ Review 2)

### ⏩ Deferred Items
| Item | Defer đến | Lý do |
|------|-----------|-------|
| Rate Limit (`@upstash/ratelimit`) | Phase 1 | Cần auth → user email identifier |
| `zodToAntRules()` utility | Phase 1 | Cần sớm cho các Form |
| `docker-compose.yml` (local dev) | Phase 1 | Phase 0 dùng `pnpm dev` trực tiếp (R04) |
| CI optimize: affected packages | Phase 1+ | `packages/**` trigger cả 2 deploy (R03) |
| CI/CD Deployment (Task 0.8) | Phase 1 | Đang đợi config GCP |

---

*Created: 2026-03-14 | Review 1: 2026-03-14 | Review 2 & 3 (Phản biện): 2026-03-14 | Status: Approved (Phương án A)*
*Đồng bộ với FEATURE_PLAN.md (Phase 0)*
