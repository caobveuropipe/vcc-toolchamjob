---
feature: project-master-plan
status: approved
created: 2026-03-13
updated: 2026-04-07
author: Architect
priority: P0
---

# 📋 PROJECT MASTER PLAN — Tool Hiệu Suất VCC v1.0

## 1. Mô tả dự án

Tool quản lý thông tin nhân sự và tiền lương cho VCC (~4000+ NS, 10 khối).
Phân quyền per user per khối (EA/VI/VA/SA). Snapshot hàng tháng per khối.

## 2. Tech Stack

| Thành phần | Công nghệ | Ghi chú |
|-----------|-----------|---------|
| Frontend | Vite + React 19 + TypeScript | CSR, Docker + Nginx |
| Backend | Hono (Node.js) | Nhẹ, TS native, cold start nhanh |
| Database | Supabase (PostgreSQL) | Schema v2.5.0 đã chốt |
| Auth | Supabase Auth (Google Login) | SSO nội bộ |
| Cache | Upstash Redis (@upstash/redis) | Free tier, permission cache |
| Hosting | Google Cloud Run (2 services) | FE: Nginx static, BE: Hono (min 512MB memory) |
| CI/CD | GitHub Actions → Artifact Registry → Cloud Run | Pipeline quen thuộc |
| Monorepo | pnpm workspaces | FE + BE + shared types |

### 2a. Frontend Stack Details (Chốt 2026-03-13)

| Thành phần | Công nghệ | Lý do chọn |
|-----------|-----------|-----------|
| UI Library | **Ant Design v6** | Table/Form/Layout mạnh, phù hợp HR/admin tool |
| State Management | **Zustand** | Nhẹ (1KB), quản lý auth/permission/UI state |
| Server State | **TanStack Query v5** | Cache, pagination, optimistic updates cho 4000 NS |
| Routing | **React Router v7** | Ổn định, phổ biến, ~10 routes |
| Form | **Ant Design Form + Zod (hybrid)** | Ant Form lo UI, Zod schema là source of truth share FE↔BE |
| Table | **Ant Design Table** | Server-side pagination, sort/filter, fixed columns, inline edit |
| Icons | **Lucide React** | Nhẹ, tree-shakeable, quen thuộc từ AI Hub |
| Export | **xlsx (SheetJS)** | Client-side export Excel |
| CSS | **Ant Design v6 theme tokens + vanilla CSS** | Antd lo components, vanilla CSS lo layout/spacing. Không dùng Tailwind — tránh conflict preflight |

## 3. Kiến trúc tổng quan

```
                    ┌──────────────┐
                    │   Browser    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
┌─────────────────────┐   ┌─────────────────────────┐
│  Cloud Run: FE       │   │  Cloud Run: BE           │
│  Vite + React (CSR)  │──▶│  Hono API Server         │
│  Nginx static serve  │   │  Permission middleware   │
│                      │   │  Business logic          │
└─────────────────────┘   └──────────┬──────────────┘
                                     │
                          ┌──────────┼──────────┐
                          ▼                     ▼
                  ┌──────────────┐     ┌──────────────┐
                  │  Supabase    │     │  Upstash     │
                  │  PostgreSQL  │     │  Redis       │
                  │  + Auth      │     │  (Cache)     │
                  └──────────────┘     └──────────────┘
```

## 4. Security Architecture (Hybrid)

