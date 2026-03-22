import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DesktopLayoutNav, MobileLayoutNav } from "@/components/layout-nav";
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
  const avatarFallback = viewer.username.charAt(0).toUpperCase() || "D";

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-[#f5f1eb] text-[#252525]">
        <div className="flex h-screen flex-col overflow-hidden md:flex-row">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#e8e3dd] p-8 sticky top-0 h-screen overflow-y-auto">
            {/* Branding */}
            <div className="mb-8">
              <h1 className="text-2xl font-black text-[#252525]">Lords of</h1>
              <h1 className="text-2xl font-black text-[#252525]">Library</h1>
            </div>

            {/* Executive Avatar */}
            <div className="mb-8 pb-8 border-b border-[#e8e3dd]">
              <div className="flex items-center gap-3">
                {viewer.avatarUrl ? (
                  <img
                    src={viewer.avatarUrl}
                    alt={`${viewer.username} avatar`}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-[#8b1f1f] flex items-center justify-center text-white font-bold text-sm">
                    {avatarFallback}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8b8b8b]">Executive Avatar</div>
                  <div className="text-sm font-semibold text-[#252525]">{viewer.username}</div>
                </div>
              </div>
            </div>

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
