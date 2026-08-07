# Root Access Data Schema

## Startup context

The active intake writes one anonymous project context to localStorage:

```txt
root-access:startup-context
```

```ts
type StartupContext = {
  startupIdea: string;
  industry: string;
  targetCustomer: string;
  // Internal compatibility defaults, not visible in the form.
  workflowMode: "quick" | "deep";
  currentStage: string;
  deadlineUrgency: string;
  availableTools: ["Gemini"];
};
```

The `/result` route restores this browser state. Startup information must not
be appended to URLs, analytics events, or error messages.

## Review workspace

Each anonymous project is stored by deterministic project id:

```txt
root-access:workflow-review:${workflowRunId}
```

Review sections are completed in this order:

```ts
type ReviewSectionId =
  | "problem"
  | "customer"
  | "revenue"
  | "mvp"
  | "differentiation";
```

Each section persists its prompt, generated versions, review results, retry
state, and `completed` flag. A future section is locked until the preceding
section is completed.

## Proposal Builder

The editable document is stored separately:

```txt
root-access:proposal-builder:${workflowRunId}
```

```ts
type ProposalSectionId =
  | "idea"
  | "problem"
  | "customer"
  | "market"
  | "solution"
  | "revenue"
  | "competition"
  | "mvp"
  | "validation";

type BuilderSection = {
  content: string;
  isManual: boolean;
  sourceContent: string;
  updatedAt: string | null;
};
```

This document is the only source for TXT, DOCX and PDF exports. The optional
AI proposal endpoint returns a fully validated object keyed by the same nine
section IDs. The student explicitly applies that object to the Builder before
it replaces any editable content.

## API contracts

### `POST /api/gemini/review`

Reviews one of the five review section IDs. The server validates the input and
returned Gemini JSON and recomputes the 0-60 total score server-side.

### `POST /api/gemini/proposal`

Accepts startup context, locale and all nine Builder sections. It returns:

```ts
{ draft: Record<ProposalSectionId, string> }
```

The endpoint asks for plain text only, prohibits made-up facts, and rejects an
invalid or incomplete generated object before it reaches the client.

## Billing note

Credit and plan data remain local demo state. They are not an authorization or
payment system and must not be used for a real paid launch without server-side
identity, usage enforcement and payment verification.