- **Tầng 1 (API Server)**: Hono middleware check permission — logic đầy đủ (EA/VI/VA/SA + Reviewers).
- **Tầng 2 (Database)**: Supabase RLS — `USING(false)` trên **tất cả 9 bảng** chặn mọi truy cập trực tiếp từ Phase 0. Backend dùng `service_role` key bypass RLS (Chốt 2026-03-13).
- **Rate Limit**: Hono middleware giới hạn 100 req/min/user (general), 20 req/min/user (salary/sensitive). Chặn hành vi scraping lương (Chốt 2026-03-13).
- **IDOR Protection**: BE luôn kiểm tra quyền trên khối của Employee được query thay vì tin vào request params (Chốt 2026-03-13).
- **Secret Management**: `SUPABASE_SERVICE_ROLE_KEY` và các secrets nhạy cảm được lưu tại **Google Cloud Secret Manager**. Tuyệt đối không log secrets ra console/error logs (Chốt 2026-03-13).
- **Cache**: Permission matrix cached in Upstash Redis (TTL 5min).
- **CORS & Headers**: Hono middleware chỉ cho phép FE domain. Nginx enforce 5 security headers (HSTS, NoSniff, X-Frame-Options, Referrer, Permissions) (Chốt 2026-03-13).
- **JWT Verification**: Local verify JWT signature bằng Supabase JWKS (cache key). Fallback `getUser()` khi verify fail (Chốt 2026-03-13).
- **SALARY_FIELDS Constant**: Shared constant trong `packages/shared` define danh sách tất cả salary field names. BE dùng để filter change_history cho VI. CI test verify constant đồng bộ với actual DB columns (Chốt 2026-03-14).
- **View `employee_info_only`**: View SQL chỉ chứa employee fields (KHÔNG join salary). Route cho VI **bắt buộc** dùng view này. Unit test verify response VI không chứa salary fields (Chốt 2026-03-14).
- **Snapshot VI Hard-Check**: Route `/api/snapshots/*` có middleware check cứng: `if VI → 403`. Không phụ thuộc permission resolver chung. Integration test verify VI luôn bị chặn (Chốt 2026-03-14).
- **Redis Fallback**: Khi Redis unavailable, middleware **fallback query permission từ DB** (3 bảng: superadmins, user_permissions, employee_reviewers). KHÔNG BAO GIỜ skip permission check. KHÔNG dùng default permissions (Chốt 2026-03-14).

### 4f. FE Supabase Client — Quy tắc sử dụng (Chốt 2026-03-13)

> ⚠️ **QUY TẮC BẮT BUỘC**: FE chỉ dùng `@supabase/supabase-js` cho **2 việc duy nhất**:
> 1. **Login/Logout Google** (`supabase.auth.signInWithOAuth()`)
> 2. **Lắng nghe token refresh** (`supabase.auth.onAuthStateChange()`)
>
> **KHÔNG BAO GIỜ** dùng `supabase.from()` để query/insert data. Mọi data request **PHẢI** đi qua Hono API.

- **Tầng bảo vệ kép**: RLS `USING(false)` đảm bảo kể cả developer viết sai `supabase.from()`, Supabase cũng **chặn** — trả về rỗng.
- **Lý do**: `SUPABASE_ANON_KEY` nằm trong FE JS bundle (public). Nếu không bật RLS, bất kỳ ai inspect browser đều bypass Hono API, truy cập thẳng salary data.

### 4a. Permission Cache Invalidation (Active — Chốt 2026-03-13)

- **Strategy**: Active Invalidation + TTL 5min safety net
- Khi SA thay đổi quyền (gán/xóa permission, gán/xóa reviewer) → API **xóa Redis key** của user bị ảnh hưởng ngay lập tức
- TTL 5min giữ nguyên làm safety net (nếu invalidation bug → cache tự hết hạn)
- Token refresh: Supabase SDK auto refresh JWT → FE chỉ cần lắng nghe `onAuthStateChange`

### 4b. Export Security (Chốt 2026-03-13)

- **KHÔNG có API endpoint export riêng**.
- Export = FE gọi API list với `limit=all` → data đã qua Permission middleware.
- **Watermark**: File Excel xuất ra phải chèn thông tin `exported_by`, `exported_at` và `khoi` vào metadata/sheet ẩn để truy vết (Chốt 2026-03-13).
- **Audit Log**: Ghi log chi tiết khi export (khối nào, bao nhiêu bản ghi).
- **Rate limit export**: 5 lần/phút/user. Max cap: 5000 rows (Chốt 2026-03-13).
- **Audit Log action `export`**: Đã thêm vào constraint `audit_log.action` trong schema v2.1.2 (Chốt 2026-03-13)
- **Email trùng**: `employees.email` cho phép trùng (NS cũ nghỉ việc + NS mới tái tuyển). UI **cảnh báo** nhưng không reject (Chốt 2026-03-13)

