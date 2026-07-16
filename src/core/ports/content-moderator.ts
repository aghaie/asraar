/**
 * پورت نگهبانِ کرامتِ فضای عمومی.
 * تنها هنگام «انتشار» گفتگو به‌کار می‌رود؛ پرسیدن و خصوصی‌ماندن هرگز داوری نمی‌شوند.
 * فلسفه: «وَقُولُوا لِلنَّاسِ حُسْنًا» — پرسشِ صادقانه، هرچند بی‌پرده، آزاد است؛
 * تنها توهین، هرزگی و اسپم از فضای عمومی دور نگه داشته می‌شود.
 */
export interface ModerationResult {
  allow: boolean;
  /** اگر رد شد، دلیل کوتاه فارسی؛ وگرنه null */
  reason: string | null;
}

export interface ContentModerator {
  readonly name: string;
  /** متنِ نوشته‌ی جوینده را می‌سنجد. در تردید یا خطا، اجازه می‌دهد (fail-open). */
  moderate(seekerText: string): Promise<ModerationResult>;
}
