const DEFAULT_PROMPTS = [
  "Recommend communities for me",
  "Suggest something interesting this weekend",
  "Find coworkers with similar interests",
  "Help me meet new people",
];

export function SuggestedPrompts({ prompts = DEFAULT_PROMPTS, onSelect }: { prompts?: string[]; onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-4">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-ai-accent-border/60 bg-ai-accent-soft px-3 py-1.5 text-xs text-ai-accent transition-colors hover:bg-ai-accent-soft/70"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
