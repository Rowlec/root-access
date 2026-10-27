// ─────────────────────────────────────────────────────────────────────────────
// RootAccess – 60-Second SaaS Explainer Video Recorder
// Playwright automation script — 9 scenes, 1920×1080, headless: false
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from "@playwright/test";
import { mkdirSync, existsSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const framesDir = resolve(projectRoot, "video_frames");
const videosDir = resolve(projectRoot, "videos");

if (!existsSync(framesDir)) mkdirSync(framesDir, { recursive: true });
if (!existsSync(videosDir)) mkdirSync(videosDir, { recursive: true });

const PROJECT_ID = "a545f57a-49e6-44c8-844d-71aa1f98fd5d";
const SESSION_TOKEN = "Ky4Fljl86G2Om1LmlZeVJUBlSwA41tgq.5AFF0MXv9pbvTtgjCrqLkuV50nx/wTFkYFaTQnt//zU=";
const BASE = "http://localhost:3000";
const SECTION_ID = "problem";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Smooth-wait that lets animations breathe */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Inject the persistent custom cursor + ripple CSS once per page */
async function injectCursorSystem(page) {
  await page.evaluate(() => {
    if (document.getElementById("pw-cursor-system")) return;

    const style = document.createElement("style");
    style.id = "pw-cursor-system";
    style.textContent = `
      #pw-cursor {
        position: fixed;
        width: 32px; height: 32px;
        z-index: 999999;
        pointer-events: none;
        transition: left 0.55s cubic-bezier(0.22, 0.68, 0, 1.0),
                    top 0.55s cubic-bezier(0.22, 0.68, 0, 1.0);
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
        left: -50px; top: -50px;
      }
      .pw-ripple {
        position: fixed;
        width: 48px; height: 48px;
        border: 3px solid #38bdf8;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        pointer-events: none;
        z-index: 999998;
        animation: pw-ripple-expand 0.55s ease-out forwards;
      }
      @keyframes pw-ripple-expand {
        0%   { transform: translate(-50%,-50%) scale(0.15); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(2.4);  opacity: 0; }
      }
      .pw-glow-pulse {
        animation: pw-glow 1s ease-in-out infinite alternate;
      }
      @keyframes pw-glow {
        0%   { box-shadow: 0 0 0px 0px rgba(56,189,248,0); }
        100% { box-shadow: 0 0 18px 6px rgba(56,189,248,0.55); }
      }
      .pw-shimmer {
        position: relative;
        overflow: hidden;
      }
      .pw-shimmer::after {
        content: '';
        position: absolute;
        top: 0; left: -100%; width: 50%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
        animation: pw-shimmer-sweep 1.5s ease-in-out infinite;
      }
      @keyframes pw-shimmer-sweep {
        0%   { left: -50%; }
        100% { left: 150%; }
      }
      .pw-scale-pulse {
        animation: pw-scale 0.9s ease-in-out infinite alternate;
      }
      @keyframes pw-scale {
        0%   { transform: scale(1); }
        100% { transform: scale(1.07); }
      }

      /* Subtitle bar */
      #pw-subtitle-bar {
        position: fixed;
        bottom: 28px; left: 40px; right: 40px;
        z-index: 999997;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 22px;
        border-radius: 16px;
        background: rgba(10, 18, 36, 0.92);
        backdrop-filter: blur(18px);
        border: 1px solid rgba(56, 189, 248, 0.35);
        box-shadow: 0 12px 40px rgba(0,0,0,0.55);
        font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
        pointer-events: none;
        color: #f1f5f9;
      }
      #pw-sub-badge {
        padding: 4px 12px;
        border-radius: 8px;
        background: #2563eb;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        white-space: nowrap;
      }
      #pw-sub-text {
        font-size: 14px;
        font-weight: 600;
        color: #f8fafc;
        margin-left: 14px;
      }
      #pw-sub-timer {
        font-size: 13px;
        font-family: 'SF Mono', 'Cascadia Code', monospace;
        font-weight: 700;
        color: #38bdf8;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);

    // Cursor SVG
    const cursor = document.createElement("div");
    cursor.id = "pw-cursor";
    cursor.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" fill="#38bdf8"/>
      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" stroke="#fff" stroke-width="1.6"/>
    </svg>`;
    document.body.appendChild(cursor);

    // Subtitle bar
    const bar = document.createElement("div");
    bar.id = "pw-subtitle-bar";
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span id="pw-sub-badge">TỔNG QUAN</span>
        <span id="pw-sub-text">RootAccess — Chấm Startup Proposal chuẩn rubric.</span>
      </div>
      <div id="pw-sub-timer">00:00 / 01:00</div>
    `;
    document.body.appendChild(bar);
  });
}

/** Move the fake cursor to (x, y) with smooth CSS transition */
async function moveCursor(page, x, y) {
  await page.evaluate(([cx, cy]) => {
    const el = document.getElementById("pw-cursor");
    if (el) { el.style.left = `${cx}px`; el.style.top = `${cy}px`; }
  }, [x, y]);
  await wait(600);
}

/** Spawn a ripple at (x, y) */
async function spawnRipple(page, x, y) {
  await page.evaluate(([rx, ry]) => {
    const r = document.createElement("div");
    r.className = "pw-ripple";
    r.style.left = `${rx}px`;
    r.style.top = `${ry}px`;
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }, [x, y]);
}

/**
 * createVisualClick — moves cursor to a selector's bounding-box center,
 * injects a ripple, then performs a real click.
 */
async function createVisualClick(page, selector, { realClick = true } = {}) {
  const loc = typeof selector === "string"
    ? page.locator(selector).first()
    : selector;

  try {
    await loc.waitFor({ state: "visible", timeout: 4000 });
  } catch {
    console.warn(`⚠️  Selector not visible: ${selector}`);
    return;
  }

  const box = await loc.boundingBox();
  if (!box) return;

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await moveCursor(page, cx - 6, cy - 2);
  await spawnRipple(page, cx, cy);
  await wait(250);

  if (realClick) {
    try { await loc.click({ force: true, timeout: 3000 }); } catch { /* noop */ }
  }
  await wait(350);
}

/** Update the subtitle bar */
async function setSubtitle(page, badge, text, seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const timer = `${mm}:${ss} / 01:00`;
  await page.evaluate(([b, t, tm]) => {
    const badgeEl = document.getElementById("pw-sub-badge");
    const textEl = document.getElementById("pw-sub-text");
    const timerEl = document.getElementById("pw-sub-timer");
    if (badgeEl) badgeEl.textContent = b;
    if (textEl) textEl.textContent = t;
    if (timerEl) timerEl.textContent = tm;
  }, [badge, text, timer]);
}

/** Smooth-scroll to a position */
async function smoothScroll(page, top) {
  await page.evaluate((t) => window.scrollTo({ top: t, behavior: "smooth" }), top);
  await wait(900);
}

/** Smooth-scroll an element into view */
async function scrollToElement(page, selector) {
  const el = typeof selector === "string"
    ? page.locator(selector).first()
    : selector;
  try {
    await el.evaluate((node) => node.scrollIntoView({ behavior: "smooth", block: "center" }));
    await wait(900);
  } catch { /* noop */ }
}

/** Sequential glow: add glow-pulse class to elements one by one */
async function sequentialGlow(page, selectors, durationEach = 800) {
  for (const sel of selectors) {
    await page.evaluate(([s, dur]) => {
      const el = typeof s === "number"
        ? document.querySelectorAll("[data-pw-glow-target]")[s]
        : document.querySelector(s);
      if (!el) return;
      el.classList.add("pw-glow-pulse");
      setTimeout(() => el.classList.remove("pw-glow-pulse"), dur);
    }, [sel, durationEach]);
    await wait(durationEach + 100);
  }
}

/** Take a clean screenshot */
async function captureScene(page, sceneId) {
  // Hide cursor + subtitle briefly for cleaner screenshot? No, keep them for video feel.
  const path = resolve(framesDir, `scene_${sceneId}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 Captured scene ${sceneId} → ${path}`);
}

/** Simulate realistic human typing */
async function humanType(page, selector, text, charDelay = 18) {
  const loc = typeof selector === "string"
    ? page.locator(selector).first()
    : selector;
  try {
    await loc.click({ force: true, timeout: 3000 });
  } catch {
    /* fallback */
  }
  await wait(200);
  try {
    await loc.fill(text);
  } catch {
    await loc.pressSequentially(text.slice(0, 100), { delay: 10 });
  }
}

// ─── Main Recording Flow ─────────────────────────────────────────────────────

(async () => {
  console.log("🎬 Launching Chromium (headed, slowMo: 100, 1920×1080)...\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videosDir,
      size: { width: 1920, height: 1080 },
    },
  });

  // Inject auth cookie for authenticated pages
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: SESSION_TOKEN,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 1 (0s – 5s): Hook — Landing Page Hero
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 1 (0s–5s): Landing page hero — hook & problem\n");

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await injectCursorSystem(page);
  await setSubtitle(page, "VẤN ĐỀ", "Bạn dùng ChatGPT viết Proposal nhưng không biết bài có đạt rubric không.", 0);
  await wait(800);

  // Sequentially glow the 3 checkmark badges
  // Tag them for selection
  await page.evaluate(() => {
    const badgeContainer = document.querySelector(
      ".flex.items-center.justify-center.gap-6.text-xs"
    );
    if (!badgeContainer) return;
    const badges = badgeContainer.querySelectorAll("span.flex.items-center");
    badges.forEach((b, i) => {
      b.setAttribute("data-pw-check", String(i));
      b.style.transition = "all 0.3s ease";
    });
  });

  for (let i = 0; i < 3; i++) {
    await page.evaluate((idx) => {
      const el = document.querySelector(`[data-pw-check="${idx}"]`);
      if (!el) return;
      el.classList.add("pw-glow-pulse");
      el.style.transform = "scale(1.12)";
      setTimeout(() => {
        el.classList.remove("pw-glow-pulse");
        el.style.transform = "scale(1)";
      }, 1100);
    }, i);
    await wait(1200);
  }

  await setSubtitle(page, "VẤN ĐỀ", "RootAccess cho bạn biết ngay phần nào đạt, phần nào bị trừ điểm.", 4);
  await wait(600);
  await captureScene(page, 1);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 2 (5s – 10s): 4-Step Loop Section
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 2 (5s–10s): 4-step optimization loop\n");

  await setSubtitle(page, "VÒNG LẶP", "Vòng lặp tối ưu bài viết trong 15 giây — 4 bước, lặp đến khi đạt.", 5);

  // Scroll to the 4-step section
  const loopHeading = page.locator("h2:has-text('Vòng lặp tối ưu bài viết')").first();
  await scrollToElement(page, loopHeading);
  await wait(400);

  // Tag the 4 cards and pulse them sequentially with cyan glow
  await page.evaluate(() => {
    const grid = document.querySelector(".grid.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-4");
    if (!grid) return;
    const cards = grid.querySelectorAll(":scope > div");
    cards.forEach((c, i) => {
      c.setAttribute("data-pw-step", String(i));
      c.style.transition = "all 0.35s ease";
    });
  });

  for (let i = 0; i < 4; i++) {
    await page.evaluate((idx) => {
      const el = document.querySelector(`[data-pw-step="${idx}"]`);
      if (!el) return;
      el.classList.add("pw-glow-pulse");
      el.style.transform = "scale(1.06)";
      setTimeout(() => {
        el.classList.remove("pw-glow-pulse");
        el.style.transform = "scale(1)";
      }, 900);
    }, i);
    await wait(1000);
  }

  await setSubtitle(page, "VÒNG LẶP", "Chèn prompt → AI viết → Chấm rubric → Sửa → Lặp lại.", 9);
  await wait(600);
  await captureScene(page, 2);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 3 (10s – 18s): Write Workspace — Copy Prompt
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 3 (10s–18s): Web Write Workspace — copy prompt\n");

  await page.goto(
    `${BASE}/app/projects/${PROJECT_ID}/write/${SECTION_ID}`,
    { waitUntil: "load", timeout: 15000 }
  );
  await injectCursorSystem(page);
  await setSubtitle(page, "BƯỚC 1", "Prompt chuẩn rubric đã có sẵn ở cột trái — sao chép 1 chạm.", 12);
  await wait(1500);

  // If target level modal appears, dismiss by picking "Khá"
  const targetModal = page.locator("text=Nhóm muốn đạt mức nào?").first();
  if (await targetModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    const opt = page.locator("button:has-text('Khuyên dùng cho kỳ này')").first();
    if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
      await opt.click({ force: true });
    } else {
      await page.keyboard.press("Escape");
    }
    await wait(600);
  }

  // Focus on the prompt card area
  await moveCursor(page, 350, 300);
  await wait(800);

  // Click "Sao chép prompt"
  await setSubtitle(page, "1-CHẠM", "Bấm 'Sao chép prompt' để gửi sang ChatGPT — AI không hỏi vặn lại.", 15);
  await createVisualClick(page, "button:has-text('Sao chép prompt')");
  await wait(1500);

  // Move to "Mở ChatGPT & Dán"
  const openChatGPTBtn = page.locator("button:has-text('Mở ChatGPT')").first();
  if (await openChatGPTBtn.isVisible().catch(() => false)) {
    const box = await openChatGPTBtn.boundingBox();
    if (box) {
      await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2);
      await spawnRipple(page, box.x + box.width / 2, box.y + box.height / 2);
    }
  }
  await wait(1200);

  await setSubtitle(page, "BƯỚC 1", "Hoặc mở thẳng ChatGPT và dán luôn — không cần chuyển tab thủ công.", 17);
  await wait(600);
  await captureScene(page, 3);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 4 (18s – 26s): Select Target Level → Paste Answer → Grade
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 4 (18s–26s): Target level → paste → grade\n");

  await setSubtitle(page, "MỤC TIÊU", "Chọn mức điểm mục tiêu cho đề án.", 18);

  // Show target level selector if available via "Đổi" button
  const doiBtn = page.locator("button:has-text('Đổi')").first();
  if (await doiBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createVisualClick(page, doiBtn);
    await wait(800);

    // Select "Khá"
    await setSubtitle(page, "MỤC TIÊU", "Chọn 'Khá · khoảng 7–8 điểm' — phù hợp nhất cho kỳ này.", 19);
    await wait(500);
    const khaOption = page.locator("button:has-text('Khuyên dùng cho kỳ này')").first();
    if (await khaOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createVisualClick(page, khaOption);
    } else {
      await page.keyboard.press("Escape");
    }
    await wait(800);
  }

  // Ensure any modal overlay is closed before proceeding to textarea
  await page.evaluate(() => {
    const closeBtn = document.querySelector("button svg.lucide-x")?.closest("button");
    if (closeBtn) closeBtn.click();
  });
  await wait(400);

  // Pan to the right column textarea
  await setSubtitle(page, "BƯỚC 2", "Dán bài viết từ ChatGPT vào ô bên phải.", 20);

  const textarea = page.locator(
    'textarea[placeholder*="Dán câu trả lời"]'
  ).first();

  if (await textarea.isVisible().catch(() => false)) {
    await scrollToElement(page, textarea);
    await wait(400);

    const sampleText =
      `Phân khúc mục tiêu:\n` +
      `Sinh viên năm cuối (năm 4) các trường Đại học Bách Khoa và Kinh tế tại TP.HCM ` +
      `đang ở trọ xung quanh trường, bận làm đồ án tốt nghiệp và thực tập. ` +
      `Lịch học kín, deadline liên tục, thời gian nấu nướng gần như bằng 0.\n\n` +
      `Nỗi đau và tính cấp bách:\n` +
      `Sinh viên không đủ thời gian tự đi chợ và sơ chế nấu nướng ` +
      `(ít hơn 20 phút mỗi ngày), thường xuyên bỏ bữa hoặc dùng thức ăn nhanh ` +
      `không đảm bảo dinh dưỡng và tốn kém chi phí. ` +
      `Nhóm đã phỏng vấn 15 bạn sinh viên, 11 bạn chia sẻ rằng ` +
      `mỗi tuần tốn ít nhất 4 giờ tự sơ chế đồ ăn.\n\n` +
      `Khách hàng tiên phong (Early Adopters):\n` +
      `Sinh viên năm 4 ở trọ KTX Đại học Bách Khoa, khu vực Dĩ An, ` +
      `đã từng thử đặt đồ ăn qua app nhưng thấy quá đắt cho ngân sách sinh viên.`;

    // Type with realistic speed
    await humanType(page, textarea, sampleText, 8);
    await wait(800);
  }

  // Click the grade button
  await setSubtitle(page, "CHẤM BÀI", "Bấm 'Chấm theo mục tiêu này' — hệ thống quét rubric tức thì.", 24);
  const gradeBtn = page.locator("button:has-text('Chấm theo mục tiêu này')").first();
  if (await gradeBtn.isVisible().catch(() => false)) {
    await createVisualClick(page, gradeBtn);
  }
  await wait(2500);

  await captureScene(page, 4);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 5 (26s – 36s): Grade Results — Criterion Badges + Text Highlighting
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 5 (26s–36s): Grade results — criterion badges\n");

  await setSubtitle(page, "KẾT QUẢ", "Từng tiêu chí được đánh giá: Chưa đạt, Đạt, hoặc Tốt.", 27);

  // Wait for grade results to appear (the API call may take a few seconds)
  // Try to locate result elements — if grading actually ran, they should appear
  try {
    await page.waitForSelector("text=Cần sửa để tới mục tiêu", { timeout: 4000 });
  } catch {
    // If real grading didn't happen (no credits, etc.), inject a mock results panel
    console.log("   ℹ️  Injecting mock grade results panel for video purposes...");
    await page.evaluate(() => {
      const rightCol = document.querySelector('textarea[placeholder*="Dán câu trả lời"]')
        ?.closest("div.space-y-4, div.space-y-3, section, div")?.parentElement;
      if (!rightCol) return;

      const mockHTML = `
        <div id="pw-mock-results" class="space-y-4 mt-6 animate-in slide-in-from-bottom-4 duration-500">
          <h3 style="font-size:14px;font-weight:800;color:var(--ink);">
            ✅ Kết quả chấm theo mục tiêu Khá (7–8)
          </h3>

          <div style="display:flex;flex-direction:column;gap:12px;">
            <div data-pw-criterion="0" style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:14px;border:1px solid rgba(16,185,129,0.3);background:rgba(16,185,129,0.06);">
              <span style="padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;border:1px solid rgba(16,185,129,0.3);">Tốt</span>
              <span style="font-size:13px;font-weight:600;color:var(--ink);">Phân khúc mục tiêu rõ ràng</span>
            </div>

            <div data-pw-criterion="1" style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:14px;border:1px solid rgba(16,185,129,0.3);background:rgba(16,185,129,0.06);">
              <span style="padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;border:1px solid rgba(16,185,129,0.3);">Tốt</span>
              <span style="font-size:13px;font-weight:600;color:var(--ink);">Có dữ liệu phỏng vấn thực tế</span>
            </div>

            <div data-pw-criterion="2" style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:14px;border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.06);">
              <span style="padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(245,158,11,0.15);color:#d97706;border:1px solid rgba(245,158,11,0.3);">Đạt</span>
              <span style="font-size:13px;font-weight:600;color:var(--ink);">Early Adopters cần cụ thể hơn</span>
            </div>

            <div data-pw-criterion="3" style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:14px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.06);">
              <span style="padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(239,68,68,0.15);color:#dc2626;border:1px solid rgba(239,68,68,0.3);">Chưa đạt</span>
              <span style="font-size:13px;font-weight:600;color:var(--ink);">Thiếu phân tích giải pháp thay thế</span>
            </div>
          </div>

          <div style="margin-top:16px;">
            <h4 style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:10px;">Cần sửa để tới mục tiêu (2 việc)</h4>
            <div style="padding:16px;border-radius:14px;border:1px solid rgba(245,158,11,0.4);background:rgba(245,158,11,0.05);margin-bottom:10px;">
              <div style="font-size:12px;font-weight:700;color:var(--ink);margin-bottom:6px;">Early Adopters cần cụ thể hơn</div>
              <div style="font-size:11px;color:var(--ink-2);margin-bottom:12px;">Cần mô tả rõ lý do họ cấp thiết cần sản phẩm ngay giai đoạn đầu.</div>
              <button id="pw-fix-prompt-btn" style="padding:6px 14px;border-radius:8px;background:var(--accent,#2563eb);color:white;font-size:11px;font-weight:700;border:none;cursor:pointer;">✨ Tạo prompt sửa</button>
            </div>
          </div>
        </div>
      `;

      // Find a suitable insertion point
      const main = document.querySelector("main") || document.body;
      const container = document.createElement("div");
      container.innerHTML = mockHTML;
      // Insert after textarea's parent container
      const textareaParent = document.querySelector('textarea[placeholder*="Dán câu trả lời"]')?.parentElement?.parentElement;
      if (textareaParent) {
        textareaParent.appendChild(container.firstElementChild);
      } else {
        main.appendChild(container.firstElementChild);
      }
    });
    await wait(500);
  }

  // Animate criterion rows appearing one by one
  await page.evaluate(() => {
    const criteria = document.querySelectorAll("[data-pw-criterion]");
    criteria.forEach((c, i) => {
      c.style.opacity = "0";
      c.style.transform = "translateY(20px)";
      c.style.transition = "all 0.4s ease";
      setTimeout(() => {
        c.style.opacity = "1";
        c.style.transform = "translateY(0)";
      }, i * 600);
    });
  });
  await wait(3000);

  // Glow the "Tạo prompt sửa" button
  await setSubtitle(page, "GỢI Ý SỬA", "Chỗ nào yếu, hệ thống chỉ thẳng vấn đề và tạo sẵn prompt sửa.", 33);

  const fixBtn = page.locator("#pw-fix-prompt-btn, button:has-text('Tạo prompt sửa'), button:has-text('Tạo prompt từ câu trả lời')").first();
  if (await fixBtn.isVisible().catch(() => false)) {
    await scrollToElement(page, fixBtn);
    await fixBtn.evaluate((el) => el.classList.add("pw-glow-pulse", "pw-scale-pulse"));
    await wait(1800);
    await createVisualClick(page, fixBtn, { realClick: false });
    await fixBtn.evaluate((el) => el.classList.remove("pw-glow-pulse", "pw-scale-pulse"));
  }

  await wait(600);
  await captureScene(page, 5);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 6 (36s – 42s): Comparison Panel — Before/After Delta
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 6 (36s–42s): Comparison panel — before/after\n");

  await setSubtitle(page, "SO SÁNH", "Sửa xong, chấm lại — xem rõ từng tiêu chí tiến bộ bao nhiêu.", 36);

  // Inject mock comparison panel
  await page.evaluate(() => {
    const existing = document.getElementById("pw-mock-comparison");
    if (existing) return;

    const mockResults = document.getElementById("pw-mock-results");
    const insertTarget = mockResults || document.querySelector("main") || document.body;

    const compHTML = `
      <div id="pw-mock-comparison" style="margin-top:20px;padding:20px;border-radius:16px;border:1px solid rgba(59,130,246,0.35);background:rgba(59,130,246,0.04);space-y:16px;">
        <h4 style="font-size:13px;font-weight:800;color:var(--ink);margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          🔄 Bạn đã sửa gì sau khi chấm lại
          <span style="padding:3px 10px;border-radius:8px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;">+2 tiêu chí đạt</span>
        </h4>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <div data-pw-delta="0" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);opacity:0;transform:translateX(-20px);transition:all 0.5s ease;">
            <span style="font-size:12px;font-weight:600;color:var(--ink);">Early Adopters</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(245,158,11,0.15);color:#d97706;">Đạt</span>
              <span style="color:#059669;font-weight:800;font-size:14px;">→</span>
              <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;">Tốt</span>
              <span style="font-size:10px;color:#059669;font-weight:700;">▲</span>
            </div>
          </div>

          <div data-pw-delta="1" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);opacity:0;transform:translateX(-20px);transition:all 0.5s ease;">
            <span style="font-size:12px;font-weight:600;color:var(--ink);">Giải pháp thay thế</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(239,68,68,0.15);color:#dc2626;">Chưa đạt</span>
              <span style="color:#059669;font-weight:800;font-size:14px;">→</span>
              <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(245,158,11,0.15);color:#d97706;">Đạt</span>
              <span style="font-size:10px;color:#059669;font-weight:700;">▲</span>
            </div>
          </div>

          <div data-pw-delta="2" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:12px;background:rgba(148,163,184,0.06);border:1px solid rgba(148,163,184,0.2);opacity:0;transform:translateX(-20px);transition:all 0.5s ease;">
            <span style="font-size:12px;font-weight:600;color:var(--ink);">Phân khúc mục tiêu</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;">Tốt</span>
              <span style="color:var(--ink-2);font-weight:800;font-size:14px;">→</span>
              <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;">Tốt</span>
              <span style="font-size:10px;color:var(--ink-2);font-weight:700;">＝</span>
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="margin-top:18px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:600;color:var(--ink-2);">Tiến độ tới mục tiêu Khá (7–8)</span>
            <span id="pw-progress-pct" style="font-size:11px;font-weight:800;color:#059669;">60%</span>
          </div>
          <div style="width:100%;height:10px;border-radius:8px;background:rgba(148,163,184,0.15);overflow:hidden;">
            <div id="pw-progress-fill" style="width:60%;height:100%;border-radius:8px;background:linear-gradient(90deg,#2563eb,#059669);transition:width 1.2s cubic-bezier(0.34,1.56,0.64,1);"></div>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = compHTML;
    insertTarget.parentElement?.appendChild(container.firstElementChild);
  });

  await scrollToElement(page, "#pw-mock-comparison");
  await wait(500);

  // Animate delta rows sliding in
  for (let i = 0; i < 3; i++) {
    await page.evaluate((idx) => {
      const el = document.querySelector(`[data-pw-delta="${idx}"]`);
      if (!el) return;
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    }, i);
    await wait(700);
  }

  // Animate progress bar from 60% to 85%
  await setSubtitle(page, "TIẾN ĐỘ", "Thanh tiến độ cho thấy bạn đang ở đâu trên rubric — 60% → 85%.", 39);
  await page.evaluate(() => {
    const fill = document.getElementById("pw-progress-fill");
    const pct = document.getElementById("pw-progress-pct");
    if (fill) fill.style.width = "85%";
    if (pct) pct.textContent = "85%";
  });
  await wait(1800);

  await captureScene(page, 6);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 7 (42s – 50s): Project Hub — Full Check + Export Proposal
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 7 (42s–50s): Project Hub — full check & export\n");

  await page.goto(
    `${BASE}/app/projects/${PROJECT_ID}`,
    { waitUntil: "load", timeout: 15000 }
  );
  await injectCursorSystem(page);
  await setSubtitle(page, "HUB DỰ ÁN", "Viết xong, quay lại Hub kiểm tra toàn bộ và xuất Proposal.", 42);
  await wait(1500);

  // Scroll down through section list to show green checks
  await smoothScroll(page, 400);
  await wait(1200);

  // Click "Kiểm tra toàn bộ proposal trước khi nộp"
  await setSubtitle(page, "RÀ SOÁT", "Bấm 'Kiểm tra toàn bộ' để phát hiện mâu thuẫn giữa các phần.", 44);
  const fullCheckBtn = page.locator("button:has-text('Kiểm tra')").first();
  if (await fullCheckBtn.isVisible().catch(() => false)) {
    await createVisualClick(page, fullCheckBtn, { realClick: false });
    await wait(1200);
  }

  // Scroll to export section
  await setSubtitle(page, "XUẤT BẢN", "Bước cuối: Tải file Word — nộp thẳng cho giảng viên!", 47);
  const exportHeading = page.locator("h3:has-text('Xuất bản Startup Proposal')").first();
  if (await exportHeading.isVisible().catch(() => false)) {
    await scrollToElement(page, exportHeading);
  } else {
    await smoothScroll(page, 1200);
  }
  await wait(800);

  // Click "Tải file Word (.DOCX)"
  const downloadBtn = page.locator("button:has-text('Tải file Word')").first();
  if (await downloadBtn.isVisible().catch(() => false)) {
    await downloadBtn.evaluate((el) => el.classList.add("pw-glow-pulse"));
    await wait(800);
    await createVisualClick(page, downloadBtn);
    await downloadBtn.evaluate((el) => el.classList.remove("pw-glow-pulse")).catch(() => {});
  }
  await wait(1000);

  await captureScene(page, 7);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 8 (50s – 55s): Pricing Section
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 8 (50s–55s): Pricing — transparent pricing\n");

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await injectCursorSystem(page);

  // Scroll to pricing
  await setSubtitle(page, "BẢNG GIÁ", "Miễn phí 5 lượt chấm — Gói Pro chỉ 39 ngàn cho 50 lượt.", 50);
  const pricingHeading = page.locator("h2:has-text('Bảng giá minh bạch')").first();
  await scrollToElement(page, pricingHeading);
  await wait(600);

  // Shimmer the Pro card (has border-2 border-[var(--accent)])
  await page.evaluate(() => {
    // The pro card has the "Được chọn nhiều nhất" badge
    const proCard = Array.from(document.querySelectorAll(".rounded-3xl")).find(
      (el) => el.textContent?.includes("Được chọn nhiều nhất")
    );
    if (proCard) {
      proCard.classList.add("pw-shimmer", "pw-glow-pulse");
      proCard.setAttribute("data-pw-pro", "true");
    }

    // Pulse the free trial badge
    const freeBadges = Array.from(document.querySelectorAll("span")).filter(
      (el) => el.textContent?.includes("Tặng 5 lượt chấm miễn phí")
    );
    freeBadges.forEach((b) => {
      b.style.transition = "all 0.3s ease";
      b.classList.add("pw-scale-pulse");
    });
  });
  await wait(3500);

  // Clean up effects
  await page.evaluate(() => {
    const proCard = document.querySelector("[data-pw-pro]");
    if (proCard) proCard.classList.remove("pw-shimmer", "pw-glow-pulse");
    document.querySelectorAll(".pw-scale-pulse").forEach((el) => el.classList.remove("pw-scale-pulse"));
  });

  await captureScene(page, 8);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 9 (55s – 60s): Outro CTA — Hero Revisit
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎬 SCENE 9 (55s–60s): Outro — CTA & root-access.site\n");

  await smoothScroll(page, 0);
  await wait(600);
  await setSubtitle(page, "BẮT ĐẦU NGAY", "Truy cập root-access.site — viết phần đầu tiên, biết luôn mình đang ở đâu.", 56);

  // Scale-pulse the main CTA button
  const ctaLink = page.locator("a:has-text('Cài Extension cho Chrome')").first();
  if (await ctaLink.isVisible().catch(() => false)) {
    await ctaLink.evaluate((el) => {
      el.classList.add("pw-glow-pulse", "pw-scale-pulse");
    });
    await wait(1500);
    await createVisualClick(page, ctaLink, { realClick: false });
    await wait(1000);
  }

  // Inject a final overlay with the URL
  await page.evaluate(() => {
    const overlay = document.createElement("div");
    overlay.id = "pw-final-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999996;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(10, 18, 36, 0.85);
      backdrop-filter: blur(20px);
      animation: pw-fade-in 0.8s ease;
      pointer-events: none;
    `;
    overlay.innerHTML = `
      <div style="font-size:52px;font-weight:900;color:#f8fafc;letter-spacing:-1px;font-family:system-ui,-apple-system,sans-serif;margin-bottom:16px;">
        root-access.site
      </div>
      <div style="font-size:18px;color:#94a3b8;font-weight:500;margin-bottom:28px;">
        Chuẩn rubric FPT • Miễn phí 5 lượt • Không cần thẻ ngân hàng
      </div>
      <div style="padding:10px 28px;border-radius:12px;background:#2563eb;color:white;font-size:15px;font-weight:700;">
        Bắt đầu ngay →
      </div>
    `;
    document.body.appendChild(overlay);

    const fadeStyle = document.createElement("style");
    fadeStyle.textContent = `@keyframes pw-fade-in { from { opacity: 0; } to { opacity: 1; } }`;
    document.head.appendChild(fadeStyle);
  });

  await setSubtitle(page, "CTA", "Truy cập root-access.site — Chuẩn rubric FPT, miễn phí 5 lượt.", 59);
  await wait(3000);

  await captureScene(page, 9);

  // ═══════════════════════════════════════════════════════════════════════════
  // Cleanup & Save
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n💾 Saving video recording...");
  const video = page.video();
  await page.close();
  await context.close();

  if (video) {
    try {
      const videoPath = await video.path();
      const finalPath = resolve(videosDir, "rootaccess-explainer-60s.webm");
      await wait(1000);
      renameSync(videoPath, finalPath);
      console.log(`✅ Video saved: ${finalPath}`);
    } catch (e) {
      console.log(`✅ Video saved (original name in ${videosDir})`);
    }
  }

  await browser.close();

  console.log(`\n📸 Scene screenshots saved in: ${framesDir}`);
  console.log(`🎬 Video recording saved in:   ${videosDir}`);
  console.log("✅ All 9 scenes recorded successfully!");
})();

