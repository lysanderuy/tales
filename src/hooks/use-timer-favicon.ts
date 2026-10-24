"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useCurrentSession } from "@/hooks/use-current-session";
import { useSessionClock } from "@/hooks/use-session-clock";
import { clockOffset } from "@/lib/timer/clock";
import { faviconState, quantizeProgress, type FaviconTone } from "@/lib/timer/favicon";

const ICON_SELECTOR = 'link[rel~="icon"]';
const ORIGINAL = "timerOriginalIcon";
const SIZE = 64;
const FACE_X = 12;
const FACE_Y = 13;
const WEDGE_RADIUS = 5.5;

const PALETTE = {
  light: { run: "#2E6B4F", overtime: "#CF7A33", paused: "#86928A" },
  dark: { run: "#7CD3A5", overtime: "#F0A263", paused: "#7D8C82" },
} satisfies Record<string, Record<FaviconTone, string>>;

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Bells and feet of Lucide's alarm-clock icon (ISC license), 24px grid.
const CLOCK_STROKES = "M5 3 2 6M22 6l-3-3M6.38 18.7 4 21M17.64 18.67 20 21";

function iconLinks(): HTMLLinkElement[] {
  return Array.from(document.querySelectorAll<HTMLLinkElement>(ICON_SELECTOR));
}

function showsIcon(href: string): boolean {
  const links = iconLinks();
  return links.length > 0 && links.every((link) => link.getAttribute("href") === href);
}

function restoreIcon() {
  for (const link of iconLinks()) {
    if (link.dataset.timerCreated) {
      link.remove();
      continue;
    }
    const saved = link.dataset[ORIGINAL];
    if (!saved) continue;
    const original = JSON.parse(saved) as Record<string, string | null>;
    for (const [name, value] of Object.entries(original)) {
      if (value === null) link.removeAttribute(name);
      else link.setAttribute(name, value);
    }
    delete link.dataset[ORIGINAL];
  }
}

function drawIcon(progress: number, tone: FaviconTone, dark: boolean): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const colors = PALETTE[dark ? "dark" : "light"];
  const color = colors[tone];
  const top = -Math.PI / 2;

  ctx.scale(SIZE / 24, SIZE / 24);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(FACE_X, FACE_Y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.stroke(new Path2D(CLOCK_STROKES));

  ctx.globalAlpha = 0.25;
  ctx.fillStyle = colors.paused;
  ctx.beginPath();
  ctx.arc(FACE_X, FACE_Y, WEDGE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(FACE_X, FACE_Y);
  ctx.arc(FACE_X, FACE_Y, WEDGE_RADIUS, top, top + Math.PI * 2 * progress);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL();
}

// Next renders its own icon link; a second link loses to it, so rewrite those in place.
function applyIcon(href: string) {
  let links = iconLinks();
  if (links.length === 0) {
    const created = document.createElement("link");
    created.rel = "icon";
    created.dataset.timerCreated = "1";
    document.head.appendChild(created);
    links = [created];
  }
  for (const link of links) {
    link.dataset[ORIGINAL] ??= JSON.stringify({
      href: link.getAttribute("href"),
      type: link.getAttribute("type"),
      sizes: link.getAttribute("sizes"),
    });
    link.setAttribute("href", href);
    link.type = "image/png";
    link.removeAttribute("sizes");
  }
}

export function useTimerFavicon() {
  const { session } = useSessionClock();
  const { data, dataUpdatedAt } = useCurrentSession();
  usePathname();
  const applied = useRef<{ key: string; href: string } | null>(null);

  useEffect(() => {
    if (!session || !data) {
      restoreIcon();
      applied.current = null;
      return;
    }
    const serverNow = Date.now() + clockOffset(data.serverNow, dataUpdatedAt);
    const state = faviconState(session, serverNow);
    const { tone } = state;
    const steps = quantizeProgress(state.progress);
    const dark = prefersDark();
    const key = `${steps}:${tone}:${dark}`;
    if (applied.current?.key === key && showsIcon(applied.current.href)) return;
    const href = drawIcon(steps, tone, dark);
    if (!href) return;
    applyIcon(href);
    applied.current = { key, href };
  });

  useEffect(
    () => () => {
      restoreIcon();
      applied.current = null;
    },
    [],
  );
}
