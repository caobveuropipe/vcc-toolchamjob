---
feature: phase-0-foundation
parent: project-master-plan
status: approved
created: 2026-03-14
updated: 2026-03-14
author: Architect
reviewer: Senior Architect (Review 2026-03-14)
priority: P0
---

# 🏗️ PHASE 0: Foundation — Hạ tầng & Database

> **Mục tiêu**: Thiết lập toàn bộ hạ tầng kỹ thuật để dự án có thể chạy end-to-end.
> **Deliverable**: Deploy thành công 2 services lên Cloud Run, login Google OK, DB connected, health check 200.
> **Phụ thuộc**: Không (Phase đầu tiên).
> **Tham chiếu**: [FEATURE_PLAN.md (Master)](../project-master-plan/FEATURE_PLAN.md) | [001_schema.sql](../../../database/001_schema.sql) v2.4.0

### Review Notes (2026-03-14)
> 13 vấn đề phát hiện (Review 1), tất cả đã được duyệt và apply:
> - VĐ-1: Docker build context → build từ root `-f`
> - VĐ-2: BE build tool → `tsup` bundle all
> - VĐ-3: Cloud Run config cụ thể (min=0, BE 512Mi)
> - VĐ-5: Health check tách `/health` (nhẹ) + `/health/detail` (full)
> - VĐ-6: min-instances=0 (chấp nhận cold start)
> - VĐ-7: Schema version sync → v2.4.0
> - VĐ-8: Thêm migration folder + README quy ước
> - VĐ-9: Rate Limit defer → Phase 1
> - VĐ-10: Tách `.env.example` riêng FE/BE
> - VĐ-11: Bỏ `shamefully-hoist`
> - VĐ-12: `zodToAntRules()` defer → Phase 2
> - VĐ-13: `tsup` cho cả shared + backend

### Review Notes (2026-03-14 — Review 2: Phản biện)
> 11 vấn đề phát hiện, tất cả đã được duyệt (Phương án A — Fix tất cả):
> - R01: Đồng bộ `MASTER.md` min-instances=0 (đã fix)
> - R02: Ghi chú commit `pnpm-lock.yaml` trước Docker build
> - R05: Ghi chú `pg_trgm` extension cho Supabase
> - R06: Thêm Zod↔DB sync test (Task 0.4.13)
> - R07: `.env.example` placeholder rõ ràng (không dùng `eyJ...`)
> - R08: `/health/detail` thêm API key auth (Task 0.11.3)
> - R09: Redis startup graceful degradation

### Review Notes (2026-03-14 — Review 3: Phản biện)
> 4 vấn đề phát hiện mới, tất cả đã được duyệt (Phương án A):
> - R10: Không dùng `await redis.ping()` lúc khởi động Hono để tránh tăng thời gian cold-start cho Cloud Run. Upstash Redis dùng stateless REST API, không cần duy trì kết nối.
> - R11: Thêm `ENV NODE_ENV=production` vào Dockerfile FE & BE để tối ưu dung lượng và không rò rỉ stack trace.
> - R12: Dùng `--mount=type=cache,id=pnpm,target=/pnpm/store` khi build Docker để tăng tốc pipeline CI.
> - R13: Thêm lệnh `server_tokens off;` vào Nginx config để ẩn thông tin version.

---

## 📐 Sơ đồ phụ thuộc Tasks

```
Task 0.1 (Monorepo)
  ├──► Task 0.2 (Frontend Setup)
  ├──► Task 0.3 (Backend Setup)
  └──► Task 0.4 (Shared Package)
          └──► Task 0.4b (SALARY_FIELDS constant)

Task 0.5 (Deploy Schema) ──► Task 0.5b (Verify RLS)
Task 0.5c (Migration folder) ← song song với 0.5
Task 0.6 (Supabase Auth)  ← song song với 0.5

Task 0.2 ──► Task 0.7a (Dockerfile FE)
Task 0.3 ──► Task 0.7b (Dockerfile BE)
Task 0.3 ──► Task 0.10 (Hono Middlewares — CORS + Error Handler)
Task 0.7a ──► Task 0.10b (Nginx Security Headers)

Task 0.9 (Env Variables) ← song song, làm sớm

Task 0.7 + 0.9 ──► Task 0.8 (CI/CD + Cloud Run Config)

Task 0.3 ──► Task 0.11 (Health Check)

ALL ──► Task 0.F (Verify Phase 0)
```

> ⚠️ **Rate Limit** defer sang Phase 1 (cần auth middleware để có user email làm identifier).
> ⚠️ **`zodToAntRules()`** defer sang Phase 1.

---

## 🔧 Nhóm A: Monorepo & Packages (Local Setup)

### Task 0.1: Khởi tạo pnpm Monorepo

**Mục tiêu**: Tạo cấu trúc monorepo chuẩn với pnpm workspaces.

