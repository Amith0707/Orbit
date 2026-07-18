import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, Briefcase02Icon, Building02Icon, Location01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TagToggleGroup } from "@/components/composite/TagToggleGroup";
import { AddTagInput } from "@/components/composite/AddTagInput";
import { useMyProfile, useUpdateMyProfile, useUploadAvatar } from "@/features/profile/hooks/useProfile";
import { useTags, useCreateTag, useDepartments } from "@/features/meta/hooks/useMeta";
import type { TagKind } from "@/features/meta/api/meta";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { MyCommunitiesCard } from "@/features/communities/components/MyCommunitiesCard";

interface FormValues {
  firstName: string;
  lastName: string;
  jobTitle: string;
  bio: string;
  location: string;
  availability: string;
  departmentId: string;
}

export default function MyProfilePage() {
  const { data: profile, isPending } = useMyProfile();
  const { data: interestTags } = useTags("interest");
  const { data: hobbyTags } = useTags("hobby");
  const { data: skillTags } = useTags("skill");
  const { data: departments } = useDepartments();
  const updateProfile = useUpdateMyProfile();
  const uploadAvatar = useUploadAvatar();
  const createTag = useCreateTag();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>();
  const departmentId = watch("departmentId");

  useEffect(() => {
    if (!profile) return;
    reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      jobTitle: profile.jobTitle ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      availability: profile.availability ?? "",
      departmentId: profile.department?.id ?? "",
    });
    setSelectedTagIds([]);
  }, [profile, reset]);

  const allTags = [...(interestTags ?? []), ...(hobbyTags ?? []), ...(skillTags ?? [])];
  const currentTagNames = profile ? [...profile.interests, ...profile.hobbies, ...profile.skills] : [];
  const effectiveSelectedIds =
    selectedTagIds.length > 0 || !profile
      ? selectedTagIds
      : allTags.filter((t) => currentTagNames.includes(t.name)).map((t) => t.id);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const base = prev.length > 0 || !profile ? prev : effectiveSelectedIds;
      return base.includes(tagId) ? base.filter((id) => id !== tagId) : [...base, tagId];
    });
  };

  const handleAddTag = async (kind: TagKind, name: string) => {
    try {
      const tag = await createTag.mutateAsync({ kind, name });
      setSelectedTagIds((prev) => {
        const base = prev.length > 0 || !profile ? prev : effectiveSelectedIds;
        return base.includes(tag.id) ? base : [...base, tag.id];
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProfile.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        jobTitle: values.jobTitle || null,
        bio: values.bio || null,
        location: values.location || null,
        availability: values.availability || null,
        departmentId: values.departmentId || null,
        tagIds: effectiveSelectedIds,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (isPending || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">This is how coworkers see you, and what your AI Buddy uses to personalize suggestions.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="relative">
            <Avatar size="lg">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.firstName} />
              <AvatarFallback>
                {profile.firstName[0]}
                {profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <label className="absolute -right-1 -bottom-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
              <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <p className="font-heading font-medium">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input {...register("firstName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input {...register("lastName")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} className="size-3.5" /> Job title
              </Label>
              <Input {...register("jobTitle")} placeholder="e.g. Senior Product Designer" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-3.5" /> Department
              </Label>
              <Select value={departmentId} onValueChange={(value) => setValue("departmentId", value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea {...register("bio")} rows={3} placeholder="Tell coworkers a bit about yourself" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" /> Location
                </Label>
                <Input {...register("location")} placeholder="e.g. Bengaluru" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" /> Availability
                </Label>
                <Input {...register("availability")} placeholder="e.g. Weekday evenings" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests, hobbies & skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Interests</Label>
              <TagToggleGroup tags={interestTags ?? []} selectedIds={effectiveSelectedIds} onToggle={toggleTag} />
              <AddTagInput
                placeholder="Add an interest..."
                isAdding={createTag.isPending}
                onAdd={(name) => handleAddTag("interest", name)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hobbies</Label>
              <TagToggleGroup tags={hobbyTags ?? []} selectedIds={effectiveSelectedIds} onToggle={toggleTag} />
              <AddTagInput
                placeholder="Add a hobby..."
                isAdding={createTag.isPending}
                onAdd={(name) => handleAddTag("hobby", name)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Skills</Label>
              <TagToggleGroup tags={skillTags ?? []} selectedIds={effectiveSelectedIds} onToggle={toggleTag} />
              <AddTagInput
                placeholder="Add a skill..."
                isAdding={createTag.isPending}
                onAdd={(name) => handleAddTag("skill", name)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <MyCommunitiesCard />
    </div>
  );
}