## 5. Cấu trúc Repo (pnpm Monorepo)

```
tool-luong-vcc/
├── docs/business-flows/       ← 🔴 Nguồn sự thật luồng nghiệp vụ (v1.0.0)
├── .agent/                    ← Business data + module specs (v2.5.0) + plans
├── .github/workflows/         ← CI/CD pipelines
├── database/
│   └── 001_schema.sql         ← Schema v2.5.0 (đã chốt)
├── packages/
│   └── shared/                ← Shared types & Zod schemas
│       ├── schemas/           ← Zod schemas (source of truth)
│       ├── types/             ← TypeScript types
│       └── package.json
├── frontend/                  ← Vite + React + Ant Design
│   ├── src/
│   │   ├── components/        ← Reusable UI components
│   │   ├── pages/             ← Route pages
│   │   ├── hooks/             ← Custom hooks (queries, mutations)
│   │   ├── stores/            ← Zustand stores (auth, permission, UI)
│   │   ├── utils/             ← zodToAntRules(), formatters
│   │   └── App.tsx
│   ├── Dockerfile             ← Nginx static serve
│   ├── nginx.conf
│   └── package.json
├── backend/                   ← Hono API
│   ├── src/
│   │   ├── middleware/        ← Auth, Permission
│   │   ├── routes/            ← NS-001, NS-002, NS-003, NS-004
│   │   ├── services/          ← Business logic
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── scripts/                   ← Data migration tools
├── pnpm-workspace.yaml        ← Monorepo config
└── package.json               ← Root scripts
```

## 5a. FE Routes (Dự kiến)

```
/                           → Dashboard (redirect theo quyền)
/employees                  → Danh sách NS (NS-001)
/employees/new              → Thêm NS mới
/employees/:id              → Chi tiết NS
/pending-room               → Phòng chờ
/salaries                   → Quản lý lương (NS-002)
/snapshots                  → Chốt tháng (NS-003)
/admin/permissions          → SA: Quản lý quyền (NS-004)
/admin/reviewers            → SA: Gán người nghiệm thu
/admin/import               → SA: Import data
```

## 5b. API Conventions (Chốt 2026-03-13)

### Response Format (Option A)
```typescript
// Success
{ "data": { ... }, "meta": { "total": 4000, "page": 1, "limit": 50, "totalPages": 80 } }

// Success (single item)
{ "data": { ... } }

// Error
{ "error": { "code": "PERMISSION_DENIED", "message": "Bạn không có quyền xem khối này" } }
```

### Error Codes
```
UNAUTHORIZED          — Chưa đăng nhập
PERMISSION_DENIED     — Không có quyền
VALIDATION_ERROR      — Dữ liệu không hợp lệ (kèm field-level errors)
NOT_FOUND             — Không tìm thấy resource
CONFLICT              — Trùng mã NS, snapshot đã tồn tại
STATE_ERROR           — Vi phạm state machine (VD: sửa NS đã nghỉ việc)
INTERNAL_ERROR        — Lỗi server
```

### Pagination (Server-side — BẮT BUỘC)
```
GET /api/employees?page=1&limit=50&sort=-created_at&khoi=Admicro
GET /api/employees?limit=all&khoi=Admicro  ← Cho Excel export (cùng API, cùng permission)
```

## 6. Phase Overview

| Phase | Tên | Scope | Mục tiêu |
|-------|-----|-------|----------|
| **0** | Foundation | Infra + DB + Auth | Hạ tầng chạy được, login OK |
| **1** | NS-004 Core | Auth + Permission Engine | Login + phân quyền hoạt động |
| **2** | NS-001 | Employee CRUD | Thêm/sửa/submit nhân sự |
| **3** | **NS-002** | **Salary CRUD** | **✅ Hoàn thành** | Xem/sửa lương theo quyền |
| **4** | Admin & Migration | SA tools + Import data | Quản lý quyền + import 4000 NS từ Sheets |
| **5** | Production | Polish + UAT + Go-live | Demo cho HR + ra mắt sớm |
| **6** | NS-003 | Monthly Snapshot | Chốt NS tháng per khối |

