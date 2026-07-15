/** فراخوان مشترک Chat Completions مربوط به OpenAI — بین موتور گفتگو و مترجم مشترک است. */

export interface OpenAiRequest {
  apiKey: string;
  model: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}

export async function openAiComplete(req: OpenAiRequest): Promise<string> {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com';
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      max_completion_tokens: req.maxTokens,
      messages: [{ role: 'system', content: req.system }, ...req.messages],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`openai ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices: { message?: { content?: string | null } }[];
  };
  return data.choices[0]?.message?.content ?? '';
}
