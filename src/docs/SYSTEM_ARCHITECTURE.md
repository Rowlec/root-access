# Root Access System Architecture

## Active Runtime

Root Access uses the Next.js App Router.

Primary routes:

```txt
/          Landing and startup context form
/result    Startup Proposal guided review workspace
/checkout  Fake Pro checkout for monetization validation
```

Server route:

```txt
/api/gemini/review
/api/gemini/proposal
```

The review route assesses section output. The proposal route creates a
structured editable draft from the student's completed notes; it does not make
unsupported factual claims or bypass the student's review.

## Important Files

```txt
src/app/page.tsx
src/app/result/page.tsx
src/app/checkout/page.tsx
src/app/api/gemini/review/route.ts
src/components/GoalForm.tsx
src/components/proposal/WorkflowReviewWorkspace.tsx
src/components/proposal/CheckoutClient.tsx
src/hooks/useCreditUsage.ts
src/lib/credit-policy.ts
src/lib/goal-form-schema.ts
messages/en.json
messages/vi.json
```

Older workflow components may remain in `src/components/workflow/` for legacy
reference, but they are not the active MVP runtime surface.

## Landing Flow

`src/app/page.tsx` renders:

```txt
LandingAnalytics
Hero
HowItWorks
AcademicIntegrityNotice
GoalForm
```

`GoalForm` collects:

- startup idea
- industry
- target customer

The form keeps the workflow deterministic. Startup Proposal is the only active
workflow. Compatibility defaults for urgency and model remain internal only.

## Result Flow

`src/app/result/page.tsx` renders a client entry point that restores the
startup context from localStorage, so project details are not put in the URL.

The workspace shows one review section at a time, then opens the Builder and
export stage only after all review sections are complete. Each section has:

- Action Layer: objective, starting prompt, copy button, paste output.
- Review Layer: output score, top weaknesses, improved prompt.
- Retry Layer: copy improved prompt, paste retry output, score comparison.

The editable Proposal Builder is the single source for preview and export. An
AI draft must be explicitly applied to that editor before it changes the file.

## Review API

`src/app/api/gemini/review/route.ts` calls Gemini once for the review bundle:

- Output Score Engine
- Weakness Detection
- Prompt Improvement Engine

The route validates request and response shapes with zod. The score dimensions
are:

- Relevance: 0-10
- Specificity: 0-10
- Clarity: 0-10
- Completeness: 0-10
- Actionability: 0-10
- Rubric Alignment: 0-10

Gemini returns a reason for every dimension. The server validates each score and
recomputes the total as 0-60. The same response includes strengths, weaknesses,
missing information, suggestions, and exact output passages for highlighting.

## Proposal Progress

Progress is tracked by section:

- Problem
- Customer
- Validation
- Revenue
- MVP Scope

The sidebar shows completed, current, and remaining sections. It should stay
compact on mobile and sticky on desktop.

## Persistence

Browser localStorage stores:

- startup context
- selected AI model
- review workspace state
- credit usage
- Pro demo plan state

Main keys:

```txt
root-access:startup-context
root-access:available-tools
root-access:workflow-review:${workflowRunId}
root-access:credit-usage:v1
root-access:credit-plan:v1
```

## Credit Structure

Credit policy lives in `src/lib/credit-policy.ts`.

Free:

- 5 prompt generations
- 5 output reviews
- 3 improved prompts

Pro:

- unlimited prompt generations
- unlimited output reviews
- unlimited improved prompts

`/checkout` is a fake checkout page. It activates Pro demo mode in localStorage
and does not process payment.

## Architecture Invariants

- Startup Proposal remains the only MVP workflow area.
- Root Access reviews AI outputs and improves prompts; it does not generate the
  final proposal.
- Workflow library remains static.
- Workflow selection remains deterministic.
- Prompt templates remain predefined.
- Tool adaptation remains rule-based.
- Output scoring, weakness detection, and prompt improvement call the server API.
- No Canva, PDF, PowerPoint, Excel, image, or website generation.
- No real payment integration.
- Academic integrity notices remain visible.
