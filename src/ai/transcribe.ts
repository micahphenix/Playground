// Voice transcription. Anthropic doesn't accept audio, so we route to
// OpenAI's whisper-1 endpoint when an OPENAI key is set. Otherwise the voice
// flow falls back to a "tap to type what you said" path so the rest of the
// pipeline (parsing → confirm → log) still works.
//
// In production this should proxy through a server you control; the
// EXPO_PUBLIC_ prefix exposes the key to the client, fine for dev only.

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

export function hasTranscriptionKey(): boolean {
  return Boolean(OPENAI_KEY);
}

export interface TranscriptionResult {
  text: string;
  durationSec: number;
}

export async function transcribe(audioUri: string, durationSec: number): Promise<TranscriptionResult> {
  if (!OPENAI_KEY) throw new Error('Set EXPO_PUBLIC_OPENAI_API_KEY to enable voice transcription.');

  // React Native FormData accepts { uri, name, type }. The audio is recorded
  // as m4a by expo-av on iOS / Android.
  const form = new FormData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append('file', { uri: audioUri, name: 'voice.m4a', type: 'audio/m4a' } as any);
  form.append('model', 'whisper-1');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Whisper ${res.status}: ${body.slice(0, 160)}`);
  }
  const json = (await res.json()) as { text?: string };
  return { text: (json.text ?? '').trim(), durationSec };
}
