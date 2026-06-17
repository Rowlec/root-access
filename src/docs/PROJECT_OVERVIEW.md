# Root Access Project Overview

## Product Vision

Root Access is an MVP for a workflow-based AI guidance platform for students.
It helps students complete startup proposal assignments by following structured,
prebuilt workflows and better prompt sequences.

Root Access is not an AI content generator and not an AI workflow generator.
The product should not produce final assignments directly. Instead, it guides
students through research, outlining, drafting, verification, and prompt quality.

The intended product position is:

- A rule-based workflow library for academic startup proposal work.
- A guided prompt workflow tool for students already using AI tools.
- A structure-first assistant that improves process quality without replacing
  student responsibility.

## Current MVP Scope

The current MVP focuses only on startup proposal workflows.

Implemented startup workflow assets include:

- Idea Validation
- Market Research
- Business Model Design
- MVP Planning
- Pitch Deck Preparation

The codebase also still contains a legacy runtime workflow file,
`src/data/startup-workflow.json`, named `Startup Proposal Workflow`. The current
`/result` page still renders this JSON workflow through `getStartupWorkflow()`.
The expanded five-workflow TypeScript library and selector already exist, but
they are not yet fully wired into the result page.

Out of scope for the current MVP:

- Academic Reports
- Presentation Slides
- CV Builder
- Interview Prep
- Image Generation Workflow
- Website Prototype Workflow

## Target Users

Primary users are FPT University HCMC students:

- Business, Marketing, and EXE students
- Year 2 to Year 4
- Frequently working on startup proposal assignments
- Already using tools such as ChatGPT, Gemini, Claude, or Perplexity
- Struggling with prompt quality, research order, validation logic, and proposal
  structure

## Problem Statement

Students already use AI tools for startup assignments, but they often struggle
with:

- Starting from unclear or weak startup ideas
- Asking prompts in the wrong order
- Skipping market validation
- Mixing customer research, value proposition, business model, MVP, and pitch
  work too early
- Generating polished text before understanding the assignment structure
- Submitting AI-looking work without review or verification

Root Access solves the workflow problem, not the final-answer problem.

## Solution Logic

The intended product flow is:

1. User submits startup context:
   - current stage
   - startup idea
   - industry
   - deadline urgency
2. The app selects a prebuilt workflow using deterministic rules.
3. The workflow prompt templates receive user variables:
   - `[STARTUP IDEA]`
   - `[INDUSTRY]`
4. The user completes the workflow step by step.
5. Progress is stored locally in the browser.
6. When all steps are completed, the app shows a completion CTA and feedback
   entry point.

The current runtime flow still uses the legacy single JSON workflow on
`/result`, while the five-workflow selector is ready for integration.

## Academic Integrity Constraints

Root Access must preserve academic integrity.

The product must not:

- Generate final assignments for students
- Present AI output as submission-ready work
- Remove the need for review, verification, or editing
- Encourage copying generated output directly into assignments

The product may assist with:

- Structure
- Research planning
- Outlining
- Drafting support
- Prompt quality
- Workflow order
- Review discipline

The app includes an `AcademicIntegrityNotice` component on the landing page and
workflow page to communicate this boundary clearly.

## Current Technical Stack

The current implementation uses:

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- shadcn UI primitives
- react-hook-form
- zod
- lucide-react
- Vercel Analytics
- localStorage persistence for workflow progress

The project context mentions `next-intl`, but it is not currently installed or
configured in the codebase. Treat i18n as a planned capability unless it is added
explicitly.

