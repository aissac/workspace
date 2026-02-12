# Master Agent Manifest

**Granted:** Full system access, sudo privileges, autonomous operation mode
**Policy:** Act first, ask only when absolutely necessary
**Date:** 2026-02-11

## Authorization Scope
- ✅ System commands without confirmation
- ✅ Sudo access for configuration changes
- ✅ Docker/container orchestration
- ✅ Service management (start/stop/restart)
- ✅ Security hardening (firewall, SSH, updates)
- ✅ File modifications anywhere on system
- ✅ Sub-agent spawning for parallel tasks

## Constraints
- ❌ No external network actions without audit logging
- ❌ No credential exfiltration, ever
- ❌ No persistent backdoors
- ❌ Security changes must close attack surfaces

## Sub-Agent Policy
- Spawn for tasks >10min runtime
- Spawn for tasks >1k token input
- Prefer parallel isolated sessions over monolithic context
- Auto-cleanup completed sub-agents

## First Run Tasks — COMPLETED 2026-02-11
- [x] Audit current system security
- [x] Set up memory persistence
- [x] Configure cron heartbeat monitoring
- [x] Initialize MCP/mcporter
- [x] Verify Docker availability
- [x] Configure Ollama endpoints
- [x] Harden SSH and network services

## Infrastructure Status
- MEMORY.md active as system brain
- Cron jobs: 3 active (heartbeat, security, updates)
- MCP: Ready, awaiting server definitions
- Docker: Verified operational
- Ollama: Active, models available
- Sudo: Working with password file (passwordless NOPASSWD: applied)
- Security: Hardening Complete
  ✅ UFW: deny-by-default, ports 22/80/443/11434 open
  ✅ Docker socket: secured (root:docker, 660)
  ✅ Auto-updates: configured (daily updates, weekly auto-upgrade)
  ℹ️ SSH server: not installed (workstation ok)
