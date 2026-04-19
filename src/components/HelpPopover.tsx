"use client";

import { useEffect, useRef, useState } from "react";
import { downloadDrafts, readOverrides } from "@/lib/overrides";

const QUIET_KEY = "nsmt-quiet-motion";

export function HelpPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [quiet, setQuiet] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuiet(localStorage.getItem(QUIET_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      const target = e.target as Node;
      if (ref.current.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-help-toggle]")) return;
      onClose();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, onClose]);

  function toggleQuiet() {
    const next = !quiet;
    setQuiet(next);
    if (next) {
      localStorage.setItem(QUIET_KEY, "1");
      document.documentElement.classList.add("quiet-motion");
    } else {
      localStorage.removeItem(QUIET_KEY);
      document.documentElement.classList.remove("quiet-motion");
    }
  }

  function handleExport() {
    downloadDrafts(readOverrides());
  }

  return (
    <div ref={ref} className={`help-popover ${open ? "open" : ""}`}>
      <div className="help-head">
        <span className="help-head-label">Dashboard legend</span>
        <button type="button" className="help-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="help-row">
        <h4>Status</h4>
        <p>
          <b style={{ color: "var(--blue)" }}>Active</b> — working on now.{" "}
          <b style={{ color: "var(--ink-90)" }}>In Progress</b> — moving, not today.{" "}
          <span style={{ color: "var(--ink-40)" }}>Paused</span> — parked.{" "}
          <b style={{ color: "var(--ink-90)" }}>Shipped</b> — in production.
        </p>
      </div>
      <div className="help-row">
        <h4>Drift signal</h4>
        <p>
          Active/In Progress repo with no commit in 60 days gets a{" "}
          <span className="drift-sample">subtle amber underline</span>. A nudge,
          not an alarm.
        </p>
      </div>
      <div className="help-row">
        <h4>Missing data shows</h4>
        <p>
          Unsynced commit, no live URL — shown as{" "}
          <span style={{ fontFamily: "var(--mono)", color: "var(--ink-40)" }}>—</span>.
          Missing data is information.
        </p>
      </div>
      <div className="help-row">
        <h4>Filters fade</h4>
        <p>
          Click a filter and off-theme cards dim instead of disappearing.
          Peripheral awareness stays intact.
        </p>
      </div>
      <div className="toggle-row">
        <span>Quiet motion</span>
        <button
          type="button"
          className={quiet ? "on" : ""}
          onClick={toggleQuiet}
        >
          {quiet ? "On" : "Off"}
        </button>
      </div>
      <button type="button" className="export-btn" onClick={handleExport}>
        Export configured projects
      </button>
    </div>
  );
}