## 7. MVP Scope (Phase 0-4)

NS-001 + NS-002 + NS-004 + Data Migration

## 8. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|--------|-----|-----------|
| Permission logic phức tạp | 🟡 | Viết unit test kỹ cho middleware |
| Data migration 4000 NS từ Sheets | 🟡 | Chạy thử với 100 NS trước |
| Supabase free tier giới hạn | 🟢 | ~10 users, đủ dùng |
| Cold start Cloud Run | 🟢 | Hono nhẹ, min-instances=1 nếu cần |
| Ant Design bundle size | 🟢 | Tree-shake v6 + lazy load pages |

## 9. Tham chiếu tài liệu

| File | Version | Status |
|------|---------|--------|
| [00-MASTER-INDEX.md](../../../docs/business-flows/00-MASTER-INDEX.md) | v1.0.0 | 🔴 Nguồn sự thật luồng nghiệp vụ |
| [SCHEMA.md](../../business/data/SCHEMA.md) | v2.5.0 | ✅ Chốt |
| [PERMISSION_MATRIX.md](../../business/data/PERMISSION_MATRIX.md) | v2.5.0 | ✅ Chốt |
| [STATE_MACHINES.md](../../business/data/STATE_MACHINES.md) | v2.5.0 | ✅ Chốt |
| [NS-001](../../business/modules/NS-001_employee_crud.md) | v2.0.0 | ⚠️ Reference Only |
| [NS-002](../../business/modules/NS-002_salary_crud.md) | v2.1.1 | ⚠️ Reference Only |
| [NS-003](../../business/modules/NS-003_monthly_snapshot.md) | v2.1.1 | ⚠️ Reference Only |
| [NS-004](../../business/modules/NS-004_permissions.md) | v2.1.1 | ⚠️ Reference Only |
| [001_schema.sql](../../../database/001_schema.sql) | v2.5.0 | ✅ Chốt |

## 10. Các hạng mục Defer sang Phase sau (Tech Debt & Future Features)

- **Hard Delete Nhân sự (Phase 4/6)**: Khi implement tính năng Hard Delete cho SuperAdmin (SA), bắt buộc thiết kế Modal cho phép SA chọn các vùng dữ liệu liên đới cần xóa (VD: Lịch sử `change_history`, Lương `salary_giay_to`, `salary_co_che`, Tài khoản `employee_reviewers`). Đảm bảo không vi phạm Foreign Key constraint và có Audit log cascade đầy đủ.
- **Luồng chuyên biệt: Điều chỉnh lương (Phase 3 - NS-002)**: Trường `ngay_dieu_chinh_luong` (Ngày điều chỉnh lương mới nhất) hiện đang cho phép sửa tự do ở form cơ bản. Tại Phase 3, trường này **BẮT BUỘC** phải được tách ra khỏi form Edit chung, và tích hợp vào một luồng/UI chuyên biệt "Điều chỉnh lương" đi kèm với việc cập nhật `salary_giay_to` và `salary_co_che`. Luồng này sẽ auto-ghi lại Audit/Change History lý do tăng/giảm lương và block sếp thường/nhân viên sửa láo.
- **Notification System (Defer)**: Bắn Notification tới người nghiệm thu khi Submit NS (Telegram Bot / In-app). Chưa có spec chi tiết — sẽ thiết kế và triển khai khi phù hợp (Phase 5 hoặc 6).
- **Tối ưu API Performance & Billing (Phase 6)**: Sau khi Go-live, thực hiện đo đạc tần suất gọi API thực tế. Điều chỉnh `staleTime` (React Query) và `refetchInterval` (Polling) để cân bằng giữa trải nghiệm Real-time và chi phí vận hành (Supabase quota/Cloud Run resources).

---

*Plan tổng thể. Mỗi Phase khi bắt đầu sẽ được lập FEATURE_PLAN chi tiết riêng.*
*FE Architecture Decisions chốt: 2026-03-13. Plan cập nhật: 2026-03-31.*
