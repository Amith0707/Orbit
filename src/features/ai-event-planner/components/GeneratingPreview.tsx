import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_MESSAGES = [
  "Reading your idea...",
  "Picking a good time...",
  "Drafting a description...",
  "Estimating cost and group size...",
  "Putting together an agenda...",
];

export function GeneratingPreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % STATUS_MESSAGES.length), 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card>
      <CardContent className="space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="pt-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-sm text-ai-accent"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-ai-accent" />
              {STATUS_MESSAGES[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
