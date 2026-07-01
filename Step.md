Đây là kế hoạch prompt hợp lý nhất cho RootAccess hiện tại, theo hướng mới:

Core identity:

```text
RootAccess = AI Workflow + Output Review + Prompt Improvement
```

Không generate hộ kết quả.
Không biến thành content generator.

---

# PRODUCT FLOW (phải giữ cố định)

User journey:

```text
1. User chọn workflow
2. RootAccess tạo prompt khởi đầu
3. User copy sang ChatGPT/Gemini
4. User paste output về RootAccess
5. RootAccess chấm điểm output
6. RootAccess chỉ ra lỗi
7. RootAccess gợi ý prompt tốt hơn
8. User retry
9. Compare improvement
10. Complete step
```

Flow này cực quan trọng vì:

* dễ hiểu
* đúng thesis
* không overload

---

# PROMPT IMPLEMENTATION PLAN (Codex)

Chạy theo phase này. Không nhảy.

---

## PHASE 1 — Rebuild onboarding clarity

Mục tiêu:

Người mới vào phải hiểu app làm gì trong 5 giây.

Prompt:

PHASE 1 — ONBOARDING CLARITY

Refactor onboarding.

Goal:
Make RootAccess understandable for first-time users immediately.

Tasks:

Replace vague landing explanation.

New hero:
"Improve how you use AI for Startup Proposals."

Subtext:
RootAccess helps you:

1. build better prompts
2. test them with AI
3. review the output
4. improve until it works

Add a 3-step visual flow:

Generate Prompt
→ Test with AI
→ Get Feedback

Add "How it works" section before entering workflow.

Remove anything that makes the app look like a prompt library.

Priority:
clarity first.

---

## PHASE 2 — Simplify workflow UI

Mục tiêu:

Không overload.

Chỉ giữ 3 layer.

Prompt:

PHASE 2 — SIMPLIFY WORKFLOW UI

Refactor each workflow step.

Keep only:

1. Action Layer (always open)

* objective
* prompt
* copy button
* paste output

2. Review Layer (locked until output exists)

* output score
* weakness detection
* prompt improvement

3. Retry Layer

* improved prompt
* retry button
* compare previous vs new output

Remove:

* excessive coaching text
* long explanations
* too many accordions
* unnecessary tool comparisons

Goal:
Make each step feel fast and lightweight.

---

## PHASE 3 — Build Output Score Engine

Đây là core moat.

Prompt:

PHASE 3 — BUILD OUTPUT SCORE ENGINE

Build a lightweight scoring engine.

Input:
user pasted AI output.

Score across 4 dimensions:

1. Relevance (0-10)
2. Specificity (0-10)
3. Actionability (0-10)
4. Clarity (0-10)

Total score:
0-40

Show:

* total score
* score breakdown
* simple explanation

Example:
28/40
Strong idea, but customer segment is still too broad.

Important:
Scoring must stay simple and understandable.

Do not overcomplicate.

---

## PHASE 4 — Build Weakness Detection

Cực quan trọng.

Prompt:

PHASE 4 — BUILD WEAKNESS DETECTION

After scoring, detect weaknesses.
  
Possible weaknesses:

* too broad
* unclear customer
* weak pain point
* no urgency
* solution-first thinking
* unrealistic assumptions

Show only top 2 weaknesses.

Do not overwhelm users.

Format:

Weakness found:
1.
2.

Goal:
Make feedback actionable.

---

## PHASE 5 — Build Prompt Improvement Engine

Đây là retention engine.

Prompt:

PHASE 5 — BUILD PROMPT IMPROVEMENT ENGINE

After weakness detection:

Generate an improved version of the user's original prompt.

Logic:
Original prompt
+
AI output weaknesses
====================

Better prompt

Show:

Old Prompt
Improved Prompt

Add:
"Why this is better"

Keep explanation short.

Goal:
Teach prompt improvement through iteration.

---

## PHASE 6 — Retry Loop

Đây là human-in-the-loop.

Prompt:

PHASE 6 — BUILD RETRY LOOP

Allow users to retry with improved prompt.

Flow:

Copy improved prompt
→ run in ChatGPT/Gemini
→ paste new output
→ re-score

Store both:
old output
new output

Show improvement comparison.

Example:

Old Score: 21/40
New Score: 33/40

Goal:
Make progress visible.

---

## PHASE 7 — Progress System

Mục tiêu:

Cho user biết họ đang làm gì.

Prompt:

PHASE 7 — REBUILD PROGRESS SYSTEM

Show workflow progress.

Not micro-step progress.

Use:

Proposal Progress

Sections:

* Problem
* Customer
* Validation
* Revenue
* MVP Scope

Show:
completed
current
remaining

Keep sticky on desktop.

Keep compact on mobile.

---

## PHASE 8 — Monetization Fit (CP3)

Phải khớp BMC.

Prompt:

PHASE 8 — CREDIT SYSTEM FOR BMC FIT

Build a credit system.

Free:

* 5 prompt generations
* 5 output reviews
* 3 improved prompts

Pro:

* unlimited

Add:

visible credits
upgrade modal
fake checkout flow

No payment integration.

Purpose:
show business model fit for CP3.

---

# FINAL CHECKLIST (rất quan trọng)

Nếu làm xong, RootAccess phải trả lời rõ:

User hỏi:

```text
App này làm gì?
```

User phải hiểu ngay:

```text
Nó giúp tôi tạo prompt tốt hơn, kiểm tra output AI, và cải thiện prompt từng vòng để làm proposal tốt hơn.
```

Nếu user hiểu khác:

```text
nó generate proposal hộ tôi
```

=> sai.

Nếu user hiểu:

```text
nó chỉ là thư viện prompt
```

=> sai.

Target understanding phải là:

```text
AI skill improvement through structured workflow.
```

Đây là version fit nhất với:

* ý tưởng gốc
* mentor feedback
* CP3 BMC
* retention
* low overload
* clear product identity.
