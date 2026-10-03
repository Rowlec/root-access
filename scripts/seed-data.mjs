import nextEnv from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function seed() {
  console.log("Seeding site_selectors...");
  const selectorContent = {
    version: 1,
    chatgpt: {
      input: ["#prompt-textarea", "div[contenteditable='true']"],
      assistantMessage: ["[data-message-author-role='assistant']"],
      stopButton: ["button[data-testid='stop-button']"]
    },
    gemini: {
      input: ["rich-textarea .ql-editor", "div[contenteditable='true']"],
      assistantMessage: ["model-response message-content", "model-response"],
      stopButton: ["button[aria-label*='Stop']", "button[aria-label*='Dừng']"]
    }
  };

  await sql`
    INSERT INTO site_selectors (id, version, content, is_active, created_at)
    VALUES ('default', 1, ${sql.json(selectorContent)}, true, now())
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      version = EXCLUDED.version,
      is_active = EXCLUDED.is_active;
  `;

  console.log("Seeding packs...");
  const exe101Cp2 = {
    id: "exe101-cp2",
    version: 1,
    course: "EXE101",
    term: "SP26",
    checkpoint: "Checkpoint 2",
    source: "Hướng dẫn Startup Proposal EXE101 - Khung chuẩn FPT University FA25/SP26",
    ends_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    sections: [
      {
        id: "problem",
        title: "Vấn đề (Problem)",
        order: 1,
        requirement: "Mô tả vấn đề nhức nhối của khách hàng mục tiêu, bối cảnh thực tế và hậu quả nếu vấn đề không được giải quyết.",
        intake: [
          {
            id: "last_seen",
            question: "Lần gần nhất bạn thấy khách hàng gặp vấn đề này là khi nào, ở đâu?",
            type: "text",
            options: [],
            prompt_label: "Bối cảnh thấy vấn đề lần gần nhất",
          },
          {
            id: "frequency",
            question: "Chuyện đó xảy ra với họ bao lâu một lần?",
            type: "single",
            options: ["Hằng ngày", "Vài lần mỗi tuần", "Vài lần mỗi tháng", "Hiếm"],
            unknown_label: "Chưa biết",
            prompt_label: "Tần suất xảy ra",
          },
          {
            id: "consequence",
            question: "Nếu không giải quyết, họ mất gì?",
            type: "multi",
            options: ["Thời gian", "Tiền bạc", "Sức khoẻ", "Điểm số", "Cảm xúc"],
            unknown_label: "Chưa biết",
            prompt_label: "Mất mát nếu không giải quyết",
          },
          {
            id: "asked_count",
            question: "Nhóm đã hỏi bao nhiêu người về chuyện này?",
            type: "number",
            options: [],
            unknown_label: "Chưa hỏi ai",
            if_unknown_task: "Phỏng vấn 5 người trong ngách về vấn đề",
            prompt_label: "Số người nhóm đã hỏi về vấn đề",
          },
        ],
        criteria: [
          {
            id: "specificity",
            name: "Cụ thể",
            description: "Vấn đề gắn với nhóm khách hàng và tình huống cụ thể",
            levels: {
              CHUA_DAT: "Nêu vấn đề chung chung, áp dụng cho ai cũng được.",
              DAT: "Có nhóm khách hàng và tình huống, nhưng thiếu ví dụ thực tế.",
              TOT: "Có nhóm khách hàng, tình huống, ví dụ và bằng chứng từ dữ liệu của nhóm.",
            },
            anchors: {
              CHUA_DAT: "Sinh viên thường gặp khó khăn trong việc ăn uống lành mạnh hàng ngày.",
              DAT: "Sinh viên năm 2 ĐH FPT thường không có thời gian nấu nướng vào buổi tối do lịch học kín.",
              TOT: "Khảo sát 12 sinh viên FPT trọ quanh Hòa Lạc về sau 19h: 10/12 bạn bỏ bữa hoặc ăn mì tôm vì ngại đi chợ xa 2km.",
            },
          },
          {
            id: "urgency",
            name: "Mức độ cấp bách",
            description: "Mức độ cần thiết phải giải quyết vấn đề ngay của khách hàng",
            levels: {
              CHUA_DAT: "Khách hàng không nhất thiết phải trả tiền hoặc hành động ngay để giải quyết.",
              DAT: "Vấn đề gây bất tiện nhưng giải pháp hiện tại vẫn tạm chấp nhận được.",
              TOT: "Vấn đề gây tổn thất rõ rệt (thời gian, tiền bạc, cảm xúc), khách hàng đang chủ động tìm cách khắc phục.",
            },
            anchors: {
              CHUA_DAT: "Khách hàng cảm thấy ăn mì tôm không ngon và hơi bất tiện.",
              DAT: "Sinh viên tốn thời gian nghĩ món và mệt mỏi nhưng vẫn chấp nhận chịu đựng.",
              TOT: "75% sinh viên được hỏi cho biết sút cân hoặc đau dạ dày sau 1 kỳ học vì liên tục ăn đêm tạm bợ, rất muốn giải pháp dứt điểm.",
            },
          },
          {
            id: "current_alternatives",
            name: "Giải pháp thay thế hiện tại",
            description: "Phân tích khách hàng đang giải quyết vấn đề bằng cách nào và điểm yếu của cách đó",
            levels: {
              CHUA_DAT: "Khẳng định không có ai làm hoặc không nêu giải pháp thay thế nào.",
              DAT: "Có kể tên giải pháp thay thế nhưng chưa chỉ rõ điểm yếu mà khách hàng bức xúc.",
              TOT: "Phân tích rõ điểm yếu/khoảng trống của các giải pháp hiện tại dựa trên phản hồi khách hàng.",
            },
            anchors: {
              CHUA_DAT: "Hiện nay chưa có ai giải quyết việc nấu ăn nhanh cho sinh viên.",
              DAT: "Họ thường tự đi chợ mua tích trữ hoặc gọi GrabFood/ShopeeFood.",
              TOT: "GrabFood tốn 50-60k/bữa và nhiều dầu mỡ; tự đi chợ thì đồ hỏng vì tủ lạnh trọ bé. Cả 2 cách đều khiến sinh viên bức xúc.",
            },
          },
        ],
        common_mistakes: [
          "Nói về giải pháp thay vì vấn đề",
          "Số liệu không có nguồn",
          "Đánh đồng mong muốn cá nhân với nhu cầu thị trường",
        ],
        fix_hints: [
          "Gợi ý đưa số liệu khảo sát thật vào",
          "Gợi ý đánh dấu giả định nếu chưa phỏng vấn",
          "Tập trung vào nỗi đau cụ thể",
        ],
      },
      {
        id: "customer",
        title: "Khách hàng mục tiêu (Target Customer)",
        order: 2,
        requirement: "Xác định rõ phân khúc khách hàng mục tiêu, chân dung người dùng (persona) và quy mô thị trường sơ bộ.",
        intake: [
          {
            id: "talked_count",
            question: "Nhóm đã nói chuyện với bao nhiêu người trong ngách?",
            type: "number",
            options: [],
            unknown_label: "Chưa hỏi ai",
            if_unknown_task: "Phỏng vấn 5 người trong ngách",
            prompt_label: "Số người nhóm đã trò chuyện",
          },
          {
            id: "customer_quote",
            question: "Một người trong số đó nói gì? Ghi gần đúng lời họ.",
            type: "quote",
            options: [],
            unknown_label: "Chưa hỏi ai",
            prompt_label: "Lời một khách hàng",
          },
          {
            id: "current_workaround",
            question: "Hiện họ xử lý chuyện này bằng cách nào?",
            type: "text",
            options: [],
            unknown_label: "Chưa rõ",
            if_unknown_task: "Tìm hiểu cách khách hàng đang tự xoay sở",
            prompt_label: "Cách khách hàng đang xử lý hiện nay",
          },
          {
            id: "payer",
            question: "Ai là người trả tiền?",
            type: "single",
            options: ["Chính họ", "Bố mẹ", "Trường hoặc CLB"],
            unknown_label: "Chưa biết",
            prompt_label: "Người trả tiền",
          },
        ],
        criteria: [
          {
            id: "target_segment",
            name: "Phân khúc mục tiêu",
            description: "Độ sắc nét của nhóm khách hàng trọng tâm",
            levels: {
              CHUA_DAT: "Định nghĩa khách hàng quá rộng như 'tất cả sinh viên' hoặc 'mọi người'.",
              DAT: "Có tiêu chí nhân khẩu học nhưng thiếu đặc điểm hành vi và rào cản.",
              TOT: "Phân khúc cụ thể với tiêu chí nhân khẩu học, hành vi, bối cảnh xuất hiện nhu cầu rõ nét.",
            },
            anchors: {
              CHUA_DAT: "Khách hàng là sinh viên và những người bận rộn muốn ăn uống tiện lợi.",
              DAT: "Sinh viên năm 2-3 trọ gần trường FPT, có nấu ăn nhưng hay về muộn.",
              TOT: "Sinh viên năm 2-3 ở trọ quanh cơ sở FPT (Hòa Lạc), có bếp riêng, về phòng sau 18h30, ngân sách ăn uống 30-40k/bữa.",
            },
          },
          {
            id: "early_adopters",
            name: "Khách hàng tiên phong (Early Adopters)",
            description: "Nhóm sẵn sàng dùng thử đầu tiên và trả tiền",
            levels: {
              CHUA_DAT: "Chưa xác định ai là người sẵn sàng dùng thử và trả tiền đầu tiên.",
              DAT: "Có nhắc đến người dùng đầu tiên nhưng lý do họ chọn mình chưa thuyết phục.",
              TOT: "Mô tả rõ chân dung Early Adopters, lý do họ cấp thiết cần sản phẩm ngay trong giai đoạn đầu.",
            },
            anchors: {
              CHUA_DAT: "Người dùng đầu tiên là các bạn sinh viên trong trường.",
              DAT: "Nhóm bạn cùng phòng hoặc sinh viên trong CLB của nhóm.",
              TOT: "Sinh viên trọ khu Tân Xã về muộn sau ca thực tập/học ca 5, tủ lạnh trống, sẵn sàng đặt hộp nguyên liệu sơ chế giao tận phòng lúc 19h.",
            },
          },
        ],
        common_mistakes: [
          "Chọn thị trường quá rộng không thể tiếp cận",
          "Thiếu bằng chứng phỏng vấn khách hàng tiềm năng",
        ],
        fix_hints: [
          "Yêu cầu thêm dữ liệu phỏng vấn sâu",
          "Khoanh vùng nhóm người dùng đầu tiên",
        ],
      },
      {
        id: "solution",
        title: "Giải pháp & Đề xuất giá trị (Solution & UVP)",
        order: 3,
        requirement: "Trình bày giải pháp cốt lõi, giá trị khác biệt và cách giải quyết trực diện vấn đề đã nêu.",
        intake: [
          {
            id: "solution_steps",
            question: "Khách hàng dùng giải pháp này 1 lần như thế nào? Mô tả 3 bước.",
            type: "text",
            options: [],
            prompt_label: "3 bước khách hàng sử dụng giải pháp",
          },
          {
            id: "core_advantage",
            question: "So với cách họ đang làm, điều gì tốt hơn rõ nhất?",
            type: "single",
            options: ["Nhanh hơn", "Rẻ hơn", "Tiện hơn", "Tin cậy hơn", "Vui hơn"],
            prompt_label: "Điểm tốt hơn rõ nhất",
          },
          {
            id: "prototype_status",
            question: "Nhóm đã có bản thử chưa?",
            type: "single",
            options: ["Chưa có", "Mockup", "Landing page", "Bán thử"],
            prompt_label: "Giai đoạn thử nghiệm hiện tại",
          },
        ],
        criteria: [
          {
            id: "problem_solution_fit",
            name: "Khớp vấn đề - giải pháp",
            description: "Giải pháp giải quyết đúng nỗi đau đã nêu ở phần Problem",
            levels: {
              CHUA_DAT: "Tính năng đưa ra không giải quyết các bức xúc cụ thể đã nêu ở phần Problem.",
              DAT: "Giải quyết được một phần vấn đề nhưng còn ôm đồm nhiều tính năng phụ không cần thiết.",
              TOT: "Tập trung giải quyết trực diện nỗi đau lớn nhất, tính năng gắn liền với phản hồi khách hàng.",
            },
            anchors: {
              CHUA_DAT: "App tích hợp AI gợi ý món ăn, mạng xã hội chia sẻ công thức và ví điện tử.",
              DAT: "Giao hộp nguyên liệu tươi sống tới tận nhà để sinh viên tự nấu.",
              TOT: "Hộp nguyên liệu đã nhặt, rửa, tẩm ướp và chia khẩu phần 1 người; nấu chín trong 15 phút, giải quyết dứt điểm nỗi sợ rửa dọn và đi chợ muộn.",
            },
          },
          {
            id: "value_proposition",
            name: "Đề xuất giá trị độc đáo (UVP)",
            description: "Điểm vượt trội và khác biệt so với đối thủ",
            levels: {
              CHUA_DAT: "Không có điểm gì khác biệt so với các sản phẩm đang có trên thị trường.",
              DAT: "Có nêu khác biệt nhưng dễ bị đối thủ sao chép ngay hoặc chưa tạo lợi thế lớn.",
              TOT: "UVP rõ ràng, thuyết phục, khách hàng nhận được lợi ích vượt trội so với giải pháp thay thế.",
            },
            anchors: {
              CHUA_DAT: "Sản phẩm nhanh hơn, rẻ hơn và tốt hơn mọi đối thủ.",
              DAT: "Hộp nguyên liệu tiện lợi, giá sinh viên, đảm bảo vệ sinh.",
              TOT: "Bữa tối nóng tự nấu chỉ 35k trong 15 phút không cần đi chợ hay sơ chế, rẻ hơn 40% so với đặt đồ ăn ngoài.",
            },
          },
        ],
        common_mistakes: [
          "Mô tả công nghệ phức tạp mà quên lợi ích người dùng",
          "Vẽ quá nhiều tính năng cho bản MVP",
        ],
        fix_hints: [
          "Rút gọn tính năng tập trung vào MVP",
          "Làm rõ khác biệt cốt lõi",
        ],
      },
      {
        id: "revenue",
        title: "Mô hình doanh thu (Revenue Model)",
        order: 4,
        requirement: "Xác định các dòng doanh thu dự kiến, cấu trúc giá sơ bộ và giả định kinh tế đơn vị.",
        intake: [
          {
            id: "revenue_stream",
            question: "Thu tiền bằng cách nào?",
            type: "single",
            options: ["Bán từng lần", "Gói tháng", "Hoa hồng", "Quảng cáo", "Freemium"],
            unknown_label: "Chưa biết",
            prompt_label: "Phương thức thu tiền",
          },
          {
            id: "expected_price",
            question: "Giá dự kiến, và vì sao chọn giá đó?",
            type: "text",
            options: [],
            prompt_label: "Mức giá dự kiến và cơ sở định giá",
          },
          {
            id: "price_tested_count",
            question: "Đã hỏi ai 'bạn có trả mức này không' chưa?",
            type: "number",
            options: [],
            unknown_label: "Chưa hỏi ai",
            if_unknown_task: "Khảo sát mức giá sẵn sàng chi trả với 10 người",
            prompt_label: "Số người đã xác nhận mức giá",
          },
          {
            id: "major_cost",
            question: "Chi phí lớn nhất cho mỗi đơn là gì?",
            type: "text",
            options: [],
            prompt_label: "Chi phí lớn nhất trên mỗi đơn vị",
          },
        ],
        criteria: [
          {
            id: "pricing_logic",
            name: "Cơ sở định giá",
            description: "Căn cứ hợp lý của mức giá đề xuất",
            levels: {
              CHUA_DAT: "Đưa ra mức giá tùy tiện, không có căn cứ từ chi phí hay độ sẵn sàng chi trả.",
              DAT: "Có cơ sở định giá nhưng chưa kiểm chứng với ngân sách của khách hàng mục tiêu.",
              TOT: "Mô hình giá phù hợp với giá trị mang lại, có đối chiếu với giải pháp thay thế và khảo sát.",
            },
            anchors: {
              CHUA_DAT: "Giá 50k/hộp, doanh thu kỳ vọng 100 triệu tháng đầu.",
              DAT: "Giá 35k/hộp dựa trên giá nguyên liệu chợ và tiền công sơ chế.",
              TOT: "Giá 35k/hộp, cost nguyên liệu 20k, đóng gói 3k, lãi gộp 12k; đã hỏi 15 bạn trong ngách và 13/15 đồng ý mức giá này vì rẻ hơn cơm tiệm 45k.",
            },
          },
          {
            id: "viability",
            name: "Tính khả thi tài chính",
            description: "Khả năng tạo doanh thu và tự nuôi sống mô hình",
            levels: {
              CHUA_DAT: "Không rõ ai là người trả tiền (người dùng hay bên thứ ba tài trợ).",
              DAT: "Xác định được người trả tiền nhưng dòng tiền phụ thuộc vào các giả định quá lạc quan.",
              TOT: "Chỉ rõ luồng tiền, người trả tiền và các giả định doanh thu được đánh dấu kiểm chứng cẩn trọng.",
            },
            anchors: {
              CHUA_DAT: "Mô hình sinh lời cao từ bán hàng và quảng cáo từ các nhãn hàng thực phẩm lớn.",
              DAT: "Bán trực tiếp qua group Zalo khu trọ, thu tiền khi giao hàng.",
              TOT: "Dòng tiền từ bán từng lần (35k) hoặc gói tuần (160k/5 bữa). Điểm hòa vốn là 25 đơn/ngày, phục vụ tập trung 1 dãy trọ để tối ưu phí ship 0đ.",
            },
          },
        ],
        common_mistakes: [
          "Đưa ra số liệu doanh thu hàng tỷ mà không có căn cứ",
          "Không phân biệt người dùng (User) và người trả tiền (Customer)",
        ],
        fix_hints: [
          "Đánh dấu giả định doanh thu [GIẢ ĐỊNH]",
          "Bổ sung kết quả khảo sát mức giá sẵn sàng chi trả",
        ],
      },
    ],
  };

  await sql`
    INSERT INTO packs (id, version, course, term, checkpoint, source, content, is_active, created_at)
    VALUES (
      ${exe101Cp2.id},
      ${exe101Cp2.version},
      ${exe101Cp2.course},
      ${exe101Cp2.term},
      ${exe101Cp2.checkpoint},
      ${exe101Cp2.source},
      ${sql.json(exe101Cp2)},
      true,
      now()
    )
    ON CONFLICT (id, version) DO UPDATE SET
      content = EXCLUDED.content,
      source = EXCLUDED.source,
      checkpoint = EXCLUDED.checkpoint,
      is_active = EXCLUDED.is_active;
  `;

  console.log("Database seeded successfully!");
  await sql.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
