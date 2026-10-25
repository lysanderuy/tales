import { cn } from "@/lib/cn";
import { initials } from "@/lib/settings/initials";

type AvatarProps = { url: string | null; name: string; className?: string };

export function Avatar({ url, name, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full font-medium",
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
