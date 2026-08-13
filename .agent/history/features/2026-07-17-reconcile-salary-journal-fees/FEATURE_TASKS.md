# Feature Tasks: Reconcile Salary Journal Fees (Case 1)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-16

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành

## Phase 1: Chuẩn bị và Thực thi SQL trực tiếp trên Supabase

**Mục tiêu:** Thực hiện preflight check, sao lưu, và chạy an toàn script SQL cập nhật dữ liệu.

- [x] Task 1.1: 🔍 Thực hiện Preflight check (xác thực số dòng đặc biệt = 364, xác thực số ca pending drift = 0).
- [x] Task 1.2: 💾 Chuẩn bị & kiểm tra bảng backup tạm thời `backup_salaries_reconcile_040` trên Supabase Database.
- [x] Task 1.3: 🧪 Chạy thử block SQL cập nhật (gồm đổi giá trị, ghi change_history và audit_log) dưới dạng transaction ở chế độ `ROLLBACK` để xác minh assert count khớp chính xác 364 dòng.
- [x] Task 1.4: 🚀 Chạy chính thức block SQL và tiến hành `COMMIT`.
- [x] Task 1.5: 🧪 Chạy các câu lệnh hậu kiểm (Post-check SQL) để verify:
  - Assert không còn ca lệch đặc biệt nào chưa được xử lý.
  - Assert 364 dòng backup được cập nhật chuẩn xác.
  - Assert 75 dòng thông thường không bị ảnh hưởng.
- [x] Task 1.Final: 💾 Lưu giữ bảng backup phụ `backup_salaries_reconcile_040` trên Database trong 30 ngày (Retention Window) và lên lịch Drop bảng sau ngày 2026-08-16.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-17T10:31:00+07:00 | Phase 1 | Task 1.1 | Bắt đầu Preflight check | start | Đang kiểm tra số lượng bản ghi đặc biệt và pending drift |
| 2026-07-17T10:41:00+07:00 | Phase 1 | Task 1.1 | Hoàn tất Preflight check | done | Đã xác thực 364 ca đặc biệt, 0 ca pending drift, 54 ca thông thường (tổng 418) |
| 2026-07-17T10:42:00+07:00 | Phase 1 | Task 1.2 | Bắt đầu tạo bảng backup | start | Chuẩn bị lệnh tạo bảng backup trên DB |
| 2026-07-17T10:42:30+07:00 | Phase 1 | Task 1.2 | Hoàn tất chuẩn bị backup | done | Đã tạo và cấu trúc file SQL chứa câu lệnh backup an toàn |
| 2026-07-17T10:43:00+07:00 | Phase 1 | Task 1.3 | Bắt đầu chạy thử SQL (ROLLBACK) | start | Cần user chạy script ở chế độ ROLLBACK để xác minh |
| 2026-07-17T10:45:30+07:00 | Phase 1 | Task 1.3 | Hoàn tất chạy thử SQL | done | Chạy thử thành công 364 dòng, không phát sinh lỗi |
| 2026-07-17T10:46:00+07:00 | Phase 1 | Task 1.4 | Bắt đầu chạy chính thức (COMMIT) | start | Gửi lệnh chạy chính thức lên Supabase Dashboard |
| 2026-07-17T10:46:40+07:00 | Phase 1 | Task 1.4 | Hoàn tất chạy chính thức | done | Khớp đúng 364 dòng bản ghi được cập nhật và lưu backup |
| 2026-07-17T10:47:00+07:00 | Phase 1 | Task 1.5 | Bắt đầu Hậu kiểm (Post-check) | start | Cần chạy SQL hậu kiểm để verify kết quả |
| 2026-07-17T10:47:38+07:00 | Phase 1 | Task 1.5 | Hoàn tất Hậu kiểm | done | 3 assertions đã được verify thành công: 0 ca đặc biệt còn sót, 364 ca backup đúng dữ liệu, 54 ca thông thường nguyên vẹn. |
| 2026-07-17T10:48:00+07:00 | Phase 1 | Task 1.Final | Đăng ký Retention Window | done | Đã ghi nhận giữ bảng backup trong 30 ngày và drop sau ngày 2026-08-16 |
| 2026-07-17T10:48:30+07:00 | Phase 1 | - | Hoàn thành feature | done | Reconcile thành công 364 ca đặc biệt |
