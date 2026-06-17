# Root Access UI Components

## `AcademicIntegrityNotice`

File:

```txt
src/components/AcademicIntegrityNotice.tsx
```

Purpose:

- Communicates that Root Access does not generate final assignments.
- Reduces academic integrity risk.
- Appears on landing and workflow pages.

Props:

```ts
{
  compact?: boolean;
}
```

Dependencies:

- `Card`
- `CardContent`
- `ShieldCheck` from `lucide-react`
- `cn` utility

Current usage:

- `src/app/page.tsx`
- `src/app/result/page.tsx`

## `GoalForm`

File:

```txt
src/components/GoalForm.tsx
```

Purpose:

- Collects student startup proposal context.
- Validates the intake form.
- Starts the workflow by pushing query params to `/result`.

Fields:

- `currentStage`
- `startupIdea`
- `industry`
- `deadlineUrgency`
- `availableTools`

Props:

- None.

Dependencies:

- `react-hook-form`
- `zodResolver`
- `goalFormSchema`
- `useRouter` from Next.js
- browser `localStorage`
- `track` from Vercel Analytics
- shadcn `Button`, `Card`, `Input`, `Select`, `Textarea`

Current usage:

- `src/app/page.tsx`

Submit behavior:

```txt
/result?stage=...&idea=...&industry=...&urgency=...&availableTools=ChatGPT&availableTools=Gemini
```

Current limitation:

- `/result` receives `stage` and `urgency`, but does not yet use `stage` for
  workflow selection.

Important behavior:

- Saves selected `availableTools` after a valid submission.
- Prefills `availableTools` from `root-access:available-tools` on return visits.
- Ignores corrupted stored tool preferences.
- Tracks selected tools through `Workflow Start` and per-tool `Tool Selected`
  events.

## `LandingAnalytics`

File:

```txt
src/components/analytics/LandingAnalytics.tsx
```

Purpose:

- Tracks landing page visits.

Props:

- None.

Dependencies:

- `useEffect`
- `track` from Vercel Analytics

Current usage:

- `src/app/page.tsx`

Tracked event:

```txt
Landing Visit
```

## `WorkflowAnalytics`

File:

```txt
src/components/analytics/WorkflowAnalytics.tsx
```

Purpose:

- Tracks workflow selection on the result page.
- Tracks per-step tool adaptation events.
- Keeps analytics calls in a client component.

Props:

```ts
{
  workflowId: string;
  workflowTitle: string;
  availableTools: string[];
  steps: WorkflowStep[];
}
```

Tracked events:

- `Workflow Selected`
- `Tool Adapted`

## `FeedbackCard`

File:

```txt
src/components/feedback/FeedbackCard.tsx
```

Purpose:

- Explains why feedback matters.
- Opens the Google Form feedback link in a new tab.
- Tracks feedback clicks.

Props:

```ts
{
  adaptedToolCount?: number;
  availableTools?: string[];
  workflowId?: string;
  workflowTitle?: string;
}
```

Dependencies:

- `GOOGLE_FORM_URL`
- `track` from Vercel Analytics
- shadcn `Card` and `Button`
- `ExternalLink` from `lucide-react`

Current usage:

- Wrapped by `FeedbackForm`

Tracked event:

```txt
Feedback Click
```

Important behavior:

- Sends workflow and selected-tool context when available.
- Tracks feedback CTA clicks because the actual Google Form submission happens
  outside the app.

## `Hero`

File:

```txt
src/components/landing/Hero.tsx
```

Purpose:

- Landing hero section for Root Access.
- States the main value proposition.
- Provides a CTA to the intake form.

Props:

```ts
{
  adaptedToolCount?: number;
  availableTools?: string[];
  workflowId?: string;
  workflowTitle?: string;
}
```

Dependencies:

- `Link` from Next.js
- shadcn `Button`
- `ArrowRight`, `CheckCircle2` from `lucide-react`

Current usage:

- `src/app/page.tsx`

CTA:

```txt
#goal-form
```

## `HowItWorks`

File:

```txt
src/components/landing/HowItWorks.tsx
```

Purpose:

- Explains the product in three steps.

Steps:

1. Enter startup idea
2. Get guided workflow
3. Build proposal faster

Props:

- None.

Dependencies:

- shadcn `Card`
- `Lightbulb`, `ListChecks`, `Rocket` from `lucide-react`

Current usage:

- `src/app/page.tsx`

## `FeedbackForm`

File:

```txt
src/components/workflow/FeedbackForm.tsx
```

Purpose:

- Compatibility wrapper around the newer feedback component.
- Keeps workflow page usage stable.

Props:

- None.

Dependencies:

- `FeedbackCard`

Current usage:

- `src/app/result/page.tsx`

## `ProgressTracker`

File:

```txt
src/components/workflow/ProgressTracker.tsx
```

Purpose:

- Renders workflow progress and all step cards.
- Shows completed count and percentage.
- Enforces sequential progress through the hook.
- Shows completion CTA when progress reaches 100 percent.

Props:

```ts
{
  workflowId: string;
  workflowTitle: string;
  availableTools: string[];
  steps: WorkflowStep[];
}
```

Dependencies:

- `useWorkflowProgress`
- `StepCard`
- `WorkflowCompletion`
- shadcn `Card`
- `ListChecks` from `lucide-react`

Current usage:

- `src/app/result/page.tsx`

Important behavior:

- Converts legacy numeric step IDs to strings for progress tracking.
- Keeps progress UI sticky on desktop.
- Uses local state through `useWorkflowProgress`.

## `StepCard`

File:

```txt
src/components/workflow/StepCard.tsx
```

Purpose:

- Displays one workflow step.
- Lets the user mark the step complete.
- Lets the user copy the prompt.
- Supports expand and collapse for detailed step content.

Props:

```ts
{
  step: WorkflowStep;
  canComplete: boolean;
  isCompleted: boolean;
  onCompletedChange: (stepId: string, completed: boolean) => void;
}
```

Dependencies:

- shadcn `Button`, `Card`, `Badge`
- `CheckCircle2`, `ChevronDown`, `Copy` from `lucide-react`
- browser `navigator.clipboard`

Current usage:

- `ProgressTracker`

Important behavior:

- Checkbox is disabled when the user tries to skip ahead.
- Shows the original tool and adapted tool when tool adaptation exists.
- Shows `Adapted based on your available tools` only when the displayed tool
  changed.
- Copy button copies `step.promptTemplate`.
- Expanded details include tool, prompt, expected output, and common mistakes.

## `WorkflowCompletion`

File:

```txt
src/components/workflow/WorkflowCompletion.tsx
```

Purpose:

- Shows a completion state after the user finishes all workflow steps.
- Encourages feedback submission.
- Allows workflow restart.

Props:

```ts
{
  adaptedToolCount: number;
  adaptedTools: string[];
  availableTools: string[];
  completedCount: number;
  totalSteps: number;
  workflowId: string;
  workflowTitle: string;
  onRestart: () => void;
}
```

Dependencies:

- `GOOGLE_FORM_URL`
- `track` from Vercel Analytics
- shadcn `Button`, `Card`
- `CheckCircle2`, `ExternalLink`, `RotateCcw` from `lucide-react`
- browser `sessionStorage`

Current usage:

- `ProgressTracker`

Tracked events:

- `Workflow Completion`
- `Tool Workflow Completion`
- `Feedback Click`

Important behavior:

- Uses `sessionStorage` to avoid duplicate completion tracking during the same
  browser session.
- Restart clears the completion tracking key and calls `onRestart`.

## shadcn UI Primitives

Folder:

```txt
src/components/ui/
```

Current primitives:

- `badge.tsx`
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `select.tsx`
- `sonner.tsx`
- `textarea.tsx`

Purpose:

- Provide consistent UI building blocks.
- Keep styling centralized.
- Match the minimal SaaS visual direction.

Usage:

- Used across landing, form, workflow, progress, and feedback components.

Do not bypass these primitives with unrelated custom controls unless the design
system lacks the required element.
