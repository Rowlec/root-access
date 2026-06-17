export const ideaValidationWorkflowVi = {
  id: "idea-validation",
  title: "Quy trình kiểm chứng ý tưởng",
  description:
    "Kiểm tra xem [STARTUP IDEA] có giải quyết vấn đề thật trong lĩnh vực [INDUSTRY] trước khi đầu tư thời gian vào đề xuất đầy đủ hay không.",
  estimatedTime: "60-90 phút",
  steps: [
    {
      title: "Làm rõ vấn đề cốt lõi",
      goal: "Chuyển ý tưởng khởi nghiệp thành một phát biểu vấn đề cụ thể.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy đóng vai mentor khởi nghiệp cho một bài tập đại học. Ý tưởng khởi nghiệp của tôi là [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Hãy giúp tôi viết một phát biểu vấn đề rõ ràng. Bao gồm ai gặp vấn đề, vấn đề xảy ra khi nào, vì sao nó quan trọng, và điều gì khiến vấn đề đủ đau để đáng giải quyết.",
      expectedOutput:
        "Một phát biểu vấn đề tập trung, có người dùng mục tiêu, tình huống, pain point và lý do quan trọng.",
      commonMistakes: [
        "Bắt đầu bằng tính năng sản phẩm thay vì vấn đề",
        "Định nghĩa vấn đề quá rộng",
        "Bỏ qua nhóm người thường xuyên gặp vấn đề nhất",
      ],
    },
    {
      title: "Liệt kê giả định cần kiểm chứng",
      goal: "Xác định các giả định rủi ro nhất phải đúng thì ý tưởng mới khả thi.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy liệt kê các giả định quan trọng nhất tôi cần kiểm chứng. Chia thành nhóm: vấn đề khách hàng, mức sẵn sàng sử dụng, mức sẵn sàng trả tiền và tính khả thi. Giải thích vì sao từng giả định quan trọng với đề xuất khởi nghiệp đại học.",
      expectedOutput:
        "Danh sách giả định được nhóm rõ ràng và xếp theo mức độ quan trọng cần kiểm chứng.",
      commonMistakes: [
        "Chỉ kiểm chứng tính khả thi kỹ thuật",
        "Mặc định người dùng sẽ trả tiền mà không có bằng chứng",
        "Bỏ qua mức độ cấp bách của vấn đề",
      ],
    },
    {
      title: "Thiết kế câu hỏi phỏng vấn",
      goal: "Tạo bộ câu hỏi thực tế để phỏng vấn khách hàng tiềm năng.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy tạo 10 câu hỏi phỏng vấn khách hàng để kiểm chứng [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Tránh câu hỏi dẫn dắt. Tập trung vào hành vi hiện tại, trải nghiệm trong quá khứ, mức độ đau, giải pháp thay thế đang dùng và mức sẵn sàng thử một giải pháp mới.",
      expectedOutput:
        "Một bộ câu hỏi phỏng vấn thân thiện với sinh viên, không dẫn dắt và dùng được ngay.",
      commonMistakes: [
        "Hỏi người khác có thích ý tưởng không",
        "Pitch ý tưởng trong lúc phỏng vấn",
        "Chỉ dùng câu hỏi có/không",
      ],
    },
    {
      title: "Xác định tiêu chí kiểm chứng",
      goal: "Đặt tín hiệu rõ ràng để quyết định có nên tiếp tục ý tưởng hay không.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy giúp tôi xác định tiêu chí kiểm chứng đơn giản cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Bao gồm kiểm chứng tích cực, trung tính và tiêu cực sẽ trông như thế nào sau khi phỏng vấn 5-10 người dùng mục tiêu.",
      expectedOutput:
        "Các tín hiệu kiểm chứng và tiêu chí quyết định rõ ràng để tiếp tục, điều chỉnh hoặc dừng ý tưởng.",
      commonMistakes: [
        "Xem mọi lời khen là kiểm chứng",
        "Không định nghĩa thành công trước khi phỏng vấn",
        "Bỏ qua bằng chứng tiêu cực",
      ],
    },
  ],
} as const;

