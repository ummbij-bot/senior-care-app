import type { Metadata, Viewport } from "next";
import "./globals.css";
import AccessibilityToolbar from "@/components/accessibility/AccessibilityToolbar";
import SkipNavigation from "@/components/accessibility/SkipNavigation";
import PWAInstall from "@/components/PWAInstall";

export const metadata: Metadata = {
  title: "시니어 건강관리",
  description: "시니어를 위한 건강관리 앱 - 복약 알림, 긴급 신고, 건강 관리",
  keywords: ["시니어", "건강관리", "복약", "알림", "어르신"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 3, // 시니어가 확대할 수 있도록 허용 (3배까지)
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
