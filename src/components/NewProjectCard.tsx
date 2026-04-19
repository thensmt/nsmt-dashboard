"use client";

export function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button className="card new-project" type="button" onClick={onClick}>
      <div className="plus">+</div>
      <div className="np-label">New project</div>
      <div className="np-sub">
        Manually add something that isn&rsquo;t a GitHub repo — event, pitch, partnership.
      </div>
    </button>
  );
}
