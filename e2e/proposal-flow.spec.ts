import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const sectionIds = [
  "problem",
  "customer",
  "revenue",
  "mvp",
  "differentiation",
] as const;

const builderSectionIds = [
  "idea",
  "problem",
  "customer",
  "market",
  "solution",
  "revenue",
  "competition",
  "mvp",
  "validation",
] as const;

const projectContext = {
  availableTools: ["Gemini"],
  currentStage: "No clear idea yet",
  deadlineUrgency: "No deadline",
  industry: "EdTech",
  startupIdea: "StudyMatch connects university students into focused study groups.",
  targetCustomer: "First- and second-year university students",
  workflowMode: "deep",
};

const originalOutput = [
  "First-year university students struggle to find compatible study partners for difficult courses.",
  "The team will interview 15 students and measure whether suggested groups meet at least twice in the first week.",
].join("\n\n");

function createRunId() {
  const source = JSON.stringify({
    idea: projectContext.startupIdea,
    industry: projectContext.industry,
    targetCustomer: projectContext.targetCustomer,
    locale: "vi",
  });
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function createReview() {
  const dimension = { reason: "The output is specific and actionable.", score: 8 };

  return {
    coach: {
      currentOutputSummary: "A focused student problem and a measurable validation plan.",
      recommendations: ["Interview students before expanding the scope."],
      remainingWeaknesses: ["Validate the frequency of the problem."],
      strengthsImproved: ["The target user is specific."],
    },
    frameworkChecks: ["specificity", "urgency", "validation ability"],
    frameworkTitle: "Problem Review",
    missingInformation: ["Evidence from interviews"],
    problematicPassages: [],
    score: {
      breakdown: {
        actionability: dimension,
        clarity: dimension,
        completeness: dimension,
        relevance: dimension,
        rubricAlignment: dimension,
        specificity: dimension,
      },
      explanation: "The output is ready for a first review.",
      total: 48,
    },
    strengths: ["Clear target user"],
    suggestions: ["Add interview evidence before submission."],
    weaknesses: ["Problem frequency still needs evidence."],
  };
}

function createCompletedWorkspace() {
  return Object.fromEntries(
    sectionIds.map((sectionId) => [
      sectionId,
      {
        completed: true,
        generationVersions: [
          {
            createdAt: "2026-08-07T00:00:00.000Z",
            id: `${sectionId}-v1`,
            kind: "original",
            label: "v1",
            output: `${originalOutput}\n\nSection: ${sectionId}.`,
            prompt: `Create the ${sectionId} section.`,
            review: createReview(),
          },
        ],
        improvementComparisons: [],
        improvedPromptCopied: false,
        improvementSkipped: true,
        originalOutput: `${originalOutput}\n\nSection: ${sectionId}.`,
        originalPrompt: `Create the ${sectionId} section.`,
        originalReview: createReview(),
        regressionNotice: "",
        retryOutput: "",
        retryPrompt: "",
        retryReview: null,
        reviewHistory: [],
      },
    ]),
  );
}

function createBuilderDocument() {
  return {
    sections: Object.fromEntries(
      builderSectionIds.map((sectionId) => [
        sectionId,
        {
          content: `StudyMatch ${sectionId} content. The team will validate this assumption with university students before making a final claim.`,
          isManual: true,
          sourceContent: "",
          updatedAt: "2026-08-07T00:00:00.000Z",
        },
      ]),
    ),
  };
}

async function seedProject(
  page: Page,
  options: { builder?: ReturnType<typeof createBuilderDocument>; workspace?: unknown } = {},
) {
  const workflowRunId = createRunId();

  await page.goto("/");
  await page.evaluate(
    ({ builder, context, runId, workspace }) => {
      window.localStorage.setItem("root-access:startup-context", JSON.stringify(context));
      // The product tour is intentionally shown only on a first visit. E2E tests
      // exercise the workspace itself, so they begin after that one-time tour.
      window.localStorage.setItem(
        "root-access:onboarding:v1",
        JSON.stringify({ status: "complete", step: 5 }),
      );
      window.localStorage.removeItem(`root-access:workflow-review:${runId}`);
      window.localStorage.removeItem(`root-access:proposal-builder:${runId}`);

      if (workspace) {
        window.localStorage.setItem(
          `root-access:workflow-review:${runId}`,
          JSON.stringify(workspace),
        );
      }

      if (builder) {
        window.localStorage.setItem(
          `root-access:proposal-builder:${runId}`,
          JSON.stringify(builder),
        );
      }
    },
    {
      builder: options.builder,
      context: projectContext,
      runId: workflowRunId,
      workspace: options.workspace,
    },
  );
}

test("keeps the guided tour aligned with the create, review, improve, and export flow", async ({ page }) => {
  await page.route("**/api/gemini/generate", async (route) => {
    await route.fulfill({ json: { output: originalOutput } });
  });
  await page.route("**/api/gemini/review", async (route) => {
    await route.fulfill({ json: { review: createReview() } });
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Chào mừng bạn đến với Root Access" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chỉ tôi cách sử dụng" }).click();
  await expect(
    page.getByRole("heading", { name: "Bắt đầu bằng project context hữu ích" }),
  ).toBeVisible();

  await page.getByRole("dialog").getByRole("button", { name: "Tiếp theo" }).click();
  await expect(
    page.getByRole("heading", { name: "Mở workspace theo từng bước" }),
  ).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Mở workspace" }).click();
  await expect(page.getByText("Tour đang chờ ở bước workspace")).toBeVisible();

  await page.locator("#startupIdea").fill(projectContext.startupIdea);
  await page.locator("#industry").fill(projectContext.industry);
  await page.locator("#targetCustomer").fill(projectContext.targetCustomer);
  await page.getByRole("button", { name: "Bắt đầu proposal review" }).click();
  await expect(page).toHaveURL(/\/result\/problem\/generate$/);
  await expect(
    page.getByRole("heading", { name: "Tạo output có định hướng" }),
  ).toBeVisible();

  await page.locator('[data-generation-action="original"]').click();
  await expect(page.locator("#ai-output")).toHaveValue(originalOutput);
  await page.getByRole("dialog").getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page).toHaveURL(/\/result\/problem\/review$/);

  await page.locator('[data-review-action="original"]').click();
  await page.locator('[data-credit-confirm="true"]').click();
  await expect(page.locator('[data-review-scores="true"]')).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page).toHaveURL(/\/result\/problem\/improve$/);
  await expect(
    page.getByRole("heading", { name: "Cải thiện chỉ khi feedback cho thấy cần thiết" }),
  ).toBeVisible();

  await page.getByRole("dialog").getByRole("button", { name: "Tiếp theo" }).click();
  await expect(
    page.getByRole("heading", { name: "Xuất bản nháp vào đúng lúc" }),
  ).toBeVisible();
  await expect(
    page.locator('[data-onboarding-spotlight="export"]'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Xuất bản nháp" })).toBeEnabled();

  const artifactDirectory = resolve(process.cwd(), "e2e-artifacts");
  mkdirSync(artifactDirectory, { recursive: true });
  const screenshotPath = resolve(artifactDirectory, "onboarding-export-tour.png");
  await page.screenshot({ path: screenshotPath });
  expect(statSync(screenshotPath).size).toBeGreaterThan(5_000);
});

test("guides a student through create output, review, and improve", async ({ page }) => {
  await seedProject(page);

  await page.route("**/api/gemini/generate", async (route) => {
    await route.fulfill({ json: { output: originalOutput } });
  });
  await page.route("**/api/gemini/review", async (route) => {
    await route.fulfill({ json: { review: createReview() } });
  });

  await page.goto("/result/problem/generate");
  await expect(page.getByRole("heading", { name: "Tạo phiên bản đầu tiên" })).toBeVisible();
    await expect(page.locator('[data-generation-action="original"]')).toBeVisible();

  await page.locator('[data-generation-action="original"]').click();
  await expect(page.locator("#ai-output")).toHaveValue(originalOutput);
  await expect(page.getByRole("button", { name: "Tiếp tục review" })).toBeEnabled();

  await page.getByRole("button", { name: "Tiếp tục review" }).click();
  await expect(page).toHaveURL(/\/result\/problem\/review$/);

  await page.locator('[data-review-action="original"]').click();
  await page.locator('[data-credit-confirm="true"]').click();
  await expect(page.getByText("48/60")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sang bước cải thiện" })).toBeEnabled();

  await page.getByRole("button", { name: "Sang bước cải thiện" }).click();
  await expect(page).toHaveURL(/\/result\/problem\/improve$/);
  const backButton = page.getByRole("button", { name: "Quay lại" });
  await expect(backButton).toBeVisible();
  await backButton.click();
  await expect(page).toHaveURL(/\/result\/problem\/review$/);
});

test("exports a complete proposal as a final PDF and captures its print preview", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    window.print = () => undefined;
  });
  await seedProject(page, {
    builder: createBuilderDocument(),
    workspace: createCompletedWorkspace(),
  });

  await page.goto("/result/differentiation/improve");
  const exportButton = page.getByRole("button", { name: "Xuất bản nháp" });
  await expect(exportButton).toBeEnabled();
  await exportButton.click();
  await expect(page.getByText("Proposal hoàn chỉnh")).toBeVisible();

  await page.getByRole("button", { name: "PDF", exact: true }).click();
  await expect(page.locator("body")).toHaveClass(/proposal-printing/);

  const artifactDirectory = resolve(process.cwd(), "e2e-artifacts");
  mkdirSync(artifactDirectory, { recursive: true });
  const pdfPath = resolve(artifactDirectory, "startup-proposal-final.pdf");
  const screenshotPath = resolve(artifactDirectory, "startup-proposal-final-preview.png");

  await page.emulateMedia({ media: "print" });
  await page.locator(".proposal-print-root").screenshot({
    path: screenshotPath,
  });
  await page.pdf({
    format: "A4",
    margin: { bottom: "20mm", left: "20mm", right: "20mm", top: "20mm" },
    path: pdfPath,
    printBackground: true,
  });

  expect(statSync(pdfPath).size).toBeGreaterThan(5_000);
  expect(statSync(screenshotPath).size).toBeGreaterThan(5_000);
});
