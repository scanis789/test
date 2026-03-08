const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

app.use(cors());
app.use(express.static('.'));

// --- ⚠️ 사용자 설정 (이 부분을 꼭 수정해야 합니다!) ---
const NAVER_ID = 'your_id'; // 네이버 아이디 (@naver.com 제외)
const NAVER_PW = 'app_password'; // 네이버 2단계 인증 시 생성한 '애플리케이션 비밀번호'
const TARGET_EMAIL = 'receiver@example.com'; // 사진을 받을 이메일 주소
// ---------------------------------------------------

app.post('/send-email', upload.array('photos'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('사진을 선택해 주세요.');
        }

        let transporter = nodemailer.createTransport({
            service: 'naver',
            host: 'smtp.naver.com',
            port: 465,
            secure: true,
            auth: {
                user: `${NAVER_ID}@naver.com`,
                pass: NAVER_PW
            }
        });

        const attachments = req.files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        await transporter.sendMail({
            from: `${NAVER_ID}@naver.com`,
            to: TARGET_EMAIL,
            subject: `📸 사진 전송 알림 (${req.files.length}장)`,
            text: '웹사이트에서 보낸 사진들이 도착했습니다. 첨부파일을 확인하세요.',
            attachments: attachments
        });

        res.status(200).send('success');
    } catch (error) {
        console.error('Mail Error:', error);
        res.status(500).send('발송 실패: ' + error.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