export const marketResearchWorkflowVi = {
  id: "market-research",
  title: "Quy trình nghiên cứu thị trường",
  description:
    "Nghiên cứu thị trường, khách hàng và các lựa chọn hiện có cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY].",
  estimatedTime: "90-120 phút",
  steps: [
    {
      title: "Xác định phạm vi nghiên cứu",
      goal: "Quyết định thông tin thị trường nào cần cho đề xuất.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy đóng vai trợ lý nghiên cứu khởi nghiệp. Ý tưởng khởi nghiệp của tôi là [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Hãy xác định phạm vi nghiên cứu thị trường thực tế cho một bài tập đại học. Bao gồm khách hàng mục tiêu, phân khúc thị trường, phạm vi địa lý, đối thủ và các câu hỏi chính cần trả lời.",
      expectedOutput:
        "Một kế hoạch nghiên cứu tập trung với phân khúc khách hàng, ranh giới thị trường và câu hỏi nghiên cứu.",
      commonMistakes: [
        "Nghiên cứu cả ngành quá rộng thay vì một phân khúc cụ thể",
        "Bỏ qua định nghĩa khách hàng mục tiêu",
        "Thu thập dữ kiện không hỗ trợ đề xuất",
      ],
    },
    {
      title: "Xác định phân khúc khách hàng",
      goal: "Chia thị trường thành các nhóm khách hàng mà sinh viên có thể tiếp cận để nghiên cứu.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy xác định 3-5 phân khúc khách hàng có thể có. Với mỗi phân khúc, mô tả nhu cầu, hành vi, pain point, khả năng chi trả và cách một sinh viên đại học có thể tiếp cận họ để nghiên cứu.",
      expectedOutput:
        "Bảng phân khúc khách hàng với nhu cầu, hành vi, pain point và mức độ dễ tiếp cận.",
      commonMistakes: [
        "Chọn phân khúc gần như không thể liên hệ",
        "Chỉ nhóm người dùng theo độ tuổi",
        "Giả định mọi người dùng có cùng nhu cầu",
      ],
    },
    {
      title: "Lập bản đồ đối thủ",
      goal: "Tìm giải pháp trực tiếp, gián tiếp và thay thế.",
      recommendedTool: "ChatGPT + Google",
      promptTemplate:
        "Hãy nghiên cứu đối thủ cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Liệt kê đối thủ trực tiếp, đối thủ gián tiếp và giải pháp thay thế. Với mỗi mục, nêu họ cung cấp gì, người dùng mục tiêu, điểm mạnh, điểm yếu và điều tôi nên kiểm chứng bằng Google.",
      expectedOutput:
        "Bản đồ đối thủ gồm lựa chọn trực tiếp, gián tiếp, thay thế và ghi chú kiểm chứng.",
      commonMistakes: [
        "Nói rằng không có đối thủ",
        "Chỉ liệt kê công ty nổi tiếng",
        "Không kiểm tra tên đối thủ do AI tạo ra",
      ],
    },
    {
      title: "Tóm tắt xu hướng thị trường",
      goal: "Kết nối ý tưởng với xu hướng liên quan mà không phóng đại.",
      recommendedTool: "ChatGPT + Google",
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy tóm tắt các xu hướng thị trường liên quan hỗ trợ cơ hội này. Giữ phù hợp cho đề xuất khởi nghiệp đại học và gợi ý nguồn hoặc từ khóa tôi nên tìm trên Google để kiểm chứng xu hướng.",
      expectedOutput:
        "Tóm tắt xu hướng ngắn gọn kèm từ khóa kiểm chứng và gợi ý nguồn.",
      commonMistakes: [
        "Dùng xu hướng quá chung chung",
        "Đưa ra claim về quy mô thị trường không có nguồn",
        "Quên kiểm chứng nguồn",
      ],
    },
    {
      title: "Tạo tóm tắt nghiên cứu",
      goal: "Biến nghiên cứu thành insight dùng được trong đề xuất.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy dùng phần nghiên cứu về [STARTUP IDEA] trong lĩnh vực [INDUSTRY] để tạo một tóm tắt nghiên cứu thị trường sẵn sàng đưa vào đề xuất. Bao gồm phân khúc mục tiêu, pain point chính, khoảng trống so với đối thủ, xu hướng hỗ trợ và các điều còn chưa biết.",
      expectedOutput:
        "Một tóm tắt nghiên cứu thị trường có cấu trúc, có thể đưa vào đề xuất khởi nghiệp.",
      commonMistakes: [
        "Liệt kê dữ kiện mà không có insight",
        "Bỏ qua các điều còn chưa biết",
        "Viết quá dài cho một phần trong đề xuất",
      ],
    },
  ],
} as const;

