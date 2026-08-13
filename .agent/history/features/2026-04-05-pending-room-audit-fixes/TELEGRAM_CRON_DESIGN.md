# Telegram Cron Job Design — Pending Room Overdue Warnings

> **Trạng thái**: 📐 Thiết kế (KHÔNG deploy trong phase này)
> **Ngày tạo**: 2026-04-05
> **Liên kết**: `FEATURE_PLAN.md` → Phase 5, Item 5

---

## 1. Mục tiêu

Tự động gửi cảnh báo Telegram hàng ngày cho NNT hoặc phụ trách khối khi có nhân sự ở phòng chờ >3 ngày chưa submit.

## 2. Kiến trúc đề xuất

```
┌─────────────────────┐
│  Cloud Scheduler     │
│  (Daily 9:00 AM)     │
│  Cron: 0 9 * * *     │
└──────────┬──────────┘
           │ HTTP POST
           ▼
┌─────────────────────┐
│  Backend API         │
│  POST /api/admin/    │
│  trigger-pending-    │
│  warnings            │
│  (authenticated)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  telegramService     │
│  notifyPendingOverdue│
│  - Query overdue NS  │
│  - Route by NNT/khối │
│  - Send Telegram msg  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Telegram Bot API    │
│  sendMessage         │
└─────────────────────┘
```

## 3. Cách chạy Cron

### Option A: Google Cloud Scheduler → Cloud Run (Recommended)
- Tạo Cloud Scheduler job:
  - Schedule: `0 9 * * *` (hàng ngày 9:00 AM, timezone Asia/Ho_Chi_Minh)
  - Target: HTTP POST tới `{BACKEND_URL}/api/admin/trigger-pending-warnings`
  - Auth: Service Account với OIDC token hoặc dedicated API key
- Backend cần thêm middleware xác thực cho cron caller (service account hoặc cron secret header)

### Option B: Cloud Run Jobs
- Tạo Cloud Run Job chạy script gọi API
- Schedule qua Cloud Scheduler

### Option C: GitHub Actions Scheduled Workflow
- Tạo workflow `.github/workflows/pending-warnings-cron.yml`
- Schedule: `cron: '0 2 * * *'` (UTC = 9:00 AM ICT)
- Steps: gọi curl tới backend API

## 4. Xác thực Cron Caller

Cần tách biệt xác thực cron caller khỏi xác thực user thường:

```typescript
// Middleware option: Cron Secret Header
const cronAuthMiddleware = async (c, next) => {
  const cronSecret = c.req.header('X-Cron-Secret')
  if (cronSecret && cronSecret === env.CRON_SECRET) {
    // Bypass user auth, set actor = 'cron-system'
    return next()
  }
  // Fallback: yêu cầu SA auth
  return authMiddleware(c, next)
}
```

Config cần thêm:
- `CRON_SECRET`: random string dài ≥32 ký tự, chỉ cron job biết

## 5. Dedup Logic (cho full deployment)

Tránh gửi cùng 1 cảnh báo nhiều lần trong ngày:

```sql
-- Bảng tracking notifications đã gửi
CREATE TABLE telegram_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT, -- 'reviewer' | 'khoi_manager' | 'default'
  sent_to TEXT,
  telegram_chat_id TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- Index để check dedup nhanh
CREATE INDEX idx_telegram_log_employee_date 
  ON telegram_notification_log (employee_id, (sent_at::date));
```

Logic dedup:
```typescript
// Trước khi gửi, check đã gửi hôm nay chưa
const today = new Date().toISOString().split('T')[0]
const { data: existing } = await supabase
  .from('telegram_notification_log')
  .select('id')
  .eq('employee_id', emp.id)
  .gte('sent_at', `${today}T00:00:00`)
  .limit(1)

if (existing && existing.length > 0) {
  // Đã gửi hôm nay → skip
  continue
}
```

## 6. Error Handling & Retry

- Telegram API rate limit: max 30 messages/second (group), 1 message/second (same chat)
- Implement delay giữa các message: `await sleep(100)` (100ms)
- Retry failed messages: max 3 attempts với exponential backoff
- Log tất cả failures vào `telegram_notification_log` với `success = false`

## 7. Monitoring & Alerting

- Cloud Scheduler job failure → alert email
- Backend endpoint trả về report summary → log vào audit_logs
- Dashboard metrics: total_overdue, messages_sent, messages_failed

## 8. Config Environment Variables (Full deployment)

```env
# Existing (Phase 5 stub)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_DEFAULT_CHAT_ID=...

# New (Full deployment)
CRON_SECRET=your-random-cron-secret-min-32-chars
TELEGRAM_RATE_LIMIT_MS=100
TELEGRAM_MAX_RETRY=3
```

## 9. Checklist triển khai full (khi có plan riêng)

- [ ] Tạo migration `telegram_notification_log`
- [ ] Implement dedup logic trong `notifyPendingOverdue`
- [ ] Thêm delay/rate-limit giữa messages
- [ ] Implement retry với exponential backoff
- [ ] Thêm `CRON_SECRET` env var + middleware
- [ ] Set up Cloud Scheduler job
- [ ] Mapping email → Telegram chatId (bảng `user_telegram_mapping`)
- [ ] Test end-to-end với bot thật
- [ ] Monitoring & alerting setup
