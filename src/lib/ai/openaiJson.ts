export async function fetchOpenAiJson<T>(
  system: string,
  user: string,
  options?: { model?: string; temperature?: number; timeoutMs?: number },
): Promise<T | null> {
  const key = process.env["OPENAI_API_KEY"]?.trim();
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options?.model ?? process.env["OPENAI_PRACTICE_MODEL"]?.trim() ?? "gpt-4o-mini",
      temperature: options?.temperature ?? 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? 55_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  return JSON.parse(content) as T;
}
