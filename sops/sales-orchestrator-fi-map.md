# Sales Orchestrator (fi-map) — Mutual Action Plans

**Owner:** Paul Tyrrell · **System:** `fi-map` (Heroku) + `alfred.tools.sales_meeting_scanner` (Mac Studio cron)
**Live URL:** https://fi-map-0c6b43a5f706.herokuapp.com/
**Source:** https://github.com/ptyrrell/fi-map

## What it does (in one breath)

Every sales meeting on Paul's or Natasha's Google Calendar gets auto-detected,
its transcript gets pulled from Fathom (or Grain or Zoom), Claude extracts a
5-bullet summary, decisions, next step, and action items (with owner + due
date + which side owns it), and the result lands in a **Mutual Action Plan**
page per deal at `https://fi-map-*.herokuapp.com/`.

One deal → one MAP. The MAP shows every meeting + every open action across
the full sales motion (Discovery → Guided Trial → Trial Review → Decision).

## Why this exists

- Stop asking "where are we up to with Acme?" — the MAP is the single
  source of truth, updated automatically from meeting recordings.
- Stop letting actions slip — extracted action items have owner + side
  (US / THEM) + due date, visible on one page per deal.
- Free Paul and Natasha from rewriting meeting notes — Claude does it.

## Architecture

```
Google Calendar event (Paul's or Natasha's)
   ↓  (twice daily: 09:15 + 18:00 AEST, via launchd)
~/Alfred/scripts/run_sales_meeting_scanner.py
   ↓
alfred.tools.sales_meeting_scanner.scan()
   ├─ classify_event()           ← title patterns + external attendee check
   ├─ find_transcript()          ← Fathom → Grain → Zoom (date proximity)
   ├─ extract_with_claude()      ← Claude Haiku 4.5, JSON output
   └─ POST /api/meetings/ingest  ← fi-map (idempotent by calendar_event_id)
        ↓
fi-map (Heroku · Node 20 · Postgres essential-0)
   ├─ deals          (one row per prospect/account)
   ├─ meetings       (one row per ingested meeting)
   └─ action_items   (one row per extracted action)
        ↓
Dashboard at /  (auto-refresh every 60s)
```

## What gets classified as a "sales meeting"

Title matches **any** of these case-insensitive substrings PLUS at least one
external attendee (not `@fieldinsight.com`):

| Pattern | Type |
|---|---|
| `discovery` | discovery |
| `trial review` | trial-review |
| `guided trial` · `deep dive` | guided-trial |
| `demo` | demo |
| `intro call` · `qualification` | sdr |

Meetings with external attendees that DON'T match a pattern are tagged
`uncategorised` and still ingested (Claude can usually still extract value).

Meetings are **hard-excluded** if the title contains: `1:1`, `standup`,
`stand up`, `team meeting`, `all hands`, `sales stand up`, `lunch`,
`walk`, `office`, `personal`, `haircut`, `doctor`, `dentist`,
`internal review`, `weekly check-in`, `birthday`, `anniversary`, `ooo`.

To add a new type: edit `SALES_MEETING_PATTERNS` in
`~/Alfred/alfred/tools/sales_meeting_scanner.py`.

## Cron schedule

`launchctl list | grep sales-meeting` →
`com.alfred.sales-meeting-scanner`

| When | Days back scanned | Why |
|---|---|---|
| 09:15 AEST | 3 | Catch yesterday's meetings (Fathom usually has the transcript by morning) |
| 18:00 AEST | 3 | Catch today's morning + afternoon meetings |

State (which calendar event IDs have already been processed) is stored in
`~/Alfred/data/sales_meeting_scanner_state.json` — never re-posts the same
meeting. Idempotent at the fi-map API level too (UNIQUE on `calendar_event_id`).

## How to use the dashboard

Open https://fi-map-0c6b43a5f706.herokuapp.com/ → see all active deals with
stage, last meeting date, open action count.

Click any row → drill into:
- Every meeting on that deal (summary, decisions, next step, transcript link)
- Every action item with owner, due date, side (US / THEM), status

## How Paul can interact (via Alfred)

