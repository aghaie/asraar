'use client';

import { useState } from 'react';
import { LANGUAGES, RTL_LANGS, labelOf } from './languages';

interface ViewMessage {
  role: 'seeker' | 'monad';
  content: string;
  originalContent?: string | null;
}

interface Translation {
  lang: string;
  title: string;
  messages: ViewMessage[];
}

interface Props {
  id: string;
  title: string;
  publishedAt: string;
  valueUp: number;
  valueDown: number;
  messages: ViewMessage[];
  /** زبان مرجّح خواننده (اگر با زبان اصلی فرق داشته باشد) — برای پیشنهاد ترجمه */
  preferredLang?: string | null;
  /** ترجمه‌ی ازپیش‌کش‌شده به زبان خواننده (رایگان، بدون فراخوان تازه) */
  initialTranslation?: Translation | null;
}

export function ConversationView(props: Props) {
  const [lang, setLang] = useState(props.initialTranslation?.lang ?? '');
  const [translated, setTranslated] = useState<Translation | null>(
    props.initialTranslation ?? null,
  );
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [counts, setCounts] = useState({ up: props.valueUp, down: props.valueDown });

  // پیشنهاد ترجمه فقط وقتی زبان خواننده متفاوت است، هنوز اصل نمایش داده می‌شود، و کش نبود.
  const showOffer =
    !!props.preferredLang && lang === '' && !props.initialTranslation;

  const active = translated && lang === translated.lang ? translated : null;
  const title = active?.title ?? props.title;
  const messages = active?.messages ?? props.messages;
  const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';

  async function changeLanguage(code: string) {
    setLang(code);
    setError(null);
    if (!code) return;
    if (translated && translated.lang === code) return;
    setTranslating(true);
    try {
      const response = await fetch(
        `/api/conversations/${props.id}/translation?lang=${code}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message ?? 'ترجمه در دسترس نیست.');
      }
      setTranslated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ترجمه در دسترس نیست.');
      setLang('');
    } finally {
      setTranslating(false);
    }
  }

  async function sendSignal(valuable: boolean) {
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${props.id}/value`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ valuable }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setSignal('نظر شما پیش‌تر ثبت شده است.');
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error?.message ?? 'ثبت نشد.');
      }
      setCounts((c) =>
        valuable ? { ...c, up: c.up + 1 } : { ...c, down: c.down + 1 },
      );
      setSignal('ثبت شد. سپاس.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ثبت نشد.');
    }
  }

  return (
    <article dir={dir}>
      <h1 className="page-title">{title}</h1>

      <div className="lang-bar" dir="rtl">
        <label htmlFor="lang">خواندن به زبان:</label>
        <select
          id="lang"
          value={lang}
          onChange={(e) => void changeLanguage(e.target.value)}
          disabled={translating}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        {translating && <span>در حال ترجمه…</span>}
        {active && <span>ترجمه‌ی ماشینی — متن اصلی معیار است.</span>}
      </div>

      {showOffer && (
        <div className="notice" dir="rtl" style={{ marginTop: '0.8rem' }}>
          این گفتگو را به {labelOf(props.preferredLang!)} بخوانی؟{' '}
          <button
            className="btn secondary"
            style={{ minHeight: 'auto', padding: '0.2rem 0.9rem', marginInlineStart: '0.5rem' }}
            onClick={() => void changeLanguage(props.preferredLang!)}
            disabled={translating}
          >
            ترجمه کن
          </button>
        </div>
      )}

      {error && (
        <div className="notice error" dir="rtl" style={{ marginTop: '0.8rem' }}>
          {error}
        </div>
      )}

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="who">{m.role === 'seeker' ? 'جوینده' : 'مناد'}</div>
            {m.content}
            {!active && m.originalContent && (
              <details>
                <summary>متن اصلی پیش از ویرایش نگارشی</summary>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.4rem' }}>
                  {m.originalContent}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="value-bar" dir="rtl">
        <span>این گفتگو برایت ارزشمند بود؟</span>
        <button className="btn secondary" onClick={() => void sendSignal(true)}>
          ارزشمند بود ({counts.up})
        </button>
        <button className="btn quiet" onClick={() => void sendSignal(false)}>
          نبود ({counts.down})
        </button>
        {signal && <span>{signal}</span>}
      </div>
    </article>
  );
}
