# Web Search Strategy — API-Free Approach

**Decision:** 2026-02-11 — Removed all API-based search (Brave, Perplexity/OpenRouter). Now using completely free methods.

---

## Strategy: web_fetch + Browser Control

### 1. web_fetch (Primary)
Fetch specific URLs directly — no API keys, no costs.
```javascript
web_fetch({ url: "https://en.wikipedia.org/wiki/..." })
web_fetch({ url: "https://docs.python.org/..." })
```

**Pros:**
- Zero cost
- No API keys to manage
- Fast for known sources

**Cons:**
- Requires knowing which URL to fetch
- May break if site changes

---

### 2. Browser Control (When Needed)
For dynamic sites or when search is required, use browser automation.
```javascript
browser.open({ url: "https://duckduckgo.com/?q=query" })
browser.snapshot()
browser.click({ ref: "e12" })  // Click search result
```

**Pros:**
- Works on any site
- Can interact with JS-heavy pages
- No API keys

**Cons:**
- Slower (browser startup)
- More resource intensive

---

## Search Patterns

### Pattern A: Direct Knowledge Fetch
**When you know the source:**
```javascript
// Instead of "search Python docs"
web_fetch({ url: "https://docs.python.org/3/library/os.html" })
```

### Pattern B: Browser Search
**When you need to find sources:**
```javascript
browser.open({ url: "https://duckduckgo.com/html/?q=ubuntu+24.04+release" })
browser.snapshot({ refs: "aria" })  // Get interactive elements
// Find search results, click, fetch content
```

### Pattern C: Hybrid
**Search → Select → Fetch:**
```javascript
// 1. Open search
browser.open({ url: "https://search.sapti.me/?q=..." })
// 2. Get results via snapshot
// 3. web_fetch the best result for full content
```

---

## Useful Direct URLs

| Topic | Direct URL |
|-------|-----------|
| Wikipedia | `https://en.wikipedia.org/wiki/TOPIC` |
| Python Docs | `https://docs.python.org/3/` |
| MDN Web Docs | `https://developer.mozilla.org/en-US/docs/...` |
| GitHub Repos | `https://github.com/USER/REPO` |
| Arch Wiki | `https://wiki.archlinux.org/title/...` |
| Stack Overflow | `https://stackoverflow.com/questions/ID` |

---

## Removed Configurations

- ❌ Brave Search API (requires key, now disabled)
- ❌ Perplexity/OpenRouter (no longer free tier, disabled)
- ❌ DuckDuckGo MCP (package doesn't exist)

---

## Result

**Completely free, API-keyless web access.**
- `web_fetch`: Fast, targeted fetches
- `browser`: Full browser control when needed
- No external dependencies or credit cards required
