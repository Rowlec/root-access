export const mvpPlanningWorkflow = {
  id: "mvp-planning",
  title: "MVP Planning Workflow",
  description:
    "Plan the smallest useful version of [STARTUP IDEA] in [INDUSTRY] so the proposal stays realistic and testable.",
  estimatedTime: "75-105 minutes",
  steps: [
    {
      title: "Define Core User Job",
      goal: "Identify the single most important job the MVP must support.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Act as a product manager. For [STARTUP IDEA] in [INDUSTRY], define the core user job the MVP should solve. Explain the user goal, the situation, and the minimum successful outcome.",
      expectedOutput:
        "A clear core user job with situation, goal, and success outcome.",
      commonMistakes: [
        "Trying to solve every user need",
        "Starting from features instead of user outcome",
        "Choosing a job that is too vague to test",
      ],
    },
    {
      title: "Select MVP Features",
      goal: "Choose only the features needed to test the core value.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], propose an MVP feature list. Separate must-have features, nice-to-have features, and features to exclude. Explain how each must-have feature tests the core value.",
      expectedOutput:
        "A prioritized MVP feature list with must-have, nice-to-have, and excluded features.",
      commonMistakes: [
        "Adding too many features",
        "Including features that do not test the value proposition",
        "Confusing MVP with final product",
      ],
    },
    {
      title: "Map Simple User Flow",
      goal: "Create a simple flow from first interaction to value received.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Create a simple user flow for the MVP of [STARTUP IDEA] in [INDUSTRY]. Include entry point, main actions, output or result, and where feedback is collected. Keep it understandable for a university proposal.",
      expectedOutput:
        "A step-by-step MVP user flow from entry point to feedback collection.",
      commonMistakes: [
        "Creating a flow with too many screens",
        "Forgetting the first user action",
        "Not defining how feedback is collected",
      ],
    },
    {
      title: "Plan Validation Test",
      goal: "Design a lightweight test for the MVP concept.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Design a lightweight MVP validation test for [STARTUP IDEA] in [INDUSTRY]. Include who to test with, what task they should complete, what metrics or observations to collect, and what result would count as success.",
      expectedOutput:
        "A practical MVP test plan with users, task, metrics, and success criteria.",
      commonMistakes: [
        "Testing with only friends who agree",
        "Measuring opinions instead of behavior",
        "Not defining success criteria",
      ],
    },
    {
      title: "Write MVP Scope",
      goal: "Summarize the MVP plan for the proposal.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Write an MVP scope section for [STARTUP IDEA] in [INDUSTRY]. Include core user job, must-have features, excluded features, simple user flow, and validation plan. Make it concise and proposal-ready.",
      expectedOutput:
        "A concise MVP scope section suitable for a startup proposal.",
      commonMistakes: [
        "Writing a technical spec instead of MVP scope",
        "Leaving out excluded features",
        "Not connecting MVP to validation",
      ],
    },
  ],
} as const;
