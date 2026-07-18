import type { ReactNode } from "react";
import { Sidebar, type NavItem } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Shell({
  navItems,
  variant = "employee",
  topbarExtras,
  children,
}: {
  navItems: NavItem[];
  variant?: "employee" | "admin";
  topbarExtras?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar items={navItems} variant={variant} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar navItems={navItems} variant={variant} extras={topbarExtras} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
