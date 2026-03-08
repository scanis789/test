require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

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
    console.log('--- 메일 발송 요청 받음 ---');

    // 환경 변수 체크 로그 (보안을 위해 값은 출력하지 않음)
    if (!NAVER_ID || !NAVER_PW) {
        console.error('에러: NAVER_ID 또는 NAVER_PW 환경 변수가 설정되지 않았습니다.');
        return res.status(500).send('서버 설정 오류 (환경 변수 누락)');
    }

    try {
        const { recipientEmail, subject, message } = req.body;
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('사진을 선택해 주세요.');
        }

        console.log(`대상: ${recipientEmail}, 사진 수: ${req.files.length}`);

        // 포트 465 (SSL) 방식 사용
        let transporter = nodemailer.createTransport({
            host: 'smtp.naver.com',
            port: 465,
            secure: true, // SSL 사용
            auth: {
                user: `${NAVER_ID}@naver.com`,
                pass: NAVER_PW
            },
            tls: {
                rejectUnauthorized: false // 인증서 검증 완화 (연결 안정성)
            },
            timeout: 20000 // 20초 타임아웃
        });

        const attachments = req.files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        console.log('네이버 서버(465)로 메일 전송 시도 중...');

        await transporter.sendMail({
            from: `${NAVER_ID}@naver.com`, // 보내는 사람 주소가 아이디와 정확히 일치해야 함
            to: recipientEmail || process.env.TARGET_EMAIL,
            subject: subject || `📸 사진 전송 알림`,
            text: message || '웹사이트에서 보낸 사진들이 도착했습니다.',
            attachments: attachments
        });

        console.log('✅ 전송 성공!');
        res.status(200).send('success');
    } catch (error) {
        console.error('❌ 메일 전송 실패 상세:', error);
        res.status(500).send('발송 실패: ' + error.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

