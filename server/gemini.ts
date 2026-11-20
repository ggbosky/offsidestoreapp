export interface GeminiEnv {
  apiKey: string;
  model: string;
}

export class GeminiError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

/** Úprava fotky přes Gemini (Nano Banana): fotka + instrukce → nový obrázek. */
export async function editImage(env: GeminiEnv, prompt: string, imageBase64: string, mimeType: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(env.model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new GeminiError(`Gemini vrátil HTTP ${res.status}. ${detail.slice(0, 300)}`, res.status === 400 ? 400 : 502);
  }
  type Part = { text?: string; inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Part[] }; finishReason?: string }> };
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData || p.inline_data);
  const text = parts.map((p) => p.text).filter(Boolean).join('\n');
  if (!img) throw new GeminiError(`Gemini nevrátil obrázek. ${text || json.candidates?.[0]?.finishReason || ''}`.trim(), 422);
  return {
    mimeType: img.inlineData?.mimeType ?? img.inline_data!.mime_type,
    imageBase64: img.inlineData?.data ?? img.inline_data!.data,
    text,
  };
}
