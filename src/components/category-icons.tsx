import { cn } from "@/lib/utils";

type Props = { className?: string };

export function IconAll({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function IconRomance({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function IconFantasy({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9 9H2l6 4.5L5.5 21 12 16.5 18.5 21 16 13.5 22 9h-7z" />
    </svg>
  );
}

export function IconRpg({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2L12 5l2.5 3L12 11l2.5 3-2.5 3 2.5 3" />
      <path d="M9.5 2L12 5 9.5 8 12 11 9.5 14 12 17l-2.5 3" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

export function IconRealism({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function IconAnime({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z" />
      <path d="M9 10.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5" />
      <path d="M11.5 10.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5" />
      <path d="M9.5 13.5s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5" />
    </svg>
  );
}

export function IconAssistant({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="12" rx="3" />
      <path d="M12 8V5" />
      <circle cx="12" cy="3" r="2" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" />
      <path d="M9 18h6" />
    </svg>
  );
}

export function IconGeneral({ className }: Props) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M3 21c0-4.4 4-8 9-8s9 3.6 9 8" />
      <path d="M15 5l2-2M9 5L7 3" />
    </svg>
  );
}

export const CATEGORY_ICONS: Record<string, React.FC<Props>> = {
  "": IconAll,
  romance: IconRomance,
  fantasy: IconFantasy,
  rpg: IconRpg,
  realism: IconRealism,
  anime: IconAnime,
  assistant: IconAssistant,
  general: IconGeneral,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] || IconGeneral;
  return <Icon className={className} />;
}