export const businessModelDesignWorkflowVi = {
  id: "business-model-design",
  title: "Quy trình thiết kế mô hình kinh doanh",
  description:
    "Thiết kế mô hình kinh doanh thực tế cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY] để sinh viên có thể giải thích rõ trong đề xuất.",
  estimatedTime: "75-105 phút",
  steps: [
    {
      title: "Xác định ai trả tiền",
      goal: "Làm rõ khách hàng, người dùng và người trả tiền của ý tưởng.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy đóng vai mentor mô hình kinh doanh khởi nghiệp. Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy xác định người dùng, người mua và người trả tiền. Giải thích họ là cùng một người hay khác nhau, và vì sao điều này quan trọng với mô hình kinh doanh.",
      expectedOutput:
        "Phân tích rõ người dùng-người mua-người trả tiền và tác động đến cách kiếm tiền.",
      commonMistakes: [
        "Mặc định người dùng luôn là người trả tiền",
        "Bỏ qua phụ huynh, trường học, công ty hoặc đối tác có thể là người trả tiền",
        "Chọn người trả tiền mà không giải thích động lực",
      ],
    },
    {
      title: "So sánh mô hình doanh thu",
      goal: "Khám phá các cách kiếm tiền thực tế cho startup.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy đề xuất 4 mô hình doanh thu có thể dùng. Bao gồm subscription, thanh toán một lần, freemium, hoa hồng, hợp tác hoặc quảng cáo nếu phù hợp. So sánh ưu điểm, nhược điểm và mức phù hợp cho đề xuất khởi nghiệp đại học.",
      expectedOutput:
        "Bảng so sánh các lựa chọn mô hình doanh thu với ưu, nhược điểm và mức độ phù hợp.",
      commonMistakes: [
        "Chọn mô hình vì nghe phổ biến",
        "Bỏ qua mức sẵn sàng trả tiền của khách hàng",
        "Trộn quá nhiều mô hình doanh thu quá sớm",
      ],
    },
    {
      title: "Chọn logic định giá",
      goal: "Tạo cách định giá đơn giản, phù hợp với khách hàng mục tiêu.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy giúp tôi thiết kế logic định giá đơn giản cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Đề xuất gói giá hoặc khoảng giá cơ bản, giải thích vì sao khách hàng sẽ trả tiền và nêu các giả định cần kiểm chứng.",
      expectedOutput:
        "Đề xuất định giá đơn giản với lý do người trả tiền và các giả định cần kiểm chứng.",
      commonMistakes: [
        "Đưa mức giá không thực tế với phân khúc mục tiêu",
        "Không liên kết giá với giá trị nhận được",
        "Bỏ qua kiểm chứng willingness to pay",
      ],
    },
    {
      title: "Ước tính chi phí chính",
      goal: "Xác định các nhóm chi phí lớn mà không cần tài chính phức tạp.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy liệt kê các nhóm chi phí chính cho MVP giai đoạn đầu. Bao gồm phát triển, vận hành, marketing, công cụ, nhân sự và chi phí đặc thù của ngành nếu có. Giữ đơn giản cho bài tập đại học.",
      expectedOutput:
        "Cấu trúc chi phí đơn giản với các nhóm chi phí giai đoạn đầu.",
      commonMistakes: [
        "Giả vờ startup không có chi phí",
        "Tạo dự phóng tài chính quá chi tiết",
        "Quên chi phí marketing hoặc hỗ trợ",
      ],
    },
    {
      title: "Viết tóm tắt mô hình kinh doanh",
      goal: "Biến mô hình thành một phần đề xuất rõ ràng.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy viết phần mô hình kinh doanh ngắn gọn cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Bao gồm người trả tiền mục tiêu, mô hình doanh thu, logic định giá, chi phí chính và vì sao mô hình có thể mở rộng. Viết phù hợp cho đề xuất khởi nghiệp đại học.",
      expectedOutput:
        "Phần mô hình kinh doanh sẵn sàng đưa vào đề xuất với doanh thu, định giá, chi phí và khả năng mở rộng.",
      commonMistakes: [
        "Viết mơ hồ kiểu chúng tôi sẽ kiếm tiền từ người dùng",
        "Quên khả năng mở rộng",
        "Dùng thuật ngữ tài chính mà không giải thích",
      ],
    },
  ],
} as const;

