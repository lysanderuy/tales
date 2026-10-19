type SwatchProps = { color: string; className?: string };

export function Swatch({ color, className }: SwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 3,
        flexShrink: 0,
        background: color,
      }}
    />
  );
}
