# MVP Proposal Flow Implementation Plan

## Product decision

Root Access now guides a student through a single startup proposal flow. The
student supplies only the startup idea, industry, and optional first customer.
The product turns that context into a constrained, explainable AI workflow, so
students who are unsure how to prompt or judge AI do not need to start from a
blank chat.

## Implemented flow

```text
Start project
  -> /result/{section}/generate
  -> /result/{section}/review
  -> /result/{section}/improve
  -> complete current section
  -> repeat for the next proposal section
  -> Proposal Builder
  -> Optional AI-polished draft
  -> Student review and edit
  -> DOCX / PDF / TXT export
```

## Business rules

1. A user may export a clearly labelled draft as soon as a generated section
   exists. The full Builder and final, editable proposal become available after
   every review section is marked complete.
2. Every proposal section has three separate pages: generate output, review
   business logic, and improve/retry. Back and Next navigate between these
   pages. Direct URLs to locked sections, or to review/improve without the
   required prior output, are redirected to the first allowed page.
3. The editable Proposal Builder is the source of truth for all exports. A
   manual edit is autosaved locally and is never overwritten by later section
   output unless the user deliberately chooses a replacement.
4. The final AI drafting endpoint accepts structured section notes and returns
   a validated JSON object. It must not return markdown, fabricated facts, or
   unsupported market claims.
5. An AI-polished proposal draft must be explicitly applied to the Builder
   before it changes an export. Every exported file remains editable working
   material, not an unreviewed final submission.
6. Startup context is held in localStorage for this anonymous MVP and is not
   placed in the result URL.
7. Every AI request starts from a visible user action. Generation uses only the
   active section (and its direct predecessor for a retry); reviews and prompt
   improvements have bounded outputs; no automatic repair or schema-retry call
   is made in the background.

## Acceptance checks

- The launch form has no urgency or model picker.
- The result route restores a valid local project or shows a safe empty state.
- Back/Next preserve the current section and do not unlock future sections.
- The product tour follows the same create → review → improve → export routes
  and never blocks the highlighted action or its credit confirmation.
- Builder edits appear in the export preview and downloaded DOCX/PDF/TXT.
- DOCX is valid Office Open XML with a document body, sanitized text, page
  margins, title, and section headings.
- AI endpoint validates both request and generated JSON before returning it.
- Production build and Playwright end-to-end checks pass before release.

## Deliberately deferred

- Account/server persistence and team collaboration.
- Real payments and server-side credit enforcement.
- Instructor-specific rubrics and source/citation management.

These require a database, authentication policy, and product decisions beyond
the anonymous MVP scope.
