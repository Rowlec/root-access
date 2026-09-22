# Root Access — CP1 One-Week Execution Plan

This document is the source of truth for the final week before CP1. The goal is
not to expand the product into a generic chatbot. The goal is to demonstrate a
deployable, measurable product that helps FPTU students use AI through a guided
startup-proposal workflow.

## CP1 demo definition

The demo is successful when the team can show this story without editing data
manually:

```text
Sign in
  -> open the ChatGPT-style workspace
  -> create a project
  -> enter the guided proposal workflow
  -> generate, review and improve one section
  -> refresh and restore the project
  -> show server-side credit usage
  -> start a payOS checkout
  -> open the protected admin dashboard
  -> explain the activity funnel
```

## What is implemented in the repository

- Next.js 16 application and the existing five-section guided workflow.
- Gemini generate, review, improve and proposal-draft endpoints.
- Clerk authentication integration and a Next.js 16 `proxy.ts` protection layer.
- PostgreSQL schema for users, projects, messages, workflow state, wallets,
  credit ledger, orders, payment events, analytics and admin audit logs.
- Drizzle migration in `drizzle/`.
- `/app` workspace with a left project/tool sidebar and right work area.
- Server-side project creation and project ownership checks.
- Periodic workflow-state sync to PostgreSQL with local fallback.
- Atomic credit debit and refund around every Gemini endpoint.
- payOS payment-link creation and signature-verified, idempotent webhook crediting.
- `user` and `admin` roles with server-side authorization.
- `/admin` metrics for users, projects, AI success, revenue, event funnel and
  orders.
- Production build, TypeScript and ESLint checks.

## Seven-day schedule

| Day | Work | Exit criterion |
| --- | --- | --- |
| 1 | Create managed PostgreSQL, set environment variables, run migration | `/app` creates a persisted project |
| 2 | Configure Clerk production instance and `ADMIN_USER_IDS` | User is redirected to `/app`; only the admin opens `/admin` |
| 3 | Configure payOS test channel and production webhook | One sandbox order is credited exactly once |
| 4 | Run full proposal flow and verify cross-refresh restore | Project progress restores after refresh and a new session |
| 5 | Run five student usability tests and record metrics | Five scorecards and top three confusion points exist |
| 6 | Freeze code, run QA, collect screenshots and record backup demo | Build, lint, typecheck and smoke test pass |
| 7 | Rehearse the 15-minute presentation and Q&A | Two rehearsals finish in 14–15 minutes |

## Daily freeze rules

- No new workflow domain before CP1.
- No visual redesign after Day 5 unless it blocks the demo.
- Do not demonstrate a real payment without a prepared test order.
- Keep a screen recording and seeded demo account as fallback.
- Never claim user-validation results that have not been collected.

## Presentation timeline (15 minutes)

| Time | Slide/demo |
| ---: | --- |
| 0:00–1:30 | Problem, primary customer and job-to-be-done |
| 1:30–3:30 | Week 1–4 achievements and Week 1–14 timeline |
| 3:30–6:30 | Product–Market Fit Canvas |
| 6:30–8:30 | Core technology architecture |
| 8:30–10:00 | Product and technology roadmap |
| 10:00–13:00 | Live MVP demo |
| 13:00–14:30 | Admin metrics and validation targets |
| 14:30–15:00 | Decision, risks and next experiment |

## Product–Market Fit Canvas content

### Customer and job

Primary segment: FPTU students completing EXE201 or another startup-proposal
assignment. Their job is to create a defensible first proposal draft without
guessing the next step, prompt or quality standard.

Stakeholder priority:

1. Individual FPTU students.
2. Student team leaders and project teams.
3. Lecturers and mentors who influence adoption.

### Alternatives

ChatGPT or Gemini with self-written prompts, social-media prompt collections,
old proposals, friends and mentors, and static Google Docs/Notion templates.

### Problems and needs

- Blank-chat anxiety and no clear first action.
- Generic AI output and weak prompts.
- No rubric for judging an answer.
- Too many retries and inconsistent proposal sections.
- No structured progress or reusable history.
- Academic-integrity and fabricated-fact concerns.

### Key features

Guided workspace, five proposal sections, generate-review-improve loop, rubric
scoring, project history, editable proposal export, credit wallet, verified
payment and admin product-intelligence dashboard.

### Channels and channel value

- EXE201 classroom demo: reaches students at the moment of need.
- Lecturer and mentor referral: creates trust.
- FPTU entrepreneurship clubs: supplies relevant pilot users.
- Student Facebook/Zalo groups and short demo videos: show before/after output.
- Peer referral: low acquisition cost inside student teams.

### User experience

The intended perceived values are: “I know what to do next,” “I understand why
the AI answer is weak,” “I spend less time guessing prompts,” and “I remain in
control of the final submission.”

### Success thresholds

- At least 65% activation: signed-up user creates a project and runs one AI action.
- At least 70% complete one guided workflow.
- At least 20% lower median time to a useful first draft than ChatGPT-only.
- At least 30% fewer prompt retries.
- At least 20% average score improvement after the improve step.
- At least 60% of tested students intend to reuse the product.
- At least 95% payment success and 98% AI request success.
- Zero duplicate credit grants and zero negative wallet balances.

North Star Metric: weekly users who complete at least one reviewed proposal
section.

## Architecture explanation

```text
Browser
  -> Next.js App Router UI
  -> Server Components / Route Handlers / Server Actions
  -> Clerk authentication and role checks
  -> PostgreSQL through Drizzle
     -> project and workflow history
     -> append-only credit ledger
     -> orders and verified payment events
     -> product analytics
  -> Gemini API through the credit guard
  -> payOS checkout; only the verified webhook grants credits
  -> Vercel deployment
```

The return URL never grants credits. The payOS webhook signature is verified,
the payment event has a unique provider key, and the order update plus credit
grant run in one database transaction.

## Demo seed checklist

- One admin Clerk user whose ID is in `ADMIN_USER_IDS`.
- One normal user to prove `/admin` authorization.
- One project at 40% progress.
- One completed review showing before/after score improvement.
- One paid sandbox order and one pending order.
- At least ten analytics events in the admin funnel.

## Q&A decisions

**Why not clone ChatGPT?** The familiar shell reduces learning cost; the guided
workflow, rubric and next-action engine are the product differentiation.

**Why credits instead of unlimited usage?** Credits make AI cost visible,
provide a simple student purchase model and allow server-side cost control.

**Why Clerk plus a local user table?** Clerk remains the identity source. The
local row stores product role, status, wallet ownership and queryable analytics.

**Why PostgreSQL?** Projects, wallet transactions, orders and webhook
idempotency require constraints and atomic transactions.

**How is academic integrity handled?** The product labels output as a draft,
requires review, exposes missing evidence and asks students to verify and edit
before export.