**Sub-tasks**:
- [ ] 0.1.1: Khởi tạo `package.json` root với scripts: `dev`, `build`, `lint`, `typecheck`
- [ ] 0.1.2: Tạo `pnpm-workspace.yaml` khai báo 3 workspaces: `frontend`, `backend`, `packages/*`
- [ ] 0.1.3: Tạo `.npmrc` với `strict-peer-dependencies=false` (KHÔNG dùng `shamefully-hoist` — Ant Design v5 hoạt động tốt với pnpm strict mode)
- [ ] 0.1.4: Tạo `tsconfig.base.json` dùng chung (target ES2022, strict mode, paths alias)
- [ ] 0.1.5: Cập nhật `.gitignore` (node_modules, dist, .env, .env.local)

**Cấu trúc output**:
```
tool-luong-vcc/
├── package.json              ← root
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── .npmrc
├── tsconfig.base.json
├── .gitignore
├── frontend/
├── backend/
└── packages/
    └── shared/
```

**Acceptance Criteria**:
- `pnpm install` chạy thành công từ root, không lỗi
- `pnpm -r list` hiển thị 3 workspaces

> ⚠️ **R02**: `pnpm-lock.yaml` **PHẢI được commit** vào repo sau `pnpm install`. File này cần thiết cho `--frozen-lockfile` trong Docker build (Task 0.7).

---

### Task 0.4: Setup Shared Package (`packages/shared`)

**Mục tiêu**: Tạo package shared chứa Zod schemas, TypeScript types, và constants dùng chung cho cả FE và BE.

**Build tool**: `tsup` — output ESM (cho Vite FE) + CJS (cho Node BE) + `.d.ts` (types).

**Sub-tasks**:
- [ ] 0.4.1: Tạo `packages/shared/package.json` (name: `@vcc/shared`, main: `dist/index.js`, module: `dist/index.mjs`)
- [ ] 0.4.2: Tạo `packages/shared/tsconfig.json` extends `tsconfig.base.json`
- [ ] 0.4.3: Cài dependencies: `zod`. DevDependencies: `tsup`, `typescript`
- [ ] 0.4.4: Tạo `packages/shared/tsup.config.ts`:
  ```typescript
  import { defineConfig } from 'tsup'
  export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],    // 2 format cho FE (Vite) + BE (Node)
    dts: true,                  // Tạo file .d.ts (TypeScript types)
    clean: true,                // Xóa dist/ cũ trước khi build
    sourcemap: true,
  })
  ```
- [ ] 0.4.5: Tạo cấu trúc thư mục:
  ```
  packages/shared/
  ├── src/
  │   ├── schemas/           ← Zod schemas (source of truth)
  │   │   ├── employee.ts    ← Employee schema (24 fields)
  │   │   ├── salary.ts      ← Salary schema (24 fields)
  │   │   ├── snapshot.ts    ← Snapshot schema
  │   │   └── index.ts       ← Re-export
  │   ├── types/             ← TypeScript types (inferred from Zod)
  │   │   ├── employee.ts
  │   │   ├── salary.ts
  │   │   ├── api.ts         ← API Response/Error types
  │   │   ├── permission.ts  ← EA/VI/VA/SA types
  │   │   └── index.ts
  │   ├── constants/         ← Shared constants
  │   │   ├── khoi.ts        ← 10 khối values
  │   │   ├── salary-fields.ts ← SALARY_FIELDS (SEC-REV-03)
  │   │   ├── error-codes.ts ← API error codes
  │   │   └── index.ts
  │   └── index.ts           ← Main entry point
  ├── tsup.config.ts
  ├── tsconfig.json
  └── package.json
  ```
- [ ] 0.4.6: Viết Zod schema cho `Employee` (24 fields) — tham chiếu [SCHEMA.md](../../business/data/SCHEMA.md)
- [ ] 0.4.7: Viết Zod schema cho `Salary` (24 fields) — bao gồm Giấy tờ (6) + Cơ chế (18)
- [ ] 0.4.8: Viết Zod schema cho `Snapshot`, `ChangeHistory`, `AuditLog`
- [ ] 0.4.9: Viết types cho API Response format:
  ```typescript
  // Success (list)
  { data: T[], meta: { total, page, limit, totalPages } }
  // Success (single)
  { data: T }
  // Error
  { error: { code: ErrorCode, message: string, fields?: Record<string, string> } }
  ```
- [ ] 0.4.10: Viết types cho Permission: `PermissionLevel = 'EA' | 'VI' | 'VA'`, `UserPermission`, `PermissionMatrix`
- [ ] 0.4.11: Viết constants `KHOI_VALUES` (10 khối), `ERROR_CODES` (7 mã lỗi)
- [ ] 0.4.12: Build test — `pnpm --filter @vcc/shared build` thành công, output gồm `.js`, `.mjs`, `.d.ts`
- [ ] 0.4.13: **(R06)** Viết CI test verify Zod schema fields đồng bộ với actual DB columns:
  - Test lấy column names từ `information_schema.columns` (bảng `employees`, `salaries`)
  - So sánh với Zod schema keys → Fail nếu mismatch
  - Chạy trong CI pipeline (cần kết nối Supabase test DB)
  - ⚠️ Defer: Logic check connection failure sang Phase 1.
  - Tương tự logic test `SALARY_FIELDS` (Task 0.4b.2) nhưng mở rộng cho toàn bộ schema

> ⚠️ **`zodToAntRules()` utility** defer sang **Phase 1** — Phase 0 chưa có Form nào.

