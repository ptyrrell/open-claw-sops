---
title: Critical Meetings — never miss the ones that matter
slug: critical-meetings
created: 2026-05-13
updated: 2026-05-13
owner: Paul Tyrrell
audience: Paul (and any future operator of the Open Claw stack)
status: live
tags: [alfred, open-claw, calendar, reminders, voice, escalation]
summary: >
  How Alfred guarantees Paul shows up to high-stakes meetings — escalating
  from a day-before voice call, through SMS reminders, to a wake-up call,
  with a "you missed it" alert if all else fails. Includes how to add or
  remove a critical meeting via SMS, voice, or web chat.
---

# Critical Meetings — never miss the ones that matter

Some meetings are too important to leave to a calendar notification. Alfred
treats those as **critical meetings** and runs an escalating multi-channel
confirmation flow against the actual Google Calendar events.

This SOP came out of missing **Founder Coaching with Julien Marzouk twice**
(both at 6 am Brisbane). Never again.

---

## 1. The escalation timeline

Each critical occurrence runs through this schedule. Times are **before** the
event start (negative offsets), unless marked otherwise.

| Offset | Channel | What happens |
|---|---|---|
| **T−18h** | **Voice call** | Alfred phones Paul: *"You have X tomorrow at Y. Say YES to confirm, NO to skip, RESCHEDULE to draft a move."* |
| **T−12h** | Voice call | Re-tries if T−18h was unanswered/unconfirmed |
| **T−6h** | SMS + iMessage | Text reminder if still unconfirmed |
| **T−60m** | SMS + iMessage | Morning nudge |
| **T−30m** | SMS + iMessage | Morning nudge |
| **T−15m** | **Wake-up voice call** | Only if still unconfirmed — physical phone ring |
| **T−10m** | SMS + iMessage | Final nudge |
| **T+15m** | SMS + iMessage | *"⚠ MISSED: X started 15 min ago"* — only if no acknowledgement |

Once Paul confirms (any channel), all subsequent `*_if_unconfirmed` actions
are suppressed. Plain `sms` reminders still fire — they're informational, not
escalation.

---

## 2. How Paul confirms

Any of these mark the meeting confirmed:

- **On the call** — say *"yes"*, *"yep"*, *"confirmed"*, *"got it"*, or press **1**
- **By SMS / iMessage** — reply with *"yes"*, *"y"*, *"confirmed"*, *"ok"*, or 👍 (within 60 min of any nudge)
- **In Alfred web chat** — *"confirm Founder Coaching"*
- **By voice command** — *"Alfred, confirm Founder Coaching"*

Any of these tell Alfred you can't make it (voice only):

- Say *"no"*, *"skip"*, or press **2** → Alfred logs the skip
- Say *"reschedule"* or press **3** → Alfred queues a reschedule SMS draft

---

## 3. Adding a critical meeting

You don't manually list each occurrence — Alfred matches a **substring of the
calendar event title**. So *"Founder Coaching"* matches both *"Founder
Coaching - Paul Tyrrell & Julien Marzouk"* and any future renamed instance.

### Via SMS, voice, or chat

> *"Alfred, mark Founder Coaching as critical."*
> *"Alfred, never let me miss the Wednesday board meeting."*
> *"Alfred, flag X as critical."*

Alfred will run the `add_critical_meeting` tool and reply with confirmation.

### Direct (CLI / debugging)

```bash
ssh mac-studio-2 'cd ~/Alfred && set -a && source .env && set +a && \
  ./venv/bin/python -c "from alfred import critical_meetings as cm; \
  print(cm.add_rule(title_pattern=\"Board Meeting\", paul_phone=\"+61401026347\"))"'
```

---

## 4. Listing / removing / confirming

| Intent | Say to Alfred |
|---|---|
| See current critical meetings + status | *"List critical meetings"* / *"What's on my never-miss list?"* |
| Manually confirm next occurrence | *"Confirm Founder Coaching"* |
| Stop nagging me about something | *"Remove X from critical"* / *"Stop nagging me about X"* |
| Test the system end-to-end | *"Test the critical meeting call"* — Alfred phones you immediately |

---

## 5. What's under the hood

| Component | Path | Purpose |
|---|---|---|
| Rules | `~/Alfred/data/critical_meetings.json` | List of title-pattern rules |
| State | `~/Alfred/data/critical_meetings_state.json` | Per-occurrence: confirmed_at, actions_fired |
| Logic | `~/Alfred/alfred/critical_meetings.py` | `tick()` runs from cron |
| Outbound call | `~/Alfred/alfred/tools/outbound_call.py` | Twilio call origination |
| TwiML routes | `~/Alfred/alfred/_critical_routes.py` | `/voice/critical/<key>` confirmation flow |
| Cron entry | `~/Alfred/scripts/run_critical_meetings.py` | `--dry` flag for testing |
| Schedule | `~/Library/LaunchAgents/com.alfred.critical-meetings.plist` | Every 10 min 5–7 am, every 15–60 min through to 22:00 |
| Brain tools | `add_critical_meeting`, `list_critical_meetings`, `remove_critical_meeting`, `confirm_critical_meeting`, `trigger_critical_meeting_test_call` |

---

## 6. Cost

Each critical occurrence costs roughly:

- 1 day-before call (~30 sec) — **~US$0.03**
- 0–4 SMS reminders — **~US$0.04 each**
- 0–1 wake-up call (~20 sec) — **~US$0.02**
- 0–1 missed alert SMS — **~US$0.04**

Worst case ~**US$0.30 per critical meeting**. For Founder Coaching
(bi-weekly), that's **~US$0.60/month** to never miss it.

---

## 7. Currently-critical meetings (snapshot)

```text
- Founder Coaching   (matches "Founder Coaching - Paul Tyrrell & Julien Marzouk")
                     bi-weekly Tuesdays 6:00 am Brisbane
                     paul_phone: +61 401 026 347
                     created: 2026-05-13 (after second miss)
```

Add more by texting Alfred *"mark X as critical"*.

---

## 8. Anti-patterns

- ❌ **Don't add too many** — Alfred only treats them as critical because they
  warrant a phone call. If everything is critical, nothing is.
- ❌ **Don't disable the cron** — silent failure mode. Use `remove_critical_meeting`
  per rule instead.
- ❌ **Don't mute the AU number** — that's how the day-before call gets through.
  Save **+61 468 072 882** in contacts as *"Alfred"* so caller-ID is friendly.
- ❌ **Don't reply YES to a non-critical reminder thinking it confirms** — the
  YES short-circuit only confirms the most-recently-nudged critical occurrence.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| Day-before call shows `status=busy` in logs | Phone declined or DND. Save +61 468 072 882 as "Alfred" in contacts and allow during Focus modes. |
| `tick()` returns `scanned: 0` | No upcoming events match any rule's `title_pattern`. Run `list_critical_meetings` and check the actual calendar event title. |
| YES reply doesn't confirm | The reply must arrive within 60 min of a critical-meeting nudge action. After that, use *"Confirm X"* explicitly. |
| Cron not firing | `launchctl list \| grep critical-meetings` — should show the job. If not: `launchctl load ~/Library/LaunchAgents/com.alfred.critical-meetings.plist` |
| Want to test without waiting | Say *"Alfred, test the critical meeting call"* — calls you immediately for the next critical occurrence. |
