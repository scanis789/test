export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 1. 메일 발송 로직 (POST /send-email)
        if (request.method === 'POST' && url.pathname === '/send-email') {
            try {
                const formData = await request.formData();
                const recipientEmail = formData.get('recipientEmail');
                const subject = formData.get('subject') || '📸 사진 전송 알림';
                const message = formData.get('message') || '웹사이트에서 사진을 보냈습니다.';
                const photos = formData.getAll('photos');

                if (photos.length === 0) {
                    return new Response('사진을 선택해 주세요.', { status: 400 });
                }

                // 효율적인 Base64 변환 (메모리 절약형)
                const attachments = await Promise.all(photos.map(async (file) => {
                    const buffer = await file.arrayBuffer();
                    const binary = String.fromCharCode(...new Uint8Array(buffer));
                    return {
                        filename: file.name,
                        content: btoa(binary)
                    };
                }));

                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'onboarding@resend.dev',
                        to: recipientEmail,
                        subject: subject,
                        text: message,
                        attachments: attachments
                    })
                });

                if (resendResponse.ok) {
                    return new Response('success', { status: 200 });
                } else {
                    const errorMsg = await resendResponse.text();
                    return new Response(`Resend Error: ${errorMsg}`, { status: 500 });
                }
            } catch (error) {
                return new Response(`Worker Error: ${error.message}`, { status: 500 });
            }
        }

        // 2. 중요: 정적 파일(index.html 등)은 클라우드플레어 에셋 엔진에서 가져옴
        // 이 부분이 무한 루프를 방지하는 핵심입니다.
        return env.ASSETS.fetch(request);
    }
};
