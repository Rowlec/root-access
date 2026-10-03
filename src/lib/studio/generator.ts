import "server-only";

export interface ClarifyQuestion {
  id: string;
  question: string;
  chips: string[];
}

export interface IdeaDirection {
  id: string;
  name: string;
  description: string;
  target_user: string;
  test_in_one_week: string;
  biggest_risk: string;
}

export interface NicheOption {
  id: string;
  name: string;
  tradeoffs: string[];
}

export interface NameSuggestion {
  name: string;
  style: string;
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return { apiKey, model };
}

async function callGeminiJson<T>(systemInstruction: string, userPrompt: string, temperature = 0.7): Promise<T | null> {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn("Studio Gemini call failed, using heuristic fallback:", err);
    return null;
  }
}

// 1. Clarify (Lối A)
export async function generateClarifyQuestions(idea: string): Promise<ClarifyQuestion[]> {
  const system = `Bạn là trợ lý khởi nghiệp sinh viên (môn EXE101).
Người dùng đưa ra một ý tưởng ban đầu. Bạn hãy đặt 3 câu hỏi ngắn để làm rõ:
1. Ai là người gặp vấn đề này đầu tiên (early adopter)?
2. Hiện tại họ đang giải quyết việc đó bằng cách nào?
3. Vì sao cách làm hiện tại chưa ổn hoặc vì sao họ chọn giải pháp này?
Mỗi câu hỏi kèm 3-4 chip gợi ý ngắn (<= 6 từ/chip) để người dùng chọn nhanh.
Quy tắc: Tiếng Việt tự nhiên, ngắn gọn, thực tế với sinh viên.
Trả về JSON:
{
  "questions": [
    { "id": "qa1", "question": "...", "chips": ["...", "..."] },
    { "id": "qa2", "question": "...", "chips": ["...", "..."] },
    { "id": "qa3", "question": "...", "chips": ["...", "..."] }
  ]
}`;

  const prompt = `Ý tưởng ban đầu: "${idea}"`;
  const result = await callGeminiJson<{ questions: ClarifyQuestion[] }>(system, prompt, 0.7);

  if (result && Array.isArray(result.questions) && result.questions.length >= 3) {
    return result.questions.slice(0, 3);
  }

  return [
    {
      id: "qa1",
      question: "Ai là người gặp khó khăn này thường xuyên nhất?",
      chips: ["Sinh viên trọ một mình", "Sinh viên năm nhất mới nhập học", "Bạn trẻ làm thêm ca tối", "Sinh viên ở KTX"],
    },
    {
      id: "qa2",
      question: "Hiện tại họ đang xoay xở bằng cách nào?",
      chips: ["Tự làm thủ công", "Dùng app sẵn có nhưng đắt", "Nhờ người quen", "Chấp nhận bỏ qua"],
    },
    {
      id: "qa3",
      question: "Điều gì khiến họ sẵn sàng thử giải pháp của bạn ngay?",
      chips: ["Rẻ hơn rõ rệt", "Nhanh hơn trong 15 phút", "Được hỗ trợ trực tiếp", "Tiện lợi không phải đi xa"],
    },
  ];
}

