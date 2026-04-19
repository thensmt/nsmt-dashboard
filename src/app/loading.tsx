export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink-40)",
          fontWeight: 700,
        }}
      >
        Loading · NSMT
      </div>
      <div
        style={{
          width: 120,
          height: 2,
          background: "var(--ink-10)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: 40,
            background: "var(--blue)",
            animation: "m-scanline 1200ms cubic-bezier(.3,.1,.3,1) infinite",
          }}
        />
      </div>
    </div>
  );
}
