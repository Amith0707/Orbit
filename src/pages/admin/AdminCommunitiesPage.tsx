import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/composite/EmptyState";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useAdminCommunities, useSetCommunityArchived } from "@/features/admin/hooks/useAdmin";

export default function AdminCommunitiesPage() {
  const { data, isPending } = useAdminCommunities({ limit: 100 });
  const setArchived = useSetCommunityArchived();

  const handleArchiveToggle = async (communityId: string, isArchived: boolean) => {
    try {
      await setArchived.mutateAsync({ communityId, isArchived });
      toast.success(isArchived ? "Community archived" : "Community restored");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Communities</h1>
        <p className="text-sm text-muted-foreground">Review membership and archive inactive or inappropriate communities.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !data || data.communities.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5" />}
              title="No communities yet"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Community</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.communities.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.memberCount}</TableCell>
                    <TableCell>
                      {c.isArchived ? (
                        <Badge variant="outline">Archived</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!c.isArchived}
                        disabled={setArchived.isPending}
                        onCheckedChange={(checked) => handleArchiveToggle(c.id, !checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
