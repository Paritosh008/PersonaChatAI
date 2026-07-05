# Prompt Engineering Strategy

## Architecture

Every chat request goes through a three-layer prompt stack:

```
┌─────────────────────────────────────────┐
│  Layer 1: System Prompt                 │  ← Persona identity & rules
│  Layer 2: Few-Shot Examples             │  ← 2-3 real-style Q&A pairs
│  Layer 3: Conversation History          │  ← Actual user messages
└─────────────────────────────────────────┘
```

Built in `PersonaEngine.ts → buildMessages()`.

---

## Layer 1 — System Prompt

The system prompt is the most important part. It defines:

1. **Identity declaration** — "You are Hitesh Choudhary..."
2. **Personality rules** — tone, warmth, directness
3. **Language rules** — Hinglish mixing, characteristic phrases
4. **Teaching rules** — analogies, hands-on emphasis
5. **Hard constraints** — what to avoid (e.g., Piyush never recommends jQuery)

### Hitesh System Prompt Design

```
You are Hitesh Choudhary...
- Mix Hindi and English naturally in every response
- Use chai/food analogies to explain technical concepts
- Celebrate small wins, encourage beginners
- Signature phrases: 'Hanji!', 'Dekho yaar', 'Chai peete peete seekhte hain'
```

**Key design choices:**
- Hinglish is instructed as "natural" not "forced" — the model mixes it organically
- Chai analogy is specifically prompted because it's Hitesh's most distinctive trait
- Encouragement is explicitly required — prevents the model from being neutral

### Piyush System Prompt Design

```
You are Piyush Garg...
- Be direct, energetic, fast-paced
- Focus exclusively on modern tech (Node.js, React, TypeScript, Docker)
- Do NOT recommend outdated technologies like jQuery or PHP
- Signature phrases: 'Let's build this', 'Simple hai', 'This is industry standard'
```

**Key design choices:**
- Explicit prohibition on old tech — prevents the model from giving generic advice
- "Build first" philosophy is stated as a rule, not a suggestion
- Energy and pace are explicitly instructed

---

## Layer 2 — Few-Shot Examples

Two Q&A examples are included per persona. These prime the model by showing:
- The exact vocabulary and code style expected
- How Hinglish is mixed in practice
- How each persona handles the same question differently

**Example: "What is a closure?" asked to both personas**

Hitesh answers with a chai shop analogy and Hinglish.
Piyush answers with a direct counter example and "Let's build this."

This contrast ensures the model doesn't default to a generic answer when
asked the same question for different personas.

---

## Layer 3 — Conversation History

All previous messages in the session are appended after the few-shot examples.
This gives the model full context for follow-up questions.

Token management is handled by `PersonaEngine.ts` — if history grows too long,
older messages are dropped while keeping the system prompt intact.

---

## LLM Parameters

| Parameter | Value | Reason |
|---|---|---|
| `model` | `gpt-4o` | Best instruction-following for persona simulation |
| `temperature` | `0.8` | Enough creativity for natural language, not too random |
| `max_tokens` | `1024` | Long enough for code + explanation |
| `stream` | `true` | Token-by-token streaming for perceived responsiveness |

All values are configurable via `backend/.env`.

---

## Improving Persona Authenticity

To make responses more authentic:

1. **Add more few-shot examples** in `profile.json → fewShotExamples`
   - Target: 5-8 examples covering different topics (JS, career, tools)

2. **Refine the system prompt** with observed phrases
   - Watch 5-10 videos and note exact phrases, analogies, transitions

3. **Lower temperature** (0.6-0.7) if responses feel too generic

4. **Raise temperature** (0.9-1.0) if responses feel too repetitive

5. **Use `gpt-4o`** — cheaper models lose persona consistency faster
