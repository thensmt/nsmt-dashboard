"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  MoonIcon,
  PresentIcon,
  RefreshIcon,
  SearchIcon,
  SunIcon,
} from "./icons";
import { currentIsoWeekLabel } from "@/lib/isoWeek";

interface Props {
  isoWeekLabel: string;
  search: string;
  onSearch: (q: string) => void;
  onRefresh: () => void;
  onToggleHelp: () => void;
  refreshing: boolean;
  present: boolean;
  onTogglePresent: () => void;
  userInitial: string;
  userName: string | null;
  onSignOut: () => Promise<void>;
}

export function Topbar({
  isoWeekLabel,
  search,
  onSearch,
  onRefresh,
  onToggleHelp,
  refreshing,
  present,
  onTogglePresent,
  userInitial,
  userName,
  onSignOut,
}: Props) {
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [liveLabel, setLiveLabel] = useState(isoWeekLabel);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    // In case the server render was produced on a different day than hydration,
    // recompute once on mount so the UI stays accurate without a flash.
    setLiveLabel(currentIsoWeekLabel());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("nsmt-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nsmt-theme", next ? "dark" : "light");
  }

  const [weekParts] = (() => {
    const parts = liveLabel.split(" · ");
    return [parts];
  })();

  return (
    <div className={`topbar ${searchOpen ? "search-open" : ""}`}>
      <div className="wordmark">
        <Image
          src="/assets/wordmark-white.png"
          alt="NSMT"
          width={8000}
          height={2328}
          sizes="80px"
          style={{ height: 22, width: "auto", display: "block" }}
          priority
        />
      </div>
      <span className="divider" />
      <span
        className="meta"
        style={{
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        Projects
      </span>
      <span className="divider" />
      <span className="meta">
        {weekParts[0]} · <strong>{weekParts[1]}</strong>
      </span>

      <div className="right">
        <div className="search">
          <SearchIcon />
          <input
            id="nsmt-search"
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search projects, commits, stack…"
          />
          <kbd>⌘K</kbd>
        </div>
        <button
          id="search-icon-mobile"
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Search"
          title="Search"
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          className={`topbar-btn ${refreshing ? "is-active" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh from GitHub"
          aria-label="Refresh"
        >
          <RefreshIcon />
          <span className="label-text">{refreshing ? "Syncing" : "Refresh"}</span>
        </button>
        <button
          id="present-toggle-btn"
          type="button"
          className={`topbar-btn ${present ? "is-active" : ""}`}
          onClick={onTogglePresent}
          aria-pressed={present}
          title="Presentation mode"
          aria-label="Presentation mode"
        >
          <PresentIcon />
          <span className="label-text">Present</span>
        </button>
        <button
          type="button"
          className="topbar-btn icon-only"
          onClick={onToggleHelp}
          data-help-toggle
          aria-label="Legend"
          title="Legend"
        >
          ?
        </button>
        <button
          type="button"
          className="topbar-btn icon-only"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <div className="avatar-wrap">
          <button
            type="button"
            className="avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={userName ?? "Account"}
          >
            {userInitial}
          </button>
          {menuOpen && (
            <div className="avatar-menu" role="menu">
              {userName ? <div className="avatar-menu-name">{userName}</div> : null}
              <form action={onSignOut}>
                <button type="submit" className="avatar-menu-item" role="menuitem">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
