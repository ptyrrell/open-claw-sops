---
title: "How to demo FieldInsight to a prospect"
slug: fieldinsight-demo-walkthrough
owner: Paul Tyrrell
status: live
summary: "Reusable demo playbook for the four FieldInsight pillars — scheduling, asset maintenance, project costing, AI roadmap. Built from the 2026-05-12 Ceri call."
source:
  type: loom
  url: https://www.loom.com/share/76c9625b7a524d46ad5060e1cbe55a9e
  label: "Ceri demo · 2026-05-12 9am AEST"
tags: [sales, demo, fieldinsight, playbook]
created: 2026-05-12
updated: 2026-05-12
related:
  - fieldinsight-demo-followup-email
  - fieldinsight-onboarding-scoping
---

## When to use this SOP

Use this when demoing FieldInsight to a prospect in the field service, fire & safety, or asset maintenance space. Typically a 20-30 minute screen-share call with a decision-maker or operations lead.

## Outcome

Prospect understands the four core pillars (reactive scheduling, asset maintenance, project costing, AI automation) and can self-identify fit. They know next steps (trial, implementation scope, pricing conversation) and have seen live examples of each workflow.

## Prerequisites

- FieldInsight demo environment loaded (live data preferable to sandbox)
- Prospect's industry/pain points noted in CRM (fire compliance? multi-site assets? cost tracking?)
- Screen-share tool ready (Zoom, Teams, Loom for async)
- Calendar link handy for follow-up if they want implementation call

## Steps

1. **Open with company context** — "I've run FieldInsight for 15 years, built for field service. Four pillars: scheduling, asset maintenance, project costing, AI. I'll show you each in about 5 minutes, then we'll talk fit."

2. **Pillar 1: Reactive job scheduling**
   - Navigate to scheduler view (drag-and-drop calendar).
   - Show how a reactive job lands → assign to technician → technician sees it mobile.
   - Highlight time tracking and parts capture: "Technician clocks on, logs materials used, we pull cost in real time."
   - **Watch out for:** If prospect mentions dispatch urgency, emphasise mobile push notifications and live map view.

3. **Pillar 2: Asset maintenance & compliance**
   - Open an asset record (e.g., fire panel, lift, HVAC unit).
   - Show customizable checklists: "AS1851 fire standard built in; you can clone and tweak any checklist."
   - Demonstrate drag-and-drop planned maintenance: "Schedule recurring inspections, system auto-assigns based on tech skills and location."
   - Show mobile SWMS (Safe Work Method Statement) or Take 5 workflow: "Before tech starts, they sign off safety doc on-site."
   - **Watch out for:** If they have multi-site assets, filter by site to show hierarchy.

4. **Pillar 3: Project costing with cost codes**
   - Open a project (job with multiple phases or cost centres).
   - Show cost-code structure: labour, materials, subcontractors.
   - Walk through: "Timesheet hours hit this code, supplier invoice (PO-backed) hits that code, live P&L per job."
   - Display a cost report: "You see margin before the job closes."
   - Mention supplier invoice integration: "POs go out, invoice comes back, we match line items."

5. **Pillar 4: Client portals & reporting**
   - Toggle to client portal view: "Customer logs in, sees their asset history, upcoming maintenance, lodges requests."
   - Open a live report (e.g., completed jobs this week, asset compliance dashboard).
   - Emphasise real-time: "No end-of-month lag; data flows as techs submit."

6. **AI roadmap (brief, manage expectations)**
   - "We're investing in AI. First use case: supplier invoice processing — OCR plus line-item matching to POs, cuts admin time."
   - "Next: CRM auto-triage, technician co-pilot for parts lookup and troubleshooting."
   - "AI features carry a small add-on cost; we'll discuss in pricing if you want them."
   - **Watch out for:** Don't oversell vaporware. Stick to "supplier invoices live now, CRM and co-pilot in pipeline."

7. **Probe for fit**
   - "Which of those four resonates most?"
   - "What's your current process for [their pain point]?"
   - Listen for: spreadsheet chaos, compliance gaps, can't see job margin, tech dispatch mess.

8. **Close with next steps**
   - If strong fit: "Let's book a scoping call — 30 min, map your workflows, size implementation."
   - If uncertain fit: "I'll send you a trial login; play with the mobile app and scheduler. Ping me questions."
   - Drop calendar link in chat or follow-up email same day.

## Decision tree

| Prospect says…                             | Your move                                                                 |
|--------------------------------------------|---------------------------------------------------------------------------|
| "We mostly do reactive callouts"           | Deep-dive Pillar 1 (scheduling, mobile time/parts). Skip project costing. |
| "Compliance is killing us (AS1851, etc.)"  | Lead with Pillar 2 (asset checklists, SWMS). Show audit trail.            |
| "We can't track job profitability"         | Lead with Pillar 3 (cost codes, PO-to-invoice). Show live margin report.  |
| "We want AI / automation"                  | Show supplier invoice AI, set realistic timeline for CRM/co-pilot.        |
| "Do you integrate with Xero / MYOB / SAP?" | Confirm which integrations live (supplier invoices → accounting common).  |

## Common objections / FAQ

**Q: How long to onboard?**  
A: 2-4 weeks for small team (<10 techs), 6-8 weeks if migrating asset data or custom checklists. We do the heavy lifting.

**Q: What if our checklists aren't AS1851?**  
A: Fully customizable. You send us your Word doc or PDF, we template it in the system, you tweak in the builder.

**Q: Mobile work offline?**  
A: Yes. Tech fills checklist offline, syncs when back in coverage. Photos and signatures cache locally.

**Q: Pricing model?**  
A: Per-user per-month SaaS. Tiers based on feature set (basic scheduling vs. full asset + projects). AI add-on separate. I'll email a quote after we scope.

**Q: Can we trial first?**  
A: Absolutely. 14-day sandbox or 30-day live trial with your data (we'll import a sample). No credit card to start.

## Definition of done

- [ ] Showed all four pillars (scheduling, assets, costing, AI) with live examples
- [ ] Identified prospect's top pain point and which pillar addresses it
- [ ] Answered at least one objection or integration question
- [ ] Confirmed next step (trial login sent, or scoping call booked, or "not a fit" noted in CRM)
- [ ] Follow-up email sent same day with Loom recording link, trial access, or calendar invite
- [ ] CRM updated: demo date, pain points, pipeline stage moved (if qualified)

## Related artefacts

- **FieldInsight trial signup form** (link in CRM or website /trial)
- **AS1851 compliance checklist template** (send PDF example if prospect asks)
- **Project costing one-pager** (PDF explainer of cost-code structure)
- **AI roadmap slide** (keep internal; share selectively if prospect asks for written proof)
- **Pricing calculator spreadsheet** (Paul's master copy; clone per prospect)
- **Post-demo follow-up email template** (slug: `fieldinsight-demo-followup-email`)
- **Onboarding scoping call SOP** (slug: `fieldinsight-onboarding-scoping`, use if they book next step)
