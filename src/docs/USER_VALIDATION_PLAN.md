# Root Access User Validation Plan

## Objective

Validate whether Root Access helps FPT University students create a clearer first
startup proposal draft faster than using ChatGPT without a guided workflow.

This phase tests the product outcome, not the UI polish.

## Main Task

Participants complete this task:

```txt
Lam startup proposal cho mon khoi nghiep.
```

Recommended prompt shown to participants:

```txt
You have 35 minutes to create the first useful draft for a startup proposal.
Your draft does not need to be final, but it should include a clear problem,
target customer, research direction, business model, MVP scope, and pitch logic.
```

## Groups

Use two groups with similar student profiles.

| Group | Tool setup | Description |
| --- | --- | --- |
| A | ChatGPT only | Student works normally with ChatGPT and writes prompts alone. |
| B | Root Access + available AI tools | Student starts from Root Access and follows the generated workflow. |

Minimum useful sample:

- 5 students in Group A
- 5 students in Group B

Better sample:

- 10 students in Group A
- 10 students in Group B

## Participant Criteria

Target participants:

- FPT University students.
- Have done or are preparing a startup/business assignment.
- Already know basic ChatGPT usage.
- Not part of the Root Access build team.

Try to balance:

- Year 2 to Year 4 students.
- Business, marketing, entrepreneurship, or related majors.
- Strong and weak AI users in both groups.

## Test Setup

Before each session:

1. Open the app at `http://127.0.0.1:3000` or the deployed URL.
2. Prepare a timer.
3. Prepare one recording sheet from `USER_VALIDATION_SCORECARD.md`.
4. Ask the participant to think aloud when confused.
5. Remind them that AI output must be reviewed and rewritten before submission.

Allowed tools:

- Group A: ChatGPT only.
- Group B: Root Access, plus whatever tools they select inside the form.

Do not coach the participant during the task unless they are blocked by a
technical issue.

## Procedure

1. Pre-test survey: 2 minutes.
2. Explain the task: 1 minute.
3. Participant works: 35 minutes.
4. Stop when they have a first useful draft or when time expires.
5. Post-test survey: 5 minutes.
6. Evaluator scores the output using the rubric in `USER_VALIDATION_SCORECARD.md`.

## Metrics

Primary metrics:

- Time to first useful draft.
- Number of prompt revisions.
- Completion rate.
- Proposal structure clarity.
- Participant confidence.
- Reuse intent.

Secondary observations:

- Where the participant hesitates.
- Whether the participant verifies facts.
- Whether the output looks submission-ready or still needs student thinking.
- Whether the participant understands the next action.

## Definitions

First useful draft:

- Has enough structure to continue editing.
- Contains at least problem, target customer, solution, business model, MVP, and
  pitch/proposal direction.
- Does not need polished writing.

Prompt revision:

- Any rewritten prompt, follow-up correction, clarification, or retry caused by
  poor output.

Workflow completion:

- Group B completes every visible step in the selected Root Access workflow.

## Success Threshold

Root Access passes the validation if Group B shows:

- 20%+ lower median time to first useful draft than Group A.
- Equal or higher proposal structure score.
- 70%+ workflow completion among Group B.
- Average confidence score of 4/5 or higher.
- 60%+ of Group B says they would use Root Access again.

## Decision Rules

Strong signal:

- Root Access is faster and produces clearer structure.
- Students explain the proposal more confidently.
- Students say the workflow reduced prompt guessing.

Mixed signal:

- Root Access improves structure but feels too long.
- Students complete only part of the workflow.
- Tool adaptation or wording causes confusion.

Weak signal:

- Students ignore the workflow.
- Time is not improved.
- Students still need many prompt retries.
- Output quality is similar to ChatGPT-only use.

## After Testing

Use `USER_VALIDATION_RESULTS.md` to summarize:

- Quantitative metrics.
- Top confusion points.
- Best student quotes.
- Lowest scoring workflow steps.
- Product changes before next public test.