**Acceptance Criteria**:
- Import từ `@vcc/shared` hoạt động trong cả `frontend` và `backend`
- Zod schemas validate đúng theo constraint trong [001_schema.sql](../../../database/001_schema.sql)
- TypeScript types được infer tự động từ Zod (không duplicate)
- `pnpm --filter @vcc/shared build` output cả ESM + CJS + .d.ts
- CI test verify Zod schema ↔ DB columns sync pass (R06)

---

### Task 0.4b: Tạo `SALARY_FIELDS` constant (SEC-REV-03)

**Mục tiêu**: Danh sách tên tất cả salary columns làm shared constant, dùng để filter change_history cho VI.

**Sub-tasks**:
- [ ] 0.4b.1: Tạo `packages/shared/src/constants/salary-fields.ts`:
  ```typescript
  export const SALARY_FIELDS = [
    'luong_target_gt', 'lcd_gt', 'luong_hieu_suat_gt',
    'nhuan_but_gt', 'okr_gt', 'thuong_doanh_so_gt',
    'luong_target_cc', 'luong_cb', 'thuong_hieu_suat_cham_job_nhuan',
    'thuong_kpi_m1', 'thuong_kpi_m2', 'thuong_kpi_m3',
    'thuong_okr_m1', 'thuong_okr_m2', 'thuong_okr_m3',
    'thuong_doanh_so_m1', 'thuong_doanh_so_m2', 'thuong_doanh_so_m3',
    'thuong_du_an_m1', 'thuong_du_an_m2', 'thuong_du_an_m3',
    'thuong_kiem_nhiem_m1', 'thuong_kiem_nhiem_m2', 'thuong_kiem_nhiem_m3',
  ] as const;
  ```
- [ ] 0.4b.2: Viết CI test verify constant đồng bộ với actual columns bảng `salaries` (xem schema SQL)
- [ ] 0.4b.3: Export type `SalaryFieldName = typeof SALARY_FIELDS[number]`

**Acceptance Criteria**:
- Constant chứa đúng 24 salary field names
- CI test sẽ fail nếu thêm cột DB mà không update constant (UC-11 trong test cases)

---

## 🖥️ Nhóm B: Frontend Setup

### Task 0.2: Setup Frontend (Vite + React 19 + Ant Design)

**Mục tiêu**: Khởi tạo project Frontend với đầy đủ dependencies đã chốt.

**Sub-tasks**:
- [ ] 0.2.1: Khởi tạo Vite project: `pnpm create vite frontend --template react-ts`
- [ ] 0.2.2: Cài dependencies chính:
  ```
  antd @ant-design/icons        ← UI Library
  zustand                       ← State Management
  @tanstack/react-query         ← Server State
  react-router-dom              ← Routing v7
  lucide-react                  ← Icons
  xlsx                          ← Excel export
  @supabase/supabase-js         ← Auth only
  zod                           ← Validation (share with BE)
  ```
- [ ] 0.2.3: Cài devDependencies: `@types/react`, `@types/react-dom`, `vite-tsconfig-paths`
- [ ] 0.2.4: Cấu hình `tsconfig.json` — extends root, paths alias `@/*` → `src/*`, `@vcc/shared`
- [ ] 0.2.5: Cấu hình `vite.config.ts` — proxy `/api` tới BE (dev mode), tspath resolution
- [ ] 0.2.6: Tạo cấu trúc thư mục chuẩn:
  ```
  frontend/src/
  ├── components/        ← Reusable UI components
  ├── pages/             ← Route pages
  ├── hooks/             ← Custom hooks (useAuth, useQuery wrappers)
  ├── stores/            ← Zustand stores
  │   ├── authStore.ts   ← Auth state + Supabase listener
  │   ├── permissionStore.ts ← Permission matrix cache
  │   └── uiStore.ts     ← Sidebar, theme, locale
  ├── utils/             ← Helpers
  ├── services/          ← API client (axios/fetch wrapper)
  ├── lib/               ← Supabase client init (AUTH ONLY)
  ├── styles/            ← Global CSS + Ant theme override
  └── App.tsx
  ```
- [ ] 0.2.7: Setup Ant Design v6 theme tokens (ConfigProvider) — dark mode ready
- [ ] 0.2.8: Setup React Router v7 — tạo routes placeholder:
  ```
  /                    → Dashboard (redirect theo quyền)
  /employees           → NS-001 (placeholder)
  /salaries            → NS-002 (placeholder)
  /snapshots           → NS-003 (placeholder)
  /admin/permissions   → NS-004 (placeholder)
  /login               → Login page
  ```
- [ ] 0.2.9: Setup TanStack Query — `QueryClientProvider` trong App.tsx
- [ ] 0.2.10: Tạo Supabase client init (chỉ cho Auth):
  ```typescript
  // src/lib/supabase.ts
  // ⚠️ CHỈ dùng cho Auth (Login/Logout/Token refresh)
  // KHÔNG BAO GIỜ dùng supabase.from() để query data
  ```
