'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LANGUAGES, RTL_LANGS, labelOf } from './languages';
import { ownerTokenKey } from '@/lib/branch-token';

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

export interface BranchView {
  id: string;
  title: string;
  branchPoint: number;
  turns: number;
}

interface Props {
  id: string;
  title: string;
  publishedAt: string;
  signalCounts: Record<string, number>;
  messages: ViewMessage[];
  /** شاخه‌های منتشرشده‌ی این گفتگو (درختِ شاخه‌ها) */
  branches: BranchView[];
  /** اگر این گفتگو خودش شاخه باشد، شناسه‌ی والد */
  parentId?: string | null;
  /** زبان مرجّح خواننده (اگر با زبان اصلی فرق داشته باشد) — برای پیشنهاد ترجمه */
  preferredLang?: string | null;
  /** ترجمه‌ی ازپیش‌کش‌شده به زبان خواننده (رایگان، بدون فراخوان تازه) */
  initialTranslation?: Translation | null;
}

/** سیگنال‌های معرفتیِ صریح (ADR-0022، اصل ۳) — «اثر بر فهم»، نه محبوبیت. */
const SIGNALS: { kind: string; label: string }[] = [
  { kind: 'understood-more', label: 'فهمم را بیشتر کرد' },
  { kind: 'thought-more', label: 'باعث شد بیشتر فکر کنم' },
];

export function ConversationView(props: Props) {
  const [lang, setLang] = useState(props.initialTranslation?.lang ?? '');
  const [translated, setTranslated] = useState<Translation | null>(
    props.initialTranslation ?? null,
  );
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>(props.signalCounts);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [branching, setBranching] = useState(false);
  const [layers, setLayers] = useState<Record<string, string>>({});
  const [layerState, setLayerState] = useState<Record<string, 'loading' | 'error'>>({});
  const router = useRouter();

  /** بارگذاری تنبلِ یک لایه‌ی پاسخ (استدلال/مبنای قرآنی) هنگام باز شدن. */
  async function loadLayer(seq: number, layer: 'reasoning' | 'quranic') {
    const key = `${seq}:${layer}`;
    if (layers[key] || layerState[key] === 'loading') return;
    setLayerState((s) => ({ ...s, [key]: 'loading' }));
    try {
      const res = await fetch(`/api/conversations/${props.id}/layer?seq=${seq}&layer=${layer}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? 'اکنون در دسترس نیست.');
      setLayers((l) => ({ ...l, [key]: data.content as string }));
      setLayerState((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    } catch {
      setLayerState((s) => ({ ...s, [key]: 'error' }));
    }
  }

  /** شاخه‌زدن از این نقطه: پیشوندِ [۱..point] به‌ارث می‌رسد و ادامه به کاربر می‌رسد. */
  async function branchFrom(point: number) {
    if (branching) return;
    setBranching(true);
    setError(null);
    try {
      const res = await fetch('/api/conversations/branch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ parentId: props.id, branchPoint: point }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? 'شاخه‌زدن ممکن نشد.');
      localStorage.setItem(ownerTokenKey(data.id), data.ownerToken);
      router.push(`/continue/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'شاخه‌زدن ممکن نشد.');
      setBranching(false);
    }
  }

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

  async function sendSignal(kind: string) {
    setError(null);
    if (sent.has(kind)) return;
    try {
      const response = await fetch(`/api/conversations/${props.id}/signal`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setSent((s) => new Set(s).add(kind));
        setSignal('این نشانه را پیش‌تر ثبت کرده‌ای.');
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error?.message ?? 'ثبت نشد.');
      }
      setCounts((c) => ({ ...c, [kind]: (c[kind] ?? 0) + 1 }));
      setSent((s) => new Set(s).add(kind));
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

      {props.parentId && (
        <div className="notice" dir="rtl" style={{ marginBottom: '1.2rem' }}>
          این گفتگو از گفتگوی دیگری شاخه خورده است.{' '}
          <Link href={`/c/${props.parentId}`}>دیدن گفتگوی اصلی</Link>
        </div>
      )}

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i}>
            <div className={`msg ${m.role}`}>
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
              {m.role === 'monad' && (
                <div className="layers">
                  {(
                    [
                      { layer: 'reasoning' as const, label: 'استدلال — چگونه به این رسیدم' },
                      { layer: 'quranic' as const, label: 'مبنای قرآنی' },
                    ]
                  ).map(({ layer, label }) => {
                    const key = `${i + 1}:${layer}`;
                    return (
                      <details
                        key={layer}
                        className="layer"
                        onToggle={(e) => {
                          if (e.currentTarget.open) void loadLayer(i + 1, layer);
                        }}
                      >
                        <summary>{label}</summary>
                        <div className="body">
                          {layers[key] ??
                            (layerState[key] === 'error'
                              ? 'اکنون در دسترس نیست. بعداً تلاش کن.'
                              : 'در حال آماده‌سازی…')}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
            {m.role === 'monad' && (
              <div className="branch-row">
                <button
                  className="branch-btn"
                  onClick={() => void branchFrom(i + 1)}
                  disabled={branching}
                >
                  <span className="arrow">↳</span> این مسیر را ادامه بده
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="signal-bar" dir="rtl">
        <p className="signal-q">این گفتگو چه اثری بر فهمِ تو داشت؟</p>
        <div className="signal-chips">
          {SIGNALS.map((s) => (
            <button
              key={s.kind}
              className="signal-chip"
              aria-pressed={sent.has(s.kind)}
              onClick={() => void sendSignal(s.kind)}
              disabled={sent.has(s.kind)}
            >
              {s.label}
              {(counts[s.kind] ?? 0) > 0 ? ` (${counts[s.kind]})` : ''}
            </button>
          ))}
        </div>
        <p className="signal-note">
          {signal ??
            'پاسخِ تو تنها به سنجشِ اثرِ گفتگو بر فهم کمک می‌کند؛ نه رأیِ منفی هست، نه نشانه‌ی محبوبیت.'}
        </p>
      </div>

      {props.branches.length > 0 && (
        <div className="branches" dir="rtl">
          <h3>شاخه‌ها ({props.branches.length})</h3>
          <p className="note">
            مسیرهایی که جویندگان از همین گفتگو ادامه داده‌اند — برای رسیدن به غنی‌ترین فهم.
          </p>
          <div className="branch-list">
            {props.branches.map((b) => (
              <Link key={b.id} href={`/c/${b.id}`} className="branch-card">
                <div className="lead">
                  شاخه از نوبتِ {Math.ceil(b.branchPoint / 2)} · {b.turns} پرسش
                </div>
                {b.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