// 2. Situations (Khi bấm "Chưa nghĩ ra")
export async function generateSituations(domain: string): Promise<string[]> {
  const domainDict: Record<string, string[]> = {
    "Ăn uống": [
      "Tan học muộn sau 18h, đói và mệt nhưng lười đi chợ 2km nên thường ăn mì tôm hoặc bỏ bữa.",
      "Ở trọ một mình, mua nguyên liệu về nấu thì bị thừa, tủ lạnh bé làm đồ nhanh hỏng.",
      "Muốn ăn đồ tự nấu cho sạch nhưng chuẩn bị và dọn rửa mất cả tiếng đồng hồ.",
    ],
    "Học tập": [
      "Đến mùa thi đồ án nhóm nhưng không tìm được tài liệu mẫu chuẩn hoặc bị chia việc không đều.",
      "Học lập trình/thiết kế kẹt lỗi không biết hỏi ai, hỏi trên nhóm thì ít người trả lời ngay.",
      "Mất tập trung khi tự học tại phòng trọ, muốn tìm bạn cùng học hoặc không gian yên tĩnh gần trường.",
    ],
    "Nhà trọ/KTX": [
      "Chủ trọ tính tiền điện nước mập mờ, thiết bị hỏng gọi sửa lâu nhưng không biết kêu ai.",
      "Tìm bạn cùng phòng hợp tính nết và nếp sinh hoạt rất khó, hay cãi nhau chuyện dọn dẹp.",
      "Phòng trọ cách âm kém, ồn ào lúc nửa đêm ảnh hưởng ôn thi và nghỉ ngơi.",
    ],
    "Đi lại": [
      "Sinh viên không có xe máy, bắt xe buýt đi học và đi làm thêm thường xuyên trễ giờ vì tắc đường.",
      "Đi ghép xe hoặc tìm người share tiền xăng trong trường nhưng thiếu kênh kết nối an toàn.",
      "Xe máy cũ hay hỏng vặt dọc đường Hòa Lạc/ngoại thành, sợ bị thợ sửa xe chặt chém.",
    ],
  };

  if (domainDict[domain]) {
    return domainDict[domain];
  }

  const system = `Gợi ý 3 tình huống rắc rối, bức xúc thực tế mà sinh viên hay gặp phải trong lĩnh vực được yêu cầu.
Quy tắc:
- Mỗi tình huống là 1 câu văn cụ thể (15–25 từ), có bối cảnh thực tế.
- Trả về JSON: { "situations": ["...", "...", "..."] }`;

  const result = await callGeminiJson<{ situations: string[] }>(system, `Lĩnh vực: "${domain}"`, 0.7);
  if (result && Array.isArray(result.situations) && result.situations.length >= 3) {
    return result.situations.slice(0, 3);
  }

  return [
    `Khó tiếp cận dịch vụ uy tín với mức giá phù hợp cho sinh viên.`,
    `Tốn nhiều thời gian tự mày mò nhưng kết quả không như mong muốn.`,
    `Thiếu người hỗ trợ trực tiếp khi gặp rắc rối thực tế ngoài giờ học.`,
  ];
}

