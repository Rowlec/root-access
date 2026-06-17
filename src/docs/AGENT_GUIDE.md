# Root Access Agent Guide

## Project Identity

Root Access is a rule-based workflow library for student startup proposal work.

When continuing this project, preserve the core distinction:

- It is not an AI content generator.
- It is not an AI workflow generator.
- It selects prebuilt workflows and injects user variables into prompt templates.

## Coding Conventions

Use the existing stack and style:

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn UI
- react-hook-form for forms
- zod for validation
- lucide-react for icons
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

## Naming Conventions

Use clear product-oriented names.

Recommended:

- `Workflow`
- `WorkflowStep`
- `StartupWorkflow`
- `StartupWorkflowStep`
- `GoalFormValues`
- `TemplateVariables`
- `selectWorkflow`
- `injectWorkflowVariables`
- `useWorkflowProgress`

Avoid vague names:

- `data`
- `item`
- `stuff`
- `processor`
- `magic`

Workflow IDs should be kebab-case:

```txt
idea-validation
market-research
business-model-design
mvp-planning
pitch-deck-preparation
```

Component files should use PascalCase:

```txt
GoalForm.tsx
ProgressTracker.tsx
StepCard.tsx
```

Library files should use kebab-case:

```txt
workflow-selector.ts
template-parser.ts
goal-form-schema.ts
```

## Architecture Rules

### Keep Workflow Selection Rule-Based

Workflow selection must remain deterministic.

Correct:

```txt
currentStage -> selectWorkflow(stage) -> prebuilt workflow
```

Avoid:

```txt
currentStage -> AI decides workflow dynamically
```

### Keep Prompt Templates Static

Prompt templates should live in workflow data files.

Template injection should only replace known placeholders:

- `[STARTUP IDEA]`
- `[INDUSTRY]`

Do not add runtime prompt generation unless the product direction changes.

### Keep Business Logic Out Of UI Components

Preferred separation:

- Form validation in `src/lib/goal-form-schema.ts`
- Workflow selection in `src/lib/workflow-selector.ts`
- Template injection in `src/lib/template-parser.ts`
- Progress persistence in `src/hooks/useWorkflowProgress.ts`
- UI rendering in `src/components/*`

### Preserve Academic Integrity

Do not add features that generate final assignments directly.

Allowed:

- Structure
- Research prompts
- Outlines
- Drafting guidance
- Review prompts
- Verification reminders

Not allowed:

- "Generate final proposal"
- "Write my assignment"
- "Create complete submission"
- UI copy that implies the student can submit AI output directly

Keep `AcademicIntegrityNotice` visible on landing and workflow pages.

## Things That Must Not Be Changed Casually

Do not change these without a clear product reason:

- The rule-based workflow selection model
- Academic integrity positioning
- The five core startup workflow scopes
- The Google Form URL constant location
- localStorage progress persistence behavior
- Sequential step completion rule
- Vercel Analytics event names, unless updating analytics docs too

Do not silently remove:

- `AcademicIntegrityNotice`
- `ProgressTracker`
- `WorkflowCompletion`
- `FeedbackCard`
- `LandingAnalytics`

## Current Integration Warning

The project has both:

- a legacy JSON workflow used by `/result`
- a newer five-workflow TypeScript library used by `workflow-selector`

Before expanding features, decide whether the task touches runtime behavior.

If the task asks to change the active workflow experience, update `/result` to
use:

```txt
stage query param
-> selectWorkflow(stage)
-> selected workflow
-> template injection
-> workflow UI
```

If the task only asks for data-library changes, update `src/data/workflows/*`.

## Next.js Guidance

This project includes an `AGENTS.md` warning that the installed Next.js version
may differ from older assumptions.

Before changing Next-specific code, read the relevant local docs in:

```txt
node_modules/next/dist/docs/
```

Examples:

- App Router pages
- layouts
- loading files
- metadata
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

## How Future Sessions Should Continue

Start by checking actual code state, not just documentation.

Recommended first commands:

```txt
rg --files src
npm run lint
npx tsc --noEmit
```

For UI work:

- Inspect current component usage.
- Preserve shadcn patterns.
- Keep mobile layout first-class.
- Avoid changing data structure unless requested.

For workflow-engine work:

- Read `src/data/workflows/index.ts`.
- Read `src/lib/workflow-selector.ts`.
- Read `src/lib/template-parser.ts`.
- Check whether `/result` has been migrated from the legacy JSON workflow.

For progress work:

- Read `src/hooks/useWorkflowProgress.ts`.
- Preserve sequential completion.
- Preserve localStorage key format unless a migration is planned.

## Verification Checklist

Before finishing code changes, run:

```txt
npx tsc --noEmit
npm run lint
npm run build
```

For UI changes, manually check:

- `/`
- `/result?stage=No+clear+idea+yet&idea=AI+for+students&industry=Education&urgency=1+week`
- `/result` empty state
- mobile viewport
- desktop viewport

