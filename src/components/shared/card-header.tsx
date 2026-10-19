import { Eyebrow } from "@/components/ui/eyebrow";

type CardHeaderProps = { title: string; eyebrow?: string };

export function CardHeader({ title, eyebrow }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-h2 font-semibold tracking-[-0.01em]">{title}</h2>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
    </div>
  );
}
