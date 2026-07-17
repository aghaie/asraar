import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';
import { GiftIcon } from '../_components/icons';

export const dynamic = 'force-dynamic';

/**
 * صفحه‌ی هدیه — تأمین مالی داوطلبانه (اصل ۷ منشور: رایگان ابدی، خودکفا با هدیه).
 * درگاه واقعی به Merchant ID نیاز دارد؛ فعلاً دکمه به MONAD_GIFT_URL اشاره می‌کند.
 */
export default async function GiftPage() {
  const giftUrl = process.env.MONAD_GIFT_URL?.trim();
  const locale = await currentLocale();

  return (
    <>
      <h1 className="page-title">{t(locale, 'gift.title')}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <p>{t(locale, 'gift.p1')}</p>
        <p>{t(locale, 'gift.p2')}</p>
        <p style={{ color: 'var(--text-soft)' }}>{t(locale, 'gift.p3')}</p>

        {giftUrl ? (
          <div className="actions" style={{ marginTop: '0.6rem' }}>
            <a className="btn" href={giftUrl} target="_blank" rel="noopener noreferrer">
              <GiftIcon /> {t(locale, 'gift.button')}
            </a>
          </div>
        ) : (
          <div className="notice" style={{ marginTop: '0.6rem' }}>
            {t(locale, 'gift.soon')}
          </div>
        )}
      </div>
    </>
  );
}
