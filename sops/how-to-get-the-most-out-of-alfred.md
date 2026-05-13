---
title: How to get the most out of Alfred
slug: how-to-get-the-most-out-of-alfred
created: 2026-05-13
updated: 2026-05-13
owner: Paul Tyrrell
audience: Paul (and any future operator of the Open Claw stack)
status: live
tags: [alfred, open-claw, operating-manual, channels, tools, freshness]
summary: >
  Alfred is your Open Claw assistant — one brain, four channels (SMS, voice,
  iMessage, web chat), 92 tools. This SOP shows you exactly how to talk to him,
  what he can see, when his data is fresh vs stale, and the power patterns that
  unlock the most value per message.
---

# How to get the most out of Alfred

Alfred — your Open Claw assistant — is a single Claude-backed brain on your Mac
Studio with **92 tools**, a stable Cloudflare Named Tunnel
(`alfred.paultyrrell.dev`), and four ways to reach him:

| Channel | Number / URL | Cost | Best for |
|---|---|---|---|
| **SMS (AU)** | `+61 468 156 287` | US$0.04/msg | Anywhere reception works |
| **SMS (US)** | `+1 *** ***` (TWILIO_VOICE_FROM) | US$0.0079/msg | When AU number rate-limits |
| **Voice (AU)** | `+61 468 072 882` | per minute | Hands-free in the car |
| **iMessage** | Your own iCloud-paired numbers | **free** | Auto-preferred for known iMessage contacts |
| **Web chat** | https://fi-alfred-chat-cbf0c5043d1a.herokuapp.com | free | Long messages, file context |

Every channel hits the same brain. State is shared across them.

---

## 1. The freshness model — know what Alfred can see

Alfred no longer guesses about how stale his data is. The `/health`
endpoint exposes a `data_freshness` panel with one entry per integration:

```text
zoom         fresh   (1h ago)   expected ≤2h
fathom       fresh   (8m ago)   expected ≤15m
hubspot      fresh   (16h ago)  expected ≤24h
aircall_sdr  fresh   (18h ago)  expected ≤24h
grain        live    (no cron — call-on-demand only)
```

Statuses: `fresh` (≤1.5× expected), `lagging` (≤4×), `stale` (>4×, cron broken),
`live` (no cache exists, always live), `unknown` (log unreadable).

**Use it whenever it matters.** Just ask:

> "Alfred, are all your data sources fresh?"

He'll call `get_data_freshness` and tell you in one line. If anything is
`stale`, the answer ends with the exact `launchctl kickstart` command to
revive the cron.

---

## 2. The four channels in detail

### 2a. SMS (Twilio)
Default outbound channel for any number not in your iMessage allowlist.
US$0.04 each — adds up at scale. Inbound is webhook-triggered, so messages
land in Alfred's brain instantly.

### 2b. Voice (AU number `+61 468 072 882`)
- Voice: `Polly.Russell-Neural` (Australian male).
- Greeting: "Alfred here, Paul — your Open Claw assistant. How can I help?"
- **Tools available on voice**: most of them, except a `VOICE_TOOL_BLOCKLIST`
  of slow ones (SOP generation, large roadmap fetches, ops-dashboard pulls).
  This keeps voice latency under ~3s while still letting Alfred check your
  calendar, send SMS, summarise meetings, etc.

### 2c. iMessage (NEW in this build)
- **Sending**: works today via `osascript`. Alfred's outbound `_send_sms`
  automatically prefers iMessage when the recipient is iMessage-capable —
  saves US$0.04 per message.
- **Receiving**: poller is wired but needs Full Disk Access on the launchd
  Python binary. Ask Alfred:

  > "Alfred, how do I enable iMessage receive?"

  He'll print a 7-step FDA setup guide via `imessage_setup_help`.

- **Routing rules** (in priority order):
  1. Number is in `IMESSAGE_PREFERRED_NUMBERS` env var (default: your mobile)
  2. chat.db has prior `service='iMessage'` thread with this number (if FDA OK)
  3. Otherwise → fall back to Twilio SMS

### 2d. Web chat
Heroku-hosted React shell talking to Alfred via `/chat`. No SMS cost. Best for
multi-paragraph context, file paste, or when you're at a desk.

---

## 3. Power patterns — phrasings that unlock the most value

| You say | Alfred does |
|---|---|
| "What's my next meeting?" | calendar tools (live Google Calendar) |
| "Did Ceri respond?" | `list_recent_messages` + Twilio history |
| "Summarise yesterday's Zoom calls" | `list_zoom_recordings` (auto-syncs first) |
| "What's our pipeline this month?" | `read_ops_dashboard section=pipeline` |
| "How is SDR tracking this week?" | `read_ops_dashboard section=sdr` |
| "How is Fiona performing?" | `list_fiona_grades` |
| "What does the FI-24 spec say about walk order?" | `read_roadmap_spec slug=fi-24-...` |
| "What agents are running in Open Claw?" | `list_open_claw_agents filter_status=live` |
| "Are all data sources fresh?" | `get_data_freshness` |
| "iMessage Sarah saying I'll be 10 min late" | `send_imessage` directly (free) |
| "Turn this Loom into an SOP: <url>" | `sop_from_loom` → commits to GitHub Pages |
| "List my SOPs" | `list_sops` |

