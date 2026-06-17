# Root Access System Architecture

## Folder Structure

Current important folders and files:

```txt
.
├── src
│   ├── app
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx
│   │   └── result
│   │       ├── loading.tsx
│   │       └── page.tsx
│   ├── components
│   │   ├── AcademicIntegrityNotice.tsx
│   │   ├── GoalForm.tsx
│   │   ├── analytics
│   │   │   └── LandingAnalytics.tsx
│   │   ├── feedback
│   │   │   └── FeedbackCard.tsx
│   │   ├── landing
│   │   │   ├── Hero.tsx
│   │   │   └── HowItWorks.tsx
│   │   ├── ui
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── textarea.tsx
│   │   └── workflow
│   │       ├── FeedbackForm.tsx
│   │       ├── ProgressTracker.tsx
│   │       ├── StepCard.tsx
│   │       └── WorkflowCompletion.tsx
│   ├── constants
│   │   └── links.ts
│   ├── data
│   │   ├── startup-workflow.json
│   │   └── workflows
│   │       ├── business-model.ts
│   │       ├── idea-validation.ts
│   │       ├── index.ts
│   │       ├── market-research.ts
│   │       ├── mvp-planning.ts
│   │       └── pitch-deck.ts
│   ├── hooks
│   │   └── useWorkflowProgress.ts
│   └── lib
│       ├── goal-form-schema.ts
│       ├── template-parser.ts
│       ├── utils.ts
│       ├── workflow-loader.ts
│       ├── workflow-parser.ts
│       └── workflow-selector.ts
├── types.ts
├── product-spec.md
├── tech-spec.md
└── workflow-spec.md
```

## Routing Structure

The app currently has two main routes:

```txt
/         Landing and intake form
/result   Workflow result page
```

### `/`

Implemented in `src/app/page.tsx`.

Renders:

1. `LandingAnalytics`
2. `Hero`
3. `HowItWorks`
4. `AcademicIntegrityNotice`
5. `GoalForm`

The landing page is the main entry point for students.

### `/result`

Implemented in `src/app/result/page.tsx`.

Responsibilities:

1. Read query params from the URL.
2. Validate that `idea` and `industry` exist.
3. Load the workflow.
4. Inject variables into prompt templates.
5. Render the workflow header and step tracker.
6. Show feedback and completion affordances.

Current query params produced by `GoalForm`:

```txt
stage
idea
industry
urgency
availableTools
```

Current `/result` runtime behavior only consumes:

```txt
idea
industry
availableTools
```

The `stage` and `urgency` params are included in the workflow input object, but
`stage` is not yet used to select one of the five workflow-library workflows.

## Component Hierarchy

Landing page:

```txt
src/app/page.tsx
├── LandingAnalytics
├── Hero
├── HowItWorks
├── AcademicIntegrityNotice
└── GoalForm
```

Result page:

```txt
src/app/result/page.tsx
├── WorkflowAnalytics
├── AcademicIntegrityNotice
├── ProgressTracker
│   ├── WorkflowCompletion
│   └── StepCard[]
└── FeedbackForm
    └── FeedbackCard
```

## State Flow

### Intake Form State

`GoalForm` is a client component.

State management:

- `react-hook-form` manages input state.
- `zod` validates the form through `goalFormSchema`.
- `localStorage` prefills previously selected available AI tools.
- On submit, the form pushes the user to `/result` with query params.

Validated fields:

- `currentStage`
- `startupIdea`
- `industry`
- `deadlineUrgency`
- `availableTools`

Stored tool preference key:

```txt
root-access:available-tools
```

The form validates stored tool preferences before using them and ignores
corrupted values.

### Workflow Progress State

`ProgressTracker` is a client component.

It delegates persistence and calculations to `useWorkflowProgress`.

Tracked values:

- `completedSteps`
- `completedCount`
- `totalSteps`
- `completionPercentage`
- `currentStepId`
- `abandonStepId`

The hook enforces sequential completion. Users can complete the current step,
but cannot skip ahead.

## Workflow Engine Flow

There are currently two workflow paths in the repository.

### Runtime Path Used Today

```txt
src/app/result/page.tsx
-> getStartupWorkflow()
-> src/data/startup-workflow.json
-> parseWorkflowVariables()
-> ProgressTracker
-> StepCard[]
```

This path uses the legacy `Workflow` and `WorkflowStep` interfaces from
`types.ts`.

### Expanded Library Path Ready For Integration

```txt
GoalForm currentStage
-> selectWorkflow(stage)
-> src/data/workflows/*
-> injectWorkflowVariables(template, variables)
-> workflow viewer
```

This path uses `StartupWorkflow` and `StartupWorkflowStep` from
`src/data/workflows/index.ts`.

The selector exists in `src/lib/workflow-selector.ts`, but the result page does
not yet use it.

## i18n Flow

The project context lists `next-intl`, but the current package and source files
do not show an implemented i18n layer.

Current state:

- No locale route segment is implemented.
- No message files are present.
- No `next-intl` provider is wired into `layout.tsx`.
- UI text is currently hardcoded in English.

Recommended future i18n flow:

```txt
locale route segment
-> message files
-> provider in layout
-> translated component strings
-> workflow data translated separately or locale-aware
```

Do not assume i18n exists until `next-intl` is installed and configured.

## Persistence Flow

Workflow progress persists through browser `localStorage`.

Storage key format:

```txt
root-access:workflow-progress:${workflowId}
```

Stored value:

```json
{
  "completedSteps": ["1", "2", "3"],
  "availableTools": ["ChatGPT", "Gemini"]
}
```

Important implementation details:

- Step IDs are normalized to strings before persistence.
- Available tools are persisted with the workflow progress context.
- Invalid stored step IDs are filtered out.
- Legacy array values are still accepted and normalized into the object shape.
- Stored completion is normalized to a sequential prefix.
- localStorage access is guarded for server rendering and browser errors.
- The hook uses `useSyncExternalStore` for hydration-safe subscription behavior.

Workflow completion analytics uses `sessionStorage` to avoid duplicate completion
events in the same browser session.

Completion event key format:

```txt
root-access:workflow-completion-tracked:${workflowId}
```

## Analytics Flow

Vercel Analytics is installed in the root app layout through:

```txt
src/app/layout.tsx
```

Tracked custom events:

- `Landing Visit`
- `Workflow Start`
- `Tool Selected`
- `Workflow Selected`
- `Tool Adapted`
- `Workflow Completion`
- `Tool Workflow Completion`
- `Feedback Click`

Event calls are placed in client components only.

Tool analytics payloads use primitive values only. Lists such as selected tools
and adapted tools are serialized as comma-separated strings. Startup idea text
is not sent to analytics.
