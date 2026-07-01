# Root Access Project Overview

## Product Identity

Root Access is an AI Workflow + Output Review + Prompt Improvement product for
Startup Proposal work.

The user should immediately understand:

```txt
I am here to improve how I use AI for my startup proposal.
```

Not:

```txt
Root Access will generate my proposal for me.
I am here to browse prompts.
I am here to build slides, websites, CVs, or reports.
```

## Current MVP Scope

The current MVP supports only Startup Proposal.

Out of scope:

- Academic Report
- Presentation Slides
- Interview Prep
- CV Builder
- Website Builder
- Canva integration
- PDF export
- PowerPoint generation
- Excel generation
- image generation
- final proposal generation

## Target Users

Primary users are FPT University HCMC students:

- Business, Marketing, and EXE students
- Year 2 to Year 4
- Working on startup proposal assignments
- Already using ChatGPT or Gemini
- Unsure why AI output is weak or how to improve their prompt

## Core Flow

Root Access follows one fixed product flow:

1. User chooses the Startup Proposal workflow.
2. Root Access creates a starting prompt.
3. User copies the prompt to ChatGPT or Gemini.
4. User pastes the AI output back into Root Access.
5. Root Access scores the output.
6. Root Access points out the top two weaknesses.
7. Root Access suggests a better prompt.
8. User retries externally.
9. Root Access compares old and new scores.
10. User completes the proposal section.

## Runtime Sections

The MVP tracks proposal progress by five sections:

- Problem
- Customer
- Validation
- Revenue
- MVP Scope

These are progress sections, not micro-step accordions. The UI should stay
focused on the current section and avoid overwhelming the user.

## Monetization Fit

The MVP includes a visible credit model.

Free plan:

- 5 prompt generations
- 5 output reviews
- 3 improved prompts

Pro demo:

- unlimited prompt generations
- unlimited output reviews
- unlimited improved prompts

No real payment integration is implemented. `/checkout` is a fake checkout page
for business-model validation.

## Technical Notes

The active runtime route is `/result`.

`/result` renders:

```txt
WorkflowReviewWorkspace
-> proposal progress by section
-> Action Layer
-> Review Layer
-> Retry Layer
-> upgrade modal
```

The review API is:

```txt
src/app/api/gemini/review/route.ts
```

It calls Gemini for output scoring, weakness detection, and prompt improvement.

Workflow logic remains rule-based:

- static workflow library
- deterministic workflow selection
- predefined prompt templates
- rule-based tool adaptation

AI must not decide product workflow or generate hidden workflow logic.
