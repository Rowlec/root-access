# Root Access

Root Access is an AI Workflow + Output Review + Prompt Improvement product for
Startup Proposal work.

It helps students improve how they use AI:

```txt
Generate Prompt -> Test with AI -> Get Feedback -> Improve Prompt -> Retry
```

Root Access is not a proposal generator, prompt library, slide builder, PDF
generator, website builder, or generic AI assistant.

## Current MVP

The active MVP supports one workflow only: Startup Proposal.

The fixed product flow is:

1. User enters startup context.
2. Root Access creates a starting prompt from static templates.
3. User copies the prompt to ChatGPT or Gemini.
4. User pastes the external AI output back into Root Access.
5. Root Access scores the output through the review API.
6. Root Access detects the top two weaknesses through the review API.
7. Root Access suggests a better prompt through the review API.
8. User retries externally and pastes the new output.
9. Root Access compares old and new scores.
10. User completes the proposal section.

Root Access reviews and improves the AI workflow. It does not write the final
proposal for the user.

## Runtime Layers

`/result` uses three layers:

- Action Layer: objective, starting prompt, copy prompt, paste AI output.
- Review Layer: score, weakness detection, improved prompt.
- Retry Layer: copy improved prompt, paste retry output, compare scores.

Proposal progress is tracked by section:

- Problem
- Customer
- Validation
- Revenue
- MVP Scope

## Review API

The review engine lives at:

```txt
src/app/api/gemini/review/route.ts
```

It calls Gemini for:

- Output Score Engine
- Weakness Detection
- Prompt Improvement Engine

Workflow selection and prompt templates remain rule-based and static.

## Credit Model

Free:

- 5 prompt generations
- 5 output reviews
- 3 improved prompts

Pro demo:

- unlimited prompt generations
- unlimited output reviews
- unlimited improved prompts

The fake checkout lives at `/checkout` and activates Pro demo mode in
localStorage. No real payment integration is implemented.

## Getting Started

Install dependencies:

```bash
npm install
```

Configure Gemini server credentials:

```bash
cp .env.example .env.local
```

Then set:

```txt
GEMINI_API_KEY=your_server_side_key
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Quality Checks

Run typecheck:

```bash
npx tsc --noEmit
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Academic Integrity

Root Access supports:

- prompt creation
- AI output review
- weakness diagnosis
- prompt improvement
- iterative retry

Root Access does not:

- replace original student work
- guarantee correctness
- encourage direct submission of AI output
- generate a final proposal for the user
- generate PDF, PowerPoint, Excel, image, or website deliverables
