import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'AI Generated Story';
    const wordCount = searchParams.get('wordCount') || '0';
    const model = searchParams.get('model') || 'AI';
    const locale = searchParams.get('locale') || 'en';

    // Multilingual labels
    const labels: Record<string, { createdWith: string; words: string; tryItYourself: string }> = {
      zh: { createdWith: '由AI创作', words: '字', tryItYourself: '你也来试试' },
      en: { createdWith: 'Created with AI', words: 'words', tryItYourself: 'Try it yourself' },
      ja: { createdWith: 'AIで作成', words: '語', tryItYourself: 'あなたも試してみて' },
      ko: { createdWith: 'AI로 생성됨', words: '단어', tryItYourself: '직접 시도해보세요' },
      de: { createdWith: 'Mit AI erstellt', words: 'Wörter', tryItYourself: 'Probieren Sie es selbst aus' },
    };

    const t = labels[locale] || labels['en'];

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            padding: '60px',
          }}
        >
          {/* Main content container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '1000px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '32px',
              padding: '60px',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                borderRadius: '24px',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                border: '2px solid rgba(99, 102, 241, 0.4)',
                marginBottom: '32px',
              }}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20"
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z"
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Story title */}
            <div
              style={{
                fontSize: '54px',
                fontWeight: '900',
                color: '#f1f5f9',
                textAlign: 'center',
                marginBottom: '32px',
                lineHeight: '1.2',
                maxWidth: '900px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                marginBottom: '40px',
              }}
            >
              {/* Word count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#818cf8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#e0e7ff',
                  }}
                >
                  {wordCount} {t.words}
                </span>
              </div>

              {/* AI model */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="#a78bfa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="#a78bfa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="#a78bfa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#ddd6fe',
                  }}
                >
                  {model}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                width: '100%',
                height: '2px',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                marginBottom: '32px',
              }}
            />

            {/* CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '36px',
                fontWeight: '700',
                color: '#818cf8',
              }}
            >
              <span>{t.tryItYourself}</span>
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Footer branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '40px',
              fontSize: '28px',
              fontWeight: '600',
              color: '#94a3b8',
            }}
          >
            <span>✨</span>
            <span>AI Story Generator</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
