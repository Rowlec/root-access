# Root Access

Root Access is a workflow-guided AI assistant for FPT University students working
on startup proposal assignments.

The product does not generate final submissions. It helps students plan,
outline, research, draft prompts, verify assumptions, and move through a
structured startup proposal workflow.

## Current MVP

The MVP supports startup proposal work across five deterministic workflow
branches:

- Idea Validation
- Market Research
- Business Model Design
- MVP Planning
- Pitch Deck Preparation

The app includes:

- Rule-based workflow selection
- Tool-aware prompt adaptation
- EN/VI localization
- Progress persistence
- Vercel Analytics events
- Academic integrity notices
- Loading, empty, error, and 404 states
- User validation documentation

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Quality Checks

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## User Validation

Phase 6 is a real-user test, not a code feature. Use these files:

- `src/docs/USER_VALIDATION_PLAN.md`
- `src/docs/USER_VALIDATION_SCORECARD.md`
- `src/docs/USER_VALIDATION_RESULTS.md`

Recommended test:

- Group A: students use ChatGPT directly.
- Group B: students use Root Access.

Measure:

- Time to first useful draft
- Prompt revision count
- Workflow completion
- Proposal structure clarity
- Student confidence
- Reuse intent

## Academic Integrity

Root Access supports:

- Planning
- Outlining
- Research direction
- Drafting support

Root Access does not:

- Replace original student work
- Guarantee correctness
- Encourage direct submission of AI output
