import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query/provider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tales",
  description: "A quiet study timer that keeps track of the time you put into each subject.",
  appleWebApp: { capable: true, title: "Tales", statusBarStyle: "default" },
};

export async function generateViewport(): Promise<Viewport> {
  const stored = (await cookies()).get("tales-theme")?.value;
  return { themeColor: stored === "dark" ? "#0F1A14" : "#EAF1E6" };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const stored = (await cookies()).get("tales-theme")?.value;
  const theme = stored === "light" || stored === "dark" ? stored : undefined;
  return (
    <html lang="en" className={`${dmSans.variable} h-full`} data-theme={theme}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
