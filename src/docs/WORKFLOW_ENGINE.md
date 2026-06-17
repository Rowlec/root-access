# Root Access Workflow Engine

## Engine Principle

Root Access uses a rule-based workflow library.

It does not generate workflows dynamically. It selects from known workflow
definitions and injects user variables into existing prompt templates.

The workflow engine has three separate concerns:

1. Workflow data
2. Workflow selection
3. Template injection

## Current Workflow Data

There are two workflow data shapes in the project.

### Legacy Runtime Workflow

File:

```txt
src/data/startup-workflow.json
```

This is currently used by `/result`.

Shape:

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

Current workflow:

- `Startup Proposal Workflow`
- 7 steps
- Uses placeholders:
  - `[STARTUP IDEA]`
  - `[INDUSTRY]`

### Expanded Startup Workflow Library

Folder:

```txt
src/data/workflows/
```

Files:

- `idea-validation.ts`
- `market-research.ts`
- `business-model.ts`
- `mvp-planning.ts`
- `pitch-deck.ts`
- `index.ts`

Shared type:

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

- `idea-validation`
- `market-research`
- `business-model-design`
- `mvp-planning`
- `pitch-deck-preparation`

This library is ready for the next integration step, but is not yet the runtime
source for `/result`.

## Workflow Selection

File:

```txt
src/lib/workflow-selector.ts
```

Function:

```ts
selectWorkflow(currentStage, availableTools)
```

Input:

```ts
GoalFormValues["currentStage"]
GoalFormValues["availableTools"]
```

Rules:

```txt
No clear idea yet              -> idea-validation
Have idea but not validated    -> market-research
Doing market research          -> business-model-design
Building business model        -> mvp-planning
Preparing pitch deck           -> pitch-deck-preparation
```

Implementation notes:

- The selector is deterministic.
- It returns a workflow object, not an ID.
- The rule table uses TypeScript to ensure every valid stage maps to a workflow.
- There is no fallback workflow. Unknown stages should be prevented by form
  validation.
- After stage selection, the selector clones the workflow and adapts each
  step's `recommendedTool` through `mapTool`.
- The selector preserves `originalRecommendedTool` and sets
  `adaptedRecommendedTool` only when the adapted tool differs.
- Static workflow objects in `src/data/workflows/*` are not mutated.

## Rule-Based Matching

The rule engine is intentionally simple:

```txt
currentStage string + availableTools string[]
-> exact match in workflowRules
-> selected StartupWorkflow object
-> cloned workflow with mapped recommendedTool values
```

This makes behavior predictable for academic use cases and avoids hidden AI
decisions.

Do not replace this with AI-generated routing unless the product direction
changes. Workflow selection should remain explainable and testable.

## Tool Adaptation

File:

```txt
src/lib/tool-mapper.ts
```

Function:

```ts
mapTool(originalTool, availableTools)
```

Rules:

```txt
Claude     -> ChatGPT, then Gemini
Gamma      -> Canva AI
Perplexity -> Gemini, then ChatGPT
Lovable    -> ChatGPT
```

If the original tool is already available, it is preserved. If no direct or
rule-based candidate is available, the mapper returns the first valid available
tool, then `Other` as the final fallback.

## Template Injection

File:

```txt
src/lib/template-parser.ts
```

Function:

```ts
injectWorkflowVariables(template, variables)
replacePromptToolReferences(template, originalTool, adaptedTool)
```

Variables:

```ts
export interface TemplateVariables {
  startupIdea: string;
  industry: string;
}
```

Replacement rules:

```txt
[STARTUP IDEA] -> variables.startupIdea
[INDUSTRY]     -> variables.industry
```

Tool replacement rules:

```txt
original tool mention -> adapted tool mention
```

Tool replacement runs before user variable injection so placeholders remain
intact until `[STARTUP IDEA]` and `[INDUSTRY]` are interpolated.

Example:

```txt
Research customer pain points for [STARTUP IDEA] in [INDUSTRY].
```

With:

```txt
startupIdea = "AI learning platform"
industry = "EdTech"
```

Result:

```txt
Research customer pain points for AI learning platform in EdTech.
```

The parser uses direct string replacement. It does not evaluate expressions,
execute code, or call an AI model.

## Legacy Workflow Parser

File:

```txt
src/lib/workflow-parser.ts
```

Function:

```ts
injectWorkflowVariables(workflow, userInput)
```

This function adapts the template parser for the legacy `Workflow` object.

It injects variables into:

- workflow title
- workflow description
- workflow category
- workflow estimated time
- step title
- step goal
- step tool
- step tool adaptation metadata
- step prompt template
- step expected output
- step common mistakes

It returns a new workflow object and does not mutate the original workflow.

When a step tool is adapted, the legacy parser updates matching tool references
inside the prompt template before injecting startup idea and industry values.

## Workflow Step Structure

Every step should represent one useful unit of student work.

Each step must include:

- a clear title
- a learning or research goal
- a recommended AI or research tool
- a practical prompt template
- an expected output
- common mistakes to avoid

Prompt templates should:

- Use `[STARTUP IDEA]` and `[INDUSTRY]` where relevant
- Be practical for university startup assignments
- Ask for structured outputs
- Encourage verification, comparison, and student judgment
- Avoid asking AI to generate final assignment text for submission

## Integration Gap To Resolve

The next workflow-engine task should connect `/result` to:

```txt
stage query param
-> availableTools query params
-> selectWorkflow(stage, availableTools)
-> selected and tool-adapted StartupWorkflow
-> template injection per rendered step
```

This will replace the current runtime dependency on
`src/data/startup-workflow.json`.

When doing that, normalize the UI step shape carefully because the new library
uses `recommendedTool`, while the current `StepCard` expects `tool` and numeric
step IDs.
