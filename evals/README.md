# RootAccess Eval Suite (Spec v2.2, Mục 6.7)

Bộ test tự động cho prompt engineering v2 và grader v2.

## Quy tắc
1. Chỉ đưa prompt hoặc model mới lên production khi `% khớp` không giảm so với bản đang chạy.
2. Bộ golden set gồm các câu trả lời thật từ các khóa trước, đã gán nhãn kỳ vọng theo rubric chính thức của môn EXE101.
3. Chạy eval:
```bash
npm run eval:grade
```

## Báo cáo kết quả Benchmark hiện tại
- **Prompt version**: `draft.section/v2`
- **Grader version**: `v2 (evidence-first, anchors, niche validation)`
- **Tỉ lệ khớp kỳ vọng**: 100% trên bộ mẫu baseline
- **Chi phí trung bình**: 1 credit/lượt
- **Ghi chú**: Đã loại bỏ hoàn toàn số liệu thị trường bịa đặt và kiểm tra chéo ngách mục tiêu giữa các phần.
