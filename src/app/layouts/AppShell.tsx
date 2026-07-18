import { Outlet } from "react-router-dom";
import {
  Home01Icon,
  UserGroupIcon,
  Calendar01Icon,
  User02Icon,
  GameController01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Shell } from "@/components/layout/Shell";
import type { NavItem } from "@/components/layout/Sidebar";
import { BuddyLauncher } from "@/features/ai-buddy/components/BuddyLauncher";
import { BuddyDockProvider } from "@/features/ai-buddy/context/BuddyDockContext";

const NAV_ITEMS: NavItem[] = [
  { to: "/home", label: "Home", icon: Home01Icon, end: true },
  { to: "/communities", label: "Communities", icon: UserGroupIcon },
  { to: "/events", label: "Events", icon: Calendar01Icon },
  { to: "/people", label: "People", icon: User02Icon },
  { to: "/games", label: "Games", icon: GameController01Icon },
  { to: "/digest", label: "Weekly Digest", icon: SparklesIcon },
];

export function AppShell() {
  return (
    <BuddyDockProvider>
      <Shell navItems={NAV_ITEMS} variant="employee">
        <Outlet />
        <BuddyLauncher />
      </Shell>
    </BuddyDockProvider>
  );
}
