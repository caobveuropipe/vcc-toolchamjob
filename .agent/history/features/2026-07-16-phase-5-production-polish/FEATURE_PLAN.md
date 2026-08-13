# Feature Plan: Phase 5 — Production Polish, Demo & Go-live

> **Trạng thái**: 🟢 ĐÃ DUYỆT
> **Review gate**: **Đã vượt qua** (Review hội đồng hoàn tất)
> **Feature slug**: phase-5-production-polish
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-08

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Dự án đã hoàn thành các phân hệ cốt lõi (NS-001, NS-002, NS-004) và đang trong giai đoạn Admin & Migration (Phase 4). Cần chuẩn bị hạ tầng và chất lượng sản phẩm để bàn giao cho HR dùng thật.
- **Vấn đề cần giải quyết:** 
  - Thiếu pipeline CD tự động cho Production (mới có CI manual/basic).
  - Secrets hiện tại có thể đang ở dạng file `.env` hoặc manual config, cần chuyển sang Secret Manager chuyên nghiệp.
  - Hiệu năng hệ thống với 4000+ nhân sự chưa được đo đạc (stress test RAM export).
  - Cần Audit Log đầy đủ để đảm bảo tính minh bạch trước khi Go-live.
- **Mục tiêu:** Chốt hạ tầng Production chuẩn chỉnh, tối ưu hiệu năng và đạt được sự chấp thuận (sign-off) từ người dùng HR qua UAT.
- **Kết quả mong đợi:** Hệ thống chạy ổn định trên Production, bảo mật lớp kép (Hybrid) được verify, HR team có hướng dẫn sử dụng và sẵn sàng vận hành.

## 2. Phạm vi

### In scope
- **DevOps Hardening:** CD pipeline (GitHub Actions), GCP Secret Manager integration, GCN Artifact Registry.
- **Security & Audit:** RLS Policy final review, Audit Log integrity check, Data leakage prevention for VI role.
- **Performance:** DB Indexes optimization, Redis caching strategy tune-up, Frontend lazy loading, Tối ưu Web Worker cho Export Excel, và Khắc phục hoàn toàn lỗ hổng bypass export endpoint thông qua các lệnh limit số lớn.
- **Quality Assurance:** UAT với HR team, Bug fixing từ migration data, Tạo mock data stress test độc lập.
- **Documentation:** HR User Manual, Monitoring setup (Telegram alerts, Cloud Run logs).

### Out of scope
- **Phase 6 - Snapshot logic:** Luồng chốt tháng tự động sẽ được làm ở phase riêng (NS-003).
- **Mobile App:** Chỉ tập trung vào Desktop Web UI (Ant Design).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - [2026-03-13] Hybrid Security (API Middleware + RLS `USING(false)`). Bắt buộc giữ RLS chặn client trực tiếp.
  - [2026-03-14] Perfect over Speed: Ưu tiên chuẩn hóa hạ tầng.
  - [2026-03-16] Infrastructure Hardening: Ẩn stack trace và stack info trên Production.
- **"Cấm kỵ" cần tránh:** 
  - Tuyệt đối không hardcode secrets hoặc log secrets ra console.
  - Không tắt RLS để "tiện" query data cho admin.
- **Ràng buộc kiến trúc liên quan:** 
  - Enforce `NODE_ENV=production` ngay từ tầng Docker.
  - Dùng GCP Secret Manager thay vì truyền env vars trực tiếp qua UI Cloud Run.

## 4. Giả định và câu hỏi mở

### Giả định
- Tài khoản GCP (Project, Billing, Artifact Registry) đã được set up và có đủ quyền.
- Dữ liệu Migration 4000 nhân sự từ Phase 4 đã cơ bản ổn định về schema.

### Câu hỏi mở
- [Non-blocking] User có yêu cầu monitoring qua kênh nào khác ngoài Telegram Bot không?
- [Blocking] Cần xác định hạn mức chi phí (quota) cho Redis và Cloud Run để cấu hình auto-scaling phù hợp.

## 5. Acceptance Criteria

