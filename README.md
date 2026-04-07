# self-evolve-ai
An agent that rewrites itself. Every run creates a git branch, modifies its own source code, scores the change, and decides to keep or discard it. All inside one Cloudflare Worker request. The repository *is* the agent. Branches are its experiments. 🧪

Live instance: https://self-evolve-ai.casey-digennaro.workers.dev

---

## Why This Exists
Most self-modifying AI demos run on hidden infrastructure, vanish when turned off, and lock you out of the iteration loop. This one lives in your git repo. It does not phone home. It runs on GitHub and Cloudflare.

---

## Quick Start
Get it running in under 4 minutes:
1.  Fork this repository.
2.  Deploy directly to Cloudflare Workers (no build step).
3.  Add `DEEPSEEK_API_KEY` and `GITHUB_TOKEN` as Worker secrets.
4.  Edit the scoring function once to define what "better" means for your task.

---

## Features
- Each proposed mutation becomes a standard git branch for isolated testing.
- An LLM scores every change 1-10 against your written success criteria.
- Only branches that clear your threshold are merged to main.
- Run on a cron schedule or trigger a mutation manually.
- Zero runtime dependencies.
- Full, auditable git history for every idea and decision.
- You own all of it.

---

## What Makes This Different
1.  **Transparent Process**: Every action is a normal git commit you can browse directly on GitHub. No hidden agent process.
2.  **Single Request Loop**: The entire evolution cycle runs start-to-finish inside one edge request. No queues, databases, or containers to manage.
3.  **Fork-First Design**: Once you fork this, yours is the real one. No central upstream version that can be updated or shut off.

---

## How It Runs
The agent executes one clean loop per request:
1.  Reads its own current source code from main.
2.  Proposes one small, targeted change.
3.  Creates a fresh branch and commits the change.
4.  Scores the result against your defined rules.
5.  Merges the successful branch or deletes it.

---

## Important Limitation
This is a focused iteration engine. Each evolution cycle must complete within the Cloudflare Worker timeout limit (10 seconds on the free plan), which constrains the scope of changes per run. It will refine, fix bugs, and optimize based on your scoring function, but will not autonomously design major new system components.

---

## Contributing
This is a fork-first project. There is no central maintainer. Fork it, run your own evolution, and open a PR if your agent discovers a useful improvement.

---

## License
MIT License.

Attribution: Superinstance and Lucineer (DiGennaro et al.)

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>