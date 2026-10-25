type IconProps = { size?: number };

export function UserIcon({ size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" />
    </svg>
  );
}

export function PlayIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10-6.4a1 1 0 0 0 0-1.72l-10-6.4A1 1 0 0 0 8 5.6z" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function PauseIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

export function StopIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2.4" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function StrokeIcon({ size, children }: IconProps & { children: React.ReactNode }) {
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

export function CollapseIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M4 9h5V4M20 15h-5v5M9 9L3.5 3.5M15 15l5.5 5.5" />
    </StrokeIcon>
  );
}

export function VolumeOnIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </StrokeIcon>
  );
}

export function VolumeOffIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </StrokeIcon>
  );
}

export function MethodIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M5 7h14M5 12h14M5 17h9" />
    </StrokeIcon>
  );
}

export function EventIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </StrokeIcon>
  );
}

export function NoteIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </StrokeIcon>
  );
}

export function PlusIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M12 5v14M5 12h14" />
    </StrokeIcon>
  );
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </StrokeIcon>
  );
}

export function ArchiveIcon({ size = 15 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M4 6.5h16V10H4zM5.5 10v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-8M10 14h4" />
    </StrokeIcon>
  );
}

export function MoreIcon({ size = 18 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <circle cx="5.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
    </StrokeIcon>
  );
}

export function ImportIcon({ size = 20 }: IconProps) {
  return (
    <StrokeIcon size={size}>
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" />
    </StrokeIcon>
  );
}
