import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 이 앱은 여러 미용실이 함께 쓰는 멀티테넌트 서비스라 특정 미용실 이름을
// 타이틀에 고정하지 않음 (NEXT_PUBLIC_SALON_NAME은 더 이상 쓰지 않음)
export const metadata: Metadata = {
  title: "RyanSuite Salon",
  description: "미용실 예약·고객·매출 관리를 한 곳에서",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
