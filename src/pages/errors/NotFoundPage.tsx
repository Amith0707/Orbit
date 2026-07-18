import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Compass01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <HugeiconsIcon icon={Compass01Icon} strokeWidth={2} className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
      </div>
      <Button render={<Link to="/home" />}>Back to home</Button>
    </div>
  );
}
