import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddTagInput({
  placeholder = "Add your own...",
  onAdd,
  isAdding,
}: {
  placeholder?: string;
  onAdd: (name: string) => void;
  isAdding?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="h-7 max-w-48 text-xs"
      />
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        disabled={isAdding || !value.trim()}
        onClick={submit}
        aria-label="Add"
      >
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
      </Button>
    </div>
  );
}
