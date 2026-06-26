export const startupProposalWorkflow = {
  id: "startup-proposal",
  title: "Startup Proposal Micro-step Workflow",
  description:
    "Turn [STARTUP IDEA] in [INDUSTRY] into a proposal-ready outline through focused micro-steps.",
  estimatedTime: "25 minutes",
  steps: [
    {
      title: "Define pain point",
      goal: "Write one clear customer pain point before discussing the solution.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for turning a rough idea into a specific customer problem quickly.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful if you want the pain point organized into a stricter structure.",
          },
        ],
      },
      promptTemplate:
        "Act as a startup mentor. For [STARTUP IDEA] in [INDUSTRY], write one specific customer pain point for [TARGET CUSTOMER]. Keep it to 1-2 sentences. Avoid describing product features.",
      promptAssist: {
        whyItWorks:
          "It forces the AI to name the problem before the solution, which keeps the proposal grounded.",
        aiFocus:
          "The AI should identify who struggles, what hurts, and why the pain matters.",
        customize:
          "Add a real situation you have observed if you already know one.",
        editingMistakes: [
          "Asking for features instead of the problem",
          "Making the pain point broad enough to fit everyone",
        ],
      },
      promptComparison: {
        weakPrompt: "Tell me if my startup idea is good.",
        explanation:
          "The optimized prompt asks for one customer pain point, which produces a usable proposal note instead of a vague opinion.",
      },
      qualityChecklist: [
        "Is the pain point about a customer problem, not a feature?",
        "Can it be explained in 1-2 sentences?",
      ],
      expectedOutput: "One specific customer pain point.",
      commonMistakes: [
        "Starting with the app idea instead of the problem",
        "Using a pain point that is too broad to validate",
      ],
    },
    {
      title: "Define target customer",
      goal: "Name the first customer group you will focus on.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for organizing possible customers into a clear first segment.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for brainstorming a narrower segment from a vague audience.",
          },
        ],
      },
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], suggest one narrow first target customer segment. Use [TARGET CUSTOMER] as the starting point if it is specific enough. Include who they are, their situation, and why they feel the pain strongly.",
      promptAssist: {
        whyItWorks:
          "It narrows the audience before market or business model work begins.",
        aiFocus:
          "The AI should choose one reachable segment, not a broad demographic.",
        customize:
          "Mention campus, location, year level, job role, or behavior if relevant.",
        editingMistakes: [
          "Choosing everyone as the customer",
          "Describing demographics without behavior or pain",
        ],
      },
      promptComparison: {
        weakPrompt: "Who are my customers?",
        explanation:
          "The optimized prompt asks for one first segment and explains why they feel the pain, making the output easier to validate.",
      },
      qualityChecklist: [
        "Is there only one primary customer group?",
        "Is the group reachable for student validation?",
      ],
      expectedOutput: "One narrow target customer segment.",
      commonMistakes: [
        "Naming too many segments",
        "Choosing a segment you cannot contact",
      ],
    },
    {
      title: "List risky assumptions",
      goal: "Identify what must be true for the idea to work.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for quickly surfacing hidden assumptions behind an idea.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful when you want assumptions grouped by customer, market, and product risk.",
          },
        ],
      },
      promptTemplate:
        "For [STARTUP IDEA] serving [TARGET CUSTOMER] in [INDUSTRY], list the 3 riskiest assumptions that must be true. Make each assumption testable within one week.",
      promptAssist: {
        whyItWorks:
          "It turns uncertainty into testable statements instead of letting the proposal sound overconfident.",
        aiFocus:
          "The AI should focus on assumptions about customer pain, willingness to try, and willingness to pay or switch.",
        customize:
          "Add what you already believe about the customer so the AI can challenge it.",
        editingMistakes: [
          "Listing facts instead of assumptions",
          "Using assumptions that cannot be tested soon",
        ],
      },
      promptComparison: {
        weakPrompt: "What could go wrong?",
        explanation:
          "The optimized prompt asks for testable assumptions, which helps the student plan validation instead of listing generic risks.",
      },
      qualityChecklist: [
        "Are there exactly 3 assumptions?",
        "Can each assumption be tested within one week?",
      ],
      expectedOutput: "Three testable risky assumptions.",
      commonMistakes: [
        "Writing vague risks",
        "Skipping willingness-to-use or willingness-to-pay assumptions",
      ],
    },
    {
      title: "Choose validation action",
      goal: "Pick one action you can do next to test the riskiest assumption.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for turning assumptions into a quick validation task.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful for making the validation plan more structured.",
          },
        ],
      },
      promptTemplate:
        "Choose one simple validation action for [STARTUP IDEA] that a student can do this week. It should test the riskiest assumption for [TARGET CUSTOMER]. Include the action, who to ask, and what result would count as a signal.",
      promptAssist: {
        whyItWorks:
          "It links validation to a specific assumption, so the next step is practical.",
        aiFocus:
          "The AI should recommend one small action, not a full research project.",
        customize:
          "Mention how much time you have before the deadline: [DEADLINE URGENCY].",
        editingMistakes: [
          "Choosing an action that takes too long",
          "Not defining what signal you are looking for",
        ],
      },
      promptComparison: {
        weakPrompt: "How do I validate this?",
        explanation:
          "The optimized prompt asks for one action, target respondent, and success signal, making validation easier to execute.",
      },
      qualityChecklist: [
        "Is there one concrete validation action?",
        "Is the success signal clear?",
      ],
      expectedOutput: "One validation action with a target respondent and signal.",
      commonMistakes: [
        "Planning a large survey before talking to users",
        "Treating likes or compliments as validation",
      ],
    },
    {
      title: "Narrow first market segment",
      goal: "Turn the target customer into a proposal-friendly first market segment.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for organizing segment details into a clean structure.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for refining a rough customer description.",
          },
        ],
      },
      promptTemplate:
        "Define the first market segment for [STARTUP IDEA] in [INDUSTRY]. Keep it narrow. Include customer type, context, pain level, and why this segment is the best first focus.",
      promptAssist: {
        whyItWorks:
          "It keeps market work focused on an early segment instead of jumping to total market size.",
        aiFocus:
          "The AI should explain why this segment is reachable and relevant.",
        customize:
          "Add a geography or campus context if the assignment needs it.",
        editingMistakes: [
          "Starting with total addressable market",
          "Choosing a segment that is too abstract",
        ],
      },
      promptComparison: {
        weakPrompt: "Describe my market.",
        explanation:
          "The optimized prompt asks for a first segment, making the answer concrete enough for proposal notes.",
      },
      qualityChecklist: [
        "Is the segment narrow?",
        "Does it explain why this segment comes first?",
      ],
      expectedOutput: "A focused first market segment.",
      commonMistakes: [
        "Calling the market everyone",
        "Skipping why the segment is reachable",
      ],
    },
    {
      title: "Map current alternatives",
      goal: "List what customers currently use instead of your idea.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for structuring alternatives by behavior and need.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful when you need help brainstorming substitutes.",
          },
        ],
      },
      promptTemplate:
        "For [TARGET CUSTOMER] with the pain point behind [STARTUP IDEA], list 3 current alternatives or substitutes they may use. For each, explain what works and what is still frustrating.",
      promptAssist: {
        whyItWorks:
          "It shows that the proposal understands existing behavior, not just competitors.",
        aiFocus:
          "The AI should include informal workarounds as well as direct competitors.",
        customize:
          "Add any competitor or substitute you already know.",
        editingMistakes: [
          "Only listing famous companies",
          "Ignoring manual or offline workarounds",
        ],
      },
      promptComparison: {
        weakPrompt: "Who are my competitors?",
        explanation:
          "The optimized prompt includes substitutes and workarounds, which better reflects what customers do now.",
      },
      qualityChecklist: [
        "Are there 3 alternatives or substitutes?",
        "Does each include a remaining frustration?",
      ],
      expectedOutput: "Three current alternatives with strengths and frustrations.",
      commonMistakes: [
        "Only naming direct competitors",
        "Not explaining why users still feel pain",
      ],
    },
    {
      title: "Choose research channel",
      goal: "Pick where you will find evidence or customer input.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for organizing research channels into practical options.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for brainstorming interview or survey places.",
          },
        ],
      },
      promptTemplate:
        "Suggest 3 realistic research channels for validating [STARTUP IDEA] with [TARGET CUSTOMER]. Include where to find people or sources, what to ask or search, and what evidence to collect.",
      promptAssist: {
        whyItWorks:
          "It connects customer validation to concrete research channels.",
        aiFocus:
          "The AI should recommend channels a student can actually access.",
        customize:
          "Mention your school, class, community, or online group if relevant.",
        editingMistakes: [
          "Choosing channels you cannot access",
          "Collecting opinions without evidence",
        ],
      },
      promptComparison: {
        weakPrompt: "Where should I research?",
        explanation:
          "The optimized prompt asks for channels, questions, and evidence, which makes research actionable.",
      },
      qualityChecklist: [
        "Are the channels realistic for a student?",
        "Is the evidence to collect clear?",
      ],
      expectedOutput: "Three realistic research channels with evidence goals.",
      commonMistakes: [
        "Relying only on AI-generated facts",
        "Skipping direct customer input",
      ],
    },
    {
      title: "List facts to verify",
      goal: "Create a short evidence checklist for market or competitor claims.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for organizing verification tasks into a checklist.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for turning rough market notes into clear claims.",
          },
        ],
      },
      promptTemplate:
        "For [STARTUP IDEA] in [INDUSTRY], list 3 market or competitor facts I should verify before using them in a proposal. For each fact, say why it matters and what kind of source would be acceptable.",
      promptAssist: {
        whyItWorks:
          "It prevents unsupported AI claims from becoming proposal evidence.",
        aiFocus:
          "The AI should separate claims from sources and verification needs.",
        customize:
          "Add any fact your teacher expects, such as market size or competitor count.",
        editingMistakes: [
          "Accepting AI claims without checking them",
          "Using facts that do not support the proposal argument",
        ],
      },
      promptComparison: {
        weakPrompt: "Give me market facts.",
        explanation:
          "The optimized prompt asks for facts to verify and source types, keeping the student in control of evidence quality.",
      },
      qualityChecklist: [
        "Are there 3 facts to verify?",
        "Does each fact include a source expectation?",
      ],
      expectedOutput: "Three facts to verify with source expectations.",
      commonMistakes: [
        "Using unsourced numbers",
        "Mixing competitor opinion with verified evidence",
      ],
    },
    {
      title: "Choose revenue model",
      goal: "Pick one simple way the startup could make money.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for quickly connecting customer value to revenue logic.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful for comparing model options in a structured way.",
          },
        ],
      },
      promptTemplate:
        "Suggest one practical revenue model for [STARTUP IDEA] serving [TARGET CUSTOMER]. Explain who pays, what they pay for, and why this model fits a student startup proposal.",
      promptAssist: {
        whyItWorks:
          "It keeps the business model focused instead of listing many options.",
        aiFocus:
          "The AI should connect the payer, value, and fit with the customer pain.",
        customize:
          "Mention whether this is B2C, B2B, school-based, or community-based if you know.",
        editingMistakes: [
          "Asking for too many revenue models",
          "Choosing a payer who does not receive value",
        ],
      },
      promptComparison: {
        weakPrompt: "Give me a business model.",
        explanation:
          "The optimized prompt asks for one model and payer logic, making the answer easier to defend.",
      },
      qualityChecklist: [
        "Is there one revenue model?",
        "Is the payer clearly named?",
      ],
      expectedOutput: "One revenue model with payer logic.",
      commonMistakes: [
        "Choosing ads without explaining scale",
        "Confusing user and payer",
      ],
    },
    {
      title: "Set pricing logic",
      goal: "Draft a simple pricing assumption for the proposal.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for turning pricing ideas into clear assumptions.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for brainstorming a quick starting price.",
          },
        ],
      },
      promptTemplate:
        "Create a simple pricing assumption for [STARTUP IDEA]. Include the pricing unit, a rough price range, why [TARGET CUSTOMER] might accept it, and what must be tested later.",
      promptAssist: {
        whyItWorks:
          "It treats pricing as an assumption, not a final number.",
        aiFocus:
          "The AI should explain the pricing unit and what needs validation.",
        customize:
          "Add any budget constraint or competitor price you already know.",
        editingMistakes: [
          "Picking a random price without logic",
          "Presenting pricing as final before testing",
        ],
      },
      promptComparison: {
        weakPrompt: "How much should I charge?",
        explanation:
          "The optimized prompt asks for a pricing assumption and validation needs, which is more proposal-safe.",
      },
      qualityChecklist: [
        "Is the pricing unit clear?",
        "Is the price framed as an assumption to test?",
      ],
      expectedOutput: "A simple pricing assumption.",
      commonMistakes: [
        "Making pricing too complicated",
        "Ignoring customer willingness to pay",
      ],
    },
    {
      title: "Compare competitor difference",
      goal: "State how the idea is different from existing options.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for structured side-by-side comparison.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for turning messy competitor notes into simple wording.",
          },
        ],
      },
      promptTemplate:
        "Compare [STARTUP IDEA] with 2 likely competitors or substitutes. Keep it brief. For each, state the current option, its weakness, and the clearest difference of my idea. Mark claims that need verification.",
      promptAssist: {
        whyItWorks:
          "It keeps differentiation tied to customer value and verification.",
        aiFocus:
          "The AI should compare by user pain and value, not hype.",
        customize:
          "Add known competitors if your teacher expects them.",
        editingMistakes: [
          "Claiming uniqueness without comparison",
          "Using competitor claims without checking them",
        ],
      },
      promptComparison: {
        weakPrompt: "Why is my idea unique?",
        explanation:
          "The optimized prompt asks for comparison against alternatives, which makes differentiation more credible.",
      },
      qualityChecklist: [
        "Are 2 competitors or substitutes compared?",
        "Is the difference tied to customer value?",
      ],
      expectedOutput: "A brief competitor difference comparison.",
      commonMistakes: [
        "Saying no competitors exist",
        "Comparing features without user value",
      ],
    },
    {
      title: "Define MVP scope",
      goal: "Choose the smallest version of the idea that can be tested.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for cutting a broad idea down to a testable first version.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful for organizing MVP scope into must-have and later features.",
          },
        ],
      },
      promptTemplate:
        "Define a simple MVP scope for [STARTUP IDEA]. Include 3 must-have functions, 2 things to exclude for now, and the first user action the MVP should support.",
      promptAssist: {
        whyItWorks:
          "It prevents the proposal from becoming too large for a student project.",
        aiFocus:
          "The AI should choose only what is needed to test the main value.",
        customize:
          "Add any technical or time constraint before running the prompt.",
        editingMistakes: [
          "Adding every possible feature",
          "Skipping what should be excluded",
        ],
      },
      promptComparison: {
        weakPrompt: "What features should my app have?",
        explanation:
          "The optimized prompt limits the MVP to must-haves and exclusions, making the plan easier to execute.",
      },
      qualityChecklist: [
        "Are there only 3 must-have functions?",
        "Are exclusions listed clearly?",
      ],
      expectedOutput: "A small MVP scope with must-haves and exclusions.",
      commonMistakes: [
        "Planning a full platform too early",
        "Confusing MVP with final product",
      ],
    },
    {
      title: "Draft proposal outline",
      goal: "Combine the notes into a proposal outline, not a final essay.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for assembling previous notes into a clean outline quickly.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful for organizing the outline into required sections.",
          },
        ],
      },
      promptTemplate:
        "Using [STARTUP IDEA] in [INDUSTRY] for [TARGET CUSTOMER], create a concise startup proposal outline. Include problem, target customer, validation evidence to collect, value proposition, business model, competitor difference, MVP scope, and next validation step. Use bullets only. Do not write a final essay.",
      promptAssist: {
        whyItWorks:
          "It produces working material while preserving academic integrity.",
        aiFocus:
          "The AI should organize sections and highlight missing evidence.",
        customize:
          "Add your teacher's required headings or rubric if available.",
        editingMistakes: [
          "Changing the prompt into a full essay request",
          "Removing verification notes",
        ],
      },
      promptComparison: {
        weakPrompt: "Write my startup proposal for me.",
        explanation:
          "The optimized prompt asks for an outline with bullets, so the student still reviews, verifies, and rewrites.",
      },
      qualityChecklist: [
        "Is the output an outline, not an essay?",
        "Are missing facts marked for verification?",
      ],
      expectedOutput: "A concise proposal outline.",
      commonMistakes: [
        "Submitting the AI outline as final writing",
        "Making the outline too long to revise",
      ],
    },
    {
      title: "Plan verification edits",
      goal: "Decide what must be checked or rewritten before submission.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for turning an outline into a review checklist.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for spotting weak or vague proposal sections.",
          },
        ],
      },
      promptTemplate:
        "Review this startup proposal outline for [STARTUP IDEA]. Create a short edit checklist: 3 claims to verify, 2 sections to rewrite in my own voice, and 1 next action before submission. Keep it concise.",
      promptAssist: {
        whyItWorks:
          "It makes the final step about review and verification, not copying AI output.",
        aiFocus:
          "The AI should identify weak evidence, unclear sections, and the next action.",
        customize:
          "Paste your outline before running this prompt.",
        editingMistakes: [
          "Skipping verification before submission",
          "Only asking for grammar fixes",
        ],
      },
      promptComparison: {
        weakPrompt: "Make my proposal better.",
        explanation:
          "The optimized prompt asks for verification, rewriting, and a next action, making revision concrete.",
      },
      qualityChecklist: [
        "Are claims to verify listed?",
        "Are rewrite tasks clear?",
      ],
      expectedOutput: "A short verification and editing checklist.",
      commonMistakes: [
        "Only polishing language",
        "Leaving AI-sounding sections unchanged",
      ],
    },
    {
      title: "Estimate willingness to pay",
      goal: "Name what would make the customer willing to pay or refuse.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for structuring payment motivators, objections, and a testable question.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for brainstorming customer objections before organizing them.",
          },
        ],
      },
      promptTemplate:
        "For [STARTUP IDEA] serving [TARGET CUSTOMER], estimate the strongest reasons customers might pay and the strongest reasons they might refuse. Include one simple question I can ask this week to test willingness to pay.",
      promptAssist: {
        whyItWorks:
          "It treats payment as a testable assumption instead of a guess.",
        aiFocus:
          "The AI should separate customer value, budget limits, and payment objections.",
        customize:
          "Add any known budget, current spending, or substitute price if you have one.",
        editingMistakes: [
          "Assuming users will pay because they like the idea",
          "Skipping who controls the budget",
        ],
      },
      promptComparison: {
        weakPrompt: "Will people pay for this?",
        explanation:
          "The optimized prompt asks for motivators, objections, and one test question, making the revenue assumption easier to validate.",
      },
      qualityChecklist: [
        "Are both payment motivators and objections listed?",
        "Is there one question to test willingness to pay?",
      ],
      expectedOutput:
        "Payment motivators, payment objections, and one validation question.",
      commonMistakes: [
        "Treating positive feedback as willingness to pay",
        "Ignoring whether the user and payer are different people",
      ],
    },
    {
      title: "Define core value",
      goal: "State the one value the MVP must prove first.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for cutting a broad product idea down to one clear value promise.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful when you want the value promise written in a stricter structure.",
          },
        ],
      },
      promptTemplate:
        "For [STARTUP IDEA] serving [TARGET CUSTOMER], define the single core value the MVP must prove. Keep it to one sentence, then explain the first user action that would show this value is real.",
      promptAssist: {
        whyItWorks:
          "It forces the MVP to prove one value before adding features.",
        aiFocus:
          "The AI should connect the value promise to a concrete user action.",
        customize:
          "Add your main customer pain point if you already identified it.",
        editingMistakes: [
          "Describing the product instead of the value",
          "Choosing more than one core promise",
        ],
      },
      promptComparison: {
        weakPrompt: "What should my MVP do?",
        explanation:
          "The optimized prompt starts with core value, so feature decisions stay tied to a testable purpose.",
      },
      qualityChecklist: [
        "Is the core value written as one sentence?",
        "Is there a user action that proves the value?",
      ],
      expectedOutput: "One core value statement and one proof action.",
      commonMistakes: [
        "Listing many benefits at once",
        "Making the MVP prove something too broad",
      ],
    },
    {
      title: "Prioritize MVP features",
      goal: "Choose only the features needed for the first test.",
      timebox: "Under 2 minutes",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Best for organizing feature priority into must-have and later groups.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Useful for quickly brainstorming feature candidates before prioritizing.",
          },
        ],
      },
      promptTemplate:
        "Prioritize MVP features for [STARTUP IDEA] serving [TARGET CUSTOMER]. List 3 must-have features for the first test, 2 later features, and why each must-have supports the core value.",
      promptAssist: {
        whyItWorks:
          "It separates launch scope from later ideas, reducing MVP overload.",
        aiFocus:
          "The AI should justify each must-have by the core value, not by what sounds impressive.",
        customize:
          "Mention any deadline, technical limit, or no-code constraint.",
        editingMistakes: [
          "Calling every feature a must-have",
          "Prioritizing impressive features over testable value",
        ],
      },
      promptComparison: {
        weakPrompt: "List MVP features.",
        explanation:
          "The optimized prompt asks for priority groups and reasons, so the MVP scope is easier to defend.",
      },
      qualityChecklist: [
        "Are there exactly 3 must-have features?",
        "Does each must-have support the core value?",
      ],
      expectedOutput: "Three must-have features, two later features, and reasons.",
      commonMistakes: [
        "Building a full product instead of a test",
        "Leaving later features inside the launch scope",
      ],
    },
    {
      title: "Choose MVP exclusions",
      goal: "Decide what not to build in the first version.",
      timebox: "Under 2 minutes",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Best for making practical tradeoffs when the MVP is getting too large.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Useful when you want exclusions grouped by effort, risk, and user value.",
          },
        ],
      },
      promptTemplate:
        "For [STARTUP IDEA], list 3 features or activities to exclude from the MVP now. For each exclusion, explain why it can wait and what simple evidence would justify adding it later.",
      promptAssist: {
        whyItWorks:
          "It makes scope control explicit instead of quietly expanding the MVP.",
        aiFocus:
          "The AI should explain tradeoffs and evidence needed before adding more scope.",
        customize:
          "Add anything your team is tempted to build even though it may be too much.",
        editingMistakes: [
          "Excluding nothing",
          "Removing features without explaining when they might return",
        ],
      },
      promptComparison: {
        weakPrompt: "What should I remove?",
        explanation:
          "The optimized prompt asks for exclusions, reasons, and future evidence, making the scope decision clearer.",
      },
      qualityChecklist: [
        "Are there 3 clear exclusions?",
        "Does each exclusion include a reason and future evidence?",
      ],
      expectedOutput: "Three MVP exclusions with reasons and future evidence.",
      commonMistakes: [
        "Keeping nice-to-have features in the MVP",
        "Treating exclusions as permanent decisions",
      ],
    },
  ],
} as const;
