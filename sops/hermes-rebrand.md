---
title: Hermes Rebrand — what changed, where, how to revert
slug: hermes-rebrand
owner: Paul Tyrrell
status: live
tags: [hermes, brand, migration, alfred, playbook]
summary: On 2026-05-23 the platform brand "Open Claw" was retired in favour of "Hermes" — the messenger of the gods, a stronger semantic fit for a comms-first personal AI ecosystem. Alfred stays as the agent persona. This SOP enumerates every file touched, what changed, what was deliberately NOT changed, and how to revert.
---

# Hermes Rebrand

> **Brand hierarchy after migration:**
> - **Hermes** = the personal AI platform / ecosystem (umbrella)
> - **Alfred** = the conversational agent inside Hermes (Claude on Mac Studio)
> - **Tagline:** Alfred — your Hermes assistant
>
> **Before:** Alfred — your Open Claw assistant
> **After:** Alfred — your Hermes assistant

## Why Hermes

Hermes is the Greek messenger of the gods — patron of travelers, commerce,
and communication. A platform whose primary job is moving messages between
Paul and his systems (SMS, voice, iMessage, web chat, MAPs, SOPs) lands
more naturally under "Hermes" than "Open Claw" ever did. The agent
(Alfred) stays — he's a character; Hermes is the world he lives in.

## Files changed (2026-05-23)

### Alfred (Mac Studio · `~/Alfred/`)

| File | What changed | Backup |
|---|---|---|
| `alfred/config.py` | `ALFRED_SYSTEM_PROMPT`: "Open Claw assistant" → "Hermes assistant" (identity line + canonical phrase) | `.bak-pre-hermes-rebrand` |
| `run.py` | Status JSON `platform` + `tagline`; tool category key `open_claw` → `hermes` | `.bak-pre-hermes-rebrand` |
| `alfred/server.py` | Two status JSON blobs · voice greeting "Alfred here, Paul — your Hermes assistant" · Fiona SMS auto-reply signature `(Alfred / Hermes)` | `.bak-pre-hermes-rebrand` |
| `alfred/brain.py` | Tool descriptors for `list_open_claw_agents` etc. — *description text only*, function names unchanged | `.bak-pre-hermes-rebrand` |
| `alfred/tools/sops.py` | Display string `"Open Claw SOPs"` → `"Hermes Playbook"` | `.bak-pre-hermes-rebrand` |
| `alfred/tools/open_claw.py` | Internal `format_agents()` header text only — module file kept as-is | `.bak-pre-hermes-rebrand` |

### Deployed Heroku apps

| App | Version | What changed |
|---|---|---|
| **fi-alfred-chat** | v0.3.3 → **v0.4.0** | `<title>`, login card h2, header brand block, title attr — all "Open Claw" → "Hermes" |
| **fi-agent-dashboard** | v0.11.0 → **v0.12.0** | `<title>`, header logo alt + title, "Open Claw Model" tab → "Hermes Model", architecture page intro + 3 arch notes, mermaid subgraph label `[Open Claw - the ecosystem]` → `[Hermes - the ecosystem]`, App Hub header, footer, server.js cursor-agent spawn prompt, package.json description |
| **fi-map** | v0.1.0 (unchanged) | No references — already brand-neutral |

### Repositories

| Repo | Branch | Commit |
|---|---|---|
| `ptyrrell/fi-alfred-chat` | main | "v0.4.0 — Hermes rebrand (was Open Claw)" |
| `ptyrrell/fi-agent-dashboard` | main | "v0.12.0 — Hermes rebrand (was Open Claw)" |
| `ptyrrell/open-claw-sops` | main | "Hermes rebrand — site header is now 'Hermes Playbook'" |
| `ptyrrell/product-roadmap` | main | "Hermes rebrand — public roadmap brand strings" |

Templates rebuilt and committed at `ptyrrell/open-claw-sops/templates/{index,_layout}.html`:
- `<title>… · Open Claw SOPs` → `… · Hermes Playbook`
- `<h1>Open Claw SOPs` → `<h1>Hermes Playbook`
- Footer brand line and meta title

## Files NOT changed (deliberate)

