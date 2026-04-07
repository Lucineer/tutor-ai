# Tutor AI — Learning That Remembers 📖

You’ve probably quit learning something because your help forgot where you left off. This exists to stop that.

Most AI tutors reset every time you close the tab. This one carries everything forward: your half-understood concepts, the question you skipped last Tuesday, the pace that works for you. It doesn’t just answer questions. It remembers you.

**Live instance:** https://tutor-ai.casey-digennaro.workers.dev

## Why This Exists
You don’t learn in 15‑minute chat sessions. You stop, get distracted, come back days later. Every other tool acts like you sat down to finish an entire subject in one sitting. This one waits for you.

## What This Does
1.  **You own it.** Fork this repository and deploy your own instance. No one can shut it down, change features, or log what you learn.
2.  **It never wipes context.** There is no hidden token reset or session timeout. Your progress stays as long as you want it.
3.  **Zero magic.** This is ~200 lines of plain, readable code. No hidden prompts, no telemetry, no analytics you can’t remove.

## Quick Start
1.  **Fork** this repository.
2.  **Deploy** to Cloudflare Workers (runs on the free tier).
3.  **Add** your LLM API key as a Cloudflare Secret.

You will have your own private tutor running in about two minutes.

## Features
- No accounts or logins
- All learning state lives only in your browser’s local storage
- Single file, zero runtime dependencies
- Compatible with DeepSeek, Moonshot, DeepInfra, and SiliconFlow APIs
- Full context isolation per subject—math notes never bleed into language practice
- Checks unmastered gaps before introducing new material
- Optional gentle spaced repetition woven into conversation

## Bring Your Own Key
This includes no shared LLM keys. You provide your own, and requests route directly from your instance to your provider. No middleman sees your queries.

Set your preferred API key as a Cloudflare Secret:
- `DEEPSEEK_API_KEY`
- `MOONSHOT_API_KEY`
- `DEEPINFRA_API_KEY`
- `SILICONFLOW_API_KEY`

Visit `/setup` after deploying for step‑by‑step configuration.

## One Honest Limitation
Progress is stored only in your browser’s local storage. If you clear site data or switch devices, your learning history will be lost. There is no server-side backup or sync.

## Contributing
This follows the Cocapn Fleet fork‑first philosophy. Fork the repo, modify it for how you learn, and open a pull request if you build something useful to share.

MIT License

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>