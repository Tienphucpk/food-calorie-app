const ChatModel = require('../models/ChatModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Bạn là một trợ lý dinh dưỡng AI chuyên nghiệp tên là FoodAI Assistant. 
Nhiệm vụ của bạn là:
- Tư vấn về chế độ ăn uống, dinh dưỡng và sức khỏe
- Gợi ý thực đơn lành mạnh phù hợp với mục tiêu của người dùng
- Giải thích về lượng calo, protein, carbs, chất béo trong các loại thực phẩm
- Hỗ trợ người dùng đạt mục tiêu giảm cân, tăng cơ hoặc duy trì cân nặng

Hãy trả lời bằng tiếng Việt, thân thiện và ngắn gọn (tối đa 150 từ mỗi câu trả lời).
Nếu câu hỏi không liên quan đến dinh dưỡng, hãy lịch sự từ chối và hướng về chủ đề sức khỏe.`;

const askAi = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        // Lưu tin nhắn của User vào DB
        await ChatModel.saveMessage(userId, 'user', message);

        let aiResponse;

        // Kiểm tra có Gemini API key không
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            // === REAL GEMINI API ===
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nNgười dùng hỏi: ${message}`);
                aiResponse = result.response.text();
            } catch (apiError) {
                console.error('Gemini API error:', apiError.message);
                aiResponse = fallbackResponse(message);
            }
        } else {
            // === FALLBACK (giả lập) khi chưa có API key ===
            aiResponse = fallbackResponse(message);
        }

        // Lưu phản hồi AI vào DB
        await ChatModel.saveMessage(userId, 'ai', aiResponse);

        res.json({ success: true, reply: aiResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const fallbackResponse = (message) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('giảm cân')) {
        return 'Để giảm cân hiệu quả, bạn nên tạo thâm hụt calo khoảng 300-500 kcal/ngày. Ưu tiên ăn nhiều protein (thịt gà, cá, trứng), rau xanh và hạn chế tinh bột tinh chế. Kết hợp tập thể dục 30 phút mỗi ngày sẽ cho kết quả tốt nhất!';
    } else if (lowerMsg.includes('tăng cơ')) {
        return 'Để tăng cơ, bạn cần nạp đủ protein (1.6–2.2g/kg trọng lượng cơ thể) và tập luyện kháng lực. Hãy ăn dư khoảng 200–300 kcal so với mức cần thiết. Ngủ đủ 7–9 tiếng mỗi đêm cũng rất quan trọng!';
    } else if (lowerMsg.includes('calo') || lowerMsg.includes('calories')) {
        return 'Nhu cầu calo hàng ngày phụ thuộc vào tuổi, giới tính, cân nặng và mức độ hoạt động. Trung bình: Nam cần 2000–2500 kcal, Nữ cần 1600–2000 kcal. Bạn có thể dùng chức năng Scan Food để theo dõi calo từng bữa ăn!';
    } else if (lowerMsg.includes('protein') || lowerMsg.includes('đạm')) {
        return 'Protein rất quan trọng để xây dựng và phục hồi cơ bắp. Nguồn protein tốt: ức gà, cá hồi, trứng, đậu hũ, các loại đậu. Người bình thường nên nạp 0.8–1.2g protein/kg cân nặng mỗi ngày.';
    } else if (lowerMsg.includes('nước')) {
        return 'Uống đủ nước (2–3 lít/ngày) giúp trao đổi chất tốt hơn, kiểm soát cơn đói và hỗ trợ giảm cân. Một mẹo nhỏ: uống 1 ly nước trước bữa ăn 30 phút sẽ giúp bạn ăn ít hơn!';
    }
    return 'Xin chào! Mình là FoodAI Assistant, chuyên tư vấn về dinh dưỡng và sức khỏe. Bạn có thể hỏi mình về calo, thực đơn, cách giảm cân, tăng cơ hay bất kỳ vấn đề dinh dưỡng nào!';
};

const getHistory = async (req, res) => {
    try {
        const history = await ChatModel.getHistory(req.user.id);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { askAi, getHistory };
