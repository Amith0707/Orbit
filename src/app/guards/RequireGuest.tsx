import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";

export function RequireGuest() {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
