import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const videosDir = resolve(projectRoot, "videos");

if (!existsSync(videosDir)) {
  mkdirSync(videosDir, { recursive: true });
}

console.log("🎬 Bắt đầu quay video 60s trên giao diện web thật localhost:3000...");

async function record() {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: videosDir,
      size: { width: 1280, height: 720 },
    },
  });

  // Inject authentication session cookie for user 'Lê Anh'
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: "Ky4Fljl86G2Om1LmlZeVJUBlSwA41tgq",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Helper function to inject sleek video editing overlay (subtitle bar + animated cursor + camera pan)
  async function injectEditingOverlay() {
    await page.evaluate(() => {
      if (document.getElementById("videoEditOverlay")) return;

      const style = document.createElement("style");
      style.innerHTML = `
        #videoEditOverlay {
          position: fixed;
          bottom: 20px;
          left: 30px;
          right: 30px;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
          font-family: system-ui, -apple-system, sans-serif;
          pointer-events: none;
          color: white;
        }
        #vCursor {
          position: fixed;
          width: 28px;
          height: 28px;
          z-index: 100000;
          pointer-events: none;
          transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        }
        .v-ripple {
          position: fixed;
          width: 44px;
          height: 44px;
          border: 3px solid #38bdf8;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
          z-index: 99998;
          animation: vRippleAnim 0.5s ease-out forwards;
        }
        @keyframes vRippleAnim {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);

      // Cursor element
      const cursor = document.createElement("div");
      cursor.id = "vCursor";
      cursor.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" fill="#38bdf8"/>
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" stroke="#ffffff" stroke-width="1.8"/>
        </svg>
      `;
      document.body.appendChild(cursor);

      // Overlay banner
      const overlay = document.createElement("div");
      overlay.id = "videoEditOverlay";
      overlay.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <span id="vBadge" style="padding:4px 10px;border-radius:6px;background:#2563eb;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">TỔNG QUAN</span>
          <span id="vText" style="font-size:13px;font-weight:600;color:#f8fafc;">Khởi đầu đề án với RootAccess Hub bám sát rubric EXE101.</span>
        </div>
        <div style="font-size:12px;font-family:monospace;font-weight:700;color:#38bdf8;" id="vTimer">00:00 / 01:00</div>
      `;
      document.body.appendChild(overlay);

      window.__updateOverlay = (badge, text, timeStr) => {
        document.getElementById("vBadge").innerText = badge;
        document.getElementById("vText").innerText = text;
        document.getElementById("vTimer").innerText = timeStr;
      };

      window.__moveCursor = (x, y) => {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      };

      window.__clickEffect = (x, y) => {
        const r = document.createElement("div");
        r.className = "v-ripple";
        r.style.left = `${x}px`;
        r.style.top = `${y}px`;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 600);
      };
    });
  }

  // ================= SCENE 1 (0s - 12s): Project Hub (Vèo) =================
  console.log("📍 [00:00] Điều hướng vào Project Hub của dự án Vèo...");
  await page.goto("http://localhost:3000/app/projects/a545f57a-49e6-44c8-844d-71aa1f98fd5d");
  await page.waitForLoadState("networkidle");
  await injectEditingOverlay();

  await page.evaluate(() => {
    window.__updateOverlay("TỔNG QUAN", "RootAccess Hub: Quản lý toàn bộ tiến độ đề án Vèo bám sát checkpoint.", "00:03 / 01:00");
    window.__moveCursor(400, 200);
  });
  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    window.__updateOverlay("CHỌN PHẦN VIẾT", "Bấm 'Viết trên web' ở phần Khách hàng & Vấn đề để bắt đầu.", "00:08 / 01:00");
    window.__moveCursor(820, 480);
    window.__clickEffect(820, 480);
  });
  await page.waitForTimeout(3000);

  // ================= SCENE 2 (12s - 45s): Write Workspace (Problem) =================
  console.log("📍 [00:12] Điều hướng vào Web Write Workspace (write/problem)...");
  await page.goto("http://localhost:3000/app/projects/a545f57a-49e6-44c8-844d-71aa1f98fd5d/write/problem");
  await page.waitForLoadState("networkidle");
  await injectEditingOverlay();

  await page.evaluate(() => {
    window.__updateOverlay("BƯỚC 1: LẤY PROMPT", "Prompt chuẩn đã có sẵn ở cột trái, tối ưu theo đúng ngách sinh viên và rubric.", "00:15 / 01:00");
    window.__moveCursor(280, 260);
  });
  await page.waitForTimeout(4000);

  // Click Copy Prompt button
  await page.evaluate(() => {
    window.__updateOverlay("1-CHẠM SAO CHÉP", "Bấm 1 chạm 'Sao chép prompt' để gửi sang ChatGPT mà không sợ AI hỏi vặn lại.", "00:20 / 01:00");
    window.__moveCursor(150, 250);
    window.__clickEffect(150, 250);
  });
  // Click actual button on page if present
  const copyBtn = page.locator("button:has-text('Sao chép prompt')").first();
  if (await copyBtn.isVisible()) {
    await copyBtn.click();
  }
  await page.waitForTimeout(4000);

  // Focus on Right Column (Answer Editor)
  await page.evaluate(() => {
    window.__updateOverlay("DÁN SANG CHATGPT", "AI sinh ngay bài viết đầy đủ. Copy bài viết từ ChatGPT dán vào ô bên phải.", "00:26 / 01:00");
    window.__moveCursor(750, 220);
  });
  await page.waitForTimeout(3000);

  // Fill sample answer into textarea
  const answerArea = page.locator("textarea").first();
  if (await answerArea.isVisible()) {
    await answerArea.fill(
`1. Phân khúc mục tiêu:
Sinh viên năm cuối (năm 4) các trường Đại học Bách Khoa và Kinh tế tại TP.HCM đang ở trọ xung quanh trường, bận làm đồ án tốt nghiệp và thực tập.

2. Nỗi đau & Tính cấp bách:
Sinh viên không có đủ thời gian tự đi chợ và sơ chế nấu nướng (ít hơn 20 phút mỗi ngày), thường xuyên bỏ bữa hoặc dùng thức ăn nhanh không đảm bảo dinh dưỡng và tốn kém chi phí.`
    );
  }

  await page.evaluate(() => {
    window.__updateOverlay("BƯỚC 2: CHẤM RUBRIC", "Chọn mục tiêu điểm mong muốn và bấm 'Chấm bài theo Rubric'.", "00:33 / 01:00");
    window.__moveCursor(1050, 210);
    window.__clickEffect(1050, 210);
  });

  // Click Grade button
  const gradeBtn = page.locator("button:has-text('Chấm bài theo Rubric')").first();
  if (await gradeBtn.isVisible()) {
    await gradeBtn.click();
  }
  await page.waitForTimeout(6000);

  await page.evaluate(() => {
    window.__updateOverlay("KẾT QUẢ RUBRIC", "Hệ thống quét tiêu chuẩn tức thì, chỉ rõ các điểm Đạt và gợi ý sửa thẳng vấn đề.", "00:40 / 01:00");
    window.__moveCursor(800, 450);
  });
  await page.waitForTimeout(4000);

  // ================= SCENE 3 (45s - 60s): Back to Hub & Export Proposal =================
  console.log("📍 [00:46] Điều hướng về Hub để xuất bản Proposal...");
  await page.goto("http://localhost:3000/app/projects/a545f57a-49e6-44c8-844d-71aa1f98fd5d");
  await page.waitForLoadState("networkidle");
  await injectEditingOverlay();

  // Scroll down to the Export card
  await page.evaluate(() => {
    window.scrollTo({ top: 500, behavior: "smooth" });
    window.__updateOverlay("BƯỚC CUỐI: XUẤT PROPOSAL", "Bước cuối cùng: Đề án hoàn thành, cuộn xuống mục 'Xuất bản Startup Proposal'.", "00:49 / 01:00");
    window.__moveCursor(500, 480);
  });
  await page.waitForTimeout(4000);

  await page.evaluate(() => {
    window.__updateOverlay("TẢI FILE WORD (.DOCX)", "Bấm 'Tải file Word (.DOCX)' để nhận bài hoàn chỉnh nộp ngay cho giảng viên!", "00:54 / 01:00");
    window.__moveCursor(720, 520);
    window.__clickEffect(720, 520);
  });

  const downloadDocxBtn = page.locator("button:has-text('Tải file Word (.DOCX)')").first();
  if (await downloadDocxBtn.isVisible()) {
    await downloadDocxBtn.click();
  }
  await page.waitForTimeout(6000);

  console.log("💾 Đang lưu file video...");
  await page.close();
  await context.close();
  await browser.close();

  console.log(`✅ Hoàn tất! Video quay từ localhost:3000 đã được lưu tại: ${videosDir}`);
}

record().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});

