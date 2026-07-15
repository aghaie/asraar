/** فراخوان مشترک API پیام‌های Anthropic — بین موتور گفتگو و مترجم مشترک است. */

export interface AnthropicRequest {
  apiKey: string;
  model: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}

export async function anthropicComplete(req: AnthropicRequest): Promise<string> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`anthropic ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text?: string }[];
  };
  return data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n');
}
