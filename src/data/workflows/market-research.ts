export const marketResearchWorkflow = {
  id: "market-research",
  title: "Market Research Workflow",
  description:
    "Research the market, customers, and existing alternatives for [STARTUP IDEA] in [INDUSTRY].",
  estimatedTime: "90-120 minutes",
  steps: [
    {
      title: "Define Research Scope",
      goal: "Decide what market information is needed for the proposal.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Act as a startup research assistant. My startup idea is [STARTUP IDEA] in [INDUSTRY]. Define a practical market research scope for a university assignment. Include target customer, market segment, geography, competitors, and key questions to answer.",
      expectedOutput:
        "A focused research plan with customer segment, market boundaries, and research questions.",
      commonMistakes: [
        "Researching the entire industry instead of a focused segment",
        "Skipping the target customer definition",
        "Collecting facts that do not support the proposal",
      ],
    },
    {
      title: "Identify Customer Segments",
      goal: "Break the market into reachable student-research-friendly customer groups.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], identify 3-5 possible customer segments. For each segment, describe needs, behavior, pain points, ability to pay, and how a university student could reach them for research.",
      expectedOutput:
        "A customer segment table with needs, behavior, pain points, and reachability.",
      commonMistakes: [
        "Choosing segments that are impossible to contact",
        "Grouping users only by age",
        "Assuming all users have the same need",
      ],
    },
    {
      title: "Map Competitors",
      goal: "Find direct, indirect, and substitute solutions.",
      recommendedTool: "Gemini",
      promptTemplate:
        "Research competitors for [STARTUP IDEA] in [INDUSTRY]. List direct competitors, indirect competitors, and substitute solutions. For each, include what they offer, target users, strengths, weaknesses, and what claims need source verification.",
      expectedOutput:
        "A competitor map with direct, indirect, and substitute alternatives plus verification notes.",
      commonMistakes: [
        "Claiming there are no competitors",
        "Only listing famous companies",
        "Not checking AI-generated competitor names",
      ],
    },
    {
      title: "Summarize Market Trends",
      goal: "Connect the idea to relevant trends without overclaiming.",
      recommendedTool: "Gemini",
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], summarize relevant market trends that support the opportunity. Keep it suitable for a university startup proposal and include source types, keywords, or links I should use to verify the trends.",
      expectedOutput:
        "A concise trend summary with verification keywords and source suggestions.",
      commonMistakes: [
        "Using trends that are too generic",
        "Making unsupported market size claims",
        "Forgetting to verify sources",
      ],
    },
    {
      title: "Create Research Summary",
      goal: "Turn research into proposal-ready insights.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Use the research about [STARTUP IDEA] in [INDUSTRY] to create a proposal-ready market research summary. Include target segment, key customer pain, competitor gap, trend support, and remaining unknowns.",
      expectedOutput:
        "A structured market research summary that can be added to a startup proposal.",
      commonMistakes: [
        "Listing facts without insight",
        "Ignoring remaining unknowns",
        "Writing too much for a proposal section",
      ],
    },
  ],
} as const;