### Anti-patterns (they cost more without buying you more)

- **Don't** paraphrase what you want — be specific. "Check pipeline" makes
  Alfred call multiple tools; "Read the ops pipeline section for May" goes
  straight to one.
- **Don't** ask for "all calls today" without a channel hint — he'll
  cross-reference Zoom, Fathom, Aircall, and SMS. Say "my Zoom calls" or
  "my SDR calls" to skip the wide search.
- **Don't** ask Alfred to do anything async over voice (writing SOPs, posting
  PRs, big roadmap fetches). They're in the voice blocklist for a reason —
  the connection times out before Claude finishes.

---

## 4. The 92 tools, grouped

Alfred has **92 registered tools**. The big new ones from this build:

### Cross-app readers (Phase 2)
- `read_ops_dashboard(section, month?)` — fi-ops-dashboard live data
- `list_open_claw_agents(filter_status?)` — agent registry
- `list_fiona_calls(limit)` / `list_fiona_grades(limit)` — IVR transcripts/grades
- `list_roadmap_specs()` / `read_roadmap_spec(slug, max_chars?)` — roadmap

### Health / introspection
- `get_data_freshness(as_summary?)` — one-line or full panel

### iMessage
- `send_imessage(to, body)` — direct (free)
- `imessage_setup_help()` — FDA setup guide

### SOPs
- `sop_from_loom(url)` / `sop_from_transcript(text)` — generate via Claude
- `list_sops(limit)` — index

### Pre-existing strengths
Calendar, Gmail, Notion, Linear, GitHub PRs, HubSpot CRM, Stripe, Apple Notes,
Loom, Fathom, Grain, Aircall, Zoom, Cursor Cloud Agent spawning, system facts
memory, voice, SMS, WhatsApp.

---

## 5. The decision tree (when in doubt)

```
Is the question about live status of an external system?
├── Pipeline / sales / SDR / researchers   → read_ops_dashboard
├── Agents in Open Claw                    → list_open_claw_agents
├── Voice IVR (Fiona)                      → list_fiona_calls / list_fiona_grades
├── Spec / roadmap docs                    → list_roadmap_specs → read_roadmap_spec
└── Integration up-to-date?                → get_data_freshness

Is the question about Paul's own data?
├── Calendar / next meeting                → calendar_*
├── Recent calls (Zoom / Fathom / Aircall) → list_*_recordings (auto-sync built in)
├── Pipeline deals                         → hubspot_*
└── Notes / SOPs                           → list_sops / apple_notes_*

Sending something out?
├── Known iMessage number                  → automatic (no extra step)
├── Phone number you're not sure about     → send_sms (Alfred routes smartly)
└── Group / business contact               → send_imessage if you know they have it
```

---

## 6. Costs at a glance

| Channel | Cost per message | When Alfred picks it |
|---|---|---|
| iMessage | $0 | Recipient in IMESSAGE_PREFERRED_NUMBERS or chat.db has iMessage history |
| Twilio SMS (AU) | US$0.04 | Default fallback for AU numbers |
| Twilio SMS (US) | US$0.0079 | Explicit `from_=TWILIO_VOICE_FROM` |
| Twilio Voice | per minute | Inbound only (you call him) |

To force iMessage for more numbers, add them to `IMESSAGE_PREFERRED_NUMBERS`
in `.env` (CSV, E.164):
```
IMESSAGE_PREFERRED_NUMBERS=+61401026347,+61400000001,+61400000002
```

---

## 7. FAQ

**Q: How do I know if Alfred is using fresh data?**
> Ask "data freshness?" — one line back, with stale crons flagged.

**Q: My iMessages aren't being received — why?**
> The launchd Python doesn't have FDA. Ask Alfred "how do I enable iMessage
> receive" and follow the 7-step guide. (Send works fine without it.)

**Q: I asked Alfred something he should know but he said he doesn't know.**
> Either the data source is stale (check freshness) or he doesn't have a
> tool for it yet. The four most common gaps are: (a) anything inside a
> private GitHub repo other than product-roadmap, (b) anything in Slack,
> (c) anything in iMessage groups (only DMs are polled), (d) anything that
> requires a paid LLM tool not yet wired (e.g. Claude Code).

**Q: Voice was slower than usual.**
> Check `/health` data_freshness — if a cron is `lagging`, Alfred may be
> falling back to live API calls which are slow. Kick the cron with the
> command in the freshness summary.

**Q: How many tools does Alfred have?**
> Run `curl -s http://127.0.0.1:8080/health | jq '.tools | length'` from the
> Mac Studio. As of this SOP: **92**.

---

*Last updated: 2026-05-13 — added Phase 2 cross-app readers, unified data
freshness panel (zoom + fathom + grain + hubspot + aircall_sdr), iMessage
smart routing, and the FDA setup helper.*
