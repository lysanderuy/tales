import { TopBar } from "@/components/shared/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      {children}
    </div>
  );
}
