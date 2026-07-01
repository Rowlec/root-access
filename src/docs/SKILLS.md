# Root Access Project Skills

This file defines repeatable project workflows for future AI-assisted
development sessions.

Active MVP guardrail:

- Startup Proposal is the only supported workflow area.
- Do not add Academic Report, Presentation Slides, Interview Prep, CV Builder,
  Website Builder, or generic workflow-builder support.
- New workflow-library work during the MVP should mean adding or improving
  Startup Proposal micro-steps/branches, not adding a new product workflow.

## Skill: Add New Workflow

Use only when product direction explicitly approves a new workflow area. During
the current MVP, prefer improving the Startup Proposal micro-step pool instead.

Steps:

1. Create a new file in `src/data/workflows/`.
2. Export a typed workflow object.
3. Use the existing `StartupWorkflow` shape.
4. Include 4 to 6 steps unless the product spec says otherwise.
5. Use `[STARTUP IDEA]` and `[INDUSTRY]` placeholders where useful.
6. Add the workflow export to `src/data/workflows/index.ts`.
7. Add a rule in `src/lib/workflow-selector.ts` only if the workflow should be
   selectable from the intake form.
8. Verify prompt templates support academic integrity.

Checklist:

- Not used for the current Startup Proposal-only MVP unless explicitly approved.
- Workflow ID is kebab-case.
- Every step has `title`, `goal`, `recommendedTool`, `promptTemplate`,
  `expectedOutput`, and `commonMistakes`.
- Prompt templates are practical for university startup assignments.
- The workflow does not generate final assignments directly.

## Skill: Improve Startup Proposal Micro-Steps

Use when improving the active MVP workflow without expanding product scope.

Steps:

1. Edit `src/data/workflows/startup-proposal.ts`.
2. Edit `src/data/workflows/startup-proposal.vi.ts` when Vietnamese runtime copy
   needs the same behavior.
3. Keep steps short, clear, and beginner-friendly.
4. Preserve Action, Learn, and Review layers.
5. Keep tool recommendations limited to ChatGPT and Gemini.
6. Keep prompts static and proposal-safe.
7. Update docs when workflow behavior changes.

Checklist:

- The change remains inside Startup Proposal.
- The selector remains deterministic.
- No AI-generated workflow logic is introduced.
- Micro-step outputs stay useful as working proposal material, not final
  submission text.

## Skill: Add New Intake Stage

Use when the form needs a new `currentStage` option.

Steps:

1. Add the option to `currentStageOptions` in `src/lib/goal-form-schema.ts`.
2. Update the UI select options if they are not derived automatically.
3. Add a matching rule in `src/lib/workflow-selector.ts`.
4. Confirm the selected workflow is appropriate.
5. Test form submission with the new stage.

Checklist:

- Zod validation accepts the new stage.
- `selectWorkflow(currentStage, locale, mode)` handles the new stage.
- No default fallback hides missing rules.
- Analytics still receives the stage value.

## Skill: Extend Intake Form with Available AI Tools

Use when the startup proposal intake form needs to collect which AI tools a
student can access.

Steps:

1. Add the available tool options to `src/lib/goal-form-schema.ts`.
2. Allow `availableTools` to be empty when the user chooses No preference.
3. Let `GoalFormValues` infer the new field from the schema.
4. Add an `availableTools` default value in `GoalForm`.
5. Render the tools as a single-choice preference group.
6. Keep the existing form styling and validation pattern.

Checklist:

- Options include ChatGPT, Gemini, and No preference.
- No preference is stored as an empty `availableTools` array.
- The field affects deterministic tool adaptation only; it does not change
  workflow routing.
- No AI-generated workflow logic is introduced.

## Skill: Create Tool Mapping Engine

Use when unavailable workflow-recommended tools need deterministic replacement
with tools the student can access.

Steps:

1. Keep tool mapping logic in `src/lib/tool-mapper.ts`.
2. Read valid tool names from the intake form schema.
3. Return the original tool when the student has it available.
4. Apply fixed fallback rules for known unavailable tools.
5. Return a valid fallback tool for every input.

Rules:

- ChatGPT and Gemini are the only selectable tools.
- No preference falls back to Root Access defaults.
- Research, verification, comparison, and structured-output steps prefer Gemini
  when a fallback is needed.
