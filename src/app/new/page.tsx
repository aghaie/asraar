'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';

interface ChatMessage {
  role: 'seeker' | 'monad';
  content: string;
}

type Phase = 'chatting' | 'finishing' | 'published' | 'private';

interface ApiError {
  error?: { code?: string; message?: string };
}

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ApiError &
    Record<string, unknown>;
  if (!response.ok) {
    throw new Error(data.error?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.');
  }
  return data;
}

export default function NewConversationPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('chatting');
  const conversationRef = useRef<{ id: string; ownerToken: string } | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || busy) return;
    setBusy(true);
    setError(null);
    let monadStarted = false;
    try {
      if (!conversationRef.current) {
        const started = await postJson('/api/conversations', {});
        conversationRef.current = {
          id: started.id as string,
          ownerToken: started.ownerToken as string,
        };
        setConversationId(started.id as string);
      }
      const { id, ownerToken } = conversationRef.current;
      setMessages((prev) => [...prev, { role: 'seeker', content }]);
      setInput('');

      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
        },
        body: JSON.stringify({ ownerToken, content }),
      });

      if (!response.headers.get('content-type')?.includes('text/event-stream')) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(data.error?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.');
      }

      // خواندن جریان SSE: delta / done / error
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamError: string | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          let event = 'message';
          let data = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          if (!data) continue;
          const payload = JSON.parse(data) as { text?: string; message?: string };
          if (event === 'delta' && payload.text) {
            if (!monadStarted) {
              monadStarted = true;
              setMessages((prev) => [...prev, { role: 'monad', content: '' }]);
            }
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = {
                ...last,
                content: last.content + payload.text,
              };
              return next;
            });
          } else if (event === 'error') {
            streamError = payload.message ?? 'خطایی رخ داد.';
          }
        }
      }
      if (streamError) throw new Error(streamError);
      if (!monadStarted) throw new Error('پاسخی دریافت نشد. دوباره تلاش کنید.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطایی رخ داد.');
      // بازگرداندن نوبت ناتمام: پیام ناقص مناد و پیام جوینده حذف می‌شوند
      setMessages((prev) => {
        const next = [...prev];
        if (monadStarted && next.length && next[next.length - 1].role === 'monad') {
          next.pop();
        }
        if (next.length && next[next.length - 1].role === 'seeker') next.pop();
        return next;
      });
      setInput(content);
    } finally {
      setBusy(false);
    }
  }, [input, busy]);

  const finish = useCallback(
    async (publish: boolean) => {
      if (!conversationRef.current || busy) return;
      setBusy(true);
      setError(null);
      try {
        const { id, ownerToken } = conversationRef.current;
        await postJson(`/api/conversations/${id}/finish`, { ownerToken, publish });
        setPhase(publish ? 'published' : 'private');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطایی رخ داد.');
        setPhase('chatting');
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  if (phase === 'published') {
    return (
      <div className="notice">
        <p>گفتگو منتشر شد. اکنون هر جوینده‌ای در جهان می‌تواند آن را بخواند.</p>
        <p style={{ marginTop: '0.5rem' }}>
          <Link href={`/c/${conversationId}`}>دیدن گفتگوی منتشرشده</Link>
          {' · '}
          <Link href="/">بازگشت به گفتگوها</Link>
        </p>
      </div>
    );
  }

  if (phase === 'private') {
    return (
      <div className="notice">
        <p>گفتگو خصوصی ماند و برای دیگران نمایش داده نمی‌شود.</p>
        <p style={{ marginTop: '0.5rem' }}>
          <Link href="/">بازگشت به گفتگوها</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">گفتگوی تازه</h1>
      {messages.length === 0 && (
        <p style={{ color: 'var(--text-soft)' }}>
          پرسشت را بنویس — به هر زبانی که با آن می‌اندیشی. مناد عجله ندارد.
        </p>
      )}

      <div className="messages" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="who">{m.role === 'seeker' ? 'تو' : 'مناد'}</div>
            {m.content}
          </div>
        ))}
        {busy &&
          phase === 'chatting' &&
          messages[messages.length - 1]?.role !== 'monad' && (
            <div className="msg monad">
              <div className="who">مناد</div>
              در حال اندیشیدن…
            </div>
          )}
      </div>

      {error && <div className="notice error">{error}</div>}

      {phase === 'chatting' && (
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="پرسش تو…"
            aria-label="متن پرسش"
            disabled={busy}
          />
          <div className="actions">
            <button className="btn" onClick={() => void send()} disabled={busy || !input.trim()}>
              بفرست
            </button>
            {messages.length > 0 && (
              <button
                className="btn quiet"
                onClick={() => setPhase('finishing')}
                disabled={busy}
              >
                پایان گفتگو
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'finishing' && (
        <div className="notice">
          <p>این گفتگو منتشر شود تا دیگران هم بخوانند، یا خصوصی بماند؟</p>
          <div className="actions" style={{ marginTop: '0.8rem' }}>
            <button className="btn" onClick={() => void finish(true)} disabled={busy}>
              منتشر شود
            </button>
            <button className="btn secondary" onClick={() => void finish(false)} disabled={busy}>
              خصوصی بماند
            </button>
            <button className="btn quiet" onClick={() => setPhase('chatting')} disabled={busy}>
              ادامه‌ی گفتگو
            </button>
          </div>
        </div>
      )}
    </>
  );
}
