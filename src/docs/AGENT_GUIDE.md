# Root Access Agent Guide

## Project Identity

Root Access is an AI Workflow + Output Review + Prompt Improvement product for
Startup Proposal work.

Preserve these core rules:

- Startup Proposal is the only active MVP product area.
- The primary runtime experience is `WorkflowReviewWorkspace`.
- Root Access creates starting prompts, reviews pasted AI outputs, and improves
  prompts.
- Root Access does not generate the final proposal for the user.
- Proposal sections are static and rule-based.
- Tool adaptation is rule-based only.
- Output scoring, weakness detection, and prompt improvement call the server
  API.
- AI must not decide product flow or generate hidden workflow logic.

## Coding Conventions

Use the existing stack and style:

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn UI
- react-hook-form for forms
- zod for validation
- lucide-react for icons
- next-intl for UI messages
- Vercel Analytics for client-side events

Keep components small and purpose-specific.

Use shadcn primitives for UI consistency:

- `Button`
- `Card`
- `Input`
- `Select`
- `Textarea`
- `Badge`

Use `cn` from `src/lib/utils.ts` for conditional classes.

## Active Runtime Flow

The active path is:

```txt
GoalForm
-> /result query params
-> WorkflowReviewWorkspace
-> Action Layer
-> Review Layer
-> Retry Layer
```

The user flow is:

```txt
Generate Prompt -> Test with AI -> Paste Output -> Get Feedback
-> Copy Improved Prompt -> Retry -> Compare Scores
```

## Architecture Rules

### Keep Workflow Logic Rule-Based

Correct:

```txt
startup context -> static Startup Proposal section -> predefined prompt
```

Avoid:

```txt
startup context -> AI decides product workflow dynamically
```

### Keep The Review Engines API-Backed

These engines must call the server API:

- Output Score Engine
- Weakness Detection
- Prompt Improvement Engine

Current route:

```txt
src/app/api/gemini/review/route.ts
```

The API validates inputs and output JSON with zod. Gemini may review output and
improve the prompt, but it must not generate the final proposal section.

### Keep The UI Three-Layered

`WorkflowReviewWorkspace` should stay focused on:

- Action Layer: objective, prompt, copy button, paste output.
- Review Layer: score, weaknesses, improved prompt.
- Retry Layer: retry output, score comparison, complete section.

Do not reintroduce excessive accordions, long coaching text, tool-comparison
panels, or proposal export surfaces into the active MVP.

### Preserve Academic Integrity

Allowed:

- Starting prompts
- Review feedback
- Weakness diagnosis
- Prompt improvement
- Score comparison
- Verification reminders

Not allowed:

- "Write my final assignment"
- "Create complete submission"
- UI copy that implies the student can submit AI output directly
- Server routes that generate final proposal content

Keep `AcademicIntegrityNotice` visible on landing and result pages.

## Current Product Sections

The MVP tracks progress by five sections:

- Problem
- Customer
- Validation
- Revenue
- MVP Scope

These are proposal progress sections, not workflow categories. Do not add
Academic Report, Presentation Slides, Interview Prep, CV Builder, Website
Builder, or generic workflow-builder support.

## Credit Rules

Free:

- 5 prompt generations
- 5 output reviews
- 3 improved prompts

Pro:

- unlimited prompt generations
- unlimited output reviews
- unlimited improved prompts

No real payment integration. `/checkout` is a fake checkout that stores Pro demo
mode in localStorage.

## Next.js Guidance

The installed Next.js version may differ from older assumptions.

Before changing Next-specific code, read the relevant local docs in:

```txt
node_modules/next/dist/docs/
```

Examples:

- App Router pages
- layouts
- loading files
- metadata
- route handlers
- server and client component boundaries

## Client And Server Component Rules

Server-friendly components:

- Static landing sections
- Data loading pages
- Informational cards without browser APIs

Client components are required for:

- `useState`
- `useEffect`
- `useRouter`
- `localStorage`
- `sessionStorage`
- `navigator.clipboard`
- analytics `track` calls
- react-hook-form

When a component uses browser APIs, add `"use client";` at the top.

## Verification Checklist

Before finishing code changes, run:

```txt
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
```

For UI changes, manually check:

```txt
/
/result?idea=AI+for+students&industry=Education&targetCustomer=FPT+students&urgency=1+week&availableTools=Gemini
/result
/checkout
```

For review API changes:

- Missing key returns a controlled `missing_api_key` JSON error.
- Invalid input returns a controlled validation error.
- Valid input returns score, weaknesses, improved prompt, and why-better text.
