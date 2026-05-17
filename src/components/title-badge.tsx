import { cn } from "@/lib/utils";

export function TitleBadge({
  name,
  color = "gold",
  className,
}: {
  name: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "title-badge inline-flex items-center rounded-full border px-2 py-0.5",
        `title-${color}`,
        color === "red" && "border-red-500/30",
        color === "blue" && "border-blue-500/30",
        color === "gold" && "border-amber-500/30",
        color === "purple" && "border-purple-500/30",
        color === "green" && "border-emerald-500/30",
        className,
      )}
    >
      {name}
    </span>
  );
}
