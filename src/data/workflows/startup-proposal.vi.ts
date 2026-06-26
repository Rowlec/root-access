export const startupProposalWorkflowVi = {
  id: "startup-proposal",
  title: "Workflow micro-step cho proposal khởi nghiệp",
  description:
    "Chuyển [STARTUP IDEA] trong lĩnh vực [INDUSTRY] thành dàn ý proposal qua các micro-step tập trung.",
  estimatedTime: "25 phút",
  steps: [
    {
      title: "Xác định pain point",
      goal: "Viết một pain point rõ ràng của khách hàng trước khi nói về giải pháp.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để biến ý tưởng thô thành vấn đề khách hàng cụ thể thật nhanh.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích khi bạn muốn pain point được sắp xếp chặt chẽ hơn.",
          },
        ],
      },
      promptTemplate:
        "Hãy đóng vai mentor khởi nghiệp. Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy viết một pain point cụ thể của [TARGET CUSTOMER]. Giữ trong 1-2 câu. Tránh mô tả tính năng sản phẩm.",
      promptAssist: {
        whyItWorks:
          "Prompt này buộc AI gọi tên vấn đề trước giải pháp, giúp proposal có nền tảng rõ hơn.",
        aiFocus:
          "AI nên chỉ ra ai đang gặp khó khăn, khó ở đâu, và vì sao pain point này quan trọng.",
        customize:
          "Thêm một tình huống thật bạn quan sát được nếu đã có.",
        editingMistakes: [
          "Hỏi về tính năng thay vì vấn đề",
          "Viết pain point rộng đến mức ai cũng có thể là khách hàng",
        ],
      },
      promptComparison: {
        weakPrompt: "Ý tưởng startup này có tốt không?",
        explanation:
          "Prompt tối ưu yêu cầu một pain point khách hàng cụ thể, nên đầu ra dùng được cho proposal hơn một nhận xét chung chung.",
      },
      qualityChecklist: [
        "Pain point có nói về vấn đề khách hàng, không phải tính năng không?",
        "Pain point có thể giải thích trong 1-2 câu không?",
      ],
      expectedOutput: "Một pain point khách hàng cụ thể.",
      commonMistakes: [
        "Bắt đầu bằng app/giải pháp thay vì vấn đề",
        "Chọn pain point quá rộng nên khó kiểm chứng",
      ],
    },
    {
      title: "Xác định khách hàng mục tiêu",
      goal: "Chọn nhóm khách hàng đầu tiên để tập trung.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để sắp xếp các nhóm khách hàng thành một phân khúc đầu tiên rõ ràng.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích khi bạn cần brainstorm để thu hẹp một nhóm khách hàng còn mơ hồ.",
          },
        ],
      },
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy đề xuất một phân khúc khách hàng đầu tiên thật hẹp. Dùng [TARGET CUSTOMER] làm điểm bắt đầu nếu đủ cụ thể. Bao gồm họ là ai, bối cảnh của họ, và vì sao họ cảm nhận pain point rõ.",
      promptAssist: {
        whyItWorks:
          "Prompt này thu hẹp người dùng trước khi bắt đầu nghiên cứu thị trường hay mô hình kinh doanh.",
        aiFocus:
          "AI nên chọn một phân khúc có thể tiếp cận, không phải một nhóm nhân khẩu học quá rộng.",
        customize:
          "Thêm bối cảnh campus, khu vực, năm học, vai trò hoặc hành vi nếu liên quan.",
        editingMistakes: [
          "Chọn tất cả mọi người làm khách hàng",
          "Chỉ mô tả nhân khẩu học mà thiếu hành vi hoặc nỗi đau",
        ],
      },
      promptComparison: {
        weakPrompt: "Khách hàng của tôi là ai?",
        explanation:
          "Prompt tối ưu yêu cầu một phân khúc đầu tiên và lý do họ đau rõ, nên đầu ra dễ kiểm chứng hơn.",
      },
      qualityChecklist: [
        "Chỉ có một nhóm khách hàng chính không?",
        "Nhóm này có thể tiếp cận để sinh viên kiểm chứng không?",
      ],
      expectedOutput: "Một phân khúc khách hàng mục tiêu hẹp.",
      commonMistakes: [
        "Nêu quá nhiều phân khúc",
        "Chọn nhóm không thể liên hệ để phỏng vấn",
      ],
    },
    {
      title: "Liệt kê giả định rủi ro",
      goal: "Xác định điều gì phải đúng để ý tưởng có thể hoạt động.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để phát hiện nhanh các giả định ẩn sau ý tưởng.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích khi bạn muốn nhóm giả định theo rủi ro khách hàng, thị trường và sản phẩm.",
          },
        ],
      },
      promptTemplate:
        "Với [STARTUP IDEA] phục vụ [TARGET CUSTOMER] trong lĩnh vực [INDUSTRY], hãy liệt kê 3 giả định rủi ro nhất cần đúng. Mỗi giả định phải có thể kiểm chứng trong một tuần.",
      promptAssist: {
        whyItWorks:
          "Prompt này biến sự không chắc chắn thành các câu có thể kiểm chứng, tránh proposal nghe quá tự tin.",
        aiFocus:
          "AI nên tập trung vào pain point, ý định dùng thử, và khả năng trả tiền hoặc chuyển đổi.",
        customize:
          "Thêm điều bạn đang tin về khách hàng để AI phản biện.",
        editingMistakes: [
          "Liệt kê sự thật thay vì giả định",
          "Dùng giả định không thể kiểm chứng sớm",
        ],
      },
      promptComparison: {
        weakPrompt: "Ý tưởng này có rủi ro gì?",
        explanation:
          "Prompt tối ưu yêu cầu giả định có thể kiểm chứng, giúp sinh viên lên kế hoạch validation thay vì chỉ có danh sách rủi ro chung chung.",
      },
      qualityChecklist: [
        "Có đúng 3 giả định không?",
        "Mỗi giả định có thể kiểm chứng trong một tuần không?",
      ],
      expectedOutput: "Ba giả định rủi ro có thể kiểm chứng.",
      commonMistakes: [
        "Viết rủi ro mơ hồ",
        "Bỏ qua giả định về ý định dùng hoặc trả tiền",
      ],
    },
    {
      title: "Chọn hành động kiểm chứng",
      goal: "Chọn một việc tiếp theo để kiểm tra giả định rủi ro nhất.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để biến giả định thành một việc kiểm chứng nhanh.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích khi bạn muốn kế hoạch kiểm chứng có cấu trúc hơn.",
          },
        ],
      },
      promptTemplate:
        "Chọn một hành động kiểm chứng đơn giản cho [STARTUP IDEA] mà sinh viên có thể làm trong tuần này. Hành động đó cần kiểm tra giả định rủi ro nhất của [TARGET CUSTOMER]. Bao gồm hành động, nên hỏi ai, và tín hiệu nào được xem là có ý nghĩa.",
      promptAssist: {
        whyItWorks:
          "Prompt này gắn validation với một giả định cụ thể, nên bước tiếp theo thực tế hơn.",
        aiFocus:
          "AI nên đề xuất một hành động nhỏ, không phải một dự án nghiên cứu lớn.",
        customize:
          "Nhắc hạn nộp của bạn: [DEADLINE URGENCY].",
        editingMistakes: [
          "Chọn hành động mất quá nhiều thời gian",
          "Không định nghĩa tín hiệu cần quan sát",
        ],
      },
      promptComparison: {
        weakPrompt: "Tôi nên kiểm chứng thế nào?",
        explanation:
          "Prompt tối ưu yêu cầu một hành động, đối tượng hỏi và tín hiệu thành công, nên dễ thực hiện hơn.",
      },
      qualityChecklist: [
        "Có một hành động kiểm chứng cụ thể không?",
        "Tín hiệu cần quan sát có rõ không?",
      ],
      expectedOutput: "Một hành động kiểm chứng kèm người cần hỏi và tín hiệu.",
      commonMistakes: [
        "Làm khảo sát lớn trước khi nói chuyện với người dùng",
        "Xem lời khen là validation",
      ],
    },
    {
      title: "Thu hẹp phân khúc thị trường đầu tiên",
      goal: "Biến khách hàng mục tiêu thành phân khúc thị trường đầu tiên cho proposal.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để sắp xếp chi tiết phân khúc thành cấu trúc rõ ràng.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để tinh chỉnh mô tả khách hàng còn thô.",
          },
        ],
      },
      promptTemplate:
        "Xác định phân khúc thị trường đầu tiên cho [STARTUP IDEA] trong lĩnh vực [INDUSTRY]. Giữ thật hẹp. Bao gồm loại khách hàng, bối cảnh, mức độ đau, và vì sao đây là trọng tâm đầu tiên tốt nhất.",
      promptAssist: {
        whyItWorks:
          "Prompt này giữ phần thị trường tập trung vào phân khúc ban đầu thay vì nhảy ngay sang quy mô thị trường.",
        aiFocus:
          "AI nên giải thích vì sao phân khúc này tiếp cận được và liên quan.",
        customize:
          "Thêm khu vực hoặc bối cảnh trường học nếu bài yêu cầu.",
        editingMistakes: [
          "Bắt đầu bằng tổng quy mô thị trường",
          "Chọn phân khúc quá trừu tượng",
        ],
      },
      promptComparison: {
        weakPrompt: "Mô tả thị trường của tôi.",
        explanation:
          "Prompt tối ưu yêu cầu phân khúc đầu tiên, nên câu trả lời cụ thể hơn để đưa vào proposal.",
      },
      qualityChecklist: [
        "Phân khúc có đủ hẹp không?",
        "Có giải thích vì sao phân khúc này nên đi trước không?",
      ],
      expectedOutput: "Một phân khúc thị trường đầu tiên tập trung.",
      commonMistakes: [
        "Gọi thị trường là tất cả mọi người",
        "Bỏ qua lý do phân khúc có thể tiếp cận",
      ],
    },
    {
      title: "Liệt kê lựa chọn thay thế hiện tại",
      goal: "Nêu khách hàng đang dùng gì thay cho ý tưởng của bạn.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để cấu trúc lựa chọn thay thế theo hành vi và nhu cầu.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích khi bạn cần brainstorm các giải pháp thay thế.",
          },
        ],
      },
      promptTemplate:
        "Với [TARGET CUSTOMER] đang gặp pain point phía sau [STARTUP IDEA], hãy liệt kê 3 lựa chọn thay thế hoặc cách làm hiện tại họ có thể dùng. Với mỗi lựa chọn, nêu điểm đang hiệu quả và điều vẫn gây khó chịu.",
      promptAssist: {
        whyItWorks:
          "Prompt này cho thấy proposal hiểu hành vi hiện tại của khách hàng, không chỉ biết đối thủ.",
        aiFocus:
          "AI nên bao gồm cả workaround thủ công, không chỉ đối thủ trực tiếp.",
        customize:
          "Thêm đối thủ hoặc giải pháp thay thế bạn đã biết.",
        editingMistakes: [
          "Chỉ liệt kê công ty nổi tiếng",
          "Bỏ qua cách làm thủ công hoặc offline",
        ],
      },
      promptComparison: {
        weakPrompt: "Đối thủ của tôi là ai?",
        explanation:
          "Prompt tối ưu bao gồm cả giải pháp thay thế và workaround, phản ánh tốt hơn việc khách hàng đang làm gì.",
      },
      qualityChecklist: [
        "Có 3 lựa chọn thay thế hoặc substitute không?",
        "Mỗi lựa chọn có nêu điều còn gây khó chịu không?",
      ],
      expectedOutput: "Ba lựa chọn thay thế cùng điểm mạnh và khó chịu còn lại.",
      commonMistakes: [
        "Chỉ nêu đối thủ trực tiếp",
        "Không giải thích vì sao khách hàng vẫn còn đau",
      ],
    },
    {
      title: "Chọn kênh nghiên cứu",
      goal: "Chọn nơi bạn sẽ tìm bằng chứng hoặc phản hồi khách hàng.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để sắp xếp kênh nghiên cứu thành các lựa chọn thực tế.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để brainstorm nơi phỏng vấn hoặc khảo sát.",
          },
        ],
      },
      promptTemplate:
        "Đề xuất 3 kênh nghiên cứu thực tế để kiểm chứng [STARTUP IDEA] với [TARGET CUSTOMER]. Bao gồm nơi tìm người hoặc nguồn, nên hỏi/tìm gì, và cần thu thập bằng chứng nào.",
      promptAssist: {
        whyItWorks:
          "Prompt này nối validation với các kênh nghiên cứu cụ thể.",
        aiFocus:
          "AI nên đề xuất kênh mà sinh viên thật sự có thể tiếp cận.",
        customize:
          "Nhắc trường học, lớp, cộng đồng hoặc nhóm online nếu liên quan.",
        editingMistakes: [
          "Chọn kênh không thể tiếp cận",
          "Thu thập ý kiến mà thiếu bằng chứng",
        ],
      },
      promptComparison: {
        weakPrompt: "Tôi nên nghiên cứu ở đâu?",
        explanation:
          "Prompt tối ưu yêu cầu kênh, câu hỏi và bằng chứng, nên nghiên cứu trở thành hành động rõ ràng.",
      },
      qualityChecklist: [
        "Các kênh có thực tế với sinh viên không?",
        "Bằng chứng cần thu thập có rõ không?",
      ],
      expectedOutput: "Ba kênh nghiên cứu thực tế cùng mục tiêu bằng chứng.",
      commonMistakes: [
        "Chỉ dựa vào facts do AI tạo",
        "Bỏ qua phản hồi trực tiếp từ khách hàng",
      ],
    },
    {
      title: "Liệt kê facts cần kiểm chứng",
      goal: "Tạo checklist ngắn cho các claim về thị trường hoặc đối thủ.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để biến việc kiểm chứng thành checklist rõ ràng.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để biến ghi chú thị trường thô thành các claim rõ.",
          },
        ],
      },
      promptTemplate:
        "Với [STARTUP IDEA] trong lĩnh vực [INDUSTRY], hãy liệt kê 3 facts về thị trường hoặc đối thủ tôi nên kiểm chứng trước khi dùng trong proposal. Với mỗi fact, nêu vì sao nó quan trọng và loại nguồn nào có thể chấp nhận.",
      promptAssist: {
        whyItWorks:
          "Prompt này ngăn claim chưa kiểm chứng đi thẳng vào proposal.",
        aiFocus:
          "AI nên tách claim, nguồn và nhu cầu kiểm chứng.",
        customize:
          "Thêm fact giảng viên yêu cầu nếu có, như quy mô thị trường hoặc số đối thủ.",
        editingMistakes: [
          "Tin claim của AI mà không kiểm tra",
          "Dùng fact không hỗ trợ lập luận của proposal",
        ],
      },
      promptComparison: {
        weakPrompt: "Cho tôi facts thị trường.",
        explanation:
          "Prompt tối ưu yêu cầu facts cần kiểm chứng và loại nguồn, giúp sinh viên kiểm soát chất lượng bằng chứng.",
      },
      qualityChecklist: [
        "Có 3 facts cần kiểm chứng không?",
        "Mỗi fact có kỳ vọng về nguồn không?",
      ],
      expectedOutput: "Ba facts cần kiểm chứng cùng kỳ vọng nguồn.",
      commonMistakes: [
        "Dùng số liệu không có nguồn",
        "Trộn ý kiến về đối thủ với bằng chứng đã xác minh",
      ],
    },
    {
      title: "Chọn mô hình doanh thu",
      goal: "Chọn một cách đơn giản để startup có thể tạo doanh thu.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để nối giá trị khách hàng với logic doanh thu nhanh.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích để so sánh các lựa chọn mô hình theo cấu trúc.",
          },
        ],
      },
      promptTemplate:
        "Đề xuất một mô hình doanh thu thực tế cho [STARTUP IDEA] phục vụ [TARGET CUSTOMER]. Giải thích ai trả tiền, họ trả cho giá trị gì, và vì sao mô hình này phù hợp với proposal startup sinh viên.",
      promptAssist: {
        whyItWorks:
          "Prompt này giữ mô hình kinh doanh tập trung thay vì đưa quá nhiều lựa chọn.",
        aiFocus:
          "AI nên nối người trả tiền, giá trị nhận được và pain point của khách hàng.",
        customize:
          "Nêu đây là B2C, B2B, trong trường học hay cộng đồng nếu đã biết.",
        editingMistakes: [
          "Yêu cầu quá nhiều mô hình doanh thu",
          "Chọn người trả tiền không nhận đủ giá trị",
        ],
      },
      promptComparison: {
        weakPrompt: "Cho tôi mô hình kinh doanh.",
        explanation:
          "Prompt tối ưu yêu cầu một mô hình và logic người trả tiền, nên câu trả lời dễ bảo vệ hơn.",
      },
      qualityChecklist: [
        "Có một mô hình doanh thu không?",
        "Người trả tiền có được nêu rõ không?",
      ],
      expectedOutput: "Một mô hình doanh thu kèm logic người trả tiền.",
      commonMistakes: [
        "Chọn quảng cáo mà không giải thích quy mô",
        "Nhầm người dùng với người trả tiền",
      ],
    },
    {
      title: "Đặt logic giá",
      goal: "Viết một giả định giá đơn giản cho proposal.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để biến ý tưởng giá thành giả định rõ ràng.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để brainstorm mức giá khởi điểm nhanh.",
          },
        ],
      },
      promptTemplate:
        "Tạo một giả định giá đơn giản cho [STARTUP IDEA]. Bao gồm đơn vị tính giá, khoảng giá thô, vì sao [TARGET CUSTOMER] có thể chấp nhận, và điều cần kiểm chứng sau.",
      promptAssist: {
        whyItWorks:
          "Prompt này xem giá là giả định cần kiểm chứng, không phải con số cuối cùng.",
        aiFocus:
          "AI nên giải thích đơn vị giá và điều cần validation.",
        customize:
          "Thêm giới hạn ngân sách hoặc giá đối thủ nếu bạn đã biết.",
        editingMistakes: [
          "Chọn giá ngẫu nhiên không có logic",
          "Trình bày giá như kết luận cuối cùng trước khi kiểm chứng",
        ],
      },
      promptComparison: {
        weakPrompt: "Tôi nên tính giá bao nhiêu?",
        explanation:
          "Prompt tối ưu yêu cầu giả định giá và điều cần kiểm chứng, phù hợp với proposal hơn.",
      },
      qualityChecklist: [
        "Đơn vị tính giá có rõ không?",
        "Giá có được viết như giả định cần test không?",
      ],
      expectedOutput: "Một giả định giá đơn giản.",
      commonMistakes: [
        "Làm pricing quá phức tạp",
        "Bỏ qua willingness to pay của khách hàng",
      ],
    },
    {
      title: "So sánh điểm khác biệt",
      goal: "Nêu ý tưởng khác gì so với lựa chọn hiện có.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp cho so sánh có cấu trúc, dễ đọc.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để biến ghi chú đối thủ rời rạc thành cách diễn đạt đơn giản.",
          },
        ],
      },
      promptTemplate:
        "So sánh [STARTUP IDEA] với 2 đối thủ hoặc giải pháp thay thế có khả năng tồn tại. Giữ ngắn gọn. Với mỗi lựa chọn, nêu lựa chọn hiện tại, điểm yếu, và điểm khác biệt rõ nhất của ý tưởng của tôi. Đánh dấu claim cần kiểm chứng.",
      promptAssist: {
        whyItWorks:
          "Prompt này gắn khác biệt cạnh tranh với giá trị người dùng và kiểm chứng.",
        aiFocus:
          "AI nên so sánh theo pain và giá trị người dùng, không dùng lời quảng cáo.",
        customize:
          "Thêm đối thủ đã biết nếu giảng viên yêu cầu.",
        editingMistakes: [
          "Nói ý tưởng độc đáo mà không so sánh",
          "Dùng claim về đối thủ mà không kiểm tra",
        ],
      },
      promptComparison: {
        weakPrompt: "Vì sao ý tưởng của tôi độc đáo?",
        explanation:
          "Prompt tối ưu yêu cầu so sánh với lựa chọn thay thế, nên điểm khác biệt đáng tin hơn.",
      },
      qualityChecklist: [
        "Có so sánh 2 đối thủ hoặc substitute không?",
        "Điểm khác biệt có gắn với giá trị khách hàng không?",
      ],
      expectedOutput: "Một so sánh ngắn về điểm khác biệt cạnh tranh.",
      commonMistakes: [
        "Nói không có đối thủ",
        "So sánh tính năng mà thiếu giá trị người dùng",
      ],
    },
    {
      title: "Xác định phạm vi MVP",
      goal: "Chọn phiên bản nhỏ nhất có thể kiểm chứng của ý tưởng.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để cắt một ý tưởng rộng thành phiên bản đầu tiên có thể test.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích để chia MVP thành must-have và tính năng để sau.",
          },
        ],
      },
      promptTemplate:
        "Xác định phạm vi MVP đơn giản cho [STARTUP IDEA]. Bao gồm 3 chức năng must-have, 2 thứ loại khỏi phạm vi hiện tại, và hành động đầu tiên người dùng cần làm được với MVP.",
      promptAssist: {
        whyItWorks:
          "Prompt này giúp proposal không phình quá lớn so với dự án sinh viên.",
        aiFocus:
          "AI chỉ nên chọn những gì cần để kiểm chứng giá trị chính.",
        customize:
          "Thêm giới hạn kỹ thuật hoặc thời gian trước khi chạy prompt.",
        editingMistakes: [
          "Thêm mọi tính năng có thể nghĩ ra",
          "Không nêu thứ cần loại khỏi phạm vi",
        ],
      },
      promptComparison: {
        weakPrompt: "App của tôi nên có tính năng gì?",
        explanation:
          "Prompt tối ưu giới hạn MVP vào must-have và exclusions, nên kế hoạch dễ thực hiện hơn.",
      },
      qualityChecklist: [
        "Có đúng 3 chức năng must-have không?",
        "Các exclusion có rõ không?",
      ],
      expectedOutput: "Một phạm vi MVP nhỏ với must-have và exclusion.",
      commonMistakes: [
        "Lên kế hoạch cho cả platform quá sớm",
        "Nhầm MVP với sản phẩm cuối cùng",
      ],
    },
    {
      title: "Phác dàn ý proposal",
      goal: "Ghép ghi chú thành dàn ý proposal, không phải bài essay cuối.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để ghép nhanh các ghi chú trước đó thành dàn ý sạch.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích để tổ chức dàn ý theo các phần bắt buộc.",
          },
        ],
      },
      promptTemplate:
        "Dựa trên [STARTUP IDEA] trong lĩnh vực [INDUSTRY] cho [TARGET CUSTOMER], hãy tạo dàn ý startup proposal ngắn gọn. Bao gồm vấn đề, khách hàng mục tiêu, bằng chứng validation cần thu thập, value proposition, mô hình kinh doanh, khác biệt cạnh tranh, phạm vi MVP và bước kiểm chứng tiếp theo. Chỉ dùng bullet. Không viết thành bài essay cuối.",
      promptAssist: {
        whyItWorks:
          "Prompt này tạo tư liệu làm việc mà vẫn giữ liêm chính học thuật.",
        aiFocus:
          "AI nên tổ chức các phần và đánh dấu bằng chứng còn thiếu.",
        customize:
          "Thêm heading hoặc rubric của giảng viên nếu có.",
        editingMistakes: [
          "Biến prompt thành yêu cầu viết essay hoàn chỉnh",
          "Xóa ghi chú kiểm chứng",
        ],
      },
      promptComparison: {
        weakPrompt: "Viết proposal khởi nghiệp cho tôi.",
        explanation:
          "Prompt tối ưu yêu cầu dàn ý dạng bullet, nên sinh viên vẫn phải xem lại, kiểm chứng và viết lại.",
      },
      qualityChecklist: [
        "Đầu ra là dàn ý, không phải essay không?",
        "Các facts còn thiếu có được đánh dấu để kiểm chứng không?",
      ],
      expectedOutput: "Một dàn ý proposal ngắn gọn.",
      commonMistakes: [
        "Nộp nguyên dàn ý AI như bài cuối",
        "Làm dàn ý quá dài nên khó chỉnh",
      ],
    },
    {
      title: "Lập kế hoạch kiểm chứng và chỉnh sửa",
      goal: "Quyết định phần nào cần kiểm tra hoặc viết lại trước khi nộp.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để biến dàn ý thành checklist review.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để phát hiện phần còn yếu hoặc mơ hồ trong proposal.",
          },
        ],
      },
      promptTemplate:
        "Review dàn ý startup proposal này cho [STARTUP IDEA]. Tạo checklist chỉnh sửa ngắn: 3 claim cần kiểm chứng, 2 phần cần viết lại bằng giọng của tôi, và 1 hành động tiếp theo trước khi nộp. Giữ ngắn gọn.",
      promptAssist: {
        whyItWorks:
          "Prompt này biến bước cuối thành review và kiểm chứng, không phải copy đầu ra AI.",
        aiFocus:
          "AI nên tìm bằng chứng yếu, phần chưa rõ và hành động tiếp theo.",
        customize:
          "Dán dàn ý của bạn trước khi chạy prompt này.",
        editingMistakes: [
          "Bỏ qua kiểm chứng trước khi nộp",
          "Chỉ hỏi sửa ngữ pháp",
        ],
      },
      promptComparison: {
        weakPrompt: "Làm proposal của tôi tốt hơn.",
        explanation:
          "Prompt tối ưu yêu cầu kiểm chứng, viết lại và hành động tiếp theo, nên việc chỉnh sửa cụ thể hơn.",
      },
      qualityChecklist: [
        "Các claim cần kiểm chứng có được liệt kê không?",
        "Nhiệm vụ viết lại có rõ không?",
      ],
      expectedOutput: "Một checklist ngắn để kiểm chứng và chỉnh sửa.",
      commonMistakes: [
        "Chỉ trau chuốt câu chữ",
        "Để lại phần nghe giống AI mà không viết lại",
      ],
    },
    {
      title: "Ước lượng willingness to pay",
      goal: "Nêu điều gì khiến khách hàng sẵn sàng trả tiền hoặc từ chối trả tiền.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để sắp xếp động lực trả tiền, lý do từ chối và câu hỏi kiểm chứng.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để brainstorm phản đối của khách hàng trước khi sắp xếp lại.",
          },
        ],
      },
      promptTemplate:
        "Với [STARTUP IDEA] phục vụ [TARGET CUSTOMER], hãy ước lượng các lý do mạnh nhất khiến khách hàng có thể trả tiền và các lý do mạnh nhất khiến họ từ chối. Thêm một câu hỏi đơn giản tôi có thể hỏi trong tuần này để kiểm chứng willingness to pay.",
      promptAssist: {
        whyItWorks:
          "Prompt này xem việc trả tiền là giả định cần kiểm chứng, không phải phỏng đoán.",
        aiFocus:
          "AI nên tách giá trị khách hàng nhận được, giới hạn ngân sách và phản đối khi trả tiền.",
        customize:
          "Thêm ngân sách, mức chi tiêu hiện tại hoặc giá của giải pháp thay thế nếu bạn biết.",
        editingMistakes: [
          "Giả định người dùng sẽ trả tiền vì họ thích ý tưởng",
          "Bỏ qua ai là người kiểm soát ngân sách",
        ],
      },
      promptComparison: {
        weakPrompt: "Mọi người có trả tiền cho ý tưởng này không?",
        explanation:
          "Prompt tối ưu yêu cầu động lực, phản đối và một câu hỏi kiểm chứng, nên giả định doanh thu dễ kiểm tra hơn.",
      },
      qualityChecklist: [
        "Có cả động lực trả tiền và lý do từ chối không?",
        "Có một câu hỏi để kiểm chứng willingness to pay không?",
      ],
      expectedOutput:
        "Động lực trả tiền, phản đối khi trả tiền và một câu hỏi kiểm chứng.",
      commonMistakes: [
        "Xem phản hồi tích cực là willingness to pay",
        "Bỏ qua trường hợp người dùng và người trả tiền là hai nhóm khác nhau",
      ],
    },
    {
      title: "Xác định core value",
      goal: "Nêu một giá trị cốt lõi mà MVP phải chứng minh trước tiên.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để cắt một ý tưởng sản phẩm rộng thành một lời hứa giá trị rõ ràng.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích khi bạn muốn lời hứa giá trị được viết theo cấu trúc chặt hơn.",
          },
        ],
      },
      promptTemplate:
        "Với [STARTUP IDEA] phục vụ [TARGET CUSTOMER], hãy xác định một core value duy nhất mà MVP phải chứng minh. Giữ trong một câu, rồi giải thích hành động đầu tiên của người dùng cho thấy giá trị này là thật.",
      promptAssist: {
        whyItWorks:
          "Prompt này buộc MVP chứng minh một giá trị trước khi thêm tính năng.",
        aiFocus:
          "AI nên nối lời hứa giá trị với một hành động cụ thể của người dùng.",
        customize:
          "Thêm pain point chính của khách hàng nếu bạn đã xác định được.",
        editingMistakes: [
          "Mô tả sản phẩm thay vì giá trị",
          "Chọn nhiều hơn một lời hứa cốt lõi",
        ],
      },
      promptComparison: {
        weakPrompt: "MVP của tôi nên làm gì?",
        explanation:
          "Prompt tối ưu bắt đầu từ core value, nên quyết định tính năng vẫn gắn với mục tiêu có thể kiểm chứng.",
      },
      qualityChecklist: [
        "Core value có được viết trong một câu không?",
        "Có hành động người dùng để chứng minh giá trị không?",
      ],
      expectedOutput: "Một câu core value và một hành động chứng minh.",
      commonMistakes: [
        "Liệt kê quá nhiều lợi ích cùng lúc",
        "Bắt MVP chứng minh một điều quá rộng",
      ],
    },
    {
      title: "Ưu tiên tính năng MVP",
      goal: "Chỉ chọn các tính năng cần cho lần kiểm chứng đầu tiên.",
      timebox: "Dưới 2 phút",
      recommendedTool: "Gemini",
      toolRecommendation: {
        recommendedTool: "Gemini",
        whyItFits:
          "Phù hợp để sắp xếp mức ưu tiên tính năng thành nhóm must-have và để sau.",
        alternativeTools: [
          {
            tool: "ChatGPT",
            reason:
              "Hữu ích để brainstorm nhanh các tính năng trước khi ưu tiên.",
          },
        ],
      },
      promptTemplate:
        "Hãy ưu tiên tính năng MVP cho [STARTUP IDEA] phục vụ [TARGET CUSTOMER]. Liệt kê 3 tính năng must-have cho lần kiểm chứng đầu tiên, 2 tính năng để sau, và lý do mỗi must-have hỗ trợ core value.",
      promptAssist: {
        whyItWorks:
          "Prompt này tách phạm vi launch khỏi ý tưởng để sau, giúp MVP không bị quá tải.",
        aiFocus:
          "AI nên giải thích từng must-have bằng core value, không phải bằng việc nghe có vẻ ấn tượng.",
        customize:
          "Nêu hạn nộp, giới hạn kỹ thuật hoặc ràng buộc no-code nếu có.",
        editingMistakes: [
          "Gọi mọi tính năng là must-have",
          "Ưu tiên tính năng ấn tượng hơn giá trị có thể kiểm chứng",
        ],
      },
      promptComparison: {
        weakPrompt: "Liệt kê tính năng MVP.",
        explanation:
          "Prompt tối ưu yêu cầu nhóm ưu tiên và lý do, nên phạm vi MVP dễ bảo vệ hơn.",
      },
      qualityChecklist: [
        "Có đúng 3 tính năng must-have không?",
        "Mỗi must-have có hỗ trợ core value không?",
      ],
      expectedOutput: "Ba tính năng must-have, hai tính năng để sau và lý do.",
      commonMistakes: [
        "Xây sản phẩm đầy đủ thay vì một bài test",
        "Để tính năng sau này nằm trong phạm vi launch",
      ],
    },
    {
      title: "Chọn phần loại khỏi MVP",
      goal: "Quyết định điều gì không xây trong phiên bản đầu tiên.",
      timebox: "Dưới 2 phút",
      recommendedTool: "ChatGPT",
      toolRecommendation: {
        recommendedTool: "ChatGPT",
        whyItFits:
          "Phù hợp để đưa ra trade-off thực tế khi MVP bắt đầu quá lớn.",
        alternativeTools: [
          {
            tool: "Gemini",
            reason:
              "Hữu ích khi bạn muốn nhóm exclusion theo effort, rủi ro và giá trị người dùng.",
          },
        ],
      },
      promptTemplate:
        "Với [STARTUP IDEA], hãy liệt kê 3 tính năng hoặc hoạt động nên loại khỏi MVP hiện tại. Với mỗi exclusion, giải thích vì sao có thể để sau và bằng chứng đơn giản nào sẽ cho thấy nên thêm lại sau này.",
      promptAssist: {
        whyItWorks:
          "Prompt này làm scope control rõ ràng thay vì để MVP âm thầm phình ra.",
        aiFocus:
          "AI nên giải thích trade-off và bằng chứng cần có trước khi tăng phạm vi.",
        customize:
          "Thêm những thứ team bạn đang muốn xây dù có thể quá sức.",
        editingMistakes: [
          "Không loại điều gì khỏi MVP",
          "Loại tính năng mà không nói khi nào có thể đưa lại",
        ],
      },
      promptComparison: {
        weakPrompt: "Tôi nên bỏ gì?",
        explanation:
          "Prompt tối ưu yêu cầu exclusion, lý do và bằng chứng tương lai, nên quyết định phạm vi rõ hơn.",
      },
      qualityChecklist: [
        "Có 3 exclusion rõ ràng không?",
        "Mỗi exclusion có lý do và bằng chứng tương lai không?",
      ],
      expectedOutput: "Ba exclusion của MVP kèm lý do và bằng chứng tương lai.",
      commonMistakes: [
        "Giữ tính năng nice-to-have trong MVP",
        "Xem exclusion là quyết định vĩnh viễn",
      ],
    },
  ],
} as const;
