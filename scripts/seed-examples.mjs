import nextEnv from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const EXAMPLES = [
  // SECTION: PROBLEM
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "problem",
    criterionKey: "specificity",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "Khảo sát 12 sinh viên FPT trọ quanh Tân Xã về sau 19h: 10/12 bạn bỏ bữa hoặc ăn mì tôm vì ngại đi chợ xa 2km trong đêm.",
    whyGood: "Công thức chuẩn: 1 nhóm cụ thể (SV trọ Tân Xã) · 1 bối cảnh rõ ràng (sau 19h) · 1 hành vi đo đếm được (10/12 bỏ bữa vì chợ xa 2km).",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "problem",
    criterionKey: "specificity",
    level: "TOT",
    reportedScore: "10",
    excerpt: "Phỏng vấn 8 sinh viên KTX khu B: 7 bạn cho biết mỗi đợt làm đồ án nhóm mất trung bình 3-4 buổi chỉ để tìm chỗ ngồi có ổ cắm điện và wifi đủ mạnh sau 21h.",
    whyGood: "Công thức chuẩn: Số người phỏng vấn thật (8 SV) · Địa điểm cụ thể (KTX khu B) · Tổn thất thời gian có số đo (3-4 buổi tìm chỗ ngồi có điện).",
    sourceType: "lecturer",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "problem",
    criterionKey: "urgency",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "75% sinh viên được hỏi cho biết sút cân hoặc đau dạ dày sau kỳ thi vì liên tục ăn đêm tạm bợ; 9/12 bạn sẵn sàng trả tiền để có suất ăn nóng giao phòng trong 15 phút.",
    whyGood: "Công thức chuẩn: Hậu quả sức khỏe thực tế (đau dạ dày, sút cân) · Hành vi chủ động sẵn sàng chi trả của 9/12 bạn được hỏi.",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "problem",
    criterionKey: "urgency",
    level: "TOT",
    reportedScore: "9.0",
    excerpt: "Mỗi sinh viên năm 1 tốn từ 300.000đ - 500.000đ mua giáo trình photo dùng 1 lần rồi bỏ, trong khi sinh viên khóa trên chất đống trong phòng trọ không biết thanh lý cho ai.",
    whyGood: "Công thức chuẩn: Lượng hóa thành tiền lãng phí (300k-500k) · Sự bế tắc diễn ra đồng thời ở 2 đầu khách hàng (khóa dưới mua đắt, khóa trên bỏ phí).",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "problem",
    criterionKey: "current_alternatives",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "GrabFood tốn 55-65k/bữa và nhiều dầu mỡ; tự đi chợ thì đồ hỏng sau 2 ngày vì tủ lạnh trọ mini 50L. Cả hai giải pháp đều khiến sinh viên bức xúc vì vượt ngân sách hoặc lãng phí.",
    whyGood: "Công thức chuẩn: Kể tên 2 giải pháp hiện có kèm mức giá cụ thể (Grab 55-65k, tủ lạnh 50L làm hỏng đồ) · Chỉ đúng khoảng trống thị trường.",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "problem",
    criterionKey: "current_alternatives",
    level: "TOT",
    reportedScore: "10",
    excerpt: "Các nhóm Zalo pass đồ KTX hiện có tỉ lệ tin giả và scam cọc lên đến 40%; người mua phải lội tin nhắn trôi hàng ngày mà không có bảo chứng người bán là sinh viên cùng trường.",
    whyGood: "Công thức chuẩn: Phân tích sâu điểm yếu của giải pháp thay thế phổ biến nhất (Zalo KTX) · Nêu rõ rủi ro lừa đảo và tổn thất thời gian.",
    sourceType: "lecturer",
  },

  // SECTION: CUSTOMER
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "customer",
    criterionKey: "target_segment",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "Sinh viên năm 2-3 ở trọ một mình quanh cơ sở Hòa Lạc, có bếp riêng, về phòng sau 18h30, ngân sách ăn uống tối đa 35.000đ - 40.000đ/bữa.",
    whyGood: "Công thức chuẩn: 1 nhóm duy nhất (SV năm 2-3 ở 1 mình) · 1 địa bàn (quanh Hòa Lạc) · 1 điều kiện cơ sở vật chất (có bếp riêng) · Ngân sách đếm được.",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "customer",
    criterionKey: "target_segment",
    level: "TOT",
    reportedScore: "10",
    excerpt: "Sinh viên ngành CNTT năm 3-4 đi thực tập onsite tại khu công nghệ cao, tan ca lúc 18h, cần dịch vụ giặt sấy nhận - trả tại cửa phòng trọ trước 22h.",
    whyGood: "Công thức chuẩn: Phân khúc siêu hẹp theo ngành & lịch sinh hoạt (CNTT năm 3-4 đi thực tập về muộn) · Khung giờ nhu cầu phát sinh cụ thể.",
    sourceType: "lecturer",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "customer",
    criterionKey: "early_adopters",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "15 bạn sinh viên trọ tại xóm trọ Thôn 3 Tân Xã tan học ca 5 (19h15), đã tham gia nhóm Zalo test thử đợt 1 và đồng ý đặt trước combo nguyên liệu sơ chế giao lúc 19h45.",
    whyGood: "Công thức chuẩn: Early Adopters có danh tính thực tế (15 SV xóm trọ thôn 3) · Đã có cam kết hành vi (tham gia nhóm Zalo & đồng ý đặt trước).",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "customer",
    criterionKey: "early_adopters",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "Các nhóm sinh viên làm Capstone Project kỳ FA25 đang chạy nước rút tuần 8-10, đã xác nhận đặt cọc 50.000đ giữ chỗ không gian làm việc đêm có màn hình phụ.",
    whyGood: "Công thức chuẩn: Thời điểm nhu cầu cấp bách nhất (chạy Capstone tuần 8-10) · Đã có bằng chứng trả tiền thật (đặt cọc 50k).",
    sourceType: "senior",
  },

  // SECTION: SOLUTION
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "solution",
    criterionKey: "problem_solution_fit",
    level: "TOT",
    reportedScore: "10",
    excerpt: "Hộp nguyên liệu tươi sạch đã nhặt rửa, tẩm ướp sẵn gia vị và chia khẩu phần chuẩn 1 người; sinh viên chỉ cần bật bếp nấu chín trong đúng 12-15 phút không cần dọn rửa cầu kỳ.",
    whyGood: "Công thức chuẩn: Từng đặc tính giải pháp khớp chính xác với nỗi đau ở phần Problem (rửa sẵn giải quyết ngại dọn, 15 phút giải quyết về muộn, khẩu phần 1 người giải quyết tủ lạnh bé).",
    sourceType: "lecturer",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "solution",
    criterionKey: "problem_solution_fit",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "Tủ đồ ký gửi thông minh đặt tại sảnh KTX: người bán để đồ và nhận mã pin, người mua xem ảnh trên web, quét mã nhận đồ trong 30 giây mà không cần hẹn gặp trực tiếp.",
    whyGood: "Công thức chuẩn: Mô tả cách giải quyết 3 bước không rườm rà · Triệt tiêu hoàn toàn rủi ro scam và lệch giờ học giữa 2 sinh viên.",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "solution",
    criterionKey: "value_proposition",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "Bữa tối nóng tự nấu chỉ 32.000đ trong 15 phút, tiết kiệm 40% chi phí so với gọi app và cam kết tươi mới hơn đồ ăn đông lạnh chế biến sẵn.",
    whyGood: "Công thức chuẩn: UVP định lượng rõ ràng: 32k (giá rẻ hơn 40%) · 15 phút (nhanh) · Tươi sạch (chất lượng hơn đồ hộp).",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "solution",
    criterionKey: "value_proposition",
    level: "TOT",
    reportedScore: "10",
    excerpt: "Nền tảng mượn giáo trình và thiết bị học tập nội bộ trường: lấy đồ trong 10 phút tại sảnh giảng đường, giá thuê chỉ 10% giá bìa, cam kết 100% người dùng xác thực MSSV.",
    whyGood: "Công thức chuẩn: 3 cam kết vượt trội: 10 phút lấy đồ · 10% giá bìa · 100% sinh viên cùng trường uy tín tuyệt đối.",
    sourceType: "lecturer",
  },

  // SECTION: REVENUE
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "revenue",
    criterionKey: "pricing_logic",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "Giá 35.000đ/suất gồm cost nguyên liệu 19.000đ, bao bì tự phân hủy 3.000đ, lợi nhuận gộp 13.000đ; 14/15 sinh viên được phỏng vấn xác nhận mức giá này hợp lý vì rẻ hơn cơm bình dân 40.000đ.",
    whyGood: "Công thức chuẩn: Bóc tách cấu trúc giá (Cost 19k + Packaging 3k + Margin 13k) · Kiểm chứng với 14/15 khách hàng thật và đối chiếu giá thị trường.",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "revenue",
    criterionKey: "pricing_logic",
    level: "TOT",
    reportedScore: "9.0",
    excerpt: "Phí dịch vụ 8% trên mỗi giao dịch ký gửi thành công, tối thiểu 5.000đ/món đồ; rẻ hơn 60% so với phí ký gửi tiệm đồ cũ bên ngoài (thường lấy 20-25%).",
    whyGood: "Công thức chuẩn: Mức phí rõ ràng kèm sàn tối thiểu · So sánh trực tiếp với mức phí đối thủ để chứng minh tính hấp dẫn.",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "revenue",
    criterionKey: "viability",
    level: "TOT",
    reportedScore: "9.5",
    excerpt: "Dòng tiền từ bán từng lần (35k) và gói combo tuần (160k/5 bữa). Điểm hòa vốn là 22 suất/ngày, phục vụ tập trung 2 dãy trọ Tân Xã để tối ưu phí vận chuyển 0đ bằng xe đạp điện.",
    whyGood: "Công thức chuẩn: Xác định điểm hòa vốn đếm được (22 suất/ngày) · Cách gom cụm địa lý (2 dãy trọ) để triệt tiêu chi phí giao hàng.",
    sourceType: "senior",
  },
  {
    course: "EXE101",
    checkpoint: "Checkpoint 2",
    sectionKey: "revenue",
    criterionKey: "viability",
    level: "TOT",
    reportedScore: "10",
    excerpt: "Mô hình tạo dòng tiền dương ngay từ tháng đầu với vốn lưu động 3.000.000đ mua máy in nhiệt và móc treo; đạt hòa vốn khi có 35 đơn giặt/tuần, tỷ lệ quay lại kỳ vọng 60% sau tuần 2.",
    whyGood: "Công thức chuẩn: Vốn đầu tư ban đầu nhỏ sinh viên tự lo được (3 triệu) · Điểm hòa vốn tuần (35 đơn) · Giả định tỷ lệ khách quen tái mua.",
    sourceType: "lecturer",
  },
];

async function seed() {
  console.log("Seeding high-scoring examples library...");

  for (const ex of EXAMPLES) {
    await sql`
      INSERT INTO examples (
        course,
        checkpoint,
        section_key,
        criterion_key,
        level,
        reported_score,
        excerpt,
        why_good,
        source_type,
        consent,
        anonymized,
        created_at
      )
      VALUES (
        ${ex.course},
        ${ex.checkpoint},
        ${ex.sectionKey},
        ${ex.criterionKey},
        ${ex.level},
        ${ex.reportedScore},
        ${ex.excerpt},
        ${ex.whyGood},
        ${ex.sourceType},
        true,
        true,
        now()
      )
    `;
  }

  console.log(`Seeded ${EXAMPLES.length} high-scoring proposal examples successfully!`);
  await sql.end();
}

seed().catch((err) => {
  console.error("Seeding examples failed:", err);
  process.exit(1);
});