- [ ] 0.2.11: Tạo Login page cơ bản (Google Login button dùng Supabase Auth)
- [ ] 0.2.12: Tạo `authStore.ts` (Zustand) — quản lý user session, JWT token
- [ ] 0.2.13: Tạo API client wrapper (`services/api.ts`) — attach JWT token, handle errors
- [ ] 0.2.14: `pnpm --filter frontend dev` chạy thành công, hiển thị trang Login

**Acceptance Criteria**:
- `pnpm --filter frontend dev` khởi động không lỗi
- Truy cập localhost thấy giao diện Login (Ant Design themed)
- Import `@vcc/shared` hoạt động trong FE code

---

## ⚙️ Nhóm C: Backend Setup

### Task 0.3: Setup Backend (Hono)

**Mục tiêu**: Khởi tạo Hono API server kết nối Supabase + Redis.

**Build tool**: `tsup` — bundle all dependencies → single file output.

**Sub-tasks**:
- [ ] 0.3.1: Tạo `backend/package.json` + cài dependencies:
  ```
  hono                          ← Framework
  @hono/node-server             ← Node.js adapter
  @supabase/supabase-js         ← DB client (service_role key)
  @upstash/redis                ← Cache client
  zod                           ← Validation
  ```
- [ ] 0.3.2: Cài devDependencies: `tsx`, `tsup`, `typescript`, `@types/node`
- [ ] 0.3.3: Tạo `backend/tsup.config.ts`:
  ```typescript
  import { defineConfig } from 'tsup'
  export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs'],             // Node.js chỉ cần CJS
    target: 'node20',
    clean: true,
    sourcemap: true,
    noExternal: [/.*/],          // Bundle ALL → single file
  })
  ```
- [ ] 0.3.4: Cấu hình `tsconfig.json` — extends root, target ESNext, moduleResolution bundler
- [ ] 0.3.5: Tạo cấu trúc thư mục:
  ```
  backend/src/
  ├── index.ts              ← Hono app entry point
  ├── config/
  │   └── env.ts            ← Env validation (Zod)
  ├── lib/
  │   ├── supabase.ts       ← Supabase client init (service_role key)
  │   └── redis.ts          ← Upstash Redis client init
  ├── middleware/
  │   ├── auth.ts           ← JWT verify (placeholder, Phase 1)
  │   ├── cors.ts           ← CORS config
  │   └── errorHandler.ts   ← Global error handler (strip secrets)
  ├── routes/
  │   └── health.ts         ← GET /health + /health/detail
  ├── services/             ← Business logic (Phase 1+)
  └── types/                ← BE-specific types
  ```
- [ ] 0.3.6: Tạo `config/env.ts` — validate biến môi trường bằng Zod:
  ```typescript
  // Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  //           UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
  //           FRONTEND_URL (for CORS)
  // Optional: PORT (default 8080)
  ```
- [ ] 0.3.7: Tạo Supabase client init — dùng `service_role` key (bypass RLS)
- [ ] 0.3.8: Tạo Redis client init — `@upstash/redis` REST client
  > ⚠️ **(R09) Graceful Degradation & (R10) No Boot Ping**: Redis client init phải **try-catch**. Nếu init local instance thất bại → fallback. Đặc biệt **KHÔNG** dùng `await redis.ping()` lúc khởi động vì Upstash dùng REST API (stateless), việc gọi API ping sẽ làm chạm đỉnh thời gian cold-start vô ích của Cloud Run.
  ```typescript
  // ✅ Đúng — graceful degradation & KHÔNG ping lúc boot
  let redis: Redis | null = null;
  try {
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
      console.log('✅ Redis client initialized (stateless)');
    }
  } catch (err) {
    console.warn('⚠️ Redis local init failed, running without cache:', err);
    redis = null;
  }
  export { redis };
  ```
- [ ] 0.3.9: Tạo Hono app entry point (`index.ts`) — mount middlewares + routes
- [ ] 0.3.10: Tạo script `dev` — `tsx watch src/index.ts`, script `build` — `tsup`
- [ ] 0.3.11: `pnpm --filter backend dev` chạy thành công, port 8080

> ⚠️ **Rate Limit middleware** (`@upstash/ratelimit`) defer sang **Phase 1** — Phase 0 chưa có auth → không có user email để làm identifier. Phase 0 chỉ có `/health`.

**Acceptance Criteria**:
- `pnpm --filter backend dev` khởi động không lỗi
- Server listen port 8080 thành công
- Import `@vcc/shared` hoạt động trong BE code
- `pnpm --filter backend build` → output single file `dist/index.js`

---

### Task 0.10: Setup Hono Middlewares (CORS + Error Handler)

**Mục tiêu**: Cài đặt middleware bảo mật cơ bản: CORS và Error Handler.

**Phụ thuộc**: Task 0.3

> ⚠️ **Rate Limit** sẽ được thêm ở **Phase 1** (Task 1.x) khi có auth middleware cung cấp user email.

**Sub-tasks**:
- [ ] 0.10.1: **CORS middleware** — chỉ cho phép `FRONTEND_URL`:
  ```typescript
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
  ```
- [ ] 0.10.2: **Error Handler middleware** — global catch:
  - Strip env variables khỏi stack trace (`SUPABASE_SERVICE_ROLE_KEY`, etc.)
  - Trả error response theo format chuẩn: `{ error: { code, message } }`
  - Log lỗi server-side (nhưng không expose chi tiết cho client)
