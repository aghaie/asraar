'use client';

import { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../c/[id]/languages';

const LTR_LABELS = new Set(['en', 'tr', 'id', 'fr', 'de', 'es']);

/**
 * سوییچرِ زبانِ هدر (ADR-0022): آیکنِ کره‌ی زمین + منوی زبان‌ها.
 * انتخاب، کوکیِ monad_lang را می‌گذارد و صفحه را تازه می‌کند؛ زبان به‌خاطر سپرده می‌شود.
 */
export function LanguageSwitcher({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function choose(code: string) {
    document.cookie = `monad_lang=${code}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  const current = LANGUAGES.find((l) => l.code === locale);
  const options = LANGUAGES.filter((l) => l.code); // بدون «زبان اصلی»

  return (
    <div className="lang-switch" ref={ref}>
      <button
        className="lang-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="تغییر زبان"
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <circle cx={12} cy={12} r={9} />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
        <span>{current?.label ?? 'زبان'}</span>
      </button>
      {open && (
        <div className="lang-menu" role="menu">
          {options.map((l) => (
            <button
              key={l.code}
              role="menuitem"
              className={l.code === locale ? 'active' : undefined}
              dir={LTR_LABELS.has(l.code) ? 'ltr' : 'rtl'}
              style={LTR_LABELS.has(l.code) ? { textAlign: 'left' } : undefined}
              onClick={() => choose(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
