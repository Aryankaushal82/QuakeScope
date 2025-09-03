
export interface QuakeSummaryInput {
  id: string;
  magnitude: number;
  depthKm: number;
  place: string;
  timeISO: string;
}

function localConciseSummary(input: QuakeSummaryInput, note?: string): string {
  const { magnitude: m, depthKm: d, place, timeISO } = input;
  // Heuristic intensity
  let intensity = 'light';
  if (m >= 6.0) intensity = 'strong';
  else if (m >= 5.0) intensity = d <= 70 ? 'moderate' : 'light';
  else if (m < 3.5) intensity = 'weak';
  const base = `M${m.toFixed(1)} near ${place} at ${timeISO}. Depth ${d.toFixed(1)} km; likely ${intensity} shaking.`;
  const safety = (intensity === 'moderate' || intensity === 'strong') ? ' If nearby, secure loose items and avoid damaged structures.' : '';
  const res = (base + safety).slice(0, 320);
  return res;
}

export async function generateQuakeSummary(input: QuakeSummaryInput): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!apiKey) {
    // Fallback deterministic summary to keep UX functional without a key
    return `A magnitude ${input.magnitude.toFixed(1)} event occurred near ${input.place} at ${input.timeISO}. Depth was approximately ${input.depthKm.toFixed(1)} km. This brief local summary is shown because no AI key is configured.`;
  }

  const prompt = (
    `You are an assistant for an earthquake map. Generate a short, clean summary.\n` +
    `RULES:\n` +
    `- Output ONLY valid minified JSON: {"summary":"..."}. No extra text.\n` +
    `- 2 sentences max, concise and descriptive.\n` +
    `- Mention likely felt intensity in plain terms (weak/light/moderate/strong) using magnitude+depth heuristics.\n` +
    `- No analysis, no reasoning, no predictions.\n` +
    `- Add a brief safety note only if intensity is moderate or stronger.\n` +
    `EVENT:\n` +
    `magnitude=${input.magnitude}\n` +
    `depth_km=${input.depthKm}\n` +
    `place=${input.place}\n` +
    `time=${input.timeISO}`
  );

  const body = {
    model: 'openai/gpt-oss-20b:free',
    messages: [
      { role: 'system', content: 'Return JSON only. Do not include chain-of-thought. Keep it concise and safety-aware.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 120,
    temperature: 0.2,
  } as const;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  const referer = (import.meta as any).env?.VITE_APP_URL as string | undefined;
  const title = (import.meta as any).env?.VITE_APP_TITLE as string | undefined;
  if (referer) headers['HTTP-Referer'] = referer;
  if (title) headers['X-Title'] = title;

  // 8s timeout to avoid hanging UI
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    return localConciseSummary(input);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const msg = await safeText(res);
   
    return localConciseSummary(input, `OpenRouter error ${res.status}: ${msg || res.statusText}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) return localConciseSummary(input, 'No content returned from AI');

  const cleaned = content.trim();
  const parsed = tryParseSummaryJSON(cleaned);
  if (parsed) return sanitizeSummary(parsed);
  const maybe = extractJsonObject(cleaned);
  if (maybe) {
    const p2 = tryParseSummaryJSON(maybe);
    if (p2) return sanitizeSummary(p2);
  }
  return limitToTwoSentences(cleaned);
}

async function safeText(r: Response) {
  try { return await r.text(); } catch { return ''; }
}

function tryParseSummaryJSON(s: string): string | null {
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj.summary === 'string') return obj.summary;
    return null;
  } catch { return null; }
}

function extractJsonObject(s: string): string | null {
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return s.slice(start, end + 1);
  return null;
}

function sanitizeSummary(text: string): string {
  let t = text.replace(/^\s*(analysis|explanation)\s*:?\s*/i, '');
  t = t.replace(/`+/g, '').trim();
  return limitToTwoSentences(t);
}

function limitToTwoSentences(text: string): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');
  return sentences.length > 0 ? sentences.slice(0, 320) : text.slice(0, 320);
}
