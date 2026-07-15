/** پورت ارسال ایمیل — برای لینک جادوییِ ورود. */
export interface EmailSender {
  readonly name: string;
  sendMagicLink(email: string, url: string): Promise<void>;
}
