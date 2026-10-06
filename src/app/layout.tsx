import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "UCC 유크크", template: "%s · UCC 유크크" },
  description: "학생회·동아리 운영을 한곳에서. 작년 행사에서 시작하고, 끝나면 저절로 기록돼요.",
};

export const viewport: Viewport = {
  themeColor: "#f4f5f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "var(--font-pretendard)",
              borderRadius: 12,
              border: "1px solid var(--line)",
              color: "var(--ink)",
            },
          }}
        />
      </body>
    </html>
  );
}
