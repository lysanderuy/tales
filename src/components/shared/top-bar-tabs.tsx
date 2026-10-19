"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

const tabClass = "rounded-full px-4 py-2 text-ui font-medium";

const disabledTabs = [
  messages.navPlan,
  messages.navSubjects,
  messages.navEvents,
  messages.navReports,
];

export function TopBarTabs() {
  const pathname = usePathname();
  const todayActive = pathname === "/today" || pathname.startsWith("/today/");

  return (
    <nav
      aria-label={messages.navLabel}
      className="flex gap-1 min-[1000px]:absolute min-[1000px]:left-1/2 min-[1000px]:-translate-x-1/2"
    >
      <Link
        href="/today"
        aria-current={todayActive ? "page" : undefined}
        className={cn(
          tabClass,
          "press",
          todayActive ? "bg-primary-soft text-primary" : "text-text-soft hover:bg-fill",
        )}
      >
        {messages.navToday}
      </Link>
      {disabledTabs.map((label) => (
        <span
          key={label}
          aria-disabled="true"
          className={cn(tabClass, "cursor-default text-text-faint")}
        >
          {label}
        </span>
      ))}
    </nav>
  );
}
