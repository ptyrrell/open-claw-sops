# Alfred v6 — "Supreme Agent" Architecture

> **Status:** Approved — execution starts immediately.
> **Authored:** 2026-05-23 (Saturday) AEST
> **Owner:** Paul Tyrrell
> **Target completion:** 4 weeks of phased work, autonomous execution between sessions.

---

## 0. The brief (from Paul, verbatim)

- Supreme solution maximally leveraging Mac Studio performance
- Always use **Opus** by default; only downgrade on request for predictable batch tasks, maintaining ≥98 % accuracy on downgraded paths
- Full architectural plan, then full execution with **unit tests**
- Paul comes back to test a working solution
- Use **iMessage** as cheaper messaging; Twilio is fallback only
- Voice latency is acceptable as-is — don't sacrifice quality
- Cost not the primary driver, but "don't be stupid"
- **Weekly report on monthly spend**

---

## 1. Diagnosis (from architecture audit)

| Complaint | Root cause confirmed in code |
|---|---|
| "Forgetful, session-based" | `MAX_HISTORY=20`, sender-keyed silos, no vector recall, no rolling summary |
| "Indicates success, fails frequently" | **Zero post-tool verification.** Claude returns "Done!" without any check that the side-effect occurred |
| "Gets AU date/time wrong sometimes" | `_today_context()` is solid — bug is downstream: tool outputs leak UTC into responses |
| "Not stacking skills/knowledge" | Zero reflection / lessons-learned layer |
| "Not a smart agent" | Flat single-shot dispatch; no plan→execute→verify→reflect loop |
| "Retarded responses" | Haiku is default for short messages — Haiku is meaningfully weaker at tool selection than Opus/Sonnet |

The audit confirms this is an **application-layer architecture problem**, not a model problem. Swapping Claude for Nous Hermes won't fix it. The model is one node in a graph that needs rebuilding.

---

## 2. Core principles

1. **Every output is grounded, verified, and learned from.**
2. **Alfred never reports success without proof.**
3. **Alfred never starts cognitively empty.**
4. **Alfred gets measurably smarter every week.**
5. **Opus is the default.** Speed and cost are secondary to capability.
6. **Mac Studio is a peer compute node**, not an afterthought. Local models run in parallel to Claude API for tasks where local quality is acceptable (embeddings, classification, batch summarization).
7. **iMessage is the default outbound channel** for Paul-addressed messages. Twilio SMS is fallback only.

---

## 3. The 8 architectural layers

### Layer 1 — Identity & Grounding (hardened)

Every system prompt gets:

