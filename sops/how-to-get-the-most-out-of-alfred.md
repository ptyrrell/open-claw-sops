---
title: "How to get the most out of Alfred"
slug: how-to-get-the-most-out-of-alfred
owner: Paul Tyrrell
status: live
summary: "Channels, phrasings, freshness model, and the 83 tools — the playbook for using Alfred without the friction. Open this anytime you forget what he can do."
source:
  type: manual
  url: https://github.com/ptyrrell/open-claw-sops
  label: "Open Claw — Alfred operating manual"
tags: [alfred, open-claw, playbook, meta]
created: 2026-05-12
updated: 2026-05-12
---

## When to use this SOP

Open this when you've forgotten what Alfred can do, when a query feels slower than it should, or when something feels missing (e.g. "why can't Alfred see X?"). It's the operating manual for getting maximum signal out of the Open Claw stack with minimum friction.

## Outcome

You know which **channel** to reach Alfred on, which **phrasing** triggers the right tool, which **integrations are auto-fresh** vs **on-demand**, and how to **add new capabilities** when something's missing. You stop accidentally talking to Alfred like a search engine and start using him like a chief of staff.

## Prerequisites

- Alfred AU number `+61 468 072 882` (voice + SMS)
- Web client at [fi-alfred-chat](https://fi-alfred-chat-cbf0c5043d1a.herokuapp.com/)
- Public status: [paultyrrell.dev/alfred-monitor.html](https://paultyrrell.dev/alfred-monitor.html)
- Spawn dashboard: [fi-agent-dashboard](https://fi-agent-dashboard-2cc7e07d11d5.herokuapp.com/)
- This SOP playbook: [ptyrrell.github.io/open-claw-sops](https://ptyrrell.github.io/open-claw-sops/)

## Steps

### 1. Pick the right channel

| Need | Channel | Why |
|---|---|---|
| Quick lookup, short question, on the move | **SMS** to +61 468 072 882 | Fastest, no app to open, persists in chat history |
| You're driving, hands busy, want a verbal answer | **Voice** call +61 468 072 882 | Voice tools are blocklisted for slow operations (no SOP build, no agent spawn) — keeps replies <12s |
| Long task, paste big content, need code/markdown formatting | **Web chat** [fi-alfred-chat](https://fi-alfred-chat-cbf0c5043d1a.herokuapp.com/) | Full-width text, persistent session, file paste, no SMS character limit |
| Async work that takes hours | **Spawn a Cursor Cloud Agent** ("Alfred, spawn a cursor agent to ...") | Background work in a real repo, returns a PR. Visible at fi-agent-dashboard |

> **Same brain across all three** — Alfred shares one SQLite memory, so a SMS conversation continues seamlessly on the web client and vice versa.

### 2. Phrase for the tool you actually want

Alfred picks tools based on the verbs and nouns you use. These phrasings reliably trigger the right tool:

| You want | Say | Tool used |
|---|---|---|
| Today's calendar | "What's on today?" or "next meeting?" | `get_todays_events` |
| Recent Zoom calls (live) | "What zoom calls did I have today?" | `zoom_recent_meetings_live` (no cache lag) |
| Cached Zoom calls + auto-sync | "List my recent Zoom recordings" | `list_zoom_recordings` (auto-syncs last 7 days first) |
| Search across Zoom transcripts | "Find what Ceri said about pricing" | `search_zoom_transcripts` |
| Pull a specific Zoom call | "Get the transcript for the Forbo meeting" | `get_zoom_transcript` |
| Recent Fathom meetings | "What were my last 5 Fathom calls?" | `list_fathom_meetings` |
| Pipeline status | "Where's the pipeline at?" | `pipeline_briefing` |
| Lead quality | "Run the ICP audit" | `run_icp_audit` |
| Convert a recording to SOP | "Turn this loom into an SOP: <url>" | `sop_from_loom` |
| Convert pasted notes to SOP | "Make an SOP titled X from this transcript: ..." | `sop_from_transcript` |
| List existing SOPs | "Show me my SOPs" | `list_sops` |
| Spawn a code agent | "Spawn a cursor agent in repo X to ..." | `cursor_spawn_agent` |
| Recent emails | "What emails came in this morning?" | `get_recent_emails` |
| Send an email | "Email Ceri to thank her for the call" | `send_email` |
| Pull web content | "What does this page say: <url>?" | `web_fetch` (static) or `web_render` (SPA) |
| Recent obsidian notes | "What did I write in Obsidian today?" | `obsidian_recent` |
| Capture into Obsidian daily | "Note that Ceri wants demo Friday 3pm" | `obsidian_append_to_daily` |

### 3. Know what's auto-fresh vs on-demand

| Integration | Sync model | Cron | What to expect |
|---|---|---|---|
| **Zoom recordings** | Auto-pull every **2 hours** (last 7 days) | `com.alfred.zoom-sync` | Today's call available within ~2h after Zoom finishes processing |
| **Fathom meetings** | Auto-poll every **15 minutes** (last 12h) | `com.alfred.meeting-followup` | Available 5-15 min after meeting ends |
| **HubSpot deals** | Delta sync **daily** (25h window) | `com.fieldinsight.alfred.hubspot-sync` | Yesterday's deals + today's updates |
| **SDR calls (Aircall)** | Daily transcript pull | `com.alfred.sdr-transcripts` | New cold-call transcripts overnight |
| **Calendar (Google)** | Live API on each request | — | Always current |
| **Gmail** | Live API on each request | — | Always current |
| **Obsidian** | Live filesystem read on each request | — | Always current |
| **Friday call review** | Friday 5pm AEST SMS | `com.alfred.weekly-call-review` | Numbered shortlist for SOP creation |
| **Morning briefing** | Daily 7am SMS | `com.alfred.morning-briefing` | Calendar + pipeline + ICP overnight |

> **Check freshness anytime** by hitting `https://alfred.paultyrrell.dev/health` — the `data_freshness` block shows when each cached source was last updated and flags `lagging` (>3 days) or `stale` (>14 days).

### 4. Use Alfred for what he's actually good at

| Strong | Weak / overkill |
|---|---|
| **Multi-step orchestration** ("Find Ceri's email → check her last 3 calls → draft a follow-up") | Pure factual recall ("What's the capital of Bolivia?" — use Google) |
| **Cross-source synthesis** ("Did Ceri mention pricing on any call?" — searches Zoom + Fathom + Gmail) | Real-time stock prices / weather (use a real API) |
| **Acting on your data** (send email, write SOP, spawn agent, update pipeline) | One-line jokes, fan fiction, bedtime stories |
| **Context that persists** ("Remember Ceri prefers Tuesday mornings" — stored across all channels) | Stuff he has no tool for (no Slack tool yet, no Linear yet) |
| **Async work delegation** ("Spawn an agent to refactor X repo by EOD") | Streaming long content (he batches; web chat is best for that) |

### 5. Power patterns that 10x output

- **Stack tools in one ask:** "Read the FieldInsight + Forbo zoom transcript, draft a follow-up email to Adam Gill confirming next steps, send it." → Alfred chains `search_zoom_transcripts` → `get_zoom_transcript` → `send_email` in one turn.
- **Delegate, don't pilot:** "Spawn a cursor agent to add X feature to fi-ops-dashboard, branch `feat/x`, open a PR." → Background work, you keep moving.
- **Capture to Obsidian as you think:** "Note in today's daily: SSA wants AS1851 customisation by end of June." → Becomes searchable forever.
- **Use SOPs to compound:** Every time a process happens twice, ask Alfred to turn the call/notes into an SOP. Future-you stops re-thinking it.
- **Friday review loop:** When the Friday 5pm SMS arrives with the week's calls, reply with numbers. Each picked call becomes an SOP. Knowledge compounds weekly with zero effort.

### 6. Anti-patterns to avoid

- ❌ "What was that thing I said about pricing on a call last month?" — be specific: *which* call, *which* prospect. Vague queries trigger guesses.
- ❌ Calling on voice for tasks that take >12s (SOP build, agent spawn, ICP audit) — those are blocklisted on voice and he'll tell you to text instead.
- ❌ Pasting a 20-page transcript over SMS — use the web chat for anything >800 chars.
- ❌ Asking Alfred to "remember X forever" without storing it — use `obsidian_append_to_daily` or have him write it to a permanent fact in memory.
- ❌ Treating spawned Cursor agents as instant — they take 3-30 minutes. Check status via fi-agent-dashboard or "Alfred, what's the status of agent bc-xxx?"

## Decision tree

| Situation | Do |
|---|---|
| You don't know the right tool | Just describe what you want — Alfred picks. He has 83. |
| Reply seems wrong / out of date | Check `https://alfred.paultyrrell.dev/health` `data_freshness` panel. If a source is `stale`, the cron may have failed — restart it via `launchctl kickstart -k gui/$(id -u)/com.alfred.<name>` |
| Reply takes >30s | He's likely chaining 3+ tools. Web chat is fine; SMS will auto-split if needed; voice will time out — switch to SMS. |
| You want background work | "Spawn a cursor agent to ..." — never wait synchronously for it. |
| You want to add a new capability | Describe what's missing. Alfred can spawn an agent to add a new tool to himself (yes, really — he can edit `~/Alfred/alfred/tools/` and `brain.py`). |
| You're worried something broke | `https://paultyrrell.dev/alfred-monitor.html` shows live status. Or text "Alfred, are you ok?" and he'll self-check. |

## Common objections / FAQ

**Q: How do I know which integrations Alfred can actually see?**
A: Hit `https://alfred.paultyrrell.dev/capabilities` (with your auth token) — returns the full list of 83 tools grouped by domain. Or ask: "What can you do with Zoom?" — he'll list the relevant tools.

**Q: Why does Alfred sometimes "say" Claude or Anthropic?**
A: He shouldn't anymore — the brand-pairing prompt at the top of `ALFRED_SYSTEM_PROMPT` tells him "you are Alfred, your Open Claw assistant; Claude/Anthropic are implementation details, not the brand". If he slips, it's a system prompt regression — ping the brain config.

**Q: Where does Alfred store memory?**
A: SQLite at `~/Alfred/data/alfred.db` on the Mac Studio, plus optional permanent facts seeded at boot. Memory is shared across SMS, voice, web chat, iMessage. He archives long conversations to iCloud (`Paul's Brain/04 Archive/alfred-conversations`).

**Q: Can Alfred see iMessage?**
A: Not yet — the chat.db read needs Full Disk Access for `/usr/bin/python3`. To enable: System Settings → Privacy & Security → Full Disk Access → add Python 3.9 binary. Until then, iMessage is the one channel Alfred can't read or send through.

**Q: How do I add a new tool?**
A: Three options ranked by friction:
1. **Easiest**: ask Alfred. "Spawn an agent in the Alfred repo to add a tool that does X." He writes the function in `alfred/tools/`, registers it in `brain.py`, opens a PR.
2. **Manual**: write the function, add a descriptor to the `TOOLS` list in `~/Alfred/alfred/brain.py`, add a dispatch arm in `run_tool()`, restart `com.alfred.server`.
3. **MCP**: if there's already an MCP server for it, expose it through Cursor's MCP layer rather than duplicating in Alfred.

**Q: What's the difference between Alfred and the Cursor Cloud Agents on the dashboard?**
A: Alfred *spawns* Cursor agents. Alfred is a 24/7 chief of staff (one brain, many channels, instant). Cursor agents are short-lived workers that do one job in one repo and disappear after the PR. Think Alfred = manager, Cursor agents = freelancers he hires for the day.

## Definition of done

- [ ] You know the URL of all four touchpoints (SMS number, web chat, agent dashboard, SOP playbook)
- [ ] You can name 5 tools Alfred has and what triggers each
- [ ] You've checked `data_freshness` on `/health` at least once
- [ ] You've created at least one SOP via the Friday review loop
- [ ] You've spawned at least one Cursor agent and watched it on the dashboard
- [ ] You've reviewed this SOP and updated anything that surprised you

## Related artefacts

- **Alfred status page** — [paultyrrell.dev/alfred-monitor.html](https://paultyrrell.dev/alfred-monitor.html)
- **Alfred capabilities API** — `https://alfred.paultyrrell.dev/capabilities` (bearer auth)
- **Alfred health API** — `https://alfred.paultyrrell.dev/health` (no auth, freshness signals)
- **Brain source** — `~/Alfred/alfred/brain.py` on Mac Studio (TOOLS list + dispatch)
- **Tools dir** — `~/Alfred/alfred/tools/` on Mac Studio
- **Cron list** — `launchctl list | grep alfred` on Mac Studio
- **SOPs site** — [ptyrrell.github.io/open-claw-sops](https://ptyrrell.github.io/open-claw-sops/)
- **Agent dashboard** — [fi-agent-dashboard](https://fi-agent-dashboard-2cc7e07d11d5.herokuapp.com/)
