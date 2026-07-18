import { cn } from "@/lib/utils";
import type { Tag } from "@/features/meta/api/meta";

export function TagToggleGroup({
  tags,
  selectedIds,
  onToggle,
}: {
  tags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            aria-pressed={selected}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              selected
                ? "border-ai-accent-border bg-ai-accent-soft text-ai-accent"
                : "border-border bg-input/30 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
