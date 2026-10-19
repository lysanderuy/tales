import { AppContent } from "@/components/shared/app-content";
import { FocusMode } from "@/components/shared/focus-mode";
import { TimerEffects } from "@/components/shared/timer-effects";
import { Toast } from "@/components/shared/toast";
import { TopBar } from "@/components/shared/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppContent>
        <TopBar />
        {children}
      </AppContent>
      <TimerEffects />
      <FocusMode />
      <Toast />
    </>
  );
}