- General brainstorming and drafting steps prefer ChatGPT when a fallback is
  needed.

Checklist:

- Mapping is deterministic and rule-based.
- The mapper does not call AI or generate workflow logic.
- Empty or invalid available-tool input still returns a valid fallback.
- The mapper remains separate from workflow routing.

## Skill: Make Workflow Engine Tool-Aware

Use when the workflow selector should adapt recommended tools to the tools a
student can access.

Steps:

1. Keep workflow selection in `src/lib/workflow-selector.ts`.
2. Select the workflow by `currentStage` first.
3. Clone the selected workflow before changing step tools.
4. For each step, pass `recommendedTool` and `availableTools` to `mapTool`.
5. Return the adapted workflow without mutating the static workflow library.

Checklist:

- Selection remains deterministic and stage-based.
- Tool adaptation is rule-based only.
- Original workflow objects in `src/data/workflows/*` are not mutated.
- Workflow order, step order, and prompt templates are preserved.
- UI display of original versus adapted tools waits for the rendering phase.

## Skill: Display Tool Adaptation

Use when workflow steps need to explain that a recommended tool changed because
of the student's available tools.

Steps:

1. Preserve the original recommended tool in workflow step metadata.
2. Preserve the adapted tool only when it differs from the original.
3. Render both original and adapted tools in `StepCard` when adaptation exists.
4. Show the text `Adapted based on your available tools`.
5. Render only the original tool when no adaptation exists.

Checklist:

- The UI does not rewrite prompt templates.
- The UI does not introduce new workflow-selection rules.
- Adaptation messaging appears only when the displayed tool changed.
- Existing step completion and copy-prompt behavior remains unchanged.

## Skill: Make Prompt Templates Tool-Specific

Use when prompt instructions need to match the adapted tool shown to the
student.

Steps:

1. Keep placeholder interpolation in `src/lib/template-parser.ts`.
2. Replace explicit original-tool mentions with the adapted tool before
   injecting `[STARTUP IDEA]` and `[INDUSTRY]`.
3. Apply the replacement to legacy workflow prompt templates.
4. Apply the replacement to selected startup workflow prompt templates.
5. Preserve prompt structure, placeholders, and academic-integrity wording.

Checklist:

- Prompt templates mention the adapted tool when a tool changed.
- `[STARTUP IDEA]` and `[INDUSTRY]` interpolation still works.
- No new placeholders are introduced.
- No AI-generated prompt logic is added.

## Skill: Persist User Tool Preferences

Use when the intake form should remember which AI tools a returning student can
access.

Steps:

1. Store validated `availableTools` in browser `localStorage`.
2. Use the key `root-access:available-tools`.
3. Prefill `GoalForm` from storage when the component mounts.
4. Validate stored data with `availableToolsSchema`.
5. Ignore and remove corrupted stored values.

Checklist:

- Returning users do not need to reselect tools after a valid submission.
- Corrupted storage does not break form rendering.
- The preference store is separate from workflow progress storage.
- No workflow-selection or analytics behavior is added in this phase.

## Skill: Add New Prompt Templates

Use when improving workflow prompts.

Steps:

1. Edit the relevant workflow file in `src/data/workflows/`.
2. Keep placeholders limited to supported variables unless extending the parser.
3. Make prompts request structured outputs.
4. Include verification or review instructions where relevant.
5. Avoid submission-ready assignment language.

Checklist:

- Uses `[STARTUP IDEA]` and `[INDUSTRY]` consistently.
- Does not introduce unsupported placeholders.
- Expected output matches the prompt.
- Common mistakes match the step goal.

## Skill: Add New Template Variable

Use when prompt templates need a new user variable.

Steps:

1. Add the input field or source value.
2. Update the zod schema if the value comes from the form.
3. Update `TemplateVariables` in `src/lib/template-parser.ts`.
4. Add a replacement rule in `injectWorkflowVariables`.
5. Update workflow prompt templates.
6. Update docs in `DATA_SCHEMA.md` and `WORKFLOW_ENGINE.md`.

Checklist:

- Variable is validated before use.
- Parser remains deterministic.
- Missing values have a clear empty-state behavior.
- New placeholder naming is consistent and readable.

## Skill: Add New Locale

