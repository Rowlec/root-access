# RootAccess CP3 Refactor Plan

## Mission

Refactor RootAccess into a clear, focused MVP for Checkpoint 3.

Current issues:

* product identity is unclear
* too much cognitive overload
* workflow is easy to bypass
* scoring lacks trust
* retention is weak
* monetization does not match user willingness

Goal:

Transform RootAccess into a domain-specific AI workflow improvement system for Startup Proposal only.

Core positioning:

```text
RootAccess helps students build better Startup Proposals with AI by guiding them step-by-step, reviewing AI outputs, and improving prompts iteratively.
```

Non-goals:

```text
Do NOT add:
- presentation generator
- pdf export generator
- slide maker
- canva integration
- academic report workflows
- multi-domain workflows
```

Keep scope tight.

---

# Phase 1 — Product Identity Cleanup

## Goal

Make the product understandable in under 5 seconds.

Tasks:

### 1. Rewrite landing page copy

Replace vague workflow wording.

Use:

Hero:

```text
Build better Startup Proposals with AI, step by step.
```

Sub:

```text
Generate prompts, test outputs, detect weaknesses, and improve until your proposal is strong.
```

---

### 2. Rename UI labels

Replace:

```text
Workflow
Micro-step
Prompt library
Milestone
```

With:

```text
Proposal Section
Build Step
AI Improvement Loop
Proposal Progress
```

---

### 3. Remove multi-workflow options

Keep only:

```text
Startup Proposal
```

Add placeholder:

```text
More workflows coming later.
```

---

Success criteria:

* user instantly understands what RootAccess does
* no wording implies “prompt library”

---

# Phase 2 — Rebuild Workflow Structure

## Goal

Reduce overload.

Refactor all current milestones into:

---

## Section A — Action Layer (default open)

Show only:

* title
* objective
* generated prompt
* copy button
* paste output field

Minimal.

---

## Section B — Learn Layer (collapsed)

Contains:

* why this prompt works
* tool choice reasoning
* prompt comparison

Hidden by default.

---

## Section C — Review Layer (locked)

Only appears after output paste.

Contains:

* score
* weaknesses
* improved prompt
* retry button

---

Rules:

* no long text visible by default
* no checklist before action
* action first

---

Success criteria:

* user sees one action at a time
* low cognitive load

---

# Phase 3 — Domain-Specific Review Engine

## Goal

Prevent easy bypass.

Build structured Startup Proposal review.

Create 5 review frameworks:

---

## Problem Review

Check:

* specificity
* urgency
* frequency
* validation ability

---

## Customer Review

Check:

* narrowness
* pain intensity
* reachability

---

## Revenue Review

Check:

* realism
* willingness to pay
* scalability

---

## MVP Review

Check:

* scope clarity
* feasibility
* testability

---

## Differentiation Review

Check:

* uniqueness
* defensibility
* user value clarity

---

Rules:

No generic writing feedback.

Only business logic.

---

Success criteria:

RootAccess feedback must feel specialized.

---

# Phase 4 — Stable Scoring System

## Goal

Increase trust.

Build scoring rubric:

4 dimensions:

---

## Relevance (0–10)

Measures fit to current step.

---

## Specificity (0–10)

Measures precision.

---

## Clarity (0–10)

Measures understandable structure.

---

## Actionability (0–10)

Measures usefulness for proposal.

---

Each score must include:

```text
Why this score?
```

Example:

```text
Specificity: 4/10
Reason: target customer still too broad.
```

Rules:

No random scoring.

Must be deterministic.

---

Success criteria:

same output = same score.

---

# Phase 5 — AI Weakness Detection + Prompt Improvement

## Goal

Use Gemini API only where necessary.

Build:

---

## Weakness Detection

Input:

* current step
* original prompt
* user output
* score breakdown

Return:

* top 2 weaknesses only

---

## Prompt Improvement

Input:

* original prompt
* weaknesses

Return:

* improved prompt
* why improved

---

Rules:

API only triggers after user action.

Never auto-run.

---

Success criteria:

feedback loop feels smart, not noisy.

---

# Phase 6 — Version History

## Goal

Increase retention.

Build:

---

## Prompt Version History

Track:

```text
v1
v2
v3
```

---

## Output History

Track:

```text
Output 1 → score
Output 2 → score
```

---

## Improvement Timeline

Visual:

```text
21 → 28 → 35
```

---

Success criteria:

user sees progress over time.

---

# Phase 7 — Monetization Alignment

## Goal

Match CP3 BMC.

Remove subscription-first UI.

Replace with:

---

Free:

```text
5 reviews
3 improvements
```

---

Starter:

```text
20 credits — 19k
```

---

Pro:

```text
50 credits — 39k
```

---

Rules:

UI only.
No real payment needed.

Must include checkout flow.

Required for BMC consistency.

---

# Phase 8 — Data Moat Tracking

## Goal

Start collecting product intelligence.

Track:

* most common weaknesses
* most failed steps
* average score improvements
* drop-off points
* most retried prompts

Build simple internal dashboard.

Can be basic.

---

Success criteria:

RootAccess learns from users.

---

# Build Order (strict)

Do in exact order:

```text
1. Product identity cleanup
2. Workflow structure refactor
3. Domain review engine
4. Stable scoring system
5. Gemini integration
6. Version history
7. Credit model UI
8. Analytics dashboard
```

Do not skip order.

Each phase must be stable before next.
