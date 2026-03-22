import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DesktopLayoutNav, MobileLayoutNav } from "@/components/layout-nav";
import { SidebarUser } from "@/components/sidebar-user";
import { getViewerProfile } from "@/lib/api";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lords of Library",
  description: "Discover and curate research.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewerProfile();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-[#f5f1eb] text-[#252525]" suppressHydrationWarning>
        <div className="flex h-screen flex-col overflow-hidden md:flex-row">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#e8e3dd] p-8 sticky top-0 h-screen overflow-y-auto">
            {/* Branding */}
            <div className="mb-8">
              <h1 className="text-2xl font-black text-[#252525]">Lords of</h1>
              <h1 className="text-2xl font-black text-[#252525]">Library</h1>
            </div>

            {/* Executive Avatar */}
            <SidebarUser fallbackUsername={viewer.username} avatarUrl={viewer.avatarUrl} />

            {/* Navigation */}
            <DesktopLayoutNav />

            {/* Logout Button */}
            <button className="w-full px-4 py-3 bg-[#8b1f1f] text-white font-bold uppercase text-xs tracking-wide rounded hover:bg-[#a52a2a] transition-colors">
              Logout
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex flex-1 flex-col items-center overflow-hidden bg-[#f5f1eb] p-4 pt-20 pb-28 md:pt-12 md:pb-12 lg:p-12">
            <div className="h-full w-full max-w-3xl">{children}</div>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileLayoutNav />
        </div>
      </body>
    </html>
  );
}
