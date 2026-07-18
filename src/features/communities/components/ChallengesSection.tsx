import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fire03Icon, SparklesIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/composite/EmptyState";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import {
  useChallenges,
  useCreateChallenge,
  useGenerateChallenge,
  useJoinChallenge,
  usePublishChallenge,
} from "../hooks/useChallenges";

export function ChallengesSection({ slug, canManage }: { slug: string; canManage: boolean }) {
  const { data: challenges, isPending } = useChallenges(slug);
  const generate = useGenerateChallenge(slug);
  const create = useCreateChallenge(slug);
  const join = useJoinChallenge(slug);
  const publish = usePublishChallenge(slug);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startsAt: "", endsAt: "" });

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync();
      toast.success("AI generated a new challenge — review and publish it below");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.startsAt || !form.endsAt) {
      toast.error("Fill in all fields");
      return;
    }
    try {
      await create.mutateAsync(form);
      setDialogOpen(false);
      setForm({ title: "", description: "", startsAt: "", endsAt: "" });
      toast.success("Challenge created");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const visibleChallenges = canManage ? challenges : challenges?.filter((c) => c.status !== "draft");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Fire03Icon} strokeWidth={2} className="size-4" /> Weekly Challenges
        </CardTitle>
        {canManage && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> New
            </Button>
            <Button size="sm" disabled={generate.isPending} onClick={handleGenerate}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
              {generate.isPending ? "Generating..." : "AI Generate"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading challenges...</p>
        ) : !visibleChallenges || visibleChallenges.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={Fire03Icon} strokeWidth={2} className="size-5" />}
            title="No challenges yet"
            description={canManage ? "Generate one with AI or create your own." : "Check back soon for a new challenge."}
          />
        ) : (
          visibleChallenges.map((challenge) => (
            <div key={challenge.id} className="space-y-2 rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 font-heading text-sm font-medium">
                    {challenge.title}
                    {challenge.source === "ai_generated" && (
                      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5 text-ai-accent" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {challenge.startsAt} → {challenge.endsAt}
                  </p>
                </div>
                <Badge variant={challenge.status === "draft" ? "outline" : "secondary"}>{challenge.status}</Badge>
              </div>
              <p className="text-sm text-foreground/90">{challenge.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{challenge.participantCount} joined</span>
                <div className="flex gap-1.5">
                  {challenge.status === "draft" && canManage && (
                    <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(challenge.id)}>
                      Publish
                    </Button>
                  )}
                  {challenge.status === "active" && (
                    <Button size="sm" variant="outline" disabled={join.isPending} onClick={() => join.mutate(challenge.id)}>
                      Join challenge
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Starts</Label>
                <Input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Ends</Label>
                <Input type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={create.isPending} onClick={handleCreate}>
              Create challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