- [ ] 0.10.3: **Request Logger** — log method, path, status code, duration

**Acceptance Criteria**:
- CORS chặn request từ domain không phải FE
- Error response không chứa secrets (test UC-6)

---

### Task 0.11: Health Check Endpoints

**Phụ thuộc**: Task 0.3

**Mục tiêu**: Tạo 2 endpoint health check — 1 nhẹ cho Cloud Run probe, 1 đầy đủ cho debug.

> ⚠️ **Lý do tách**: Cloud Run gọi health check mỗi 10s. Nếu mỗi lần đều ping Redis → ~8,640 req/ngày → gần hết Upstash free tier (10,000/ngày).

**Sub-tasks**:
- [ ] 0.11.1: Tạo `GET /health` — **lightweight** (Cloud Run liveness probe):
  ```json
  { "status": "ok", "timestamp": "2026-03-14T..." }
  ```
  Chỉ xác nhận app đang chạy. **KHÔNG gọi DB/Redis**.
- [ ] 0.11.2: Tạo `GET /health/detail` — **full check** (dev/admin gọi thủ công):
  ```json
  {
    "status": "ok",
    "timestamp": "2026-03-14T...",
    "services": {
      "database": "connected",
      "redis": "connected | unavailable"
    }
  }
  ```
  Check Supabase connection (simple query) + Redis connection (ping).
  Trả `503` nếu critical service (DB) down. Redis unavailable → `degraded` (không phải `503`).
- [ ] 0.11.3: **(R08)** Thêm API key authentication cho `/health/detail`:
  ```typescript
  // Middleware chỉ apply cho /health/detail
  app.use('/health/detail', async (c, next) => {
    const key = c.req.header('X-Health-Key');
    if (key !== env.HEALTH_CHECK_KEY) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });
  ```
  > Env variable `HEALTH_CHECK_KEY` — giá trị random string, set trong Cloud Run env.
  > Ngăn information disclosure (service status) với bên ngoài.

**Acceptance Criteria**:
- `GET /health` trả 200 ngay lập tức (không gọi external service)
- `GET /health/detail` trả 200 khi DB + Redis OK, 503 khi DB down
- `GET /health/detail` **không có header** `X-Health-Key` → trả 401 (R08)
- Cloud Run liveness probe dùng `/health`

---

## 🗄️ Nhóm D: Database & Auth (Supabase)

### Task 0.5: Deploy Schema lên Supabase

**Mục tiêu**: Deploy [001_schema.sql](../../../database/001_schema.sql) **v2.4.0** lên Supabase Database.

**Sub-tasks**:
- [ ] 0.5.1: Tạo Supabase project (nếu chưa có)
- [ ] 0.5.2: Chạy schema SQL qua Supabase SQL Editor
  > ⚠️ **(R05)** Schema sử dụng `CREATE EXTENSION IF NOT EXISTS pg_trgm` cho search index. Trên Supabase, extension thường chạy OK vì SQL Editor dùng quyền `postgres`. Nếu lỗi → vào **Supabase Dashboard > Database > Extensions** → bật `pg_trgm` trước, rồi chạy lại schema.
- [ ] 0.5.3: Verify 9 bảng đã được tạo đúng
- [ ] 0.5.4: Verify 2 views (`employee_full`, `employee_info_only`) hoạt động
- [ ] 0.5.5: Verify function `create_monthly_snapshot` tồn tại
- [ ] 0.5.6: Verify tất cả indexes đã tạo (bao gồm GIN index cho `ho_va_ten`)

**Acceptance Criteria**:
- 9 bảng + 2 views + 1 function exist trên Supabase
- `SELECT * FROM employee_info_only` trả kết quả (empty nhưng không lỗi)
- Extension `pg_trgm` active (R05)

---

### Task 0.5b: Verify RLS (SEC-01→05)

**Phụ thuộc**: Task 0.5

**Sub-tasks**:
- [ ] 0.5b.1: Verify RLS enabled trên tất cả 9 bảng
- [ ] 0.5b.2: Test bằng `anon` key — query `employees` → phải trả empty `[]`
- [ ] 0.5b.3: Test bằng `service_role` key — query `employees` → phải hoạt động bình thường
- [ ] 0.5b.4: Ghi lại kết quả verify vào checklist

**Acceptance Criteria**:
- Anon key: mọi query trả empty (test UC-1 trong test cases)
- Service role key: query hoạt động bình thường

---

### Task 0.5c: Setup Migration Folder + Quy ước

**Mục tiêu**: Tạo thư mục `database/migrations/` và viết hướng dẫn rõ ràng để tương lai AI (hoặc developer) có thể tạo migration đúng cách.

**Lý do**: Sau khi deploy schema lần đầu và có data thật (4000 NS), nếu cần thay đổi cấu trúc DB thì KHÔNG THỂ xóa DB chạy lại `001_schema.sql`. Phải dùng ALTER TABLE qua migration files.

