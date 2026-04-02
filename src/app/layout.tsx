import type { Metadata, Viewport } from "next";
// import { Heebo } from "next/font/google";
import "./globals.css";

// const heebo = Heebo({
//   subsets: ["hebrew", "latin"],
//   variable: "--font-heebo",
// });

export const viewport: Viewport = {
  themeColor: "#AA0000",
};

export const metadata: Metadata = {
  title: "FamilyTask",
  description: "Gamified family task management",
  manifest: "/manifest.json",
};

import { UserPreferencesProvider } from '@/contexts/UserContext';
import { InstallPrompt } from '@/components/InstallPrompt';

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
            <InstallPrompt />
          </div>
        </UserPreferencesProvider>
      </body>
    </html>
  );
}
