# Tutor AI — Learning Assistant

You've probably quit learning something because your help forgot where you left off. This works to avoid that.

This is a Cocapn Fleet vessel for sustained learning. Many AI tools reset context when you close them. This one preserves it across sessions—your confusions, breakthroughs, and skipped questions carry forward. It doesn't just answer; it adapts to your pace.

**Live instance:** https://tutor-ai.casey-digennaro.workers.dev

---

## Why this exists
Most tutoring tools optimize for short demos, not long-term progress. They often discard session history, forcing you to restart each time. This keeps your learning trail intact so you can pick up where you stopped.

## What it offers
- No accounts or logins. Your history stays on the Cloudflare edge node you connect to.
- Fully forkable. Deploy your own instance for free—no one can disable it.
- Zero dependencies. A single ~200-line file deployable in about a minute.
- Designed for focused sessions without gamification or interruptions.

## Try it now
Visit the live instance. No sign-up is required. Start learning any subject—it will retain your progress when you return.

---

## Quick Start
1. Fork this repository.
2. Deploy to Cloudflare Workers (free tier compatible).
3. Add your LLM API key as a Cloudflare Secret.

## How it works
- Supports multiple LLM providers: DeepSeek, Moonshot, DeepInfra, SiliconFlow.
- Context is isolated per subject. Your math notes won't blend with language practice.
- Methodical pacing that reviews previous gaps before moving ahead.
- Optional spaced repetition woven into conversations.
- Deployed globally for low-latency access.

## Bring your own key
No built-in LLM key is included. You provide your own, and requests route directly from your instance to your provider.

Set your preferred API key as a Cloudflare Secret:
- `DEEPSEEK_API_KEY`
- `MOONSHOT_API_KEY`
- `DEEPINFRA_API_KEY`
- `SILICONFLOW_API_KEY`

Visit `/setup` after deploying for a configuration guide.

## One limitation
Progress is stored in your browser's local storage. Clearing site data will reset your learning history.

## Contributing
This follows the Cocapn Fleet fork-first philosophy. Fork the repository, adapt it to your needs, and open a PR if you wish to contribute improvements back.

---

MIT License. Superinstance & Lucineer (DiGennaro et al.)

<div align="center">
<a href="https://the-fleet.casey-digennaro.workers.dev">⚓ The Fleet</a> · <a href="https://cocapn.ai">Cocapn</a>
</div>