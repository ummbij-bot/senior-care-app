import type { Metadata, Viewport } from "next";
import "./globals.css";
import AccessibilityToolbar from "@/components/accessibility/AccessibilityToolbar";
import SkipNavigation from "@/components/accessibility/SkipNavigation";
import PWAInstall from "@/components/PWAInstall";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://senior-care.vercel.app"
  ),
  title: {
    default: "어르신 돌봄 - 효도앱 | 시니어 건강관리",
    template: "%s | 시니어 건강관리",
  },
  description: "부모님의 안전을 실시간으로 지켜드려요. 복약 알림, 긴급 신고, AI 말벗 서비스를 제공하는 시니어 전용 건강관리 앱입니다.",
  keywords: ["시니어", "건강관리", "복약", "알림", "어르신", "효도앱", "돌봄", "긴급신고", "보호자"],

  // Open Graph (카카오톡, 페이스북 등 공유용)
  openGraph: {
    title: "어르신 돌봄 - 효도앱",
    description: "부모님의 안전을 실시간으로 지켜드려요",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://senior-care.vercel.app",
    siteName: "시니어 건강관리",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "시니어 건강관리 앱 - 복약 알림, 긴급 신고, AI 말벗",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "어르신 돌봄 - 효도앱",
    description: "부모님의 안전을 실시간으로 지켜드려요",
    images: ["/og-image.png"],
  },

  // 기타 메타
  robots: {
    index: true,
    follow: true,
  },
  applicationName: "시니어케어",
  authors: [{ name: "시니어케어 팀" }],
  category: "Healthcare",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // 시니어가 충분히 확대할 수 있도록 허용 (5배까지, 접근성 준수)
  userScalable: true, // 핀치 줌 허용 (접근성 필수)
  themeColor: "#faf8f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* GA4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="시니어케어" />

        {/* 접근성: 폰트 크기 변경 시 깜빡임 방지 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('senior-care-accessibility');
                if (saved) {
                  const settings = JSON.parse(saved);
                  const fontSizeMap = { normal: 18, large: 22, xlarge: 26 };
                  document.documentElement.style.fontSize = fontSizeMap[settings.fontSize] + 'px';
                  if (settings.highContrast) {
                    document.documentElement.classList.add('high-contrast');
                  }
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {/* 스킵 네비게이션 */}
        <SkipNavigation />

        {/* 메인 콘텐츠 영역 */}
        <div id="main-content">{children}</div>

        {/* 접근성 도구 모음 (좌측 하단) */}
        <AccessibilityToolbar />

        {/* PWA 설치 안내 + SW 등록 */}
        <PWAInstall />
      </body>
    </html>
  );
}
