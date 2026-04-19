"use client";

import { useEffect, useState } from "react";

export type Variation = "a" | "b";

export function VariationToggle() {
  const [v, setV] = useState<Variation>("a");

  useEffect(() => {
    const stored = localStorage.getItem("nsmt-variation");
    setV(stored === "b" ? "b" : "a");
  }, []);

  function set(next: Variation) {
    setV(next);
    localStorage.setItem("nsmt-variation", next);
    document.documentElement.classList.remove("variation-a", "variation-b");
    document.documentElement.classList.add(`variation-${next}`);
  }

  return (
    <div className="variation-toggle" role="group" aria-label="Focus band variation">
      <span className="label">Focus band</span>
      <button
        type="button"
        className={v === "a" ? "active" : ""}
        onClick={() => set("a")}
      >
        Broadcast bar
      </button>
      <button
        type="button"
        className={v === "b" ? "active" : ""}
        onClick={() => set("b")}
      >
        Editorial hero
      </button>
    </div>
  );
}
