# R.Jim Simons — Quick Start Guide

## Overview

The Smart Money Cloner: A Phase 1 MVP quantitative crypto trading system following the Medallion Fund methodology.

---

## Prerequisites

1. **Dune Analytics API Key** — Get from [dune.com](https://dune.com)
2. **Telegram Bot** — Create via [BotFather](https://t.me/botfather)
3. **Python 3.11+** with pip
4. **n8n** — For automation workflows ([n8n.io](https://n8n.io))
5. **Trading Capital** — Start small ($1-5k), prove alpha first

---

## Installation

```bash
# 1. Navigate to workspace
cd /home/issac-asimov/.openclaw/workspace/agents/r-jim-simons

# 2. Initialize database
python scripts/init_db.py --db r-jim-simons.db

# 3. Install Python dependencies (if needed)
pip install sqlite3

# 4. Set up environment variables
export DUNE_API_KEY="your_dune_key_here"
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"

# 5. Test the processor
python scripts/signal_processor.py --test --portfolio 10000
```

---

## Database Schema

The system uses SQLite with 5 tables:

1. **whale_signals** — All detected and processed signals
2. **whale_performance** — Metrics for tracked whale wallets
3. **daily_metrics** — Portfolio and risk tracking
4. **circuit_breaker_log** — When trading was halted
5. **config** — Adjustable thresholds and risk parameters

---

## Configuration

Edit risk parameters in the database:

```sql
UPDATE config SET value = '0.10' WHERE key = 'MAX_DAILY_DRAWDOWN_PCT';  -- Set to -10% (default: -5%)
UPDATE config SET value = '0.30' WHERE key = 'MIN_CONFIDENCE_SCORE';   -- Lower threshold (default: 0.70)
```

Key parameters:
- `MIN_WALLET_TRADES_30D` — Minimum trades to qualify (default: 10)
- `MIN_WALLET_ROI_30D` — Minimum 30-day ROI (default: 15%)
- `MIN_WALLET_WINRATE` — Minimum win rate (default: 55%)
- `MAX_POSITION_PCT` — Max position as % of portfolio (default: 5%)
- `KELLY_FRACTION` — Conservative Kelly multiplier (default: 0.25x)

---

## n8n Workflow Setup

1. Import `scripts/n8n_workflow_template.json` into n8n
2. Add your Dune credentials
3. Configure Telegram Bot credentials
4. Start the workflow (polls every 60s)
5. **Important:** The workflow sends signals to a local Python API server

### Setting up the Python API server:

Create `api_server.py`:

```python
from flask import Flask, request, jsonify
from signal_processor import WhaleSignalProcessor

app = Flask(__name__)
processor = WhaleSignalProcessor()

@app.route('/api/process-signal', methods=['POST'])
def process_signal():
    data = request.json
    result = processor.process_signal(data.get('signal'))
    
    # Format for Telegram if passed
    if result['signal']:
        result['telegram_message'] = processor.format_telegram_alert(result['signal'])
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

Run: `python api_server.py`

---

## Dune Analytics Query

You'll need to create a Dune query to find whale wallets. Here's a template:

```sql
-- Query: Top Performing Whale Wallets (Last 30 Days)
-- Find wallets with consistent profitability

WITH wallet_stats AS (
    SELECT
        from_address,
        COUNT(*) as total_trades,
        AVG(CASE WHEN usd_amount > 0 THEN 1 ELSE 0 END) as win_rate,
        SUM(usd_amount) as total_pnl,
        AVG(ABS(usd_amount)) as avg_trade_size
    FROM dex.trades
    WHERE block_time >= NOW() - INTERVAL '30' DAY
      AND usd_amount >= 10000
    GROUP BY from_address
    HAVING COUNT(*) >= 10
      AND AVG(CASE WHEN usd_amount > 0 THEN 1 ELSE 0 END) >= 0.55
      AND SUM(usd_amount) > 0
)

SELECT *
FROM wallet_stats
ORDER BY SUM(usd_amount) DESC
LIMIT 100
```

Save the query ID and use it in n8n: `{QUERY_ID}` in the URL.

---

## Usage

### Phase 1: Manual Execution (Current)

1. **n8n workflow runs** → Polls Dune for whale transactions
2. **Python processor filters** → Applies Kelly sizing, confidence scoring
3. **Telegram alert sent** → You receive: "BUY SIGNAL: $X TOKEN"
4. **You execute manually** → Via 1inch, Matcha, or CowSwap
   - Use **Flashbots Protect RPC**: `https://rpc.flashbots.net/fast`
   - Set slippage to 0.5% max
5. **Log execution** — In the database or spreadsheet
6. **Track PnL** — Review positions after 4 hours or target hit

### Phase 2: Partial Automation (Future)

- Hardware wallet integration
- Automated trade submission
- Position tracking and sell signals

---

## Dr. Simons' Rules

**Before executing ANY trade, check:**

1. ✅ Is this whale in our approved list with >70% confidence?
2. ✅ Is the position size under 5% of portfolio?
3. ✅ Are we using Flashbots Protect RPC?
4. ✅ Is daily drawdown under -5%?
5. ✅ Have fewer than 3 failed executions today?

**If ANY check fails:** Do not trade. Wait for next signal.

---

## Monitoring

```bash
# View signal statistics
python scripts/signal_processor.py --stats

# Check database for today's signals
sqlite3 r-jim-simons.db "SELECT * FROM whale_signals WHERE date(timestamp) = date('now');"
```

---

## Success Metrics

Before advancing to Phase 2, prove:
- ✅ 50+ trades completed
- ✅ Positive expectancy (avg PnL > 0)
- ✅ Sharpe ratio > 1.0
- ✅ Max drawdown < 10%
- ✅ Monthly return > 5%

---

## Troubleshooting

**No signals being generated?**
- Check Dune API key is valid
- Verify wallet filter criteria aren't too strict
- Check circuit breaker log: `SELECT * FROM circuit_breaker_log ORDER BY triggered_at DESC;`

**Too many signals?**
- Increase `MIN_CONFIDENCE_SCORE` to 0.80
- Increase `MIN_TRADE_SIZE_USD` to 20000
- Add more strict wallet performance filters

**Telegram not alerting?**
- Verify bot token and chat ID
- Check n8n execution logs
- Ensure Python API server is running

---

## Dr. Simons' Last Words

> "Backtest everything. Risk first, profit second. Automate completely. 
> And never — *never* — ignore a circuit breaker."

---

## Support

- **Dune API Docs:** https://dune.com/docs/api/
- **Flashbots Protect:** https://docs.flashbots.net/flashbots-protect/
- **n8n Workflows:** https://docs.n8n.io/

*Built with mathematical rigor. Trade with discipline.* 📈
