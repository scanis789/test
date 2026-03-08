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
    console.log('--- [DEBUG] 메일 발송 요청 시작 ---');

    if (!NAVER_ID || !NAVER_PW) {
        console.error('❌ 환경 변수 누락');
        return res.status(500).send('서버 환경 변수 설정 필요');
    }

    try {
        const { recipientEmail, subject, message } = req.body;

        // 아이디 형식 자동 교정
        const userEmail = NAVER_ID.includes('@') ? NAVER_ID : `${NAVER_ID}@naver.com`;
        console.log(`--- [DEBUG] 발송자: ${userEmail}, 수신자: ${recipientEmail} ---`);

        // 최적화된 트랜스포터 설정
        let transporter = nodemailer.createTransport({
            service: 'naver', // 네이버 전용 프리셋 사용
            auth: {
                user: userEmail,
                pass: NAVER_PW
            },
            debug: true,   // 통신 과정 로그 출력
            logger: true,  // 상세 로거 활성화
            tls: {
                rejectUnauthorized: false
            }
        });

        const attachments = req.files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        console.log('--- [DEBUG] 네이버 서버에 연결 시도 중... ---');

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
        console.error('❌ [DEBUG] 최종 에러 발생:', error);
        res.status(500).send('발송 실패: ' + error.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