export const mvpPlanningWorkflowVi = {
  id: "mvp-planning",
  title: "Quy trình lập kế hoạch MVP",
  description:
    "Lập kế hoạch phiên bản nhỏ nhất nhưng hữu ích của [STARTUP IDEA] trong lĩnh vực [INDUSTRY] để đề xuất thực tế và có thể kiểm chứng.",
  estimatedTime: "75-105 phút",
  steps: [
    {
      title: "Xác định việc chính của người dùng",
      goal: "Xác định việc quan trọng nhất mà MVP phải hỗ trợ.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy đóng vai product manager. Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy xác định công việc cốt lõi mà MVP cần giải quyết cho người dùng. Giải thích mục tiêu người dùng, tình huống sử dụng và kết quả tối thiểu được xem là thành công.",
      expectedOutput:
        "Một core user job rõ ràng với tình huống, mục tiêu và kết quả thành công.",
      commonMistakes: [
        "Cố giải quyết mọi nhu cầu của người dùng",
        "Bắt đầu từ tính năng thay vì kết quả người dùng",
        "Chọn một việc quá mơ hồ để kiểm chứng",
      ],
    },
    {
      title: "Chọn tính năng MVP",
      goal: "Chỉ chọn các tính năng cần thiết để kiểm chứng giá trị cốt lõi.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy đề xuất danh sách tính năng MVP. Tách thành tính năng bắt buộc, tính năng nên có và tính năng loại khỏi giai đoạn này. Giải thích từng tính năng bắt buộc kiểm chứng giá trị cốt lõi như thế nào.",
      expectedOutput:
        "Danh sách tính năng MVP được ưu tiên với must-have, nice-to-have và excluded features.",
      commonMistakes: [
        "Thêm quá nhiều tính năng",
        "Đưa vào tính năng không kiểm chứng value proposition",
        "Nhầm MVP với sản phẩm hoàn chỉnh",
      ],
    },
    {
      title: "Vẽ luồng người dùng đơn giản",
      goal: "Tạo luồng từ lần tương tác đầu tiên đến khi nhận được giá trị.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy tạo luồng người dùng đơn giản cho MVP của [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Bao gồm điểm bắt đầu, hành động chính, kết quả nhận được và nơi thu thập phản hồi. Giữ dễ hiểu cho đề xuất đại học.",
      expectedOutput:
        "Luồng MVP từng bước từ điểm bắt đầu đến thu thập phản hồi.",
      commonMistakes: [
        "Tạo luồng có quá nhiều màn hình",
        "Quên hành động đầu tiên của người dùng",
        "Không xác định cách thu thập phản hồi",
      ],
    },
    {
      title: "Lập kế hoạch kiểm chứng MVP",
      goal: "Thiết kế một bài test nhẹ cho concept MVP.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy thiết kế một bài kiểm chứng MVP nhẹ cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Bao gồm test với ai, họ cần hoàn thành nhiệm vụ gì, cần thu thập chỉ số hoặc quan sát nào, và kết quả nào được xem là thành công.",
      expectedOutput:
        "Kế hoạch test MVP thực tế với người dùng, nhiệm vụ, chỉ số và tiêu chí thành công.",
      commonMistakes: [
        "Chỉ test với bạn bè luôn đồng ý",
        "Đo ý kiến thay vì hành vi",
        "Không định nghĩa tiêu chí thành công",
      ],
    },
    {
      title: "Viết phạm vi MVP",
      goal: "Tóm tắt kế hoạch MVP cho đề xuất.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy viết phần phạm vi MVP cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Bao gồm core user job, tính năng bắt buộc, tính năng loại trừ, luồng người dùng đơn giản và kế hoạch kiểm chứng. Viết ngắn gọn và sẵn sàng đưa vào đề xuất.",
      expectedOutput:
        "Một phần phạm vi MVP ngắn gọn, phù hợp cho đề xuất khởi nghiệp.",
      commonMistakes: [
        "Viết đặc tả kỹ thuật thay vì phạm vi MVP",
        "Bỏ qua tính năng loại trừ",
        "Không liên kết MVP với kiểm chứng",
      ],
    },
  ],
} as const;

