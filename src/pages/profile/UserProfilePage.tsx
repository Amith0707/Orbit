import { useParams, Navigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Briefcase02Icon, Building02Icon, Location01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/features/profile/hooks/useProfile";
import { useAuth } from "@/features/auth/context/AuthContext";
import { IceBreakerCard } from "@/features/ai-icebreaker/components/IceBreakerCard";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: viewer } = useAuth();
  const { data: profile, isPending } = useUserProfile(userId ?? "");

  if (userId && viewer && userId === viewer.id) {
    return <Navigate to="/profile/me" replace />;
  }

  if (isPending || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.firstName} />
            <AvatarFallback>
              {profile.firstName[0]}
              {profile.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="font-heading text-lg font-medium">
              {profile.firstName} {profile.lastName}
            </p>
            {profile.jobTitle && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} className="size-3.5" /> {profile.jobTitle}
              </p>
            )}
            {profile.department && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-3.5" /> {profile.department.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {userId && <IceBreakerCard userId={userId} firstName={profile.firstName} />}

      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90">{profile.bio}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" /> {profile.location}
                </span>
              )}
              {profile.availability && (
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" /> {profile.availability}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(profile.interests.length > 0 || profile.hobbies.length > 0 || profile.skills.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Interests & skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((name) => (
                  <Badge key={name} variant="secondary">
                    {name}
                  </Badge>
                ))}
              </div>
            )}
            {profile.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.hobbies.map((name) => (
                  <Badge key={name} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            )}
            {profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((name) => (
                  <Badge key={name} variant="ghost">
                    {name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
