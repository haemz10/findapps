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
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-abyss text-ink antialiased">{children}</body>
    </html>
  );
}
