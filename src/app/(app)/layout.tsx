import { TimerEffects } from "@/components/shared/timer-effects";
import { Toast } from "@/components/shared/toast";
import { TopBar } from "@/components/shared/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      {children}
      <TimerEffects />
      <Toast />
    </div>
  );
}
