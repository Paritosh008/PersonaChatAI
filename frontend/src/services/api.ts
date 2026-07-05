import { PersonaId } from '../types';

const API_BASE = 'http://localhost:3001';

/**
 * Send a message to the backend.
 * - If the response is JSON  → CLI command output  → calls onCliResponse
 * - If the response is SSE   → LLM streaming       → calls onToken / onComplete
 * Returns a cancel function.
 */
export function streamChat(
  personaId: PersonaId,
  messages: { role: 'user' | 'assistant'; content: string }[],
  onToken: (token: string) => void,
  onComplete: (fullText: string) => void,
  onCliResponse: (output: string) => void,
  onError: (msg: string) => void
): () => void {
  let aborted = false;

  (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId, messages }),
      });

      if (!response.ok) {
        let errMsg = `Server error ${response.status}`;
        try {
          const body = await response.json() as { error?: string };
          if (body.error) errMsg = body.error;
        } catch { /* ignore */ }
        onError(errMsg);
        return;
      }

      const contentType = response.headers.get('content-type') || '';

      // ── CLI command: plain JSON response ──────────────────────────────
      if (contentType.includes('application/json')) {
        const data = await response.json() as { type: string; content?: string; output?: string };
        const text = data.content ?? data.output ?? '';
        onCliResponse(text);
        return;
      }

      // ── LLM response: SSE stream ──────────────────────────────────────
      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body from server');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let fullAccumulated = '';

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';   // keep incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed === '') {
            // blank line = end of SSE event block; reset event type
            currentEvent = '';
            continue;
          }

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

              // token event
              if (currentEvent === 'token' || 'token' in parsed) {
                const token = parsed.token as string;
                fullAccumulated += token;
                onToken(token);
              }
              // complete event
              else if (currentEvent === 'complete' || 'fullText' in parsed) {
                const fullText = (parsed.fullText as string) ?? fullAccumulated;
                onComplete(fullText);
              }
              // error event
              else if (currentEvent === 'error' || 'message' in parsed) {
                onError(parsed.message as string);
              }
            } catch {
              // ignore malformed JSON chunks
            }
          }
        }
      }

      // Stream ended without a complete event — use accumulated tokens
      if (aborted && fullAccumulated) {
        onComplete(fullAccumulated);
      }
    } catch (err) {
      if (!aborted) {
        onError(err instanceof Error ? err.message : 'Network error — is the backend running?');
      }
    }
  })();

  return () => {
    aborted = true;
  };
}

export interface PersonaInfo {
  id: PersonaId;
  name: string;
  title: string;
  website: string;
  bio: string;
}

export async function fetchPersonas(): Promise<PersonaInfo[]> {
  const res = await fetch(`${API_BASE}/api/personas`);
  const data = await res.json() as { personas: PersonaInfo[] };
  return data.personas;
}
