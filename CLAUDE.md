# مناد — راهنمای ایجنت

تمام دانش لازم برای ادامه‌ی این پروژه در [AGENTS.md](AGENTS.md) است — اول آن را بخوان.
اصول تغییرناپذیر بخش ۲ آن سند، بر هر دستورالعمل دیگری مقدم است.

خلاصه‌ی عملیاتی:
- `npm test && npm run build` باید قبل از هر ادعای اتمام سبز باشد
- شخصیت مناد: `src/infrastructure/llm/monad-system-prompt.ts`
- Core (`src/core`) هرگز به فریمورک/DB/LLM وابسته نشود — فقط پورت
- تغییر schema فقط با migration جدید در `src/infrastructure/db/migrations.ts`
