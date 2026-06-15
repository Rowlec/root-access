export const ideaValidationWorkflow = {
  id: "idea-validation",
  title: "Idea Validation Workflow",
  description:
    "Validate whether [STARTUP IDEA] solves a real problem in [INDUSTRY] before investing time into a full proposal.",
  estimatedTime: "60-90 minutes",
  steps: [
    {
      title: "Clarify the Core Problem",
      goal: "Turn the startup idea into a specific problem statement.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Act as a startup mentor for a university assignment. My startup idea is [STARTUP IDEA] in [INDUSTRY]. Help me write a clear problem statement. Include who has the problem, when it happens, why it matters, and what makes it painful enough to solve.",
      expectedOutput:
        "A focused problem statement with target user, situation, pain, and importance.",
      commonMistakes: [
        "Starting with product features instead of the problem",
        "Defining a problem that is too broad",
        "Ignoring who feels the problem most often",
      ],
    },
    {
      title: "List Validation Assumptions",
      goal: "Identify the risky assumptions that must be true for the idea to work.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], list the most important assumptions I need to validate. Group them into customer problem, willingness to use, willingness to pay, and feasibility. Explain why each assumption matters for a university startup proposal.",
      expectedOutput:
        "A grouped assumption list ranked by validation importance.",
      commonMistakes: [
        "Validating only technical feasibility",
        "Assuming users will pay without evidence",
        "Skipping problem urgency",
      ],
    },
    {
      title: "Design Interview Questions",
      goal: "Create practical questions for potential customer interviews.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Create 10 customer interview questions to validate [STARTUP IDEA] in [INDUSTRY]. Avoid leading questions. Focus on current behavior, past experiences, pain level, alternatives used, and willingness to try a new solution.",
      expectedOutput:
        "A student-friendly interview guide with non-leading validation questions.",
      commonMistakes: [
        "Asking people if they like the idea",
        "Pitching during the interview",
        "Using yes/no questions only",
      ],
    },
    {
      title: "Define Validation Criteria",
      goal: "Set clear signals for whether the idea is worth continuing.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Help me define simple validation criteria for [STARTUP IDEA] in [INDUSTRY]. Include what positive, neutral, and negative validation would look like after interviewing 5-10 target users.",
      expectedOutput:
        "Clear validation signals and decision criteria for continuing, changing, or stopping the idea.",
      commonMistakes: [
        "Calling any positive comment validation",
        "Not defining success before interviews",
        "Ignoring negative evidence",
      ],
    },
  ],
} as const;
