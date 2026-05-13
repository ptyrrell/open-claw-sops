---
title: "FieldInsight + See Thru with Ceri"
slug: fieldinsight-see-thru-with-ceri
owner: Paul Tyrrell
status: live
summary: "[00:00:00] Paul. Tyrrell: My computer's a bit cold this morning."
source:
  type: fathom
  url: https://fathom.video/calls/668120540
  label: "fathom · FieldInsight + See Thru with Ceri"
tags: [from-fathom]
created: 2026-05-13
updated: 2026-05-13
---

## When to use this SOP
Use this when onboarding a new client to FieldInsight who also needs See Thru (or similar contractor workforce management) and wants to understand how AI-driven scheduling can reduce manual lookup time and improve job estimation accuracy.

## Outcome
Client understands the AI scheduling capabilities in FieldInsight, has seen a live demo of task pattern recognition and worker quality tracking, and has granted you system access to set up the integration. They know what data FieldInsight can surface automatically (previous job duration, crew size, worker quality) and when to trust the AI prediction vs. manual override.

## Prerequisites
- **FieldInsight account** with project management features enabled
- **See Thru account** (or equivalent workforce mgmt system) — login credentials
- **Historical job data** — at least 3–6 months of completed tasks with crew assignments and durations
- **Screen share tool** (Zoom or equivalent) with permission granted
- **Approver present** if client wants to see custom AI prompt workflows (optional: have Ceri or equivalent scheduling lead on the call)

## Steps
1. **Frame the AI unlock** — Open with the dyslexic/ADHD leverage point if relevant ("AI is like a prosthetic arm for scheduling: you still do the thinking, it handles the lookup and grammar"). Otherwise, lead with: "FieldInsight's AI recognises patterns in your historical jobs and predicts crew size, duration, and worker quality for new tasks."
   
2. **Share the FieldInsight scheduling view** — Navigate to **FieldInsight → Projects → [Active Project] → Task Scheduling**. Point out the "AI Suggest" button (or equivalent) in the task detail panel.

3. **Run a live prediction** — Pick a task type the client has done before (e.g., "Roof inspection, 2-storey"). Click **AI Suggest**. Show how the system returns:
   - Estimated duration (e.g., "4.2 hrs based on last 8 similar tasks")
   - Recommended crew size (e.g., "2 workers")
   - Worker quality flag (e.g., "Use crew with avg rating ≥4.2 for this task type")
   - Watch out for: If historical data is sparse (<3 prior jobs), AI may flag "Low confidence — manual review needed."

4. **Cross-check with See Thru** — Open **See Thru → Job History** in a second tab. Filter by the same task type. Show the raw data FieldInsight pulled (dates, crew names, actual hours). Explain: "The AI doesn't invent numbers; it averages these completed jobs and weights by worker performance."

5. **Demo the manual override path** — Click **Override AI** in FieldInsight. Show how to adjust crew size or duration if client has contextual knowledge (e.g., "This site has difficult access → add 1.5x time multiplier"). Emphasise: "You're still the scheduler; AI is the research assistant."

6. **Grant system access** — If client approves, have them share **See Thru API key** (or SFTP creds if no API). Store in **FieldInsight → Settings → Integrations → See Thru**. Test the connection with a single task sync.

7. **Set expectations for iteration** — Explain: "AI improves 20–50% per month (per Paul's rule). If a prediction feels off in week 1, flag it; by month 3 the model will be dialled in to your crew's actual performance."

## Decision tree
| Client says | You do |
|-------------|--------|
| "I want to write my own schedules" | Acknowledge. Offer to enable AI suggestions in read-only mode for 2 weeks so they can compare. |
| "Our jobs are too variable for AI" | Show the "Low confidence" flag in action. Explain AI surfaces the variance itself — still saves lookup time. |
| "Can AI pick the actual workers?" | Yes, if See Thru has worker skill/rating metadata. Demo the quality filter (avg rating ≥X). |
| "What if we don't have 6 months of history?" | AI still works but flags low confidence. Recommend manual input for first 10 tasks, then retrain. |

## Common objections / FAQ
**Q: Will AI replace our scheduler (Ceri)?**  
A: No. AI replaces the 30 minutes of digging through old jobs to find "how long did that roof take last time?" The scheduler still decides strategy, handles exceptions, and approves final schedule.

**Q: How does AI handle one-off custom jobs?**  
A: If no similar task exists, AI returns "No pattern found — manual estimate required." You input the data, which becomes training for next time.

**Q: Can we trust the crew quality score?**  
A: It's based on See Thru ratings (or time-to-complete if no ratings). Verify the underlying data in See Thru before relying on it. Treat as a starting point, not gospel.

**Q: What if the AI predicts 2 workers but we know we need 3?**  
A: Use the override. FieldInsight logs your correction; after 3–5 overrides on that task type, the AI retrains and will suggest 3 next time.

## Definition of done
- [ ] Client has seen a live AI prediction for at least one task type
- [ ] See Thru integration connected and tested (1 task synced successfully)
- [ ] Client understands the "AI Suggest" vs. "Override" workflow
- [ ] Historical job data (≥3 months) imported into FieldInsight
- [ ] Client knows how to flag low-confidence predictions for manual review
- [ ] Follow-up booked in 2 weeks to review first batch of AI-assisted schedules

## Related artefacts
- **FieldInsight → Settings → Integrations → See Thru** (API key setup)
- **See Thru → Job History export** (CSV template if no API)
- **Paul's AI development roadmap** (internal: ask for access if client wants feature previews)
- **Worker quality rating schema** (define in See Thru before sync: 1–5 scale or time-based percentile)
<!-- TODO: confirm if FieldInsight has a public changelog for AI model updates (20–50%/month claim) -->
