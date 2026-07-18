import { getAccessToken } from "./tokenStore";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

interface SSEHandlers {
  onToken: (delta: string) => void;
  onDone: (payload: { conversationId: string; message: string }) => void;
  onError: (error: Error) => void;
}

// Native EventSource can't set an Authorization header, so the Buddy stream is
// consumed via fetch + a manually-parsed ReadableStream instead.
export async function streamBuddyMessage(
  body: { conversationId?: string; message: string },
  handlers: SSEHandlers,
  signal?: AbortSignal
): Promise<void> {
  const token = getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${baseURL}/ai/buddy/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    handlers.onError(err instanceof Error ? err : new Error("Network error"));
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError(new Error(`Request failed with status ${response.status}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7);
        else if (line.startsWith("data: ")) data = line.slice(6);
      }
      if (!data) continue;

      const parsed = JSON.parse(data);
      if (event === "token") handlers.onToken(parsed.delta);
      else if (event === "done") handlers.onDone(parsed);
      else if (event === "error") handlers.onError(new Error(parsed.message ?? "Something went wrong"));
    }
  }
}
