import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinguaDay · 每天进步一点点",
  description: "阅读英文内容、随手查词并养成每日学习习惯。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
