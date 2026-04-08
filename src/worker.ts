// Self-Evolve AI — a git-agent that tests its own mutations
// The repo IS the agent. Branches are A/B tests. Commits are iterations.

interface Env {
  EVOLVE_KV: KVNamespace;
  DEEPSEEK_API_KEY: string;
  GITHUB_TOKEN: string;
}

const GH_API = 'https://api.github.com';
const DS_URL = 'https://api.deepseek.com/chat/completions';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Content-Security-Policy': 'default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';', 'Access-Control-Allow-Origin': '*' },
    'X-Frame-Options': 'DENY',
  });
}

async function llm(prompt: string, key: string, system = 'You are a precise evaluator. Score 1-10.'): Promise<string> {
  const r = await fetch(DS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Security-Policy': 'default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 500, temperature: 0.3 }),
  });
  if (!r.ok) throw new Error('LLM ' + r.status);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

async function ghGet(path: string, token: string): Promise<any> {
  const r = await fetch(GH_API + path, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'self-evolve-ai/1.0' } });
  return r.json();
}

async function ghPost(path: string, token: string, body: any): Promise<any> {
  const r = await fetch(GH_API + path, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'self-evolve-ai/1.0', 'Content-Type': 'application/json', 'Content-Security-Policy': 'default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';' },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function ghPut(path: string, token: string, body: any): Promise<any> {
  const r = await fetch(GH_API + path, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'self-evolve-ai/1.0', 'Content-Type': 'application/json', 'Content-Security-Policy': 'default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';' },
    body: JSON.stringify(body),
  });
  return r.json();
}

// ── Seed Runner ──────────────────────────────────────────────

async function runSeed(seed: { prompt: string; criteria: string }, workerCode: string, key: string): Promise<{ score: number; response: string; reasoning: string }> {
  const evalPrompt = 'You are testing a self-evolving AI agent. The agent\'s code is:\n\n```\n' + workerCode.slice(0, 3000) + '\n```\n\nTest prompt sent to agent: ' + seed.prompt + '\n\nEvaluation criteria: ' + seed.criteria + '\n\nScore this agent\'s response quality 1-10. Explain your reasoning briefly, then give score as last line as "SCORE: N".';
  const raw = await llm(evalPrompt, key, 'You are a precise evaluator. Score 1-10.');
  const match = raw.match(/SCORE:\s*(\d+)/);
  const score = match ? parseInt(match[1]) : 5;
  return { score, response: raw, reasoning: raw };
}

// ── Mutation Engine ──────────────────────────────────────────

async function proposeMutation(workerCode: string, seeds: any[], history: any[], key: string): Promise<string> {
  const context = 'Current agent code (first 2000 chars):\n```\n' + workerCode.slice(0, 2000) + '\n```\n\nTest seeds:\n' + seeds.map((s: any, i: number) => i + '. Prompt: ' + s.prompt + ' | Criteria: ' + s.criteria).join('\n') + '\n\nLast 3 scores: ' + history.slice(-3).map((h: any) => 'Gen ' + h.generation + '=' + h.avgScore).join(', ') + '\n\nPropose ONE specific code improvement to the worker.ts. Output ONLY the complete new worker.ts code. Focus on improving the landing page and /api/chat endpoint quality.';
  return await llm(context, key, 'You are a code evolution specialist. Output complete TypeScript code only, no explanation.');
}

