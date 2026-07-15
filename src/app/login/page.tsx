import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getContainer } from '@/infrastructure/container';
import { currentUserServer } from '@/lib/auth';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ورود' };

export default async function LoginPage() {
  const user = await currentUserServer();
  if (user) redirect('/profile');
  const googleEnabled = getContainer().google !== null;

  return (
    <>
      <h1 className="page-title">ورود به مناد</h1>
      <p style={{ color: 'var(--text-soft)', marginBottom: '1.25rem' }}>
        ورود اختیاری است. مناد بدون ورود هم کامل کار می‌کند؛ ورود فقط برای داشتن نام و
        بایگانیِ خصوصیِ گفتگوهایت است.
      </p>
      <LoginForm googleEnabled={googleEnabled} />
    </>
  );
}
