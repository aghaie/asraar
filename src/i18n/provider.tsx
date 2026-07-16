'use client';

import { createContext, useContext } from 'react';
import fa from './messages/fa.json';
import type { MessageKey, Messages } from './t';

interface I18nValue {
  locale: string;
  messages: Messages;
}

const I18nContext = createContext<I18nValue>({ locale: 'fa', messages: fa });

/** سرور با locale و dictionary مقداردهی می‌کند تا کلاینت هم همان زبان را داشته باشد. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

/** هوکِ ترجمه برای کامپوننت‌های کلاینت. */
export function useT() {
  const { locale, messages } = useContext(I18nContext);
  const t = (key: MessageKey, params?: Record<string, string | number>): string => {
    const template = messages[key] ?? (fa as Messages)[key] ?? String(key);
    return interpolate(template, params);
  };
  return { t, locale };
}
