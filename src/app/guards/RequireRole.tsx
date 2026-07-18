import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Role } from "@/features/auth/types";

export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