Use when i18n is implemented.

Current status:

- `next-intl` is configured for English and Vietnamese message files.

Recommended future steps:

1. Add the locale to the i18n config.
2. Create a message file for the supported locale.
3. Move new hardcoded UI strings into messages.
4. Decide whether workflow data is translated in separate files or through
   message keys.
5. Test landing and result routes in every locale.

Checklist:

- No hardcoded user-facing strings remain in translated components.
- Workflow prompts are reviewed by a human for academic tone.
- Locale selection does not break query params.
- Analytics event names remain stable.

## Skill: Add Analytics Event

Use when tracking a new user action.

Steps:

1. Confirm the event belongs in a client component.
2. Import `track` from `@vercel/analytics`.
3. Use a stable event name.
4. Keep payload small and non-sensitive.
5. Update `DATA_SCHEMA.md` with the new event.

Checklist:

- Event name is consistent with existing names.
- No private student data is sent.
- Event fires once per intended action.
- Event does not run during server rendering.

## Skill: Track Tool Usage Analytics

Use when validating how selected and adapted AI tools affect startup workflow
usage.

Steps:

1. Track selected tools on valid intake form submission.
2. Track workflow selection on the result page in a client component.
3. Track each adapted tool with original and adapted tool names.
4. Add selected-tool and adapted-tool context to workflow completion.
5. Add selected-tool and workflow context to feedback CTA clicks.

Checklist:

- Analytics payloads use only primitive values.
- Startup idea text is not sent to analytics.
- Existing event names remain stable unless docs are updated.
- Google Form submission itself is external; the app tracks feedback CTA clicks.
- Events remain client-side only.

## Skill: Add Feedback System

Use when improving feedback collection.

Current system:

- Feedback opens a Google Form.
- URL lives in `src/constants/links.ts`.
- Feedback clicks are tracked with Vercel Analytics.

Steps:

1. Update `GOOGLE_FORM_URL` only in `src/constants/links.ts`.
2. Reuse `FeedbackCard` for UI consistency.
3. Track feedback clicks with a clear `source`.
4. Keep the feedback CTA visible after workflow completion.

Checklist:

- Button opens in a new tab.
- Link uses `rel="noreferrer"`.
- Analytics source identifies where the click happened.
- UI copy explains why feedback matters.

## Skill: Expand Workflow Engine

Use when changing workflow selection or rendering.

Steps:

1. Read `src/lib/workflow-selector.ts`.
2. Read `src/lib/template-parser.ts`.
3. Read `src/data/workflows/index.ts`.
4. Confirm `/result` still uses `selectWorkflow` and not AI-generated routing.
5. Normalize workflow data before rendering if needed.
6. Preserve deterministic selection.

Checklist:

- No AI-generated workflow routing.
- All stages map to workflows.
- All selected workflows render in the UI.
- Template injection happens before display.
- Progress tracking receives stable step IDs.

## Skill: Migrate Result Page To Workflow Library

Use when replacing the legacy JSON runtime workflow.

Steps:

1. Read `src/app/result/page.tsx`.
2. Read `src/lib/workflow-selector.ts`.
3. Read `src/data/workflows/index.ts`.
4. Read `src/components/workflow/ProgressTracker.tsx`.
5. Use the `stage` query param to select a workflow.
6. Normalize `StartupWorkflowStep` into the viewer shape or update the viewer to
   support the new schema.
7. Generate stable step IDs from step order.
8. Inject `startupIdea` and `industry` into each prompt template.
9. Preserve empty state for missing query params.
10. Verify progress persistence uses the selected workflow ID.

Checklist:

- `/result` renders the selected workflow.
- Each stage maps to the expected workflow.
- Prompt templates show injected variables.
- Step checkboxes still cannot skip ahead.
- Completion and feedback still work.

## Skill: Polish UI Without Architecture Changes

Use when improving visual quality.

Rules:

- Do not change data structures.
- Do not change workflow selection.
- Do not remove academic integrity copy.
- Preserve shadcn components.
- Preserve responsive behavior.

Checklist:

- Spacing is consistent.
- Typography uses the global font.
- CTA hierarchy is clear.
- Cards have clear hierarchy.
- Mobile and desktop layouts both work.
- Loading and empty states remain available.
