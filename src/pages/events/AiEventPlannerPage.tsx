import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Calendar01Icon,
  Location01Icon,
  DollarCircleIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { usePlanEvent } from "@/features/ai-event-planner/hooks/useEventPlanner";
import { GeneratingPreview } from "@/features/ai-event-planner/components/GeneratingPreview";
import type { EventItem } from "@/features/events/api/events";

const EXAMPLES = [
  "Let's go bowling this Saturday evening",
  "A casual team lunch to celebrate shipping the new feature",
  "Beginner-friendly chess tournament next Friday after work",
];

export default function AiEventPlannerPage() {
  const navigate = useNavigate();
  const planEvent = usePlanEvent();
  const [idea, setIdea] = useState("");
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);

  const handleGenerate = async () => {
    if (!idea.trim()) {
      toast.error("Describe your event idea first");
      return;
    }
    try {
      const event = await planEvent.mutateAsync({ idea });
      setCreatedEvent(event);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const reset = () => {
    setCreatedEvent(null);
    setIdea("");
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-ai-accent-soft text-ai-accent">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold">AI Event Planner</h1>
          <p className="text-sm text-muted-foreground">Describe an idea — we'll turn it into a full event.</p>
        </div>
      </div>

      {!planEvent.isPending && !createdEvent && (
        <Card>
          <CardContent className="space-y-4">
            <Textarea
              rows={3}
              placeholder="e.g. Let's go bowling this Saturday evening"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setIdea(example)}
                  className="rounded-full border border-border bg-input/30 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  {example}
                </button>
              ))}
            </div>
            <Button onClick={handleGenerate} disabled={planEvent.isPending}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} /> Generate event
            </Button>
          </CardContent>
        </Card>
      )}

      {planEvent.isPending && <GeneratingPreview />}

      {createdEvent && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-ai-accent-border/60">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ai-accent">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5" /> Event created
              </div>
              <p className="font-heading text-lg font-semibold">{createdEvent.title}</p>
              <p className="text-sm text-foreground/90">{createdEvent.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3.5" />
                  {format(new Date(createdEvent.startsAt), "EEE, MMM d 'at' h:mm a")}
                </span>
                {createdEvent.location && (
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" /> {createdEvent.location}
                  </span>
                )}
                {createdEvent.estimatedCost !== null && (
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} className="size-3.5" /> ~${createdEvent.estimatedCost}/person
                  </span>
                )}
                {createdEvent.idealGroupSizeMin && (
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} className="size-3.5" />
                    {createdEvent.idealGroupSizeMin}–{createdEvent.idealGroupSizeMax}
                  </span>
                )}
              </div>
              {createdEvent.thingsToBring.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {createdEvent.thingsToBring.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate(`/events/${createdEvent.id}`)}>View event</Button>
                <Button variant="outline" onClick={reset}>
                  Plan another
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
