import type { ReactNode } from "react";

type IconProps = { size?: number };

function StrokeIcon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function CameraIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </StrokeIcon>
  );
}

export function TrashIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
    </StrokeIcon>
  );
}

export function LockIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </StrokeIcon>
  );
}

export function SunIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </StrokeIcon>
  );
}

export function MoonIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
    </StrokeIcon>
  );
}

export function EyeIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </StrokeIcon>
  );
}

export function EyeOffIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4l16 16" />
    </StrokeIcon>
  );
}
