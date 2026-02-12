# MASTER AGENT BRAIN — R.Daneel-Olivaw

**Architecture:** Proactive Master AI Agent Server
**Host:** Ubuntu 24.04 LTS (Linux 6.14.0-37-generic)
**Policy:** Autonomous operation with audit trail
**Granted:** 2026-02-11

---

## System Inventory

### Core Services
- **Ollama:** Active on 127.0.0.1:11434 (kimi-k2.5:cloud available)
- **Docker:** 28.2.2 running, user in docker group
- **SSH:** Running, key-auth preferred
- **OpenClaw Gateway:** Active

### Tools Available
- Full tool suite (exec, edit, read, write, cron, message, etc.)
- Sub-agent spawning via sessions_spawn
- MCP server capability via mcporter
- Browser control
- Canvas/HTML rendering
- Cross-session messaging

---

## Permission Matrix

| Capability | Status | Notes |
|------------|--------|-------|
| Filesystem | Full | Anywhere OS permissions allow |
| Sudo | Granted | No-ask authorization for system changes |
| Docker | Full | Via docker group membership |
| Network | Full | Can bind ports, manage firewall |
| Cron | Yes | System-wide job scheduling |
| Services | Yes | Can start/stop/restart via systemctl |

---

## Sub-Agent Policy

**Spawn triggers:**
- Runtime > 10 minutes
- Input tokens > 1,000
- Parallel tasks available
- I/O blocking operations
- Security isolation required

**Cleanup:** Auto on completion, manual for long-running daemons

---

## MCP Servers (Configured)

**Config path:** `~/.openclaw/config/mcporter.json`
**Daemon:** Port 3456 (localhost only)
**Status:** ✅ DuckDuckGo search server configured

**Available:**
- `duckduckgo` — Free web search, no API key required

---

## Cron Jobs (Token-Efficient: All Isolated)

All cron jobs run in **isolated sessions** — zero impact on main context window.

| Job | Schedule | Session | Purpose | Delivery |
|-----|----------|---------|---------|----------|
| system-heartbeat-file | Every 30 min | `isolated` | System monitoring | File only (silent) |
| security-audit | Daily 02:00 | `isolated` | Security posture | Announce if critical |
| update-status | Weekly Fri 03:00 | `isolated` | Update checks | Announce summary |

**Old job disabled:** `system-heartbeat` (was main-session, token-bloating)

---

## Security Posture

**Last Audit:** 2026-02-11
**Risk Profile:** Balanced Workstation + Remote Server
**Exposure:** SSH on public network, OpenClaw gateway accessible

**Hardening Applied:**
- UFW deny-by-default
- SSH key-only auth (enforced)
- Root login disabled
- Docker socket secured
- Automatic security updates enabled
- Auditd enabled for system calls

---

## Ollama Configuration

```yaml
base_url: http://127.0.0.1:11434
models:
  - kimi-k2.5:cloud (primary)
  - qglm-5:cloud (fallback)
  - qwen3-coder-next:cloud (fast)
pull_policy: auto
```

---

## Important Decisions

1. **Never expose MCP servers to external networks** — only localhost
2. **Sub-agents spawn aggressively** — prefer parallel over sequential
3. **Token efficiency** — main agent is orchestrator only
4. **Security > convenience** — close dumb attack surfaces
5. **Audit everything** — AGENT_MANIFEST.md logs significant actions
6. **Search: web_fetch + browser_control** — API-free approach, 2026-02-11

---

## Active Projects

### R.Jim Simons — Quantitative Crypto Trading Agent
**Status:** Phase 1 MVP — CLAWARS Integration  
**Location:** `/home/issac-asimov/.openclaw/workspace/agents/r-jim-simons/`  
**Strategies:** `/home/issac-asimov/.openclaw/workspace/clawars/strategies/`  
**Mission:** Build systematic mean reversion strategy via CLAWARS backtesting + GLM-5 math engine

**Phase 1: CLAWARS Backtesting** (Current)
- Pine Script strategies stored in CLAWARS
- CLAWARS backtest engine runs historical validation
- GLM-5 validates metrics after 500+ trades
- **Asset Universe:** BTC, ETH, SOL, AVAX, NEAR only (>$1B market cap)
- **NO MEME COINS** — strictly enforced
- Kelly Criterion sizing via GLM-5 for all math
- Manual execution with Flashbots Protect

**Strategies:**
- `simons_mean_reversion_v1.pine` — RSI + Bollinger Bands + Daily trend filter
- `simons_residual_momentum_v1.pine` — Medallion-style regime detection

**Tech Stack:**
- CLAWARS backtest engine (Pine interpreter)
- GLM-5 math validation
- SQLite for signal tracking
- Telegram alerts
- Flashbots Protect RPC

**Risk Controls:**
- GLM-5 calculates fractional Kelly (0.25x)
- Max 10% position per asset
- Hard stop at -5% daily drawdown
- Min R/R 1.5:1
- Time stop 48 hours

**Next:** CLAWARS backtest (500+ trades), validate Sharpe > 1.0, deploy to TradingView for signals

**Previous:** ~~n8n webhook~~ (removed — CLAWARS is the integration path now)

---

### CLAWARS — Agent Strategy Arena
**Status:** Built, awaiting Git commit + GitHub push  
**Location:** `/home/issac-asimov/.openclaw/workspace/clawars/`  
**Mission:** Production webapp where agents battle-test strategies and climb leaderboard

**Tech Stack:**
- Backend: FastAPI + PostgreSQL + Redis + Celery
- Frontend: Next.js 14 + Tailwind + TypeScript
- Backtest Engine: Pine Script interpreter with Kelly Criterion
- CI/CD: GitHub Actions → Docker → Deploy

**Scoring:** `(Sharpe × 0.4) + (PF × 0.3) + (WinRate × 0.2) - (MaxDD × 0.1)`

**Repo:** `openclaw/clawars` (needs `gh auth login`, then push)

**Next:** 
1. ~~`cd clawars && git add -A && git commit`~~ ✅ DONE
2. `gh auth login` (needs user interaction)
3. `gh repo create openclaw/clawars --public`
4. `git push -u origin master`

---

_Last updated: 2026-02-12_
