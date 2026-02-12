# Master Agent Heartbeat

## What to Check (Every 30 Minutes)

### System
1. Memory/disk pressure: `free -h`, `df -h /`
2. Ollama service: `systemctl is-active ollama`
3. Docker daemon: `docker system info | head -3`
4. Load average: `cat /proc/loadavg`

### Security
1. Failed SSH attempts: `sudo tail -20 /var/log/auth.log | grep Failed`
2. UFW blocked: `sudo ufw show logging | tail -5`
3. Unusual processes: `ps aux | grep -E '(python|node|nc|ncat|socat|curl|wget)' | grep -v grep`

### OpenClaw
1. Gateway status: `openclaw status`
2. Active sessions: check for stuck/orphaned sub-agents
3. Cron job health: `openclaw cron list`

## Actions

**Alert if:**
- Memory usage > 90%
- Disk usage > 85%
- Load > 2x CPU cores for 5min
- Failed SSH from new IPs
- Ollama/Docker service down
- Suspicious process activity

**Auto-fix if:**
- Restart services if gracefully possible
- Kill orphaned sub-agent processes
- Rotate logs if oversized

**Log to:** `/home/issac-asimov/.openclaw/workspace/memory/heartbeat-$(date +%Y-%m-%d).log`
