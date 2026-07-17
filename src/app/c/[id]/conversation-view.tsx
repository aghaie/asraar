'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/i18n/provider';
import { RTL_LANGS, labelOf } from './languages';
import { ownerTokenKey } from '@/lib/branch-token';
import {
  TranslateIcon,
  ReasoningIcon,
  QuranIcon,
  BranchIcon,
} from '../../_components/icons';

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
  /** زبان اصلیِ گفتگو — برای جهتِ نمایش وقتی ترجمه‌ای فعال نیست */
  originalLang: string;
  /** زبان مرجّح خواننده (اگر با زبان اصلی فرق داشته باشد) — برای پیشنهاد ترجمه */
  preferredLang?: string | null;
  /** ترجمه‌ی ازپیش‌کش‌شده به زبان خواننده (رایگان، بدون فراخوان تازه) */
  initialTranslation?: Translation | null;
}

/** سیگنال‌های معرفتیِ صریح (ADR-0022، اصل ۳) — «اثر بر فهم»، نه محبوبیت. */
const SIGNALS = [
  { kind: 'understood-more', key: 'signal.understoodMore' },
  { kind: 'thought-more', key: 'signal.thoughtMore' },
] as const;

export function ConversationView(props: Props) {
  const { t } = useT();
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
  const [openLayers, setOpenLayers] = useState<Set<string>>(new Set());
  const router = useRouter();

  /** باز/بستنِ یک لایه (استدلال/مبنای قرآنی) با کلیکِ آیکنِ داخلِ باکس. */
  function toggleLayer(seq: number, layer: 'reasoning' | 'quranic') {
    const key = `${seq}:${layer}`;
    setOpenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        void loadLayer(seq, layer);
      }
      return next;
    });
  }

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
      if (!res.ok) throw new Error(data?.error?.message ?? t('conv.branchError'));
      localStorage.setItem(ownerTokenKey(data.id), data.ownerToken);
      router.push(`/continue/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('conv.branchError'));
      setBranching(false);
    }
  }

  // پیشنهاد ترجمه فقط وقتی زبان خواننده متفاوت است، هنوز اصل نمایش داده می‌شود، و کش نبود.
  const showOffer =
    !!props.preferredLang && lang === '' && !props.initialTranslation;

  const active = translated && lang === translated.lang ? translated : null;
  const title = active?.title ?? props.title;
  const messages = active?.messages ?? props.messages;
  // جهتِ نمایش از زبانِ محتوای فعلی می‌آید: ترجمهٔ فعال، وگرنه زبانِ اصلیِ گفتگو.
  const dir = RTL_LANGS.has(active ? lang : props.originalLang) ? 'rtl' : 'ltr';

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
        throw new Error(data?.error?.message ?? t('conv.translateError'));
      }
      setTranslated(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('conv.translateError'));
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
        setSignal(t('conv.signalDuplicate'));
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error?.message ?? t('conv.signalError'));
      }
      setCounts((c) => ({ ...c, [kind]: (c[kind] ?? 0) + 1 }));
      setSent((s) => new Set(s).add(kind));
      setSignal(t('conv.signalThanks'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('conv.signalError'));
    }
  }

  return (
    <article dir={dir}>
      <h1 className="page-title">{title}</h1>

      {(translating || active) && (
        <div className="lang-bar" dir={dir}>
          {translating && <span>{t('conv.translating')}</span>}
          {active && <span>{t('conv.machineNote')}</span>}
        </div>
      )}

      {showOffer && (
        <div className="notice" dir="rtl" style={{ marginTop: '0.8rem' }}>
          {t('conv.offer', { lang: labelOf(props.preferredLang!) })}{' '}
          <button
            className="btn secondary"
            style={{ minHeight: 'auto', padding: '0.2rem 0.9rem', marginInlineStart: '0.5rem' }}
            onClick={() => void changeLanguage(props.preferredLang!)}
            disabled={translating}
          >
            <TranslateIcon size={16} /> {t('conv.translate')}
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
          {t('branch.fromParent')}{' '}
          <Link href={`/c/${props.parentId}`}>{t('branch.viewParent')}</Link>
        </div>
      )}

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i}>
            <div className={`msg ${m.role}`}>
              <div className="who">{m.role === 'seeker' ? t('conv.seeker') : t('conv.monad')}</div>
              {m.content}
              {!active && m.originalContent && (
                <details>
                  <summary>{t('conv.original')}</summary>
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.4rem' }}>
                    {m.originalContent}
                  </div>
                </details>
              )}
              {m.role === 'monad' && (
                <>
                  <div className="msg-actions">
                    {(
                      [
                        {
                          layer: 'reasoning' as const,
                          key: 'layer.reasoning' as const,
                          Icon: ReasoningIcon,
                        },
                        {
                          layer: 'quranic' as const,
                          key: 'layer.quranic' as const,
                          Icon: QuranIcon,
                        },
                      ]
                    ).map(({ layer, key: labelKey, Icon }) => {
                      const key = `${i + 1}:${layer}`;
                      return (
                        <button
                          key={layer}
                          type="button"
                          className={openLayers.has(key) ? 'msg-act active' : 'msg-act'}
                          aria-pressed={openLayers.has(key)}
                          aria-label={t(labelKey)}
                          title={t(labelKey)}
                          onClick={() => toggleLayer(i + 1, layer)}
                        >
                          <Icon size={17} />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="msg-act"
                      aria-label={t('branch.continue')}
                      title={t('branch.continue')}
                      onClick={() => void branchFrom(i + 1)}
                      disabled={branching}
                    >
                      <BranchIcon size={17} />
                    </button>
                  </div>
                  {(['reasoning', 'quranic'] as const).map((layer) => {
                    const key = `${i + 1}:${layer}`;
                    if (!openLayers.has(key)) return null;
                    const labelKey =
                      layer === 'reasoning' ? 'layer.reasoning' : 'layer.quranic';
                    return (
                      <div key={layer} className="layer-panel">
                        <div className="layer-head">{t(labelKey)}</div>
                        <div className="layer-body">
                          {layers[key] ??
                            (layerState[key] === 'error'
                              ? t('layer.error')
                              : t('layer.loading'))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="signal-bar" dir="rtl">
        <p className="signal-q">{t('conv.signalQ')}</p>
        <div className="signal-chips">
          {SIGNALS.map((s) => (
            <button
              key={s.kind}
              className="signal-chip"
              aria-pressed={sent.has(s.kind)}
              onClick={() => void sendSignal(s.kind)}
              disabled={sent.has(s.kind)}
            >
              {t(s.key)}
              {(counts[s.kind] ?? 0) > 0 ? ` (${counts[s.kind]})` : ''}
            </button>
          ))}
        </div>
        <p className="signal-note">{signal ?? t('conv.signalNote')}</p>
      </div>

      {props.branches.length > 0 && (
        <div className="branches" dir="rtl">
          <h3>{t('branches.title', { count: props.branches.length })}</h3>
          <p className="note">{t('branches.note')}</p>
          <div className="branch-list">
            {props.branches.map((b) => (
              <Link key={b.id} href={`/c/${b.id}`} className="branch-card">
                <div className="lead">
                  {t('branches.fromTurn', {
                    turn: Math.ceil(b.branchPoint / 2),
                    count: b.turns,
                  })}
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
