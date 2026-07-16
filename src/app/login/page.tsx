import { redirect } from 'next/navigation';
import { getContainer } from '@/infrastructure/container';
import { currentUserServer } from '@/lib/auth';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await currentUserServer();
  if (user) redirect('/profile');
  const [locale, google] = await Promise.all([
    currentLocale(),
    Promise.resolve(getContainer().google),
  ]);

  return (
    <>
      <h1 className="page-title">{t(locale, 'login.title')}</h1>
      <p style={{ color: 'var(--text-soft)', marginBottom: '1.25rem' }}>
        {t(locale, 'login.disclaimer')}
      </p>
      <LoginForm googleEnabled={google !== null} />
    </>
  );
}
