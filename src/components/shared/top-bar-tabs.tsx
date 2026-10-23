"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

const tabClass = "rounded-full px-4 py-2 text-ui font-medium";

const tabs: { label: string; href?: string }[] = [
  { label: messages.navToday, href: "/today" },
  { label: messages.navPlan, href: "/plan" },
  { label: messages.navSubjects, href: "/subjects" },
  { label: messages.navEvents },
  { label: messages.navReports },
];

export function TopBarTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={messages.navLabel}
      className="flex gap-1 min-[1000px]:absolute min-[1000px]:left-1/2 min-[1000px]:-translate-x-1/2"
    >
      {tabs.map(({ label, href }) => {
        if (!href) {
          return (
            <span
              key={label}
              aria-disabled="true"
              className={cn(tabClass, "cursor-default text-text-faint")}
            >
              {label}
            </span>
          );
        }
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              tabClass,
              "press",
              active ? "bg-primary-soft text-primary" : "text-text-soft hover:bg-fill",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
