// server.js  (modemode.ai API + 정적 HTML 서버)

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// 1. 정적 파일 (index.html) 서빙
// ======================
// 현재 폴더(__dirname)에 있는 파일들을 그대로 서비스
app.use(express.static(path.join(__dirname)));

// 기본 페이지: / -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ======================
// 2. 아주 간단한 "가짜" 유저 DB (메모리 저장)
// ======================
const users = []; // 서버 껐다 켜면 초기화되는 임시 저장소

// ======================
// 3. 회원가입 API
//     POST /api/auth/signup
// ======================
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, marketing_email, marketing_sms, xfer_agree } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, msg: '이름/이메일/비밀번호가 필요합니다.' });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ ok: false, msg: '이미 가입된 이메일입니다.' });
  }

  users.push({
    name,
    email,
    password,           // 실제 서비스면 암호화해야 하지만, 지금은 데모라 그냥 저장
    marketing_email: !!marketing_email,
    marketing_sms: !!marketing_sms,
    xfer_agree: !!xfer_agree,
  });

  console.log('[SIGNUP]', email);
  return res.json({ ok: true, email, name });
});

// ======================
// 4. 로그인 API
//     POST /api/auth/login
// ======================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, msg: '이메일/비밀번호를 모두 입력해 주세요.' });
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ ok: false, msg: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  console.log('[LOGIN]', email);
  // 데모 토큰
  const fakeToken = 'demo-token-' + Date.now();

  return res.json({
    ok: true,
    email: user.email,
    name: user.name,
    token: fakeToken,
  });
});

// ======================
// 5. AI 이미지 생성 API (데모)
//     POST /api/gemini-image
// ======================
// 프론트에서는 prompt, count 를 보내지만
// 지금은 진짜 AI 안 붙이고, 예쁜 샘플 이미지 URL을 돌려줌
app.post('/api/gemini-image', (req, res) => {
  const { prompt, count } = req.body || {};
  console.log('[IMAGE]', { prompt, count });

  // 샘플 용 이미지 (Unsplash)
  const sampleImages = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1080',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1080',
    'https://images.unsplash.com/photo-1520975918319-894d3c1a8d5e?w=1080',
    'https://images.unsplash.com/photo-1544717305-996b815c338c?w=1080',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1080',
  ];

  const n = Number(count) || 4;
  const images = sampleImages.slice(0, n);

  return res.json({
    ok: true,
    images,
  });
});

// ======================
// 6. 이미지 -> 영상 API (데모)
//     POST /api/video-from-images
// ======================
// 아직 진짜 영상 생성은 안 붙였고,
// 프론트에서는 이 API를 호출하면 "실패" 토스트를 띄우도록 만들어 둔 상태야.
app.post('/api/video-from-images', (req, res) => {
  console.log('[VIDEO]', req.body);
  return res.status(501).json({
    ok: false,
    msg: '영상 생성 기능은 아직 준비 중입니다. (백엔드 미구현)',
  });
});

// ======================
// 7. 서버 시작
// ======================
app.listen(PORT, () => {
  console.log(`✅ modemode.ai API server is running on http://localhost:${PORT}`);
});