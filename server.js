// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// 🔐 Render 환경변수에서 GEMINI_API_KEY 읽기 (없어도 동작은 함)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 요청 로그 출력 (어떤 API가 불렸는지 보기 쉽게)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 서버 시작 시 로그로 상태 출력
if (!GEMINI_API_KEY) {
  console.log('⚠️ GEMINI_API_KEY가 설정되어 있지 않습니다. (지금은 플레이스홀더 이미지 사용)');
} else {
  console.log('✅ GEMINI_API_KEY가 설정되었습니다.');
}

// ===============================
// 헬스체크 (Render용 상태 확인)
// ===============================
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'modemode.ai API server is running 🚀',
    hasGeminiKey: !!GEMINI_API_KEY
  });
});

// ===============================
// 🧠 이미지 생성 API
// ===============================
app.post('/api/gemini-image', async (req, res) => {
  try {
    const { prompt, count } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ ok: false, msg: 'prompt가 없습니다.' });
    }

    const safeCount = Math.min(Number(count) || 4, 4);
    const images = Array.from({ length: safeCount }).map((_, i) => {
      const seed = encodeURIComponent(`${prompt}-${i}-${Date.now()}`);
      return `https://picsum.photos/seed/${seed}/800/1200`;
    });

    res.json({ ok: true, images });
  } catch (err) {
    console.error('❌ /api/gemini-image error', err);
    res.status(500).json({ ok: false, msg: '서버 오류로 이미지 생성 실패' });
  }
});

// ===============================
// 🎬 영상 생성 API
// ===============================
app.post('/api/video-from-images', async (req, res) => {
  try {
    const { images } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ ok: false, msg: 'images 배열이 없습니다.' });
    }

    // 샘플 비디오 URL (나중에 AI 영상 합성으로 교체 가능)
    const videoUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';

    res.json({ ok: true, videoUrl });
  } catch (err) {
    console.error('❌ /api/video-from-images error', err);
    res.status(500).json({ ok: false, msg: '서버 오류로 영상 생성 실패' });
  }
});

// ===============================
// 🖥 정적 파일 서빙 (index.html 포함)
// ===============================
app.use(express.static(path.join(__dirname)));

// SPA 라우팅 대응 (직접 /studio 같은 주소로 접근 시 index.html 반환)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===============================
// 🚀 서버 실행
// ===============================
app.listen(PORT, () => {
  console.log(`✅ modemode.ai API server is running on http://localhost:${PORT}`);
});