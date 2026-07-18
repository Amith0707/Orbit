import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <HugeiconsIcon icon={Shield02Icon} strokeWidth={2} className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold">Access restricted</h1>
        <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
      </div>
      <Button render={<Link to="/home" />}>Back to home</Button>
    </div>
  );
}
