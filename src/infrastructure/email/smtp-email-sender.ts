import nodemailer from 'nodemailer';
import type { EmailSender } from '@/core/ports/email-sender';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/** ارسال‌کننده‌ی واقعی از طریق SMTP (nodemailer). */
export class SmtpEmailSender implements EmailSender {
  readonly name = 'smtp';
  private readonly transport: nodemailer.Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
  }

  async sendMagicLink(email: string, url: string): Promise<void> {
    await this.transport.sendMail({
      from: this.config.from,
      to: email,
      subject: 'ورود به مناد',
      text: `برای ورود به مناد این نشانی را باز کنید:\n\n${url}\n\nاگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.`,
      html: `<div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.9">
        <p>برای ورود به مناد روی دکمه بزنید:</p>
        <p><a href="${url}" style="display:inline-block;background:#2f6b58;color:#fff;padding:10px 22px;border-radius:10px;text-decoration:none">ورود به مناد</a></p>
        <p style="color:#6f6a5d;font-size:13px">اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
      </div>`,
    });
  }
}