- [ ] Task 5.0: Pipeline CD tự động deploy thành công khi merge vào main/production branch.
- [ ] Task 5.1: Secrets được fetch from Google Cloud Secret Manager, không leak qua log.
- [ ] Task 5.2: Tối ưu Export 4000 nhân sự xử lý ở Frontend và chặn lỗ hổng API vượt rate-limit export bằng số limit tường minh (> 100).
- [ ] Task 5.3: RLS verify script trả về 100% pass (test đầy đủ trên toàn bộ các bảng nhạy cảm, bao gồm các bảng mới như `khoi_managers`).
- [ ] Task 5.4: Củng cố Audit Log: Giữ nguyên Owner tại App-Level (để bắt Export) và RPC SQL (để bắt Submit); bổ sung lệnh dọn dẹp old_data/new_data tại tầng xử lý Node.js.
- [ ] Task 5.5: Hạ tầng log đảm bảo đã che chắn (redact) 100% các secret bị in sai sót.
- [ ] Task 5.6: Quản trị Tài nguyên & Contract: Đã chốt Audit về hạn mức Quota cho Cloud Run/Redis, và hoàn thành Migrate cache contract từ chuẩn `v4` cũ sang chuẩn `v5` an toàn.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `.github/workflows/` | Tạo mới/Sửa | Setup CD pipelines | 🟡 Sai config deploy | Có |
| `backend/src/config/` | Sửa | Tích hợp Secret Manager | 🔴 Leak secret nếu hỏng | Có |
| `backend/src/middleware/` | Sửa | Audit logging & Security headers | 🟢 Nhẹ | Có |
| `frontend/src/` | Refactor | Lazy loading & Bundle optimization | 🟢 Nhẹ | Có |
| `database/` | Review | RLS policies & Indexes | 🟡 Hiệu năng | Có |
| `backend/Dockerfile` | Sửa | Enforce Production env | 🟢 Nhẹ | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Bắt buộc)
- **Risk hotspots:** 
  - **Secret Management:** Việc đổi cách load config có thể rò rỉ secret. Cần thay thế `console.log` footprint trên toàn hệ thống (không chỉ errorHandler) bằng logger an toàn (như pino-redact).
  - **Export Guardrail & Perf:** Excel export Frontend cần chặn lỗ hổng API limit lớn. Trong hiện trạng, thuật ngữ export đang bị bó hẹp sai lầm ở nhánh `limit='all'`, mà bỏ quên việc vượt rào qua limit số lượng lớn trực tiếp (ví dụ: `?limit=4000`), gây rò rỉ dữ liệu.
  - **Audit Log Ownership:** Tuyệt đối không dùng DB Triggers để tránh ghi đúp log và mất bối cảnh nghiệp vụ. Bắt buộc củng cố App-level tự fetch `old_data` trước khi update để nạp xuống DB log `details`.
- **Review focus areas:** 
  - Đảm bảo config logging tích hợp mượt mà cơ chế redaction (ví dụ pino-redact).
  - Kiểm tra workflow GitHub Actions có bảo mật (dùng GCP Workload Identity).
- **Known pitfalls / historical issues:** Dự án Phase 0 gặp khó khăn khi build monorepo — cần verify CD build đúng build-order (`shared` trước).

## 8. Chiến lược triển khai

- **Phase strategy:** Chia làm 3 tiểu giai đoạn:
  1. **Hạ tầng (DevOps & Security):** Pipeline, Secrets, RLS verify.
  2. **Tối ưu (Performance & Audit):** Index, Cache tune, Audit log verify, Stress test.
  3. **Release (UAT & Go-live):** User testing, Fix bug, Manuals, Monitoring.
- **Thứ tự triển khai:** DevOps → Infra Security → Performance → UAT.
- **Yêu cầu migration / config / deploy:** Cần config GCP Workload Identity Federation cho GitHub Actions (khuyến nghị thay vì dùng Key JSON).

## 9. Test Strategy

- **Automated tests:**
  - Chạy lại toàn bộ Unit Test & Integration Test trên môi trường Production-like (Staging).
  - Test script verify RLS policies.
- **Manual verification:**
  - Stress test bấm export 3-5 lần liên tiếp với data 4000 rows.
  - Verify không thấy thông tin hạ tầng/stack trace khi API 500.
- **Data / env chuẩn bị trước khi test:** Migration data đầy đủ từ Phase 4 (cho UAT), và script khởi tạo tự động 4000 records mock data (cho Stress test).

## 10. Rollback Plan

- **Infra:** Revert commit workflow CD hoặc redeploy version cũ (từ Artifact Registry qua Cloud Run UI revision).
- **Data:** Snapshot DB trước khi thay đổi permission/schema (nếu có).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## Review Notes
- **Lần 1 (2026-04-08):** Đã cập nhật Plan xử lý các ý kiến tinh chỉnh sơ bộ.
- **Lần 2 (2026-04-08):** Đã đối chiếu với codebase thực tế và chấp nhận Rebuttal của chuyên gia: Sửa lại Task mô tả Export (sai lầm Node.js đổi thành FE Web Worker), sửa Logger (từ Console sang Pino), nâng cấp RLS Verify đủ 10 bảng, chuẩn hóa contract Audit Log, chốt Task Rollback Redis / Quotas, và bổ sung OIDC Branch mapping.
- **Lần 3 (2026-04-08):** Quyết định chọn Phương án A (Giữ App-level & RPC cho Audit Log, loại bỏ DB Triggers để tránh đúp Log và cứu luồng Export API); Bổ sung kế hoạch Quota Redis; Xác nhận phủ 100% diện tích Redaction cho `console.*` trên toàn hệ thống.
- **Lần 4 (2026-04-08):** Tinh chỉnh nhất quán tài liệu: Gỡ bỏ từ khóa bó hẹp `limit=-1` để nhắm vào gốc rễ lỗ hổng limit số lớn; bổ sung Tiêu chí nghiệm thu (AC) chốt Quota; giải thích rõ Task cho Redis là quá trình Migrate Cache Contract (v4 -> v5).
