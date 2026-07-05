/**
 * PersonaEngine
 *
 * Loads persona profiles from disk (cached in memory after first load)
 * and streams LLM responses via OpenAI Server-Sent Events.
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { PersonaId, PersonaProfile, Message } from '../types';

// ── Path resolution ────────────────────────────────────────────────────────
// src/services → src → backend → ai-persona-chat → personas
const PERSONAS_DIR = path.join(__dirname, '..', '..', '..', 'personas');

const FOLDER_MAP: Record<PersonaId, string> = {
  hitesh: 'hitesh-choudhary',
  piyush: 'piyush-garg',
};

// ── OpenAI client (lazy — created on first use after dotenv loads) ─────────
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Open backend/.env and add your key.'
      );
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

// ── Profile cache — avoids repeated disk reads ────────────────────────────
const profileCache = new Map<PersonaId, PersonaProfile>();

function loadPersonaProfile(personaId: PersonaId): PersonaProfile {
  if (profileCache.has(personaId)) {
    return profileCache.get(personaId)!;
  }

  const profilePath = path.join(
    PERSONAS_DIR,
    FOLDER_MAP[personaId],
    'about',
    'profile.json'
  );

  if (!fs.existsSync(profilePath)) {
    throw new Error(
      `Persona profile not found: ${profilePath}\n` +
      `Make sure personas/${FOLDER_MAP[personaId]}/about/profile.json exists.`
    );
  }

  const raw = fs.readFileSync(profilePath, 'utf-8');

  let parsed: PersonaProfile;
  try {
    parsed = JSON.parse(raw) as PersonaProfile;
  } catch (err) {
    throw new Error(
      `Invalid JSON in persona profile for "${personaId}": ${(err as Error).message}`
    );
  }

  if (!parsed.systemPrompt) {
    throw new Error(
      `persona profile for "${personaId}" is missing required field: systemPrompt`
    );
  }

  profileCache.set(personaId, parsed);
  return parsed;
}

// ── Message builder ────────────────────────────────────────────────────────

function buildMessages(
  profile: PersonaProfile,
  conversationHistory: Message[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: profile.systemPrompt },
  ];

  // Few-shot examples prime the model with authentic style
  if (profile.fewShotExamples) {
    for (const example of profile.fewShotExamples) {
      messages.push({ role: 'user', content: example.user });
      messages.push({ role: 'assistant', content: example.assistant });
    }
  }

  // Actual conversation (user + assistant only — no injected system messages)
  for (const msg of conversationHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  return messages;
}

// ── Streaming response ────────────────────────────────────────────────────

export async function streamPersonaResponse(
  personaId: PersonaId,
  conversationHistory: Message[],
  onToken: (token: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  const profile = loadPersonaProfile(personaId);
  const messages = buildMessages(profile, conversationHistory);

  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const maxTokens = Math.min(
    parseInt(process.env.OPENAI_MAX_TOKENS || '1024'),
    4096
  );
  const temperature = Math.min(
    Math.max(parseFloat(process.env.OPENAI_TEMPERATURE || '0.8'), 0),
    2
  );
  const timeoutMs = parseInt(process.env.STREAM_TIMEOUT_MS || '30000');

  let fullText = '';
  let timedOut = false;

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    onError(new Error('Response took too long. Please try again.'));
  }, timeoutMs);

  try {
    const stream = await getOpenAI().chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      if (timedOut) break;   // stop processing if already timed out
      const token = chunk.choices[0]?.delta?.content ?? '';
      if (token) {
        fullText += token;
        onToken(token);
      }
    }

    if (!timedOut) {
      clearTimeout(timeoutHandle);
      onComplete(fullText);
    }
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (!timedOut) {
      // Map OpenAI API errors to user-friendly messages
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('401') || message.includes('Incorrect API key')) {
        onError(new Error('Invalid OpenAI API key. Check your backend/.env file.'));
      } else if (message.includes('429') || message.includes('rate limit')) {
        onError(new Error('OpenAI rate limit reached. Please wait a moment and try again.'));
      } else if (message.includes('503') || message.includes('overloaded')) {
        onError(new Error('OpenAI service is temporarily overloaded. Please try again shortly.'));
      } else {
        onError(new Error(`AI error: ${message}`));
      }
    }
  }
}

// ── Persona metadata ──────────────────────────────────────────────────────

export function getPersonaInfo(personaId: PersonaId) {
  const profile = loadPersonaProfile(personaId);
  return {
    id: personaId,
    name: profile.name,
    title: profile.title ?? '',
    website: profile.website ?? '',
    bio: profile.bio ?? '',
    expertise: profile.expertise ?? [],
    tone: profile.persona?.tone ?? '',
    signaturePhrases: profile.persona?.signaturePhrases ?? [],
  };
}

/** Clear profile cache — useful in development/testing */
export function clearProfileCache(): void {
  profileCache.clear();
  _openai = null;
}
