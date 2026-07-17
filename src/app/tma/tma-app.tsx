'use client';

import { useEffect, useState } from 'react';
import { ChatSession } from '../_components/chat-session';

/** حداقلِ سطحی از SDKِ تلگرام که استفاده می‌کنیم (برای پرهیز از any سراسری). */
interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  section_bg_color?: string;
  header_bg_color?: string;
}
interface TelegramWebApp {
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  ready(): void;
  expand?(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  onEvent?(event: string, cb: () => void): void;
}
declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

type Phase = 'loading' | 'ready' | 'error';

const SDK_URL = 'https://telegram.org/js/telegram-web-app.js';

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.WebApp) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('sdk')));
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('sdk'));
    document.head.appendChild(s);
  });
}

/** توکن‌های تمِ تلگرام را روی :root می‌نویسد تا tma.css رنگ‌های بومیِ کاربر را بگیرد. */
function applyTheme(tg: TelegramWebApp): void {
  const p = tg.themeParams ?? {};
  const root = document.documentElement;
  const set = (name: string, val?: string) => {
    if (val) root.style.setProperty(name, val);
  };
  set('--tg-bg', p.bg_color);
  set('--tg-text', p.text_color);
  set('--tg-hint', p.hint_color);
  set('--tg-link', p.link_color);
  set('--tg-button', p.button_color);
  set('--tg-button-text', p.button_text_color);
  set('--tg-secondary-bg', p.secondary_bg_color ?? p.bg_color);
  set('--tg-section-bg', p.section_bg_color ?? p.bg_color);
  root.dataset.tgScheme = tg.colorScheme ?? 'light';
  tg.setHeaderColor?.('secondary_bg_color');
  if (p.bg_color) tg.setBackgroundColor?.(p.bg_color);
}

export function TmaApp() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadSdk();
        const tg = window.Telegram?.WebApp;
        if (!tg || !tg.initData) {
          throw new Error('این صفحه باید از داخلِ تلگرام باز شود.');
        }
        tg.ready();
        tg.expand?.();
        applyTheme(tg);
        tg.onEvent?.('themeChanged', () => applyTheme(tg));

        const res = await fetch('/api/tma/auth', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(data.error?.message ?? 'ورود ناموفق بود.');
        }
        if (!cancelled) setPhase('ready');
      } catch (e) {
        if (!cancelled) {
          setMessage(e instanceof Error ? e.message : 'خطایی رخ داد.');
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === 'loading') {
    return <div className="tma-status">در حالِ اتصال به تلگرام…</div>;
  }
  if (phase === 'error') {
    return <div className="tma-status tma-error">{message}</div>;
  }
  return <ChatSession titleKey="new.title" introKey="new.intro" />;
}