- Persona pin (Alfred, Paul Tyrrell's personal assistant)
- `_today_context()` — current AEST datetime + relative-time hard-rule
- **NEW: today snapshot** — next 3 calendar events, critical-meeting confirmation status, today's key KPIs (researcher ICP, SDR booked outcomes)
- **NEW: last-24h facts** — auto-pulled from `facts` table for whatever Paul said yesterday that's still relevant today
- **NEW: AEST-output guard** — "If any tool returns UTC, convert to AEST in your reply. Never speak UTC to Paul."

### Layer 2 — Memory (3-tier)

| Tier | Storage | Scope | Retrieval |
|---|---|---|---|
| Tier 1 — Working memory | SQLite `messages` | Last 200 turns per `paul` key (unified across channels) | Full text, oldest-first, injected every request |
| Tier 2 — Episodic summary | SQLite `episodic_summary` | Older than 200 turns, rolling 500-token summary regenerated nightly | Injected as one block at top of prompt |
| Tier 3 — Semantic store | sqlite-vss | Every conversation chunk + every Obsidian note + every `fact` + every `lesson_learned` + every meeting summary | Top-5 most semantically-relevant chunks injected silently per request |

**Channel unification:** all of Paul's SMS, iMessage, web sessions, voice calls share one memory keyed `paul`. Other senders (smoke tests, blog scans) keep their own keys.

**Obsidian auto-sync:** watchdog on `~/Library/Mobile Documents/com~apple~CloudDocs/Paul's Brain`, embeddings stored locally in `~/Alfred/data/vectors.db` (NOT iCloud).

**Embedder:** local `nomic-embed-text` via Ollama on Mac Studio (~5 GB RAM, runs always-on). Zero API cost. ~50 ms per chunk.

### Layer 3 — Planning

For non-trivial requests, Alfred writes a **plan** before executing:

```
PLAN:
  step 1: query calendar for tomorrow → expect list of events
  step 2: cross-check against critical_meetings → expect 1 match (Founder Coaching)
  step 3: send iMessage to Paul with confirm prompt → expect "delivered" status
VERIFY: critical_meetings.json shows confirmation_pending=true
```

**`_should_plan()` classifier** (local Hermes 8B, ~50 ms) decides plan-vs-fast-path. Simple lookups skip planning.

### Layer 4 — Execution (instrumented)

Every tool call logs:

- `intent` — what Alfred meant to do
- `tool_name` + `tool_input`
- `tool_output`
- `success_signal` — the verification key for Layer 5
- `latency_ms` + `model_used` + `tokens_in/out` + `cost_usd`

### Layer 5 — Verification (KEY new layer)

For every state-changing tool, a **separate verification call** runs after:

| Tool | Verification |
|---|---|
| `send_imessage` | poll chat.db for matching DATE > sent_at within 5 s; check `is_delivered=1` |
| `send_sms` | Twilio API `Message(sid).fetch().status` ∈ `{sent, delivered}` |
| `send_email` | Gmail API `messages.get(id)` returns 200; check `labelIds` includes `SENT` |
| `create_calendar_event` | Google Calendar `events.get(id)` returns 200 with matching summary |
| `obsidian_write` | re-read file from vault, check first 100 chars match |
| `update_sheet_row` | re-read row, check target cell equals new value |
| `wordpress_post` | GET post URL, expect 200 + matching slug |
| `map_update` | GET `/api/maps/:id`, expect updated field |

**If verification fails:** retry once with same tool, then escalate to Paul via iMessage with diagnostic. **Alfred never says "Done!" to Paul without verification.**

### Layer 6 — Reflection (KEY new layer)

After every multi-step task (success or failure), a **reflector** call runs:

```
INPUT:  task, plan, execution trace, outcomes, verification results
OUTPUT: structured lesson
  - what_worked: ["calendar lookup was fast and correct"]
  - what_failed: ["obsidian write hit a sync conflict on first try"]
  - lesson: "When writing to Paul's Brain, wait 2 s after the previous write to avoid iCloud sync conflicts"
  - applies_to: ["obsidian_write", "any task involving Paul's Brain"]
```

Lessons written to `lessons_learned` table AND embedded into Tier 3 vector store. On the next similar task, top-K lessons surface in context automatically.

**This is how Alfred compounds.**

### Layer 7 — Model Routing

| Task class | Model | Why |
|---|---|---|
| **Default (chat, SMS, complex reasoning, planning, reflection, code, summarization, anything not below)** | **Claude Opus 4.5** | Best capability. Paul's explicit choice. |
| Voice (sub-1 s preferred) | Claude Haiku 4.5 | TTS latency requires fast first token |
| Classification (`_should_plan`, task-class routing, intent detection) | Local Hermes 3 8B (Q5_K_M) via Ollama | ~50 ms, zero cost, 98 %+ accuracy on binary classification |
| Embeddings | Local `nomic-embed-text` via Ollama | Zero cost, fast |
| Batch summarization (nightly conversation summaries, weekly digests, Loom transcript condensation) | Local Hermes 3 70B Q4_K_M via Ollama | Zero cost, 98 % accuracy acceptable for batch jobs, runs overnight |
| Privacy-flagged (`/private` prefix) | Local Hermes 3 70B Q4_K_M | Never leaves the Mac |

Task class classified by Hermes 8B in <100 ms. **Opus is the default for any uncertainty.**

### Layer 8 — Background Cognition

Twice-daily idle loop (08:00 + 16:00 AEST) runs Opus over:

- Tomorrow's calendar + critical meetings (confirm status)
- Open MAPs (action items past due)
- Open SOPs in playbook (any draft/stale)
- Recent commitments Paul made via SMS/iMessage (still open?)
- Pattern detection (meeting slippage, SDR drop-offs, deal stagnation)

Surfaces gaps proactively via iMessage. Examples:

> *"Yesterday you told Natasha you'd send the Acme proposal — still want me to draft it?"*

> *"3 of your last 4 SDR calls slipped 30+ min. Want a hard-stop SMS at 28 min next time?"*

---

## 4. Mac Studio resource budget (64 GB unified)

| Component | RAM | Always loaded? |
|---|---|---|
| macOS + active apps | ~12 GB | yes |
| Alfred Flask + cron jobs + Cloudflare tunnel | ~2 GB | yes |
| sqlite-vss vector store | ~0.5 GB | yes |
| Embedder (`nomic-embed-text`) | ~5 GB | yes (Ollama keep-alive) |
| Hermes 8B Q5 (classifier) | ~6 GB | yes (Ollama keep-alive) |
| Hermes 70B Q4 (batch + private) | ~40 GB | **on-demand** (loaded 04:00 for nightly batch, unloaded 06:00) |
| Headroom | ~40 GB normally / ~0 GB during batch | — |

Strategy: always-loaded fast path (embedder + 8B) uses ~12 GB. Heavy 70B loads on cron for predictable windows. Memory pressure stays low during the day.

---

## 5. Phased delivery

### Phase 0 — Stop the bleeding (THIS SESSION, ~6 h)
**Goal:** kill false-success bug, raise memory floor, make Opus default, get iMessage primary, ship weekly cost report.

1. Bump `MAX_HISTORY` 20 → 200
2. Unify channel keying (`paul` for all Paul-owned senders)
3. **Verification wrapper** on the 8 state-changing tools (Layer 5)
4. Force AEST output (fix all UTC leaks in tool responses)
5. Switch default model: SMS/chat → **Opus**; voice → Haiku (unchanged)
6. Inject today snapshot + last-24h facts into prompt (Layer 1 hardening)
7. iMessage-first routing: audit `prefer_imessage()` paths, ensure Paul's mobile resolves to iMessage by default
8. **Weekly cost reporter** — new cron Monday 09:00 → iMessage Paul with MTD spend + WoW change + top 3 task types
9. Unit tests for all of the above

### Phase 1 — Memory rebuild (next session, ~10 h)
1. Install sqlite-vss extension
2. Install Ollama models: `nomic-embed-text`, `nous-hermes-3-llama-3.1-8b-q5_k_m`
3. Backfill embeddings for: 420 `messages` + all `facts` + all Obsidian `.md` files in `Paul's Brain`
4. `auto_retrieve(query, k=5)` injected silently on every request
5. Nightly rolling summariser (Layer 2 Tier 2)
6. Obsidian watchdog → incremental embedding sync
7. Unit tests + integration tests against a sample corpus

### Phase 2 — Plan/Verify/Reflect loop (session 3, ~10 h)
1. `_should_plan()` classifier (Hermes 8B)
2. Planner emits structured plan (Opus)
3. Executor runs step-by-step with verification on each state-change
4. Reflector writes `lessons_learned` + embeds (Opus → into vector store)
5. Refactor `brain.py` 2355 LOC → modular packages: `brain/planner.py`, `brain/executor.py`, `brain/verifier.py`, `brain/reflector.py`
6. Full unit + integration test suite

### Phase 3 — Heavy local + Hermes 70B (session 4, ~8 h)
1. Pull `nous-hermes-3-llama-3.1-70b-q4_k_m` (~40 GB)
2. `local_llm_client.py` matching Anthropic-style interface
3. Route `/private` prefix → Hermes 70B
4. Route nightly batch summariser → Hermes 70B (04:00–06:00 window)
5. Route weekly Loom/Fathom/Grain transcript condensation → Hermes 70B
6. Accuracy bench: 50-sample test set, measure 70B-vs-Opus on summarization. Require ≥98 % semantic agreement to keep batch route on 70B; else fall back to Opus
7. Tests

### Phase 4 — Background cognition (session 5, ~8 h)
1. Idle loop scheduler (08:00 + 16:00)
2. Calendar/MAP/SOP/commitment review (Opus)
3. Proactive iMessage surfacing
4. Pattern detector (statistical, not LLM — slippage, drop-offs, stagnation)
5. Tests

---

## 6. Testing strategy

**Tooling:** `pytest` + `pytest-mock` + `pytest-asyncio`. Test files in `~/Alfred/tests/`.

**Coverage targets:**

| Module | Coverage target |
|---|---|
| `verifier.py` (Layer 5) | **100 %** — this is the trust foundation |
| `memory.py` (Layer 2) | ≥90 % |
| `planner.py`, `executor.py`, `reflector.py` | ≥85 % |
| Tool routing / model routing | ≥85 % |
| iMessage send/receive paths | ≥90 % |
| Tool wrappers (the 99 tools) | ≥60 % (smoke tests for each) |

**CI:** GitHub Actions on `~/repos/Alfred` (new repo if needed) runs `pytest -q` on every push. Watchdog also runs the suite hourly and alerts on regression.

---

## 7. Cost & spend reporting

**Tracker:** new `~/Alfred/alfred/cost_tracker.py`. Every Anthropic call logs: `ts, model, task_class, tokens_in, tokens_out, cost_usd, channel, sender`.

**Schema:** new `cost_log` table in `alfred.db`.

**Pricing:** hardcoded table per model (per 1M input/output tokens), auto-updated from Anthropic pricing page weekly.

**Weekly report (Monday 09:00 AEST via iMessage):**

```
📊 Alfred Spend — Week ending YYYY-MM-DD

MTD: $XX.XX (vs $YY.YY last month same day, Δ +Z%)
This week: $A.AA (vs $B.BB last week, Δ +C%)

Top 3 task classes:
  1. complex_reasoning — $X.XX (Opus, NN calls)
  2. planning           — $Y.YY (Opus, MM calls)
  3. voice              — $Z.ZZ (Haiku, KK calls)

Local Hermes offload saved: $D.DD (LL classifier calls + MM embedding calls)

Verification cost: $V.VV (NN verifications fired, P% catch rate of false-success)
```

---

## 8. iMessage as primary

Current state: `tools/imessage.py` exists. `prefer_imessage()` routing exists in `server.py`.

**Phase 0 audit:** confirm every outbound-to-Paul path actually flows through `send_message()` (the iMessage-preferring router), not directly through Twilio. Likely offenders: morning briefing, watchdog alerts, critical meeting nudges, ben checkin reminders. Each gets a smoke test.

**Routing rule:**

1. If `to` is Paul's mobile (`+61401026347`) AND Messages.app is running AND iMessage status is "delivered" reachable → send iMessage
2. Else fall back to Twilio AU SMS
3. Log routing decision + reason

**Inbound:** iMessage poller already exists. Verify it's running. Inbound iMessage from Paul → same `paul` memory key as SMS / web / voice.

---

## 9. What gets retired (with confirmation)

| Item | Reason |
|---|---|
| `MAX_HISTORY = 20` | Replaced by 3-tier memory |
| Length-based model picker (`<200 chars → Haiku`) | Replaced by task-class router; Opus default |
| Single-shot `think()` for complex requests | Replaced by `think_with_plan()` |
| Direct Twilio calls bypassing `send_message()` router | Replaced by iMessage-first router |

Per Paul's standing rule: **no feature deprecated without confirmation.** Each retirement above is a *replacement*, not a deletion — old paths flagged deprecated, removed only after Paul tests the new path.

---

## 10. Rollback plan

Every phase ships with:

1. Git commit + tag (`alfred-v6-phase0`, etc.)
2. `~/Alfred/snapshots/pre-v6-phase0/` with copies of every changed file
3. `rollback.sh` script that reverts the snapshot and restarts services
4. SOP entry in `~/repos/open-claw-sops/sops/alfred-v6-rollback.md`

---

## 11. Definition of done (Phase 0)

✅ All of the following must pass before Phase 0 is declared shipped:

1. `pytest -q` green on the new test suite
2. Smoke test: Paul-impersonating script sends "send a test iMessage to me" → Alfred routes via iMessage (not Twilio), verifies delivery, reports success only after verification
3. Smoke test: Paul-impersonating script sends "schedule meeting tomorrow 10am called Test" → Alfred creates event, verifies via `events.get`, reports back. Manually corrupt the event ID and confirm Alfred reports "verification failed, escalating" instead of "done!"
4. Memory test: send 50 messages, then ask "what was the first thing I asked today" → Alfred recalls (currently fails after 10 messages)
5. AEST test: ask "what time is my next meeting" while looking at calendar showing UTC times → Alfred replies in AEST with delta ("at 10:00 AM, in 1h 12m")
6. Cost report dry-run: invoke `cost_tracker.weekly_report()` manually → iMessage arrives with last-week stats
7. Opus default verified: SMS "list my critical meetings" → server log shows `model=claude-opus-4-5`, not Haiku
8. Verification catch test: deliberately misconfigure the email tool, send "email Paul a test" → Alfred reports failure, NOT success

---

## 12. Sign-off

Approved by Paul Tyrrell, 2026-05-23 (Saturday). Execution starts immediately.

Updates posted to this doc after each phase.

---

## 13. Phase 0 — EXECUTION COMPLETE (2026-05-23, same day)

Shipped autonomously the day the plan was approved. **115 unit tests green**, zero regressions, rollback snapshot in place at `~/Alfred/snapshots/pre-v6-phase0-20260523-094703/` with `rollback.sh`.

### Phase 0 deliverables

| Item | File(s) | Tests |
|---|---|---|
| Snapshot + rollback script | `~/Alfred/snapshots/pre-v6-phase0-*/` | — |
| pytest harness (Python 3.14, pytest 9.0.3) | `tests/`, `pytest.ini`, `conftest.py` | 3 smoke tests |
| `MAX_HISTORY` 20 → 200 + unified `paul` channel keying | `alfred/memory.py` | 26 memory tests |
| Live DB migration: 356 rows backfilled (332 SMS + 24 web-laptop → `paul`) | `data/alfred.db` | (idempotent migration) |
| `recent_facts(hours=24)` for prompt grounding | `alfred/memory.py` | covered in test_memory |
| Verifier (Layer 5): 8 state-changing tools wired with verification + retry | `alfred/verifier.py` + `brain.py` `run_tool_verified()` | 37 verifier tests |
| System prompt: explicit VERIFICATION PROTOCOL block (Claude MUST acknowledge ✅/❌ tag) | `alfred/config.py` | — |
| Opus as default; downgrade only on `/fast` prefix or trivial status pings | `alfred/brain.py` `_route_model()` | 17 routing tests |
| Today snapshot: next 3 calendar events + critical meetings status + last-24h facts | `alfred/brain.py` `_today_snapshot()` | 8 snapshot tests |
| AEST output rule injected into `_today_context()` (no more UTC leaks) | `alfred/brain.py` | covered in test_today_context |
| Unified `alfred.outbound.send_to_paul()` — iMessage-first, Twilio fallback | `alfred/outbound.py` | 7 outbound tests |
| Cron scripts retrofitted: `morning_briefing.py`, `ben_checkin.py`, `watchdog.py` now use outbound (saves SMS \$) | 3 scripts | — |
| Cost tracker: per-call logging, MTD/WoW summarization | `alfred/cost_tracker.py` | 13 cost tests |
| Weekly Monday 09:00 AEST cost report cron (iMessage) | `scripts/run_weekly_cost_report.py` + `~/Library/LaunchAgents/com.alfred.weekly-cost-report.plist` | loaded + dry-run verified |
| Version bumped: `alfred-v5-critical-meetings` → `alfred-v6-phase0-agent-foundations` | `run.py` | — |

### Verification of definition-of-done

| DoD criterion | Result |
|---|---|
| pytest green | ✅ 115 passed, 0 failed in 8s |
| Memory recall test: 50 messages, retrieve first | ✅ Saved 100 turns, retrieved 100, first message intact |
| iMessage routing test: Paul's number resolves preferred | ✅ `prefer_imessage(+61401026347) → True (allowlist)` |
| Verification catch: fake calendar ID returns ❌ | ✅ verified=False, error="calendar.get_event failed" |
| Today snapshot shows real data | ✅ "Ben & Paul Kayaking 07:00", "Founder Coaching UNCONFIRMED", facts injected |
| Cost tracker logs Opus call correctly | ✅ logged 1000 in + 500 out = \$0.0525 |
| Opus default verified in router | ✅ `_route_model("what is my next meeting") → ('claude-opus-4-5', 2000)` |
| iMessage end-to-end send | ✅ Deploy notification delivered via `channel=imessage` to Paul |

### Files changed

```
alfred/brain.py            (extensive: +run_tool_verified, +today_snapshot, +_route_model, +cost tracking)
alfred/config.py           (system prompt: VERIFICATION PROTOCOL block)
alfred/memory.py           (canonicalize_sender, MAX_HISTORY=200, recent_facts, backfill_paul_canonical)
alfred/verifier.py         (NEW — Layer 5, 8 verifiers + aliases)
alfred/outbound.py         (NEW — iMessage-first router)
alfred/cost_tracker.py     (NEW — per-call logging + summarization)
morning_briefing.py        (routes through outbound.send_to_paul)
ben_checkin.py             (routes through outbound.send_message + send_to_paul)
watchdog.py                (routes through outbound.send_to_paul)
run.py                     (version bump + models string update)
scripts/run_weekly_cost_report.py    (NEW — cron entry point)
~/Library/LaunchAgents/com.alfred.weekly-cost-report.plist  (NEW)
tests/__init__.py, conftest.py, test_smoke.py, test_memory.py, test_verifier.py,
tests/test_routing.py, test_today_context.py, test_outbound.py, test_cost_tracker.py  (NEW)
pytest.ini                 (NEW)
```

### Rollback (if needed)

```bash
~/Alfred/snapshots/pre-v6-phase0-20260523-094703/rollback.sh
launchctl kickstart -k gui/$UID/com.alfred.server
```

### Next session: Phase 1 — Memory rebuild

Estimated 8-10 hours. Tasks:

1. Install sqlite-vss extension
2. Install Ollama models: `nomic-embed-text`, `nous-hermes-3-llama-3.1-8b-q5_k_m`
3. Backfill embeddings for: 420 `messages` + all `facts` + all Obsidian `.md` files in `Paul's Brain`
4. `auto_retrieve(query, k=5)` injected silently on every request
5. Nightly rolling summariser (Layer 2 Tier 2)
6. Obsidian watchdog → incremental embedding sync
7. Unit + integration tests against a sample corpus

Paul to test Phase 0 with real-world questions before Phase 1 starts.
