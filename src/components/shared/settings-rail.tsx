"use client";

import { useEffect, useState, type MouseEvent } from "react";

import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

export const SETTINGS_SECTIONS = [
  { id: "profile", label: messages.settingsProfile },
  { id: "boards", label: messages.settingsBoards },
  { id: "sets", label: messages.settingsDailySets },
  { id: "appearance", label: messages.settingsAppearance },
  { id: "account", label: messages.settingsAccount },
] as const;

const SPY_OFFSET = 180;

function currentIndex(): number {
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
    return SETTINGS_SECTIONS.length - 1;
  }
  let current = 0;
  SETTINGS_SECTIONS.forEach((section, index) => {
    const element = document.getElementById(section.id);
    if (
      element &&
      element.getBoundingClientRect().top + window.scrollY <= window.scrollY + SPY_OFFSET
    ) {
      current = index;
    }
  });
  return current;
}

export function SettingsRail() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = () => setActive(currentIndex());
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function onClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <nav
      aria-label={messages.settingsSections}
      className="sticky top-[88px] hidden flex-col gap-1 self-start min-[900px]:flex"
    >
      {SETTINGS_SECTIONS.map((section, index) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={index === active ? "location" : undefined}
          onClick={(event) => onClick(event, section.id)}
          className={cn(
            "rounded-full px-4 py-2 text-body font-medium transition-colors",
            index === active ? "bg-primary-soft text-primary" : "text-text-soft hover:bg-fill",
          )}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
