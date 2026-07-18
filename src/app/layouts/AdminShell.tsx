import { Outlet, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics02Icon,
  User02Icon,
  UserGroupIcon,
  Shield02Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/components/layout/Sidebar";

const NAV_ITEMS: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: Analytics02Icon },
  { to: "/admin/users", label: "Users", icon: User02Icon },
  { to: "/admin/communities", label: "Communities", icon: UserGroupIcon },
  { to: "/admin/moderation", label: "Moderation", icon: Shield02Icon },
];

export function AdminShell() {
  const navigate = useNavigate();

  return (
    <Shell
      navItems={NAV_ITEMS}
      variant="admin"
      topbarExtras={
        <Button variant="outline" size="sm" onClick={() => navigate("/home")}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Exit to employee view
        </Button>
      }
    >
      <Outlet />
    </Shell>
  );
}