// 3. Ideas Directions (3 hướng đi)
export async function generateIdeaDirections(answers: Record<string, any>, excludeIds: string[] = []): Promise<IdeaDirection[]> {
  const domain = answers.domain || answers.q2 || "Khởi nghiệp";
  const problem = answers.observed_problem || answers.q3 || answers.problem || "";
  const strengths = answers.team_strengths || answers.q4 || [];
  const constraints = answers.constraints || answers.q5 || [];

  const system = `Bạn là cố vấn khởi nghiệp môn EXE101 (FPT University).
Nhiệm vụ: Gợi ý ĐÚNG 3 hướng giải pháp khác biệt nhau về CÁCH LÀM cho vấn đề của sinh viên.
Quy tắc bắt buộc (Spec v2.2):
- Tên hướng: <= 8 từ.
- Một câu mô tả: <= 25 từ, nêu rõ làm gì và mang lại gì.
- Ai gặp vấn đề: Bám sát tình huống người dùng kể.
- Test trong 1 tuần bằng cách: Sinh viên làm được ngay, vốn 0đ, không cần lập trình app phức tạp.
- Rủi ro lớn nhất: Nói thẳng 1 câu.
- TUYỆT ĐỐI KHÔNG đưa số liệu thị trường, tỉ lệ %, quy mô doanh thu tỷ đồng.
- KHÔNG gợi ý ý tưởng cần giấy phép y tế, tài chính cho vay, rượu bia, thuốc lá.
Trả về JSON:
{
  "ideas": [
    {
      "id": "idea_1",
      "name": "...",
      "description": "...",
      "target_user": "...",
      "test_in_one_week": "...",
      "biggest_risk": "..."
    },
    {
      "id": "idea_2",
      "name": "...",
      "description": "...",
      "target_user": "...",
      "test_in_one_week": "...",
      "biggest_risk": "..."
    },
    {
      "id": "idea_3",
      "name": "...",
      "description": "...",
      "target_user": "...",
      "test_in_one_week": "...",
      "biggest_risk": "..."
    }
  ]
}`;

  const prompt = `Lĩnh vực: ${domain}
Vấn đề nhóm nhìn thấy: ${problem}
Thế mạnh nhóm: ${Array.isArray(strengths) ? strengths.join(", ") : strengths}
Giới hạn: ${Array.isArray(constraints) ? constraints.join(", ") : constraints}
Loại trừ các ý cũ: ${excludeIds.join(", ")}`;

  const result = await callGeminiJson<{ ideas: IdeaDirection[] }>(system, prompt, 0.9);
  if (result && Array.isArray(result.ideas) && result.ideas.length >= 3) {
    return result.ideas.slice(0, 3);
  }

  // Fallback directions based on domain
  return [
    {
      id: `h_${Date.now()}_1`,
      name: "Dịch vụ gom đơn cung cấp tận nơi",
      description: "Tập hợp nhu cầu cùng một khu trọ và giao đồ/dịch vụ tận phòng vào khung giờ cố định.",
      target_user: "Sinh viên ở trọ bận rộn, về sau 18h.",
      test_in_one_week: "Tạo form đặt thử trên Zalo lớp, gom 10 đơn đầu tiên xem tỷ lệ đặt lại.",
      biggest_risk: "Phụ thuộc vào người giao hàng và giá phải cạnh tranh hơn tự mua lẻ.",
    },
    {
      id: `h_${Date.now()}_2`,
      name: "Gói chuẩn bị sẵn 15 phút",
      description: "Chuẩn bị sẵn đầy đủ phần việc khó nhất để người dùng hoàn tất trong 15 phút.",
      target_user: "Sinh viên muốn tự làm nhưng ngại chuẩn bị và dọn rửa phức tạp.",
      test_in_one_week: "Làm thử 5 bộ mẫu thủ công gửi bạn bè dùng thử và ghi nhận phản hồi.",
      biggest_risk: "Chất lượng nguyên liệu hoặc vật phẩm phải luôn đồng đều và an toàn.",
    },
    {
      id: `h_${Date.now()}_3`,
      name: "Bản hướng dẫn kèm hỗ trợ trực tiếp 1-1",
      description: "Cung cấp mẫu chuẩn và kèm kênh chat giải đáp tức thì khi gặp lỗi trong quá trình thực hiện.",
      target_user: "Sinh viên mới bắt đầu chưa có kinh nghiệm tự xoay sở một mình.",
      test_in_one_week: "Đăng bài chia sẻ mẹo trên hội nhóm sinh viên, hỗ trợ 5 bạn đầu tiên qua tin nhắn.",
      biggest_risk: "Tốn thời gian hỗ trợ thủ công và người dùng dễ bỏ cuộc sau lần đầu.",
    },
  ];
}

// 4. Combine ideas
export async function combineIdeaDirections(idea1: any, idea2: any): Promise<IdeaDirection> {
  const system = `Bạn là cố vấn khởi nghiệp. Hãy kết hợp điểm mạnh nhất của 2 hướng ý tưởng sau thành 1 hướng thống nhất, súc tích và thực tế với sinh viên.
Quy tắc: Tên hướng <= 8 từ, mô tả <= 25 từ, test 1 tuần khả thi, không %, không số liệu bịa.
Trả về JSON:
{
  "idea": {
    "id": "combined_1",
    "name": "...",
    "description": "...",
    "target_user": "...",
    "test_in_one_week": "...",
    "biggest_risk": "..."
  }
}`;

  const prompt = `Ý tưởng 1: ${idea1.name} (${idea1.description})\nÝ tưởng 2: ${idea2.name} (${idea2.description})`;
  const result = await callGeminiJson<{ idea: IdeaDirection }>(system, prompt, 0.8);
  if (result && result.idea) {
    return result.idea;
  }

  return {
    id: `combined_${Date.now()}`,
    name: `${idea1.name.slice(0, 20)} kết hợp ${idea2.name.slice(0, 20)}`,
    description: `Kết hợp chuẩn bị sẵn và giao tận nơi theo yêu cầu của sinh viên.`,
    target_user: idea1.target_user || "Sinh viên khu vực trường học",
    test_in_one_week: "Tạo khảo sát kèm đặt cọc thử 10 đơn trong 5 ngày.",
    biggest_risk: "Đòi hỏi nhóm phải phân chia công việc rõ ràng giữa khâu chuẩn bị và giao vận.",
  };
}

