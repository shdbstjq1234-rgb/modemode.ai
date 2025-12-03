/**
 * ModeMode AI Server - Full Production Version
 * 기능 안정성 최우선 / 프론트 디자인 변경 없음 / 백엔드 기능만 보강
 */

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "./prompt-engine.js";

// ==============================
// 환경 설정
// ==============================
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ==============================
// 정적 파일 서빙 — 모델 이미지 실패 문제 해결
// ==============================
app.use("/models", express.static(path.join(__dirname, "../public/models")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", express.static(path.join(__dirname, "../public"))); // HTML 접근 가능

// ==============================
// DB 파일 로드
// ==============================
const USERS_DB = path.join(__dirname, "users.json");
const MODELS_DB = path.join(__dirname, "model-data.json");

function safeReadJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
        console.error(`❌ JSON 오류: ${filePath}`);
        throw err;
    }
}

let userDB = safeReadJSON(USERS_DB);
let modelDB = safeReadJSON(MODELS_DB);

// ==============================
// JWT
// ==============================
const JWT_SECRET = process.env.JWT_SECRET || "MODEMODE_SECRET_KEY";

// ==============================
// Google Imagen
// ==============================
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ==============================
// 파일 업로드
// ==============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = path.join(__dirname, "uploads");
        if (!fs.existsSync(folder)) fs.mkdirSync(folder);
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `cloth_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// ==============================
// 인증 미들웨어
// ==============================
function auth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header) return res.status(401).json({ success: false, message: "로그인 필요" });

        const token = header.split(" ")[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ success: false, message: "토큰 오류" });
    }
}

// ==============================
// 회원가입
// ==============================
app.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.json({ success: false, message: "이메일/비밀번호 필요" });

        if (userDB.users.find(u => u.email === email))
            return res.json({ success: false, message: "이미 존재하는 이메일" });

        const hashed = await bcrypt.hash(password, 12);

        userDB.users.push({
            id: uuidv4(),
            email,
            password: hashed,
            credits: 9999,
            savedImages: []
        });

        fs.writeFileSync(USERS_DB, JSON.stringify(userDB, null, 2));

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: "회원가입 오류" });
    }
});

// ==============================
// 로그인
// ==============================
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = userDB.users.find(u => u.email === email);
        if (!user) return res.json({ success: false, message: "이메일 없음" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.json({ success: false, message: "비밀번호 오류" });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "7d"
        });

        res.json({ success: true, token });
    } catch {
        res.json({ success: false, message: "로그인 오류" });
    }
});

// ==============================
// 모델 목록
// ==============================
app.get("/api/models", (req, res) => {
    res.json({ success: true, models: modelDB.models });
});

// ==============================
// 옷 업로드
// ==============================
app.post("/upload-cloth", upload.single("cloth"), (req, res) => {
    if (!req.file) return res.json({ success: false, message: "파일 없음" });

    res.json({
        success: true,
        fileName: req.file.filename,
        fileUrl: `/uploads/${req.file.filename}`
    });
});

// ==============================
// 프롬프트 생성
// ==============================
app.post("/generate-prompt", (req, res) => {
    try {
        const { modelId, shot, pose, emotion, description, clothFileName } = req.body;

        const model = modelDB.models.find(m => m.id === modelId);
        if (!model) return res.json({ success: false, message: "모델 없음" });

        const prompt = buildPrompt({
            modelName: model.name,
            shot,
            pose,
            emotion,
            description,
            clothFileName
        });

        res.json({ success: true, prompt });
    } catch {
        res.json({ success: false, message: "프롬프트 오류" });
    }
});

// ==============================
// 이미지 생성
// ==============================
app.post("/generate-image", auth, async (req, res) => {
    try {
        const { prompt } = req.body;

        const model = genAI.getGenerativeModel({ model: "imagen-3.0" });
        const result = await model.generateImages({
            prompt,
            size: "1024x1024"
        });

        const base64 = result.images[0].base64;

        res.json({ success: true, imageUrl: `data:image/png;base64,${base64}` });
    } catch (err) {
        res.json({ success: false, message: "이미지 생성 실패" });
    }
});

// ==============================
// 헬스 체크
// ==============================
app.get("/health", (req, res) => {
    res.json({ success: true, message: "OK" });
});

// ==============================
app.listen(PORT, () => {
    console.log(`🚀 ModeMode AI Server Running at http://localhost:${PORT}`);
});