# API مناد

همه‌ی پاسخ‌ها JSON هستند. خطاها با ساختار زیر برمی‌گردند:

```json
{ "error": { "code": "RATE_LIMITED", "message": "…" } }
```

| کد خطا | وضعیت HTTP |
|---|---|
| VALIDATION | 400 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| CONVERSATION_CLOSED / TURN_LIMIT / DUPLICATE_SIGNAL | 409 |
| RATE_LIMITED | 429 |
| ENGINE_FAILURE | 503 |

## `POST /api/conversations`
آغاز گفتگوی تازه. بدنه: `{}`. سهمیه‌ی روزانه‌ی IP مصرف می‌شود.

پاسخ `201`:
```json
{ "id": "uuid", "ownerToken": "…", "remainingToday": 9 }
```
`ownerToken` تنها مدرک مالکیت گفتگوست؛ سمت کاربر نگه داشته می‌شود و هرگز نمایش عمومی ندارد.

## `POST /api/conversations/:id/messages`
بدنه: `{ "ownerToken": "…", "content": "متن پرسش" }` (حداکثر ۴۰۰۰ نویسه، حداکثر ۴۰ نوبت در هر گفتگو)

پاسخ:
```json
{ "reply": "پاسخ مناد", "turns": 3, "turnsLeft": 37 }
```

**حالت جریانی:** با هدر `Accept: text/event-stream`، پاسخ به‌صورت SSE می‌آید:
```
event: delta   → data: { "text": "تکه‌ی بعدی پاسخ" }   (تکرارشونده)
event: done    → data: { "turns": 3, "turnsLeft": 37 }
event: error   → data: { "code": "…", "message": "…" }
```

## `POST /api/conversations/:id/finish`
بدنه: `{ "ownerToken": "…", "publish": true }` — با `publish: false` گفتگو خصوصی می‌ماند.
هنگام انتشار، متن‌ها نگارش‌پیرایی می‌شوند و متن اصلیِ تغییریافته حفظ می‌شود.

پاسخ: `{ "status": "published" }` یا `{ "status": "private" }`

## `POST /api/conversations/:id/value`
تنها تعامل دیگران. بدنه: `{ "valuable": true }` یا `{ "valuable": false }`.
هر بیننده (هش ناشناس IP) برای هر گفتگو فقط یک بار؛ تکرار → `409 DUPLICATE_SIGNAL`.

پاسخ: `{ "ok": true }`

## صفحه‌ی `/search?q=…`
جست‌وجوی تمام‌متن در گفتگوهای منتشرشده (SSR، نه API). فرم جست‌وجو در صفحه‌ی اصلی هم هست.
صفحه‌ی اصلی بازه‌ی زمانی را با مسیرِ تمیز می‌گیرد: `/day`, `/yesterday`, `/week`, `/month`, `/year` و `/` برای «همه».

## هویت (اختیاری)
ورود اجباری نیست؛ همه‌ی مسیرهای بالا بدون ورود کار می‌کنند. اگر کاربر وارد باشد (کوکی `monad_session`)، گفتگوی تازه به بایگانی خصوصی او وصل می‌شود.

- `POST /api/auth/email` — بدنه `{ "email": "…" }` → لینک جادویی می‌فرستد (پاسخ همیشه `{ "ok": true }`).
- `GET /api/auth/email/callback?token=…` — لینک یک‌بارمصرف؛ نشست می‌سازد و به `/profile` می‌برد.
- `GET /api/auth/google` و `/api/auth/google/callback` — ورود با گوگل (اگر پیکربندی شده باشد).
- `POST /api/auth/logout` — خروج.
- `POST /api/profile/name` — بدنه `{ "name": "…" }` (نیازمند نشست).
- `POST /api/conversations/claim` — بدنه `{ "conversationId", "ownerToken" }` (نیازمند نشست) — چسباندن گفتگوی ناشناس به حساب.
- صفحات `/login` و `/profile` (بایگانی خصوصی).

## `GET /api/conversations/:id/translation?lang=en`
خواندن گفتگوی منتشرشده به زبان خواننده. `lang`: کد ISO 639-1 (مثل `en`, `ar`, `tr`).
ترجمه‌ها برای همیشه کش می‌شوند؛ فقط نخستین درخواستِ هر زبان سهمیه مصرف می‌کند.

پاسخ:
```json
{ "lang": "en", "title": "…", "messages": [{ "role": "seeker", "content": "…" }] }
```
