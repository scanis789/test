require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

app.use(cors());
app.use(express.static('.'));

const NAVER_ID = process.env.NAVER_ID; 
const NAVER_PW = process.env.NAVER_PW; 

app.post('/send-email', upload.array('photos'), async (req, res) => {
    try {
        const { recipientEmail, subject, message } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).send('사진을 선택해 주세요.');
        }

        let transporter = nodemailer.createTransport({
            host: 'smtp.naver.com',
            port: 587,
            secure: false,
            auth: {
                user: `${NAVER_ID}@naver.com`,
                pass: NAVER_PW
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const attachments = req.files.map(file => ({
            filename: file.originalname,
            content: file.buffer
        }));

        await transporter.sendMail({
            from: `${NAVER_ID}@naver.com`,
            to: recipientEmail || process.env.TARGET_EMAIL,
            subject: subject || `📸 사진 전송 알림 (${req.files.length}장)`,
            text: message || '웹사이트에서 보낸 사진들이 도착했습니다. 첨부파일을 확인하세요.',
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
