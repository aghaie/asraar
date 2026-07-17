import fs from 'node:fs';
import path from 'node:path';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';

export const dynamic = 'force-dynamic';

interface Post {
  title: string;
  body: string;
}

/**
 * پست‌های پیشرفت، به ترتیبِ تاریخ (تازه‌ترین اول)، از docs/telegram-posts.md.
 * فعلاً منبعْ همان فایلِ مارک‌داون است (مالک دستی در تلگرام هم می‌گذارد).
 * نگه‌داریِ دیتابیسیِ این محتوا Future Idea است (ADR-0025 — پس از اثباتِ نیاز).
 */
function readPosts(): Post[] {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'docs/telegram-posts.md'), 'utf8');
    return raw
      .split(/^##\s+/m)
      .slice(1) // چانکِ نخست، مقدمه است
      .map((chunk) => {
        const nl = chunk.indexOf('\n');
        const title = chunk.slice(0, nl).trim();
        const body = chunk
          .slice(nl + 1)
          .replace(/\n---\s*$/g, '')
          .trim();
        return { title, body };
      })
      .filter((p) => p.title.length > 0);
  } catch {
    return [];
  }
}

export default async function UpdatesPage() {
  const locale = await currentLocale();
  const posts = readPosts();

  return (
    <>
      <h1 className="page-title">{t(locale, 'updates.title')}</h1>
      {posts.length === 0 ? (
        <div className="empty">
          <p>{t(locale, 'updates.empty')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map((p, i) => (
            <article key={i} className="card" style={{ cursor: 'default' }}>
              <h2 style={{ marginBottom: '0.6rem' }}>{p.title}</h2>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-soft)', lineHeight: 1.9 }}>
                {p.body}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
