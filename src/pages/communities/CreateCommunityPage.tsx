import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagToggleGroup } from "@/components/composite/TagToggleGroup";
import { useTags } from "@/features/meta/hooks/useMeta";
import { useCreateCommunity } from "@/features/communities/hooks/useCommunities";
import { getApiErrorMessage } from "@/lib/http/apiClient";

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const { data: interestTags } = useTags("interest");
  const { data: hobbyTags } = useTags("hobby");
  const createCommunity = useCreateCommunity();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);

  const toggleTag = (id: string) => setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Give your community a name");
      return;
    }
    try {
      const community = await createCommunity.mutateAsync({ name, description: description || undefined, tagIds });
      toast.success("Community created");
      navigate(`/communities/${community.slug}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Create a community</h1>
        <p className="text-sm text-muted-foreground">Bring coworkers together around something you care about.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chess Club" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's this community about?" />
          </div>
          <div className="space-y-1.5">
            <Label>Themes</Label>
            <TagToggleGroup tags={[...(interestTags ?? []), ...(hobbyTags ?? [])]} selectedIds={tagIds} onToggle={toggleTag} />
          </div>
          <Button disabled={createCommunity.isPending} onClick={handleSubmit}>
            {createCommunity.isPending ? "Creating..." : "Create community"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
