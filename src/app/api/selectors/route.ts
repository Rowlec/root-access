import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSelectors } from "@/db/schema";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(siteSelectors)
      .where(eq(siteSelectors.isActive, true))
      .orderBy(desc(siteSelectors.version))
      .limit(1);

    if (!row) {
      // Fallback default selectors
      return jsonResponse(
        {
          version: 1,
          chatgpt: {
            input: ["#prompt-textarea", "div[contenteditable='true']"],
            assistantMessage: ["[data-message-author-role='assistant']"],
            stopButton: ["button[data-testid='stop-button']"],
          },
          gemini: {
            input: ["rich-textarea .ql-editor", "div[contenteditable='true']"],
            assistantMessage: [
              "model-response message-content",
              "model-response",
            ],
            stopButton: [
              "button[aria-label*='Stop']",
              "button[aria-label*='Dừng']",
            ],
          },
        },
        { status: 200 },
        request,
      );
    }

    return jsonResponse(row.content, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse(
      { error: err.message || "Failed to fetch selectors" },
      { status: 500 },
      request,
    );
  }
}
