import { NavLink } from "react-router-dom";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: HugeiconsIconProps["icon"];
  end?: boolean;
}

export function Sidebar({ items, variant = "employee" }: { items: NavItem[]; variant?: "employee" | "admin" }) {
  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-6 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 px-2">
        <div className="orbit-glow-icon flex size-9 items-center justify-center rounded-xl text-primary">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-base text-sidebar-foreground">Calfus Orbit</p>
          {variant === "admin" && <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Admin</p>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-active font-semibold text-sidebar-active-foreground hover:bg-sidebar-active hover:text-sidebar-active-foreground"
              )
            }
          >
            <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4.5" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-sidebar-border pt-4 font-heading text-xs leading-relaxed text-sidebar-foreground/40 italic">
        "Find the stars you were meant to meet."
      </div>
    </nav>
  );
}
