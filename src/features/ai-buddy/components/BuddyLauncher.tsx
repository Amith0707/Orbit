import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useBuddyDock } from "../context/BuddyDockContext";
import { BuddyPanel } from "./BuddyPanel";

export function BuddyLauncher() {
  const { isOpen, toggle } = useBuddyDock();
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Close AI Buddy" : "Open AI Buddy"}
        className="orbit-glow-icon fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full text-primary"
        animate={reduceMotion ? {} : { scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.92 }}
      >
        <HugeiconsIcon icon={isOpen ? Cancel01Icon : SparklesIcon} strokeWidth={2} className="size-6" />
      </motion.button>
      <AnimatePresence>{isOpen && <BuddyPanel />}</AnimatePresence>
    </>
  );
}
