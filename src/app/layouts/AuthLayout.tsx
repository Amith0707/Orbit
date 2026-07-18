import { Outlet } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

export function AuthLayout() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="orbit-glow-icon flex size-14 items-center justify-center rounded-2xl text-primary">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-6" />
          </div>
          <div>
            <p className="font-heading text-2xl">Calfus Orbit</p>
            <p className="text-sm text-muted-foreground">Find the people you were meant to meet</p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