Tools that Alfred can call (planned for next iteration — not yet wired into
`brain.py`):
- `list_open_maps` → "Which deals have open actions?"
- `map_detail(company)` → full MAP for one deal
- `mark_action_done(action_id)` → close out an action
- `re_scan_meetings(days=7)` → force a re-scan (e.g. after fixing a transcript)

Until those land, the dashboard is read-only and the scanner runs on schedule.

## Manual operations

```bash
ssh paultyrrellsilver2022@mac-studio-2

# Dry-run: see what WOULD be ingested without writing
cd ~/Alfred && source venv/bin/activate && set -a && source .env && set +a
python scripts/run_sales_meeting_scanner.py --dry --days 7

# Live ingest of a wider window (e.g. backfill last 30 days)
python scripts/run_sales_meeting_scanner.py --days 30

# Force re-process a single event (delete from state, then re-scan)
python -c "import json,pathlib; p=pathlib.Path.home()/'Alfred/data/sales_meeting_scanner_state.json'; s=json.loads(p.read_text()); s['processed'].pop('EVENT_ID_HERE',None); p.write_text(json.dumps(s,indent=2))"

# Check cron logs
tail -50 ~/Library/Logs/alfred-sales-meeting-scanner.log
```

## API (for future integrations)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | Liveness |
| GET | `/api/maps` | none (or basic-auth) | List all deals |
| GET | `/api/maps/:id` | none (or basic-auth) | One deal detail |
| POST | `/api/deals` | `Bearer FI_MAP_INGEST_TOKEN` | Upsert deal |
| POST | `/api/meetings/ingest` | bearer | Webhook (scanner calls this) |
| PATCH | `/api/actions/:id` | bearer | Mark action done / change due date |

`FI_MAP_INGEST_TOKEN` is in:
- `~/Alfred/.env` on the Mac Studio (used by the scanner)
- `heroku config:get FI_MAP_INGEST_TOKEN -a fi-map`

## Cost (per month)

- Heroku Basic dyno: **$7**
- Heroku Postgres essential-0: **$5**
- Claude Haiku 4.5 per scan run: **~$0.02** (40 meetings × ~$0.0005)
- **Total: ~$13/month + ~$2/month LLM** ≈ **$15/month**

## Roadmap (V1 → V3)

| Version | Adds |
|---|---|
| MVP (live) | Auto-scan, MAP per deal, internal dashboard |
| **V1** | Prospect-facing MAP share link · auto-book follow-up meeting in Natasha/Paul calendar based on stage |
| **V2** | Trial account provisioning (call FieldInsight admin API, create username/password, email credentials, mark MAP as "trial active") |
| **V3** | Guided Trial checklist page on FieldInsight (login → first job → invite tech → first invoice); MAP shows completion % |

## Anti-patterns & troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Scanner returns 0 matched | All meetings already processed | Run with `--days 30` for wider window, or clear state |
| Action items have `null` owners | Claude couldn't tell who owns it from the transcript | Add a "who owns what" section to your meeting outline |
| Wrong company name on MAP | Title parser fell back to email domain | Edit the deal in fi-map (manual UPDATE for now; CRUD UI in V1) |
| Two deals for same prospect | First event used a different email/title | Use `POST /api/deals` to merge, then DELETE the duplicate |
| Fathom 401 / 403 | Token rotated | Update `FATHOM_API_KEY` in `~/Alfred/.env`, restart Alfred |
| Zoom: "couldn't list recordings" | Token expired (OAuth account creds) | `zoom.py` self-refreshes — check `ZOOM_CLIENT_ID/SECRET/ACCOUNT_ID` |

## Why "fi-map" as a separate app (not just Alfred tools)

1. **Persistence model differs** — Alfred is request/response; fi-map is a
   stateful UI that prospects and the team need to view anytime.
2. **Separation of concerns** — Alfred owns AI work (transcript fetch +
   LLM extraction). fi-map owns data + UI. Either side can be rebuilt
   without touching the other.
3. **Future prospect-sharing** — V1 makes the MAP shareable; needs a real
   web app, not a chat tool.
4. **Multi-user write** — Natasha or any sales hire can mark actions done
   from the UI without going through Alfred.
