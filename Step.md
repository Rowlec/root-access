---

# Phase 1 — Build an Interactive First-Time Experience

```text
Goal

Completely redesign the first-time user experience of RootAccess.

Current problem

New users open the application and have no idea what RootAccess does or where to start.

Build a complete onboarding experience inspired by Notion, Linear, and Duolingo.

Requirements

1. Detect first-time users.

2. Show a welcome modal explaining:
   - What RootAccess is.
   - What users will accomplish.
   - Estimated completion time.
   - Main workflow.

3. Build a guided tour with spotlight animations.

Guide users through:

- Project information form
- Generate Workflow
- AI Workspace
- Review
- Improve
- Export

Each step should:

- highlight the related UI
- dim the background
- explain why this step exists
- have Next / Back buttons
- allow Skip

4. Add contextual helper tips.

Example:

"You are currently defining your customer segment."

"This information will improve later AI suggestions."

5. Save onboarding completion.

Do not show again unless reset.

6. Add subtle animations.

- fade
- slide
- pulse
- progress transitions

Goal

Users should fully understand the product within 30–45 seconds without reading documentation.
```

---

# Phase 2 — Replace Copy/Paste with AI Workspace

```text
Goal

Transform RootAccess from a prompt generator into an AI workspace.

Current problem

Users constantly switch between RootAccess and ChatGPT/Gemini.

Remove this friction.

Requirements

Integrate Gemini API.

Workflow becomes:

User Input

↓

Generate

↓

Gemini API

↓

Output

↓

Review

↓

Improve

↓

Compare

No manual copy/paste.

Keep every generation inside the application.

Create a clean chat-like interface.

Each generation becomes a Version.

Version contains:

- prompt
- output
- timestamp
- score
- review

Support regeneration.

Support editing prompt before sending.

Support retry.

Maintain conversation history per proposal.

Goal

Users never leave RootAccess while working.
```

---

# Phase 3 — Build a Real AI Review System

```text
Goal

Upgrade the Review system into a real AI quality evaluation engine.

Current problem

Current review only shows a score.

Requirements

Review should evaluate:

- Relevance
- Clarity
- Specificity
- Completeness
- Actionability
- Rubric Alignment

Display

Overall Score

Strengths

Weaknesses

Missing Information

Suggestions

Highlight problematic sections inside the output.

Do not only say

"Specificity is low"

Instead explain WHY.

Example

Pain point is too broad.

Customer segment is unclear.

Revenue model lacks validation.

Add color-coded score bars.

Green

Yellow

Red

Goal

Users immediately understand what is wrong.
```

---

# Phase 4 — Intelligent Improve Loop

```text
Goal

Turn Improve into a continuous optimization loop.

Workflow

Generate

↓

Review

↓

Improve Prompt

↓

Generate Again

↓

Compare

Requirements

Show comparison between:

Old Output

New Output

Old Prompt

New Prompt

Old Score

New Score

Highlight

Improved Sections

Remaining Problems

Score Difference

Add improvement animation.

Example

7.2

↓

8.9

Never automatically replace old versions.

Users must always keep history.

Goal

Users can visually see progress.
```

---

# Phase 5 — Smart Proposal Builder

```text
Goal

Build a complete Proposal Builder.

Requirements

Every workflow step automatically fills proposal sections.

Proposal Progress

Idea

Problem

Customer

Market

Solution

Revenue

Competition

MVP

Validation

Users can jump directly into incomplete sections.

Display completion percentage.

Support manual editing.

Auto-save every change.

Goal

Proposal becomes a living document instead of scattered outputs.
```

---

# Phase 6 — Export System 2.0

```text
Goal

Produce submission-ready documents.

Current problem

AI outputs still contain markdown and conversational text.

Requirements

Before exporting:

Remove:

- markdown
- ** **
- ---
- bullet artifacts
- AI introductions
- AI conclusions

Normalize formatting.

Support

DOCX

PDF

TXT

Professional layout.

Cover page.

Table of contents.

Consistent headings.

Readable spacing.

No AI artifacts should remain.

Export should require zero manual cleanup.
```

---

# Phase 7 — Proposal Dashboard

```text
Goal

Create a dashboard.

Users can:

View all proposals.

Continue unfinished proposals.

Duplicate.

Rename.

Delete.

Search.

Filter.

Display

Progress

Last edited

Score

Versions

Credits used

Goal

Users manage multiple startup projects.
```

---

# Phase 8 — AI Coach

```text
Goal

Build an AI Coach.

This is NOT another chatbot.

The coach understands:

Current workflow step.

Proposal progress.

Previous AI reviews.

Current weaknesses.

Capabilities

Recommend next action.

Warn users before making common mistakes.

Suggest better customer segments.

Detect inconsistent assumptions.

Recommend whether to use ChatGPT or Gemini.

Recommend additional validation.

The coach should proactively guide users throughout the workflow.

Goal

RootAccess feels like an experienced startup mentor rather than a prompt generator.
```

---

# Phase 9 — Polish Everything

```text
Goal

Polish the entire application.

Improve:

Animations

Loading

Skeletons

Transitions

Empty states

Error handling

Mobile responsiveness

Accessibility

Keyboard shortcuts

Success notifications

Micro interactions

Every interaction should feel smooth and professional.

Goal

Deliver a production-quality MVP suitable for a startup pitch and final project demonstration.
```

---

## Theo mình, **còn thiếu một Phase cuối cùng** mà rất nhiều nhóm bỏ qua nhưng lại gây ấn tượng mạnh khi demo:

### **Phase 10 – Business & Monetization Experience**

Đây là phần giúp **BMC khớp hoàn toàn với MVP**, đúng như giảng viên đã nhắc.

```text
Goal

Integrate the business model into the product.

Requirements

1. Implement Credit System.

Every AI action consumes credits.

Before using credits:

Show confirmation dialog.

Explain how many credits will be used.

2. Pricing Page

Implement:

Free

Pro

Premium

Clearly compare:

Credits

Features

AI models

Export formats

Proposal history

3. Subscription Flow

Users can:

Upgrade

View remaining credits

View usage history

View billing status

4. Payment Flow (Prototype)

Implement complete checkout UI.

Payment success page.

Payment failed page.

Subscription activated state.

(Mock payment is acceptable.)

Goal

The MVP should demonstrate a complete product journey:
Discover → Use → Consume Credits → Upgrade → Continue Using.
```

**Nếu hoàn thành được 10 phase này**, RootAccess sẽ không còn giống một "website tạo prompt" nữa mà sẽ trở thành một **AI SaaS hoàn chỉnh**: có onboarding, AI workspace, review, cải thiện, quản lý proposal, export và mô hình thu phí nhất quán với BMC. Đây là mức hoàn thiện phù hợp cho một đồ án cuối kỳ và cũng đủ thuyết phục hơn khi demo.
