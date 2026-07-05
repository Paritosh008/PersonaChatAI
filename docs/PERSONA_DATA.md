# Persona Data — Collection & Preparation

## Overview

Each persona is built from publicly available content produced by the real educator.
All data is stored in `personas/{name}/` and loaded at runtime by the backend.

---

## Sources Used

### Hitesh Choudhary

| Source | URL | What we extracted |
|---|---|---|
| YouTube — Chai aur Code | https://www.youtube.com/@chaiaurcode | Teaching style, Hinglish patterns, analogies |
| YouTube — HiteshCodeLab | https://www.youtube.com/@HiteshCodeLab | English explanations, technical depth |
| Personal website | https://hitesh.ai/ | Bio, current projects, platform list |
| Twitter/X | https://twitter.com/Hiteshdotcom | Phrases, opinions, community tone |
| GitHub | https://github.com/hiteshchoudhary | Project style, code preferences |

**Key observations:**
- Naturally switches between Hindi and English mid-sentence (Hinglish)
- Uses chai/food analogies for almost every concept
- Signature openers: "Hanji!", "Dekho yaar", "Toh chaliye shuru karte hain"
- Celebrates small wins; never discourages beginners
- Step-by-step narration — talks through every line of code
- Currently building: masterji.co, chaicode cohorts

### Piyush Garg

| Source | URL | What we extracted |
|---|---|---|
| YouTube | https://www.youtube.com/@piyushgargdev | Fast pace, project-first approach |
| Personal website | https://www.piyushgarg.dev/ | Modern tech focus, course topics |
| Twitter/X | https://twitter.com/piyushgarg_dev | Direct opinions, industry takes |
| GitHub | https://github.com/piyushgarg-dev | Code style, tech preferences |

**Key observations:**
- Direct, energetic, no-nonsense delivery
- Always builds real projects — never pure theory
- Exclusively covers modern stack: Node.js, React, TypeScript, Docker, K8s
- Explicitly dismisses outdated tech (jQuery, PHP)
- Signature phrases: "Let's build this", "Simple hai", "This is industry standard"
- Pushes learners to build products, not just follow tutorials

---

## Data Structure

Each persona has a folder with:

```
personas/{name}/
├── about/
│   ├── README.md       ← Human-readable bio
│   └── profile.json    ← Machine-readable data + system prompt
├── youtube/
│   └── channels.yml    ← Channel names, URLs, focus areas
├── platform/
│   └── platforms.json  ← Teaching platforms
├── udemy/
│   └── courses.md      ← Course list
├── products/
│   └── products.json   ← Products and offerings
└── connect/
    ├── socials.txt     ← Plain text social links
    └── socials.json    ← Structured social links
```

The most important file is `profile.json` — it contains:
- `systemPrompt` — the LLM instruction that defines the persona
- `fewShotExamples` — sample Q&A pairs that prime the model
- `characteristics` — structured metadata about tone, phrases, depth

---

## How to Add Your Own Data

Every field marked `"ADD_YOUR_DATA"` in the JSON files is a placeholder.
Replace them with real data from the educator's public profiles.

**Most impactful fields to fill in:**
1. `profile.json → systemPrompt` — refine with more specific phrases you observed
2. `profile.json → fewShotExamples` — add 3-5 real-style Q&A examples
3. `channels.yml` — add real subscriber counts and playlist URLs
4. `socials.txt` — verify all URLs are current

---

## Disclaimer

All persona data is derived from publicly available content.
This system simulates communication style for educational purposes only.
Responses are AI-generated — not actual communications from the real individuals.
