export const pitchDeckPreparationWorkflow = {
  id: "pitch-deck-preparation",
  title: "Pitch Deck Preparation Workflow",
  description:
    "Prepare a clear startup pitch deck for [STARTUP IDEA] in [INDUSTRY] using a practical university presentation structure.",
  estimatedTime: "90-120 minutes",
  steps: [
    {
      title: "Define Pitch Story",
      goal: "Create a simple narrative from problem to solution.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Act as a pitch coach. For [STARTUP IDEA] in [INDUSTRY], create a simple pitch story. Include the problem, who experiences it, why now, the solution, and why this idea is worth presenting.",
      expectedOutput:
        "A concise pitch narrative connecting problem, timing, solution, and opportunity.",
      commonMistakes: [
        "Starting with features before the problem",
        "Making the story too dramatic or vague",
        "Not explaining why the audience should care",
      ],
    },
    {
      title: "Build Slide Outline",
      goal: "Create a complete deck structure for the startup proposal.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Create a pitch deck outline for [STARTUP IDEA] in [INDUSTRY]. Use 8-10 slides covering problem, target customer, current alternatives, solution, value proposition, business model, MVP, go-to-market, and closing. Include slide title and key message for each slide.",
      expectedOutput:
        "An 8-10 slide pitch deck outline with title and key message per slide.",
      commonMistakes: [
        "Adding too many slides",
        "Putting multiple ideas on one slide",
        "Forgetting a clear closing slide",
      ],
    },
    {
      title: "Write Slide Bullet Points",
      goal: "Turn each slide into concise presentation content.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "For the pitch deck of [STARTUP IDEA] in [INDUSTRY], write concise bullet points for each slide. Keep each slide easy to present, avoid long paragraphs, and make the language suitable for university students.",
      expectedOutput:
        "Concise slide bullet points that can be moved into a deck tool.",
      commonMistakes: [
        "Writing full paragraphs on slides",
        "Using jargon without explanation",
        "Repeating the same point across slides",
      ],
    },
    {
      title: "Create Visual Direction",
      goal: "Plan simple visuals that support the pitch.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Create visual direction for a pitch deck about [STARTUP IDEA] in [INDUSTRY]. Suggest simple visuals, diagrams, icons, or charts for each slide. Keep the style clean, student-friendly, and easy to build in the available deck tool.",
      expectedOutput:
        "A slide-by-slide visual plan for a presentation tool.",
      commonMistakes: [
        "Using decoration that does not explain the idea",
        "Overloading slides with charts",
        "Choosing visuals that are hard to create quickly",
      ],
    },
    {
      title: "Prepare Speaker Notes",
      goal: "Create short notes for a confident pitch delivery.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Write speaker notes for a university pitch presentation about [STARTUP IDEA] in [INDUSTRY]. Keep each slide note short, natural, and focused on what the presenter should say in 30-45 seconds.",
      expectedOutput:
        "Short speaker notes for each slide in a natural student presentation style.",
      commonMistakes: [
        "Reading slide text word for word",
        "Making notes too long to practice",
        "Skipping transitions between slides",
      ],
    },
  ],
} as const;
