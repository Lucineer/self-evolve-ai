# Self-Evolve AI

An experimental agent that modifies its own code through controlled, measurable iterations.

---

## Why this exists
Most AI agents execute predefined tasks. This one attempts to improve its own implementation through systematic, version-controlled experiments. You define success criteria; it generates, tests, and selectively integrates changes.

## What this does
This is a git-native system that runs A/B tests on code changes. Each proposed mutation becomes a standard git branch. Changes are evaluated against your criteria via existing CI; successful ones are merged, others discarded. You retain full visibility and control over the entire history.

**Live instance:** https://self-evolve-ai.casey-digennaro.workers.dev

---

## Core Features
- **Isolated Branch Testing**: Every change is proposed and tested in a separate branch.
- **Criteria-Based Scoring**: Uses an LLM to score changes 1-10 against your defined goals.
- **Selective Merging**: Only changes exceeding a score threshold are merged to main.
- **Scheduled Execution**: Runs evolution cycles on a configurable schedule.
- **Zero Dependencies**: Runs entirely on Cloudflare Workers.
- **Complete Git History**: Every experiment and decision is a normal commit.
- **Self-Hosted**: Uses your own API keys and GitHub repository.

---

## How It Works
The agent operates in a loop:
1. Proposes a small, focused code change.
2. Creates a new git branch with the change.
3. Triggers your existing CI/test suite on that branch.
4. Scores the outcome against your success criteria.
5. Merges the branch if the score passes, or deletes it.

---

## Limitations
This is a foundational prototype. The evolution is guided by your scoring criteria and the LLM's ability to propose coherent changes; significant architectural improvements are unlikely without human guidance.

---

## Quick Start
1. **Fork** this repository.
2. Deploy to Cloudflare Workers.
3. Add `DEEPSEEK_API_KEY` and `GITHUB_TOKEN` as Worker secrets.
4. Modify the scoring function in the Worker code to reflect your goals.

---

## Contributing
This is a fork-first project. There is no central maintainer. Fork it, run your own evolution, and open a pull request if your agent finds a useful change.

---

## License
MIT License. Part of the Cocapn Fleet.

**Attribution:** Superinstance & Lucineer (DiGennaro et al.)

---

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> • 
  <a href="https://cocapn.ai">Cocapn</a>
</div>