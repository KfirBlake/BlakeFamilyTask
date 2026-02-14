import type { Metadata } from "next";
// import { Heebo } from "next/font/google";
import "./globals.css";

// const heebo = Heebo({
//   subsets: ["hebrew", "latin"],
//   variable: "--font-heebo",
// });

export const metadata: Metadata = {
  title: "FamilyTask",
  description: "Gamified family task management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
