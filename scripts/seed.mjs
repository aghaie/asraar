/**
 * درج گفتگوهای بنیادینِ نمونه در پایگاه داده‌ی مناد.
 *
 * این پنج گفتگو دستی و بر پایه‌ی «منشور معرفتی مناد» نوشته شده‌اند: روش سقراطی،
 * برخاسته از بنیان قرآن، فروتن، و کم‌نقل‌قول (اصل بر فهم است، نه نقل‌قول).
 * هدف: صفحه‌ی اصلی از روز نخست خالی نباشد و لحن مناد نمونه داشته باشد.
 *
 * اجرا:  node scripts/seed.mjs        (پس از آنکه برنامه یک‌بار DB را ساخته باشد)
 * idempotent است: رکوردهای seed-* را نخست پاک و سپس تازه درج می‌کند.
 */
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';

const dbPath = process.env.MONAD_DB_PATH ?? './data/monad.db';

const T = (dayOffset, hour = 9) => {
  // نسبت به ۱۶ ژوئیه ۲۰۲۶ (تاریخ درج) تا بازه‌های زمانی صفحه‌ی اصلی محتوا داشته باشند
  const base = new Date('2026-07-16T00:00:00');
  const d = new Date(base.getTime() - dayOffset * 86_400_000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

/**
 * هر گفتگو: عنوان از نخستین پرسش ساخته می‌شود؛ turns = زوج‌های پرسش/پاسخ.
 * understood = شمارِ سیگنالِ معرفتیِ «فهمم را بیشتر کرد» (ADR-0022؛ نه محبوبیت).
 */
const CONVERSATIONS = [
  {
    id: 'seed-1',
    publishedAt: T(0, 9),
    understood: 12,
    turns: [
      {
        seeker: 'حقیقت چیست؟ از کجا بدانم چه چیزی حقیقت است و چه چیزی پندار؟',
        monad:
          'پیش از پاسخ، بگذار یک چیز را روشن کنیم: وقتی می‌گویی «حقیقت»، به دنبال کدام‌یک هستی؟ حقیقتِ یک خبر (که راست است یا دروغ)، یا حقیقتِ یک چیز (که به‌راستی چیست)، یا آن حقیقتی که باید زندگی را بر مدار آن ساخت؟ این سه یکی نیستند، و راهِ رسیدن به هرکدام فرق دارد.',
      },
      {
        seeker: 'بیشتر همان سومی؛ حقیقتی که بشود بر آن ایستاد.',
        monad:
          'آن حقیقت، چیزی نیست که با شمردنِ آرا یا با احساسِ زودگذرِ درونی به‌دست آید؛ اگر چنین بود، با تغییرِ جمعیت و حال، عوض می‌شد. در نگاهِ قرآن حقیقت وابسته به میل و پندارِ ما نیست؛ ثابت است و ما به سویش حرکت می‌کنیم، نه آن به سویِ ما. نشانه‌اش هم این است که با کلِ واقعیت جور درمی‌آید و در خود نمی‌شکند. پس معیار، نه «چه‌کسی می‌گوید» است و نه «چند نفر می‌گویند»، بلکه «آیا با بقیه‌ی آنچه درست می‌دانیم سازگار است». می‌خواهی روی یک نمونه‌ی مشخص، همین معیار را با هم بیازماییم؟',
      },
    ],
  },
  {
    id: 'seed-2',
    publishedAt: T(1, 14),
    understood: 8,
    turns: [
      {
        seeker: 'هدف از زندگی چیست؟ چرا اصلاً آفریده شده‌ایم؟',
        monad:
          'بگذار پرسش را کمی بشکافیم. آیا می‌پرسی «چه هدفی برای من تعیین شده؟» یا «من چه هدفی باید برای خودم بسازم؟» پاسخِ قرآن این است که این دو در برابر هم نیستند: انسان بی‌هدف و بازیچه آفریده نشده، اما هدف هم چیزی نیست که از بیرون بر او تحمیل شود؛ در سرشتش نهاده شده و او با انتخاب، آن را زنده می‌کند.',
      },
      {
        seeker: 'خب آن هدفِ نهاده‌شده چیست؟',
        monad:
          'به زبانِ ساده: شناختِ سرچشمه و زیستن در نسبتِ درست با او — که قرآن نامش را «بندگی» می‌گذارد؛ نه بندگیِ خوارکننده، بلکه آزاد شدن از بندگیِ هر چیزِ دیگر. و این خود آزمونی است: زندگی میدانِ سنجش است که در آن پیدا می‌شود چه‌کسی کارِ نیکوتر می‌کند. پس هدف، نه خودِ لذت است و نه خودِ رنج، بلکه ساخته‌شدنِ توست در این میدان. اگر بخواهی، می‌توانیم بپرسیم چرا این «آزمون» اصلاً لازم است.',
      },
    ],
  },
  {
    id: 'seed-3',
    publishedAt: T(4, 11),
    understood: 21,
    turns: [
      {
        seeker: 'اگر خدایی هست که مهربان است، چرا این‌همه رنج و بدی در جهان هست؟',
        monad:
          'این کهن‌ترین و صادقانه‌ترین پرسشِ انسان است، و شتاب در پاسخش نوعی خیانت است. نخست یک تفکیک لازم است: بخشی از آنچه «بد» می‌نامیم نتیجه‌ی انتخابِ خودِ انسان‌هاست — ظلم، دروغ، جنگ — و بخشی رنجی است که در خودِ ساختارِ زندگی هست، مانند بیماری و کمبود و مرگ. این دو را نباید یکی گرفت. کدام‌یک بیشتر آزارت می‌دهد؟',
      },
      {
        seeker: 'بیشتر همان دومی؛ رنجی که دستِ کسی در آن نیست.',
        monad:
          'در نگاهِ قرآن این جهان جای آسودن نیست، جای آزمودن است؛ و آزمون بدون سختی معنا ندارد. رنج این‌جا نه نشانه‌ی رهاشدگی، بلکه بخشی از همان میدانِ ساخته‌شدن است. اما قرآن یک چیز را صریح می‌گوید: این‌جا پایانِ حساب نیست. اگر مرگْ پایانِ همه‌چیز باشد، رنجِ بی‌پاسخْ بی‌عدالتیِ محض است؛ اما اگر آغازِ حساب باشد، هیچ رنجی گم نمی‌شود. پس این پرسش در نهایت به پرسشِ دیگری گره می‌خورد: مرگ پایان است یا آغاز؟',
      },
    ],
  },
  {
    id: 'seed-4',
    publishedAt: T(20, 16),
    understood: 6,
    turns: [
      {
        seeker: 'مرگ پایانِ همه‌چیز است، یا چیزی پس از آن هست؟',
        monad:
          'بگذار اول ببینیم پرسش از کجا می‌آید. آیا از ترس می‌پرسی یا از جست‌وجوی معنا؟ پاسخِ هر دو یکی است اما راهِ شنیدنش فرق دارد. و صادق باشم: قطعیتِ تجربی درباره‌ی «پس از مرگ» در دسترسِ هیچ‌کس نیست؛ کسی از آن‌سو برنگشته تا گزارش دهد. پس این‌جا با «دلیل» کار داریم، نه با «مشاهده».',
      },
      {
        seeker: 'باشد، با دلیل. چه دلیلی هست که مرگ پایان نیست؟',
        monad:
          'یک نشانه از درونِ خودِ زندگی: عطشِ انسان به ماندن و به عدالت، در جهانی که هیچ‌کدام را کامل نمی‌دهد. قرآن این ناسازگاری را چنین حل می‌کند که این جهان نیمه‌ی داستان است، نه همه‌ی آن؛ مرگ نه دیوار، که در است. این را به تو تحمیل نمی‌کنم؛ فقط می‌پرسم کدام تصویر با کلِ واقعیت — با همین عدالت‌خواهی و معناجوییِ درونِ تو — سازگارتر است. اگر مرگ پایان باشد، بسیاری از عمیق‌ترین کشش‌های انسان بی‌پاسخ و پوچ می‌مانند. کدام را سخت‌تر می‌توانی بپذیری؟',
      },
    ],
  },
  {
    id: 'seed-5',
    publishedAt: T(100, 10),
    understood: 15,
    turns: [
      {
        seeker: 'چطور بفهمم راهی که در زندگی انتخاب کرده‌ام درست است یا در اشتباهم؟',
        monad:
          'پیش از هر معیار، یک پرسشِ صادقانه از خودت: آیا واقعاً می‌خواهی بدانی، حتی اگر پاسخ به سودت نباشد؟ چون بیشترِ ما نه دنبالِ حقیقت، بلکه دنبالِ تأییدِ راهی هستیم که از پیش برگزیده‌ایم. صداقت با خود، نخستین گام است.',
      },
      {
        seeker: 'فرض کن صادقانه می‌خواهم بدانم. بعد چه؟',
        monad:
          'آن‌گاه سه نشانه کمک می‌کند. نخست سازگاری: آیا این راه در خودش می‌شکند یا منسجم است؟ دوم ثمر: قرآن می‌گوید آنچه به مردم سود می‌رساند می‌ماند و کفِ روی آب می‌رود؛ راهِ درست در بلندمدت آبادانی می‌آورد نه ویرانی. سوم آرامشِ آگاهانه: نه آرامشِ غفلت، بلکه قرارِ دلی که با حقیقت روبه‌رو شده است. و یک هشدار: اگر راهی از تو می‌خواهد که چشمت را بر واقعیت ببندی تا در آن بمانی، همین خواسته خودش یک نشانه است. می‌خواهی این سه نشانه را روی انتخابِ مشخصِ خودت بیازماییم؟',
      },
    ],
  },
];

const db = new DatabaseSync(dbPath);

// اطمینان از وجود جدول‌ها (اگر برنامه هنوز اجرا نشده باشد، راهنمایی می‌کنیم)
const hasTable = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'")
  .get();
if (!hasTable) {
  console.error(
    `پایگاه داده در ${path.resolve(dbPath)} هنوز آماده نیست. یک‌بار برنامه را اجرا کنید (npm run dev) تا جدول‌ها ساخته شوند، سپس دوباره seed را اجرا کنید.`,
  );
  process.exit(1);
}

const ids = CONVERSATIONS.map((c) => c.id);
const placeholders = ids.map(() => '?').join(',');

db.exec('BEGIN');
try {
  // پاک‌سازی رکوردهای seed پیشین (idempotent)
  db.prepare(`DELETE FROM messages WHERE conversation_id IN (${placeholders})`).run(...ids);
  db.prepare(`DELETE FROM search_index WHERE conversation_id IN (${placeholders})`).run(...ids);
  db.prepare(
    `DELETE FROM epistemic_signals WHERE content_type='conversation' AND content_id IN (${placeholders})`,
  ).run(...ids);
  db.prepare(`DELETE FROM conversations WHERE id IN (${placeholders})`).run(...ids);

  const insertConv = db.prepare(
    `INSERT INTO conversations (id, owner_token, user_id, title, status, created_at, published_at)
     VALUES (?, ?, NULL, ?, 'published', ?, ?)`,
  );
  const insertMsg = db.prepare(
    `INSERT INTO messages (conversation_id, seq, role, content, original_content, created_at)
     VALUES (?, ?, ?, ?, NULL, ?)`,
  );
  const insertFts = db.prepare(
    'INSERT INTO search_index (conversation_id, title, body) VALUES (?, ?, ?)',
  );
  const insertSignal = db.prepare(
    `INSERT INTO epistemic_signals (content_type, content_id, kind, actor_key, created_at)
     VALUES ('conversation', ?, 'understood-more', ?, ?)`,
  );

  for (const c of CONVERSATIONS) {
    const title = c.turns[0].seeker;
    const createdAt = new Date(new Date(c.publishedAt).getTime() - 3_600_000).toISOString();
    insertConv.run(
      c.id,
      crypto.randomBytes(32).toString('base64url'),
      title,
      createdAt,
      c.publishedAt,
    );

    let seq = 0;
    const bodyParts = [];
    for (const turn of c.turns) {
      seq += 1;
      insertMsg.run(c.id, seq, 'seeker', turn.seeker, c.publishedAt);
      seq += 1;
      insertMsg.run(c.id, seq, 'monad', turn.monad, c.publishedAt);
      bodyParts.push(turn.seeker, turn.monad);
    }
    insertFts.run(c.id, title, bodyParts.join('\n'));

    // سیگنال‌های معرفتیِ نمونه (اثر بر فهم؛ نه محبوبیت) — actorهای متمایز
    for (let i = 0; i < (c.understood ?? 0); i += 1) {
      insertSignal.run(c.id, `seed-actor-${c.id}-${i}`, c.publishedAt);
    }
  }

  db.exec('COMMIT');
  console.log(`درج شد: ${CONVERSATIONS.length} گفتگوی بنیادین در ${path.resolve(dbPath)}`);
} catch (error) {
  db.exec('ROLLBACK');
  console.error('خطا در seed:', error);
  process.exit(1);
}
