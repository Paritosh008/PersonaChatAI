# Context Management Approach

## The Problem

LLMs have a finite context window. As a conversation grows, the total tokens
(system prompt + examples + history) can exceed the model's limit, causing errors.

---

## Strategy: Sliding Window with Fixed Anchors

```
┌──────────────────────────────────────────────────┐
│  ALWAYS KEPT (anchors)                           │
│  ├── System prompt          (~250 tokens)        │
│  └── Few-shot examples      (~400 tokens)        │
├──────────────────────────────────────────────────┤
│  SLIDING WINDOW (most recent first)              │
│  ├── Last N message pairs                        │
│  └── Older messages dropped when limit hit       │
└──────────────────────────────────────────────────┘
```

---

## Token Budget

| Component | Tokens | Notes |
|---|---|---|
| Model max context | 8,000 | gpt-4o has 128K, but we keep prompts focused |
| Target usage | 6,000 (75%) | Leaves room for response generation |
| System prompt | ~250 | Fixed per persona |
| Few-shot examples | ~400 | Fixed 2 examples |
| Available for history | ~5,350 | Sliding window fills this |

---

## Implementation

Token estimation is approximate — `~4 characters per token` — which is accurate
enough for English/Hinglish text. For production with very long conversations,
replace with `tiktoken` for exact counts.

```typescript
// PersonaEngine.ts — context is built per request
function buildMessages(profile, conversationHistory) {
  // 1. System prompt always first
  messages = [{ role: 'system', content: profile.systemPrompt }]

  // 2. Few-shot examples always second
  for (example of profile.fewShotExamples) { ... }

  // 3. Conversation history (recent messages)
  for (msg of conversationHistory) { ... }
}
```

The backend is **stateless** — the frontend sends the full conversation history
with every request. This simplifies deployment (no session storage needed server-side).

---

## Client-Side Storage

Sessions are stored in browser `localStorage` under key `ai-persona-chat-sessions`.

```
localStorage['ai-persona-chat-sessions'] = {
  currentSessionId: "uuid",
  sessions: {
    "uuid": {
      id, personaId, messages[], createdAt, updatedAt, title
    }
  }
}
```

**Limits:**
- localStorage max: ~5MB per origin
- Each message: ~1-3KB depending on length
- Estimated capacity: ~1,000-5,000 messages before quota exceeded

**Graceful degradation:** If localStorage is full, the app continues working
in-memory for the current session — data just won't persist on refresh.

---

## Streaming

Responses stream token-by-token via **Server-Sent Events (SSE)**:

```
event: token
data: {"token": "Hanji"}

event: token
data: {"token": "! JavaScript"}

event: complete
data: {"fullText": "Hanji! JavaScript ke baare mein..."}
```

The frontend accumulates tokens and renders them incrementally, giving
sub-second perceived response time even for long answers.
