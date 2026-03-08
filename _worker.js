export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // --- 1. 메일 발송 로직 (POST /send-email) ---
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

                // Resend API를 통해 메일 발송
                // 첨부파일을 Base64로 변환
                const attachments = await Promise.all(photos.map(async (file) => {
                    const buffer = await file.arrayBuffer();
                    const base64Content = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                    return {
                        filename: file.name,
                        content: base64Content
                    };
                }));

                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'onboarding@resend.dev', // Resend 기본 발송 주소 (도메인 연결 전까지)
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

        // --- 2. 기본적으로 index.html을 서빙하도록 설정 (Cloudflare Pages 방식 연동용) ---
        return fetch(request);
    }
};
