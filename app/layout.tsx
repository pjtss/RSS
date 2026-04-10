import type { Metadata } from "next";
import { PushProvider } from "@/components/push-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSS Monitor",
  description: "DART와 SEC RSS를 실시간에 가깝게 모니터링하는 대시보드",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <PushProvider>{children}</PushProvider>
      </body>
    </html>
  );
}
