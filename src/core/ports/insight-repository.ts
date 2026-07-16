import type { Insight } from '../domain/insight';

/**
 * پورتِ مخزنِ Insight — داراییِ اصلیِ مناد (ADR-0022، اصل ۶). پیاده‌سازی در فازهای بعد.
 */
export interface InsightRepository {
  create(insight: Insight): void;
  findById(id: string): Insight | null;
  update(insight: Insight): void;
  search(match: string, limit: number): Insight[];
  listByConversation(conversationId: string): Insight[];
  listRelated(insightId: string): Insight[];
}