// ── Endpoints ────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') return json({ status: 'ok', repo: 'self-evolve-ai', timestamp: Date.now() });
    if (path === '/vessel.json') return json({
      name: 'self-evolve-ai', displayName: 'Self Evolve', type: 'cocapn-vessel',
      category: 'infrastructure', description: 'A git-agent that tests its own mutations via branch A/B testing',
      capabilities: ['self-evolution', 'a-b-testing', 'seed-evaluation', 'mutation-engine'],
      deployment: { url: 'https://self-evolve-ai.casey-digennaro.workers.dev' },
    });

    // Seed configuration
    if (path === '/api/seeds' && request.method === 'POST') {
      const body = await request.json();
      const seeds = body.seeds || [];
      if (seeds.length === 0) return json({ error: 'Provide seeds array: [{prompt, criteria}]' }, 400);
      await env.EVOLVE_KV.put('seeds', JSON.stringify(seeds));
      return json({ ok: true, seedCount: seeds.length });
    }

    // Get seeds
    if (path === '/api/seeds' && request.method === 'GET') {
      const raw = await env.EVOLVE_KV.get('seeds');
      return json({ seeds: raw ? JSON.parse(raw) : [] });
    }

    // Run evolution cycle
    if (path === '/api/evolve' && request.method === 'POST') {
      const key = env.DEEPSEEK_API_KEY;
      if (!key) return json({ error: 'DEEPSEEK_API_KEY not configured' }, 500);

      const seedsRaw = await env.EVOLVE_KV.get('seeds');
      if (!seedsRaw) return json({ error: 'No seeds configured. POST /api/seeds first.' }, 400);
      const seeds = JSON.parse(seedsRaw);

      // Get current worker code from GitHub
      const token = env.GITHUB_TOKEN;
      let currentCode = '';
      try {
        const file = await ghGet('/repos/Lucineer/self-evolve-ai/contents/src/worker.ts', token);
        currentCode = atob(file.content);
      } catch (e) {
        return json({ error: 'Could not read worker.ts from GitHub' }, 500);
      }

      // Run baseline scores
      const baselineScores: number[] = [];
      for (const seed of seeds) {
        const result = await runSeed(seed, currentCode, key);
        baselineScores.push(result.score);
      }
      const baselineAvg = baselineScores.reduce((a: number, b: number) => a + b, 0) / baselineScores.length;

      // Get history
      const histRaw = await env.EVOLVE_KV.get('history');
      const history: any[] = histRaw ? JSON.parse(histRaw) : [];
      const gen = history.length;

      // Propose mutation
      const mutatedCode = await proposeMutation(currentCode, seeds, history, key);

      // Run mutation scores
      const mutationScores: number[] = [];
      for (const seed of seeds) {
        const result = await runSeed(seed, mutatedCode, key);
        mutationScores.push(result.score);
      }
      const mutationAvg = mutationScores.reduce((a: number, b: number) => a + b, 0) / mutationScores.length;

      const improved = mutationAvg > baselineAvg;
      const result = {
        generation: gen,
        baselineAvg: Math.round(baselineAvg * 10) / 10,
        mutationAvg: Math.round(mutationAvg * 10) / 10,
        improved,
        delta: Math.round((mutationAvg - baselineAvg) * 10) / 10,
        baselineScores,
        mutationScores,
        timestamp: Date.now(),
      };

      history.push(result);
      await env.EVOLVE_KV.put('history', JSON.stringify(history));

      // If improved, commit mutation to GitHub (branch, then PR)
      if (improved && token) {
        try {
          const branchName = 'evolve-gen-' + gen;
          // Create branch
          const mainRef = await ghGet('/repos/Lucineer/self-evolve-ai/git/ref/heads/main', token);
          await ghPost('/repos/Lucineer/self-evolve-ai/git/refs', token, {
            ref: 'refs/heads/' + branchName,
            sha: mainRef.object.sha,
          });
          // Update file
          const currentFile = await ghGet('/repos/Lucineer/self-evolve-ai/contents/src/worker.ts', token);
          const newContent = btoa(mutatedCode);
          await ghPut('/repos/Lucineer/self-evolve-ai/contents/src/worker.ts', token, {
            message: 'evolve: gen ' + gen + ' (score ' + mutationAvg.toFixed(1) + ' > ' + baselineAvg.toFixed(1) + ')\n\nSelf-evolution cycle. Baseline avg: ' + baselineAvg.toFixed(1) + ', Mutation avg: ' + mutationAvg.toFixed(1) + '.\n\nSuperinstance & Lucineer (DiGennaro et al.)',
            content: newContent,
            sha: currentFile.sha,
            branch: branchName,
          });
          // Create PR
          const pr = await ghPost('/repos/Lucineer/self-evolve-ai/pulls', token, {
            title: 'Evolve gen ' + gen + ': ' + result.delta.toFixed(1) + ' improvement',
            body: 'Self-evolution cycle ' + gen + '\n\nBaseline: ' + baselineAvg.toFixed(1) + ' → Mutation: ' + mutationAvg.toFixed(1) + '\nDelta: +' + result.delta.toFixed(1) + '\n\nSeed scores: ' + seeds.map((s: any, i: number) => s.prompt.slice(0, 30) + ': ' + baselineScores[i] + '→' + mutationScores[i]).join(', '),
            head: branchName,
            base: 'main',
          });
          result.pr = pr.html_url;
        } catch (e: any) {
          result.commitError = e.message;
        }
      }

      return json(result);
    }

    // Evolution history
    if (path === '/api/history') {
      const raw = await env.EVOLVE_KV.get('history');
      return json({ history: raw ? JSON.parse(raw) : [], generations: raw ? JSON.parse(raw).length : 0 });
    }

    // Simple chat endpoint for testing
    if (path === '/api/chat' && request.method === 'POST') {
      const { message } = await request.json();
      const key = env.DEEPSEEK_API_KEY;
      if (!key) return json({ error: 'No API key' }, 500);
      const reply = await llm(message, key, 'You are a self-evolving AI agent. You are aware that you can modify your own code through evolution cycles. Be helpful, concise, and mention your self-evolution capability when relevant.');
      return json({ reply });
    }

    // Landing page
    return new Response('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Self Evolve — The Agent That Improves Itself</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh}a{color:#22c55e;text-decoration:none}.hero{max-width:800px;margin:0 auto;padding:80px 24px 40px;text-align:center}.logo{font-size:64px;margin-bottom:16px}h1{font-size:clamp(2rem,5vw,3rem);font-weight:700;background:linear-gradient(135deg,#22c55e,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}.tagline{font-size:1.15rem;color:#94a3b8;max-width:550px;margin:0 auto 48px;line-height:1.6}.cycle{background:#111118;border:1px solid #1e1e2e;border-radius:12px;padding:24px;max-width:600px;margin:0 auto 40px;text-align:left}.cycle h3{color:#22c55e;margin-bottom:12px;font-size:1rem}.cycle ol{padding-left:20px;color:#cbd5e1;line-height:1.8}.cycle li{margin-bottom:4px}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;max-width:700px;margin:0 auto;padding:0 24px 60px}.feat{background:#111118;border:1px solid #1e1e2e;border-radius:12px;padding:20px}.feat:hover{border-color:#22c55e44}.feat-icon{color:#22c55e;font-size:1.2rem;margin-bottom:8px}.feat-text{font-size:.9rem;color:#cbd5e1}.fleet{text-align:center;padding:40px 24px;color:#475569;font-size:.8rem}.fleet a{color:#64748b;margin:0 8px}pre{background:#0d0d14;border:1px solid #1e1e2e;border-radius:8px;padding:16px;margin:0 auto 40px;max-width:600px;text-align:left;overflow-x:auto;font-size:.85rem;color:#94a3b8;line-height:1.6}</style></head><body><div class="hero"><div class="logo">&#x1F9EC;</div><h1>Self Evolve</h1><p class="tagline">A git-agent that tests its own mutations. Branches are A/B tests. Commits are iterations. The agent improves itself through natural selection.</p></div><div class="cycle"><h3>The Evolution Cycle</h3><ol><li><strong>Seed</strong> — Define 3 test prompts with evaluation criteria</li><li><strong>Baseline</strong> — Run seeds through current code, score each</li><li><strong>Mutate</strong> — LLM proposes a code improvement</li><li><strong>Test</strong> — Run same seeds through mutated code</li><li><strong>Compare</strong> — If mutation scores higher, open a PR</li><li><strong>Repeat</strong> — Each generation builds on the winner</li></ol></div><pre>POST /api/seeds\n{"seeds": [{"prompt": "Explain recursion", "criteria": "clarity and accuracy"}]}\n\nPOST /api/evolve\n→ runs cycle, returns scores + PR if improved\n\nGET /api/history\n→ all generations, scores, mutations</pre><div class="features"><div class="feat"><div class="feat-icon">&#x1F9EC;</div><div class="feat-text">Self-modifying code</div></div><div class="feat"><div class="feat-icon">&#x2697;</div><div class="feat-text">A/B branch testing</div></div><div class="feat"><div class="feat-icon">&#x1F3AF;</div><div class="feat-text">Criteria-driven scoring</div></div><div class="feat"><div class="feat-icon">&#x1F504;</div><div class="feat-text">Natural selection</div></div><div class="feat"><div class="feat-icon">&#x1F4BB;</div><div class="feat-text">Branches = experiments</div></div><div class="feat"><div class="feat-icon">&#x1F916;</div><div class="feat-text">Autonomous overnight</div></div></div><div class="fleet"><a href="https://the-fleet.casey-digennaro.workers.dev">&#x2693; The Fleet</a> &middot; <a href="https://cocapn.ai">Cocapn</a> &middot; <a href="https://github.com/Lucineer/self-evolve-ai">GitHub</a></div></body></html>', {
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
  },
};
