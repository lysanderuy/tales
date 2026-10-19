import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-[var(--material)] backdrop-blur-[20px]">
        <div className="mx-auto flex min-h-16 max-w-[1200px] items-center px-6 py-3">
          <span className="text-logo font-semibold tracking-[-0.02em] text-time">Tales</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-[72px] pt-12">
        <Card className="w-[min(420px,100%)]">{children}</Card>
      </main>
    </div>
  );
}
