---

# RootAccess Final MVP Sprint Plan

## Objective

Finalize RootAccess into a coherent, usable, monetizable MVP for CP3.

Focus:

* reduce friction
* improve UX clarity
* stabilize scoring loop
* complete monetization flow
* complete exportable proposal flow
* support bilingual flow
* deploy production-ready

Do NOT refactor architecture unless necessary.

---

# Phase 1 — Navigation + Layout Fixes

Priority: Critical

## Tasks

### 1. Add Back to Home button

Requirement:

When user enters build page:

```text
Home ← Build Flow
```

Persistent on top-left.

Purpose:

reduce navigation dead-end.

---

### 2. Move Credit UI

Current problem:

credit shown too aggressively.

Fix:

Move credit display into:

Option A:

```text
sticky footer section
```

Preferred.

Or:

Option B:

```text
header right compact badge
```

If header exists.

Add tooltip:

```text
1 review = 1 credit
1 improve = 1 credit
```

Must explain usage.

---

### 3. Add proper top header

Include:

* back button
* current proposal title
* language switcher
* credit badge
* profile/avatar (if logged in)

Goal:

make product feel complete.

---

Success criteria:

navigation feels stable.

---

# Phase 2 — Progress Lock System

Priority: Critical

## Tasks

### Lock future steps

Current issue:

users can jump everywhere.

Fix:

Only unlock:

```text
current step
previous steps
```

Future steps:

disabled.

Visual:

```text
opacity 50%
lock icon
```

Rules:

Unlock next only after:

```text
output submitted
```

Not after copy prompt.

---

Success criteria:

workflow becomes sequential.

---

# Phase 3 — Credit Confirmation System

Priority: Critical

## Tasks

Before any:

* Review
* Improve

Show modal:

```text
This action costs 1 credit.
Do you want to continue?
```

Buttons:

* Confirm
* Cancel

Show remaining credits.

Example:

```text
Remaining after action: 4 credits
```

Do NOT deduct before API success.

Only deduct after success.

Important.

---

Success criteria:

user understands spending.

---

# Phase 4 — Gemini Production Setup

Priority: Critical

## Tasks

Move Gemini API key to Vercel env:

Variable:

```text
GEMINI_API_KEY
```

Refactor all API calls:

Use:

```text
process.env.GEMINI_API_KEY
```

No hardcoded keys.

Add error fallback:

```text
AI service unavailable.
Please retry.
```

---

Success criteria:

production safe.

---

# Phase 5 — Clerk Authentication

Priority: High

## Tasks

Add Clerk auth.

Required flows:

* sign up
* sign in
* sign out

Store:

* credit balance
* proposal history
* prompt history
* score history

Guest mode optional.

Recommended:

Guest:

```text
3 free credits
```

Signed in:

```text
persistent credits
```

Purpose:

unlock retention.

---

Success criteria:

users can persist progress.

---

# Phase 6 — Full Vietnamese Response Support

Priority: High

## Tasks

Current issue:

UI may be VN but AI returns EN.

Fix:

Pass locale into all prompts.

Example:

If locale:

```text
vi
```

Append:

```text
Return all responses in Vietnamese.
```

If:

```text
en
```

Append:

```text
Return all responses in English.
```

Must affect:

* review
* weakness detection
* prompt improvement

---

Success criteria:

language consistency.

---

# Phase 7 — Score Visualization Upgrade

Priority: High

## Tasks

Add score colors:

Range:

```text
1–3 = red
4–6 = orange
7–8 = yellow
9–10 = green
```

Apply to:

* Relevance
* Specificity
* Clarity
* Actionability

Animated progress bar preferred.

---

Success criteria:

score easier to understand.

---

# Phase 8 — Improve Prompt Decision Gate

Priority: High

Current issue:

system auto-improves immediately.

Bad.

Fix:

After scoring:

Show:

```text
Do you want to improve this prompt?
```

Options:

* Yes, improve (costs 1 credit)
* No, continue

Only call improve after confirmation.

---

Success criteria:

user controls improvement.

---

# Phase 9 — Prompt Comparison Engine

Priority: High

## Tasks

After improved output:

Show comparison:

---

Before:

```text
Prompt Score: 24
Weaknesses:
- customer too broad
- pain too vague
```

After:

```text
Prompt Score: 33
Improved:
+ clearer customer segment
+ stronger urgency
```

Visual:

```text
24 → 33
```

Must show:

* what improved
* what still weak

Important for trust.

---

Success criteria:

improvement feels visible.

---

# Phase 10 — Fix Regression Bug

Priority: Critical

Current issue:

Improved prompt sometimes scores lower.

Fix logic:

Before improvement:

store:

```text
baseline score
```

After improvement:

If:

```text
new score < old score
```

Run validation:

Ask Gemini:

```text
Does this improved prompt actually improve specificity, relevance, clarity, or actionability?
```

If not:

retry improvement.

Max:

```text
2 retries
```

Never show obviously worse improved prompts.

---

Success criteria:

improvement should statistically trend upward.

---

# Phase 11 — Proposal Export System

Priority: Critical

## Tasks

Build final proposal compilation.

Combine:

* problem
* customer
* validation
* market segment
* revenue
* differentiation
* MVP scope
* proposal outline

Output:

Option 1:

TXT export

Option 2:

DOCX export (preferred)

Option 3:

Copy all

Structure:

```text
Startup Proposal Draft
```

Submission-ready.

This is mandatory.

This is your “final product”.

Without this, RootAccess feels unfinished.

---

Success criteria:

user can submit something real.

---

# Execution Order (STRICT)

Do in this order:

```text
1. Navigation + layout
2. Progress lock
3. Credit modal
4. Gemini env
5. Clerk auth
6. Language consistency
7. Score UI
8. Improve gate
9. Comparison engine
10. Regression fix
11. Proposal export
```

Do not change order.

This order minimizes breakage.
