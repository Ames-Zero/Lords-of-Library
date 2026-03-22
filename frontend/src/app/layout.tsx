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

export const metadata: Metadata = {
  title: "Lords of Library",
  description: "Discover and curate research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f5f1eb] text-[#252525]">
        <div className="flex min-h-screen flex-col md:flex-row">
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
                <div className="w-10 h-10 rounded bg-[#8b1f1f] flex items-center justify-center text-white font-bold text-sm">E</div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8b8b8b]">Executive Avatar</div>
                  <div className="text-sm font-semibold text-[#252525]">The Ethereal Soubrette</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 mb-8">
              <a href="/" className="flex items-center gap-3 px-3 py-2 rounded text-sm font-semibold text-[#8b1f1f] bg-[#f5f1eb]">
                <div className="w-5 text-center">●</div>
                <span>FEED</span>
              </a>
              <a href="/saved" className="flex items-center gap-3 px-3 py-2 rounded text-sm font-semibold text-[#8b8b8b] hover:bg-[#f5f1eb]">
                <div className="w-5 text-center">■</div>
                <span>QUEUE</span>
              </a>
              <a href="/connections" className="flex items-center gap-3 px-3 py-2 rounded text-sm font-semibold text-[#8b8b8b] hover:bg-[#f5f1eb]">
                <div className="w-5 text-center">▦</div>
                <span>ANALYTICS</span>
              </a>
              <a href="/onboarding" className="flex items-center gap-3 px-3 py-2 rounded text-sm font-semibold text-[#8b8b8b] hover:bg-[#f5f1eb]">
                <div className="w-5 text-center">◉</div>
                <span>PROFILE</span>
              </a>
            </nav>

            {/* New Quest Button */}
            <button className="w-full px-4 py-3 bg-[#8b1f1f] text-white font-bold uppercase text-xs tracking-wide rounded hover:bg-[#a52a2a] transition-colors">
              + NEW QUEST
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center bg-[#f5f1eb] p-4 pt-20 pb-28 md:pt-12 md:pb-12 lg:p-12">
            <div className="w-full max-w-3xl">{children}</div>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-4 bg-white/70 backdrop-blur-xl border-t border-[#e8e3dd] rounded-t-3xl">
            <a href="/" className="flex flex-col items-center justify-center text-[#8b1f1f] gap-1">
              <span className="text-lg">●</span>
              <span className="text-[10px] font-semibold uppercase tracking-tight">Feed</span>
            </a>
            <a href="/saved" className="flex flex-col items-center justify-center text-[#8b8b8b] hover:text-[#8b1f1f] transition-colors gap-1 opacity-70">
              <span className="text-lg">■</span>
              <span className="text-[10px] font-semibold uppercase tracking-tight">Queue</span>
            </a>
            <a href="/connections" className="flex flex-col items-center justify-center text-[#8b8b8b] hover:text-[#8b1f1f] transition-colors gap-1 opacity-70">
              <span className="text-lg">▦</span>
              <span className="text-[10px] font-semibold uppercase tracking-tight">Analytics</span>
            </a>
            <a href="/onboarding" className="flex flex-col items-center justify-center text-[#8b8b8b] hover:text-[#8b1f1f] transition-colors gap-1 opacity-70">
              <span className="text-lg">◉</span>
              <span className="text-[10px] font-semibold uppercase tracking-tight">Profile</span>
            </a>
          </nav>
        </div>
      </body>
    </html>
  );
}
