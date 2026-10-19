import { ProfileMenu } from "@/components/shared/profile-menu";
import { TopBarTabs } from "@/components/shared/top-bar-tabs";

export function TopBar() {
  return (
    <header className="sticky top-0 z-[5] border-b border-border bg-[var(--material)] backdrop-blur-[20px]">
      <div className="relative mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <span className="text-logo font-semibold tracking-[-0.02em] text-time">Tales</span>
        <TopBarTabs />
        <ProfileMenu />
      </div>
    </header>
  );
}