// 5. Niches (Ngách)
export async function generateNiches(direction: any): Promise<NicheOption[]> {
  const system = `Gợi ý ĐÚNG 3 phân khúc ngách (khách hàng mục tiêu hẹp) cho hướng giải pháp sau.
Mỗi ngách kèm 2–3 đánh đổi ngắn (dễ tiếp cận? dễ test trong 1 tuần? có khả năng trả tiền?).
Quy tắc: Cực kỳ cụ thể (năm mấy, ở đâu, tình huống nào), không nói chung chung 'sinh viên'.
Trả về JSON:
{
  "niches": [
    {
      "id": "niche_1",
      "name": "...",
      "tradeoffs": ["Dễ tiếp cận qua...", "Test trong 1 tuần", "..."]
    },
    {
      "id": "niche_2",
      "name": "...",
      "tradeoffs": ["...", "...", "..."]
    },
    {
      "id": "niche_3",
      "name": "...",
      "tradeoffs": ["...", "...", "..."]
    }
  ]
}`;

  const prompt = `Tên hướng: ${direction.name}\nMô tả: ${direction.description}\nKhách hàng dự kiến: ${direction.target_user}`;
  const result = await callGeminiJson<{ niches: NicheOption[] }>(system, prompt, 0.8);
  if (result && Array.isArray(result.niches) && result.niches.length >= 3) {
    return result.niches.slice(0, 3);
  }

  return [
    {
      id: "niche_1",
      name: "Sinh viên năm 2–3 ở trọ quanh cơ sở FPT, có bếp riêng, về sau 18h30",
      tradeoffs: ["Hỏi được ngay qua group lớp", "Test trong 1 tuần", "Quy mô ban đầu hẹp"],
    },
    {
      id: "niche_2",
      name: "Sinh viên ở ký túc xá không có điều kiện nấu ăn phức tạp",
      tradeoffs: ["Nhu cầu ăn uống tiện lợi cao", "Bị giới hạn bởi quy định KTX", "Dễ lan truyền miệng"],
    },
    {
      id: "niche_3",
      name: "Bạn trẻ mới đi làm 22–24 tuổi thuê trọ gần trường",
      tradeoffs: ["Khả năng chi trả tốt hơn", "Khó tiếp cận phỏng vấn hơn sinh viên", "Yêu cầu chất lượng cao hơn"],
    },
  ];
}

// 6. Names (Tên dự án)
export async function generateProjectNames(direction: any, niche: any, exclude: string[] = []): Promise<NameSuggestion[]> {
  const system = `Gợi ý ĐÚNG 6 tên dự án khởi nghiệp sáng tạo, ngắn gọn, phù hợp sinh viên.
Mỗi tên gắn với 1 trong các phong cách:
- "Ngắn, dễ nhớ"
- "Gợi công dụng"
- "Vui"
- "Tiếng Anh"
- "Gần gũi"
- "Nói thẳng"
Trả về JSON:
{
  "names": [
    { "name": "...", "style": "Ngắn, dễ nhớ" },
    { "name": "...", "style": "Gợi công dụng" },
    { "name": "...", "style": "Vui" },
    { "name": "...", "style": "Tiếng Anh" },
    { "name": "...", "style": "Gần gũi" },
    { "name": "...", "style": "Nói thẳng" }
  ]
}`;

  const prompt = `Ý tưởng: ${direction.name} - ${direction.description}\nNgách: ${typeof niche === "string" ? niche : niche?.name || ""}\nLoại trừ: ${exclude.join(", ")}`;
  const result = await callGeminiJson<{ names: NameSuggestion[] }>(system, prompt, 0.8);
  if (result && Array.isArray(result.names) && result.names.length >= 6) {
    return result.names.slice(0, 6);
  }

  return [
    { name: "Bếp 15'", style: "Ngắn, dễ nhớ" },
    { name: "Hộp Tối", style: "Gợi công dụng" },
    { name: "NấuLẹ", style: "Vui" },
    { name: "FreshBox", style: "Tiếng Anh" },
    { name: "Mâm Trọ", style: "Gần gũi" },
    { name: "Sơ Chế Sẵn", style: "Nói thẳng" },
  ];
}
