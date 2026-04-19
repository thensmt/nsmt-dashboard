"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "nsmt-priority-because";
const EVENT = "nsmt:priority-because";

/**
 * Shared priority-because field. Single localStorage key, but two instances
 * may render (one inside each variation). They broadcast edits to each other
 * via a window custom event so editing in A reflects in B immediately.
 * PLAN.md C5 + D7.
 */
export function PriorityBecause() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = localStorage.getItem(KEY) ?? "";
    if (ref.current && ref.current.textContent !== initial) {
      ref.current.textContent = initial;
    }
    function onSync(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (!ref.current) return;
      if (ref.current === document.activeElement) return;
      if (ref.current.textContent !== detail) ref.current.textContent = detail;
    }
    window.addEventListener(EVENT, onSync);
    return () => window.removeEventListener(EVENT, onSync);
  }, []);

  function persist() {
    if (!ref.current) return;
    const v = ref.current.textContent ?? "";
    localStorage.setItem(KEY, v);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
  }

  return (
    <div className="priority-because">
      <span className="pb-label">Priority because</span>
      <div
        ref={ref}
        contentEditable={mounted}
        suppressContentEditableWarning
        data-placeholder="Click to add your reasoning…"
        onInput={persist}
        onBlur={persist}
      />
    </div>
  );
}
