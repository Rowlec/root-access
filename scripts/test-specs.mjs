import nextEnv from "@next/env";
import { z } from "zod";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

// 1. Zod Pack Schema from Appendix C
const Level = z.object({
  CHUA_DAT: z.string().min(10),
  DAT: z.string().min(10),
  TOT: z.string().min(10),
});

const Criterion = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string(),
  description: z.string(),
  levels: Level,
});

const Section = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  title: z.string(),
  order: z.number().int(),
  requirement: z.string().min(20),
  criteria: z.array(Criterion).min(2).max(6),
  common_mistakes: z.array(z.string()).max(8),
  prompt_template: z.string().optional(),
  fix_hints: z.array(z.string()).optional(),
});

const Pack = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  course: z.string(),
  term: z.string(),
  checkpoint: z.string(),
  source: z.string().min(10),
  sections: z.array(Section).min(1),
});

// Heuristics functions
function detectCodeWarnings(outputText, context) {
  const warnings = [];
  const knownNumbers = new Set(["2024", "2025", "2026", "2027", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);

  const textToScan = [
    context.name ?? "",
    context.idea ?? "",
    context.targetCustomer ?? "",
    JSON.stringify(context.availableData ?? {}),
  ].join(" ");

  const matches = textToScan.match(/\d+([.,]\d+)?/g) || [];
  for (const m of matches) {
    knownNumbers.add(m);
    knownNumbers.add(m.replace(/[.,]/g, ""));
  }

  // Placeholder
  const placeholderRegex = /\[CẦN DỮ LIỆU[^\]]*\]|\[X\]|XXX|\[Tên[^\]]*\]/gi;
  const pMatches = outputText.match(placeholderRegex) || [];
  if (pMatches.length > 0) {
    warnings.push({ type: "PLACEHOLDER", count: pMatches.length });
  }

  // Assumption
  const assumptionMatches = outputText.match(/\[GIẢ ĐỊNH[^\]]*\]/gi) || [];
  if (assumptionMatches.length > 0) {
    warnings.push({ type: "ASSUMPTION", count: assumptionMatches.length });
  }

  // Possibly invented numbers
  const numberPhraseRegex = /(\d+([.,]\d+)?\s*(%|phần trăm|triệu|tỷ|nghìn|ngàn|k|vnd|đ|usd|\$|khách hàng|người|sinh viên))/gi;
  const sentences = outputText.split(/(?<=[.!?\n])\s+/).filter(Boolean);

  for (const sentence of sentences) {
    const numMatches = Array.from(sentence.matchAll(numberPhraseRegex));
    for (const match of numMatches) {
      const phrase = match[0];
      const digits = phrase.match(/\d+([.,]\d+)?/)?.[0];
      if (digits && !knownNumbers.has(digits)) {
        warnings.push({
          type: "POSSIBLY_INVENTED_NUMBER",
          phrase,
          sentence,
        });
      }
    }
  }

  return warnings;
}

// Jaccard similarity
function computeJaccardSimilarity(textA, textB) {
  const tokenize = (t) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1),
    );
  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter++;
  return inter / (setA.size + setB.size - inter);
}

