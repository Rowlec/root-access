Tốt. Sau i18n, thứ tự hợp lý tiếp theo không phải thêm feature nữa.

Vì hiện tại bạn đã có:

```text
Core workflow
Rule-based engine
Tool-aware adaptation
Persistence
Analytics
i18n
Deploy
```

Tức là đủ để bước sang **quality hardening**.

Làm theo thứ tự này:

---

# Phase 1 — Full Logic Audit (ngay bây giờ)

Mục tiêu:
kiểm tra xem sau khi thêm:

* tool-aware logic
* i18n
* persistence
* workflow adaptation

có bị lệch logic không.

Prompt cho agent:

```txt
Audit the entire Root Access MVP.

Check:

1. Workflow logic consistency
2. Rule-based selector consistency
3. Tool adaptation correctness
4. Prompt-template interpolation correctness
5. Translation consistency (EN/VI)
6. Missing translations
7. localStorage persistence integrity
8. Form validation integrity
9. UI consistency between locales
10. Analytics event correctness

Find:
- critical logic issues
- duplicated logic
- broken state flow
- dead states
- unreachable states
- invalid workflow branches

Do not implement yet.
Only output findings.
```

Đây là bước bắt buộc.

---

# Phase 2 — Workflow Stress Testing

Hiện tại cái quan trọng nhất không phải UI nữa.

Mà là:

```text
Workflow có thực sự usable không?
```

Prompt:

```txt
Stress test the Startup Proposal workflow.

Generate at least 15 realistic user scenarios.

Cover:
- beginner students
- vague startup ideas
- urgent deadlines
- single-tool users
- multi-tool users
- incomplete inputs

Simulate:
- workflow selected
- tool adaptation
- prompt outputs
- likely user confusion points

Find weak workflow points.
```

Mục tiêu:

tìm step thừa
tìm step khó hiểu
tìm prompt yếu

---

# Phase 3 — Workflow Quality Optimization (quan trọng nhất)

Đây là phần quyết định sống chết.

Prompt:

```txt
Review the Startup Proposal workflow deeply.

For each step:
- evaluate usefulness
- evaluate difficulty
- evaluate order
- evaluate prompt clarity
- evaluate output usefulness

Optimize for:
FPT University business students.

Goal:
help them produce:
- clearer startup proposals
- faster first drafts
- better structured thinking

Remove unnecessary complexity.
Improve prompt quality.
Make outputs practical.
```

Nếu phase này yếu, MVP fail dù code đẹp.

---

# Phase 4 — Academic Integrity Layer

Bạn đang ở vùng:

```text
AI hỗ trợ assignment
```

nên phải làm.

Prompt:

```txt
Add Academic Integrity safeguards.

Requirements:
- onboarding disclaimer
- workflow disclaimer
- footer disclaimer

Clarify:
Root Access helps:
- planning
- outlining
- research
- drafting

Root Access does not:
- replace original work
- guarantee correctness
- encourage direct submission of AI output
```

Đây là phòng mentor phản biện.

---

# Phase 5 — Production Hardening

Prompt:

```txt
Prepare Root Access MVP for production.

Audit:
- mobile responsiveness
- loading states
- error states
- empty states
- SEO metadata
- OG metadata
- favicon
- route safety
- accessibility
- performance bottlenecks

Fix everything necessary for stable public testing.
```

---

# Phase 6 — User Validation (ngoài code)

Làm test thật.

Test:

Task:

```text
Làm startup proposal cho môn khởi nghiệp
```

Group A:

```text
Tự dùng ChatGPT
```

Group B:

```text
Dùng Root Access
```

Đo:

```text
Thời gian ra draft đầu tiên
Số lần sửa prompt
Tỷ lệ hoàn thành workflow
Mức độ rõ cấu trúc
Mức độ tự tin
Có dùng lại không
```

---

Thứ tự chuẩn bây giờ:

```text
Audit
→ Stress test
→ Workflow optimization
→ Academic integrity
→ Production hardening
→ Real validation
```

Đây là giai đoạn chuyển từ:

```text
working MVP
```

sang:

```text
defensible MVP
```
