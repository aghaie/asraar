import type { EmailSender } from '@/core/ports/email-sender';

/**
 * ارسال‌کننده‌ی آزمایشی: لینک جادویی را در کنسول چاپ می‌کند.
 * برای توسعه‌ی محلی بدون SMTP. در تولید نباید استفاده شود.
 */
export class ConsoleEmailSender implements EmailSender {
  readonly name = 'console';

  async sendMagicLink(email: string, url: string): Promise<void> {
    console.log(
      JSON.stringify({
        level: 'info',
        msg: 'magic-link (console)',
        email,
        url,
      }),
    );
  }
}
