// Tolerant JSON extraction for LLM responses. Models sometimes wrap output in
// ```json fences or add stray prose before/after the object — this pulls out
// the JSON object and parses it. Shared by every coach.ts call that expects
// structured output.
export function parseJsonish<T>(text: string): T {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1];
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s) as T;
}