**Sub-tasks**:
- [ ] 0.5c.1: Tạo thư mục `database/migrations/`
- [ ] 0.5c.2: Tạo `database/migrations/README.md` — hướng dẫn quy ước:
  ```markdown
  # Database Migrations
  
  ## Quy tắc đặt tên file
  - Format: `NNN_mô_tả_ngắn.sql` (NNN = số thứ tự 3 chữ số)
  - Ví dụ: `002_add_column_backup_url.sql`, `003_update_audit_action.sql`
  - Bắt đầu từ `002_` vì `001_schema.sql` là file gốc ban đầu.
  
  ## Quy tắc viết migration
  1. **CHỈ dùng ALTER/CREATE INDEX/DROP** — KHÔNG dùng CREATE TABLE
     (vì bảng đã tồn tại có data, CREATE TABLE sẽ lỗi)
  2. **Mỗi file = 1 thay đổi logic** — dễ debug, dễ rollback
  3. **PHẢI chạy được nhiều lần (idempotent)** — dùng `IF NOT EXISTS`,
     `IF EXISTS` để tránh lỗi khi chạy lại:
     ```sql
     -- ✅ Đúng (idempotent)
     ALTER TABLE employees ADD COLUMN IF NOT EXISTS new_col TEXT;
     
     -- ❌ Sai (sẽ lỗi nếu chạy lần 2)
     ALTER TABLE employees ADD COLUMN new_col TEXT;
     ```
  4. **Ghi comment đầu file**: mô tả thay đổi gì, tại sao, ngày tạo
     ```sql
     -- Migration 002: Thêm cột backup_url cho snapshots
     -- Ngày: 2026-04-01
     -- Lý do: Hỗ trợ rechốt workflow — lưu URL backup trên GCS
     -- Tham chiếu: SNAP-04 trong FEATURE_PLAN.md
     ```
  5. **Luôn cập nhật version** trong comment header của `001_schema.sql`
  
  ## Cách chạy migration
  1. Mở Supabase Dashboard → SQL Editor
  2. Paste nội dung file migration → Run
  3. Verify bằng cách kiểm tra cấu trúc bảng
  4. Tick checkbox "đã chạy" trong file migration
  
  ## Thứ tự chạy
  - Chạy theo thứ tự số: 002 → 003 → 004 → ...
  - KHÔNG được bỏ qua file nào
  - KHÔNG được thay đổi nội dung file đã chạy trên production
  ```

**Acceptance Criteria**:
- Thư mục `database/migrations/` tồn tại
- README.md có đầy đủ hướng dẫn để AI/developer đọc và làm đúng

---

### Task 0.6: Cấu hình Supabase Auth (Google Provider)

**Sub-tasks**:
- [ ] 0.6.1: Bật Google OAuth Provider trên Supabase Dashboard
- [ ] 0.6.2: Tạo Google Cloud OAuth credentials (Client ID + Secret)
- [ ] 0.6.3: Cấu hình redirect URLs (localhost cho dev, production URL cho deploy)
- [ ] 0.6.4: Test login Google trên FE → nhận JWT token thành công

**Acceptance Criteria**:
- Bấm "Login with Google" → redirect Google → callback → nhận JWT
- JWT contains `email` claim

---

## 🐳 Nhóm E: Docker & Deployment

### Task 0.7: Setup Dockerfiles

**Phụ thuộc**: Task 0.2 (FE), Task 0.3 (BE)

> ⚠️ **QUAN TRỌNG**: Docker build context phải là **root** (vì monorepo cần `packages/shared`). Dùng `-f` để chỉ định Dockerfile path.
> ```bash
> docker build -f frontend/Dockerfile -t vcc-fe .    # context = root
> docker build -f backend/Dockerfile -t vcc-be .     # context = root
> ```

**Sub-tasks**:
- [ ] 0.7.1: Tạo `frontend/Dockerfile` — multi-stage build:
  ```dockerfile
  # Stage 1: Build (context = repo root)
  FROM node:20-alpine AS builder
  ENV PNPM_HOME="/pnpm"
  ENV PATH="$PNPM_HOME:$PATH"
  RUN corepack enable
  WORKDIR /app
  COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
  COPY packages/shared/ ./packages/shared/
  COPY frontend/ ./frontend/
  # (R12) Use pnpm store cache mount to speed up CI
  RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
  RUN pnpm --filter @vcc/shared build
  RUN pnpm --filter frontend build

  # Stage 2: Serve
  FROM nginx:alpine
  # (R11) Ensure production environment
  ENV NODE_ENV=production
  COPY --from=builder /app/frontend/dist /usr/share/nginx/html
  COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
  EXPOSE 80
  ```
- [ ] 0.7.2: Tạo `frontend/nginx.conf`:
  - `server_tokens off;` (R13 - ẩn version Nginx)
  - SPA fallback (`try_files $uri /index.html`)
  - Gzip enabled
  - Cache static assets (js, css, images)
