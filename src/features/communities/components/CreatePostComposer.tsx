import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useCreatePost } from "../hooks/usePosts";
import { useCreatePoll } from "../hooks/usePolls";

export function CreatePostComposer({ slug }: { slug: string }) {
  const createPost = useCreatePost(slug);
  const createPoll = useCreatePoll(slug);

  const postForm = useForm<{ body: string }>();
  const [pollQuestion, setPollQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const onSubmitPost = async (values: { body: string }) => {
    if (!values.body.trim()) return;
    try {
      await createPost.mutateAsync({ body: values.body });
      postForm.reset();
      toast.success("Posted");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleCreatePoll = async () => {
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOptions.length < 2) {
      toast.error("Add a question and at least 2 options");
      return;
    }
    try {
      await createPoll.mutateAsync({ question: pollQuestion, options: validOptions, allowMultipleChoices: allowMultiple });
      setPollQuestion("");
      setOptions(["", ""]);
      setAllowMultiple(false);
      toast.success("Poll posted");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="post">
          <TabsList className="mb-3">
            <TabsTrigger value="post">Post</TabsTrigger>
            <TabsTrigger value="poll">Poll</TabsTrigger>
          </TabsList>
          <TabsContent value="post">
            <form onSubmit={postForm.handleSubmit(onSubmitPost)} className="space-y-3">
              <Textarea rows={3} placeholder="Share something with the community..." {...postForm.register("body")} />
              <Button type="submit" disabled={createPost.isPending}>
                {createPost.isPending ? "Posting..." : "Post"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="poll" className="space-y-3">
            <Input placeholder="Ask a question..." value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
            <div className="space-y-2">
              {options.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={option}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <Button variant="outline" size="sm" type="button" onClick={() => setOptions((prev) => [...prev, ""])}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Add option
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} id="allow-multiple" />
              <Label htmlFor="allow-multiple" className="text-sm font-normal">
                Allow multiple choices
              </Label>
            </div>
            <Button type="button" disabled={createPoll.isPending} onClick={handleCreatePoll}>
              {createPoll.isPending ? "Posting..." : "Post poll"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
