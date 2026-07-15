import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'هدیه',
  description:
    'مناد رایگان است و برای همیشه رایگان می‌ماند. هزینه‌هایش را هدیه‌ی داوطلبانه‌ی مردم تأمین می‌کند.',
};

/**
 * صفحه‌ی هدیه — تأمین مالی داوطلبانه (اصل ۷ منشور: رایگان ابدی، خودکفا با هدیه).
 * درگاه واقعی به Merchant ID نیاز دارد؛ فعلاً دکمه به MONAD_GIFT_URL اشاره می‌کند.
 */
export default function GiftPage() {
  const giftUrl = process.env.MONAD_GIFT_URL?.trim();

  return (
    <>
      <h1 className="page-title">هدیه به مناد</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <p>
          مناد رایگان است و برای همیشه رایگان می‌ماند. هیچ تبلیغی نمی‌بینی، هیچ اطلاعاتی
          فروخته نمی‌شود، و هیچ اشتراک اجباری در کار نیست.
        </p>
        <p>
          اما هر گفتگو با مناد هزینه‌ای واقعی دارد. این هزینه‌ها را نه یک شرکت و نه یک
          تبلیغ‌کننده، بلکه هدیه‌ی داوطلبانه‌ی خودِ مردم تأمین می‌کند. اگر مناد برایت
          ارزشمند بوده و توان داری، هدیه‌ات آن را برای دیگران زنده نگه می‌دارد.
        </p>
        <p style={{ color: 'var(--text-soft)' }}>
          هدیه هیچ امتیاز ویژه‌ای به تو نمی‌دهد؛ نه سهمیه‌ی بیشتر، نه دیده‌شدن بیشتر. این‌جا
          همه برابرند و قهرمان، حقیقت است. هدیه فقط راهی است برای سهیم شدن در نگه‌داشتنِ این
          فضا.
        </p>

        {giftUrl ? (
          <div className="actions" style={{ marginTop: '0.6rem' }}>
            <a className="btn" href={giftUrl} target="_blank" rel="noopener noreferrer">
              هدیه می‌دهم
            </a>
          </div>
        ) : (
          <div className="notice" style={{ marginTop: '0.6rem' }}>
            راه هدیه به‌زودی در دسترس قرار می‌گیرد. سپاس که در این مسیر همراهی.
          </div>
        )}
      </div>
    </>
  );
}
