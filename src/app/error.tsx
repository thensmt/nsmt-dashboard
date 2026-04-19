"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 720,
        margin: "60px auto",
        fontFamily: "var(--mono)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--amber)",
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        · dashboard error ·
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          margin: "0 0 12px 0",
          color: "var(--ink-90)",
        }}
      >
        Something went sideways.
      </h1>
      <p style={{ color: "var(--ink-60)", lineHeight: 1.5, fontSize: 13 }}>
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 24,
          padding: "10px 18px",
          background: "var(--blue)",
          color: "#fff",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: 12,
          borderRadius: 2,
        }}
      >
        Reload
      </button>
    </div>
  );
}
