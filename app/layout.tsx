import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "../components/AuthProvider";

export const metadata = {
  title: "Worm 28 课程系统",
  description: "智能语音课程系统"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
