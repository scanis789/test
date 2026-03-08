const nodemailer = require('nodemailer');
const Busboy = require('busboy');

export const config = {
    api: {
        bodyParser: false, // multipart 처리를 위해 bodyParser 비활성화
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const busboy = Busboy({ headers: req.headers });
    const formData = {};
    const photos = [];

    await new Promise((resolve, reject) => {
        busboy.on('field', (name, val) => {
            formData[name] = val;
        });

        busboy.on('file', (name, file, info) => {
            const { filename, encoding, mimeType } = info;
            const chunks = [];
            file.on('data', (chunk) => chunks.push(chunk));
            file.on('end', () => {
                photos.push({
                    filename,
                    content: Buffer.concat(chunks),
                    contentType: mimeType
                });
            });
        });

        busboy.on('finish', resolve);
        busboy.on('error', reject);
        req.pipe(busboy);
    });

    const { recipientEmail, subject, message } = formData;
    const NAVER_ID = process.env.NAVER_ID;
    const NAVER_PW = process.env.NAVER_PW;

    if (!NAVER_ID || !NAVER_PW) {
        return res.status(500).send('Server env missing');
    }

    try {
        let transporter = nodemailer.createTransport({
            host: 'smtp.naver.com',
            port: 465,
            secure: true,
            auth: {
                user: `${NAVER_ID}@naver.com`,
                pass: NAVER_PW
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.sendMail({
            from: `${NAVER_ID}@naver.com`,
            to: recipientEmail || process.env.TARGET_EMAIL,
            subject: subject || '📸 사진 전송 알림',
            text: message || '사진이 도착했습니다.',
            attachments: photos.map(p => ({
                filename: p.filename,
                content: p.content
            }))
        });

        res.status(200).send('success');
    } catch (error) {
        console.error('Mail error:', error);
        res.status(500).send('Error: ' + error.message);
    }
}
