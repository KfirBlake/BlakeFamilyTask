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

import { UserPreferencesProvider } from '@/contexts/UserContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`font-sans antialiased text-gray-900 bg-gray-50`} suppressHydrationWarning>
        <UserPreferencesProvider>
          <div id="app-root" className="min-h-screen flex flex-col">
            {children}
          </div>
        </UserPreferencesProvider>
      </body>
    </html>
  );
}
