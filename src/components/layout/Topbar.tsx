import { useEffect, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { CommandPalette } from "./CommandPalette";
import { Sidebar, type NavItem } from "./Sidebar";

export function Topbar({
  navItems,
  variant = "employee",
  extras,
}: {
  navItems: NavItem[];
  variant?: "employee" | "admin";
  extras?: ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
        <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-4" />
      </Button>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-full border border-border bg-input/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-input/50"
      >
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
        Search Calfus Orbit
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {extras}
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">App navigation menu</SheetDescription>
          <Sidebar items={navItems} variant={variant} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
