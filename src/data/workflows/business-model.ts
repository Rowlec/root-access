export const businessModelDesignWorkflow = {
  id: "business-model-design",
  title: "Business Model Design Workflow",
  description:
    "Design a realistic business model for [STARTUP IDEA] in [INDUSTRY] that students can explain clearly in a startup proposal.",
  estimatedTime: "75-105 minutes",
  steps: [
    {
      title: "Identify Who Pays",
      goal: "Clarify the customer, user, and payer for the startup idea.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Act as a startup business model mentor. For [STARTUP IDEA] in [INDUSTRY], identify the user, buyer, and payer. Explain whether they are the same person or different people, and why this matters for the business model.",
      expectedOutput:
        "A clear user-buyer-payer breakdown with implications for monetization.",
      commonMistakes: [
        "Assuming the user is always the payer",
        "Ignoring parents, schools, companies, or partners as possible payers",
        "Choosing a payer without explaining motivation",
      ],
    },
    {
      title: "Compare Revenue Models",
      goal: "Explore practical ways the startup could make money.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], suggest 4 possible revenue models. Include subscription, one-time payment, freemium, commission, partnership, or advertising if relevant. Compare pros, cons, and suitability for a university startup proposal.",
      expectedOutput:
        "A comparison of revenue model options with pros, cons, and fit.",
      commonMistakes: [
        "Choosing a model because it sounds popular",
        "Ignoring customer willingness to pay",
        "Mixing too many revenue models too early",
      ],
    },
    {
      title: "Choose Pricing Logic",
      goal: "Create simple pricing that matches the target customer.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Help me design simple pricing logic for [STARTUP IDEA] in [INDUSTRY]. Suggest pricing tiers or a basic price range, explain why customers would pay, and mention assumptions I need to validate.",
      expectedOutput:
        "A simple pricing recommendation with payer reasoning and validation assumptions.",
      commonMistakes: [
        "Making prices unrealistic for the target segment",
        "Not connecting price to value",
        "Skipping validation of willingness to pay",
      ],
    },
    {
      title: "Estimate Key Costs",
      goal: "Identify the main cost drivers without complex finance.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], list the main cost categories for an early-stage MVP. Include development, operations, marketing, tools, people, and any industry-specific costs. Keep it simple for a university assignment.",
      expectedOutput:
        "A simple cost structure with early-stage cost categories.",
      commonMistakes: [
        "Pretending the startup has no costs",
        "Creating overly detailed financial projections",
        "Forgetting marketing or support costs",
      ],
    },
    {
      title: "Write Business Model Summary",
      goal: "Turn the model into a clear proposal section.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Write a concise business model section for [STARTUP IDEA] in [INDUSTRY]. Include target payer, revenue model, pricing logic, main costs, and why the model can scale. Make it suitable for a university startup proposal.",
      expectedOutput:
        "A proposal-ready business model summary with revenue, pricing, costs, and scalability.",
      commonMistakes: [
        "Writing vague statements like we will make money from users",
        "Forgetting scalability",
        "Using financial language without explanation",
      ],
    },
  ],
} as const;
