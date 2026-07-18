import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface BuddyDockContextValue {
  isOpen: boolean;
  pendingPrompt: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  openWithPrompt: (prompt: string) => void;
  consumePendingPrompt: () => string | null;
}

const BuddyDockContext = createContext<BuddyDockContextValue | null>(null);

export function BuddyDockProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const value = useMemo<BuddyDockContextValue>(
    () => ({
      isOpen,
      pendingPrompt,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      openWithPrompt: (prompt: string) => {
        setPendingPrompt(prompt);
        setIsOpen(true);
      },
      consumePendingPrompt: () => {
        const prompt = pendingPrompt;
        setPendingPrompt(null);
        return prompt;
      },
    }),
    [isOpen, pendingPrompt]
  );

  return <BuddyDockContext.Provider value={value}>{children}</BuddyDockContext.Provider>;
}

export function useBuddyDock(): BuddyDockContextValue {
  const ctx = useContext(BuddyDockContext);
  if (!ctx) throw new Error("useBuddyDock must be used within a BuddyDockProvider");
  return ctx;
}