export const pitchDeckPreparationWorkflowVi = {
  id: "pitch-deck-preparation",
  title: "Quy trình chuẩn bị pitch deck",
  description:
    "Chuẩn bị pitch deck khởi nghiệp rõ ràng cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY] bằng cấu trúc thuyết trình thực tế cho sinh viên.",
  estimatedTime: "90-120 phút",
  steps: [
    {
      title: "Xác định câu chuyện pitch",
      goal: "Tạo mạch kể chuyện đơn giản từ vấn đề đến giải pháp.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy đóng vai pitch coach. Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy tạo một câu chuyện pitch đơn giản. Bao gồm vấn đề, ai gặp vấn đề, vì sao đây là thời điểm phù hợp, giải pháp và vì sao ý tưởng này đáng để trình bày.",
      expectedOutput:
        "Một câu chuyện pitch ngắn gọn kết nối vấn đề, thời điểm, giải pháp và cơ hội.",
      commonMistakes: [
        "Bắt đầu bằng tính năng trước khi nói về vấn đề",
        "Làm câu chuyện quá kịch tính hoặc mơ hồ",
        "Không giải thích vì sao người nghe nên quan tâm",
      ],
    },
    {
      title: "Xây dựng dàn ý slide",
      goal: "Tạo cấu trúc deck hoàn chỉnh cho đề xuất khởi nghiệp.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy tạo dàn ý pitch deck cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Dùng 8-10 slide bao gồm vấn đề, khách hàng mục tiêu, lựa chọn hiện có, giải pháp, value proposition, mô hình kinh doanh, MVP, go-to-market và kết. Với mỗi slide, nêu tiêu đề và thông điệp chính.",
      expectedOutput:
        "Dàn ý pitch deck 8-10 slide với tiêu đề và thông điệp chính cho từng slide.",
      commonMistakes: [
        "Thêm quá nhiều slide",
        "Đưa nhiều ý vào cùng một slide",
        "Quên slide kết rõ ràng",
      ],
    },
    {
      title: "Viết bullet point cho slide",
      goal: "Chuyển từng slide thành nội dung trình bày ngắn gọn.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Với pitch deck của [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy viết bullet point ngắn gọn cho từng slide. Giữ mỗi slide dễ trình bày, tránh đoạn văn dài và dùng ngôn ngữ phù hợp với sinh viên đại học.",
      expectedOutput:
        "Các bullet point ngắn gọn có thể đưa vào công cụ làm deck.",
      commonMistakes: [
        "Viết nguyên đoạn văn trên slide",
        "Dùng biệt ngữ mà không giải thích",
        "Lặp lại cùng một ý ở nhiều slide",
      ],
    },
    {
      title: "Tạo định hướng hình ảnh",
      goal: "Lên kế hoạch hình ảnh đơn giản hỗ trợ bài pitch.",
      recommendedTool: "Gamma",
      promptTemplate:
        "Hãy tạo định hướng hình ảnh cho pitch deck về [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Đề xuất hình ảnh, sơ đồ, icon hoặc biểu đồ đơn giản cho từng slide. Giữ phong cách gọn, thân thiện với sinh viên và dễ dựng trong Gamma.",
      expectedOutput:
        "Kế hoạch hình ảnh theo từng slide cho Gamma hoặc công cụ thuyết trình khác.",
      commonMistakes: [
        "Dùng trang trí không giải thích ý tưởng",
        "Nhồi quá nhiều biểu đồ vào slide",
        "Chọn hình ảnh khó tạo nhanh",
      ],
    },
    {
      title: "Chuẩn bị speaker notes",
      goal: "Tạo ghi chú ngắn để thuyết trình tự tin hơn.",
      recommendedTool: "ChatGPT",
      promptTemplate:
        "Hãy viết speaker notes cho bài thuyết trình khởi nghiệp đại học về [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Giữ ghi chú từng slide ngắn, tự nhiên và tập trung vào điều người trình bày nên nói trong 30-45 giây.",
      expectedOutput:
        "Speaker notes ngắn cho từng slide theo phong cách trình bày tự nhiên của sinh viên.",
      commonMistakes: [
        "Đọc nguyên văn chữ trên slide",
        "Viết notes quá dài để luyện tập",
        "Bỏ qua chuyển ý giữa các slide",
      ],
    },
  ],
} as const;
