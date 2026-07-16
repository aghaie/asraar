import { describe, expect, it } from 'vitest';
import { getAnswerLayer } from '@/core/usecases/get-answer-layer';
import { startConversation } from '@/core/usecases/start-conversation';
import { sendMessage } from '@/core/usecases/send-message';
import { finishConversation } from '@/core/usecases/finish-conversation';
import { isAnswerLayer } from '@/core/domain/answer-layer';
import { testDeps } from './helpers/in-memory';

function layerDeps(base = testDeps()) {
  return {
    base,
    deps: {
      repo: base.repo,
      builder: base.builder,
      store: base.layerStore,
      rateLimiter: base.rateLimiter,
      now: base.now,
    },
  };
}

async function publishOneTurn(base: ReturnType<typeof testDeps>) {
  const { id, ownerToken } = startConversation(base, 'author');
  await sendMessage(base, { conversationId: id, ownerToken, content: 'حقیقت چیست؟', clientKey: 'author' });
  await finishConversation(base, { conversationId: id, ownerToken, publish: true });
  return id;
}

describe('isAnswerLayer', () => {
  it('لایه‌های معتبر و نامعتبر', () => {
    expect(isAnswerLayer('reasoning')).toBe(true);
    expect(isAnswerLayer('quranic')).toBe(true);
    expect(isAnswerLayer('opinion')).toBe(false);
  });
});

describe('getAnswerLayer (ADR-0022، اصل ۴ — تنبل + کش)', () => {
  it('لایه‌ی استدلال را می‌سازد و بار دوم از کش می‌خواند', async () => {
    const { base, deps } = layerDeps();
    const id = await publishOneTurn(base); // seq2 = پاسخِ مناد
    const first = await getAnswerLayer(deps, id, 2, 'reasoning', 'viewer-1');
    expect(first.content).toContain('reasoning');
    expect(base.builder.calls).toBe(1);

    await getAnswerLayer(deps, id, 2, 'reasoning', 'viewer-2');
    expect(base.builder.calls).toBe(1); // کش؛ ساخت دوباره نشد
  });

  it('لایه روی نوبتی که پاسخِ مناد نیست، رد می‌شود', async () => {
    const { base, deps } = layerDeps();
    const id = await publishOneTurn(base);
    await expect(getAnswerLayer(deps, id, 1, 'reasoning', 'v')).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });

  it('لایه‌ی نامعتبر رد می‌شود', async () => {
    const { base, deps } = layerDeps();
    const id = await publishOneTurn(base);
    await expect(getAnswerLayer(deps, id, 2, 'bogus', 'v')).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });
});
