# Root Access Workflow Engine

## Engine Principle

Root Access keeps workflow logic rule-based.

It does not generate workflows dynamically. It uses a known Startup Proposal
section set and predefined prompt templates.

Current product direction:

```txt
static prompt -> external AI test -> pasted output -> API review
```

Not:

```txt
AI decides workflow -> Root Access writes final proposal
```

## Active Startup Proposal Sections

The active MVP uses five proposal progress sections:

- Problem
- Customer
- Validation
- Revenue
- MVP Scope

These sections are defined inside `WorkflowReviewWorkspace` for the current MVP
surface. They should remain compact and easy to scan.

## Prompt Creation

Starting prompts are created from deterministic context:

- startup idea
- industry
- target customer
- deadline urgency
- active section
- locale

Prompt creation is rule-based. It does not call AI and it does not create hidden
workflow logic.

## Review Engines

The review step is API-backed.

Route:

```txt
src/app/api/gemini/review/route.ts
```

The route calls Gemini for:

- Output Score Engine
- Weakness Detection
- Prompt Improvement Engine

Response rules:

- Score relevance, specificity, actionability, and clarity from 0 to 10.
- Total score is 0 to 40.
- Return only the top two weaknesses.
- Return a better prompt for the user's next external AI retry.
- Do not write the final proposal section.

## Legacy Workflow Library

The repository still contains legacy static workflow files:

```txt
src/data/startup-workflow.json
src/data/workflows/*
src/lib/workflow-selector.ts
src/lib/template-parser.ts
src/lib/workflow-parser.ts
```

These remain useful references for deterministic workflow and prompt-template
patterns. They are not the active MVP runtime surface after the product pivot.

If future work reuses them, preserve these rules:

- workflow library stays static
- workflow selector stays deterministic
- prompt templates stay predefined
- tool adaptation stays rule-based
- AI does not generate workflow logic

## Tool Adaptation

Selectable external AI tools remain:

- ChatGPT
- Gemini

Tool choice does not change workflow routing. It only tells the user where they
are likely to test the prompt externally.

## Runtime Flow

```txt
GoalForm
-> /result query params
-> WorkflowReviewWorkspace
-> create starting prompt from static rules
-> user tests prompt in ChatGPT/Gemini
-> user pastes output
-> /api/gemini/review scores, diagnoses, and improves
-> user retries externally
-> score comparison
```
