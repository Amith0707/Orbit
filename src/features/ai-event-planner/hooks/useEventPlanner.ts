import { useMutation, useQueryClient } from "@tanstack/react-query";
import { planEvent } from "../api/eventPlanner";

export function usePlanEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: planEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
}