| Asset | Why kept |
|---|---|
| GitHub repo name `open-claw-sops` | Renaming breaks every existing SOP URL (`/open-claw-sops/sops/critical-meetings.html` etc.), every saved bookmark, the Heroku integration, and every internal link in Alfred's `sops_tool` |
| GitHub Pages URL `ptyrrell.github.io/open-claw-sops/` | Same reason. The visible page header now says "Hermes Playbook"; the URL stem is just historical |
| Heroku app names (`fi-alfred-chat-cbf0c5043d1a`, `fi-agent-dashboard-2cc7e07d11d5`, `fi-map-0c6b43a5f706`) | URLs already shared, in DNS, in Twilio webhooks, in Cursor skill config |
| Cloudflare domain `alfred.paultyrrell.dev` | Twilio voice/SMS webhooks, fi-alfred-chat backend, Cursor IDE skill all point here |
| Agent persona "Alfred" | Paul asked only to swap the umbrella brand. Alfred is the character |
| Mac directory `~/Alfred/` + Python package `alfred/` | Cron paths, imports, log files, launchd plists all reference it |
| iCloud directory `Paul's Brain/02 Projects/Open Claw/` | Obsidian vault path — renaming an iCloud folder ripples through every spec link, every Cursor rule, every wiki backlink |
| Twilio number labels "Alfred AU / Alfred US" | They're the agent's phones, not the platform's |
| DOM IDs (`#openclaw-model`) + JS function `renderOpenClawModel()` | Internal identifiers — invisible to users, no rename risk worth taking |

## How to verify (quick)

```bash
# Alfred public health — should say platform: Hermes
curl -s https://alfred.paultyrrell.dev/health | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['platform'], d['tagline'])"

# fi-alfred-chat title
curl -s https://fi-alfred-chat-cbf0c5043d1a.herokuapp.com/ | grep -o '<title>[^<]*</title>'

# fi-agent-dashboard title + API
curl -s https://fi-agent-dashboard-2cc7e07d11d5.herokuapp.com/ | grep -o '<title>[^<]*</title>'
curl -s https://fi-agent-dashboard-2cc7e07d11d5.herokuapp.com/api/config

# Hermes Playbook (GitHub Pages — may take 2-5 min after push)
curl -s https://ptyrrell.github.io/open-claw-sops/ | grep -o '<title>[^<]*</title>'
```

Expected after migration:
- `platform: Hermes · tagline: Your Hermes assistant`
- `<title>Alfred · Hermes</title>`
- `<title>Hermes — Agent Dashboard</title>`
- `<title>All SOPs · Hermes Playbook</title>`

## How to revert (full rollback)

If the rebrand needs to be undone:

```bash
# 1. Alfred — restore from .bak-pre-hermes-rebrand
ssh paultyrrellsilver2022@mac-studio-2
for f in run.py alfred/config.py alfred/server.py alfred/brain.py \
         alfred/tools/sops.py alfred/tools/open_claw.py; do
  cp ~/Alfred/$f.bak-pre-hermes-rebrand ~/Alfred/$f
done
launchctl kickstart -k gui/501/com.alfred.server

# 2. Heroku apps — git revert the rebrand commit on each
for repo in fi-alfred-chat fi-agent-dashboard product-roadmap open-claw-sops; do
  cd /tmp/fi-work/$repo
  git pull
  git revert --no-edit HEAD   # if only the rebrand commit is on top
  git push origin main
  [ "$repo" != "open-claw-sops" ] && [ "$repo" != "product-roadmap" ] && git push heroku main
done
# open-claw-sops needs a rebuild: node scripts/build.mjs && git commit + push

# 3. SOP templates — already covered by step 2's git revert
```

The `.bak-pre-hermes-rebrand` Alfred backups will live on Mac Studio
indefinitely (or until explicitly deleted). Delete them when you're
confident the rebrand is final:

```bash
rm ~/Alfred/run.py.bak-pre-hermes-rebrand
rm ~/Alfred/alfred/{config,server,brain}.py.bak-pre-hermes-rebrand
rm ~/Alfred/alfred/tools/{sops,open_claw}.py.bak-pre-hermes-rebrand
rm ~/repos/open-claw-sops/templates/{index,_layout}.html.bak-pre-hermes
```

## Open follow-ups (NOT done in this pass, by design)

- [ ] Rename Python module `alfred/tools/open_claw.py` → `hermes.py` with an
      `open_claw` import alias for back-compat. (Defer until next breaking
      change to that module — no functional reason to bundle.)
- [ ] Rename tool `list_open_claw_agents` → `list_hermes_agents` with old
      name as alias. (Defer — would force re-training in any saved
      conversation context.)
- [ ] New favicon if you ever want a Hermes-specific mark (winged sandal,
      caduceus). Current 8-point star is intentionally generic and still
      reads correctly for the messenger god.
- [ ] Consider whether to register `hermes.paultyrrell.dev` as a friendly
      alias for `alfred.paultyrrell.dev`. (No cost or downside — purely
      cosmetic. Punt until you actually want to use it.)

## Related SOPs

- `how-to-get-the-most-out-of-alfred` — the Alfred operating manual
- `sales-orchestrator-fi-map` — the most recent app added to the Hermes stack
- `critical-meetings` — Alfred's never-miss meeting confirmation system
