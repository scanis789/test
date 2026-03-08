export default {
    async fetch(request, env) {
        const url = new URL(request.url);

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

                // 1. 아까 알려주신 API 키 직접 사용 (가장 확실한 방법)
                const API_KEY = env.RESEND_API_KEY || 're_BvGWekF6_NF8DSLW5uPpenG5fQgM24WAE';

                // 2. 대용량 파일을 위한 안전한 Base64 변환 함수
                const arrayBufferToBase64 = (buffer) => {
                    let binary = '';
                    const bytes = new Uint8Array(buffer);
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary);
                };

                const attachments = await Promise.all(photos.map(async (file) => {
                    const buffer = await file.arrayBuffer();
                    return {
                        filename: file.name,
                        content: arrayBufferToBase64(buffer)
                    };
                }));

                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'WifeApp <onboarding@resend.dev>',
                        to: recipientEmail,
                        subject: subject,
                        text: message,
                        attachments: attachments
                    })
                });

                const responseData = await resendResponse.json();

                if (resendResponse.ok) {
                    return new Response('success', { status: 200 });
                } else {
                    return new Response(`Resend Error: ${JSON.stringify(responseData)}`, { status: 500 });
                }
            } catch (error) {
                return new Response(`Worker Error: ${error.message}`, { status: 500 });
            }
        }

        return env.ASSETS.fetch(request);
    }
};
