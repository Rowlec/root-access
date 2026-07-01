# Root Access Data Schema

## Active Runtime Schema

The active MVP no longer renders a generated proposal builder. `/result`
renders `WorkflowReviewWorkspace`, which stores prompt-review state by proposal
section.

Active sections:

```ts
type WorkflowSectionId =
  | "problem"
  | "customer"
  | "validation"
  | "revenue"
  | "mvpScope";
```

Stored section state:

```ts
type SectionState = {
  completed: boolean;
  copiedPrompt: boolean;
  improvedPromptCopied: boolean;
  originalOutput: string;
  originalPrompt: string;
  originalReview: OutputReview | null;
  retryOutput: string;
  retryReview: OutputReview | null;
};
```

localStorage key:

```txt
root-access:workflow-review:${workflowRunId}
```

## Review API Request

Route:

```txt
src/app/api/gemini/review/route.ts
```

Request body:

```ts
{
  context: {
    startupIdea: string;
    industry: string;
    targetCustomer?: string;
    deadlineUrgency: string;
  };
  originalPrompt: string;
  output: string;
  previousScore?: number;
  section: string;
}
```

## Review API Response

Response body:

```ts
{
  model: string;
  review: {
    score: {
      total: number;
      breakdown: {
        relevance: number;
        specificity: number;
        actionability: number;
        clarity: number;
      };
      explanation: string;
    };
    weaknesses: string[];
    improvedPrompt: string;
    whyBetter: string;
  };
}
```

Rules:

- Each dimension is 0-10.
- `total` is recomputed server-side from the four dimensions.
- `weaknesses` is capped at the top two items.
- The improved prompt helps the user retry externally.
- The API must not return a final proposal section.

## User Input Schema

Form schema file:

```txt
src/lib/goal-form-schema.ts
```

Type exported by zod:

```ts
GoalFormValues
```

Current fields:

```ts
{
  workflowMode: "quick" | "deep";
  currentStage: string;
  startupIdea: string;
  industry: string;
  targetCustomer: string;
  deadlineUrgency: string;
  availableTools: string[];
}
```

Runtime form fields shown to users:

```txt
startupIdea
industry
targetCustomer
deadlineUrgency
availableTools
```

`workflowMode` and `currentStage` remain internal compatibility defaults.

Deadline urgency options:

```txt
1-3 days
1 week
2 weeks+
No deadline
```

Available AI tool options:

```txt
ChatGPT
Gemini
```

Validation rules:

- `startupIdea` is required, trimmed, and must contain at least 3 characters.
- `industry` is required and trimmed.
- `deadlineUrgency` is required and must be one of the defined options.
- `availableTools` must contain one supported AI model: ChatGPT or Gemini.

Tool preference persistence:

```txt
localStorage key: root-access:available-tools
```

## URL Query Schema

Created by:

```txt
src/components/GoalForm.tsx
```

URL format:

```txt
/result?mode=deep&stage=No+clear+idea+yet&idea=...&industry=...&targetCustomer=...&urgency=...&availableTools=Gemini
```

Current reader:

```txt
src/app/result/page.tsx
```

Currently consumed:

```txt
idea
industry
targetCustomer
urgency
availableTools
```

Current runtime behavior:

- `/result` validates context and renders `WorkflowReviewWorkspace`.
- `availableTools[0]` becomes the selected external AI model.
- Startup Proposal is the only active workflow.

## Credit Schema

Credit policy file:

```txt
src/lib/credit-policy.ts
```

Storage keys:

```txt
root-access:credit-usage:v1
root-access:credit-plan:v1
```

Actions:

```ts
type CreditAction =
  | "generation"
  | "review"
  | "improvement"
  | "refinement"
  | "proposalDraft";
```

`refinement` and `proposalDraft` remain compatibility actions for legacy code.
The active MVP uses:

- `generation`
- `review`
- `improvement`

Free limits:

```txt
generation: 5
review: 5
improvement: 3
```

Pro limits:

```txt
generation: unlimited
review: unlimited
improvement: unlimited
```

## Legacy Workflow Data

Legacy workflow data and components may remain in the repository for reference,
but they are not the active runtime surface.

Legacy files include:

```txt
src/data/startup-workflow.json
src/data/workflows/*
src/components/workflow/*
src/hooks/useWorkflowProgress.ts
```

Do not expand these legacy surfaces for new MVP work unless the product direction
explicitly changes again.

## Analytics Event Schema

Analytics provider:

```txt
@vercel/analytics
```

Installed in:

```txt
src/app/layout.tsx
```

Tracked events may include legacy workflow names. Do not send startup idea text
to analytics. Tool lists should remain primitive values because Vercel Analytics
custom event properties only support primitive values.
