# Root Access Roadmap

## Phase 1: Current MVP

Goal:

- Validate whether students want a structured AI workflow for startup proposal
  assignments.

Current capabilities:

- Landing page explaining Root Access.
- Structured startup proposal intake form.
- Academic integrity notice on landing and workflow pages.
- Five startup proposal workflows rendered on `/result`.
- Rule-based workflow selector integrated.
- Prompt template parser created.
- Step-by-step workflow UI.
- Tool-aware prompt adaptation.
- EN/VI localization.
- Sequential progress tracking.
- localStorage persistence.
- Completion CTA.
- Google Form feedback collection.
- Vercel Analytics integration.
- Loading, empty, error, and 404 states.
- Responsive MVP UI polish.

Current validation gap:

- Real student validation has not been run yet.
- Use `USER_VALIDATION_PLAN.md`, `USER_VALIDATION_SCORECARD.md`, and
  `USER_VALIDATION_RESULTS.md` before making larger product bets.

## Phase 2: Workflow Library Expansion

Goal:

- Improve workflow relevance while keeping selection deterministic.

Recommended tasks:

- Complete runtime integration of the five startup workflows.
- Normalize workflow step types so all workflow data shares one UI-compatible
  schema.
- Add tests for every stage-to-workflow rule.
- Add tests for placeholder injection.
- Add analytics for selected workflow ID.
- Add stronger empty states when query params are incomplete or invalid.
- Add versioning to workflow definitions.
- Add review steps that remind students to verify AI outputs.

Potential workflow improvements:

- Add rubric-aligned prompts for FPT startup assignments.
- Add mentor-feedback preparation steps.
- Add customer interview guide prompts.
- Add competitor comparison templates.
- Add pitch rehearsal prompts.

## Phase 3: Product Validation

Goal:

- Learn whether the workflow system improves student outcomes and retention.

Recommended tasks:

- Track abandonment by current step.
- Track workflow completion by workflow ID.
- Track restart usage.
- Add optional feedback prompts after completion.
- Add simple admin-readable analytics naming conventions.
- Compare completion rates across workflows.
- Collect qualitative feedback from FPT students.
- Improve copy based on classroom language and assignment rubrics.
- Run the A/B validation protocol documented in `USER_VALIDATION_PLAN.md`.

Product experiments:

- Test whether students prefer workflow names or assignment-stage names.
- Test whether prompt copy should be more direct or more scaffolded.
- Test whether examples improve completion or increase copy-paste risk.
- Test whether deadline urgency should influence workflow guidance.

## Future Vision

Root Access can expand into a broader academic workflow platform while preserving
the same principle:

```txt
Prebuilt workflow library
-> rule-based selection
-> user variable injection
-> guided step-by-step completion
```

Possible future workflow domains:

- Academic Reports
- Presentation Slides
- CV Builder
- Interview Prep
- Image Generation Workflow
- Website Prototype Workflow

Future platform capabilities:

- Account-based progress sync
- Saved projects
- Instructor-approved workflow packs
- Locale support
- Assignment rubric mapping
- Workflow version history
- Exportable outlines
- Team collaboration
- Feedback dashboards

Guardrail for future growth:

- Root Access should remain a workflow and prompt-quality platform, not a final
  assignment generator.
