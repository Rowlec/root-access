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
    sections: [
      {
        id: "problem",
        title: "Vấn đề (Problem)",
        order: 1,
        requirement: "Mô tả vấn đề nhức nhối của khách hàng mục tiêu, bối cảnh thực tế và hậu quả nếu vấn đề không được giải quyết.",
        criteria: [
          {
            id: "specificity",
            name: "Cụ thể",
            description: "Vấn đề gắn với nhóm khách hàng và tình huống cụ thể",
            levels: {
              CHUA_DAT: "Nêu vấn đề chung chung, áp dụng cho ai cũng được.",
              DAT: "Có nhóm khách hàng và tình huống, nhưng thiếu ví dụ thực tế.",
              TOT: "Có nhóm khách hàng, tình huống, ví dụ và bằng chứng từ dữ liệu của nhóm."
            }
          },
          {
            id: "urgency",
            name: "Mức độ cấp bách",
            description: "Mức độ cần thiết phải giải quyết vấn đề ngay của khách hàng",
            levels: {
              CHUA_DAT: "Khách hàng không nhất thiết phải trả tiền hoặc hành động ngay để giải quyết.",
              DAT: "Vấn đề gây bất tiện nhưng giải pháp hiện tại vẫn tạm chấp nhận được.",
              TOT: "Vấn đề gây tổn thất rõ rệt (thời gian, tiền bạc, cảm xúc), khách hàng đang chủ động tìm cách khắc phục."
            }
          },
          {
            id: "current_alternatives",
            name: "Giải pháp thay thế hiện tại",
            description: "Phân tích khách hàng đang giải quyết vấn đề bằng cách nào và điểm yếu của cách đó",
            levels: {
              CHUA_DAT: "Khẳng định không có ai làm hoặc không nêu giải pháp thay thế nào.",
              DAT: "Có kể tên giải pháp thay thế nhưng chưa chỉ rõ điểm yếu mà khách hàng bức xúc.",
              TOT: "Phân tích rõ điểm yếu/khoảng trống của các giải pháp hiện tại dựa trên phản hồi khách hàng."
            }
          }
        ],
        common_mistakes: [
          "Nói về giải pháp thay vì vấn đề",
          "Số liệu không có nguồn",
          "Đánh đồng mong muốn cá nhân với nhu cầu thị trường"
        ],
        fix_hints: [
          "Gợi ý đưa số liệu khảo sát thật vào",
          "Gợi ý đánh dấu giả định nếu chưa phỏng vấn",
          "Tập trung vào nỗi đau cụ thể"
        ]
      },
      {
        id: "customer",
        title: "Khách hàng mục tiêu (Target Customer)",
        order: 2,
        requirement: "Xác định rõ phân khúc khách hàng mục tiêu, chân dung người dùng (persona) và quy mô thị trường sơ bộ.",
        criteria: [
          {
            id: "target_segment",
            name: "Phân khúc mục tiêu",
            description: "Độ sắc nét của nhóm khách hàng trọng tâm",
            levels: {
              CHUA_DAT: "Định nghĩa khách hàng quá rộng như 'tất cả sinh viên' hoặc 'mọi người'.",
              DAT: "Có tiêu chí nhân khẩu học nhưng thiếu đặc điểm hành vi và rào cản.",
              TOT: "Phân khúc cụ thể với tiêu chí nhân khẩu học, hành vi, bối cảnh xuất hiện nhu cầu rõ nét."
            }
          },
          {
            id: "early_adopters",
            name: "Khách hàng tiên phong (Early Adopters)",
            description: "Nhóm sẵn sàng dùng thử đầu tiên và trả tiền",
            levels: {
              CHUA_DAT: "Chưa xác định ai là người sẵn sàng dùng thử và trả tiền đầu tiên.",
              DAT: "Có nhắc đến người dùng đầu tiên nhưng lý do họ chọn mình chưa thuyết phục.",
              TOT: "Mô tả rõ chân dung Early Adopters, lý do họ cấp thiết cần sản phẩm ngay trong giai đoạn đầu."
            }
          }
        ],
        common_mistakes: [
          "Chọn thị trường quá rộng không thể tiếp cận",
          "Thiếu bằng chứng phỏng vấn khách hàng tiềm năng"
        ],
        fix_hints: [
          "Yêu cầu thêm dữ liệu phỏng vấn sâu",
          "Khoanh vùng nhóm người dùng đầu tiên"
        ]
      },
      {
        id: "solution",
        title: "Giải pháp & Đề xuất giá trị (Solution & UVP)",
        order: 3,
        requirement: "Trình bày giải pháp cốt lõi, giá trị khác biệt và cách giải quyết trực diện vấn đề đã nêu.",
        criteria: [
          {
            id: "problem_solution_fit",
            name: "Khớp vấn đề - giải pháp",
            description: "Giải pháp giải quyết đúng nỗi đau đã nêu ở phần Problem",
            levels: {
              CHUA_DAT: "Tính năng đưa ra không giải quyết các bức xúc cụ thể đã nêu ở phần Problem.",
              DAT: "Giải quyết được một phần vấn đề nhưng còn ôm đồm nhiều tính năng phụ không cần thiết.",
              TOT: "Tập trung giải quyết trực diện nỗi đau lớn nhất, tính năng gắn liền với phản hồi khách hàng."
            }
          },
          {
            id: "value_proposition",
            name: "Đề xuất giá trị độc đáo (UVP)",
            description: "Điểm vượt trội và khác biệt so với đối thủ",
            levels: {
              CHUA_DAT: "Không có điểm gì khác biệt so với các sản phẩm đang có trên thị trường.",
              DAT: "Có nêu khác biệt nhưng dễ bị đối thủ sao chép ngay hoặc chưa tạo lợi thế lớn.",
              TOT: "UVP rõ ràng, thuyết phục, khách hàng nhận được lợi ích vượt trội so với giải pháp thay thế."
            }
          }
        ],
        common_mistakes: [
          "Mô tả công nghệ phức tạp mà quên lợi ích người dùng",
          "Vẽ quá nhiều tính năng cho bản MVP"
        ],
        fix_hints: [
          "Rút gọn tính năng tập trung vào MVP",
          "Làm rõ khác biệt cốt lõi"
        ]
      },
      {
        id: "revenue",
        title: "Mô hình doanh thu (Revenue Model)",
        order: 4,
        requirement: "Xác định các dòng doanh thu dự kiến, cấu trúc giá sơ bộ và giả định kinh tế đơn vị.",
        criteria: [
          {
            id: "pricing_logic",
            name: "Cơ sở định giá",
            description: "Căn cứ hợp lý của mức giá đề xuất",
            levels: {
              CHUA_DAT: "Đưa ra mức giá tùy tiện, không có căn cứ từ chi phí hay độ sẵn sàng chi trả.",
              DAT: "Có cơ sở định giá nhưng chưa kiểm chứng với ngân sách của khách hàng mục tiêu.",
              TOT: "Mô hình giá phù hợp với giá trị mang lại, có đối chiếu với giải pháp thay thế và khảo sát."
            }
          },
          {
            id: "viability",
            name: "Tính khả thi tài chính",
            description: "Khả năng tạo doanh thu và tự nuôi sống mô hình",
            levels: {
              CHUA_DAT: "Không rõ ai là người trả tiền (người dùng hay bên thứ ba tài trợ).",
              DAT: "Xác định được người trả tiền nhưng dòng tiền phụ thuộc vào các giả định quá lạc quan.",
              TOT: "Chỉ rõ luồng tiền, người trả tiền và các giả định doanh thu được đánh dấu kiểm chứng cẩn trọng."
            }
          }
        ],
        common_mistakes: [
          "Đưa ra số liệu doanh thu hàng tỷ mà không có căn cứ",
          "Không phân biệt người dùng (User) và người trả tiền (Customer)"
        ],
        fix_hints: [
          "Đánh dấu giả định doanh thu [GIẢ ĐỊNH]",
          "Bổ sung kết quả khảo sát mức giá sẵn sàng chi trả"
        ]
      }
    ]
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