- [ ] 0.7.3: Tạo `backend/Dockerfile` — multi-stage build:
  ```dockerfile
  # Stage 1: Build (context = repo root)
  FROM node:20-alpine AS builder
  ENV PNPM_HOME="/pnpm"
  ENV PATH="$PNPM_HOME:$PATH"
  RUN corepack enable
  WORKDIR /app
  COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
  COPY packages/shared/ ./packages/shared/
  COPY backend/ ./backend/
  # (R12) Use pnpm store cache mount to speed up CI
  RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
  RUN pnpm --filter @vcc/shared build
  RUN pnpm --filter backend build

  # Stage 2: Run (tsup bundles all → single file)
  FROM node:20-alpine
  # (R11) Ensure production environment
  ENV NODE_ENV=production
  WORKDIR /app
  COPY --from=builder /app/backend/dist/index.js ./index.js
  EXPOSE 8080
  CMD ["node", "index.js"]
  ```
- [ ] 0.7.4: Tạo `.dockerignore` ở root (node_modules, .git, .env, .agent)
- [ ] 0.7.5: Test build local:
  ```bash
  docker build -f frontend/Dockerfile -t vcc-fe .
  docker build -f backend/Dockerfile -t vcc-be .
  ```

**Acceptance Criteria**:
- Cả 2 Docker images build thành công từ **root context**
- FE image serve static files qua Nginx
- BE image start Hono server (single bundled file)

---

### Task 0.10b: Nginx Security Headers

**Phụ thuộc**: Task 0.7

**Sub-tasks**:
- [ ] 0.10b.1: Thêm security headers vào `nginx.conf`:
  ```nginx
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  ```

**Acceptance Criteria**:
- `curl -I` trên FE URL → hiển thị đủ 5 security headers (test UC-5)

---

### Task 0.9: Cấu hình Environment Variables

**Sub-tasks**:
- [ ] 0.9.1: Tạo `frontend/.env.example` (chỉ biến FE public):
  ```env
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
  ```
- [ ] 0.9.2: Tạo `backend/.env.example` (chứa secrets):
  ```env
  # === Supabase ===
  SUPABASE_URL=https://your-project-id.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here      # ⚠️ SECRET — NEVER expose to FE

  # === Upstash Redis ===
  UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
  UPSTASH_REDIS_REST_TOKEN=your-redis-token-here            # ⚠️ SECRET

  # === App ===
  FRONTEND_URL=http://localhost:5173     # For CORS
  PORT=8080

  # === Health Check (R08) ===
  HEALTH_CHECK_KEY=your-random-health-key-here              # For /health/detail auth
  ```
  > ⚠️ **(R07)** Placeholder dùng format `your-xxx-here` — KHÔNG dùng `eyJ...` hay chuỗi giống production key để tránh nhầm lẫn trong commit history.
