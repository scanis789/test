require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } 
});

app.use(cors());
app.use(express.static('.'));

const NAVER_ID = process.env.NAVER_ID; 
const NAVER_PW = process.env.NAVER_PW; 

app.post('/send-email', upload.array('photos'), async (req, res) => {
    console.log('--- [DEBUG] IP 직접 연결 시도 ---');

    if (!NAVER_ID || !NAVER_PW) {
        return res.status(500).send('환경 변수 설정 필요');
    }

    try {
        const { recipientEmail, subject, message } = req.body;
        const userEmail = NAVER_ID.includes('@') ? NAVER_ID : `${NAVER_ID}@naver.com`;

        let transporter = nodemailer.createTransport({
            host: '125.209.238.155', // smtp.naver.com의 IP 주소
            port: 465,
            secure: true,
            auth: {
                user: userEmail,
                pass: NAVER_PW
            },
            tls: {
                rejectUnauthorized: false,
                servername: 'smtp.naver.com' // SSL 인증서를 위해 호스트명 명시
            },
            connectionTimeout: 60000, // 1분으로 연장
            greetingTimeout: 60000,
            socketTimeout: 60000
        });

        const attachments = req.files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        console.log('--- [DEBUG] 네이버 IP로 전송 시도 중... ---');

        await transporter.sendMail({
            from: userEmail,
            to: recipientEmail || process.env.TARGET_EMAIL,
            subject: subject || `📸 사진 전송 알림`,
            text: message || '웹사이트에서 보낸 사진들입니다.',
            attachments: attachments
        });

        console.log('✅ [DEBUG] 메일 발송 성공!');
        res.status(200).send('success');
    } catch (error) {
        console.error('❌ [DEBUG] 최종 에러:', error);
        res.status(500).send('발송 실패 (서버 환경 제한): ' + error.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

