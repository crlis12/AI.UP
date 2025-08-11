require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Gemini API 엔드포인트
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// 대화 내용 요약 라우트
router.post('/', async (req, res) => {
  const { messages } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({
      success: false,
      message: '요약할 대화 내용이 없습니다.'
    });
  }

  try {
    // 프론트에서 받은 Langchain 메시지 객체를 Gemini API 형식으로 변환
    const contents = messages.map(msg => {
      // id 배열의 마지막 요소를 통해 역할을 정확히 구분
      const role = msg.id && msg.id[msg.id.length - 1] === 'HumanMessage' ? 'user' : 'model';
      return {
        role: role,
        parts: [{ text: msg.kwargs.content }],
      };
    });

    // 마지막에 요약을 위한 프롬프트 추가
    contents.push({
      role: 'user',
      parts: [{ text: '이 대화 내용을 한국어 한 문장으로 간결하게 요약해줘.' }]
    });

    // Gemini API 호출
    const response = await axios.post(GEMINI_API_ENDPOINT, { contents });

    // API 응답에서 요약 텍스트 추출
    const summary = response.data.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      summary: summary,
    });

  } catch (error) {
    console.error('Gemini API 호출 오류:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: '대화 요약 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
