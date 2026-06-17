# Root Access Data Schema

## Legacy Runtime Workflow Schema

Defined in:

```txt
types.ts
```

Used by:

```txt
src/data/startup-workflow.json
src/lib/workflow-loader.ts
src/lib/workflow-parser.ts
src/components/workflow/ProgressTracker.tsx
src/components/workflow/StepCard.tsx
src/app/result/page.tsx
```

Schema:

```ts
export interface Workflow {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: number;
  title: string;
  goal: string;
  tool: string;
  originalTool?: string;
  adaptedTool?: string;
  promptTemplate: string;
  expectedOutput: string;
  commonMistakes: string[];
}
```

Current JSON workflow:

- id: string
- title: `Startup Proposal Workflow`
- category: startup proposal category text
- estimatedTime: human-readable string
- steps: exactly 7 steps

Step IDs are numeric in the JSON workflow, but are converted to strings by the
progress hook.

## Expanded Workflow Library Schema

Defined in:

```txt
src/data/workflows/index.ts
```

Used by:

```txt
src/data/workflows/*.ts
src/lib/workflow-selector.ts
```

Schema:

```ts
export interface StartupWorkflowStep {
  title: string;
  goal: string;
  recommendedTool: string;
  originalRecommendedTool?: string;
  adaptedRecommendedTool?: string;
  promptTemplate: string;
  expectedOutput: string;
  commonMistakes: readonly string[];
}

export interface StartupWorkflow {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  steps: readonly StartupWorkflowStep[];
}
```

Current workflow IDs:

```txt
idea-validation
market-research
business-model-design
mvp-planning
pitch-deck-preparation
```

Important difference from the legacy schema:

- New steps do not include numeric `id`.
- New steps use `recommendedTool`.
- Tool-aware selected steps may include `originalRecommendedTool` and
  `adaptedRecommendedTool` metadata for display.
- Legacy UI currently expects `id` and `tool`.
- Integration requires either adapting the viewer or normalizing the workflow
  shape before rendering.

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
  currentStage: string;
  startupIdea: string;
  industry: string;
  deadlineUrgency: string;
  availableTools: string[];
}
```

Current stage options:

```txt
No clear idea yet
Have idea but not validated
Doing market research
Building business model
Preparing pitch deck
```

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
Claude
Canva AI
Gamma
Perplexity
Lovable
Other
```

Validation rules:

- `currentStage` is required and must be one of the defined options.
- `startupIdea` is required, trimmed, and must contain at least 3 characters.
- `industry` is required and trimmed.
- `deadlineUrgency` is required and must be one of the defined options.
- `availableTools` is required and must contain at least one defined tool.

Tool preference persistence:

```txt
localStorage key: root-access:available-tools
```

Stored value:

```json
["ChatGPT", "Gemini"]
```

Rules:

- Saved after a valid intake form submission.
- Used to prefill `availableTools` on return visits.
- Stored values are validated with `availableToolsSchema`.
- Missing, invalid, or corrupted values are ignored; invalid values are removed.

Legacy interface:

```ts
export interface UserGoalInput {
  currentStage: string;
  startupIdea: string;
  industry: string;
  deadlineUrgency: string;
  availableTools: string[];
}
```

`UserGoalInput` is currently used by the legacy workflow parser.

## URL Query Schema

Created by:

```txt
src/components/GoalForm.tsx
```

URL format:

```txt
/result?stage=...&idea=...&industry=...&urgency=...&availableTools=ChatGPT&availableTools=Gemini
```

Current reader:

```txt
src/app/result/page.tsx
```

Currently consumed:

```txt
stage
idea
industry
urgency
availableTools
```

Current runtime behavior:

- `idea` and `industry` are injected into prompt templates.
- `stage`, `urgency`, and `availableTools` are included in the workflow input
  object.
- `availableTools` is validated against the form tool options before entering
  workflow context.

Expected next step:

- Use `stage` and `availableTools` to select and adapt a workflow through
  `selectWorkflow(stage, availableTools)`.
- Optionally use `urgency` for UI copy or analytics only.

## Template Variables Schema

Defined in:

```txt
src/lib/template-parser.ts
```

Schema:

```ts
export interface TemplateVariables {
  startupIdea: string;
  industry: string;
}
```

Supported placeholders:

```txt
[STARTUP IDEA]
[INDUSTRY]
```

No other placeholders are supported today.

Runtime prompt adaptation:

- Stored prompt templates remain static.
- If a workflow tool is adapted, explicit mentions of the original tool in the
  prompt template are replaced with the adapted tool.
- Tool-name replacement runs before `[STARTUP IDEA]` and `[INDUSTRY]`
  interpolation.

## Progress Schema

Hook:

```txt
src/hooks/useWorkflowProgress.ts
```

Hook input:

```ts
{
  workflowId: string;
  stepIds: string[];
  availableTools: string[];
}
```

Hook state:

```ts
{
  completedSteps: string[];
  completedCount: number;
  totalSteps: number;
  completionPercentage: number;
  currentStepId?: string;
  abandonStepId?: string;
}
```

localStorage key:

```txt
root-access:workflow-progress:${workflowId}
```

localStorage value:

```json
{
  "completedSteps": ["1", "2", "3"],
  "availableTools": ["ChatGPT", "Gemini"]
}
```

Rules:

- Completed steps are stored as strings.
- Available tools are stored with the workflow progress context.
- Legacy array values such as `["1", "2", "3"]` are still accepted and
  normalized into the object shape.
- Users cannot skip ahead.
- Completing a step appends the current step.
- Unchecking a completed step truncates all later completed steps.
- Invalid or out-of-order stored progress is normalized.

## Feedback Schema

The current MVP does not store feedback in the application database.

Feedback is collected through Google Forms.

Constant:

```txt
src/constants/links.ts
```

Value:

```ts
export const GOOGLE_FORM_URL = "https://forms.gle/G1gkGDLEWd3BQfXy5";
```

Feedback click analytics event:

```txt
Feedback Click
```

Known event sources:

```txt
feedback_card
workflow_completion
```

## Analytics Event Schema

Analytics provider:

```txt
@vercel/analytics
```

Installed in:

```txt
src/app/layout.tsx
```

Tracked events:

```txt
Landing Visit
Workflow Start
Tool Selected
Workflow Selected
Tool Adapted
Workflow Completion
Tool Workflow Completion
Feedback Click
```

Current event payload examples:

```ts
track("Workflow Start", {
  stage,
  industry,
  urgency,
  selectedTools,
  selectedToolCount,
});
```

```ts
track("Tool Selected", {
  tool,
  stage,
  urgency,
});
```

```ts
track("Workflow Selected", {
  workflowId,
  workflowTitle,
  selectedTools,
  selectedToolCount,
  adaptedTools,
  adaptedToolCount,
  hasAdaptations,
});
```

```ts
track("Tool Adapted", {
  workflowId,
  originalTool,
  adaptedTool,
});
```

```ts
track("Workflow Completion", {
  workflowId,
  workflowTitle,
  completedSteps,
  completedCount,
  totalSteps,
  selectedTools,
  selectedToolCount,
  adaptedTools,
  adaptedToolCount,
});
```

```ts
track("Tool Workflow Completion", {
  tool,
  workflowId,
  workflowTitle,
});
```

```ts
track("Feedback Click", {
  source: "feedback_card" | "workflow_completion",
  workflowId,
  workflowTitle,
  selectedTools,
  selectedToolCount,
  adaptedToolCount,
});
```

Notes:

- Tool lists are serialized as comma-separated strings because Vercel Analytics
  custom event properties only support primitive values.
- Startup idea text is intentionally not sent to analytics.
- Feedback is collected in Google Forms, so the app tracks feedback CTA clicks
  rather than confirmed external form submissions.
