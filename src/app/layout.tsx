import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "달빛 어항",
  description:
    "하루의 끝에, 어두운 방에서 물고기 한 마리와 나누는 조용한 대화. 마음이 쉬어가는 어항.",
  applicationName: "달빛 어항",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "달빛 어항" },
};

export const viewport: Viewport = {
  themeColor: "#03060c",
  width: "device-width",
  initialScale: 1,
  // 확대를 막지 않는다 — 시력이 약한 사용자에게 필요하다.
  // iOS 의 입력창 자동 확대는 글자 크기를 16px 이상으로 두어 막는다.
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  // 키보드가 올라오면 레이아웃을 줄여 입력창이 가려지지 않게 한다
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-abyss text-ink antialiased">{children}</body>
    </html>
  );
}