- [ ] 0.9.3: Tạo `.env.example` ở root — reference tổng hợp (không dùng trực tiếp, chỉ mang tính tài liệu)
- [ ] 0.9.4: Tạo `frontend/.env.local` + `backend/.env.local` (git-ignored) cho development
- [ ] 0.9.5: **Thực thi** setup Google Cloud Secret Manager cho production và tích hợp vào CI/CD:
  - Tạo secrets trên Secret Manager: `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `HEALTH_CHECK_KEY`.
  - Cấu hình CI/CD (GitHub Actions) để inject secrets vào Cloud Run env hoặc sử dụng Secret Manager volumes (R08).
  - Đảm bảo secrets KHÔNG log ra ngoài console trong pipeline.

**Acceptance Criteria**:
- FE chỉ thấy biến `VITE_*` (public), không thấy secrets
- BE chỉ đọc secrets từ `backend/.env`
- Production secrets KHÔNG nằm trong code/repo
- BE startup validate env variables (fail fast nếu thiếu)
- `.env.example` không chứa chuỗi giống real keys (R07)

---

### Task 0.8: Setup GitHub Actions CI/CD + Cloud Run Config

> ⚠️ **Task 0.8 được chuyển sang Phase 1** (CI/CD Deployment) do chưa có resource thực tế trên GCP.

**Phụ thuộc**: Task 0.7, Task 0.9

**Sub-tasks**:
- [ ] 0.8.1: Tạo `.github/workflows/ci.yml` — chạy trên PR:
  - **Duyệt thứ tự build**: Build `@vcc/shared` TRƯỚC các package khác.
  - Lint + TypeCheck + Test cho cả 3 packages.
  - Build check (FE + BE + Shared).
- [ ] 0.8.2: (Deferred to Phase 1) Tạo `.github/workflows/deploy-fe.yml` — deploy FE lên Cloud Run
- [ ] 0.8.3: (Deferred to Phase 1) Tạo `.github/workflows/deploy-be.yml` — deploy BE lên Cloud Run
- [ ] 0.8.4: (Deferred to Phase 1) Cấu hình GitHub Secrets
- [ ] 0.8.5: (Deferred to Phase 1) Cấu hình Cloud Run services

**Acceptance Criteria**:
- Push code → CI chạy tự động (Build check: OK)
- Deployment workflow dời sang Phase 1.

---

## ✅ Task 0.F: Verify Phase 0

**Phụ thuộc**: Tất cả tasks trên

**Checklist cuối Phase 0**:

| # | Kiểm tra | Expected | Status |
|---|----------|----------|--------|
| 1 | `pnpm install` từ root | Thành công, 3 workspaces | ⬜ |
| 2 | `pnpm --filter @vcc/shared build` | Output: .js + .mjs + .d.ts | ⬜ |
| 3 | `pnpm --filter frontend dev` | Dev server chạy OK | ⬜ |
| 4 | `pnpm --filter backend dev` | Hono listen :8080 | ⬜ |
| 5 | `pnpm --filter backend build` | Single file `dist/index.js` | ⬜ |
| 6 | FE import `@vcc/shared` | Compile OK | ⬜ |
| 7 | BE import `@vcc/shared` | Compile OK | ⬜ |
| 8 | Supabase: 9 bảng tồn tại | ✓ | ⬜ |
| 9 | Supabase: RLS `USING(false)` on all 9 | Anon key → empty | ⬜ |
| 10 | Supabase: Google Login | JWT trả về | ⬜ |
| 11 | `GET /health` | 200 OK (không gọi DB/Redis) | ⬜ |
| 12 | `GET /health/detail` (với key) | 200 OK (DB + Redis connected) | ⬜ |
| 13 | Cloud Run FE | URL accessible | ⬜ |
| 14 | Cloud Run BE | URL accessible | ⬜ |
| 15 | CI pipeline | Green on main | ⬜ |
| 16 | CORS test | Block non-FE origin | ⬜ |
| 17 | Security headers | 5 headers present | ⬜ |
| 18 | Error handler | No secrets in response | ⬜ |
| 19 | Docker build FE | Build OK từ root context | ⬜ |
| 20 | Docker build BE | Build OK từ root context | ⬜ |
| 21 | Migration folder | Exists + README có quy ước | ⬜ |
| 22 | `/health/detail` no key | 401 Unauthorized (R08) | ⬜ |
| 23 | Zod↔DB schema sync CI | Test pass (R06) | ⬜ |
| 24 | Stress test RAM export | 4000 rows < 512Mi | ⬜ |

---

## 📋 Thứ tự thực hiện đề xuất (Solo Developer)

> Vì làm một mình, thực hiện **tuần tự theo từng nhóm**:

| Task(s) | Ước tính | Ghi chú |
|------|---------|----------|---------|
| 1 | 0.1 (Monorepo) | ~1h | Nền tảng, làm đầu tiên |
| 2 | 0.4 + 0.4b (Shared + tsup) | ~3-4h | Zod schemas + types + constants |
| 3 | 0.3 + 0.10 + 0.11 (Backend + tsup) | ~3-4h | Hono + CORS + Error Handler + Health |
| 4 | 0.2 (Frontend) | ~3-4h | Vite + React + Ant Design |
| 5 | 0.9 (Env) | ~30min | Tách .env.example FE/BE |
| 6 | 0.5 + 0.5b + 0.5c (DB) | ~1-2h | Deploy schema v2.4.0, verify RLS, migration folder |
| 7 | 0.6 (Auth) | ~1h | Google OAuth setup |
| 8 | 0.7 + 0.10b (Docker) | ~2h | Dockerfiles (root context) + Nginx headers |
| 9 | 0.8 (CI/CD + Cloud Run) | ~2-3h | GitHub Actions + Cloud Run config |
| 10 | 0.F (Verify) | ~1h | Chạy checklist 23 items |

**Tổng ước tính: ~20-24 giờ làm việc** (bao gồm +3h từ Review 2: R06 Zod↔DB test, R08 health auth)

---

## 📎 Tham chiếu

| Tài liệu | Link |
|-----------|------|
| Master Plan | [FEATURE_PLAN.md](../project-master-plan/FEATURE_PLAN.md) |
| Master Tasks | [FEATURE_TASKS.md](../project-master-plan/FEATURE_TASKS.md) |
| Schema SQL | [001_schema.sql](../../../database/001_schema.sql) v2.4.0 |
| Schema Docs | [SCHEMA.md](../../business/data/SCHEMA.md) v2.1.1 |
| Architecture | [MASTER.md](../../architecture/MASTER.md) |
| Security Tests | [security-test-cases.md](../../testing/project-master-plan-security-test-cases.md) |
| Test Cases | [test-cases.md](../../testing/project-master-plan-test-cases.md) |

---

## ⏩ Deferred Items (Nợ kỹ thuật chấp nhận)

| Item | Defer đến | Lý do |
|------|-----------|-------|
| Rate Limit middleware (`@upstash/ratelimit`) | Phase 1 | Cần auth middleware để có user email làm identifier |
| `zodToAntRules()` utility | Phase 1 | Cần utility này sớm cho các Form ở Phase 1 |
| `TEST_DATABASE_URL` check hardening | Phase 1 | Làm cùng Integration tests chuyên sâu |
| `docker-compose.yml` (local dev) | Phase 1 | Phase 0 chạy `pnpm dev` trực tiếp, chưa cần orchestrate FE+BE+Redis (R04) |
| CI optimize: affected packages check | Phase 1+ | Hiện `packages/**` trigger cả 2 deploy pipelines — chấp nhận được cho ~10 users (R03) |

---

*Phase 0 Plan — Created: 2026-03-14 | Review 1: 2026-03-14 | Review 2 (Phản biện): 2026-03-14 | Status: Approved (Phương án A)*
*Khi hoàn thành Phase 0, chuyển sang Phase 1 (NS-004 Core — Auth & Permission Engine).*
