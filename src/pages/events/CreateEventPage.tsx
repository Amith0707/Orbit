import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useMyCommunities } from "@/features/communities/hooks/useCommunities";
import { useCreateEvent } from "@/features/events/hooks/useEvents";
import { getApiErrorMessage } from "@/lib/http/apiClient";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { data: myCommunities } = useMyCommunities();
  const createEvent = useCreateEvent();

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    durationMinutes: "",
    estimatedCost: "",
    communityId: "",
  });

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.startsAt) {
      toast.error("Fill in the title, description, and date");
      return;
    }
    try {
      const event = await createEvent.mutateAsync({
        title: form.title,
        description: form.description,
        location: form.location || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        communityId: form.communityId || null,
      });
      toast.success("Event created");
      navigate(`/events/${event.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Create an event</h1>
        <p className="text-sm text-muted-foreground">
          Prefer to describe it in a sentence?{" "}
          <button className="font-medium text-ai-accent underline underline-offset-4" onClick={() => navigate("/events/create/ai")}>
            Plan it with AI instead
          </button>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated cost ($)</Label>
              <Input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Community (optional)</Label>
            <Select value={form.communityId} onValueChange={(value) => setForm((f) => ({ ...f, communityId: value ?? "" }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {myCommunities?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={createEvent.isPending} onClick={handleSubmit}>
            {createEvent.isPending ? "Creating..." : "Create event"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
