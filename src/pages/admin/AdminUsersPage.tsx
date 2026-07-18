import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/composite/EmptyState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAdminUsers, useSetUserRole, useSetUserActive } from "@/features/admin/hooks/useAdmin";
import type { Role } from "@/features/auth/types";

export default function AdminUsersPage() {
  const { user: viewer } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isPending } = useAdminUsers({
    search: debouncedSearch || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    limit: 50,
  });
  const setRole = useSetUserRole();
  const setActive = useSetUserActive();

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await setRole.mutateAsync({ userId, role });
      toast.success("Role updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleActiveChange = async (userId: string, isActive: boolean) => {
    try {
      await setActive.mutateAsync({ userId, isActive });
      toast.success(isActive ? "User activated" : "User deactivated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage employee roles and account status.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as Role | "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="administrator">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !data || data.users.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-5" />}
              title="No users found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => {
                  const isSelf = u.id === viewer?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarImage src={u.avatarUrl ?? undefined} alt={u.firstName} />
                            <AvatarFallback>
                              {u.firstName[0]}
                              {u.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.department?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          disabled={isSelf || setRole.isPending}
                          onValueChange={(value) => handleRoleChange(u.id, value as Role)}
                        >
                          <SelectTrigger size="sm" className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="administrator">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.isActive}
                            disabled={isSelf || setActive.isPending}
                            onCheckedChange={(checked) => handleActiveChange(u.id, checked)}
                          />
                          {!u.isActive && (
                            <Badge variant="outline" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
