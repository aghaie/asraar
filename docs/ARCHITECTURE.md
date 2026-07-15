# معماری مناد

## اصل حاکم
Clean Architecture: وابستگی‌ها فقط از بیرون به درون. `core/` هیچ‌چیزی از Next.js، SQLite یا Anthropic نمی‌داند.

```
┌────────────────────────────────────────────┐
│ app/ (Next.js)  ← صفحات + مسیرهای API      │
│   │ فقط usecaseها را صدا می‌زند             │
│   ▼                                        │
│ core/usecases  ← منطق کاربردی               │
│   │ فقط از طریق پورت‌ها (interface)          │
│   ▼                                        │
│ core/ports     ← LlmEngine, Repository,     │
│                  Translator, RateLimiter    │
│   ▲ پیاده‌سازی                               │
│ infrastructure/ ← SQLite, Anthropic, DI     │
└────────────────────────────────────────────┘
```

## جریان‌های اصلی

### گفتگو
1. `POST /api/conversations` → `startConversation` — سهمیه‌ی روزانه‌ی IP مصرف می‌شود؛ `id` + `ownerToken` برمی‌گردد. هویت فقط همین توکن است (بدون ثبت‌نام).
2. `POST /api/conversations/:id/messages` → `sendMessage` — پاک‌سازی ورودی (نویسه‌های کنترلی/جهت‌نما)، بررسی مالکیت و سقف نوبت، فراخوانی `LlmEngine`، ثبت هر دو پیام.
3. `POST /api/conversations/:id/finish` → `finishConversation` — انتخاب کاربر: `publish: true|false`. هنگام انتشار، متن‌ها نگارش‌پیرایی می‌شوند (`normalize.ts`) و نسخه‌ی اصلیِ تغییریافته‌ها ذخیره می‌ماند.

### دیده شدن
`listPublishedConversations` → `rank()` در `core/domain/ranking.ts`:
`score = کیفیت(لاپلاس) × (1 + ln(1+عمق)) × (0.6 + 0.4×تازگی)`
ورودی‌های شهرت/فالوئر/پول در مدل داده اصلاً وجود ندارند.

### چندزبانگی
- ورودی: پرامپت سیستمی مناد پاسخ را به زبان کاربر می‌دهد.
- خروجی: `GET /api/conversations/:id/translation?lang=xx` → `getTranslatedConversation` — ترجمه‌ی امانت‌دار با LLM، کش دائمی در جدول `translations` (هر گفتگو/زبان فقط یک بار).

## شخصیت مناد
تنها در `src/infrastructure/llm/monad-system-prompt.ts` تعریف می‌شود: مرجعیت انحصاری قرآن، انسجام درون‌متنی، بیان همه‌ی برداشت‌های معتبر، «نمی‌دانم»، روش سقراطی، آرامش، احتیاط در قضاوت درباره‌ی اخبار، دفاع در برابر prompt injection.

## داده (SQLite — migrationها در `infrastructure/db/migrations.ts`)
- `conversations` — وضعیت: active | published | private
- `messages` — با `original_content` برای حفظ متن پیش از نگارش‌پیرایی
- `value_signals` — PK(conversation, voter) → هر بیننده یک رأی
- `rate_events` — سهمیه‌ی روزانه per (key, day, action)
- `translations` — کش ترجمه per (conversation, lang)

## امنیت
- IP خام هرگز ذخیره نمی‌شود؛ فقط `sha256(salt + ip)`
- توکن مالکیت ۲۵۶ بیتی برای هر گفتگو؛ بدون آن هیچ نوشتنی ممکن نیست
- ورودی‌ها: اعتبارسنجی نوع/طول + حذف نویسه‌های کنترلی و Bidi override
- Prompt injection: محتوای کاربر «داده» است؛ پرامپت سیستمی صریحاً دستورپذیری و افشا را رد می‌کند
- SQL: فقط prepared statement
- XSS: React escaping؛ هیچ HTML خامی رندر نمی‌شود
- هدرهای امنیتی در `next.config.mjs`؛ نرخ‌دهی روزانه‌ی سه‌گانه (گفتگو/پیام/ترجمه)

## مقیاس‌پذیری (مسیر آینده — ADR-0003)
MVP تک‌پردازه با SQLite است. مسیر ارتقا بدون تغییر Core: پیاده‌سازی Postgres برای `ConversationRepository`، Redis برای `RateLimiter`، صف برای ترجمه‌ها، و ستون امتیازِ ازپیش‌محاسبه برای رتبه‌بندی.
