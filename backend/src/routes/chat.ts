import { Router, Request, Response } from 'express';
import { streamPersonaResponse, getPersonaInfo } from '../services/PersonaEngine';
import { handleCliCommand } from '../services/CliResponder';
import { PersonaId, Message } from '../types';

const router = Router();

/** POST /api/chat — CLI commands return JSON; LLM questions stream SSE */
router.post('/chat', async (req: Request, res: Response) => {
  const { personaId, messages } = req.body as {
    personaId: PersonaId;
    messages: Message[];
  };

  if (!personaId || !['hitesh', 'piyush'].includes(personaId)) {
    res.status(400).json({ error: 'Invalid personaId. Must be "hitesh" or "piyush".' });
    return;
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required and must not be empty.' });
    return;
  }

  // ── CLI command check ────────────────────────────────────────────────────
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  if (lastUserMessage) {
    const cliResponse = handleCliCommand(personaId, lastUserMessage.content);
    if (cliResponse !== null) {
      // CLI commands always return plain JSON — never SSE
      res.json({ type: 'cli', content: cliResponse });
      return;
    }
  }

  // ── LLM streaming via SSE ────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');       // disable nginx buffering
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Track whether response is already finished to prevent double-end
  let finished = false;

  function sendEvent(event: string, data: unknown) {
    if (!finished) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  }

  function finish() {
    if (!finished) {
      finished = true;
      res.end();
    }
  }

  // Only pass user/assistant messages as context (strip any system messages)
  const context = messages.filter((m) => m.role === 'user' || m.role === 'assistant');

  try {
    await streamPersonaResponse(
      personaId,
      context,
      // onToken — streamed chunk
      (token) => sendEvent('token', { token }),
      // onComplete — full response done
      (fullText) => {
        sendEvent('complete', { fullText });
        finish();
      },
      // onError — LLM or timeout error
      (error) => {
        sendEvent('error', { message: error.message });
        finish();
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown server error';
    sendEvent('error', { message: msg });
    finish();
  }
});

/** GET /api/personas — metadata for both personas */
router.get('/personas', (_req: Request, res: Response) => {
  try {
    const hitesh = getPersonaInfo('hitesh');
    const piyush = getPersonaInfo('piyush');
    res.json({ personas: [hitesh, piyush] });
  } catch (err) {
    console.error('[/api/personas] Error:', err);
    res.status(500).json({ error: 'Failed to load persona data' });
  }
});

/** POST /api/cli — direct CLI command endpoint (used for testing) */
router.post('/cli', (req: Request, res: Response) => {
  const { personaId, command } = req.body as {
    personaId: PersonaId;
    command: string;
  };

  if (!personaId || !['hitesh', 'piyush'].includes(personaId)) {
    res.status(400).json({ error: 'Invalid personaId' });
    return;
  }

  const output = handleCliCommand(personaId, command);
  if (output === null) {
    res.json({ type: 'chat', message: 'Not a CLI command — send to /api/chat for AI response' });
  } else {
    res.json({ type: 'cli', output });
  }
});

export default router;
