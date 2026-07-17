/**
 * موردهای کاربردِ نمای مدیریت (ADR-0026) — نازک و مستقل از فریمورک.
 * صیانت از کرامت و سلامتِ معرفتی؛ بدونِ بلاکِ کاربر (ADR-0006).
 */

import type { ConversationStatus } from '@/core/domain/conversation';
import type { AdminConversationRow, AdminStats } from '@/core/domain/admin';
import type { ConversationRepository } from '@/core/ports/conversation-repository';

export interface AdminDeps {
  repo: ConversationRepository;
}

export function adminOverview(deps: AdminDeps): AdminStats {
  return deps.repo.adminStats();
}

export function listAdminConversations(deps: AdminDeps, limit = 200): AdminConversationRow[] {
  return deps.repo.listAllForAdmin(limit);
}

/** خارج‌کردن از انتشار (published→private) — نگهِ‌داشتنِ داده، برداشتن از دسترسِ عموم. */
export function unpublishConversation(deps: AdminDeps, id: string): void {
  deps.repo.setStatus(id, 'private');
}

/** بازگرداندن به انتشار. */
export function republishConversation(deps: AdminDeps, id: string): void {
  deps.repo.setStatus(id, 'published');
}

/** حذفِ کاملِ گفتگو و داده‌های وابسته — برای نقضِ کرامت. */
export function deleteConversationAdmin(deps: AdminDeps, id: string): void {
  deps.repo.deleteConversation(id);
}

const MODERATION_ACTIONS = ['unpublish', 'republish', 'delete'] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export function isModerationAction(v: unknown): v is ModerationAction {
  return typeof v === 'string' && (MODERATION_ACTIONS as readonly string[]).includes(v);
}

/** اجرای یک کنشِ نظارتی بر یک گفتگو. */
export function moderate(deps: AdminDeps, id: string, action: ModerationAction): void {
  const target: Record<ModerationAction, () => void> = {
    unpublish: () => unpublishConversation(deps, id),
    republish: () => republishConversation(deps, id),
    delete: () => deleteConversationAdmin(deps, id),
  };
  target[action]();
}

/** برای فیلترِ نوعِ وضعیت در UI (کاربردِ عمومی). */
export function isConversationStatus(v: unknown): v is ConversationStatus {
  return v === 'active' || v === 'published' || v === 'private';
}