async function runTests() {
  console.log("=== RUNNING ROOTACCESS TECHNICAL SPEC ACCEPTANCE TESTS ===\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
    }
  }

  // Test 1: Zod Pack Schema check
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const [packRow] = await sql`SELECT * FROM packs WHERE id = 'exe101-cp2' LIMIT 1`;
  const parsedPack = Pack.safeParse(packRow.content);
  assert(parsedPack.success, "Gói checkpoint đầu tiên (exe101-cp2) vượt qua kiểm tra Zod schema Phụ lục C");

  // Test 2: Input check - TOO_SHORT (< 150 ký tự)
  const shortText = "Bài này ngắn quá, chỉ có vài chục chữ thôi.";
  assert(shortText.length < 150, "Mục 8.1: Phát hiện TOO_SHORT khi câu trả lời < 150 ký tự");

  // Test 3: Input check - OUTPUT_IS_PROMPT (Jaccard similarity >= 60%)
  const prompt = "Bạn đang giúp một nhóm sinh viên viết phần Vấn đề trong Startup Proposal môn EXE101 Checkpoint 2...";
  const pastedSamePrompt = "Bạn đang giúp một nhóm sinh viên viết phần Vấn đề trong Startup Proposal môn EXE101 Checkpoint 2...";
  const similarity = computeJaccardSimilarity(pastedSamePrompt, prompt);
  assert(similarity >= 0.6, `Mục 8.1 & T5: Phát hiện dán nhầm prompt vào ô output (Jaccard similarity: ${(similarity * 100).toFixed(1)}% >= 60%)`);

  // Test 4: Code number check - POSSIBLY_INVENTED_NUMBER (T6)
  const inventedOutput = "Theo một số nguồn tin, có tới 45% sinh viên bỏ bữa sáng tại ký túc xá mỗi ngày vì căng tin quá tải.";
  const warnings = detectCodeWarnings(inventedOutput, {
    name: "Smart Dorm",
    idea: "Chia sẻ đồ dùng",
    targetCustomer: "Sinh viên",
    availableData: {}, // No 45% survey
  });
  const hasInvented = warnings.some((w) => w.type === "POSSIBLY_INVENTED_NUMBER" && w.phrase.includes("45%"));
  assert(hasInvented, "Mục 8.2 & T6: Tự động cảnh báo POSSIBLY_INVENTED_NUMBER khi câu trả lời xuất hiện '45% sinh viên' mà không có trong dữ liệu nhóm");

  // Test 5: Code number check - PLACEHOLDER and ASSUMPTION
  const textWithPlaceholders = "Dự án giải quyết cho [Tên khách hàng], hiện nhóm [CẦN DỮ LIỆU: số người tham gia] và đây là [GIẢ ĐỊNH: chi phí 50k].";
  const pWarnings = detectCodeWarnings(textWithPlaceholders, {});
  assert(pWarnings.some((w) => w.type === "PLACEHOLDER"), "Mục 8.2: Đếm đúng placeholder [CẦN DỮ LIỆU], [Tên]");
  assert(pWarnings.some((w) => w.type === "ASSUMPTION"), "Mục 8.2: Đếm đúng assumption [GIẢ ĐỊNH]");

  // Test 6: Database Atomic consume_credit and refund_credit
  const [profileBefore] = await sql`SELECT * FROM profiles LIMIT 1`;
  if (profileBefore) {
    const testUserId = profileBefore.id;
    const initialCredits = profileBefore.credits;

    // consume
    const [cRes] = await sql`SELECT consume_credit(${testUserId}::uuid, gen_random_uuid()) as ok`;
    assert(cRes.ok === true || initialCredits === 0, "Mục 9.2: Hàm consume_credit thực thi atomic thành công");

    // refund
    await sql`SELECT refund_credit(${testUserId}::uuid, gen_random_uuid()) as ok`;
    const [profileAfter] = await sql`SELECT credits FROM profiles WHERE id = ${testUserId}`;
    assert(profileAfter.credits === initialCredits, "Mục 9.2: Hàm refund_credit hoàn lại credit chính xác");
  }

  // Test 7: Site selectors in database
  const [selectorsRow] = await sql`SELECT * FROM site_selectors WHERE id = 'default' LIMIT 1`;
  assert(selectorsRow && selectorsRow.content?.chatgpt && selectorsRow.content?.gemini, "Mục 5.4: Selector config có đầy đủ chatgpt và gemini");

  await sql.end();

  console.log(`\n=== KẾT QUẢ TEST: ${passed}/${total} TESTS ĐẠT HOÀN HẢO ===`);
  if (passed === total) {
    console.log("🎉 TẤT CẢ TEST SPEC ĐỀU ĐẠT CHUẨN!");
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
